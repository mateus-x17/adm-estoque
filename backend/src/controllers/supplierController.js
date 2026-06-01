import { prisma } from "../config/prismaClient.js";
import { childLogger } from '../config/logger.js';
const log = childLogger('supplierController');

// 🔹 Criar fornecedor
export async function criarFornecedor(req, res, next) {
  try {
    const { nome, email, telefone, endereco } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const fornecedor = await prisma.fornecedor.create({ data: { nome, email, telefone, endereco  } });
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error creating supplier');
    next(err);
  }
}

// 🔹 Listar fornecedores
export async function listarFornecedores(req, res, next) {
  try {
    const fornecedores = await prisma.fornecedor.findMany();
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, 'Error listing suppliers');
    next(err);
  }
}

// contagem de fornecedores
export async function countFornecedores(req, res, next) {
  try {
    const count = await prisma.fornecedor.count();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting suppliers');
    next(err);
  }
}

// 🔹 Atualizar fornecedor
export async function atualizarFornecedor(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, endereco } = req.body;

    const fornecedor = await prisma.fornecedor.update({ where: { id: parseInt(id) }, data: { nome, email, telefone, endereco } });
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error updating supplier');
    next(err);
  }
}

// 🔹 Deletar fornecedor
export async function deletarFornecedor(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.fornecedor.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Fornecedor deletado com sucesso" });
  } catch (err) {
    log.error({ err }, 'Error deleting supplier');
    next(err);
  }
}

// 🔹 Estatísticas do fornecedor
export async function getSupplierStats(req, res, next) {
  try {
    const suppliers = await prisma.fornecedor.findMany({ include: { produtos: { include: { movimentos: true } } } });

    const stats = suppliers.map((sup) => {
      let totalEntradas = 0;
      let totalSaidas = 0;
      const productMovements = {};

      sup.produtos.forEach((prod) => {
        prod.movimentos.forEach((mov) => {
          if (mov.tipo === "ENTRADA") totalEntradas += mov.quantidade;
          else totalSaidas += mov.quantidade;

          if (!productMovements[prod.nome]) productMovements[prod.nome] = 0;
          productMovements[prod.nome] += mov.quantidade;
        });
      });

      let topProduct = null;
      let maxMov = 0;
      for (const [prodName, qtd] of Object.entries(productMovements)) {
        if (qtd > maxMov) { maxMov = qtd; topProduct = prodName; }
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
    log.error({ err }, 'Error getting supplier stats');
    next(err);
  }
}

export async function obterFornecedor(req, res, next) {
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if (!fornecedor) {
      return res.status(404).json({
        error: "Fornecedor não encontrado"
      });
    }

    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
