// arquivo responsável por validar JWT com algoritmo restrito, carregar contexto de Organização/Loja em cache e bloquear acessos inativos ou suspensos usando Prisma e jsonwebtoken.
import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { formatMatricula } from "../utils/matriculaHelper.js";

const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 segundos

// função responsável por invalidar o cache de autenticação de um usuário específico ou de toda a aplicação.
//
// 1 - recebe userId (number|null opcional) identificando o usuário alterado.
// 2 - remove apenas a entrada específica do userCache se userId for informado.
// 3 - limpa todo o userCache se userId for omitido (ex.: inativação de loja ou organização).
// 4 - não retorna valor.
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

// função responsável por autenticar requisições protegidas via Bearer JWT e injetar req.user com escopo de Organização e Loja.
//
// 1 - recebe req (Request), res (Response) e next (NextFunction).
// 2 - valida o formato Bearer no cabeçalho authorization e verifica assinatura JWT exclusivamente via HS256.
// 3 - verifica se o ID extraído do payload é inteiro positivo válido e tenta resolver pelo cache em memória (TTL 60s).
// 4 - consulta o usuário no banco via prisma.usuario.findUnique validando existência, situação trabalhista, organização e loja ativas.
// 5 - armazena o contexto em userCache, atribui req.user e chama next() ou encaminha AppError apropriado.
export async function authMiddleware(req, res, next) {
  // 2 - valida formato Bearer e decodifica token restrito a HS256
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError("Token não fornecido", 401));

  const bearerMatch = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  if (!bearerMatch) return next(new AppError("Formato de token inválido", 401));

  const token = bearerMatch[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return next(new AppError("Token inválido ou expirado", 401));
  }

  // 3 - valida integridade do userId no payload e tenta leitura no cache
  const userId = Number(payload?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return next(new AppError("Token inválido", 401));
  }

  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && now - cached.timestamp < USER_CACHE_TTL_MS) {
    req.user = cached.user;
    return next();
  }

  // 4 - valida usuário, situação funcional, organização e loja diretamente no banco
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        matricula: true,
        telefone: true,
        situacao: true,
        dataAdmissao: true,
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

    if (user.situacao === "SUSPENSO") {
      return next(
        new AppError("Matrícula suspensa temporariamente. Procure o administrador.", 403)
      );
    }

    if (user.situacao === "FERIAS") {
      return next(
        new AppError("Acesso pausado: colaborador em período de férias.", 403)
      );
    }

    if (!user.organizacao || !user.organizacao.ativo) {
      return next(new AppError("A organização vinculada a esta conta está desativada", 403));
    }

    if (user.role !== "ADMIN" && (!user.loja || !user.loja.ativo)) {
      return next(
        new AppError("A loja vinculada a esta conta está inativa ou indisponível", 403)
      );
    }

    // 5 - persiste no cache de sessão e libera continuação da rota
    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      matricula: user.matricula || formatMatricula(user.id),
      telefone: user.telefone,
      situacao: user.situacao,
      dataAdmissao: user.dataAdmissao,
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
    return next(err);
  }
}
