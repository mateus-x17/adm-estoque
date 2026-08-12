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

  return prisma.produto.delete({ where: { id: Number(id) } });
}

// serviço ultra crítico: ajusta quantidade e salva o registro histórico como transação atômica
// 1 - Validações estruturais e resgate do produto original do banco
// 2 - Regra de Negócio principal: Impede (throw 400) movimentações de SAIDA maiores que a quantidade que o banco já tem e qualquer estoque que ficasse negativo
// 3 - Usa o prisma.$transaction para registrar a tabela de "movimentos" E dar o UPDATE em "produto" na MESMA transação
// 4 - Em caso de queda do banco, se uma falhar, as duas partes sofrem um "rollback" e a consistência é mantida intacta
export async function adjustProductQuantity(id, quantidade, tipo, usuarioId, observacao = null) {
  if (!quantidade || !tipo) throw new AppError('Quantidade e tipo são obrigatórios', 400);
  if (!['ENTRADA', 'SAIDA'].includes(tipo)) throw new AppError('Tipo deve ser ENTRADA ou SAIDA', 400);

  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  const delta = tipo === 'ENTRADA' ? Number(quantidade) : -Number(quantidade);
  const newQuantity = product.quantidade + delta;

  // regra de negócio: não permite estoque negativo em saída
  if (tipo === 'SAIDA' && Number(quantidade) > product.quantidade) {
    throw new AppError('Quantidade insuficiente no estoque', 400);
  }
  if (newQuantity < 0) throw new AppError('Quantidade não pode ser negativa', 400);

  // TRANSACÃO DO PRISMA: Garante que as duas ações ocorram obrigatoriamente juntas. 
  // Se uma falhar (ex: queda de luz), a outra sofre rollback evitando um banco inconsistente
  const result = await prisma.$transaction([
    prisma.movimento.create({
      data: { produtoId: Number(id), quantidade: Number(quantidade), tipo, usuarioId: Number(usuarioId), observacao }
    }),
    prisma.produto.update({ where: { id: Number(id) }, data: { quantidade: newQuantity } })
  ]);

  return { ok: true, novaQuantidade: newQuantity, movimento: result[0] };
}

// serviço responsável por obter as macroestatísticas de dashboard dos produtos
// 1 - Puxa a contagem de todos produtos
// 2 - Puxa especificamente a contagem e também a listinha limitada dos produtos onde a 'quantidade' < 10 (estoque crítico)
// 3 - Calcula o valor financeiro do estoque num reducer (quantidade * preço)
// 4 - Retorna o compilado
export async function getProductStats() {
  const total = await prisma.produto.count();
  const lowStockCount = await prisma.produto.count({ where: { quantidade: { lt: 10 } } }); // produtos quase acabando
  const lowStockList = await prisma.produto.findMany({
    where: { quantidade: { lt: 10 } },
    select: { id: true, nome: true, quantidade: true },
    take: 5
  });

  const products = await prisma.produto.findMany({ select: { preco: true, quantidade: true } });
  const totalValue = products.reduce((acc, p) => acc + (p.preco * p.quantidade), 0); // patrimônio

  return { total, lowStock: lowStockCount, totalValue, lowStockList };
}

// serviço isolado para contagem total dos produtos
// 1 - O Prisma conta rapidamente o id na tabela
export async function countProducts() {
  return prisma.produto.count();
}
