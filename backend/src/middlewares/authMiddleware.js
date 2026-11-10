import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";

// arquivo responsável por validar JWT, carregar o contexto de Organização/Loja com cache em memória e bloquear acessos inválidos

const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 segundos

// função para invalidar o cache de autenticação de um usuário específico ou de toda a aplicação
// 1 - Se userId for informado, limpa apenas a entrada correspondente (ex: transferência de loja ou exclusão)
// 2 - Se omitido, limpa todo o cache (ex: desativação de loja ou organização)
export function invalidateUserCache(userId = null) {
  if (userId) {
    userCache.delete(Number(userId));
  } else {
    userCache.clear();
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of userCache.entries()) {
    if (now - entry.timestamp > USER_CACHE_TTL_MS) {
      userCache.delete(id);
    }
  }
}, 30 * 1000).unref();

// middleware para autenticar requisições protegidas e injetar req.user com escopo de Organização e Loja
// 1 - Extrai o Bearer Token e valida assinatura JWT
// 2 - Tenta recuperar do cache local (TTL 60s) para evitar latência repetitiva ao Neon
// 3 - Em cache miss, valida existência do usuário (sem soft delete em Usuario) e status ativo de Organizacao e Loja
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError("Token não fornecido", 401));

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.id);

    const now = Date.now();
    const cached = userCache.get(userId);
    if (cached && now - cached.timestamp < USER_CACHE_TTL_MS) {
      req.user = cached.user;
      return next();
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
        organizacaoId: true,
        lojaId: true,
        organizacao: {
          select: {
            id: true,
            nome: true,
            slug: true,
            ativo: true,
          },
        },
        loja: {
          select: {
            id: true,
            nome: true,
            slug: true,
            ativo: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError("Usuário não encontrado ou conta removida", 401));
    }

    if (!user.organizacao || !user.organizacao.ativo) {
      return next(new AppError("A organização vinculada a esta conta está desativada", 403));
    }

    if (user.role !== "ADMIN" && (!user.loja || !user.loja.ativo)) {
      return next(
        new AppError("A loja vinculada a esta conta está inativa ou indisponível", 403)
      );
    }

    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      imagem: user.imagem,
      organizacaoId: user.organizacaoId,
      organizacaoSlug: user.organizacao.slug,
      organizacaoNome: user.organizacao.nome,
      lojaId: user.lojaId,
      lojaSlug: user.loja?.slug || null,
      lojaNome: user.loja?.nome || null,
    };

    userCache.set(userId, { user: userData, timestamp: now });
    req.user = userData;
    next();
  } catch (err) {
    return next(new AppError("Token inválido ou expirado", 401));
  }
}
