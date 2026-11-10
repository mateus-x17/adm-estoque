import bcrypt from "bcryptjs";
import fs from "fs";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitizers.js";
import { deleteFromCloudinary } from "../config/cloudinaryConfig.js";
import { invalidateUserCache } from "../middlewares/authMiddleware.js";

// arquivo responsável pelas regras de negócio e gestão de usuários por Organização e Loja (com exclusão real preservando histórico)

const USER_PUBLIC_SELECT = {
  id: true,
  nome: true,
  email: true,
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

// função para criar novo colaborador ou administrador na Organização
// 1 - Valida obrigatoriedade de nome, email, senha e verifica unicidade de email dentro da Organização
// 2 - Resolve lojaId (obrigatório para GERENTE/OPERADOR; null para ADMIN da rede)
// 3 - Criptografa senha com bcrypt (custo 10) e retorna objeto sanitizado
export async function createUser(data, imagePath = null, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const { nome, email, senha, role, lojaId } = data;
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

  const assignedLojaId = await resolveAssignedStoreId(normalizedRole, lojaId, orgIdNum);
  const hashed = await bcrypt.hash(senha, 10);

  const user = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email: normalizedEmail,
      senha: hashed,
      role: normalizedRole,
      imagem: imagePath,
      organizacaoId: orgIdNum,
      lojaId: assignedLojaId,
    },
    select: USER_PUBLIC_SELECT,
  });

  return sanitizeUser(user);
}

// função para listar usuários da Organização com paginação e filtros por nome/ID, cargo e loja
// 1 - Isola estritamente pelo organizacaoId do ADMIN
// 2 - Suporta busca textual por nome, e-mail ou ID numérico, além de filtro por lojaId e role
// 3 - Executa busca paginada e contagem total em paralelo
export async function listUsers({
  organizacaoId,
  lojaId = null,
  page = 1,
  limit = 10,
  search = "",
  role = "",
}) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const trimmedSearch = String(search || "").trim();
  const parsedLojaFilter =
    lojaId && !["todos", "all", "todas", "null", "undefined"].includes(String(lojaId))
      ? Number(lojaId)
      : null;

  const where = {
    AND: [
      { organizacaoId: Number(organizacaoId) },
      parsedLojaFilter && !isNaN(parsedLojaFilter) ? { lojaId: parsedLojaFilter } : {},
      trimmedSearch
        ? {
          OR: [
            { nome: { contains: trimmedSearch, mode: "insensitive" } },
            { email: { contains: trimmedSearch, mode: "insensitive" } },
            !isNaN(Number(trimmedSearch)) ? { id: Number(trimmedSearch) } : {},
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
  return sanitizeUser(user);
}

// função para atualizar cadastro, cargo, loja de atuação (transferência entre filiais) e foto do colaborador
// 1 - Impede alteração fora da organização e valida unicidade do novo e-mail na rede
// 2 - Impede rebaixamento do último Administrador da Organização
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

  const { nome, email, role, senha, lojaId } = data;
  const updateData = {};

  if (nome !== undefined) updateData.nome = String(nome).trim();

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

    if (user.role === "ADMIN" && normalizedRole !== "ADMIN") {
      const adminCount = await prisma.usuario.count({
        where: { organizacaoId: orgIdNum, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new AppError(
          "Operação bloqueada: não é permitido rebaixar o único administrador da organização",
          400
        );
      }
    }

    effectiveRole = normalizedRole;
    updateData.role = normalizedRole;
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

// função para excluir definitivamente um colaborador preservando 100% do histórico de vendas e seu antigo ID (vendedorRefId)
// 1 - Impede autoexclusão e exclusão do último administrador da Organização
// 2 - Garante em transação que todos os pedidos e movimentações antigos preservem vendedorRefId, nome e email snapshot
// 3 - Executa DELETE real na tabela Usuario (FK SetNull desvincula conta) e remove mídia no Cloudinary
export async function deleteUser(id, requestingUserId = null, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const orgIdNum = Number(organizacaoId);
  const targetId = Number(id);

  if (requestingUserId && Number(requestingUserId) === targetId) {
    throw new AppError("Você não pode excluir a sua própria conta", 400);
  }

  const user = await prisma.usuario.findFirst({
    where: { id: targetId, organizacaoId: orgIdNum },
    include: { _count: { select: { pedidos: true, movimentos: true } } },
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

  await prisma.$transaction(async (tx) => {
    await tx.pedido.updateMany({
      where: { usuarioId: targetId },
      data: {
        vendedorRefId: targetId,
        vendedorNomeSnapshot: user.nome,
        vendedorEmailSnapshot: user.email,
      },
    });

    await tx.movimento.updateMany({
      where: { usuarioId: targetId },
      data: {
        vendedorRefId: targetId,
        vendedorNomeSnapshot: user.nome,
        vendedorEmailSnapshot: user.email,
      },
    });

    await tx.usuario.delete({
      where: { id: targetId },
    });
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

  const hadHistory = user._count.pedidos > 0 || user._count.movimentos > 0;
  return {
    ok: true,
    deletedId: targetId,
    deletedNome: user.nome,
    preservedHistory: hadHistory,
    message: hadHistory
      ? `Colaborador "${user.nome}" (ID antigo #${targetId}) excluído definitivamente. Suas vendas e faturamento históricos foram preservados para auditoria por ID.`
      : `Colaborador "${user.nome}" removido permanentemente com sucesso.`,
  };
}
