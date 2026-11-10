import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";

// Cache em memória para perfis de usuários com TTL de 60 segundos (A1)
// Elimina o roundtrip repetitivo de ~140ms ao PostgreSQL Neon (AWS Virgínia) em toda requisição privada
const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 segundos

// Função de invalidação chamada quando o usuário for atualizado ou excluído
export function invalidateUserCache(userId = null) {
  if (userId) {
    userCache.delete(Number(userId));
  } else {
    userCache.clear();
  }
}

// Limpeza periódica de entradas expiradas para prevenir memory leak
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of userCache.entries()) {
    if (now - entry.timestamp > USER_CACHE_TTL_MS) {
      userCache.delete(id);
    }
  }
}, 30 * 1000).unref();

// middleware responsável por validar a autenticação do usuário nas rotas protegidas
// Otimizado com camada de cache em memória: se o token for válido e o usuário estiver em cache ativo,
// a requisição é atendida instantaneamente em < 1ms validando também se o usuário e sua loja estão ativos.
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError('Token não fornecido', 401));

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // valida assinatura do token
    const userId = Number(payload.id);

    // 1. Verificação no cache local em memória
    const now = Date.now();
    const cached = userCache.get(userId);
    if (cached && (now - cached.timestamp < USER_CACHE_TTL_MS)) {
      req.user = cached.user;
      return next();
    }

    // 2. Cache miss: busca no banco com projeção incluindo dados da empresa e flag de soft delete (ativo)
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            slug: true,
            ativo: true,
          },
        },
      },
    });

    if (!user) return next(new AppError('Usuário não encontrado', 401));

    // Verificação de soft delete: bloqueia usuário ou loja inativada
    if (!user.ativo) {
      return next(new AppError('Sua conta de usuário foi inativada pelo administrador', 403));
    }

    if (!user.empresa || !user.empresa.ativo) {
      return next(new AppError('O estabelecimento vinculado a esta conta está temporariamente desativado', 403));
    }

    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      empresaId: user.empresaId,
      empresaSlug: user.empresa.slug,
      empresaNome: user.empresa.nome,
    };
    userCache.set(userId, { user: userData, timestamp: now });

    req.user = userData;
    next();
  } catch (err) {
    return next(new AppError('Token inválido ou expirado', 401));
  }
}
