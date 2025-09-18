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
