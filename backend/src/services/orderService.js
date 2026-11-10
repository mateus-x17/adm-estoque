import { prisma, Prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";

// arquivo responsável pelas regras de negócio, lock pessimista multi-item e estorno atômico de Multipedidos

const ORDER_IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const orderIdempotencyStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of orderIdempotencyStore.entries()) {
    if (now - entry.timestamp > ORDER_IDEMPOTENCY_TTL_MS) {
      orderIdempotencyStore.delete(k);
    }
  }
}, 5 * 60 * 1000).unref();

// função auxiliar para construir Date local sem distorção de fuso horário UTC
// 1 - Extrai ano, mês e dia da string YYYY-MM-DD e posiciona no início (00:00:00) ou fim do dia (23:59:59.999)
function dateFromYMD(ymd, endOfDay = false) {
  const [year, month, day] = String(ymd).split("-").map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// função auxiliar para gerar código amigável de pedido único por Organização
// 1 - Concatena sufixo de timestamp com dígito aleatório de 3 casas no formato PED-XXXXXX-NNN
function buildOrderCode() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `PED-${ts}-${rand}`;
}

// função para criar um pedido multi-item (VENDA ou REPOSICAO) em transação atômica com lock ordenado
// 1 - Normaliza tipo e agrupa itens duplicados do mesmo produto somando quantidades
// 2 - Aplica suporte a Idempotency-Key evitando pedidos duplicados por instabilidade de rede
// 3 - Executa FOR UPDATE ordenado por ID de produto para prevenir deadlocks sob alta concorrência
// 4 - Congela precoUnitario no ItemPedido e gera espelho contábil no livro-razão (Movimento)
export async function createOrder(payload, requestingUser, storeScope, idempotencyKey = null) {
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada para registrar o pedido", 400);
  }

  const orgId = Number(storeScope.organizacaoId);
  const lojaId = Number(storeScope.lojaId);

  let normalizedTipo = String(payload.tipo || "VENDA").toUpperCase();
  if (normalizedTipo === "SAIDA") normalizedTipo = "VENDA";
  if (normalizedTipo === "ENTRADA") normalizedTipo = "REPOSICAO";
  if (!["VENDA", "REPOSICAO"].includes(normalizedTipo)) {
    throw new AppError("Tipo do pedido deve ser VENDA ou REPOSICAO", 400);
  }

  if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
    throw new AppError("Adicione pelo menos um produto ao pedido", 400);
  }

  // Agrupa possíveis repetições do mesmo produto no carrinho
  const groupedMap = new Map();
  for (const rawItem of payload.itens) {
    const pId = Number(rawItem?.produtoId);
    const qty = Number(rawItem?.quantidade);
    if (isNaN(pId) || pId <= 0 || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      throw new AppError("Todos os itens devem possuir produtoId válido e quantidade inteira positiva", 400);
    }
    groupedMap.set(pId, (groupedMap.get(pId) || 0) + qty);
  }

  const normalizedItems = Array.from(groupedMap.entries())
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }))
    .sort((a, b) => a.produtoId - b.produtoId);

  let validFornecedorId = null;
  if (
    payload.fornecedorId !== undefined &&
    payload.fornecedorId !== null &&
    payload.fornecedorId !== "" &&
    payload.fornecedorId !== "null"
  ) {
    const fId = Number(payload.fornecedorId);
    if (isNaN(fId) || fId <= 0) throw new AppError("ID de fornecedor inválido", 400);
    const sup = await prisma.fornecedor.findFirst({
      where: { id: fId, lojaId, organizacaoId: orgId },
    });
    if (!sup) throw new AppError("Fornecedor selecionado não pertence a esta loja", 400);
    validFornecedorId = fId;
  }

  const scopedKey = idempotencyKey ? `${orgId}:${lojaId}:${idempotencyKey}` : null;
  if (scopedKey) {
    const cached = orderIdempotencyStore.get(scopedKey);
    if (cached) {
      if (cached.status === "PROCESSING") {
        throw new AppError("Este pedido já está sendo processado. Aguarde.", 409);
      }
      return cached.result;
    }
    orderIdempotencyStore.set(scopedKey, { status: "PROCESSING", timestamp: Date.now() });
  }

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      const productIds = normalizedItems.map((i) => i.produtoId);

      // Lock pessimista ordenado determinístico (ORDER BY id ASC) evita deadlock entre vendedores
      const lockedProducts = await tx.$queryRaw`
        SELECT id, nome, preco, quantidade, ativo, "lojaId"
        FROM "Produto"
        WHERE id = ANY(${productIds}::int[])
          AND "organizacaoId" = ${orgId}
          AND "lojaId" = ${lojaId}
        ORDER BY id ASC
        FOR UPDATE
      `;

      const productMap = new Map(lockedProducts.map((p) => [Number(p.id), p]));

      let valorTotal = 0;
      const itemsToPersist = [];
      const movementsToPersist = [];
      const stockUpdates = [];

      for (const item of normalizedItems) {
        const product = productMap.get(item.produtoId);
        if (!product) {
          throw new AppError(
            `Produto #${item.produtoId} não encontrado na loja "${storeScope.lojaNome}"`,
            404
          );
        }
        if (!product.ativo) {
          throw new AppError(
            `O produto "${product.nome}" está inativo e não pode ser movimentado em pedidos.`,
            400
          );
        }
        if (normalizedTipo === "VENDA" && product.quantidade < item.quantidade) {
          throw new AppError(
            `Estoque insuficiente para "${product.nome}". Saldo: ${product.quantidade}, solicitado: ${item.quantidade}`,
            400
          );
        }

        const unitPrice = Number(product.preco || 0);
        const subtotal = Number((unitPrice * item.quantidade).toFixed(2));
        valorTotal += subtotal;

        const newQty =
          normalizedTipo === "VENDA"
            ? product.quantidade - item.quantidade
            : product.quantidade + item.quantidade;

        stockUpdates.push({ id: item.produtoId, quantidade: newQty });
        itemsToPersist.push({
          produtoId: item.produtoId,
          produtoNomeSnapshot: product.nome,
          quantidade: item.quantidade,
          precoUnitario: unitPrice,
          subtotal,
        });
        movementsToPersist.push({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          tipo: normalizedTipo,
          precoUnitario: unitPrice,
          valorTotal: subtotal,
        });
      }

      valorTotal = Number(valorTotal.toFixed(2));
      const codigo = buildOrderCode();

      const pedido = await tx.pedido.create({
        data: {
          codigo,
          tipo: normalizedTipo,
          status: "CONCLUIDO",
          valorTotal,
          formaPagamento: payload.formaPagamento ? String(payload.formaPagamento).trim().toUpperCase() : null,
          statusPagamento: payload.statusPagamento
            ? String(payload.statusPagamento).trim().toUpperCase()
            : "PAGO",
          comprovanteCodigo: payload.comprovanteCodigo ? String(payload.comprovanteCodigo).trim() : null,
          comprovanteUrl: payload.comprovanteUrl ? String(payload.comprovanteUrl).trim() : null,
          recebidoPor: payload.recebidoPor ? String(payload.recebidoPor).trim() : null,
          observacao: payload.observacao ? String(payload.observacao).trim() : null,
          clienteNome: payload.clienteNome ? String(payload.clienteNome).trim() : null,
          fornecedorId: validFornecedorId,
          organizacaoId: orgId,
          lojaId,
          usuarioId: Number(requestingUser.id),
          vendedorRefId: Number(requestingUser.id),
          vendedorNomeSnapshot: requestingUser.nome,
          vendedorEmailSnapshot: requestingUser.email,
          itens: {
            create: itemsToPersist,
          },
        },
        include: {
          itens: { include: { produto: { select: { id: true, nome: true, imagem: true } } } },
          loja: { select: { id: true, nome: true, slug: true } },
          fornecedor: { select: { id: true, nome: true } },
        },
      });

      for (const upd of stockUpdates) {
        await tx.produto.update({
          where: { id: upd.id },
          data: { quantidade: upd.quantidade },
        });
      }

      for (const mov of movementsToPersist) {
        await tx.movimento.create({
          data: {
            produtoId: mov.produtoId,
            quantidade: mov.quantidade,
            tipo: mov.tipo,
            precoUnitario: mov.precoUnitario,
            valorTotal: mov.valorTotal,
            estorno: false,
            pedidoId: pedido.id,
            usuarioId: Number(requestingUser.id),
            vendedorRefId: Number(requestingUser.id),
            vendedorNomeSnapshot: requestingUser.nome,
            vendedorEmailSnapshot: requestingUser.email,
            organizacaoId: orgId,
            lojaId,
            observacao: `Pedido ${pedido.codigo}${pedido.observacao ? ` — ${pedido.observacao}` : ""}`,
          },
        });
      }

      return pedido;
    });

    if (scopedKey) {
      orderIdempotencyStore.set(scopedKey, {
        status: "DONE",
        result: createdOrder,
        timestamp: Date.now(),
      });
    }
    return createdOrder;
  } catch (err) {
    if (scopedKey) orderIdempotencyStore.delete(scopedKey);
    throw err;
  }
}

// função para listar pedidos multi-item paginados com suporte a filtro por ID antigo/atual do vendedor e sigilo de OPERADOR
// 1 - Normaliza tipo (VENDA/REPOSICAO) e status (CONCLUIDO/CANCELADO), travando OPERADOR em seu próprio vendedorRefId
// 2 - Aplica busca por código, cliente, nome/e-mail/ID do vendedor (snapshot) e nome dos itens congelados
// 3 - Retorna página solicitada com metadados completos de paginação
export async function listOrdersPaginated(filters = {}, scope, requestingUser) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const {
    page = 1,
    limit = 10,
    order = "desc",
    tipo,
    status,
    vendedorRefId,
    usuarioId,
    search,
    date,
    from,
    to,
  } = filters;

  let normalizedTipo;
  if (tipo && !["todos", "undefined", "null"].includes(String(tipo))) {
    const up = String(tipo).toUpperCase();
    if (up === "ENTRADA" || up === "REPOSICAO") normalizedTipo = "REPOSICAO";
    else if (up === "SAIDA" || up === "VENDA") normalizedTipo = "VENDA";
  }

  let normalizedStatus;
  if (status && !["todos", "undefined", "null"].includes(String(status))) {
    const st = String(status).toUpperCase();
    if (["CONCLUIDO", "CANCELADO"].includes(st)) normalizedStatus = st;
  }

  const isOperador = requestingUser?.role === "OPERADOR";
  const requestedSellerId = vendedorRefId ?? usuarioId;
  const effectiveSellerRefId = isOperador
    ? Number(requestingUser.id)
    : requestedSellerId &&
      !["todos", "undefined", "null", ""].includes(String(requestedSellerId)) &&
      !isNaN(Number(requestedSellerId))
      ? Number(requestedSellerId)
      : undefined;

  const trimmedSearch = String(search || "").trim();
  const isNumericSearch = trimmedSearch !== "" && !isNaN(Number(trimmedSearch));

  const where = {
    AND: [
      { organizacaoId: Number(scope.organizacaoId) },
      scope.lojaId ? { lojaId: Number(scope.lojaId) } : {},
      normalizedTipo ? { tipo: normalizedTipo } : {},
      normalizedStatus ? { status: normalizedStatus } : {},
      effectiveSellerRefId ? { vendedorRefId: effectiveSellerRefId } : {},
      date && date !== "undefined" && date !== "null"
        ? { createdAt: { gte: dateFromYMD(date, false), lte: dateFromYMD(date, true) } }
        : from || to
          ? {
            createdAt: {
              ...(from && from !== "undefined" && from !== "null" ? { gte: dateFromYMD(from, false) } : {}),
              ...(to && to !== "undefined" && to !== "null" ? { lte: dateFromYMD(to, true) } : {}),
            },
          }
          : {},
      trimmedSearch
        ? {
          OR: [
            { codigo: { contains: trimmedSearch, mode: "insensitive" } },
            { clienteNome: { contains: trimmedSearch, mode: "insensitive" } },
            { comprovanteCodigo: { contains: trimmedSearch, mode: "insensitive" } },
            { recebidoPor: { contains: trimmedSearch, mode: "insensitive" } },
            { vendedorNomeSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            { vendedorEmailSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            {
              itens: {
                some: {
                  produtoNomeSnapshot: { contains: trimmedSearch, mode: "insensitive" },
                },
              },
            },
            ...(isNumericSearch
              ? [{ id: Number(trimmedSearch) }, { vendedorRefId: Number(trimmedSearch) }]
              : []),
          ],
        }
        : {},
    ],
  };

  const limitSafe = limit === "all" ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === "all" ? undefined : (pageSafe - 1) * limitSafe;

  const [orders, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      skip,
      take: limitSafe,
      orderBy: { createdAt: order === "asc" ? "asc" : "desc" },
      include: {
        loja: { select: { id: true, nome: true, slug: true } },
        fornecedor: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, email: true, role: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true, imagem: true, ativo: true } },
          },
        },
      },
    }),
    prisma.pedido.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page: pageSafe,
      limit: limit === "all" ? "all" : limitSafe,
      total,
      pages: limit === "all" ? 1 : Math.max(1, Math.ceil(total / limitSafe)),
    },
  };
}

// função para consultar detalhes completos de um único pedido respeitando isolamento e RBAC
// 1 - Aplica filtro de Organização, Loja opcional e trava vendedorRefId quando solicitante é OPERADOR
// 2 - Carrega itens congelados e histórico de movimentos vinculados (incluindo estornos)
export async function getOrderById(id, scope, requestingUser) {
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  const isOperador = requestingUser?.role === "OPERADOR";
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: orderId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...(isOperador ? { vendedorRefId: Number(requestingUser.id) } : {}),
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      fornecedor: { select: { id: true, nome: true } },
      usuario: { select: { id: true, nome: true, email: true, role: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, imagem: true } } },
      },
      movimentos: { orderBy: { id: "asc" } },
    },
  });

  if (!pedido) throw new AppError("Pedido não encontrado", 404);
  return pedido;
}

// função para cancelar e estornar um pedido concluído (permitido para ADMIN e GERENTE da loja)
// 1 - Lock pessimista no Pedido e nos Produtos envolvidos garantindo consistência do saldo
// 2 - Se VENDA, devolve o saldo dos itens ao estoque criando movimentos de REPOSICAO marcados estorno = true
// 3 - Se REPOSICAO, deduz o saldo (validando estoque suficiente) criando movimentos de VENDA marcados estorno = true
// 4 - Atualiza o status do Pedido para CANCELADO gravando auditoria completa de quem cancelou
export async function cancelOrder(id, motivo, scope, requestingUser) {
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  const orgId = Number(requestingUser.organizacaoId);
  const restrictStoreClause =
    requestingUser.role !== "ADMIN" && requestingUser.lojaId
      ? Prisma.sql`AND "lojaId" = ${Number(requestingUser.lojaId)}`
      : Prisma.empty;

  return prisma.$transaction(async (tx) => {
    const [lockedOrder] = await tx.$queryRaw`
      SELECT id, codigo, tipo, status, "organizacaoId", "lojaId"
      FROM "Pedido"
      WHERE id = ${orderId} AND "organizacaoId" = ${orgId} ${restrictStoreClause}
      FOR UPDATE
    `;

    if (!lockedOrder) throw new AppError("Pedido não encontrado neste estabelecimento", 404);
    if (lockedOrder.status === "CANCELADO") {
      throw new AppError(`O pedido ${lockedOrder.codigo} já foi cancelado anteriormente.`, 400);
    }

    const itens = await tx.itemPedido.findMany({
      where: { pedidoId: orderId },
      orderBy: { produtoId: "asc" },
    });

    const productIds = itens.map((i) => i.produtoId);
    const lockedProducts = await tx.$queryRaw`
      SELECT id, nome, quantidade
      FROM "Produto"
      WHERE id = ANY(${productIds}::int[]) AND "lojaId" = ${Number(lockedOrder.lojaId)}
      ORDER BY id ASC
      FOR UPDATE
    `;
    const prodMap = new Map(lockedProducts.map((p) => [Number(p.id), p]));

    const reverseType = lockedOrder.tipo === "VENDA" ? "REPOSICAO" : "VENDA";

    for (const item of itens) {
      const prod = prodMap.get(item.produtoId);
      if (!prod) continue;

      const delta = lockedOrder.tipo === "VENDA" ? item.quantidade : -item.quantidade;
      const nextStock = prod.quantidade + delta;

      if (nextStock < 0) {
        throw new AppError(
          `Não é possível estornar esta reposição: o produto "${prod.nome}" já consumiu o saldo (atual: ${prod.quantidade}, estorno necessário: ${item.quantidade}).`,
          400
        );
      }

      await tx.produto.update({
        where: { id: prod.id },
        data: { quantidade: nextStock },
      });

      await tx.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: item.quantidade,
          tipo: reverseType,
          precoUnitario: item.precoUnitario,
          valorTotal: item.subtotal,
          estorno: true,
          pedidoId: lockedOrder.id,
          usuarioId: Number(requestingUser.id),
          vendedorRefId: Number(requestingUser.id),
          vendedorNomeSnapshot: requestingUser.nome,
          vendedorEmailSnapshot: requestingUser.email,
          organizacaoId: orgId,
          lojaId: Number(lockedOrder.lojaId),
          observacao: `Estorno por cancelamento do ${lockedOrder.codigo}${motivo ? ` — ${String(motivo).trim()}` : ""
            }`,
        },
      });
    }

    const updatedOrder = await tx.pedido.update({
      where: { id: orderId },
      data: {
        status: "CANCELADO",
        statusPagamento: "ESTORNADO",
        canceladoPorRefId: Number(requestingUser.id),
        canceladoPorNome: requestingUser.nome,
        canceladoEm: new Date(),
        motivoCancelamento: motivo ? String(motivo).trim() : "Cancelado pelo gestor",
      },
      include: {
        loja: { select: { id: true, nome: true, slug: true } },
        fornecedor: { select: { id: true, nome: true } },
        itens: { include: { produto: { select: { id: true, nome: true } } } },
      },
    });

    return updatedOrder;
  });
}

// função para anexar ou atualizar comprovação de pagamento/recebimento em um pedido existente
// 1 - Garante isolamento por Organização, Loja e sigilo do OPERADOR (somente seus próprios pedidos)
// 2 - Atualiza formaPagamento, statusPagamento, comprovanteCodigo, comprovanteUrl e recebidoPor
export async function updateOrderProof(id, data = {}, scope, requestingUser) {
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  const isOperador = requestingUser?.role === "OPERADOR";
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: orderId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...(isOperador ? { vendedorRefId: Number(requestingUser.id) } : {}),
    },
  });

  if (!pedido) throw new AppError("Pedido não encontrado", 404);
  if (pedido.status === "CANCELADO") {
    throw new AppError("Não é possível alterar comprovante de um pedido cancelado.", 400);
  }

  return prisma.pedido.update({
    where: { id: orderId },
    data: {
      formaPagamento:
        data.formaPagamento !== undefined
          ? String(data.formaPagamento).trim().toUpperCase() || null
          : undefined,
      statusPagamento:
        data.statusPagamento !== undefined
          ? String(data.statusPagamento).trim().toUpperCase()
          : undefined,
      comprovanteCodigo:
        data.comprovanteCodigo !== undefined
          ? String(data.comprovanteCodigo).trim() || null
          : undefined,
      comprovanteUrl:
        data.comprovanteUrl !== undefined ? String(data.comprovanteUrl).trim() || null : undefined,
      recebidoPor:
        data.recebidoPor !== undefined ? String(data.recebidoPor).trim() || null : undefined,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      fornecedor: { select: { id: true, nome: true } },
      itens: { include: { produto: { select: { id: true, nome: true, imagem: true } } } },
    },
  });
}
