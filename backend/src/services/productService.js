import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';
import fs from 'fs';

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

export async function getProductById(id) {
  const product = await prisma.produto.findUnique({
    where: { id: Number(id) },
    include: { categoria: true, fornecedor: true }
  });
  if (!product) throw new AppError('Produto não encontrado', 404);
  return product;
}

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
    }
  });
}

export async function updateProduct(id, data, newImagePath = null) {
  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  let imagePath = product.imagem;
  if (newImagePath) {
    if (imagePath && fs.existsSync(`.${imagePath}`)) {
      try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
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
    }
  });
}

export async function deleteProduct(id) {
  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  if (product.imagem && fs.existsSync(`.${product.imagem}`)) {
    try { fs.unlinkSync(`.${product.imagem}`); } catch (e) { /* ignore */ }
  }

  return prisma.produto.delete({ where: { id: Number(id) } });
}

export async function adjustProductQuantity(id, quantidade, tipo, usuarioId, observacao = null) {
  if (!quantidade || !tipo) throw new AppError('Quantidade e tipo são obrigatórios', 400);
  if (!['ENTRADA', 'SAIDA'].includes(tipo)) throw new AppError('Tipo deve ser ENTRADA ou SAIDA', 400);

  const product = await prisma.produto.findUnique({ where: { id: Number(id) } });
  if (!product) throw new AppError('Produto não encontrado', 404);

  const delta = tipo === 'ENTRADA' ? Number(quantidade) : -Number(quantidade);
  const newQuantity = product.quantidade + delta;

  if (tipo === 'SAIDA' && Number(quantidade) > product.quantidade) {
    throw new AppError('Quantidade insuficiente no estoque', 400);
  }
  if (newQuantity < 0) throw new AppError('Quantidade não pode ser negativa', 400);

  const result = await prisma.$transaction([
    prisma.movimento.create({
      data: { produtoId: Number(id), quantidade: Number(quantidade), tipo, usuarioId: Number(usuarioId), observacao }
    }),
    prisma.produto.update({ where: { id: Number(id) }, data: { quantidade: newQuantity } })
  ]);

  return { ok: true, novaQuantidade: newQuantity, movimento: result[0] };
}

export async function getProductStats() {
  const total = await prisma.produto.count();
  const lowStockCount = await prisma.produto.count({ where: { quantidade: { lt: 10 } } });
  const lowStockList = await prisma.produto.findMany({
    where: { quantidade: { lt: 10 } },
    select: { id: true, nome: true, quantidade: true },
    take: 5
  });

  const products = await prisma.produto.findMany({ select: { preco: true, quantidade: true } });
  const totalValue = products.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);

  return { total, lowStock: lowStockCount, totalValue, lowStockList };
}

export async function countProducts() {
  return prisma.produto.count();
}
