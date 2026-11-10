import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";

// arquivo responsável pelas regras de negócio e persistência de categorias isoladas por Organização e Loja

// função auxiliar para construir o filtro de pertencimento ao escopo de leitura/escrita
// 1 - Isola sempre por organizacaoId e opcionalmente por lojaId
function buildScopeWhere(scope) {
  return {
    organizacaoId: Number(scope.organizacaoId),
    ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
  };
}

// função para listar categorias da Organização ou de uma Loja específica com suporte a Soft Delete
// 1 - Aceita scope (organizacaoId, lojaId?) e filtro status ('ativos', 'inativos', 'todos')
// 2 - Retorna categorias ordenadas por status e nome, incluindo a loja vinculada e contagem de produtos
export async function listCategories(scope, status = "ativos") {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  return prisma.categoria.findMany({
    where: {
      ...buildScopeWhere(scope),
      ...statusFilter,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      _count: { select: { produtos: true } },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

// função para criar uma nova categoria dentro da loja resolvida pelo escopo
// 1 - Valida nome não vazio e unicidade dentro da loja (chave composta lojaId_nome)
// 2 - Persiste categoria ativa vinculada à organizacaoId e lojaId
export async function createCategory(nome, storeScope) {
  if (!storeScope?.lojaId || !storeScope?.organizacaoId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de categoria é obrigatório e deve ser texto", 400);
  }

  const cleanName = nome.trim();
  const lojaId = Number(storeScope.lojaId);
  const organizacaoId = Number(storeScope.organizacaoId);

  const existing = await prisma.categoria.findUnique({
    where: {
      lojaId_nome: {
        lojaId,
        nome: cleanName,
      },
    },
  });

  if (existing) {
    throw new AppError("Já existe uma categoria cadastrada com este nome nesta loja", 400);
  }

  return prisma.categoria.create({
    data: {
      nome: cleanName,
      ativo: true,
      organizacaoId,
      lojaId,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função para atualizar o nome de uma categoria respeitando escopo de Organização/Loja
// 1 - Busca garantindo que pertence à organização (e à loja do usuário caso não seja ADMIN)
// 2 - Verifica colisão de nome na mesma loja antes de salvar
export async function updateCategory(id, nome, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de categoria é obrigatório e deve ser texto", 400);
  }

  const cleanName = nome.trim();
  const category = await prisma.categoria.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });

  if (!category) throw new AppError("Categoria não encontrada", 404);

  const existing = await prisma.categoria.findUnique({
    where: {
      lojaId_nome: {
        lojaId: category.lojaId,
        nome: cleanName,
      },
    },
  });

  if (existing && existing.id !== Number(id)) {
    throw new AppError("Já existe outra categoria cadastrada com este nome nesta loja", 400);
  }

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { nome: cleanName },
    include: { loja: { select: { id: true, nome: true, slug: true } } },
  });
}

// função para inativar ou reativar logicamente uma categoria (Soft Delete)
export async function toggleCategoryStatus(id, ativo, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const category = await prisma.categoria.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!category) throw new AppError("Categoria não encontrada", 404);

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
    include: { loja: { select: { id: true, nome: true, slug: true } } },
  });
}

// função exclusiva de ADMIN para excluir categoria (ou aplicar Soft Delete automático se houver produtos associados)
export async function deleteCategory(id, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  const category = await prisma.categoria.findFirst({
    where: { id: Number(id), organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { produtos: true } } },
  });
  if (!category) throw new AppError("Categoria não encontrada", 404);

  if (category._count.produtos > 0) {
    const inactivated = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { ativo: false },
    });
    return {
      softDeleted: true,
      message: `Categoria "${category.nome}" possui ${category._count.produtos} produto(s) associado(s) e foi inativada logicamente.`,
      category: inactivated,
    };
  }

  await prisma.categoria.delete({ where: { id: Number(id) } });
  return {
    softDeleted: false,
    message: `Categoria "${category.nome}" excluída permanentemente.`,
  };
}

// função para contar categorias ativas do escopo selecionado
export async function countCategories(scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  return prisma.categoria.count({
    where: {
      ...buildScopeWhere(scope),
      ativo: true,
    },
  });
}
