import bcrypt from 'bcryptjs';
import { prisma } from '../config/prismaClient.js';
import fs from 'fs';
import { AppError } from '../utils/errorHandler.js';
import { sanitizeUser, sanitizeUsers } from '../utils/sanitizers.js';

export async function createUser(data, imagePath = null) {
  const { nome, email, senha, role } = data;
  if (!nome || !email || !senha) throw new AppError('Nome, email e senha são obrigatórios', 400);

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) throw new AppError('Email já registrado', 400);

  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({
    data: { nome, email, senha: hashed, role: role || 'OPERADOR', imagem: imagePath },
    select: { id: true, nome: true, email: true, role: true, imagem: true, createdAt: true }
  });

  return sanitizeUser(user);
}

export async function listUsers() {
  const users = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, imagem: true, createdAt: true, updatedAt: true }
  });
  return sanitizeUsers(users);
}

export async function getUserById(id) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError('Usuário não encontrado', 404);
  return sanitizeUser(user);
}

export async function updateUser(id, data, newImagePath = null) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  const updateData = { ...data };

  if (data.senha) {
    updateData.senha = await bcrypt.hash(data.senha, 10);
  }

  let imagePath = user.imagem;
  if (newImagePath) {
    if (imagePath && fs.existsSync(`.${imagePath}`)) {
      try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
    }
    imagePath = newImagePath;
    updateData.imagem = imagePath;
  }

  const updated = await prisma.usuario.update({
    where: { id: Number(id) },
    data: updateData,
    select: { id: true, nome: true, email: true, role: true, imagem: true }
  });

  return sanitizeUser(updated);
}

export async function deleteUser(id) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  if (user.imagem && fs.existsSync(`.${user.imagem}`)) {
    try { fs.unlinkSync(`.${user.imagem}`); } catch (e) { /* ignore */ }
  }

  return prisma.usuario.delete({ where: { id: Number(id) } });
}
