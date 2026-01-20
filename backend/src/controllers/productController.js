// import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { prisma } from '../config/prismaClient.js';

export async function listProducts(req, res) {
  const products = await prisma.produto.findMany({ include: { categoria: true, fornecedor: true } });
  res.json(products);
}

export async function countProducts(req, res) {
  try {
    const count = await prisma.produto.count();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProductStats(req, res) {
  try {
    const total = await prisma.produto.count();
    const lowStockCount = await prisma.produto.count({
      where: { quantidade: { lt: 10 } }
    });

    // Obter lista de produtos com baixo estoque
    const lowStockList = await prisma.produto.findMany({
      where: { quantidade: { lt: 10 } },
      select: { id: true, nome: true, quantidade: true },
      take: 5 // Limitar a 5 para exibir no dashboard
    });

    const products = await prisma.produto.findMany({ select: { preco: true, quantidade: true } });
    const totalValue = products.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);

    res.json({ total, lowStock: lowStockCount, totalValue, lowStockList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function getProduct(req, res) {
  const id = Number(req.params.id);
  const product = await prisma.produto.findUnique({ where: { id }, include: { categoria: true, fornecedor: true } });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
}

export async function createProduct(req, res) {
  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = req.body;
  const imagem = req.file ? `/uploads/${req.file.filename}` : null; // caminho público
  try {
    const prod = await prisma.produto.create({
      data: { nome, descricao, preco: parseFloat(preco), quantidade: Number(quantidade || 0), imagem, categoriaId: categoriaId ? Number(categoriaId) : null, fornecedorId: fornecedorId ? Number(fornecedorId) : null },
    });
    res.status(201).json(prod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  const id = Number(req.params.id);
  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = req.body;
  const product = await prisma.produto.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  // remover imagem antiga se enviou nova (opcional)
  let imagem = product.imagem;
  if (req.file) {
    // apaga a imagem antiga do disco se enviou nova (cuidado em produção: usar storage dedicado)
    if (imagem && fs.existsSync(`.${imagem}`)) {
      try { fs.unlinkSync(`.${imagem}`); } catch (e) {/* ignore */ }
    }
    imagem = `/uploads/${req.file.filename}`;
  }

  try {
    const updated = await prisma.produto.update({
      where: { id },
      data: { nome, descricao, preco: preco ? parseFloat(preco) : undefined, quantidade: quantidade ? Number(quantidade) : undefined, imagem, categoriaId: categoriaId ? Number(categoriaId) : null, fornecedorId: fornecedorId ? Number(fornecedorId) : null },
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  const id = Number(req.params.id);
  await prisma.produto.delete({ where: { id } });
  res.json({ ok: true });
}

export async function adjustQuantity(req, res) {
  const id = Number(req.params.id);
  const { quantidade, tipo, observacao } = req.body; // tipo: ENTRADA | SAIDA
  if (!quantidade || !tipo) return res.status(400).json({ error: "quantidade e tipo são obrigatórios" });

  const product = await prisma.produto.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const delta = tipo === "ENTRADA" ? Number(quantidade) : -Number(quantidade);
  // se a quantidade desejada for maior que a disponível E for saída, retornar erro
  if (tipo === "SAIDA" && Number(quantidade) > product.quantidade) {
    return res.status(400).json({ error: "Quantidade insuficiente no estoque" });
  }
  const newQuantity = product.quantidade + delta;
  if (newQuantity < 0) return res.status(400).json({ error: "Quantidade insuficiente no estoque" });

  try {
    // criar movimento
    await prisma.$transaction([
      prisma.movimento.create({
        data: { produtoId: id, quantidade: Number(quantidade), tipo, usuarioId: req.user.id, observacao },
      }),
      prisma.produto.update({ where: { id }, data: { quantidade: newQuantity } })
    ]);
    res.json({ ok: true, novaQuantidade: newQuantity });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
