import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError('Token não fornecido', 401));

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!user) return next(new AppError('Usuário não encontrado', 401));
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return next(new AppError('Token inválido', 401));
  }
}
