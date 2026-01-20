// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import { prisma } from '../config/prismaClient.js';

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

export async function getUserStats(req, res) {
  try {
    const movements = await prisma.movimento.findMany({
      include: { produto: true, usuario: true }
    });

    const stats = movements.reduce((acc, mov) => {
      if (!mov.usuario) return acc;
      const userName = mov.usuario.nome;

      if (!acc[userName]) {
        acc[userName] = { name: userName, count: 0, totalValue: 0 };
      }

      // Quantidade de movimentações (total de registros)
      acc[userName].count += 1;

      // Valor movimentado (considerando SAIDA como vendas)
      // Se a ideia for movimentação financeira geral, somaríamos tudo.
      // Dado "(vendas)", vamos somar apenas SAIDAS.
      if (mov.tipo === "SAIDA") {
        acc[userName].totalValue += (mov.quantidade * Number(mov.produto.preco));
      }

      return acc;
    }, {});

    const result = Object.values(stats);
    res.json(result);
  } catch (err) {
    console.error("Erro ao obter estatísticas de usuários:", err);
    res.status(500).json({ message: "Erro interno ao obter estatísticas" });
  }
}

