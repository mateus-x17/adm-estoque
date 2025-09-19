// import { PrismaClient } from "@prisma/client";
import fs from "fs";
import {prisma} from '../config/prismaClient.js';

export async function listProducts(req, res) {
  const products = await prisma.produto.findMany({ include: { categoria: true, fornecedor: true } });
  res.json(products);
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
      try { fs.unlinkSync(`.${imagem}`); } catch(e){/* ignore */ }
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
  // se a quantidade desejada for maior que a disponível, retornar erro de quantidade insuficiente
  if (quantidade > product.quantidade) return res.status(400).json({ error: "Quantidade insuficiente no estoque" });
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
