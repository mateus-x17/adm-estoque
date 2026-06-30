import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

export async function listMovementsPaginated(filters = {}) {
  const {
    id,
    date,
    produtoId,
    from,
    to,
    order,
    page = 1,
    limit = 20,
    tipo,
    usuarioId,
    search,
  } = filters;

  const where = {
    AND: [
      id && !isNaN(Number(id))
        ? {
            id: Number(id),
          }
        : {},
      produtoId && !isNaN(Number(produtoId))
        ? {
            produtoId: Number(produtoId),
          }
        : {},
      date && date !== 'undefined' && date !== 'null'
        ? {
            data: {
              gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
            },
          }
        : from || to
        ? {
            data: {
              ...(from && from !== 'undefined' && from !== 'null' ? { gte: new Date(from) } : {}),
              ...(to && to !== 'undefined' && to !== 'null' ? { lte: new Date(to) } : {}),
            },
          }
        : {},
      tipo && tipo !== 'undefined' && tipo !== 'null' && ['ENTRADA', 'SAIDA'].includes(tipo)
        ? {
            tipo,
          }
        : {},
      usuarioId && usuarioId !== 'undefined' && usuarioId !== 'null' && !isNaN(Number(usuarioId))
        ? {
            usuarioId: Number(usuarioId),
          }
        : {},
      search && search !== 'undefined' && search !== 'null'
        ? {
            produto: {
              nome: {
                contains: search,
                mode: "insensitive",
              },
            },
          }
        : {},
    ],
  };

  const isAll = limit === 'all';
  const limitSafe = isAll ? undefined : Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = isAll ? undefined : (pageSafe - 1) * limitSafe;

  const orderBy = { data: order === 'asc' ? 'asc' : 'desc' };

  const [movements, total] = await Promise.all([
    prisma.movimento.findMany({
      where,
      include: { produto: true, usuario: { select: { id: true, nome: true, email: true, role: true } } },
      orderBy,
      skip,
      take: limitSafe,
    }),
    prisma.movimento.count({ where })
  ]);

  return {
    data: movements,
    pagination: {
      page: pageSafe,
      limit: isAll ? 'all' : limitSafe,
      total,
      pages: isAll ? 1 : Math.ceil(total / limitSafe)
    }
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
