import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

export async function authenticateUser(email, senha) {
    console.log('1')
  if (!email || !senha) throw new AppError('Email e senha são obrigatórios', 400);

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) throw new AppError('Credenciais inválidas', 401);
  console.log('2', user)

  const isValid = await bcrypt.compare(senha, user.senha);
  if (!isValid) throw new AppError('Credenciais inválidas', 401);
  console.log('3', isValid)

    console.log('JWT_SECRET:', process.env.JWT_SECRET);
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  console.log('4')
  return { token, user: sanitizeUser(user) };
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

export async function registerUser({ nome, email, senha, role }) {
  if (!nome || !email || !senha) throw new AppError('Dados incompletos', 400);
  const userExists = await prisma.usuario.findUnique({ where: { email } });
  if (userExists) throw new AppError('Usuário já cadastrado', 400);

  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({ data: { nome, email, senha: hashed, role: role || 'OPERADOR' } });
  return sanitizeUser(user);
}
