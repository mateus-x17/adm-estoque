import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

export async function listMovementsPaginated(filters = {}) {
  const { produtoId, from, to, order, page = 1, limit = 20 } = filters;
  const where = {};

  if (produtoId) where.produtoId = Number(produtoId);

  if (from || to) {
    where.data = {};
    if (from) where.data.gte = new Date(from);
    if (to) where.data.lte = new Date(to);
  }

  const limitSafe = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = (pageSafe - 1) * limitSafe;

  const orderBy = { data: order === 'asc' ? 'asc' : 'desc' };

  const [movements, total] = await Promise.all([
    prisma.movimento.findMany({
      where,
      include: { produto: true, usuario: { select: { id: true, nome: true, email: true, role: true } } },
      orderBy,
      skip,
      take: limitSafe
    }),
    prisma.movimento.count({ where })
  ]);

  return {
    data: movements,
    pagination: { page: pageSafe, limit: limitSafe, total, pages: Math.ceil(total / limitSafe) }
  };
}

export async function getUserStatsAggregated() {
  const stats = await prisma.movimento.groupBy({
    by: ['usuarioId'],
    _count: { _all: true },
    _sum: { quantidade: true }
  });

  const results = await Promise.all(
    stats.map(async (s) => {
      const usuario = await prisma.usuario.findUnique({
        where: { id: s.usuarioId },
        select: { nome: true, email: true }
      });

      const saidaAgg = await prisma.movimento.aggregate({
        where: { usuarioId: s.usuarioId, tipo: 'SAIDA' },
        _sum: { quantidade: true }
      });

      return {
        usuarioId: s.usuarioId,
        nome: usuario?.nome || 'Desconhecido',
        email: usuario?.email,
        totalMovimentos: s._count._all || 0,
        totalQuantidade: s._sum.quantidade || 0,
        totalSaidaQuantidade: saidaAgg._sum.quantidade || 0
      };
    })
  );

  return results;
}
