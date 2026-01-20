import { prisma } from "../config/prismaClient.js";

// 🔹 Criar fornecedor
export async function criarFornecedor(req, res) {
  try {
    const { nome, contato, endereco } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const fornecedor = await prisma.fornecedor.create({
      data: { nome, contato, endereco },
    });

    res.json({ fornecedor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🔹 Listar fornecedores
export async function listarFornecedores(req, res) {
  try {
    const fornecedores = await prisma.fornecedor.findMany();
    res.json({ fornecedores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// contagem de fornecedores
export async function countFornecedores(req, res) {
  try {
    const count = await prisma.fornecedor.count();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🔹 Atualizar fornecedor
export async function atualizarFornecedor(req, res) {
  try {
    const { id } = req.params;
    const { nome, contato, endereco } = req.body;

    const fornecedor = await prisma.fornecedor.update({
      where: { id: parseInt(id) },
      data: { nome, contato, endereco },
    });

    res.json({ fornecedor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🔹 Deletar fornecedor
export async function deletarFornecedor(req, res) {
  try {
    const { id } = req.params;
    await prisma.fornecedor.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Fornecedor deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🔹 Estatísticas do fornecedor
export async function getSupplierStats(req, res) {
  try {
    // Buscar fornecedores com seus produtos e movimentos
    const suppliers = await prisma.fornecedor.findMany({
      include: {
        produtos: {
          include: {
            movimentos: true,
          },
        },
      },
    });

    // Processar dados
    const stats = suppliers.map((sup) => {
      let totalEntradas = 0;
      let totalSaidas = 0;
      const productMovements = {};

      sup.produtos.forEach((prod) => {
        prod.movimentos.forEach((mov) => {
          if (mov.tipo === "ENTRADA") {
            totalEntradas += mov.quantidade;
          } else {
            totalSaidas += mov.quantidade;
          }

          // Contar movimentos por produto
          if (!productMovements[prod.nome]) {
            productMovements[prod.nome] = 0;
          }
          productMovements[prod.nome] += mov.quantidade;
        });
      });

      // Encontrar produto mais movimentado
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
        produtoMaisMovimentado: topProduct || "Nenhum",
      };
    });

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
