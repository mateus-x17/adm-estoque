import bcrypt from "bcryptjs";
import fs from "fs";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitizers.js";
import { deleteFromCloudinary } from "../config/cloudinaryConfig.js";
import { invalidateUserCache } from "../middlewares/authMiddleware.js";
import {
  formatMatricula,
  formatMatriculaDisplay,
  parseMatriculaSearch,
  buildWorkedMonthsTimeline,
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

// função para criar novo colaborador ou administrador na Organização com geração automática de Matrícula
// 1 - Valida obrigatoriedade, unicidade de e-mail na Organização e situação funcional válida
// 2 - Executa criação transacional e imediatamente grava a matrícula derivada do ID único (MAT-00001)
export async function createUser(data, imagePath = null, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const { nome, email, senha, role, lojaId, telefone, situacao, dataAdmissao } = data;
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
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

// função para listar usuários da Organização com paginação e filtros por nome/matrícula/ID, cargo, situação e loja
// 1 - Isola estritamente pelo organizacaoId do ADMIN
// 2 - Suporta busca textual por nome, e-mail, telefone, matrícula (MAT-XXXXX) ou ID numérico
// 3 - Executa busca paginada e contagem total em paralelo
export async function listUsers({
  organizacaoId,
  lojaId = null,
  page = 1,
  limit = 10,
  search = "",
  role = "",
  situacao = "",
}) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const parsedMat = parseMatriculaSearch(search);
  const trimmedSearch = parsedMat.raw;

  const parsedLojaFilter =
    lojaId && !["todos", "all", "todas", "null", "undefined"].includes(String(lojaId))
      ? Number(lojaId)
      : null;

  const normalizedSit =
    situacao && !["todos", "all", "null", "undefined"].includes(String(situacao))
      ? String(situacao).toUpperCase()
      : null;

  const where = {
    AND: [
      { organizacaoId: Number(organizacaoId) },
      parsedLojaFilter && !isNaN(parsedLojaFilter) ? { lojaId: parsedLojaFilter } : {},
      normalizedSit && VALID_SITUATIONS.includes(normalizedSit) ? { situacao: normalizedSit } : {},
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
      role && role !== "todos" ? { role: String(role).toUpperCase() } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [{ createdAt: "desc" }],
      select: USER_PUBLIC_SELECT,
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    data: sanitizeUsers(users),
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

// função para atualizar cadastro, telefone, situação trabalhista, data de admissão, cargo, loja e foto do colaborador
// 1 - Impede alteração fora da organização e valida unicidade do novo e-mail na rede
// 2 - Impede rebaixar ou afastar o único Administrador ATIVO da Organização
// 3 - Permite transferir GERENTE ou OPERADOR para outra loja ativa e invalida cache imediatamente
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
    updateData.senha = await bcrypt.hash(senha, 10);
  }

  let imagePath = user.imagem;
  if (removeImage) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try {
          fs.unlinkSync(`.${imagePath}`);
        } catch {
          /* ignore */
        }
      }
    }
    updateData.imagem = null;
  } else if (newImagePath) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try {
          fs.unlinkSync(`.${imagePath}`);
        } catch {
          /* ignore */
        }
      }
    }
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

// função para demitir (cancelar matrícula e excluir fisicamente) preservando histórico, antigo ID, matrícula e gerando relatório dos meses trabalhados
// 1 - Impede autoexclusão e exclusão do último administrador da Organização
// 2 - Grava snapshots imutáveis (vendedorRefId, nome, email, matricula, dataAdmissao e dataDesligamento) antes de apagar a conta
// 3 - Compila e devolve relatório completo mês a mês entre dataInicio e dataTermino com identificação enxuta (nome, email e matrícula cancelada)
export async function deleteUser(id, requestingUserId = null, organizacaoId) {
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
  const dataTermino = new Date();
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

  if (user.imagem) {
    if (user.imagem.startsWith("http://") || user.imagem.startsWith("https://")) {
      await deleteFromCloudinary(user.imagem);
    } else if (fs.existsSync(`.${user.imagem}`)) {
      try {
        fs.unlinkSync(`.${user.imagem}`);
      } catch {
        /* ignore */
      }
    }
  }

  invalidateUserCache(targetId);

  // Consolida vendas mês a mês no exato intervalo trabalhado [dataInicio .. dataTermino]
  const timeline = buildWorkedMonthsTimeline(effectiveStart, dataTermino);
  const monthIndexMap = new Map(timeline.map((m) => [m.key, m]));
  const totalOrderIds = new Set();
  const productMap = new Map();
  let faturamentoTotal = 0;
  let totalPecas = 0;

  for (const mov of salesMovements) {
    const val = Number(mov.valorTotal || 0);
    const qty = Number(mov.quantidade || 0);
    const d = new Date(mov.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const orderKey = mov.pedidoId ? `P_${mov.pedidoId}` : `M_${mov.id}`;

    faturamentoTotal += val;
    totalPecas += qty;
    totalOrderIds.add(orderKey);

    if (monthIndexMap.has(key)) {
      const mb = monthIndexMap.get(key);
      mb.faturamento += val;
      mb.pecas += qty;
      mb._orderIds.add(orderKey);
    }

    const pName = mov.produto?.nome || `Produto #${mov.produtoId}`;
    const prodAcc = productMap.get(mov.produtoId) || {
      produtoId: mov.produtoId,
      nome: pName,
      quantidade: 0,
      faturamento: 0,
    };
    prodAcc.quantidade += qty;
    prodAcc.faturamento += val;
    productMap.set(mov.produtoId, prodAcc);
  }

  const totalPedidosCancelados = sellerOrders.filter((p) => p.status === "CANCELADO").length;
  const totalPedidosConcluidos = totalOrderIds.size;
  faturamentoTotal = Number(faturamentoTotal.toFixed(2));

  const relatorioDesligamento = {
    vendedor: {
      nome: user.nome,
      email: user.email,
      matricula: matriculaCode,
      matriculaCancelada: true,
      matriculaDisplay: formatMatriculaDisplay(targetId, matriculaCode, true),
      dataInicio: effectiveStart.toISOString(),
      dataTermino: dataTermino.toISOString(),
    },
    resumo: {
      faturamentoTotal,
      totalPedidosConcluidos,
      totalPecas,
      totalPedidosCancelados,
      ticketMedio:
        totalPedidosConcluidos > 0
          ? Number((faturamentoTotal / totalPedidosConcluidos).toFixed(2))
          : 0,
    },
    vendasPorMes: timeline.map((m) => ({
      mes: m.key,
      label: m.label,
      pedidosConcluidos: m._orderIds.size,
      pecas: m.pecas,
      faturamento: Number(m.faturamento.toFixed(2)),
    })),
    topProdutos: Array.from(productMap.values())
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10)
      .map((p) => ({ ...p, faturamento: Number(p.faturamento.toFixed(2)) })),
    pedidos: sellerOrders.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      status: p.status,
      valorTotal: Number(p.valorTotal),
      createdAt: p.createdAt,
      itensCount: p.itens?.length || 0,
    })),
  };

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
    preservedHistory: hadHistory,
    relatorioDesligamento,
    message: hadHistory
      ? `Matrícula ${matriculaCode} cancelada e "${user.nome}" desligado(a). Vendas históricas preservadas para consulta por matrícula/ID.`
      : `Matrícula ${matriculaCode} cancelada e colaborador "${user.nome}" removido permanentemente.`,
  };
}
