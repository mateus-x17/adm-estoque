// arquivo responsável por resolver e isolar o escopo de Organização e Loja (Multi-Organização + Multi-Filial).
// atua na camada de utilitários e regras de escopo multitenant do backend.
// tecnologias principais: Prisma ORM e PostgreSQL.
// usado por: todos os controllers para garantir que consultas e gravações respeitem estritamente as fronteiras da Organização e Filial.

// importações de banco de dados: prisma executa consultas nas tabelas Loja e Organizacao para validar a titularidade do escopo.
import { prisma } from "../config/prismaClient.js";
// importações de erros: AppError emite respostas com status 400, 401, 403 e 404 quando há violação de escopo.
import { AppError } from "./errorHandler.js";

// função responsável por verificar se uma string ou parâmetro representa o escopo global da rede ('all', 'todas', etc.).
//
// contexto: função auxiliar interna para diferenciar consultas pontuais de uma filial de consultas agregadas em toda a rede.
//
// parâmetros:
//   - raw (string|undefined|null, opcional): valor textual recebido na query, header ou corpo da requisição.
//
// retorno: booleano (true se for omitido ou corresponder a sinônimos de rede consolidada; false caso contrário).
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe raw (valor de entrada dinâmico).
// 2 - retorna true se raw for undefined ou null.
// 3 - converte para string, remove espaços e transforma para minúsculas.
// 4 - verifica se o valor normalizado pertence à lista de valores globais permitidos ("", "all", "todas", "todas-lojas", "undefined", "null").
// 5 - retorna o resultado booleano.
function isAllStoresValue(raw) {
  // 2 - valores vazios indicam escopo global por padrão
  if (raw === undefined || raw === null) return true;
  // 3 - normaliza texto
  const normalized = String(raw).trim().toLowerCase();
  // 4 e 5 - checa correspondência
  return ["", "all", "todas", "todas-lojas", "undefined", "null"].includes(normalized);
}

// função responsável por gerar um slug limpo e seguro para URLs a partir do nome de uma Organização ou Loja.
//
// contexto: invocada na criação e edição de lojas e organizações para gerar identificadores amigáveis.
//
// parâmetros:
//   - text (string, opcional): nome ou título original.
//
// retorno: string contendo apenas caracteres alfanuméricos minúsculos separados por hífen único.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe text (string).
// 2 - converte para string, normaliza acentuações Unicode e remove diacríticos.
// 3 - converte para minúsculas e remove caracteres especiais fora de [a-z0-9\s-].
// 4 - substitui sequências de espaços e hífens repetidos por um único hífen.
// 5 - remove hífens das extremidades e retorna o slug resultante.
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

// função responsável por resolver o escopo de leitura (GET) respeitando a organização locatária e o papel RBAC do usuário.
//
// contexto: invocada no início dos métodos de listagem e leitura dos controllers (ex.: listarProdutos, listarFornecedores).
//
// parâmetros:
//   - req (Request, obrigatório): requisição HTTP contendo req.user autenticado, query params e headers.
//   - explicitLojaId (number|string|null, opcional, padrão null): ID explícito de filial informado programaticamente.
//
// retorno: objeto de escopo contendo organizacaoId, lojaId (ou null para rede inteira), lojaSlug, lojaNome e a flag isNetworkWide.
// erros:
//   - AppError(401) se o usuário ou sua organizacaoId não estiverem presentes na sessão.
//   - AppError(403) se o colaborador não for ADMIN e não possuir loja vinculada.
//   - AppError(400) se o identificador de loja fornecido pelo ADMIN for inválido.
//   - AppError(404) se a loja informada não pertencer à organização do usuário.
// efeitos colaterais: realiza consulta no banco de dados com prisma.loja.findFirst para checar vínculo com a organização.
//
// passo a passo:
// 1 - recebe req e explicitLojaId.
// 2 - valida se req.user e req.user.organizacaoId existem; lança AppError(401) se ausentes.
// 3 - para colaboradores com papel diferente de ADMIN, trava estritamente na loja vinculada (req.user.lojaId) e retorna escopo individual.
// 4 - para ADMIN, analisa o candidato a filtro (explicitLojaId, query.lojaId ou header x-loja-id).
// 5 - se o candidato representar todas as lojas (isAllStoresValue), retorna escopo com lojaId = null e isNetworkWide = true.
// 6 - se o candidato for numérico, valida via prisma.loja.findFirst se a loja existe e pertence à mesma organizacaoId.
// 7 - se a loja não existir na organização, lança AppError(404) "Loja não encontrada nesta organização".
// 8 - retorna o objeto com o escopo validado da loja específica.
export async function resolveReadScope(req, explicitLojaId = null) {
  // 2 - valida usuário autenticado e organização
  const user = req.user;
  if (!user || !user.organizacaoId) {
    throw new AppError("Organização não identificada na sessão", 401);
  }

  const organizacaoId = Number(user.organizacaoId);

  // 3 - colaboradores comuns não podem visualizar dados fora da sua filial
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

  // 4 - extrai identificador solicitado pelo ADMIN
  const candidate =
    explicitLojaId !== null && explicitLojaId !== undefined
      ? explicitLojaId
      : req.query?.lojaId ?? req.headers?.["x-loja-id"];

  // 5 - escopo consolidado da rede
  if (isAllStoresValue(candidate)) {
    return {
      organizacaoId,
      lojaId: null,
      lojaSlug: null,
      lojaNome: "Todas as Lojas",
      isNetworkWide: true,
    };
  }

  // 6 - validação do ID numérico
  const parsedLojaId = Number(candidate);
  if (isNaN(parsedLojaId) || parsedLojaId <= 0) {
    throw new AppError("Identificador de loja inválido", 400);
  }

  // 7 - consulta a filial exigindo correspondência com a organização
  const loja = await prisma.loja.findFirst({
    where: { id: parsedLojaId, organizacaoId },
    select: { id: true, nome: true, slug: true, ativo: true },
  });

  if (!loja) {
    throw new AppError("Loja não encontrada nesta organização", 404);
  }

  // 8 - devolve escopo resolvido
  return {
    organizacaoId,
    lojaId: loja.id,
    lojaSlug: loja.slug,
    lojaNome: loja.nome,
    lojaAtiva: loja.ativo,
    isNetworkWide: false,
  };
}

// função responsável por resolver e validar a loja destino para operações de escrita (criação, edição, importação e pedidos).
//
// contexto: invocada por métodos de gravação nos controllers para garantir que lançamentos ocorram apenas em lojas ativas do tenant.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo usuário autenticado, corpo da requisição, query e headers.
//   - explicitLojaId (number|string|null, opcional, padrão null): ID de filial fornecido programaticamente.
//
// retorno: objeto contendo organizacaoId, lojaId, lojaSlug e lojaNome da filial validada.
// erros:
//   - AppError(401) se a organização não estiver na sessão.
//   - AppError(403) se o colaborador não possuir loja ou se sua loja estiver inativa.
//   - AppError(400) se o ID de loja for inválido ou se a loja estiver inativa.
//   - AppError(404) se a loja informada não pertencer à organização.
//   - AppError(400) se o ADMIN estiver em visualização global e houver mais de uma loja ativa na organização sem seleção explícita.
// efeitos colaterais: realiza consultas com prisma.loja.findFirst e prisma.loja.findMany.
//
// passo a passo:
// 1 - recebe req e explicitLojaId.
// 2 - valida presença de req.user e req.user.organizacaoId; lança AppError(401) se ausente.
// 3 - para colaboradores (não-ADMIN), consulta sua loja vinculada e lança AppError(403) caso esteja inativa ou desativada.
// 4 - para ADMIN com loja candidata especificada, valida existência e se ativo = true; lança AppError(400) caso esteja inativa.
// 5 - para ADMIN sem loja informada ('all'), consulta quantas lojas ativas existem na organização via prisma.loja.findMany com take: 2.
// 6 - se houver exatamente 1 loja ativa, seleciona-a automaticamente por conveniência operacional.
// 7 - se houver mais de uma loja ativa ou nenhuma, lança AppError(400) exigindo a seleção de uma loja específica para gravação.
export async function resolveWriteStore(req, explicitLojaId = null) {
  // 2 - valida usuário e organização
  const user = req.user;
  if (!user || !user.organizacaoId) {
    throw new AppError("Organização não identificada na sessão", 401);
  }

  const organizacaoId = Number(user.organizacaoId);

  // 3 - validação de filial para não-ADMIN
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

  // 4 - extrai identificador enviado para escrita
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

  // 5 e 6 - resolução automática caso a organização possua uma única loja ativa
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

  // 7 - exige seleção explícita se houver múltiplas filiais
  throw new AppError(
    "Selecione uma loja específica para concluir esta operação (você está visualizando Todas as Lojas).",
    400
  );
}
