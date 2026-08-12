import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// serviço responsável por autenticar um usuário no sistema
// 1 - Recebe as credenciais em texto puro
// 2 - Valida se ambas foram fornecidas
// 3 - Busca o usuário no banco de dados pelo e-mail
// 4 - Usa a biblioteca bcrypt para comparar a senha informada com o hash salvo no banco
// 5 - Em caso de sucesso, gera um token JWT (JSON Web Token) válido por 8 horas, contendo id e role no payload
// 6 - Retorna o token e os dados sanitizados (sem senha) do usuário
export async function authenticateUser(email, senha) {
  if (!email || !senha) throw new AppError('Email e senha são obrigatórios', 400);

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) throw new AppError('Credenciais inválidas', 401);

  const isValid = await bcrypt.compare(senha, user.senha);
  if (!isValid) throw new AppError('Credenciais inválidas', 401);

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return { token, user: sanitizeUser(user) };
}

// função utilitária local para limpar dados sensíveis
export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

// serviço responsável pelo cadastro (registro) de um usuário
// 1 - Valida os campos obrigatórios
// 2 - Checa se o e-mail já existe na base de dados
// 3 - Gera o hash criptográfico da senha usando bcrypt (fator de custo 10)
// 4 - Salva o usuário no banco, definindo role 'OPERADOR' como padrão caso nenhuma seja passada
// 5 - Retorna o objeto criado e limpo
export async function registerUser({ nome, email, senha, role }) {
  if (!nome || !email || !senha) throw new AppError('Dados incompletos', 400);
  const userExists = await prisma.usuario.findUnique({ where: { email } });
  if (userExists) throw new AppError('Usuário já cadastrado', 400);

  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({ data: { nome, email, senha: hashed, role: role || 'OPERADOR' } });
  return sanitizeUser(user);
}
