// arquivo responsável por gerenciar regras de negócio, lock pessimista multi-item, criação, listagem e estorno atômico de pedidos.
// atua na camada de serviços (services) do backend.
// tecnologias principais: Prisma Client, PostgreSQL com Lock Pessimista FOR UPDATE, JavaScript ES Modules.
// usado por: orderController.js para atender rotas de pedidos multi-item, comprovantes e estornos operacionais.

// importações de infraestrutura e persistência:
// prisma provê comunicação transacional com o banco de dados relacional e Prisma fornece utilitários de templates SQL.
import { prisma, Prisma } from "../config/prismaClient.js";

// importações de utilitários de tratamento de erros, matrículas e higienização:
// AppError padroniza lançamento de erros com status HTTP; formatMatricula e parseMatriculaSearch tratam identificação e busca de colaboradores; sanitizeSafeUrl previne links maliciosos em comprovantes.
import { AppError } from "../utils/errorHandler.js";
import { formatMatricula, parseMatriculaSearch } from "../utils/matriculaHelper.js";
import { sanitizeSafeUrl } from "../utils/sanitizers.js";

// tempo de vida útil em milissegundos para chaves de idempotência de criação de pedidos (10 minutos):
// protege requisições de compra e reposição contra duplicações acidentais causadas por timeouts ou cliques repetidos.
const ORDER_IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

// mapa em memória para armazenar chaves de idempotência e seus resultados processados:
// chave: identificador composto (organizacaoId:lojaId:idempotencyKey), valor: objeto { status, result, timestamp }.
const orderIdempotencyStore = new Map();

// rotina periódica em segundo plano para expirar chaves de idempotência de pedidos obsoletas:
// executada a cada 5 minutos sem impedir o encerramento do processo Node.js (.unref()).
setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of orderIdempotencyStore.entries()) {
    if (now - entry.timestamp > ORDER_IDEMPOTENCY_TTL_MS) {
      orderIdempotencyStore.delete(k);
    }
  }
}, 5 * 60 * 1000).unref();

// função responsável por converter uma data no formato textual YYYY-MM-DD em objeto Date local sem distorção de fuso horário UTC.
//
// contexto: invocada internamente por listOrdersPaginated para delimitar intervalos temporais de criação de pedidos.
//
// parâmetros:
//   - ymd (string, obrigatório): representação de data no formato ISO YYYY-MM-DD.
//   - endOfDay (booleano, opcional, padrão false): flag indicando se deve posicionar no final do dia (23:59:59.999) ou no início (00:00:00.000).
//
// retorno: instância de Date configurada no horário local do servidor.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe ymd (string obrigatória) e endOfDay (booleano opcional com padrão false).
// 2 - divide a string pelos hifens convertendo ano, mês e dia em números.
// 3 - ajusta o mês subtraindo um para o índice de base zero do JavaScript.
// 4 - instancia o objeto Date configurando para o último milissegundo caso endOfDay seja verdadeiro ou para meia-noite caso falso.
// 5 - retorna a instância Date calculada.
function dateFromYMD(ymd, endOfDay = false) {
  // 1 - recebe ymd (string obrigatória) e endOfDay (booleano opcional com padrão false).
  // 2 - divide a string pelos hifens convertendo ano, mês e dia em números.
  const [year, month, day] = String(ymd).split("-").map(Number);

  // 3 - ajusta o mês subtraindo um para o índice de base zero do JavaScript.
  // 4 - instancia o objeto Date configurando para o último milissegundo caso endOfDay seja verdadeiro ou para meia-noite caso falso.
  // 5 - retorna a instância Date calculada.
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// função responsável por gerar um código amigável e único para identificação visual do pedido.
//
// contexto: invocada internamente por createOrder ao registrar uma nova operação comercial no sistema.
//
// parâmetros: nenhum.
//
// retorno: string no formato padronizado PED-XXXXXX-NNN (onde XXXXXX são dígitos de timestamp e NNN é número aleatório).
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe nenhum parâmetro de entrada.
// 2 - extrai os últimos seis dígitos do timestamp em milissegundos atual.
// 3 - gera um número aleatório de três dígitos entre 100 e 999.
// 4 - concatena o prefixo institucional PED com o timestamp e número aleatório gerado.
// 5 - retorna a string formatada do código do pedido.
function buildOrderCode() {
  // 1 - recebe nenhum parâmetro de entrada.
  // 2 - extrai os últimos seis dígitos do timestamp em milissegundos atual.
  const ts = Date.now().toString().slice(-6);

  // 3 - gera um número aleatório de três dígitos entre 100 e 999.
  const rand = Math.floor(100 + Math.random() * 900);

  // 4 - concatena o prefixo institucional PED com o timestamp e número aleatório gerado.
  // 5 - retorna a string formatada do código do pedido.
  return `PED-${ts}-${rand}`;
}

// função responsável por criar um pedido multi-item em transação atômica com lock pessimista ordenado.
//
// contexto: invocada por orderController.js na rota POST /api/orders para efetivar compras ou reposições de múltiplos produtos simultaneamente.
//
// parâmetros:
//   - payload (objeto, obrigatório): dados da operação contendo itens, tipo, clienteNome, fornecedorId, formaPagamento, statusPagamento, comprovanteUrl e observacao.
//   - requestingUser (objeto, obrigatório): dados da sessão do colaborador contendo id, nome, email, matricula, role, organizacaoId e lojaId.
//   - storeScope (objeto, obrigatório): escopo contendo organizacaoId, lojaId e lojaNome.
//   - idempotencyKey (string, opcional, padrão null): identificador de requisição única para prevenir duplicidades.
//
// retorno: objeto do pedido criado com itens, loja, fornecedor e usuário vinculados.
// erros: AppError (400) para argumentos inválidos ou estoque insuficiente; AppError (404) se produto não existir na loja; AppError (409) para transação simultânea com mesma chave.
// efeitos colaterais: atualiza saldos na tabela Produto, insere linhas em Pedido e ItemPedido, e grava registros no livro-razão Movimento.
//
// passo a passo:
// 1 - recebe payload, requestingUser, storeScope e idempotencyKey.
// 2 - valida a presença de organizacaoId e lojaId no storeScope lançando AppError (400) se ausentes.
// 3 - normaliza o tipo de operação para VENDA ou REPOSICAO e valida se a lista de itens não está vazia.
// 4 - agrupa itens duplicados do carrinho somando suas quantidades e ordena determinísticamente por produtoId para evitar deadlocks.
// 5 - valida o fornecedor opcional confirmando pertencimento à mesma loja do pedido.
// 6 - gerencia a chave de idempotência evitando processamento simultâneo ou repetido.
// 7 - abre transação atômica bloqueando as linhas dos produtos com lock pessimista FOR UPDATE na ordem crescente de identificador.
// 8 - valida se os produtos estão ativos, se pertencem à loja e se há saldo suficiente para operações de venda.
// 9 - calcula subtotal de cada item, valor total do pedido e os novos saldos de estoque correspondentes.
// 10 - sanitiza a url do comprovante caso fornecida prevenindo links maliciosos ou esquemas inseguros.
// 11 - gera o código único do pedido e insere o registro mestre na tabela Pedido.
// 12 - insere os itens associados na tabela ItemPedido com snapshots de preço unitário e subtotal.
// 13 - atualiza os saldos em estoque de cada produto participante da transação.
// 14 - grava as movimentações correspondentes na tabela Movimento com snapshots funcionais do vendedor.
// 15 - finaliza a transação, armazena o resultado no cache de idempotência e retorna o pedido criado.
export async function createOrder(payload, requestingUser, storeScope, idempotencyKey = null) {
  // 1 - recebe payload, requestingUser, storeScope e idempotencyKey.
  // 2 - valida a presença de organizacaoId e lojaId no storeScope lançando AppError (400) se ausentes.
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada para registrar o pedido", 400);
  }

  const orgId = Number(storeScope.organizacaoId);
  const lojaId = Number(storeScope.lojaId);

  // 3 - normaliza o tipo de operação para VENDA ou REPOSICAO e valida se a lista de itens não está vazia.
  let normalizedTipo = String(payload.tipo || "VENDA").toUpperCase();
  if (normalizedTipo === "SAIDA") normalizedTipo = "VENDA";
  if (normalizedTipo === "ENTRADA") normalizedTipo = "REPOSICAO";
  if (!["VENDA", "REPOSICAO"].includes(normalizedTipo)) {
    throw new AppError("Tipo do pedido deve ser VENDA ou REPOSICAO", 400);
  }

  if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
    throw new AppError("Adicione pelo menos um produto ao pedido", 400);
  }

  // 4 - agrupa itens duplicados do carrinho somando suas quantidades e ordena determinísticamente por produtoId para evitar deadlocks.
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

  // 5 - valida o fornecedor opcional confirmando pertencimento à mesma loja do pedido.
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

  // 6 - gerencia a chave de idempotência evitando processamento simultâneo ou repetido.
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

  // 7 - abre transação atômica bloqueando as linhas dos produtos com lock pessimista FOR UPDATE na ordem crescente de identificador.
  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      const productIds = normalizedItems.map((i) => i.produtoId);

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

      // 8 - valida se os produtos estão ativos, se pertencem à loja e se há saldo suficiente para operações de venda.
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

        // 9 - calcula subtotal de cada item, valor total do pedido e os novos saldos de estoque correspondentes.
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
          estorno: false,
          usuarioId: Number(requestingUser.id),
          vendedorRefId: Number(requestingUser.id),
          vendedorNomeSnapshot: requestingUser.nome,
          vendedorEmailSnapshot: requestingUser.email,
          vendedorMatriculaSnapshot:
            requestingUser.matricula || formatMatricula(requestingUser.id),
          vendedorDataAdmissaoSnapshot: requestingUser.dataAdmissao
            ? new Date(requestingUser.dataAdmissao)
            : null,
          organizacaoId: orgId,
          lojaId,
          observacao: payload.observacao || null,
        });
      }

      valorTotal = Number(valorTotal.toFixed(2));

      // 10 - sanitiza a url do comprovante caso fornecida prevenindo links maliciosos ou esquemas inseguros.
      let safeComprovanteUrl = null;
      if (payload.comprovanteUrl) {
        safeComprovanteUrl = sanitizeSafeUrl(payload.comprovanteUrl, true);
        if (!safeComprovanteUrl) {
          throw new AppError(
            "URL do comprovante inválida. Use apenas links seguros https:// ou envie arquivo.",
            400
          );
        }
      }

      // 11 - gera o código único do pedido e insere o registro mestre na tabela Pedido.
      const orderCode = buildOrderCode();
      const sellerMatricula = requestingUser.matricula || formatMatricula(requestingUser.id);

      const newOrder = await tx.pedido.create({
        data: {
          codigo: orderCode,
          tipo: normalizedTipo,
          status: "CONCLUIDO",
          valorTotal,
          clienteNome: payload.clienteNome ? String(payload.clienteNome).trim() : null,
          fornecedorId: validFornecedorId,
          formaPagamento: payload.formaPagamento
            ? String(payload.formaPagamento).trim().toUpperCase()
            : null,
          statusPagamento: payload.statusPagamento
            ? String(payload.statusPagamento).trim().toUpperCase()
            : "PAGO",
          comprovanteCodigo: payload.comprovanteCodigo
            ? String(payload.comprovanteCodigo).trim()
            : null,
          comprovanteUrl: safeComprovanteUrl,
          recebidoPor: payload.recebidoPor ? String(payload.recebidoPor).trim() : null,
          observacao: payload.observacao ? String(payload.observacao).trim() : null,
          usuarioId: Number(requestingUser.id),
          vendedorRefId: Number(requestingUser.id),
          vendedorNomeSnapshot: requestingUser.nome,
          vendedorEmailSnapshot: requestingUser.email,
          vendedorMatriculaSnapshot: sellerMatricula,
          vendedorDataAdmissaoSnapshot: requestingUser.dataAdmissao
            ? new Date(requestingUser.dataAdmissao)
            : null,
          organizacaoId: orgId,
          lojaId,
        },
      });

      // 12 - insere os itens associados na tabela ItemPedido com snapshots de preço unitário e subtotal.
      for (const it of itemsToPersist) {
        await tx.itemPedido.create({
          data: {
            pedidoId: newOrder.id,
            produtoId: it.produtoId,
            produtoNomeSnapshot: it.produtoNomeSnapshot,
            quantidade: it.quantidade,
            precoUnitario: it.precoUnitario,
            subtotal: it.subtotal,
          },
        });
      }

      // 13 - atualiza os saldos em estoque de cada produto participante da transação.
      for (const su of stockUpdates) {
        await tx.produto.update({
          where: { id: su.id },
          data: { quantidade: su.quantidade },
        });
      }

      // 14 - grava as movimentações correspondentes na tabela Movimento com snapshots funcionais do vendedor.
      for (const mv of movementsToPersist) {
        await tx.movimento.create({
          data: {
            ...mv,
            pedidoId: newOrder.id,
          },
        });
      }

      // 15 - finaliza a transação, armazena o resultado no cache de idempotência e retorna o pedido criado.
      return tx.pedido.findUnique({
        where: { id: newOrder.id },
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
      });
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

// função responsável por listar pedidos multi-item paginados com filtros avançados e sigilo por perfil funcional.
//
// contexto: invocada por orderController.js na rota GET /api/orders para alimentar a tabela de pedidos no painel operacional.
//
// parâmetros:
//   - filters (objeto, opcional): parâmetros de filtragem (page, limit, order, tipo, status, vendedorRefId, usuarioId, search, date, from, to).
//   - scope (objeto, obrigatório): escopo de autorização contendo organizacaoId e opcionalmente lojaId.
//   - requestingUser (objeto, obrigatório): dados da sessão do solicitante para aplicação de regras de sigilo (operadores veem apenas seus pedidos).
//
// retorno: objeto contendo a lista data de pedidos completos com itens e loja vinculada, além de paginação estruturada.
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: realiza consultas de leitura e contagem na tabela Pedido do banco de dados.
//
// passo a passo:
// 1 - recebe filters (objeto opcional), scope (objeto obrigatório) e requestingUser (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - normaliza tipo de pedido (VENDA ou REPOSICAO) e status (CONCLUIDO ou CANCELADO).
// 4 - aplica regra de sigilo restringindo vendedorRefId ao próprio usuário caso seu papel seja OPERADOR.
// 5 - interpreta busca por matrícula, código, cliente ou produtos congelados via parseMatriculaSearch.
// 6 - constrói a cláusula where combinando escopo de organização, loja, intervalos de datas e busca textual.
// 7 - calcula paginação segura skip e limitSafe tratando limite total 'all'.
// 8 - executa consultas paralelas findMany e count no banco de dados via Promise.all com ordenação cronológica.
// 9 - retorna objeto com a lista de pedidos carregados e metadados de paginação.
export async function listOrdersPaginated(filters = {}, scope, requestingUser) {
  // 1 - recebe filters (objeto opcional), scope (objeto obrigatório) e requestingUser (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - normaliza tipo de pedido (VENDA ou REPOSICAO) e status (CONCLUIDO ou CANCELADO).
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

  // 4 - aplica regra de sigilo restringindo vendedorRefId ao próprio usuário caso seu papel seja OPERADOR.
  const isOperador = requestingUser?.role === "OPERADOR";
  const requestedSellerId = vendedorRefId ?? usuarioId;
  const effectiveSellerRefId = isOperador
    ? Number(requestingUser.id)
    : requestedSellerId &&
      !["todos", "undefined", "null", ""].includes(String(requestedSellerId)) &&
      !isNaN(Number(requestedSellerId))
      ? Number(requestedSellerId)
      : undefined;

  // 5 - interpreta busca por matrícula, código, cliente ou produtos congelados via parseMatriculaSearch.
  const parsedMat = parseMatriculaSearch(search);
  const trimmedSearch = parsedMat.raw;
  const isNumericSearch = parsedMat.numericId !== null;

  // 6 - constrói a cláusula where combinando escopo de organização, loja, intervalos de datas e busca textual.
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
            { vendedorMatriculaSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            {
              itens: {
                some: {
                  produtoNomeSnapshot: { contains: trimmedSearch, mode: "insensitive" },
                },
              },
            },
            ...(isNumericSearch
              ? [{ id: parsedMat.numericId }, { vendedorRefId: parsedMat.numericId }]
              : []),
          ],
        }
        : {},
    ],
  };

  // 7 - calcula paginação segura skip e limitSafe tratando limite total 'all'.
  const limitSafe = limit === "all" ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === "all" ? undefined : (pageSafe - 1) * limitSafe;

  // 8 - executa consultas paralelas findMany e count no banco de dados via Promise.all com ordenação cronológica.
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

  // 9 - retorna objeto com a lista de pedidos carregados e metadados de paginação.
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

// função responsável por consultar detalhes completos de um único pedido multi-item respeitando isolamento e permissões.
//
// contexto: invocada por orderController.js na rota GET /api/orders/:id para visualização detalhada de um pedido no frontend.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do pedido.
//   - scope (objeto, obrigatório): escopo de consulta contendo organizacaoId e opcionalmente lojaId.
//   - requestingUser (objeto, obrigatório): dados do usuário solicitante para aplicação de sigilo funcional.
//
// retorno: objeto detalhado do pedido incluindo itens, produtos, loja, fornecedor, usuário e histórico de movimentos.
// erros: AppError (400) se id for inválido; AppError (404) se o pedido não for encontrado no escopo permitido.
// efeitos colaterais: realiza consulta de leitura na tabela Pedido do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string), scope (objeto obrigatório) e requestingUser (objeto obrigatório).
// 2 - valida e converte o id do pedido para formato numérico lançando AppError (400) se for NaN.
// 3 - verifica se o solicitante possui papel OPERADOR aplicando restrição por vendedorRefId.
// 4 - busca o pedido no banco respeitando organizacaoId, lojaId e restrição de operador com includes completos.
// 5 - lança AppError (404) caso o pedido não seja localizado.
// 6 - retorna a entidade detalhada do pedido consultado.
export async function getOrderById(id, scope, requestingUser) {
  // 1 - recebe id (número ou string), scope (objeto obrigatório) e requestingUser (objeto obrigatório).
  // 2 - valida e converte o id do pedido para formato numérico lançando AppError (400) se for NaN.
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  // 3 - verifica se o solicitante possui papel OPERADOR aplicando restrição por vendedorRefId.
  const isOperador = requestingUser?.role === "OPERADOR";

  // 4 - busca o pedido no banco respeitando organizacaoId, lojaId e restrição de operador com includes completos.
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

  // 5 - lança AppError (404) caso o pedido não seja localizado.
  if (!pedido) throw new AppError("Pedido não encontrado", 404);

  // 6 - retorna a entidade detalhada do pedido consultado.
  return pedido;
}

// função responsável por cancelar e estornar atomicamente um pedido concluído com reversão de estoque e livro-razão.
//
// contexto: invocada por orderController.js na rota POST /api/orders/:id/cancel restrita a gestores (ADMIN e GERENTE).
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do pedido a cancelar.
//   - motivo (string, opcional): justificativa formal do cancelamento para fins de auditoria.
//   - scope (objeto, obrigatório): escopo de autorização do solicitante.
//   - requestingUser (objeto, obrigatório): usuário responsável pelo cancelamento contendo id, nome, email, role e organizacaoId.
//
// retorno: objeto do pedido atualizado com status CANCELADO, statusPagamento ESTORNADO e dados de auditoria gravados.
// erros: AppError (400) se o pedido já estiver cancelado ou se o estoque for insuficiente para estornar reposição; AppError (404) se não for localizado.
// efeitos colaterais: atualiza saldos na tabela Produto, insere movimentos com estorno=true e atualiza o registro na tabela Pedido.
//
// passo a passo:
// 1 - recebe id, motivo, scope e requestingUser.
// 2 - valida e converte o id do pedido para número lançando AppError (400) se for NaN.
// 3 - abre transação atômica adquirindo lock pessimista FOR UPDATE na linha do pedido.
// 4 - lança AppError (404) se o pedido não existir e valida se já não se encontra cancelado.
// 5 - carrega todos os itens associados ao pedido e adquire lock pessimista FOR UPDATE nos produtos participantes.
// 6 - define o tipo de movimento reverso (VENDA estorna com REPOSICAO; REPOSICAO estorna com VENDA).
// 7 - calcula os novos saldos de estoque verificando se há estoque disponível para devolução de reposições.
// 8 - atualiza o saldo de cada produto no estoque.
// 9 - cria os registros de movimentação de estorno no livro-razão marcados com estorno=true.
// 10 - atualiza o pedido marcando status CANCELADO, auditoria de cancelamento e data.
// 11 - retorna o pedido atualizado com status cancelado e comprovantes de estorno.
export async function cancelOrder(id, motivo, scope, requestingUser) {
  // 1 - recebe id, motivo, scope e requestingUser.
  // 2 - valida e converte o id do pedido para número lançando AppError (400) se for NaN.
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  const orgId = Number(requestingUser.organizacaoId);
  const restrictStoreClause =
    requestingUser.role !== "ADMIN" && requestingUser.lojaId
      ? Prisma.sql`AND "lojaId" = ${Number(requestingUser.lojaId)}`
      : Prisma.empty;

  // 3 - abre transação atômica adquirindo lock pessimista FOR UPDATE na linha do pedido.
  return prisma.$transaction(async (tx) => {
    const [lockedOrder] = await tx.$queryRaw`
      SELECT id, codigo, tipo, status, "organizacaoId", "lojaId"
      FROM "Pedido"
      WHERE id = ${orderId} AND "organizacaoId" = ${orgId} ${restrictStoreClause}
      FOR UPDATE
    `;

    // 4 - lança AppError (404) se o pedido não existir e valida se já não se encontra cancelado.
    if (!lockedOrder) throw new AppError("Pedido não encontrado neste estabelecimento", 404);
    if (lockedOrder.status === "CANCELADO") {
      throw new AppError(`O pedido ${lockedOrder.codigo} já foi cancelado anteriormente.`, 400);
    }

    // 5 - carrega todos os itens associados ao pedido e adquire lock pessimista FOR UPDATE nos produtos participantes.
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

    // 6 - define o tipo de movimento reverso (VENDA estorna com REPOSICAO; REPOSICAO estorna com VENDA).
    const reverseType = lockedOrder.tipo === "VENDA" ? "REPOSICAO" : "VENDA";

    // 7 - calcula os novos saldos de estoque verificando se há estoque disponível para devolução de reposições.
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

      // 8 - atualiza o saldo de cada produto no estoque.
      await tx.produto.update({
        where: { id: prod.id },
        data: { quantidade: nextStock },
      });

      // 9 - cria os registros de movimentação de estorno no livro-razão marcados com estorno=true.
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

    // 10 - atualiza o pedido marcando status CANCELADO, auditoria de cancelamento e data.
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

    // 11 - retorna o pedido atualizado com status cancelado e comprovantes de estorno.
    return updatedOrder;
  });
}

// função responsável por anexar ou atualizar comprovação de pagamento e recebimento em um pedido existente.
//
// contexto: invocada por orderController.js na rota PATCH /api/orders/:id/proof para registrar pagamentos ou anexos comprobatórios.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do pedido.
//   - data (objeto, opcional): campos de comprovante (formaPagamento, statusPagamento, comprovanteCodigo, comprovanteUrl, recebidoPor).
//   - scope (objeto, obrigatório): escopo organizacional contendo organizacaoId e opcionalmente lojaId.
//   - requestingUser (objeto, obrigatório): usuário da sessão para validação de sigilo operacional.
//
// retorno: objeto do pedido atualizado com os novos dados de pagamento e comprovante associados.
// erros: AppError (400) se id for inválido, pedido estiver cancelado ou comprovanteUrl for inseguro; AppError (404) se o pedido não existir.
// efeitos colaterais: atualiza campos da tabela Pedido no banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string), data (objeto), scope (objeto) e requestingUser (objeto).
// 2 - valida e converte o id para número lançando AppError (400) se for NaN.
// 3 - localiza o pedido no banco garantindo que pertence à organização, loja e sigilo de operador.
// 4 - lança AppError (404) se não encontrado e AppError (400) se o pedido já estiver cancelado.
// 5 - sanitiza e valida a URL do comprovante com sanitizeSafeUrl rejeitando protocolos inseguros.
// 6 - executa a atualização dos dados de pagamento e recebimento via Prisma update.
// 7 - retorna o registro do pedido atualizado.
export async function updateOrderProof(id, data = {}, scope, requestingUser) {
  // 1 - recebe id (número ou string), data (objeto), scope (objeto) e requestingUser (objeto).
  // 2 - valida e converte o id para número lançando AppError (400) se for NaN.
  const orderId = Number(id);
  if (isNaN(orderId)) throw new AppError("ID de pedido inválido", 400);

  // 3 - localiza o pedido no banco garantindo que pertence à organização, loja e sigilo de operador.
  const isOperador = requestingUser?.role === "OPERADOR";
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: orderId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...(isOperador ? { vendedorRefId: Number(requestingUser.id) } : {}),
    },
  });

  // 4 - lança AppError (404) se não encontrado e AppError (400) se o pedido já estiver cancelado.
  if (!pedido) throw new AppError("Pedido não encontrado", 404);
  if (pedido.status === "CANCELADO") {
    throw new AppError("Não é possível alterar comprovante de um pedido cancelado.", 400);
  }

  // 5 - sanitiza e valida a URL do comprovante com sanitizeSafeUrl rejeitando protocolos inseguros.
  let safeComprovanteUrl = undefined;
  if (data.comprovanteUrl !== undefined) {
    if (String(data.comprovanteUrl || "").trim() === "") {
      safeComprovanteUrl = null;
    } else {
      safeComprovanteUrl = sanitizeSafeUrl(data.comprovanteUrl, true);
      if (!safeComprovanteUrl) {
        throw new AppError("URL do comprovante inválida. Use apenas links https:// ou arquivos enviados.", 400);
      }
    }
  }

  // 6 - executa a atualização dos dados de pagamento e recebimento via Prisma update.
  // 7 - retorna o registro do pedido atualizado.
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
      comprovanteUrl: safeComprovanteUrl,
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
