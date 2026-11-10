import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";
import { generateSlug } from "../utils/tenantScope.js";
import { invalidateUserCache } from "../middlewares/authMiddleware.js";

// arquivo responsável pelas regras de negócio e gestão de Lojas (filiais) dentro de uma Organização

// função para listar lojas acessíveis ao usuário autenticado
// 1 - ADMIN visualiza todas as lojas da sua Organização com contadores de equipe, produtos e pedidos
// 2 - GERENTE e OPERADOR visualizam apenas a sua própria loja vinculada
export async function listStores(requestingUser, status = "todos") {
  if (!requestingUser?.organizacaoId) {
    throw new AppError("Organização não identificada", 400);
  }

  const organizacaoId = Number(requestingUser.organizacaoId);
  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  if (requestingUser.role !== "ADMIN") {
    if (!requestingUser.lojaId) return [];
    const loja = await prisma.loja.findFirst({
      where: { id: Number(requestingUser.lojaId), organizacaoId },
      include: {
        _count: { select: { usuarios: true, produtos: true, pedidos: true } },
      },
    });
    return loja ? [loja] : [];
  }

  return prisma.loja.findMany({
    where: { organizacaoId, ...statusFilter },
    include: {
      _count: {
        select: { usuarios: true, produtos: true, pedidos: true },
      },
    },
    orderBy: [{ ativo: "desc" }, { id: "asc" }],
  });
}

// função para buscar detalhes de uma loja específica garantindo isolamento da Organização
// 1 - Valida se o usuário é ADMIN ou pertence à loja consultada
export async function getStoreById(id, requestingUser) {
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  if (requestingUser.role !== "ADMIN" && Number(requestingUser.lojaId) !== lojaId) {
    throw new AppError("Acesso negado a esta loja", 403);
  }

  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(requestingUser.organizacaoId) },
    include: {
      _count: {
        select: { usuarios: true, produtos: true, categorias: true, fornecedores: true, pedidos: true },
      },
    },
  });

  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);
  return loja;
}

// função exclusiva de ADMIN para criar uma nova loja/filial na sua Organização
// 1 - Valida nome obrigatório e gera slug único dentro da Organização
// 2 - Persiste a nova filial ativa com endereço, CNPJ e telefone opcionais
export async function createStore(data, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const { nome, slug, cnpj, telefone, endereco } = data;
  if (!nome || String(nome).trim() === "") {
    throw new AppError("Nome da loja é obrigatório", 400);
  }

  const baseSlug = generateSlug(slug || nome);
  if (!baseSlug) throw new AppError("Nome inválido para geração de código da loja", 400);

  let finalSlug = baseSlug;
  const existing = await prisma.loja.findUnique({
    where: {
      organizacaoId_slug: {
        organizacaoId: Number(organizacaoId),
        slug: finalSlug,
      },
    },
  });

  if (existing) {
    if (slug) {
      throw new AppError("Já existe uma loja com este identificador (slug) na sua rede", 400);
    }
    finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  return prisma.loja.create({
    data: {
      nome: String(nome).trim(),
      slug: finalSlug,
      cnpj: cnpj ? String(cnpj).trim() : null,
      telefone: telefone ? String(telefone).trim() : null,
      endereco: endereco ? String(endereco).trim() : null,
      ativo: true,
      organizacaoId: Number(organizacaoId),
    },
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });
}

// função exclusiva de ADMIN para atualizar dados cadastrais de uma loja da Organização
// 1 - Verifica pertencimento à organização e eventual conflito de slug
// 2 - Atualiza campos permitidos e limpa cache de sessão dos colaboradores para refletir novo nome/slug
export async function updateStore(id, data, organizacaoId) {
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
  });
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  const { nome, slug, cnpj, telefone, endereco } = data;
  const updateData = {};

  if (nome !== undefined) {
    if (String(nome).trim() === "") throw new AppError("Nome da loja não pode ser vazio", 400);
    updateData.nome = String(nome).trim();
  }

  if (slug !== undefined && String(slug).trim() !== "") {
    const cleanSlug = generateSlug(slug);
    if (!cleanSlug) throw new AppError("Slug da loja inválido", 400);
    const conflict = await prisma.loja.findUnique({
      where: {
        organizacaoId_slug: {
          organizacaoId: Number(organizacaoId),
          slug: cleanSlug,
        },
      },
    });
    if (conflict && conflict.id !== lojaId) {
      throw new AppError("Já existe outra loja utilizando este identificador (slug)", 400);
    }
    updateData.slug = cleanSlug;
  }

  if (cnpj !== undefined) updateData.cnpj = cnpj ? String(cnpj).trim() : null;
  if (telefone !== undefined) updateData.telefone = telefone ? String(telefone).trim() : null;
  if (endereco !== undefined) updateData.endereco = endereco ? String(endereco).trim() : null;

  const updated = await prisma.loja.update({
    where: { id: lojaId },
    data: updateData,
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });

  invalidateUserCache();
  return updated;
}

// função exclusiva de ADMIN para inativar ou reativar logicamente uma loja (Soft Delete)
// 1 - Impede desativar a única loja ativa restante na Organização
// 2 - Invalida o cache de autenticação imediatamente para bloquear colaboradores da filial inativada
export async function toggleStoreStatus(id, ativo, organizacaoId) {
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
  });
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  const newStatus = parseBooleanFlag(ativo);
  if (!newStatus) {
    const activeCount = await prisma.loja.count({
      where: { organizacaoId: Number(organizacaoId), ativo: true },
    });
    if (activeCount <= 1 && loja.ativo) {
      throw new AppError(
        "Operação bloqueada: a organização precisa manter pelo menos uma loja ativa.",
        400
      );
    }
  }

  const updated = await prisma.loja.update({
    where: { id: lojaId },
    data: { ativo: newStatus },
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });

  invalidateUserCache();
  return updated;
}

// função exclusiva de ADMIN para excluir uma loja ou aplicar inativação lógica se houver dados históricos
// 1 - Verifica pertencimento à organização e protege a última loja ativa
// 2 - Se houver produtos, pedidos, movimentações ou colaboradores vinculados, aplica Soft Delete (ativo = false)
// 3 - Caso a loja esteja vazia, exclui fisicamente do banco
export async function deleteStore(id, organizacaoId) {
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
    include: {
      _count: {
        select: {
          usuarios: true,
          produtos: true,
          categorias: true,
          fornecedores: true,
          pedidos: true,
          movimentos: true,
        },
      },
    },
  });

  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  const activeCount = await prisma.loja.count({
    where: { organizacaoId: Number(organizacaoId), ativo: true },
  });
  if (activeCount <= 1 && loja.ativo) {
    throw new AppError(
      "Não é possível excluir ou inativar a única loja ativa da organização.",
      400
    );
  }

  const hasDependencies =
    loja._count.produtos > 0 ||
    loja._count.pedidos > 0 ||
    loja._count.movimentos > 0 ||
    loja._count.usuarios > 0 ||
    loja._count.categorias > 0 ||
    loja._count.fornecedores > 0;

  if (hasDependencies) {
    const inactivated = await prisma.loja.update({
      where: { id: lojaId },
      data: { ativo: false },
    });
    invalidateUserCache();
    return {
      softDeleted: true,
      message: `Loja "${loja.nome}" possui histórico ou equipe vinculada e foi desativada logicamente.`,
      loja: inactivated,
    };
  }

  await prisma.loja.delete({ where: { id: lojaId } });
  invalidateUserCache();
  return {
    softDeleted: false,
    message: `Loja "${loja.nome}" removida definitivamente com sucesso.`,
  };
}

