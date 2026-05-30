import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

export async function createSupplier(data) {
  const { nome, contato, endereco } = data;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de fornecedor é obrigatório', 400);
  }

  return prisma.fornecedor.create({
    data: { nome: nome.trim(), contato, endereco }
  });
}

export async function listSuppliers() {
  return prisma.fornecedor.findMany();
}

export async function updateSupplier(id, data) {
  const { nome, contato, endereco } = data;
  const supplier = await prisma.fornecedor.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: { nome: nome ? nome.trim() : undefined, contato, endereco }
  });
}

export async function deleteSupplier(id) {
  const supplier = await prisma.fornecedor.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.delete({ where: { id: parseInt(id) } });
}

export async function countSuppliers() {
  return prisma.fornecedor.count();
}

export async function getSupplierStats() {
  const suppliers = await prisma.fornecedor.findMany({
    include: { produtos: { include: { movimentos: true } } }
  });

  return suppliers.map((sup) => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    const productMovements = {};

    sup.produtos.forEach((prod) => {
      prod.movimentos.forEach((mov) => {
        if (mov.tipo === 'ENTRADA') totalEntradas += mov.quantidade;
        else totalSaidas += mov.quantidade;

        if (!productMovements[prod.nome]) productMovements[prod.nome] = 0;
        productMovements[prod.nome] += mov.quantidade;
      });
    });

    let topProduct = null;
    let maxMov = 0;
    for (const [prodName, qtd] of Object.entries(productMovements)) {
      if (qtd > maxMov) {
        maxMov = qtd;
        topProduct = prodName;
      }
    }

    return {
      id: sup.id,
      nome: sup.nome,
      totalEntradas,
      totalSaidas,
      totalMovimentacoes: totalEntradas + totalSaidas,
      produtoMaisMovimentado: topProduct || 'Nenhum'
    };
  });
}
