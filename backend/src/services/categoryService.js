import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';
import { parseBooleanFlag } from '../utils/sanitizers.js';

// arquivo responsável pelas regras de negócio e persistência de categorias isoladas por estabelecimento

// função para listar todas as categorias da empresa com suporte a filtro de status
// 1 - Recebe o empresaId e o parâmetro opcional status ('ativos', 'inativos', 'todos')
// 2 - Consulta as categorias ordenadas por status ativo e nome alfabético
// 3 - Inclui a contagem de produtos ativos vinculados para exibição na UI
export async function listCategories(empresaId, status = 'ativos') {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const statusFilter =
    status === 'ativos' ? { ativo: true } : status === 'inativos' ? { ativo: false } : {};

  return prisma.categoria.findMany({
    where: {
      empresaId: Number(empresaId),
      ...statusFilter,
    },
    include: {
      _count: {
        select: { produtos: true },
      },
    },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  });
}

// função para criar uma nova categoria dentro da loja atual
// 1 - Valida se o nome é um texto não vazio e se o empresaId está presente
// 2 - Garante unicidade do nome dentro do mesmo estabelecimento via chave composta (empresaId_nome)
// 3 - Persiste a categoria como ativa no banco e devolve o objeto criado
export async function createCategory(nome, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  const cleanName = nome.trim();
  const existing = await prisma.categoria.findUnique({
    where: {
      empresaId_nome: {
        empresaId: Number(empresaId),
        nome: cleanName,
      },
    },
  });
  if (existing) {
    throw new AppError('Já existe uma categoria cadastrada com este nome nesta loja', 400);
  }

  return prisma.categoria.create({
    data: {
      nome: cleanName,
      ativo: true,
      empresaId: Number(empresaId),
    },
  });
}

// função para atualizar o nome de uma categoria pertencente ao estabelecimento
// 1 - Valida os campos de entrada e confirma que a categoria pertence ao empresaId da sessão
// 2 - Checa unicidade do novo nome dentro da própria loja evitando colisões
// 3 - Atualiza e retorna o registro modificado
export async function updateCategory(id, nome, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  const cleanName = nome.trim();
  const category = await prisma.categoria.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
  });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  const existing = await prisma.categoria.findUnique({
    where: {
      empresaId_nome: {
        empresaId: Number(empresaId),
        nome: cleanName,
      },
    },
  });
  if (existing && existing.id !== Number(id)) {
    throw new AppError('Já existe outra categoria cadastrada com este nome nesta loja', 400);
  }

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { nome: cleanName },
  });
}

// função para inativar ou reativar uma categoria (Soft Delete)
// 1 - Verifica pertencimento à empresa
// 2 - Atualiza a flag ativo no banco de dados e devolve a categoria
export async function toggleCategoryStatus(id, ativo, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const category = await prisma.categoria.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
  });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
  });
}

// função para excluir uma categoria (com fallback para Soft Delete caso haja produtos vinculados)
// 1 - Verifica se a categoria pertence à empresa e contabiliza produtos associados
// 2 - Se possuir produtos vinculados, realiza inativação lógica (ativo = false) para não quebrar catálogo histórico
// 3 - Se não houver produtos associados, exclui fisicamente do banco
export async function deleteCategory(id, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const category = await prisma.categoria.findFirst({
    where: { id: Number(id), empresaId: Number(empresaId) },
    include: { _count: { select: { produtos: true } } },
  });
  if (!category) throw new AppError('Categoria não encontrada', 404);

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

// função para contar apenas as categorias ativas do estabelecimento
export async function countCategories(empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  return prisma.categoria.count({
    where: { empresaId: Number(empresaId), ativo: true },
  });
}
