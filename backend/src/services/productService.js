import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';
import { deleteFromCloudinary } from '../config/cloudinaryConfig.js';
import fs from 'fs';

// serviço responsável por listar os produtos aplicando paginação e filtros complexos
// 1 - Desestrutura as chaves de busca e paginação recebidas do controlador
// 2 - Monta dinamicamente a cláusula "where" no ORM (Prisma), checando se o filtro existe e não é nulo/undefined antes de injetá-lo
// 3 - Configura os valores seguros (limitSafe, pageSafe, skip) evitando SQL Injection ou sobrecarga de requisição
// 4 - Executa paralelamente via Promise.all: (a) a busca dos produtos com as relações inclusas; e (b) a contagem absoluta
// 5 - Retorna o array formatado pronto para consumo com as chaves 'data' e 'pagination'
export async function listProductsPaginated(filters = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    sortPrice,
    categoriaId,
  } = filters;

  const where = {
    AND: [
      search && search !== 'undefined' && search !== 'null'
        ? { nome: { contains: search, mode: "insensitive" } }
        : {},
      categoriaId && categoriaId !== 'undefined' && categoriaId !== 'null' && !isNaN(Number(categoriaId))
        ? { categoriaId: Number(categoriaId) }
        : {},
    ],
  };

  const limitSafe = limit === 'all' ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === 'all' ? undefined : (pageSafe - 1) * limitSafe;

  const orderBy = sortPrice && ['asc', 'desc'].includes(sortPrice)
    ? { preco: sortPrice }
    : undefined;

  const [products, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip,
      take: limitSafe,
      orderBy,
      include: { categoria: true, fornecedor: true }
    }),
    prisma.produto.count({ where })
  ]);

  return {
    data: products,
    pagination: { page: pageSafe, limit: limitSafe, total, pages: limit === 'all' ? 1 : Math.ceil(total / limitSafe) }
  };
}

// serviço responsável por buscar o detalhamento de um produto individual
// 1 - Puxa no banco com base no ID
// 2 - Força um 'include' para pegar também as categorias e os fornecedores atrelados
// 3 - Lança erro 404 se nada for encontrado
export async function getProductById(id) {
  const product = await prisma.produto.findUnique({
    where: { id: Number(id) },
    include: { categoria: true, fornecedor: true } // join com tabelas estrangeiras
  });
  if (!product) throw new AppError('Produto não encontrado', 404);
  return product;
}

// serviço responsável por criar um produto novo
// 1 - Valida regras de negócio puras (se o nome está vazio)
// 2 - Converte tipos que vieram do FormData (texto) para Number ou Decimal a depender da necessidade
// 3 - Salva no Prisma e retorna o objeto formatado
export async function createProduct(data, imagePath = null) {
  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = data;
  if (!nome) throw new AppError('Nome é obrigatório', 400);

  return prisma.produto.create({
    data: {
      nome,
      descricao,
      preco: parseFloat(preco) || 0,
      quantidade: Number(quantidade) || 0,
      imagem: imagePath,
      categoriaId: categoriaId ? Number(categoriaId) : null,
      fornecedorId: fornecedorId ? Number(fornecedorId) : null
    },
    include: { categoria: true, fornecedor: true }
  });
}

// serviço responsável por atualizar um produto
// 1 - Confirma se o produto que se deseja atualizar existe e resgata seus dados antigos, especialmente a "imagem"
// 2 - Avalia a intenção da requisição: "removeImage" (limpar foto atual) ou "newImagePath" (substituir por nova foto)
// 3 - Caso haja deleção, ele tenta remover a imagem do CDN (Cloudinary) ou localmente se estiver em /uploads
// 4 - Atualiza o banco com a string nova do path de imagem (seja ela nula, ou um novo link) e os demais dados, garantindo os tipos
export async function updateProduct(id, data, newImagePath = null, removeImage = false) {
  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  let imagePath = product.imagem;
  // Lógica pesada de gerência de assets da nuvem
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

  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = data;
  return prisma.produto.update({
    where: { id: Number(id) },
    data: {
      nome,
      descricao,
      preco: preco ? parseFloat(preco) : undefined,
      quantidade: quantidade ? Number(quantidade) : undefined,
      imagem: imagePath,
      categoriaId: categoriaId ? Number(categoriaId) : null,
      fornecedorId: fornecedorId ? Number(fornecedorId) : null
    },
    include: { categoria: true, fornecedor: true }
  });
}

// serviço responsável por excluir um produto e limpar as fotos órfãs na nuvem
// 1 - Puxa o produto do banco via ID
// 2 - Identifica se havia imagem; em caso positivo limpa no servidor ou Cloudinary de forma controlada
// 3 - Deleta efetivamente do Postgres via Prisma
export async function deleteProduct(id) {
  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  if (product.imagem) {
    if (product.imagem.startsWith('http://') || product.imagem.startsWith('https://')) {
      await deleteFromCloudinary(product.imagem);
    } else if (fs.existsSync(`.${product.imagem}`)) {
      try { fs.unlinkSync(`.${product.imagem}`); } catch (e) { /* ignore */ }
    }
  }

  // Verifica se o produto tem movimentações registradas antes de tentar excluir
  const movementsCount = await prisma.movimento.count({ where: { produtoId: Number(id) } });
  if (movementsCount > 0) {
    throw new AppError(
      `Não é possível excluir o produto "${product.nome}" porque ele possui ${movementsCount} movimentação(ões) registrada(s) no histórico.`,
      400
    );
  }

  return prisma.produto.delete({ where: { id: Number(id) } });
}

// Armazenamento em memória para chaves de idempotência e prevenção de cliques duplos simultâneos (I9)
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

// serviço ultra crítico: ajusta quantidade e salva o registro histórico como transação interativa atômica
// 1 - Validações estruturais rigorosas
// 2 - Bloqueio de concorrência com lock pessimista (FOR UPDATE) no PostgreSQL (Eliminação de Lost Update e Race Conditions - I1, I8)
// 3 - Suporte nativo a chave de idempotência (Idempotency-Key) e trava anti-duplo clique (I9)
// 4 - Previne Race Condition e garante que o estoque não fique negativo
// 5 - Retorna o resultado mantendo compatibilidade 100% com o contrato do frontend
export async function adjustProductQuantity(id, quantidade, tipo, usuarioId, observacao = null, idempotencyKey = null) {
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
  if (isNaN(productId)) throw new AppError('ID de produto inválido', 400);

  // Verificação de Idempotência Explícita (I9)
  if (idempotencyKey) {
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached) {
      if (cached.status === 'PROCESSING') {
        throw new AppError('Esta operação já está em processamento. Por favor, aguarde.', 409);
      }
      return cached.result;
    }
    idempotencyStore.set(idempotencyKey, { status: 'PROCESSING', timestamp: Date.now() });
  }

  // Trava anti-duplo clique involuntário (debounce de 1.2 segundos por usuário + produto + tipo + quantidade)
  const debounceKey = `user_${usuarioId}_prod_${productId}_${normalizedTipo}_${qtdNum}`;
  const now = Date.now();
  const lastOp = recentOperations.get(debounceKey);
  if (!idempotencyKey && lastOp && (now - lastOp) < 1200) {
    throw new AppError('Operação duplicada detectada (clique duplo). Por favor, aguarde a conclusão.', 429);
  }
  recentOperations.set(debounceKey, now);

  try {
    // Transação interativa atômica com Bloqueio Pessimista no PostgreSQL (I1, I2, I8)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock pessimista FOR UPDATE na linha do produto: serializa requisições concorrentes
      const [product] = await tx.$queryRaw`
        SELECT id, nome, quantidade, preco
        FROM "Produto"
        WHERE id = ${productId}
        FOR UPDATE
      `;

      if (!product) throw new AppError('Produto não encontrado', 404);

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

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { status: 'DONE', result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    if (idempotencyKey) {
      idempotencyStore.delete(idempotencyKey);
    }
    throw err;
  }
}

// serviço responsável por obter as macroestatísticas de dashboard dos produtos
// 1 - Puxa a contagem de todos produtos
// 2 - Puxa a contagem e lista limitada dos produtos com estoque crítico (< 10)
// 3 - Executa o cálculo de patrimônio (SUM(preco * quantidade)) via SQL aggregation direto no PostgreSQL
// 4 - Evita trazer toda a tabela para a memória do Node.js (Prevenção de OOM)
export async function getProductStats() {
  const total = await prisma.produto.count();
  const lowStockCount = await prisma.produto.count({ where: { quantidade: { lt: 10 } } });
  const lowStockList = await prisma.produto.findMany({
    where: { quantidade: { lt: 10 } },
    select: { id: true, nome: true, quantidade: true },
    take: 5,
  });

  // Agregação nativa direta no PostgreSQL via queryRaw (alta performance, zero sobrecarga de memória)
  const valueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(preco * quantidade), 0) AS "totalValue"
    FROM "Produto"
  `;
  const totalValue = Number(valueResult[0]?.totalValue || 0);

  return { total, lowStock: lowStockCount, totalValue, lowStockList };
}

// serviço isolado para contagem total dos produtos
// 1 - O Prisma conta rapidamente o id na tabela
export async function countProducts() {
  return prisma.produto.count();
}
