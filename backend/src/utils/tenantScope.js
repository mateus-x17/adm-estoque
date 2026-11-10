import { prisma } from "../config/prismaClient.js";
import { AppError } from "./errorHandler.js";

// arquivo responsável por resolver e isolar o escopo de Organização e Loja (Multi-Organização + Multi-Filial)

// função auxiliar para interpretar texto ou cabeçalho indicando escopo global da rede ('all' / 'todas')
// 1 - Verifica se o valor foi omitido ou representa seleção consolidada da organização
function isAllStoresValue(raw) {
  if (raw === undefined || raw === null) return true;
  const normalized = String(raw).trim().toLowerCase();
  return ["", "all", "todas", "todas-lojas", "undefined", "null"].includes(normalized);
}

// função para gerar slug limpo e padronizado a partir de nome de Organização ou Loja
// 1 - Remove acentos e caracteres especiais mantendo apenas letras minúsculas, números e hífens
export function generateSlug(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// função para resolver o escopo de leitura (GET) respeitando organização e papel RBAC
// 1 - GERENTE e OPERADOR ficam travados na própria loja (req.user.lojaId), ignorando headers/queries forjadas
// 2 - ADMIN pode ler toda a sua Organização ('all') ou filtrar por uma loja específica pertencente à mesma Organização
// 3 - Qualquer tentativa de informar lojaId de outra Organização resulta em 404 Not Found
export async function resolveReadScope(req, explicitLojaId = null) {
  const user = req.user;
  if (!user || !user.organizacaoId) {
    throw new AppError("Organização não identificada na sessão", 401);
  }

  const organizacaoId = Number(user.organizacaoId);

  if (user.role !== "ADMIN") {
    if (!user.lojaId) {
      throw new AppError("Colaborador não possui loja vinculada", 403);
    }
    return {
      organizacaoId,
      lojaId: Number(user.lojaId),
      lojaSlug: user.lojaSlug,
      lojaNome: user.lojaNome,
      isNetworkWide: false,
    };
  }

  const candidate =
    explicitLojaId !== null && explicitLojaId !== undefined
      ? explicitLojaId
      : req.query?.lojaId ?? req.headers?.["x-loja-id"];

  if (isAllStoresValue(candidate)) {
    return {
      organizacaoId,
      lojaId: null,
      lojaSlug: null,
      lojaNome: "Todas as Lojas",
      isNetworkWide: true,
    };
  }

  const parsedLojaId = Number(candidate);
  if (isNaN(parsedLojaId) || parsedLojaId <= 0) {
    throw new AppError("Identificador de loja inválido", 400);
  }

  const loja = await prisma.loja.findFirst({
    where: { id: parsedLojaId, organizacaoId },
    select: { id: true, nome: true, slug: true, ativo: true },
  });

  if (!loja) {
    throw new AppError("Loja não encontrada nesta organização", 404);
  }

  return {
    organizacaoId,
    lojaId: loja.id,
    lojaSlug: loja.slug,
    lojaNome: loja.nome,
    lojaAtiva: loja.ativo,
    isNetworkWide: false,
  };
}

// função para resolver e validar a loja alvo em operações de escrita (POST/PUT/PATCH/Import/Pedidos)
// 1 - Para GERENTE e OPERADOR, trava na loja ativa vinculada ao colaborador
// 2 - Para ADMIN, aceita lojaId explícito (body/query/header X-Loja-Id); se omitido e houver exatamente 1 loja ativa na rede, usa-a automaticamente
// 3 - Impede gravações operacionais em lojas inativas (400/403) ou pertencentes a outra organização (404)
export async function resolveWriteStore(req, explicitLojaId = null) {
  const user = req.user;
  if (!user || !user.organizacaoId) {
    throw new AppError("Organização não identificada na sessão", 401);
  }

  const organizacaoId = Number(user.organizacaoId);

  if (user.role !== "ADMIN") {
    if (!user.lojaId) {
      throw new AppError("Colaborador não possui loja vinculada", 403);
    }
    const loja = await prisma.loja.findFirst({
      where: { id: Number(user.lojaId), organizacaoId },
      select: { id: true, nome: true, slug: true, ativo: true },
    });
    if (!loja || !loja.ativo) {
      throw new AppError("A loja vinculada está desativada para esta operação", 403);
    }
    return {
      organizacaoId,
      lojaId: loja.id,
      lojaSlug: loja.slug,
      lojaNome: loja.nome,
    };
  }

  const candidate =
    explicitLojaId !== null && explicitLojaId !== undefined
      ? explicitLojaId
      : req.body?.lojaId ?? req.query?.lojaId ?? req.headers?.["x-loja-id"];

  if (!isAllStoresValue(candidate)) {
    const parsedLojaId = Number(candidate);
    if (isNaN(parsedLojaId) || parsedLojaId <= 0) {
      throw new AppError("Identificador de loja inválido", 400);
    }

    const loja = await prisma.loja.findFirst({
      where: { id: parsedLojaId, organizacaoId },
      select: { id: true, nome: true, slug: true, ativo: true },
    });
    if (!loja) {
      throw new AppError("Loja não encontrada nesta organização", 404);
    }
    if (!loja.ativo) {
      throw new AppError(`A loja "${loja.nome}" está inativa e não aceita novos lançamentos`, 400);
    }
    return {
      organizacaoId,
      lojaId: loja.id,
      lojaSlug: loja.slug,
      lojaNome: loja.nome,
    };
  }

  // Admin em escopo 'all': se a organização só possui 1 loja ativa, resolve automaticamente por conveniência
  const activeStores = await prisma.loja.findMany({
    where: { organizacaoId, ativo: true },
    select: { id: true, nome: true, slug: true },
    take: 2,
  });

  if (activeStores.length === 1) {
    return {
      organizacaoId,
      lojaId: activeStores[0].id,
      lojaSlug: activeStores[0].slug,
      lojaNome: activeStores[0].nome,
    };
  }

  throw new AppError(
    "Selecione uma loja específica para concluir esta operação (você está visualizando Todas as Lojas).",
    400
  );
}

