// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import {prisma} from '../config/prismaClient.js';

export async function listMovements(req, res) {
  try {
    const { produtoId, from, to, order } = req.query;
    const where = {};

    if (produtoId) where.produtoId = Number(produtoId);

    // Criar filtro de data somente se from ou to existirem
    if (from || to) {
      where.data = {};
      if (from) where.data.gte = new Date(from);
      if (to) where.data.lte = new Date(to);
    }

    // Ordenação: asc ou desc (default desc)
    const orderBy = { data: order === "asc" ? "asc" : "desc" };

    const mov = await prisma.movimento.findMany({
      where,
      include: { produto: true, usuario: true },
      orderBy,
    });

    res.json(mov);
  } catch (err) {
    console.error("Erro ao listar movimentações:", err);
    res.status(500).json({ message: "Erro interno ao listar movimentações" });
  }
}

