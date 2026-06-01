// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import { prisma } from '../config/prismaClient.js';
import { childLogger } from '../config/logger.js';
const log = childLogger('movementController');

export async function listMovements(req, res, next) {
  try {
    const { produtoId, from, to, order } = req.query;
    const where = {};

    if (produtoId) where.produtoId = Number(produtoId);

    if (from || to) {
      where.data = {};
      if (from) where.data.gte = new Date(from);
      if (to) where.data.lte = new Date(to);
    }

    const orderBy = { data: order === "asc" ? "asc" : "desc" };

    const mov = await prisma.movimento.findMany({ where, include: { produto: true, usuario: true }, orderBy });
    res.json(mov);
  } catch (err) {
    log.error({ err }, 'Error listing movements');
    next(err);
  }
}

export async function getUserStats(req, res, next) {
  try {
    const stats = await prisma.movimento.groupBy({
      by: ['usuarioId'],
      _count: { _all: true },
      _sum: { quantidade: true },
    });

    // join usuario names
    const results = await Promise.all(stats.map(async (s) => {
      const usuario = await prisma.usuario.findUnique({ where: { id: s.usuarioId }, select: { nome: true } });
      // compute totalValue for SAIDA movements
const saidas = await prisma.movimento.findMany({
  where: {
    usuarioId: s.usuarioId,
    tipo: 'SAIDA'
  },
  include: {
    produto: {
      select: {
        preco: true
      }
    }
  }
});

const totalValue = saidas.reduce((acc, mov) => {
  return acc + (mov.quantidade * mov.produto.preco);
}, 0);

return {
  usuarioId: s.usuarioId,
  name: usuario?.nome || 'Desconhecido',
  count: s._count._all || 0,
  totalQuantity: s._sum.quantidade || 0,
  totalValue
};
    }));

    res.json(results);
  } catch (err) {
    log.error({ err }, 'Error getting user stats');
    next(err);
  }
}

