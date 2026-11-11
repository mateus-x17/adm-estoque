import bcrypt from "bcryptjs";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitizers.js";
import { cleanupStoredMedia } from "../config/cloudinaryConfig.js";
import { invalidateUserCache } from "../middlewares/authMiddleware.js";
import {
  formatMatricula,
  formatMatriculaDisplay,
  parseMatriculaSearch,
  parseDismissalDate,
  buildDismissalReportPayload,
} from "../utils/matriculaHelper.js";

// arquivo responsável pelas regras de negócio e gestão de usuários (matrícula, situação, transferência e demissão com relatório mensal)

const VALID_SITUATIONS = ["ATIVO", "SUSPENSO", "FERIAS"];

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

// função auxiliar para validar se uma loja existe, está ativa e pertence à Organização
// 1 - Para ADMIN da rede, lojaId retorna null (acesso global a todas as lojas)
// 2 - Para GERENTE e OPERADOR, exige uma loja válida e ativa dentro da organização
async function resolveAssignedStoreId(role, rawLojaId, organizacaoId) {
  if (role === "ADMIN") return null;

  const hasExplicit =
    rawLojaId !== undefined && rawLojaId !== null && rawLojaId !== "" && rawLojaId !== "null";

  if (!hasExplicit) {
    const stores = await prisma.loja.findMany({
      where: { organizacaoId: Number(organizacaoId), ativo: true },
      select: { id: true },
      take: 2,
    });
    if (stores.length === 1) return stores[0].id;
    throw new AppError("Selecione a loja de atuação para colaboradores GERENTE ou OPERADOR", 400);
  }

  const parsedLojaId = Number(rawLojaId);
  if (isNaN(parsedLojaId) || parsedLojaId <= 0) {
    throw new AppError("Loja selecionada inválida", 400);
  }

  const loja = await prisma.loja.findFirst({
    where: { id: parsedLojaId, organizacaoId: Number(organizacaoId) },
    select: { id: true, nome: true, ativo: true },
  });

  if (!loja) {
    throw new AppError("Loja não encontrada nesta organização", 404);
  }
  if (!loja.ativo) {
    throw new AppError(`A loja "${loja.nome}" está desativada e não aceita novos colaboradores`, 400);
  }

  return loja.id;
}

// função responsável por criar novo colaborador ou administrador na Organização com geração automática de Matrícula.
//
// 1 - recebe data (object), imagePath (string|null opcional) e organizacaoId (number).
// 2 - valida campos obrigatórios, exige senha com no mínimo 6 caracteres, checa e-mail único na organização e valida role/situação.
// 3 - resolve loja atribuída via resolveAssignedStoreId e calcula hash seguro da senha com bcrypt.
// 4 - executa criação transacional gravando a matrícula única derivada do ID (MAT-00001).
// 5 - retorna o usuário sanitizado sem o hash de senha.
export async function createUser(data, imagePath = null, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const { nome, email, senha, role, lojaId, telefone, situacao, dataAdmissao } = data;
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
  }
  if (String(senha).length < 6) {
    throw new AppError("A senha deve conter pelo menos 6 caracteres", 400);
  }

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

  const normalizedRole = role ? String(role).toUpperCase() : "OPERADOR";
  if (!["ADMIN", "GERENTE", "OPERADOR"].includes(normalizedRole)) {
    throw new AppError("Role inválida. Deve ser ADMIN, GERENTE ou OPERADOR", 400);
  }

  const normalizedSituation = situacao ? String(situacao).toUpperCase() : "ATIVO";
  if (!VALID_SITUATIONS.includes(normalizedSituation)) {
    throw new AppError("Situação inválida. Use ATIVO, SUSPENSO ou FERIAS", 400);
  }

  const assignedLojaId = await resolveAssignedStoreId(normalizedRole, lojaId, orgIdNum);
  const hashed = await bcrypt.hash(senha, 10);
  const parsedAdmission = dataAdmissao ? new Date(dataAdmissao) : new Date();

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

  return sanitizeUser(user);
}

// função auxiliar para normalizar um registro de RegistroDesligamento no mesmo formato da listagem de Usuários
// 1 - Sinaliza situacao='DESLIGADO', matriculaCancelada=true e preserva dataAdmissao e dataDemissao
function mapDismissedToUserItem(reg) {
  const mat = reg.matricula || formatMatricula(reg.vendedorRefId);
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

// função para listar usuários da Organização com paginação e filtros por nome/matrícula/ID, cargo, situação (incl. DESLIGADO) e loja
// 1 - Isola estritamente pelo organizacaoId do ADMIN
// 2 - Quando situacao='DESLIGADO' ou situacao='todos' / includeDismissed='true', consulta também RegistroDesligamento
// 3 - Mantém busca por Matrícula (MAT-XXXXX), ID, nome, e-mail e telefone em ambos os conjuntos
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
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const orgIdNum = Number(organizacaoId);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const parsedMat = parseMatriculaSearch(search);
  const trimmedSearch = parsedMat.raw;

  const parsedLojaFilter =
    lojaId && !["todos", "all", "todas", "null", "undefined"].includes(String(lojaId))
      ? Number(lojaId)
      : null;

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

// função para buscar detalhes de um usuário dentro da Organização
// 1 - Confirma pertencimento ao organizacaoId para impedir acesso cruzado entre redes
export async function getUserById(id, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const user = await prisma.usuario.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(organizacaoId),
    },
    select: USER_PUBLIC_SELECT,
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  return sanitizeUser({
    ...user,
    matricula: user.matricula || formatMatricula(user.id),
  });
}

// função responsável por atualizar cadastro, telefone, situação trabalhista, data de admissão, cargo, loja e foto do colaborador.
//
// 1 - recebe id (number|string), data (object), newImagePath (string|null opcional), removeImage (boolean) e organizacaoId (number).
// 2 - confirma pertencimento à organização, valida novo e-mail único, cargo, situação e impede rebaixar o único ADMIN ativo.
// 3 - valida tamanho mínimo de 6 caracteres caso nova senha seja enviada e gerencia mídia via cleanupStoredMedia.
// 4 - atualiza o registro via prisma.usuario.update e invalida o cache de sessão em invalidateUserCache.
// 5 - retorna o usuário atualizado e sanitizado.
export async function updateUser(
  id,
  data,
  newImagePath = null,
  removeImage = false,
  organizacaoId
) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

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

  let imagePath = user.imagem;
  if (removeImage) {
    await cleanupStoredMedia(imagePath);
    updateData.imagem = null;
  } else if (newImagePath) {
    await cleanupStoredMedia(imagePath);
    updateData.imagem = newImagePath;
  }

  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: updateData,
    select: USER_PUBLIC_SELECT,
  });

  invalidateUserCache(targetId);
  return sanitizeUser(updated);
}

// função exclusiva para transferir um Gerente ou Operador para outra filial ativa da mesma Organização
// 1 - Garante que o usuário alvo pertence à Organização e não é ADMIN global
// 2 - Atualiza lojaId e invalida imediatamente o cache para efeito instantâneo na sessão do colaborador
export async function transferUserStore(id, newLojaId, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  if (user.role === "ADMIN") {
    throw new AppError("Administradores da organização já possuem acesso a todas as lojas.", 400);
  }

  const assignedLojaId = await resolveAssignedStoreId(user.role, newLojaId, orgIdNum);
  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: { lojaId: assignedLojaId },
    select: USER_PUBLIC_SELECT,
  });

  invalidateUserCache(targetId);
  return sanitizeUser(updated);
}

// função exclusiva para alterar situação trabalhista (ATIVO, SUSPENSO ou FERIAS) com bloqueio imediato de sessão
// 1 - Impede suspender ou afastar a própria conta e protege o último ADMIN ATIVO da organização
// 2 - Atualiza situacao e limpa userCache instantaneamente
export async function updateUserSituation(id, situacao, requestingUserId = null, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  const normalizedSit = String(situacao || "").toUpperCase();
  if (!VALID_SITUATIONS.includes(normalizedSit)) {
    throw new AppError("Situação inválida. Valores aceitos: ATIVO, SUSPENSO, FERIAS", 400);
  }

  if (requestingUserId && Number(requestingUserId) === targetId && normalizedSit !== "ATIVO") {
    throw new AppError("Você não pode suspender ou afastar a sua própria conta em uso.", 400);
  }

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

  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: {
      situacao: normalizedSit,
      ...(!user.matricula ? { matricula: formatMatricula(user.id) } : {}),
    },
    select: USER_PUBLIC_SELECT,
  });

  invalidateUserCache(targetId);
  return sanitizeUser(updated);
}

// função responsável por demitir (cancelar matrícula e excluir fisicamente) preservando histórico, RegistroDesligamento, antigo ID e relatório mensal.
//
// 1 - recebe id (number|string), requestingUserId (number|null), organizacaoId (number) e options (object opcional).
// 2 - impede autoexclusão e proteção do último administrador da Organização.
// 3 - grava snapshots imutáveis em Pedido/Movimento, registra RegistroDesligamento e exclui Usuario em transação única.
// 4 - remove eventual avatar remoto/local via cleanupStoredMedia e invalida userCache.
// 5 - retorna resumo da demissão com relatorioDesligamento compilado mês a mês.
export async function deleteUser(id, requestingUserId = null, organizacaoId, options = {}) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  if (requestingUserId && Number(requestingUserId) === targetId) {
    throw new AppError("Você não pode excluir a sua própria conta", 400);
  }

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

  const matriculaCode = user.matricula || formatMatricula(targetId);
  const dataInicio = user.dataAdmissao || user.createdAt || new Date();
  const dataTermino = parseDismissalDate(options?.dataDemissao);
  const motivoTrim = options?.motivo ? String(options.motivo).trim() : null;
  const effectiveStart = dataInicio <= dataTermino ? dataInicio : dataTermino;

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

    await tx.usuario.delete({
      where: { id: targetId },
    });

    return { salesMovements: movs, sellerOrders: peds };
  });

  await cleanupStoredMedia(user.imagem);

  invalidateUserCache(targetId);

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

// função para reemitir o Relatório Final de Desligamento de um colaborador desligado (a partir da tela de Usuários)
// 1 - Aceita matrícula (MAT-00063) ou ID antigo do vendedor desligado e consulta RegistroDesligamento + vendas
export async function getDismissalReportByRef(refId, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const parsed = parseMatriculaSearch(refId);
  const sellerRefId = parsed.numericId;
  if (!sellerRefId) {
    throw new AppError("Matrícula ou identificador inválido", 400);
  }

  const reg = await prisma.registroDesligamento.findUnique({
    where: {
      organizacaoId_vendedorRefId: {
        organizacaoId: orgIdNum,
        vendedorRefId: sellerRefId,
      },
    },
  });

  if (!reg) {
    throw new AppError("Registro de desligamento não encontrado", 404);
  }

  const safeStart = reg.dataAdmissao <= reg.dataDemissao ? reg.dataAdmissao : reg.dataDemissao;

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
