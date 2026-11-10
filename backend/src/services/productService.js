import fs from "fs";
import { prisma, Prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { deleteFromCloudinary } from "../config/cloudinaryConfig.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";
import { formatMatricula } from "../utils/matriculaHelper.js";

// arquivo responsável pelas regras de negócio, isolamento Organização/Loja, Soft Delete e ajuste transacional de produtos

// função auxiliar para validar se uma categoria pertence exatamente à mesma loja do produto
async function resolveStoreCategoryId(categoriaId, lojaId) {
  if (categoriaId === undefined || categoriaId === null || categoriaId === "" || categoriaId === "null") {
    return null;
  }
  const parsedId = Number(categoriaId);
  if (isNaN(parsedId)) throw new AppError("ID de categoria inválido", 400);

  const cat = await prisma.categoria.findFirst({
    where: { id: parsedId, lojaId: Number(lojaId) },
  });
  if (!cat) {
    throw new AppError("Categoria selecionada não pertence a esta loja", 400);
  }
  return parsedId;
}

// função auxiliar para validar se um fornecedor pertence exatamente à mesma loja do produto
async function resolveStoreSupplierId(fornecedorId, lojaId) {
  if (fornecedorId === undefined || fornecedorId === null || fornecedorId === "" || fornecedorId === "null") {
    return null;
  }
  const parsedId = Number(fornecedorId);
  if (isNaN(parsedId)) throw new AppError("ID de fornecedor inválido", 400);

  const sup = await prisma.fornecedor.findFirst({
    where: { id: parsedId, lojaId: Number(lojaId) },
  });
  if (!sup) {
    throw new AppError("Fornecedor selecionado não pertence a esta loja", 400);
  }
  return parsedId;
}

// função para listar produtos paginados da Organização ou Loja com filtros de nome, categoria, preço e Soft Delete
export async function listProductsPaginated(filters = {}, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const {
    page = 1,
    limit = 10,
    search,
    sortPrice,
    categoriaId,
    status = "ativos",
  } = filters;

  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  const where = {
    AND: [
      { organizacaoId: Number(scope.organizacaoId) },
      scope.lojaId ? { lojaId: Number(scope.lojaId) } : {},
      statusFilter,
      search && search !== "undefined" && search !== "null"
        ? { nome: { contains: search, mode: "insensitive" } }
        : {},
      categoriaId && categoriaId !== "undefined" && categoriaId !== "null" && !isNaN(Number(categoriaId))
        ? { categoriaId: Number(categoriaId) }
        : {},
    ],
  };

  const limitSafe = limit === "all" ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === "all" ? undefined : (pageSafe - 1) * limitSafe;

  const orderBy =
    sortPrice && ["asc", "desc"].includes(sortPrice)
      ? [{ preco: sortPrice }]
      : [{ ativo: "desc" }, { id: "desc" }];

  const [products, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip,
      take: limitSafe,
      orderBy,
      include: {
        categoria: true,
        fornecedor: true,
        loja: { select: { id: true, nome: true, slug: true } },
      },
    }),
    prisma.produto.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page: pageSafe,
      limit: limitSafe,
      total,
      pages: limit === "all" ? 1 : Math.max(1, Math.ceil(total / limitSafe)),
    },
  };
}

// função para buscar detalhes de um produto garantindo pertencimento ao escopo
export async function getProductById(id, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);
  return product;
}

// função para criar um novo produto na loja alvo
export async function createProduct(data, imagePath = null, storeScope) {
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }

  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = data;
  if (!nome || String(nome).trim() === "") throw new AppError("Nome é obrigatório", 400);

  const organizacaoId = Number(storeScope.organizacaoId);
  const lojaId = Number(storeScope.lojaId);

  const validCategoriaId = await resolveStoreCategoryId(categoriaId, lojaId);
  const validFornecedorId = await resolveStoreSupplierId(fornecedorId, lojaId);

  return prisma.produto.create({
    data: {
      nome: String(nome).trim(),
      descricao: descricao !== undefined ? String(descricao) : null,
      preco: preco !== undefined && preco !== "" ? parseFloat(preco) : 0,
      quantidade: quantidade !== undefined && quantidade !== "" ? Number(quantidade) : 0,
      imagem: imagePath,
      ativo: true,
      organizacaoId,
      lojaId,
      categoriaId: validCategoriaId,
      fornecedorId: validFornecedorId,
    },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função para atualizar produto respeitando pertencimento à Organização e Loja
export async function updateProduct(
  id,
  data,
  newImagePath = null,
  removeImage = false,
  scope
) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  let imagePath = product.imagem;
  if (removeImage) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try {
          fs.unlinkSync(`.${imagePath}`);
        } catch {
          /* ignore */
        }
      }
    }
    imagePath = null;
  } else if (newImagePath) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try {
          fs.unlinkSync(`.${imagePath}`);
        } catch {
          /* ignore */
        }
      }
    }
    imagePath = newImagePath;
  }

  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId, ativo } = data;
  const updateData = { imagem: imagePath };

  if (nome !== undefined) updateData.nome = String(nome).trim();
  if (descricao !== undefined) updateData.descricao = descricao;
  if (preco !== undefined && preco !== "") updateData.preco = parseFloat(preco);
  if (quantidade !== undefined && quantidade !== "") updateData.quantidade = Number(quantidade);
  if (ativo !== undefined) updateData.ativo = parseBooleanFlag(ativo);

  if (categoriaId !== undefined) {
    updateData.categoriaId = await resolveStoreCategoryId(categoriaId, product.lojaId);
  }
  if (fornecedorId !== undefined) {
    updateData.fornecedorId = await resolveStoreSupplierId(fornecedorId, product.lojaId);
  }

  return prisma.produto.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função para inativar ou reativar logicamente um produto (Soft Delete)
export async function toggleProductStatus(id, ativo, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  return prisma.produto.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função exclusiva de ADMIN para excluir produto (ou aplicar Soft Delete automático se houver movimentações/pedidos)
export async function deleteProduct(id, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const product = await prisma.produto.findFirst({
    where: { id: Number(id), organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { movimentos: true, itensPedido: true } } },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  const totalRefs = product._count.movimentos + product._count.itensPedido;
  if (totalRefs > 0) {
    const inactivated = await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false },
      include: {
        categoria: true,
        fornecedor: true,
        loja: { select: { id: true, nome: true, slug: true } },
      },
    });
    return {
      ok: true,
      softDeleted: true,
      message: `Produto "${product.nome}" possui histórico de movimentações/pedidos e foi inativado logicamente.`,
      produto: inactivated,
    };
  }

  if (product.imagem) {
    if (product.imagem.startsWith("http://") || product.imagem.startsWith("https://")) {
      await deleteFromCloudinary(product.imagem);
    } else if (fs.existsSync(`.${product.imagem}`)) {
      try {
        fs.unlinkSync(`.${product.imagem}`);
      } catch {
        /* ignore */
      }
    }
  }

  await prisma.produto.delete({ where: { id: Number(id) } });
  return {
    ok: true,
    softDeleted: false,
    message: `Produto "${product.nome}" excluído permanentemente com sucesso.`,
  };
}

// Armazenamento em memória para idempotência e debounce anti-duplo clique
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 10;
const idempotencyStore = new Map();
const recentOperations = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.timestamp > IDEMPOTENCY_TTL_MS) idempotencyStore.delete(key);
  }
  for (const [key, timestamp] of recentOperations.entries()) {
    if (now - timestamp > 5000) recentOperations.delete(key);
  }
}, 1000 * 60 * 5).unref();

// função transacional para ajuste rápido de estoque de um produto unitário (livro-razão)
// 1 - Valida quantidade, tipo (REPOSICAO/VENDA) e escopo de Organização/Loja
// 2 - Aplica lock pessimista FOR UPDATE garantindo produto e loja ativos
// 3 - Grava movimento com snapshots de preço unitário e vendedor (vendedorRefId, nome e email)
export async function adjustProductQuantity(
  id,
  quantidade,
  tipo,
  requestingUser,
  observacao = null,
  idempotencyKey = null
) {
  if (!requestingUser?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const qtdNum = Number(quantidade);
  if (!quantidade || isNaN(qtdNum) || qtdNum <= 0 || !tipo) {
    throw new AppError("Quantidade válida e tipo são obrigatórios", 400);
  }

  let normalizedTipo = String(tipo).toUpperCase();
  if (normalizedTipo === "ENTRADA") normalizedTipo = "REPOSICAO";
  if (normalizedTipo === "SAIDA") normalizedTipo = "VENDA";

  if (!["REPOSICAO", "VENDA"].includes(normalizedTipo)) {
    throw new AppError("Tipo deve ser REPOSICAO ou VENDA", 400);
  }

  const productId = Number(id);
  const orgId = Number(requestingUser.organizacaoId);
  if (isNaN(productId)) throw new AppError("ID de produto inválido", 400);

  const scopedIdempotencyKey = idempotencyKey ? `${orgId}:${idempotencyKey}` : null;
  if (scopedIdempotencyKey) {
    const cached = idempotencyStore.get(scopedIdempotencyKey);
    if (cached) {
      if (cached.status === "PROCESSING") {
        throw new AppError("Esta operação já está em processamento. Por favor, aguarde.", 409);
      }
      return cached.result;
    }
    idempotencyStore.set(scopedIdempotencyKey, { status: "PROCESSING", timestamp: Date.now() });
  }

  const debounceKey = `org_${orgId}_user_${requestingUser.id}_prod_${productId}_${normalizedTipo}_${qtdNum}`;
  const now = Date.now();
  const lastOp = recentOperations.get(debounceKey);
  if (!scopedIdempotencyKey && lastOp && now - lastOp < 1200) {
    throw new AppError(
      "Operação duplicada detectada (clique duplo). Por favor, aguarde a conclusão.",
      429
    );
  }
  recentOperations.set(debounceKey, now);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const storeClause =
        requestingUser.role !== "ADMIN" && requestingUser.lojaId
          ? Prisma.sql`AND p."lojaId" = ${Number(requestingUser.lojaId)}`
          : Prisma.empty;

      const [product] = await tx.$queryRaw`
        SELECT p.id, p.nome, p.quantidade, p.preco, p.ativo, p."organizacaoId", p."lojaId", l.ativo AS "lojaAtiva"
        FROM "Produto" p
        JOIN "Loja" l ON l.id = p."lojaId"
        WHERE p.id = ${productId} AND p."organizacaoId" = ${orgId} ${storeClause}
        FOR UPDATE OF p
      `;

      if (!product) throw new AppError("Produto não encontrado neste estabelecimento", 404);
      if (!product.lojaAtiva) {
        throw new AppError("A loja deste produto está desativada para movimentações.", 400);
      }
      if (!product.ativo) {
        throw new AppError(
          "Este produto está inativo. Reative-o antes de registrar movimentações.",
          400
        );
      }

      if (normalizedTipo === "VENDA" && product.quantidade < qtdNum) {
        throw new AppError(
          `Quantidade insuficiente no estoque. Saldo disponível: ${product.quantidade}, Solicitado: ${qtdNum}`,
          400
        );
      }

      const delta = normalizedTipo === "REPOSICAO" ? qtdNum : -qtdNum;
      const newQuantity = product.quantidade + delta;
      if (newQuantity < 0) throw new AppError("Quantidade não pode ser negativa", 400);

      const unitPrice = Number(product.preco || 0);
      const totalVal = Number((unitPrice * qtdNum).toFixed(2));

      const movimento = await tx.movimento.create({
        data: {
          produtoId: productId,
          quantidade: qtdNum,
          tipo: normalizedTipo,
          precoUnitario: unitPrice,
          valorTotal: totalVal,
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
          lojaId: Number(product.lojaId),
          observacao,
        },
        include: {
          produto: true,
          loja: { select: { id: true, nome: true, slug: true } },
          usuario: { select: { id: true, nome: true, email: true, role: true } },
        },
      });

      const updatedProduct = await tx.produto.update({
        where: { id: productId },
        data: { quantidade: newQuantity },
      });

      return { ok: true, novaQuantidade: updatedProduct.quantidade, movimento };
    });

    if (scopedIdempotencyKey) {
      idempotencyStore.set(scopedIdempotencyKey, { status: "DONE", result, timestamp: Date.now() });
    }
    return result;
  } catch (err) {
    if (scopedIdempotencyKey) {
      idempotencyStore.delete(scopedIdempotencyKey);
    }
    throw err;
  }
}

// função para levantar KPIs agregados de produtos e patrimônio no escopo (rede inteira ou loja específica)
export async function getProductStats(scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const orgId = Number(scope.organizacaoId);
  const lojaId = scope.lojaId ? Number(scope.lojaId) : null;

  const baseWhere = {
    organizacaoId: orgId,
    ...(lojaId ? { lojaId } : {}),
    ativo: true,
  };

  const [total, lowStockCount, lowStockList] = await Promise.all([
    prisma.produto.count({ where: baseWhere }),
    prisma.produto.count({ where: { ...baseWhere, quantidade: { lt: 10 } } }),
    prisma.produto.findMany({
      where: { ...baseWhere, quantidade: { lt: 10 } },
      select: {
        id: true,
        nome: true,
        preco: true,
        quantidade: true,
        loja: { select: { id: true, nome: true } },
        categoria: { select: { id: true, nome: true } },
      },
      orderBy: [{ quantidade: "asc" }, { nome: "asc" }],
      take: 50,
    }),
  ]);

  const lojaSql = lojaId ? Prisma.sql`AND "lojaId" = ${lojaId}` : Prisma.empty;
  const valueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(preco * quantidade), 0) AS "totalValue"
    FROM "Produto"
    WHERE "organizacaoId" = ${orgId} AND "ativo" = true ${lojaSql}
  `;

  return {
    total,
    lowStock: lowStockCount,
    totalValue: Number(valueResult[0]?.totalValue || 0),
    lowStockList,
  };
}

// função para contar produtos ativos no escopo selecionado
export async function countProducts(scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  return prisma.produto.count({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ativo: true,
    },
  });
}
