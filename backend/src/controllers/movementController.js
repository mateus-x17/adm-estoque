// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import {prisma} from '../config/prismaClient.js';

export async function listMovements(req, res) {
  // filtros simples por query: produtoId, dataFrom, dataTo
  const { produtoId, from, to, order } = req.query;
  const where = {};
  if (produtoId) where.produtoId = Number(produtoId);
  if (from || to || order) where.data = {};
  if (from) where.data.gte = new Date(from);
  if (to) where.data.lte = new Date(to);
  if (order) where.order = order; //ordenação por data

  const mov = await prisma.movimento.findMany({
    where,
    include: { produto: true, usuario: true },
    orderBy: { data: "desc" || where.order },
  });
  res.json(mov);
}
