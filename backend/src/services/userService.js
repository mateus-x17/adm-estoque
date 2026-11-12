// arquivo responsável por gerenciar regras de negócio, ciclo de vida, matrícula, situação funcional, transferências e demissão com relatório de usuários.
// atua na camada de serviços (services) do backend.
// tecnologias principais: bcryptjs, Prisma Client, PostgreSQL, Cloudinary, JavaScript ES Modules.
// usado por: userController.js para atender cadastro, edição, consulta, paginação, transferência de loja, afastamento e demissão de colaboradores.

// importações de bibliotecas de criptografia de senhas:
// bcrypt realiza o hash unidirecional seguro de senhas com salting.
import bcrypt from "bcryptjs";

// importações de clientes de infraestrutura e banco de dados:
// prisma provê comunicação direta com o banco relacional para operações nas tabelas Usuario, RegistroDesligamento, Pedido e Movimento.
import { prisma } from "../config/prismaClient.js";

// importações de utilitários de erros e sanitização:
// AppError padroniza lançamento de erros com status HTTP; sanitizeUser e sanitizeUsers removem campos confidenciais como hash de senha; cleanupStoredMedia remove avatares obsoletos.
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitizers.js";
import { cleanupStoredMedia } from "../config/cloudinaryConfig.js";

// importações de middlewares para efeitos colaterais de cache:
// invalidateUserCache invalida tokens e sessões ativas em memória após alterações cadastrais ou funcionais de colaboradores.
import { invalidateUserCache } from "../middlewares/authMiddleware.js";

// importações de utilitários funcionais para gestão de matrículas e demissões:
// formatMatricula, formatMatriculaDisplay, parseMatriculaSearch, parseDismissalDate e buildDismissalReportPayload tratam códigos, buscas e relatórios consolidados.
import {
  formatMatricula,
  formatMatriculaDisplay,
  parseMatriculaSearch,
  parseDismissalDate,
  buildDismissalReportPayload,
} from "../utils/matriculaHelper.js";

// lista de situações funcionais válidas para colaboradores em atividade no sistema:
// ATIVO: acesso liberado; SUSPENSO: login bloqueado temporariamente; FERIAS: acesso pausado durante recesso.
const VALID_SITUATIONS = ["ATIVO", "SUSPENSO", "FERIAS"];

// projeção de campos públicos seguros da entidade Usuario para consultas no Prisma:
// omite propositalmente a coluna senha para prevenir vazamento de credenciais na camada de dados.
const USER_PUBLIC_SELECT = {
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
  createdAt: true,
  updatedAt: true,
  loja: {
    select: { id: true, nome: true, slug: true, ativo: true },
  },
  organizacao: {
    select: { id: true, nome: true, slug: true },
  },
};

// função responsável por validar se uma loja informada existe, está ativa e pertence à organização para atribuição a colaborador.
//
// contexto: invocada internamente por createUser, updateUser e transferUserStore para garantir integridade multi-tenant na alocação de equipe.
//
// parâmetros:
//   - role (string, obrigatório): perfil do usuário ('ADMIN', 'GERENTE' ou 'OPERADOR').
//   - rawLojaId (número ou string, opcional): identificador da loja pretendida enviado na requisição.
//   - organizacaoId (número ou string, obrigatório): identificador da organização dona do recurso.
//
// retorno: número com o identificador da loja validada ou null quando o perfil for ADMIN.
// erros: AppError (400) se loja for inválida, inativa ou omitida para colaboradores operacionais; AppError (404) se a loja não existir na organização.
// efeitos colaterais: realiza consulta de leitura na tabela Loja do banco de dados.
//
// passo a passo:
// 1 - recebe role (string), rawLojaId (número ou string) e organizacaoId (número ou string).
// 2 - retorna null antecipadamente caso o perfil seja ADMIN pois administradores atuam globalmente em toda a rede.
// 3 - avalia se o identificador da loja foi informado explicitamente na chamada.
// 4 - caso não tenha sido informado, verifica se a organização possui apenas uma única filial ativa atribuindo-a automaticamente.
// 5 - lança AppError (400) se houver múltiplas filiais e nenhuma tiver sido especificada para o colaborador.
// 6 - consulta a loja no banco pelo identificador e organizacaoId garantindo seu pertencimento.
// 7 - lança AppError (404) caso a loja não exista ou AppError (400) caso esteja com status inativo.
// 8 - retorna o identificador numérico da loja validada.
async function resolveAssignedStoreId(role, rawLojaId, organizacaoId) {
  // 1 - recebe role (string), rawLojaId (número ou string) e organizacaoId (número ou string).
  // 2 - retorna null antecipadamente caso o perfil seja ADMIN pois administradores atuam globalmente em toda a rede.
  if (role === "ADMIN") return null;

  // 3 - avalia se o identificador da loja foi informado explicitamente na chamada.
  const hasExplicit =
    rawLojaId !== undefined && rawLojaId !== null && rawLojaId !== "" && rawLojaId !== "null";

  // 4 - caso não tenha sido informado, verifica se a organização possui apenas uma única filial ativa atribuindo-a automaticamente.
  if (!hasExplicit) {
    const stores = await prisma.loja.findMany({
      where: { organizacaoId: Number(organizacaoId), ativo: true },
      select: { id: true },
      take: 2,
    });
    if (stores.length === 1) return stores[0].id;
    // 5 - lança AppError (400) se houver múltiplas filiais e nenhuma tiver sido especificada para o colaborador.
    throw new AppError("Selecione a loja de atuação para colaboradores GERENTE ou OPERADOR", 400);
  }

  const parsedLojaId = Number(rawLojaId);
  if (isNaN(parsedLojaId) || parsedLojaId <= 0) {
    throw new AppError("Loja selecionada inválida", 400);
  }

  // 6 - consulta a loja no banco pelo identificador e organizacaoId garantindo seu pertencimento.
  const loja = await prisma.loja.findFirst({
    where: { id: parsedLojaId, organizacaoId: Number(organizacaoId) },
    select: { id: true, nome: true, ativo: true },
  });

  // 7 - lança AppError (404) caso a loja não exista ou AppError (400) caso esteja com status inativo.
  if (!loja) {
    throw new AppError("Loja não encontrada nesta organização", 404);
  }
  if (!loja.ativo) {
    throw new AppError(`A loja "${loja.nome}" está desativada e não aceita novos colaboradores`, 400);
  }

  // 8 - retorna o identificador numérico da loja validada.
  return loja.id;
}

// função responsável por criar novo colaborador ou administrador na organização com geração automática de matrícula.
//
// contexto: invocada por userController.js na rota POST /api/users restrita a administradores.
//
// parâmetros:
//   - data (objeto, obrigatório): dados cadastrais (nome, email, senha, role, lojaId, telefone, situacao, dataAdmissao).
//   - imagePath (string, opcional, padrão null): endereço remoto ou relativo do avatar do colaborador.
//   - organizacaoId (número ou string, obrigatório): identificador da organização contratante.
//
// retorno: objeto do usuário recém-criado sanitizado sem o hash da senha e com matrícula formatada inclusa.
// erros: AppError (400) para campos obrigatórios faltantes, senha menor que 6 caracteres, e-mail duplicado ou perfil inválido.
// efeitos colaterais: insere novo registro na tabela Usuario em transação atômica gerando a matrícula.
//
// passo a passo:
// 1 - recebe data (objeto obrigatório), imagePath (string opcional) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - valida a presença de nome, email, senha e exige comprimento mínimo de seis caracteres para a senha.
// 4 - normaliza email e verifica no banco se já existe outro colaborador registrado com o mesmo e-mail na organização.
// 5 - normaliza e valida o perfil funcional (ADMIN, GERENTE ou OPERADOR) e a situação (ATIVO, SUSPENSO ou FERIAS).
// 6 - resolve a loja de vínculo via resolveAssignedStoreId e gera o hash seguro da senha com bcrypt.
// 7 - executa transação no banco criando o registro do usuário e atualizando com a matrícula formatada derivada do id.
// 8 - retorna o objeto do usuário sanitizado sem o hash da senha.
export async function createUser(data, imagePath = null, organizacaoId) {
  // 1 - recebe data (objeto obrigatório), imagePath (string opcional) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - valida a presença de nome, email, senha e exige comprimento mínimo de seis caracteres para a senha.
  const { nome, email, senha, role, lojaId, telefone, situacao, dataAdmissao } = data;
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
  }
  if (String(senha).length < 6) {
    throw new AppError("A senha deve conter pelo menos 6 caracteres", 400);
  }

  // 4 - normaliza email e verifica no banco se já existe outro colaborador registrado com o mesmo e-mail na organização.
  const normalizedEmail = email.trim().toLowerCase();
  const orgIdNum = Number(organizacaoId);

  const existing = await prisma.usuario.findUnique({
    where: {
      organizacaoId_email: {
        organizacaoId: orgIdNum,
        email: normalizedEmail,
      },
    },
  });
  if (existing) {
    throw new AppError("Este e-mail já está cadastrado em sua organização", 400);
  }

  // 5 - normaliza e valida o perfil funcional (ADMIN, GERENTE ou OPERADOR) e a situação (ATIVO, SUSPENSO ou FERIAS).
  const normalizedRole = role ? String(role).toUpperCase() : "OPERADOR";
  if (!["ADMIN", "GERENTE", "OPERADOR"].includes(normalizedRole)) {
    throw new AppError("Role inválida. Deve ser ADMIN, GERENTE ou OPERADOR", 400);
  }

  const normalizedSituation = situacao ? String(situacao).toUpperCase() : "ATIVO";
  if (!VALID_SITUATIONS.includes(normalizedSituation)) {
    throw new AppError("Situação inválida. Use ATIVO, SUSPENSO ou FERIAS", 400);
  }

  // 6 - resolve a loja de vínculo via resolveAssignedStoreId e gera o hash seguro da senha com bcrypt.
  const assignedLojaId = await resolveAssignedStoreId(normalizedRole, lojaId, orgIdNum);
  const hashed = await bcrypt.hash(senha, 10);
  const parsedAdmission = dataAdmissao ? new Date(dataAdmissao) : new Date();

  // 7 - executa transação no banco criando o registro do usuário e atualizando com a matrícula formatada derivada do id.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.usuario.create({
      data: {
        nome: nome.trim(),
        email: normalizedEmail,
        senha: hashed,
        telefone: telefone ? String(telefone).trim() : null,
        situacao: normalizedSituation,
        dataAdmissao: isNaN(parsedAdmission.getTime()) ? new Date() : parsedAdmission,
        role: normalizedRole,
        imagem: imagePath,
        organizacaoId: orgIdNum,
        lojaId: assignedLojaId,
      },
    });

    return tx.usuario.update({
      where: { id: created.id },
      data: { matricula: formatMatricula(created.id) },
      select: USER_PUBLIC_SELECT,
    });
  });

  // 8 - retorna o objeto do usuário sanitizado sem o hash da senha.
  return sanitizeUser(user);
}

// função responsável por mapear uma entidade de registro de desligamento para a mesma estrutura da listagem de usuários.
//
// contexto: invocada internamente por listUsers para unificar a apresentação de ex-colaboradores demitidos na listagem de RH.
//
// parâmetros:
//   - reg (objeto, obrigatório): registro histórico recuperado da tabela RegistroDesligamento.
//
// retorno: objeto formatado com situação DESLIGADO, matrículaCancelada true e dados de admissão e demissão preservados.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe reg (objeto obrigatório) com os dados da demissão.
// 2 - formata a matrícula do colaborador desligado a partir do valor registrado ou do vendedorRefId.
// 3 - monta o objeto padronizado com identificador, situação DESLIGADO, flag de cancelamento e datas de atuação.
// 4 - retorna o objeto estruturado compatível com a visualização de colaboradores.
function mapDismissedToUserItem(reg) {
  // 1 - recebe reg (objeto obrigatório) com os dados da demissão.
  // 2 - formata a matrícula do colaborador desligado a partir do valor registrado ou do vendedorRefId.
  const mat = reg.matricula || formatMatricula(reg.vendedorRefId);

  // 3 - monta o objeto padronizado com identificador, situação DESLIGADO, flag de cancelamento e datas de atuação.
  // 4 - retorna o objeto estruturado compatível com a visualização de colaboradores.
  return {
    id: reg.vendedorRefId,
    vendedorRefId: reg.vendedorRefId,
    nome: reg.nome,
    email: reg.email,
    telefone: reg.telefone || null,
    matricula: mat,
    matriculaCancelada: true,
    matriculaDisplay: formatMatriculaDisplay(reg.vendedorRefId, mat, true),
    situacao: "DESLIGADO",
    excluido: true,
    role: reg.role,
    imagem: null,
    organizacaoId: reg.organizacaoId,
    lojaId: reg.lojaId || null,
    loja: reg.lojaNome ? { id: reg.lojaId, nome: reg.lojaNome } : null,
    dataAdmissao: reg.dataAdmissao,
    dataDemissao: reg.dataDemissao,
    dataTermino: reg.dataDemissao,
    motivo: reg.motivo || null,
    createdAt: reg.createdAt,
  };
}

// função responsável por listar usuários da organização com paginação e filtros por matrícula, cargo, filial e situação funcional.
//
// contexto: invocada por userController.js na rota GET /api/users para gestão de equipe no painel do administrador.
//
// parâmetros:
//   - filters (objeto, obrigatório): filtros de consulta (organizacaoId, lojaId, page, limit, search, role, situacao, includeDismissed).
//
// retorno: objeto contendo a lista data de colaboradores (ativos e/ou desligados) e metadados de paginação.
// erros: AppError (400) se organizacaoId não for fornecido.
// efeitos colaterais: realiza consultas nas tabelas Usuario e RegistroDesligamento do banco de dados.
//
// passo a passo:
// 1 - recebe filters (objeto obrigatório) contendo organizacaoId e parâmetros opcionais.
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - normaliza limites e paginação com valores padrão seguros.
// 4 - interpreta termos de busca para matrícula, nome, e-mail ou telefone via parseMatriculaSearch.
// 5 - avalia a solicitação de filtro de situação distinguindo colaboradores ativos, desligados ou listagem completa unificada.
// 6 - consulta a tabela RegistroDesligamento caso a busca filtre exclusivamente colaboradores desligados.
// 7 - executa consultas paralelas unificando colaboradores ativos e desligados quando solicitado filtro global de equipe.
// 8 - consulta a tabela Usuario para o fluxo padrão de colaboradores ativos no sistema.
// 9 - retorna objeto estruturado com a lista sanitizada de colaboradores e metadados de paginação.
export async function listUsers({
  organizacaoId,
  lojaId = null,
  page = 1,
  limit = 10,
  search = "",
  role = "",
  situacao = "",
  includeDismissed = "",
}) {
  // 1 - recebe filters (objeto obrigatório) contendo organizacaoId e parâmetros opcionais.
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - normaliza limites e paginação com valores padrão seguros.
  const orgIdNum = Number(organizacaoId);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  // 4 - interpreta termos de busca para matrícula, nome, e-mail ou telefone via parseMatriculaSearch.
  const parsedMat = parseMatriculaSearch(search);
  const trimmedSearch = parsedMat.raw;

  const parsedLojaFilter =
    lojaId && !["todos", "all", "todas", "null", "undefined"].includes(String(lojaId))
      ? Number(lojaId)
      : null;

  // 5 - avalia a solicitação de filtro de situação distinguindo colaboradores ativos, desligados ou listagem completa unificada.
  const upperSit = situacao ? String(situacao).toUpperCase() : "";
  const wantsOnlyDismissed = upperSit === "DESLIGADO";
  const wantsBothActiveAndDismissed =
    upperSit === "TODOS" || String(includeDismissed).toLowerCase() === "true";

  const normalizedSit = VALID_SITUATIONS.includes(upperSit) ? upperSit : null;
  const normalizedRole =
    role && role !== "todos" ? String(role).toUpperCase() : null;

  const activeWhere = {
    AND: [
      { organizacaoId: orgIdNum },
      parsedLojaFilter && !isNaN(parsedLojaFilter) ? { lojaId: parsedLojaFilter } : {},
      normalizedSit ? { situacao: normalizedSit } : {},
      trimmedSearch
        ? {
            OR: [
              { nome: { contains: trimmedSearch, mode: "insensitive" } },
              { email: { contains: trimmedSearch, mode: "insensitive" } },
              { telefone: { contains: trimmedSearch, mode: "insensitive" } },
              { matricula: { contains: trimmedSearch, mode: "insensitive" } },
              ...(parsedMat.numericId ? [{ id: parsedMat.numericId }] : []),
            ],
          }
        : {},
      normalizedRole ? { role: normalizedRole } : {},
    ],
  };

  const dismissedWhere = {
    AND: [
      { organizacaoId: orgIdNum },
      parsedLojaFilter && !isNaN(parsedLojaFilter) ? { lojaId: parsedLojaFilter } : {},
      trimmedSearch
        ? {
            OR: [
              { nome: { contains: trimmedSearch, mode: "insensitive" } },
              { email: { contains: trimmedSearch, mode: "insensitive" } },
              { telefone: { contains: trimmedSearch, mode: "insensitive" } },
              { matricula: { contains: trimmedSearch, mode: "insensitive" } },
              ...(parsedMat.numericId ? [{ vendedorRefId: parsedMat.numericId }] : []),
            ],
          }
        : {},
      normalizedRole ? { role: normalizedRole } : {},
    ],
  };

  // 6 - consulta a tabela RegistroDesligamento caso a busca filtre exclusivamente colaboradores desligados.
  if (wantsOnlyDismissed) {
    const [dismissedRows, total] = await Promise.all([
      prisma.registroDesligamento.findMany({
        where: dismissedWhere,
        skip,
        take: safeLimit,
        orderBy: [{ dataDemissao: "desc" }],
      }),
      prisma.registroDesligamento.count({ where: dismissedWhere }),
    ]);

    return {
      data: dismissedRows.map(mapDismissedToUserItem),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  // 7 - executa consultas paralelas unificando colaboradores ativos e desligados quando solicitado filtro global de equipe.
  if (wantsBothActiveAndDismissed) {
    const [activeTotal, dismissedTotal] = await Promise.all([
      prisma.usuario.count({ where: activeWhere }),
      prisma.registroDesligamento.count({ where: dismissedWhere }),
    ]);

    const total = activeTotal + dismissedTotal;
    const neededEnd = skip + safeLimit;
    const results = [];

    if (skip < activeTotal) {
      const activeUsers = await prisma.usuario.findMany({
        where: activeWhere,
        skip,
        take: safeLimit,
        orderBy: [{ createdAt: "desc" }],
        select: USER_PUBLIC_SELECT,
      });
      results.push(
        ...sanitizeUsers(activeUsers).map((u) => ({
          ...u,
          matriculaCancelada: false,
          matriculaDisplay: formatMatriculaDisplay(u.id, u.matricula, false),
          excluido: false,
          dataDemissao: null,
        }))
      );
    }

    const remaining = safeLimit - results.length;
    if (remaining > 0 && neededEnd > activeTotal) {
      const dismissedSkip = Math.max(0, skip - activeTotal);
      const dismissedRows = await prisma.registroDesligamento.findMany({
        where: dismissedWhere,
        skip: dismissedSkip,
        take: remaining,
        orderBy: [{ dataDemissao: "desc" }],
      });
      results.push(...dismissedRows.map(mapDismissedToUserItem));
    }

    return {
      data: results,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  // 8 - consulta a tabela Usuario para o fluxo padrão de colaboradores ativos no sistema.
  const [users, total] = await Promise.all([
    prisma.usuario.findMany({
      where: activeWhere,
      skip,
      take: safeLimit,
      orderBy: [{ createdAt: "desc" }],
      select: USER_PUBLIC_SELECT,
    }),
    prisma.usuario.count({ where: activeWhere }),
  ]);

  // 9 - retorna objeto estruturado com a lista sanitizada de colaboradores e metadados de paginação.
  return {
    data: sanitizeUsers(users).map((u) => ({
      ...u,
      matriculaCancelada: false,
      matriculaDisplay: formatMatriculaDisplay(u.id, u.matricula, false),
      excluido: false,
      dataDemissao: null,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

// função responsável por buscar detalhes completos de um usuário específico garantindo isolamento organizacional.
//
// contexto: invocada por userController.js na rota GET /api/users/:id para edição e detalhamento de perfil.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do usuário procurado.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária da conta.
//
// retorno: objeto do usuário sanitizado com dados da loja e organização vinculadas.
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se o usuário não for localizado.
// efeitos colaterais: realiza consulta de leitura na tabela Usuario do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o usuário no banco filtrando por id e organizacaoId com projeção pública segura.
// 4 - lança AppError (404) caso o usuário não seja localizado na organização.
// 5 - sanitiza e retorna os dados do usuário com a matrícula formatada resolvida.
export async function getUserById(id, organizacaoId) {
  // 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - consulta o usuário no banco filtrando por id e organizacaoId com projeção pública segura.
  const user = await prisma.usuario.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(organizacaoId),
    },
    select: USER_PUBLIC_SELECT,
  });

  // 4 - lança AppError (404) caso o usuário não seja localizado na organização.
  if (!user) throw new AppError("Usuário não encontrado", 404);

  // 5 - sanitiza e retorna os dados do usuário com a matrícula formatada resolvida.
  return sanitizeUser({
    ...user,
    matricula: user.matricula || formatMatricula(user.id),
  });
}

// função responsável por atualizar dados cadastrais, situação trabalhista, credenciais e foto de um colaborador.
//
// contexto: invocada por userController.js na rota PUT /api/users/:id para manutenção de equipe por administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único do usuário a ser atualizado.
//   - data (objeto, obrigatório): campos atualizados (nome, email, role, senha, lojaId, telefone, situacao, dataAdmissao).
//   - newImagePath (string, opcional, padrão null): novo endereço do avatar enviado no upload.
//   - removeImage (booleano, opcional, padrão false): flag indicando solicitação de exclusão do avatar.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária.
//
// retorno: objeto do usuário atualizado e sanitizado sem hash de senha.
// erros: AppError (400) para conflito de e-mail, senha curta ou tentativa de inativar o único administrador; AppError (404) se usuário não for localizado.
// efeitos colaterais: atualiza registro na tabela Usuario, remove mídia antiga via cleanupStoredMedia e invalida cache de sessão com invalidateUserCache.
//
// passo a passo:
// 1 - recebe id, data, newImagePath, removeImage e organizacaoId.
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o usuário garantindo que pertence à organização lançando AppError (404) se ausente.
// 4 - valida unicidade do novo e-mail informado caso tenha sido modificado.
// 5 - valida novo perfil funcional e situação trabalhista impedindo a desativação do único administrador ativo da rede.
// 6 - resolve atribuição de loja e gera hash seguro de senha com bcrypt se enviada nova senha.
// 7 - processa remoção ou substituição de foto com limpeza segura via cleanupStoredMedia.
// 8 - atualiza o usuário no banco de dados com projeção segura USER_PUBLIC_SELECT.
// 9 - invalida a sessão do usuário em cache para aplicar imediatamente as novas permissões.
// 10 - retorna os dados do colaborador atualizados e sanitizados.
export async function updateUser(
  id,
  data,
  newImagePath = null,
  removeImage = false,
  organizacaoId
) {
  // 1 - recebe id, data, newImagePath, removeImage e organizacaoId.
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  // 3 - consulta o usuário garantindo que pertence à organização lançando AppError (404) se ausente.
  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  const { nome, email, role, senha, lojaId, telefone, situacao, dataAdmissao } = data;
  const updateData = {};

  if (!user.matricula) {
    updateData.matricula = formatMatricula(user.id);
  }

  if (nome !== undefined) updateData.nome = String(nome).trim();
  if (telefone !== undefined) {
    updateData.telefone = telefone ? String(telefone).trim() : null;
  }

  if (dataAdmissao !== undefined && dataAdmissao !== null && String(dataAdmissao).trim() !== "") {
    const dt = new Date(dataAdmissao);
    if (!isNaN(dt.getTime())) updateData.dataAdmissao = dt;
  }

  // 4 - valida unicidade do novo e-mail informado caso tenha sido modificado.
  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const emailTaken = await prisma.usuario.findUnique({
        where: {
          organizacaoId_email: {
            organizacaoId: orgIdNum,
            email: normalizedEmail,
          },
        },
      });
      if (emailTaken) {
        throw new AppError("Este e-mail já está em uso nesta organização", 400);
      }
      updateData.email = normalizedEmail;
    }
  }

  // 5 - valida novo perfil funcional e situação trabalhista impedindo a desativação do único administrador ativo da rede.
  let effectiveRole = user.role;
  if (role !== undefined) {
    const normalizedRole = String(role).toUpperCase();
    if (!["ADMIN", "GERENTE", "OPERADOR"].includes(normalizedRole)) {
      throw new AppError("Role inválida. Deve ser ADMIN, GERENTE ou OPERADOR", 400);
    }
    effectiveRole = normalizedRole;
    updateData.role = normalizedRole;
  }

  let effectiveSituation = user.situacao;
  if (situacao !== undefined && situacao !== "") {
    const normalizedSit = String(situacao).toUpperCase();
    if (!VALID_SITUATIONS.includes(normalizedSit)) {
      throw new AppError("Situação inválida. Deve ser ATIVO, SUSPENSO ou FERIAS", 400);
    }
    effectiveSituation = normalizedSit;
    updateData.situacao = normalizedSit;
  }

  if (
    user.role === "ADMIN" &&
    user.situacao === "ATIVO" &&
    (effectiveRole !== "ADMIN" || effectiveSituation !== "ATIVO")
  ) {
    const activeAdmins = await prisma.usuario.count({
      where: { organizacaoId: orgIdNum, role: "ADMIN", situacao: "ATIVO" },
    });
    if (activeAdmins <= 1) {
      throw new AppError(
        "Operação bloqueada: a organização precisa de pelo menos 1 administrador atuando.",
        400
      );
    }
  }

  // 6 - resolve atribuição de loja e gera hash seguro de senha com bcrypt se enviada nova senha.
  if (effectiveRole === "ADMIN") {
    updateData.lojaId = null;
  } else if (lojaId !== undefined || user.role === "ADMIN") {
    const targetLojaCandidate = lojaId !== undefined ? lojaId : user.lojaId;
    updateData.lojaId = await resolveAssignedStoreId(effectiveRole, targetLojaCandidate, orgIdNum);
  }

  if (senha) {
    if (String(senha).length < 6) {
      throw new AppError("A senha deve conter pelo menos 6 caracteres", 400);
    }
    updateData.senha = await bcrypt.hash(senha, 10);
  }

  // 7 - processa remoção ou substituição de foto com limpeza segura via cleanupStoredMedia.
  let imagePath = user.imagem;
  if (removeImage) {
    await cleanupStoredMedia(imagePath);
    updateData.imagem = null;
  } else if (newImagePath) {
    await cleanupStoredMedia(imagePath);
    updateData.imagem = newImagePath;
  }

  // 8 - atualiza o usuário no banco de dados com projeção segura USER_PUBLIC_SELECT.
  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: updateData,
    select: USER_PUBLIC_SELECT,
  });

  // 9 - invalida a sessão do usuário em cache para aplicar imediatamente as novas permissões.
  invalidateUserCache(targetId);

  // 10 - retorna os dados do colaborador atualizados e sanitizados.
  return sanitizeUser(updated);
}

// função responsável por transferir a loja de atuação de um gerente ou operador para outra filial da organização.
//
// contexto: invocada por userController.js na rota PATCH /api/users/:id/transfer restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador do colaborador transferido.
//   - newLojaId (número ou string, obrigatório): identificador da filial de destino.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária.
//
// retorno: objeto do usuário atualizado com a nova loja vinculada.
// erros: AppError (400) se o usuário for ADMIN ou loja inválida; AppError (404) se usuário não for encontrado.
// efeitos colaterais: atualiza lojaId na tabela Usuario e invalida imediatamente o cache de sessão do colaborador.
//
// passo a passo:
// 1 - recebe id (número ou string), newLojaId (número ou string) e organizacaoId (número ou string).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o usuário no banco confirmando que pertence à organização.
// 4 - lança AppError (404) se não encontrado ou AppError (400) se o usuário possuir perfil ADMIN.
// 5 - valida e atribui a nova loja de destino através de resolveAssignedStoreId.
// 6 - atualiza o registro do usuário no banco de dados com a nova filial.
// 7 - invalida o cache de autenticação do usuário para refletir a transferência imediatamente em sua sessão.
// 8 - retorna o usuário atualizado e sanitizado.
export async function transferUserStore(id, newLojaId, organizacaoId) {
  // 1 - recebe id (número ou string), newLojaId (número ou string) e organizacaoId (número ou string).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  // 3 - consulta o usuário no banco confirmando que pertence à organização.
  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
  });
  // 4 - lança AppError (404) se não encontrado ou AppError (400) se o usuário possuir perfil ADMIN.
  if (!user) throw new AppError("Usuário não encontrado", 404);
  if (user.role === "ADMIN") {
    throw new AppError("Administradores da organização já possuem acesso a todas as lojas.", 400);
  }

  // 5 - valida e atribui a nova loja de destino através de resolveAssignedStoreId.
  const assignedLojaId = await resolveAssignedStoreId(user.role, newLojaId, orgIdNum);

  // 6 - atualiza o registro do usuário no banco de dados com a nova filial.
  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: { lojaId: assignedLojaId },
    select: USER_PUBLIC_SELECT,
  });

  // 7 - invalida o cache de autenticação do usuário para refletir a transferência imediatamente em sua sessão.
  invalidateUserCache(targetId);

  // 8 - retorna o usuário atualizado e sanitizado.
  return sanitizeUser(updated);
}

// função responsável por alterar a situação trabalhista de um colaborador com bloqueio ou liberação imediata de acesso.
//
// contexto: invocada por userController.js na rota PATCH /api/users/:id/situation para suspensões ou afastamento por férias.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do colaborador.
//   - situacao (string, obrigatório): nova situação desejada ('ATIVO', 'SUSPENSO' ou 'FERIAS').
//   - requestingUserId (número ou string, opcional, padrão null): identificador do usuário solicitante para impedir autoafastamento.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária.
//
// retorno: objeto do usuário com situação atualizada e sanitizado.
// erros: AppError (400) se situação for inválida, se houver tentativa de auto-suspensão ou desativação do único administrador; AppError (404) se usuário não existir.
// efeitos colaterais: atualiza situacao na tabela Usuario e invalida o cache de autenticação.
//
// passo a passo:
// 1 - recebe id, situacao, requestingUserId e organizacaoId.
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - valida se a situação informada pertence à lista permitida (ATIVO, SUSPENSO ou FERIAS).
// 4 - impede que o usuário solicitante suspenda ou afaste sua própria conta em uso.
// 5 - consulta o colaborador no banco e assegura que não seja o único administrador ativo antes de alterar seu status.
// 6 - atualiza a situação funcional do usuário no banco de dados.
// 7 - invalida o cache de sessão do usuário para revogar ou restaurar seu acesso imediatamente.
// 8 - retorna o registro do usuário com a nova situação funcional.
export async function updateUserSituation(id, situacao, requestingUserId = null, organizacaoId) {
  // 1 - recebe id, situacao, requestingUserId e organizacaoId.
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  // 3 - valida se a situação informada pertence à lista permitida (ATIVO, SUSPENSO ou FERIAS).
  const normalizedSit = String(situacao || "").toUpperCase();
  if (!VALID_SITUATIONS.includes(normalizedSit)) {
    throw new AppError("Situação inválida. Valores aceitos: ATIVO, SUSPENSO, FERIAS", 400);
  }

  // 4 - impede que o usuário solicitante suspenda ou afaste sua própria conta em uso.
  if (requestingUserId && Number(requestingUserId) === targetId && normalizedSit !== "ATIVO") {
    throw new AppError("Você não pode suspender ou afastar a sua própria conta em uso.", 400);
  }

  // 5 - consulta o colaborador no banco e assegura que não seja o único administrador ativo antes de alterar seu status.
  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (user.role === "ADMIN" && user.situacao === "ATIVO" && normalizedSit !== "ATIVO") {
    const activeAdmins = await prisma.usuario.count({
      where: { organizacaoId: orgIdNum, role: "ADMIN", situacao: "ATIVO" },
    });
    if (activeAdmins <= 1) {
      throw new AppError(
        "Operação bloqueada: não é permitido suspender o único administrador atuante.",
        400
      );
    }
  }

  // 6 - atualiza a situação funcional do usuário no banco de dados.
  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: {
      situacao: normalizedSit,
      ...(!user.matricula ? { matricula: formatMatricula(user.id) } : {}),
    },
    select: USER_PUBLIC_SELECT,
  });

  // 7 - invalida o cache de sessão do usuário para revogar ou restaurar seu acesso imediatamente.
  invalidateUserCache(targetId);

  // 8 - retorna o registro do usuário com a nova situação funcional.
  return sanitizeUser(updated);
}

// função responsável por demitir colaborador com cancelamento de matrícula e preservação integral do histórico no livro-razão e registros de desligamento.
//
// contexto: invocada por userController.js na rota DELETE /api/users/:id para rescisão trabalhista definitiva.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do colaborador a demitir.
//   - requestingUserId (número ou string, opcional, padrão null): identificador de quem solicitou a demissão para evitar autoexclusão.
//   - organizacaoId (número ou string, obrigatório): identificador da organização dona do recurso.
//   - options (objeto, opcional): parâmetros de demissão contendo dataDemissao e motivo.
//
// retorno: objeto de confirmação contendo dados da matrícula cancelada, histórico preservado e relatorioDesligamento consolidado.
// erros: AppError (400) se houver tentativa de autoexclusão ou exclusão do único administrador da rede; AppError (404) se usuário não for encontrado.
// efeitos colaterais: atualiza snapshots em Pedido e Movimento, insere em RegistroDesligamento, exclui fisicamente o Usuario, remove avatar e limpa cache.
//
// passo a passo:
// 1 - recebe id, requestingUserId, organizacaoId e options.
// 2 - valida a presença de organizacaoId e impede que o gestor exclua a si mesmo ou exclua o único administrador restante.
// 3 - busca os dados do colaborador carregando contadores de pedidos e movimentos históricos.
// 4 - calcula as datas efetivas de admissão e demissão e extrai a matrícula formatada.
// 5 - executa transação no banco atualizando snapshots imutáveis em todos os pedidos e movimentos do colaborador.
// 6 - persiste o histórico funcional na tabela RegistroDesligamento com datas, loja e motivo da rescisão.
// 7 - exclui fisicamente o registro da tabela Usuario liberando credenciais e e-mail.
// 8 - limpa o avatar do colaborador do storage via cleanupStoredMedia e invalida o cache de autenticação.
// 9 - compila o relatório analítico mensal de desligamento via buildDismissalReportPayload.
// 10 - retorna objeto com confirmação da demissão, matrícula cancelada e relatório final compilado.
export async function deleteUser(id, requestingUserId = null, organizacaoId, options = {}) {
  // 1 - recebe id, requestingUserId, organizacaoId e options.
  // 2 - valida a presença de organizacaoId e impede que o gestor exclua a si mesmo ou exclua o único administrador restante.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  if (requestingUserId && Number(requestingUserId) === targetId) {
    throw new AppError("Você não pode excluir a sua própria conta", 400);
  }

  // 3 - busca os dados do colaborador carregando contadores de pedidos e movimentos históricos.
  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
    include: {
      loja: { select: { id: true, nome: true } },
      _count: { select: { pedidos: true, movimentos: true } },
    },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (user.role === "ADMIN") {
    const adminCount = await prisma.usuario.count({
      where: { organizacaoId: orgIdNum, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new AppError(
        "Operação bloqueada: não é permitido excluir o único administrador da organização",
        400
      );
    }
  }

  // 4 - calcula as datas efetivas de admissão e demissão e extrai a matrícula formatada.
  const matriculaCode = user.matricula || formatMatricula(targetId);
  const dataInicio = user.dataAdmissao || user.createdAt || new Date();
  const dataTermino = parseDismissalDate(options?.dataDemissao);
  const motivoTrim = options?.motivo ? String(options.motivo).trim() : null;
  const effectiveStart = dataInicio <= dataTermino ? dataInicio : dataTermino;

  // 5 - executa transação no banco atualizando snapshots imutáveis em todos os pedidos e movimentos do colaborador.
  const { salesMovements, sellerOrders } = await prisma.$transaction(async (tx) => {
    await tx.pedido.updateMany({
      where: {
        OR: [{ usuarioId: targetId }, { vendedorRefId: targetId }],
        organizacaoId: orgIdNum,
      },
      data: {
        vendedorRefId: targetId,
        vendedorNomeSnapshot: user.nome,
        vendedorEmailSnapshot: user.email,
        vendedorMatriculaSnapshot: matriculaCode,
        vendedorDataAdmissaoSnapshot: effectiveStart,
        vendedorDataDesligamentoSnapshot: dataTermino,
      },
    });

    await tx.movimento.updateMany({
      where: {
        OR: [{ usuarioId: targetId }, { vendedorRefId: targetId }],
        organizacaoId: orgIdNum,
      },
      data: {
        vendedorRefId: targetId,
        vendedorNomeSnapshot: user.nome,
        vendedorEmailSnapshot: user.email,
        vendedorMatriculaSnapshot: matriculaCode,
        vendedorDataAdmissaoSnapshot: effectiveStart,
        vendedorDataDesligamentoSnapshot: dataTermino,
      },
    });

    // 6 - persiste o histórico funcional na tabela RegistroDesligamento com datas, loja e motivo da rescisão.
    await tx.registroDesligamento.upsert({
      where: {
        organizacaoId_vendedorRefId: {
          organizacaoId: orgIdNum,
          vendedorRefId: targetId,
        },
      },
      create: {
        vendedorRefId: targetId,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || null,
        matricula: matriculaCode,
        role: user.role,
        lojaId: user.lojaId,
        lojaNome: user.loja?.nome || (user.role === "ADMIN" ? "Todas as Lojas (Rede)" : null),
        dataAdmissao: effectiveStart,
        dataDemissao: dataTermino,
        motivo: motivoTrim,
        organizacaoId: orgIdNum,
      },
      update: {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || null,
        matricula: matriculaCode,
        role: user.role,
        lojaId: user.lojaId,
        lojaNome: user.loja?.nome || (user.role === "ADMIN" ? "Todas as Lojas (Rede)" : null),
        dataAdmissao: effectiveStart,
        dataDemissao: dataTermino,
        motivo: motivoTrim,
      },
    });

    const [movs, peds] = await Promise.all([
      tx.movimento.findMany({
        where: {
          organizacaoId: orgIdNum,
          vendedorRefId: targetId,
          tipo: "VENDA",
          estorno: false,
          data: { gte: effectiveStart, lte: dataTermino },
          OR: [{ pedidoId: null }, { pedido: { status: "CONCLUIDO" } }],
        },
        include: {
          produto: { select: { id: true, nome: true } },
        },
        orderBy: { data: "asc" },
      }),
      tx.pedido.findMany({
        where: {
          organizacaoId: orgIdNum,
          vendedorRefId: targetId,
          tipo: "VENDA",
          createdAt: { gte: effectiveStart, lte: dataTermino },
        },
        include: {
          itens: {
            select: { produtoNomeSnapshot: true, quantidade: true, subtotal: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 7 - exclui fisicamente o registro da tabela Usuario liberando credenciais e e-mail.
    await tx.usuario.delete({
      where: { id: targetId },
    });

    return { salesMovements: movs, sellerOrders: peds };
  });

  // 8 - limpa o avatar do colaborador do storage via cleanupStoredMedia e invalida o cache de autenticação.
  await cleanupStoredMedia(user.imagem);

  invalidateUserCache(targetId);

  // 9 - compila o relatório analítico mensal de desligamento via buildDismissalReportPayload.
  const relatorioDesligamento = buildDismissalReportPayload({
    refId: targetId,
    nome: user.nome,
    email: user.email,
    matricula: matriculaCode,
    dataInicio: effectiveStart,
    dataTermino,
    motivo: motivoTrim,
    salesMovements,
    sellerOrders,
  });

  const hadHistory = user._count.pedidos > 0 || user._count.movimentos > 0;

  // 10 - retorna objeto com confirmação da demissão, matrícula cancelada e relatório final compilado.
  return {
    ok: true,
    deletedId: targetId,
    deletedNome: user.nome,
    matricula: matriculaCode,
    matriculaCancelada: true,
    matriculaDisplay: formatMatriculaDisplay(targetId, matriculaCode, true),
    dataInicio: effectiveStart.toISOString(),
    dataTermino: dataTermino.toISOString(),
    dataDemissao: dataTermino.toISOString(),
    motivo: motivoTrim,
    preservedHistory: hadHistory,
    relatorioDesligamento,
    message: hadHistory
      ? `Matrícula ${matriculaCode} cancelada e "${user.nome}" desligado(a) em ${dataTermino.toLocaleDateString("pt-BR")}. Histórico preservado.`
      : `Matrícula ${matriculaCode} cancelada e colaborador "${user.nome}" desligado(a) em ${dataTermino.toLocaleDateString("pt-BR")}.`,
  };
}

// função responsável por reemitir o relatório final de desligamento de um colaborador demitido.
//
// contexto: invocada por userController.js na rota GET /api/users/dismissal-report/:refId para download ou visualização de histórico de ex-funcionário.
//
// parâmetros:
//   - refId (número ou string, obrigatório): matrícula cancelada (ex: MAT-00063) ou identificador numérico antigo do colaborador.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária do registro.
//
// retorno: objeto compilado do relatório de desligamento contendo faturamento, total de pedidos, peças e evolução mês a mês.
// erros: AppError (400) se refId ou organizacaoId forem inválidos; AppError (404) se o registro de desligamento não for encontrado.
// efeitos colaterais: realiza consultas nas tabelas RegistroDesligamento, Movimento e Pedido.
//
// passo a passo:
// 1 - recebe refId (número ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId e interpreta a matrícula resolvendo o identificador numérico seguro via parseMatriculaSearch.
// 3 - consulta a tabela RegistroDesligamento localizando a rescisão na organização informada.
// 4 - lança AppError (404) caso o registro histórico de desligamento não seja encontrado.
// 5 - define a data inicial de início e término garantindo consistência cronológica.
// 6 - consulta em paralelo todos os movimentos de venda e pedidos concluídos vinculados ao vendedor durante o período trabalhado.
// 7 - monta e retorna o relatório consolidado de desligamento através de buildDismissalReportPayload.
export async function getDismissalReportByRef(refId, organizacaoId) {
  // 1 - recebe refId (número ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId e interpreta a matrícula resolvendo o identificador numérico seguro via parseMatriculaSearch.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const parsed = parseMatriculaSearch(refId);
  const sellerRefId = parsed.numericId;
  if (!sellerRefId) {
    throw new AppError("Matrícula ou identificador inválido", 400);
  }

  // 3 - consulta a tabela RegistroDesligamento localizando a rescisão na organização informada.
  const reg = await prisma.registroDesligamento.findUnique({
    where: {
      organizacaoId_vendedorRefId: {
        organizacaoId: orgIdNum,
        vendedorRefId: sellerRefId,
      },
    },
  });

  // 4 - lança AppError (404) caso o registro histórico de desligamento não seja encontrado.
  if (!reg) {
    throw new AppError("Registro de desligamento não encontrado", 404);
  }

  // 5 - define a data inicial de início e término garantindo consistência cronológica.
  const safeStart = reg.dataAdmissao <= reg.dataDemissao ? reg.dataAdmissao : reg.dataDemissao;

  // 6 - consulta em paralelo todos os movimentos de venda e pedidos concluídos vinculados ao vendedor durante o período trabalhado.
  const [salesMovements, sellerOrders] = await Promise.all([
    prisma.movimento.findMany({
      where: {
        organizacaoId: orgIdNum,
        vendedorRefId: sellerRefId,
        tipo: "VENDA",
        estorno: false,
        data: { gte: safeStart, lte: reg.dataDemissao },
        OR: [{ pedidoId: null }, { pedido: { status: "CONCLUIDO" } }],
      },
      include: {
        produto: { select: { id: true, nome: true } },
      },
      orderBy: { data: "asc" },
    }),
    prisma.pedido.findMany({
      where: {
        organizacaoId: orgIdNum,
        vendedorRefId: sellerRefId,
        tipo: "VENDA",
        createdAt: { gte: safeStart, lte: reg.dataDemissao },
      },
      include: {
        itens: {
          select: { produtoNomeSnapshot: true, quantidade: true, subtotal: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 7 - monta e retorna o relatório consolidado de desligamento através de buildDismissalReportPayload.
  return buildDismissalReportPayload({
    refId: reg.vendedorRefId,
    nome: reg.nome,
    email: reg.email,
    matricula: reg.matricula,
    dataInicio: safeStart,
    dataTermino: reg.dataDemissao,
    motivo: reg.motivo,
    salesMovements,
    sellerOrders,
  });
}
