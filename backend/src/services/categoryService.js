import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

export async function listCategories() {
  return prisma.categoria.findMany();
}

export async function createCategory(nome) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  return prisma.categoria.create({ data: { nome: nome.trim() } });
}

export async function updateCategory(id, nome) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  const category = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { nome: nome.trim() }
  });
}

export async function deleteCategory(id) {
  const category = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  return prisma.categoria.delete({ where: { id: Number(id) } });
}

export async function countCategories() {
  return prisma.categoria.count();
}
