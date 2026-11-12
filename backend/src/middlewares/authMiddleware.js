// arquivo responsável por validar JWT com algoritmo restrito, carregar contexto de Organização/Loja em cache e bloquear acessos inativos ou suspensos.
// atua na camada de middlewares de autenticação e proteção de rotas do backend.
// tecnologias principais: jsonwebtoken, Prisma ORM e Map em memória com TTL.
// usado por: todas as rotas protegidas da API para assegurar identidade e tenant do usuário logado.

// importações de segurança e tokens: jwt é a biblioteca para verificação da assinatura HS256 do token Bearer.
import jwt from "jsonwebtoken";
// importações de banco de dados: prisma consulta o registro do usuário, organização e loja.
import { prisma } from "../config/prismaClient.js";
// importações de erros: AppError emite status HTTP 401 (não autorizado) ou 403 (proibido/suspenso).
import { AppError } from "../utils/errorHandler.js";
// importações de utilitários: formatMatricula gera a matrícula padronizada caso não esteja salva no banco.
import { formatMatricula } from "../utils/matriculaHelper.js";

// cache em memória para armazenar a sessão de usuários ativos e evitar consultas repetitivas ao banco a cada requisição HTTP
const userCache = new Map();
// tempo de vida do cache em memória (60 segundos)
const USER_CACHE_TTL_MS = 60 * 1000;

// rotina periódica em segundo plano para purgar entradas de cache expiradas
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of userCache.entries()) {
    if (now - entry.timestamp > USER_CACHE_TTL_MS) {
      userCache.delete(id);
    }
  }
}, 30 * 1000).unref();

// função responsável por invalidar o cache de autenticação de um usuário específico ou de toda a aplicação.
//
// contexto: invocada por userService e storeService quando um usuário tem seus dados, perfil, filial ou situação alterados.
//
// parâmetros:
//   - userId (number|string|null, opcional, padrão null): identificador único do usuário que sofreu alteração; se nulo, limpa todo o cache.
//
// retorno: nenhum (função síncrona de purga de memória).
// erros: nenhum.
// efeitos colaterais: remove chaves do mapa userCache em memória.
//
// passo a passo:
// 1 - recebe userId (opcional).
// 2 - se userId for informado, remove apenas a entrada correspondente com userCache.delete(Number(userId)).
// 3 - se userId for omitido ou nulo, limpa todas as entradas do cache com userCache.clear().
export function invalidateUserCache(userId = null) {
  // 2 - remove usuário individual
  if (userId) {
    userCache.delete(Number(userId));
  } else {
    // 3 - limpa todo o cache de autenticação
    userCache.clear();
  }
}

// função responsável por autenticar requisições protegidas via Bearer JWT e injetar req.user com escopo de Organização e Loja.
//
// contexto: registrado como primeiro middleware em todas as rotas protegidas da API (produtos, pedidos, usuários, etc.).
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo os cabeçalhos HTTP (especialmente authorization).
//   - res (Response, obrigatório): resposta HTTP do Express.
//   - next (NextFunction, obrigatório): função de prosseguimento da cadeia do Express.
//
// retorno: nenhum (chama next() em caso de sucesso ou repassa erro ao errorHandler).
// erros:
//   - AppError(401) se o token não for fornecido, tiver formato inválido ou estiver expirado.
//   - AppError(401) se o usuário não for encontrado no banco de dados.
//   - AppError(403) se a matrícula estiver suspensa (SUSPENSO) ou de férias (FERIAS).
//   - AppError(403) se a organização ou a loja vinculada ao colaborador estiver inativa.
// efeitos colaterais: atribui o objeto de sessão em req.user e armazena em userCache por 60 segundos.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai o cabeçalho authorization e valida o padrão 'Bearer <token>'; lança 401 se ausente ou inválido.
// 3 - decodifica e verifica a assinatura do token via jwt.verify restringindo exclusivamente ao algoritmo HS256.
// 4 - valida se o userId contido no payload é um inteiro positivo.
// 5 - consulta o cache em memória; se válido (menos de 60s), injeta req.user e chama next().
// 6 - caso não esteja em cache, busca o usuário, organização e loja via prisma.usuario.findUnique.
// 7 - valida existência do usuário e bloqueia matrículas em situação SUSPENSO ou FERIAS com status 403.
// 8 - valida se a organização do usuário e sua loja (para colaboradores não-ADMIN) estão com ativo = true.
// 9 - salva o contexto sanitizado no userCache, atribui a req.user e chama next() autorizando a requisição.
export async function authMiddleware(req, res, next) {
  // 2 - extrai cabeçalho authorization e valida formato Bearer
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError("Token não fornecido", 401));

  const bearerMatch = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  if (!bearerMatch) return next(new AppError("Formato de token inválido", 401));

  // 3 - decodifica e valida token JWT
  const token = bearerMatch[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return next(new AppError("Token inválido ou expirado", 401));
  }

  // 4 - valida ID do usuário
  const userId = Number(payload?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return next(new AppError("Token inválido", 401));
  }

  // 5 - aproveita cache em memória se recente
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && now - cached.timestamp < USER_CACHE_TTL_MS) {
    req.user = cached.user;
    return next();
  }

  // 6 - busca dados cadastrais no banco
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

    // 7 - valida existência e situações de bloqueio funcional
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

    // 8 - valida se a organização e filial estão ativas
    if (!user.organizacao || !user.organizacao.ativo) {
      return next(new AppError("A organização vinculada a esta conta está desativada", 403));
    }

    if (user.role !== "ADMIN" && (!user.loja || !user.loja.ativo)) {
      return next(
        new AppError("A loja vinculada a esta conta está inativa ou indisponível", 403)
      );
    }

    // 9 - monta contexto de sessão seguro, armazena em cache e prossegue
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
