import bcrypt from "bcryptjs";
import { prisma } from "../config/prismaClient.js";
import fs from "fs";
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers, parseBooleanFlag } from "../utils/sanitizers.js";
import { deleteFromCloudinary } from "../config/cloudinaryConfig.js";
import { invalidateUserCache } from "../middlewares/authMiddleware.js";

// arquivo responsável pelas regras de negócio e persistência de usuários isoladas por estabelecimento (multi-tenant)

// função para criar um novo colaborador dentro da mesma loja do administrador
// 1 - Realiza a validação da presença dos dados obrigatórios (nome, email, senha) e do tenant (empresaId)
// 2 - Faz query ao DB verificando se o e-mail já está em uso especificamente dentro desta mesma empresa
// 3 - Gera o hash seguro da senha com bcrypt (salt 10)
// 4 - Cria o usuário vinculado ao empresaId, com status ativo = true e role definida (ou OPERADOR por padrão)
// 5 - Retorna os dados sanitizados sem a senha
export async function createUser(data, imagePath = null, empresaId) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);

  const { nome, email, senha, role } = data;
  if (!nome || !email || !senha) {
    throw new AppError("Nome, email e senha são obrigatórios", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // E-mail único por loja: verifica duplicidade apenas dentro do mesmo tenant
  const existing = await prisma.usuario.findUnique({
    where: {
      empresaId_email: {
        empresaId: Number(empresaId),
        email: normalizedEmail,
      },
    },
  });
  if (existing) throw new AppError("Este e-mail já está cadastrado neste estabelecimento", 400);

  const normalizedRole = role ? String(role).toUpperCase() : "OPERADOR";
  if (!["ADMIN", "GERENTE", "OPERADOR"].includes(normalizedRole)) {
    throw new AppError("Role inválida. Deve ser ADMIN, GERENTE ou OPERADOR", 400);
  }

  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email: normalizedEmail,
      senha: hashed,
      role: normalizedRole,
      imagem: imagePath,
      ativo: true,
      empresaId: Number(empresaId),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      imagem: true,
      ativo: true,
      empresaId: true,
      createdAt: true,
    },
  });

  return sanitizeUser(user);
}

// função para listar usuários da empresa atual com paginação, busca e filtros de cargo e status
// 1 - Constrói os filtros dinâmicos garantindo estritamente a condição empresaId para isolamento multi-tenant
// 2 - Filtra por status ativo/inativo conforme o parâmetro status ('ativos', 'inativos' ou 'todos')
// 3 - Executa em paralelo a busca paginada e a contagem total usando Promise.all
// 4 - Retorna os usuários sanitizados com os metadados de paginação
export async function listUsers({
  empresaId,
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = "todos",
}) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);
  const skip = (page - 1) * limit;

  const statusFilter =
    status === "ativos"
      ? { ativo: true }
      : status === "inativos"
      ? { ativo: false }
      : {};

  const where = {
    AND: [
      { empresaId: Number(empresaId) },
      statusFilter,
      search
        ? {
            OR: [
              {
                nome: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              !isNaN(search)
                ? {
                    id: Number(search),
                  }
                : {},
            ],
          }
        : {},
      role && role !== "todos"
        ? {
            role: role.toUpperCase(),
          }
        : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    data: sanitizeUsers(users),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// função para buscar detalhes de um usuário garantindo que pertence ao mesmo estabelecimento
// 1 - Realiza busca usando findFirst filtrando por id e empresaId (impede acesso cruzado entre lojas)
// 2 - Inclui dados básicos da empresa vinculada e lança erro 404 se não encontrado no tenant
// 3 - Remove a senha e retorna o usuário sanitizado
export async function getUserById(id, empresaId) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);

  const user = await prisma.usuario.findFirst({
    where: {
      id: Number(id),
      empresaId: Number(empresaId),
    },
    include: {
      empresa: {
        select: { id: true, nome: true, slug: true },
      },
    },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  return sanitizeUser(user);
}

// função para atualizar os dados cadastrais, cargo e foto de um usuário do estabelecimento
// 1 - Busca o usuário garantindo pertencimento ao empresaId para evitar alteração entre lojas
// 2 - Valida unicidade de e-mail dentro do mesmo tenant se o e-mail foi alterado
// 3 - Impede o rebaixamento do último administrador ativo da loja
// 4 - Gerencia remoção ou substituição da imagem antiga no Cloudinary mantendo higiene do armazenamento
// 5 - Salva as alterações, invalida cache de sessão e retorna o perfil atualizado
export async function updateUser(id, data, newImagePath = null, removeImage = false, empresaId) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);

  const user = await prisma.usuario.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  const { nome, email, role, senha, ativo } = data;
  const updateData = {};

  if (nome !== undefined) updateData.nome = nome.trim();

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const emailTaken = await prisma.usuario.findUnique({
        where: {
          empresaId_email: {
            empresaId: Number(empresaId),
            email: normalizedEmail,
          },
        },
      });
      if (emailTaken) {
        throw new AppError("Este e-mail já está sendo utilizado por outro usuário nesta loja", 400);
      }
      updateData.email = normalizedEmail;
    }
  }

  if (role !== undefined) {
    const normalizedRole = String(role).toUpperCase();
    const validRoles = ["ADMIN", "GERENTE", "OPERADOR"];
    if (!validRoles.includes(normalizedRole)) {
      throw new AppError("Role inválida. Deve ser ADMIN, GERENTE ou OPERADOR", 400);
    }

    // Impedir rebaixamento do último Administrador ativo da loja
    if (user.role === "ADMIN" && normalizedRole !== "ADMIN") {
      const adminCount = await prisma.usuario.count({
        where: { empresaId: Number(empresaId), role: "ADMIN", ativo: true },
      });
      if (adminCount <= 1) {
        throw new AppError("Operação bloqueada: não é permitido rebaixar o único administrador ativo da loja", 400);
      }
    }

    updateData.role = normalizedRole;
  }

  if (ativo !== undefined) {
    updateData.ativo = parseBooleanFlag(ativo);
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
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    updateData.imagem = null;
  } else if (newImagePath) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    imagePath = newImagePath;
    updateData.imagem = imagePath;
  }

  const updated = await prisma.usuario.update({
    where: { id: Number(id) },
    data: updateData,
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      imagem: true,
      ativo: true,
      empresaId: true,
    },
  });

  invalidateUserCache(id);
  return sanitizeUser(updated);
}

// função para executar a inativação lógica ou reativação (Soft Delete) de um colaborador
// 1 - Valida se o usuário alvo pertence ao mesmo tenant do administrador solicitante
// 2 - Impede que o administrador desative a própria conta
// 3 - Impede a desativação do último administrador ativo do estabelecimento
// 4 - Atualiza a flag 'ativo' no banco de dados e limpa imediatamente o cache de autenticação
export async function toggleUserStatus(id, ativo, requestingUserId, empresaId) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);
  const targetId = Number(id);
  const newStatus = parseBooleanFlag(ativo);

  if (!newStatus && requestingUserId && Number(requestingUserId) === targetId) {
    throw new AppError("Você não pode inativar a sua própria conta", 400);
  }

  const user = await prisma.usuario.findFirst({
    where: { id: targetId, empresaId: Number(empresaId) },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (!newStatus && user.role === "ADMIN") {
    const activeAdmins = await prisma.usuario.count({
      where: { empresaId: Number(empresaId), role: "ADMIN", ativo: true },
    });
    if (activeAdmins <= 1) {
      throw new AppError("Operação bloqueada: não é permitido inativar o único administrador ativo da loja", 400);
    }
  }

  const updated = await prisma.usuario.update({
    where: { id: targetId },
    data: { ativo: newStatus },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      imagem: true,
      ativo: true,
      empresaId: true,
    },
  });

  invalidateUserCache(targetId);
  return sanitizeUser(updated);
}

// função para excluir um usuário do sistema (com fallback automático para Soft Delete se houver histórico)
// 1 - Confirma existência do usuário dentro da mesma empresa e previne autoexclusão
// 2 - Impede a exclusão do último administrador da loja
// 3 - Se o colaborador possuir movimentações vinculadas no livro-razão, realiza Soft Delete (ativo = false) preservando a auditoria
// 4 - Caso não possua histórico, apaga sua imagem do Cloudinary/disco e remove o registro definitivamente
export async function deleteUser(id, requestingUserId = null, empresaId) {
  if (!empresaId) throw new AppError("Estabelecimento não identificado", 400);
  const targetId = Number(id);

  if (requestingUserId && Number(requestingUserId) === targetId) {
    throw new AppError("Você não pode excluir a sua própria conta", 400);
  }

  const user = await prisma.usuario.findFirst({
    where: { id: targetId, empresaId: Number(empresaId) },
    include: { _count: { select: { movimentos: true } } },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (user.role === "ADMIN") {
    const adminCount = await prisma.usuario.count({
      where: { empresaId: Number(empresaId), role: "ADMIN", ativo: true },
    });
    if (adminCount <= 1) {
      throw new AppError("Operação bloqueada: não é permitido excluir o único administrador ativo da loja", 400);
    }
  }

  // Se houver histórico de movimentações, executa inativação lógica para preservar auditoria
  if (user._count.movimentos > 0) {
    const inactivated = await prisma.usuario.update({
      where: { id: targetId },
      data: { ativo: false },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
        ativo: true,
        empresaId: true,
      },
    });
    invalidateUserCache(targetId);
    return {
      softDeleted: true,
      message: `Usuário "${user.nome}" possui ${user._count.movimentos} movimentação(ões) no histórico e foi inativado logicamente para preservar a auditoria.`,
      user: sanitizeUser(inactivated),
    };
  }

  // Sem movimentações: exclusão física e limpeza de mídia
  if (user.imagem) {
    if (user.imagem.startsWith("http://") || user.imagem.startsWith("https://")) {
      await deleteFromCloudinary(user.imagem);
    } else if (fs.existsSync(`.${user.imagem}`)) {
      try { fs.unlinkSync(`.${user.imagem}`); } catch (e) { /* ignore */ }
    }
  }

  invalidateUserCache(targetId);
  await prisma.usuario.delete({ where: { id: targetId } });

  return {
    softDeleted: false,
    message: `Usuário "${user.nome}" removido permanentemente com sucesso.`,
  };
}
