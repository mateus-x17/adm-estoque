import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';
import { parseBooleanFlag } from '../utils/sanitizers.js';

// arquivo responsável pelas regras de negócio e persistência de fornecedores isolados por estabelecimento

// função para criar um novo fornecedor vinculado ao tenant da sessão
// 1 - Valida nome obrigatório e empresaId
// 2 - Persiste o fornecedor no banco vinculado à empresaId como ativo = true
export async function createSupplier(data, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const { nome, email, telefone, endereco } = data;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de fornecedor é obrigatório', 400);
  }

  return prisma.fornecedor.create({
    data: {
      nome: nome.trim(),
      email: email || null,
      telefone: telefone || null,
      endereco: endereco || null,
      ativo: true,
      empresaId: Number(empresaId),
    },
  });
}

// função para listar os fornecedores da empresa atual filtrados por status
// 1 - Filtra estritamente por empresaId e pelo status ('ativos', 'inativos', 'todos')
// 2 - Inclui a contagem de produtos associados para visualização administrativa
export async function listSuppliers(empresaId, status = 'ativos') {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const statusFilter =
    status === 'ativos' ? { ativo: true } : status === 'inativos' ? { ativo: false } : {};

  return prisma.fornecedor.findMany({
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

// função para atualizar os dados cadastrais de um fornecedor pertencente à loja
// 1 - Busca garantindo que pertence à empresaId (impede manipulação cruzada entre lojas)
// 2 - Atualiza campos permitidos e devolve o objeto atualizado
export async function updateSupplier(id, data, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const { nome, email, telefone, endereco, ativo } = data;

  const supplier = await prisma.fornecedor.findFirst({
    where: { id: parseInt(id), empresaId: Number(empresaId) },
  });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: {
      nome: nome ? nome.trim() : undefined,
      email: email !== undefined ? email : undefined,
      telefone: telefone !== undefined ? telefone : undefined,
      endereco: endereco !== undefined ? endereco : undefined,
      ativo: ativo !== undefined ? parseBooleanFlag(ativo) : undefined,
    },
  });
}

// função para inativar ou reativar um fornecedor (Soft Delete)
export async function toggleSupplierStatus(id, ativo, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const supplierId = parseInt(id);

  const supplier = await prisma.fornecedor.findFirst({
    where: { id: supplierId, empresaId: Number(empresaId) },
  });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.update({
    where: { id: supplierId },
    data: { ativo: parseBooleanFlag(ativo) },
  });
}

// função para excluir um fornecedor (com fallback automático para Soft Delete caso haja produtos vinculados)
// 1 - Verifica pertencimento ao empresaId e contabiliza produtos vinculados
// 2 - Se houver produtos vinculados, inativa logicamente (ativo = false) preservando integridade
// 3 - Se não houver vínculo, exclui definitivamente do banco
export async function deleteSupplier(id, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const supplierId = parseInt(id);

  const supplier = await prisma.fornecedor.findFirst({
    where: { id: supplierId, empresaId: Number(empresaId) },
    include: { _count: { select: { produtos: true } } },
  });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  if (supplier._count.produtos > 0) {
    const inactivated = await prisma.fornecedor.update({
      where: { id: supplierId },
      data: { ativo: false },
    });
    return {
      softDeleted: true,
      message: `Fornecedor "${supplier.nome}" possui ${supplier._count.produtos} produto(s) vinculado(s) e foi inativado logicamente.`,
      fornecedor: inactivated,
    };
  }

  await prisma.fornecedor.delete({ where: { id: supplierId } });
  return {
    softDeleted: false,
    message: `Fornecedor "${supplier.nome}" deletado permanentemente com sucesso.`,
  };
}

// função para recuperar dados de um único fornecedor isolado por loja
export async function getSupplierById(id, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const supplierId = parseInt(id);
  if (isNaN(supplierId)) throw new AppError('ID de fornecedor inválido', 400);

  const supplier = await prisma.fornecedor.findFirst({
    where: { id: supplierId, empresaId: Number(empresaId) },
  });

  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);
  return supplier;
}

// função para contar apenas fornecedores ativos do estabelecimento
export async function countSuppliers(empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  return prisma.fornecedor.count({
    where: { empresaId: Number(empresaId), ativo: true },
  });
}

// função para levantar estatísticas agregadas por fornecedor restritas aos dados da empresa
// 1 - Executa query SQL nativa filtrando f."empresaId" e apenas fornecedores ativos
// 2 - Soma entradas e saídas para cada parceiro com zero N+1 queries
export async function getSupplierStats(empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const rawResults = await prisma.$queryRaw`
    SELECT
      f.id AS "id",
      f.nome AS "nome",
      COALESCE(SUM(CASE WHEN m.tipo = 'REPOSICAO' THEN m.quantidade ELSE 0 END), 0)::int AS "totalReposicoes",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade ELSE 0 END), 0)::int AS "totalVendas",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalMovimentacoes"
    FROM "Fornecedor" f
    LEFT JOIN "Produto" p ON p."fornecedorId" = f.id AND p."empresaId" = f."empresaId"
    LEFT JOIN "Movimento" m ON m."produtoId" = p.id AND m."empresaId" = f."empresaId"
    WHERE f."empresaId" = ${Number(empresaId)} AND f."ativo" = true
    GROUP BY f.id, f.nome
    ORDER BY f.nome ASC
  `;

  return rawResults.map((sup) => ({
    id: Number(sup.id),
    nome: sup.nome,
    totalReposicoes: Number(sup.totalReposicoes || 0),
    totalVendas: Number(sup.totalVendas || 0),
    totalEntradas: Number(sup.totalReposicoes || 0),
    totalSaidas: Number(sup.totalVendas || 0),
    totalMovimentacoes: Number(sup.totalMovimentacoes || 0),
    produtoMaisMovimentado: "Geral",
  }));
}
