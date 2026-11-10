import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';
import { deleteFromCloudinary } from '../config/cloudinaryConfig.js';
import { parseBooleanFlag } from '../utils/sanitizers.js';
import fs from 'fs';

// arquivo responsável pelas regras de negócio, isolamento multi-tenant, soft delete e controle transacional de produtos

// função auxiliar para validar se uma categoria opcional pertence à mesma loja
// 1 - Se categoriaId não for informado, retorna null
// 2 - Busca a categoria garantindo pertencimento ao empresaId
// 3 - Lança AppError 400 se a categoria não existir no estabelecimento
async function resolveTenantCategoryId(categoriaId, empresaId) {
  if (categoriaId === undefined || categoriaId === null || categoriaId === '' || categoriaId === 'null') {
    return null;
  }
  const parsedId = Number(categoriaId);
  if (isNaN(parsedId)) throw new AppError('ID de categoria inválido', 400);

  const cat = await prisma.categoria.findFirst({
    where: { id: parsedId, empresaId: Number(empresaId) },
  });
  if (!cat) {
    throw new AppError('Categoria selecionada não pertence a este estabelecimento', 400);
  }
  return parsedId;
}

// função auxiliar para validar se um fornecedor opcional pertence à mesma loja
// 1 - Se fornecedorId não for informado, retorna null
// 2 - Busca o fornecedor garantindo pertencimento ao empresaId
// 3 - Lança AppError 400 se o fornecedor não existir no estabelecimento
async function resolveTenantSupplierId(fornecedorId, empresaId) {
  if (fornecedorId === undefined || fornecedorId === null || fornecedorId === '' || fornecedorId === 'null') {
    return null;
  }
  const parsedId = Number(fornecedorId);
  if (isNaN(parsedId)) throw new AppError('ID de fornecedor inválido', 400);

  const sup = await prisma.fornecedor.findFirst({
    where: { id: parsedId, empresaId: Number(empresaId) },
  });
  if (!sup) {
    throw new AppError('Fornecedor selecionado não pertence a este estabelecimento', 400);
  }
  return parsedId;
}

// serviço responsável por listar os produtos da loja aplicando paginação, busca e filtros de categoria e status
// 1 - Exige empresaId válido para impedir vazamento de catálogo entre lojas
// 2 - Aplica filtro de Soft Delete pelo parâmetro status ('ativos' padrão, 'inativos', ou 'todos')
// 3 - Monta cláusula 'where.AND' para busca por nome e filtro por categoriaId
// 4 - Executa listagem e contagem total em paralelo via Promise.all
// 5 - Retorna os produtos encontrados com metadados de paginação
export async function listProductsPaginated(filters = {}, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const {
    page = 1,
    limit = 10,
    search,
    sortPrice,
    categoriaId,
    status = 'ativos',
  } = filters;

  const statusFilter =
    status === 'ativos'
      ? { ativo: true }
      : status === 'inativos'
      ? { ativo: false }
      : {};

  const where = {
    AND: [
      { empresaId: Number(empresaId) },
      statusFilter,
      search && search !== 'undefined' && search !== 'null'
        ? { nome: { contains: search, mode: 'insensitive' } }
        : {},
      categoriaId && categoriaId !== 'undefined' && categoriaId !== 'null' && !isNaN(Number(categoriaId))
        ? { categoriaId: Number(categoriaId) }
        : {},
    ],
  };

  const limitSafe = limit === 'all' ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === 'all' ? undefined : (pageSafe - 1) * limitSafe;

  const orderBy =
    sortPrice && ['asc', 'desc'].includes(sortPrice)
      ? [{ preco: sortPrice }]
      : [{ ativo: 'desc' }, { id: 'desc' }];

  const [products, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip,
      take: limitSafe,
      orderBy,
      include: { categoria: true, fornecedor: true },
    }),
    prisma.produto.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page: pageSafe,
      limit: limitSafe,
      total,
      pages: limit === 'all' ? 1 : Math.ceil(total / limitSafe),
    },
  };
}

// serviço responsável por buscar os detalhes de um produto garantindo isolamento por loja
// 1 - Busca via findFirst filtrando obrigatoriamente por id e empresaId
// 2 - Inclui categoria e fornecedor vinculados
// 3 - Lança 404 caso o produto não exista nesta loja
export async function getProductById(id, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const product = await prisma.produto.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
    include: { categoria: true, fornecedor: true },
  });
  if (!product) throw new AppError('Produto não encontrado', 404);
  return product;
}

// serviço responsável por criar um produto novo dentro do estabelecimento autenticado
// 1 - Valida nome obrigatório e empresaId da sessão
// 2 - Garante que categoriaId e fornecedorId informados pertencem à mesma loja
// 3 - Persiste o produto com ativo = true e retorna com relações inclusas
export async function createProduct(data, imagePath = null, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = data;
  if (!nome || String(nome).trim() === '') throw new AppError('Nome é obrigatório', 400);

  const validCategoriaId = await resolveTenantCategoryId(categoriaId, empresaId);
  const validFornecedorId = await resolveTenantSupplierId(fornecedorId, empresaId);

  return prisma.produto.create({
    data: {
      nome: String(nome).trim(),
      descricao: descricao !== undefined ? String(descricao) : null,
      preco: preco !== undefined && preco !== '' ? parseFloat(preco) : 0,
      quantidade: quantidade !== undefined && quantidade !== '' ? Number(quantidade) : 0,
      imagem: imagePath,
      ativo: true,
      empresaId: Number(empresaId),
      categoriaId: validCategoriaId,
      fornecedorId: validFornecedorId,
    },
    include: { categoria: true, fornecedor: true },
  });
}

// serviço responsável por atualizar um produto pertencente à loja
// 1 - Verifica se o produto existe e pertence ao empresaId da sessão
// 2 - Valida pertencimento de categoriaId e fornecedorId se fornecidos
// 3 - Gerencia remoção ou substituição segura da imagem no Cloudinary/disco
// 4 - Atualiza campos respeitando valores zerados (preco = 0, quantidade = 0) e retorna produto completo
export async function updateProduct(id, data, newImagePath = null, removeImage = false, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const product = await prisma.produto.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
  });
  if (!product) throw new AppError('Produto não encontrado', 404);

  let imagePath = product.imagem;
  if (removeImage) {
    if (imagePath) {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    imagePath = null;
  } else if (newImagePath) {
    if (imagePath) {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    imagePath = newImagePath;
  }

  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId, ativo } = data;

  const updateData = {
    imagem: imagePath,
  };

  if (nome !== undefined) updateData.nome = String(nome).trim();
  if (descricao !== undefined) updateData.descricao = descricao;
  if (preco !== undefined && preco !== '') updateData.preco = parseFloat(preco);
  if (quantidade !== undefined && quantidade !== '') updateData.quantidade = Number(quantidade);
  if (ativo !== undefined) updateData.ativo = parseBooleanFlag(ativo);

  if (categoriaId !== undefined) {
    updateData.categoriaId = await resolveTenantCategoryId(categoriaId, empresaId);
  }
  if (fornecedorId !== undefined) {
    updateData.fornecedorId = await resolveTenantSupplierId(fornecedorId, empresaId);
  }

  return prisma.produto.update({
    where: { id: Number(id) },
    data: updateData,
    include: { categoria: true, fornecedor: true },
  });
}

// serviço responsável por inativar ou reativar logicamente um produto (Soft Delete)
// 1 - Valida se o produto pertence ao estabelecimento autenticado
// 2 - Atualiza a flag ativo para true/false mantendo histórico e mídia preservados
export async function toggleProductStatus(id, ativo, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const product = await prisma.produto.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
  });
  if (!product) throw new AppError('Produto não encontrado', 404);

  return prisma.produto.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
    include: { categoria: true, fornecedor: true },
  });
}

// serviço responsável por excluir um produto (com fallback automático para Soft Delete se houver histórico)
// 1 - Busca o produto garantindo pertencimento ao empresaId e contabiliza suas movimentações
// 2 - Se possuir movimentações registradas, preserva a imagem/histórico e realiza inativação lógica (ativo = false)
// 3 - Caso não possua histórico, remove a imagem do Cloudinary/disco e exclui fisicamente do banco
export async function deleteProduct(id, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const product = await prisma.produto.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
    include: { _count: { select: { movimentos: true } } },
  });
  if (!product) throw new AppError('Produto não encontrado', 404);

  if (product._count.movimentos > 0) {
    const inactivated = await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false },
      include: { categoria: true, fornecedor: true },
    });
    return {
      ok: true,
      softDeleted: true,
      message: `Produto "${product.nome}" possui ${product._count.movimentos} movimentação(ões) no histórico e foi inativado logicamente.`,
      produto: inactivated,
    };
  }

  // Sem movimentações vinculadas: remove mídia na nuvem/disco antes de deletar do banco
  if (product.imagem) {
    if (product.imagem.startsWith('http://') || product.imagem.startsWith('https://')) {
      await deleteFromCloudinary(product.imagem);
    } else if (fs.existsSync(`.${product.imagem}`)) {
      try { fs.unlinkSync(`.${product.imagem}`); } catch (e) { /* ignore */ }
    }
  }

  await prisma.produto.delete({ where: { id: Number(id) } });
  return {
    ok: true,
    softDeleted: false,
    message: `Produto "${product.nome}" excluído permanentemente com sucesso.`,
  };
}

// Armazenamento em memória para chaves de idempotência e prevenção de cliques duplos simultâneos
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 10; // 10 minutos
const idempotencyStore = new Map();
const recentOperations = new Map();

// Limpeza periódica de chaves expiradas para evitar vazamento de memória
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
  for (const [key, timestamp] of recentOperations.entries()) {
    if (now - timestamp > 5000) {
      recentOperations.delete(key);
    }
  }
}, 1000 * 60 * 5).unref();

// serviço crítico: ajusta quantidade e salva movimentação histórica em transação atômica isolada por tenant
// 1 - Valida quantidade, tipo (REPOSICAO/VENDA) e empresaId da sessão
// 2 - Aplica idempotência e trava anti-duplo clique com namespace do estabelecimento
// 3 - Executa bloqueio pessimista FOR UPDATE no PostgreSQL filtrando id e empresaId
// 4 - Impede movimentação em produto inativo (Soft Delete) e bloqueia saldo negativo em vendas
// 5 - Cria registro no livro-razão (Movimento) com empresaId e atualiza o saldo do produto
export async function adjustProductQuantity(
  id,
  quantidade,
  tipo,
  usuarioId,
  observacao = null,
  idempotencyKey = null,
  empresaId
) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const qtdNum = Number(quantidade);
  if (!quantidade || isNaN(qtdNum) || qtdNum <= 0 || !tipo) {
    throw new AppError('Quantidade válida e tipo são obrigatórios', 400);
  }

  let normalizedTipo = String(tipo).toUpperCase();
  if (normalizedTipo === 'ENTRADA') normalizedTipo = 'REPOSICAO';
  if (normalizedTipo === 'SAIDA') normalizedTipo = 'VENDA';

  if (!['REPOSICAO', 'VENDA'].includes(normalizedTipo)) {
    throw new AppError('Tipo deve ser REPOSICAO ou VENDA', 400);
  }

  const productId = Number(id);
  const tenantId = Number(empresaId);
  if (isNaN(productId)) throw new AppError('ID de produto inválido', 400);

  const scopedIdempotencyKey = idempotencyKey ? `${tenantId}:${idempotencyKey}` : null;

  if (scopedIdempotencyKey) {
    const cached = idempotencyStore.get(scopedIdempotencyKey);
    if (cached) {
      if (cached.status === 'PROCESSING') {
        throw new AppError('Esta operação já está em processamento. Por favor, aguarde.', 409);
      }
      return cached.result;
    }
    idempotencyStore.set(scopedIdempotencyKey, { status: 'PROCESSING', timestamp: Date.now() });
  }

  const debounceKey = `emp_${tenantId}_user_${usuarioId}_prod_${productId}_${normalizedTipo}_${qtdNum}`;
  const now = Date.now();
  const lastOp = recentOperations.get(debounceKey);
  if (!scopedIdempotencyKey && lastOp && now - lastOp < 1200) {
    throw new AppError('Operação duplicada detectada (clique duplo). Por favor, aguarde a conclusão.', 429);
  }
  recentOperations.set(debounceKey, now);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock pessimista FOR UPDATE filtrando pelo tenant (impede alteração cruzada e race condition)
      const [product] = await tx.$queryRaw`
        SELECT id, nome, quantidade, preco, ativo, "empresaId"
        FROM "Produto"
        WHERE id = ${productId} AND "empresaId" = ${tenantId}
        FOR UPDATE
      `;

      if (!product) throw new AppError('Produto não encontrado neste estabelecimento', 404);
      if (!product.ativo) {
        throw new AppError('Este produto está inativo. Reative-o antes de registrar movimentações.', 400);
      }

      if (normalizedTipo === 'VENDA' && product.quantidade < qtdNum) {
        throw new AppError(
          `Quantidade insuficiente no estoque. Saldo disponível: ${product.quantidade}, Solicitado: ${qtdNum}`,
          400
        );
      }

      const delta = normalizedTipo === 'REPOSICAO' ? qtdNum : -qtdNum;
      const newQuantity = product.quantidade + delta;
      if (newQuantity < 0) throw new AppError('Quantidade não pode ser negativa', 400);

      const movimento = await tx.movimento.create({
        data: {
          produtoId: productId,
          quantidade: qtdNum,
          tipo: normalizedTipo,
          usuarioId: Number(usuarioId),
          empresaId: tenantId,
          observacao,
        },
        include: {
          produto: true,
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
      idempotencyStore.set(scopedIdempotencyKey, { status: 'DONE', result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    if (scopedIdempotencyKey) {
      idempotencyStore.delete(scopedIdempotencyKey);
    }
    throw err;
  }
}

// serviço responsável por obter as macroestatísticas de estoque do estabelecimento ativo
// 1 - Contabiliza apenas produtos ativos da loja (Soft Delete)
// 2 - Lista até 5 produtos ativos com estoque crítico (< 10)
// 3 - Executa agregação de patrimônio total (SUM(preco * quantidade)) direto no PostgreSQL filtrando por empresaId e ativo = true
export async function getProductStats(empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const tenantId = Number(empresaId);

  const total = await prisma.produto.count({ where: { empresaId: tenantId, ativo: true } });
  const lowStockCount = await prisma.produto.count({
    where: { empresaId: tenantId, ativo: true, quantidade: { lt: 10 } },
  });
  const lowStockList = await prisma.produto.findMany({
    where: { empresaId: tenantId, ativo: true, quantidade: { lt: 10 } },
    select: { id: true, nome: true, quantidade: true },
    take: 5,
  });

  const valueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(preco * quantidade), 0) AS "totalValue"
    FROM "Produto"
    WHERE "empresaId" = ${tenantId} AND "ativo" = true
  `;
  const totalValue = Number(valueResult[0]?.totalValue || 0);

  return { total, lowStock: lowStockCount, totalValue, lowStockList };
}

// serviço isolado para contagem de produtos ativos da loja
// 1 - Filtra estritamente por empresaId e ativo = true
export async function countProducts(empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  return prisma.produto.count({
    where: { empresaId: Number(empresaId), ativo: true },
  });
}
