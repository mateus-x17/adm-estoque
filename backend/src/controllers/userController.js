// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
import { prisma } from "../config/prismaClient.js";

export async function createUser(req, res) {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: "Dados incompletos" });

  const hashed = await bcrypt.hash(senha, 10);
  try {
    const user = await prisma.usuario.create({
      data: { nome, email, senha: hashed, role: role || "OPERADOR" },
      select: { id: true, nome: true, email: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function listUsers(req, res) {
  const users = await prisma.usuario.findMany({ select: { id: true, nome: true, email: true, role: true } });
  res.json(users);
}

export async function getUser(req, res) {
  const id = Number(req.params.id);
  const user = await prisma.usuario.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json({ id: user.id, nome: user.nome, email: user.email, role: user.role });
}

export async function updateUser(req, res) {
  const id = Number(req.params.id);
  const { nome, email, senha, role } = req.body;
  const data = { nome, email, role };
  if (senha) data.senha = await bcrypt.hash(senha, 10);
  try {
    const user = await prisma.usuario.update({ where: { id }, data, select: { id: true, nome: true, email: true, role: true } });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  const id = Number(req.params.id);
  await prisma.usuario.delete({ where: { id } });
  res.json({ ok: true });
}
