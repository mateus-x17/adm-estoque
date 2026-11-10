import { prisma, Prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";

// arquivo responsável pelas regras de negócio e métricas de fornecedores isolados por Organização e Loja

// função para criar novo fornecedor vinculado à loja alvo
export async function createSupplier(data, storeScope) {
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }

  const { nome, email, telefone, endereco } = data;
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de fornecedor é obrigatório", 400);
  }

  return prisma.fornecedor.create({
    data: {
      nome: nome.trim(),
      email: email || null,
      telefone: telefone || null,
      endereco: endereco || null,
      ativo: true,
      organizacaoId: Number(storeScope.organizacaoId),
      lojaId: Number(storeScope.lojaId),
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função para listar fornecedores da Organização ou Loja com suporte a filtro de status
export async function listSuppliers(scope, status = "ativos") {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  return prisma.fornecedor.findMany({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...statusFilter,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      _count: {
        select: { produtos: true },
      },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

// função para atualizar fornecedor garantindo isolamento por Organização (e Loja para não-ADMIN)
export async function updateSupplier(id, data, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const { nome, email, telefone, endereco, ativo } = data;

  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: parseInt(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: {
      nome: nome ? nome.trim() : undefined,
      email: email !== undefined ? email : undefined,
      telefone: telefone !== undefined ? telefone : undefined,
      endereco: endereco !== undefined ? endereco : undefined,
      ativo: ativo !== undefined ? parseBooleanFlag(ativo) : undefined,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função para inativar ou reativar logicamente um fornecedor (Soft Delete)
export async function toggleSupplierStatus(id, ativo, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const supplierId = parseInt(id);

  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: supplierId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  return prisma.fornecedor.update({
    where: { id: supplierId },
    data: { ativo: parseBooleanFlag(ativo) },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função exclusiva de ADMIN para excluir ou aplicar Soft Delete automático caso haja produtos/pedidos associados
export async function deleteSupplier(id, organizacaoId) {
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const supplierId = parseInt(id);

  const supplier = await prisma.fornecedor.findFirst({
    where: { id: supplierId, organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { produtos: true, pedidos: true } } },
  });
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  if (supplier._count.produtos > 0 || supplier._count.pedidos > 0) {
    const inactivated = await prisma.fornecedor.update({
      where: { id: supplierId },
      data: { ativo: false },
    });
    return {
      softDeleted: true,
      message: `Fornecedor "${supplier.nome}" possui histórico ou produtos vinculados e foi inativado logicamente.`,
      fornecedor: inactivated,
    };
  }

  await prisma.fornecedor.delete({ where: { id: supplierId } });
  return {
    softDeleted: false,
    message: `Fornecedor "${supplier.nome}" deletado permanentemente com sucesso.`,
  };
}

// função para consultar detalhes de um único fornecedor dentro do escopo
export async function getSupplierById(id, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const supplierId = parseInt(id);
  if (isNaN(supplierId)) throw new AppError("ID de fornecedor inválido", 400);

  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: supplierId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });

  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);
  return supplier;
}

// função para contar fornecedores ativos no escopo selecionado
export async function countSuppliers(scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  return prisma.fornecedor.count({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ativo: true,
    },
  });
}

// função SQL nativa para consolidar reposições e vendas por fornecedor (respeitando filtro de status e excluindo estornos)
// 1 - Filtra por organizacaoId, status ('ativos', 'inativos', 'todos') e opcionalmente por lojaId
// 2 - Considera apenas movimentações válidas (m.estorno = false e pedido inexistente ou CONCLUIDO)
export async function getSupplierStats(scope, status = "ativos") {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const lojaFilter = scope.lojaId
    ? Prisma.sql`AND f."lojaId" = ${Number(scope.lojaId)}`
    : Prisma.empty;

  const statusFilterSql =
    status === "inativos"
      ? Prisma.sql`AND f."ativo" = false`
      : status === "todos"
      ? Prisma.empty
      : Prisma.sql`AND f."ativo" = true`;

  const rawResults = await prisma.$queryRaw`
    SELECT
      f.id AS "id",
      f.nome AS "nome",
      f.ativo AS "ativo",
      l.nome AS "lojaNome",
      COALESCE(SUM(CASE WHEN m.tipo = 'REPOSICAO' THEN m.quantidade ELSE 0 END), 0)::int AS "totalReposicoes",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade ELSE 0 END), 0)::int AS "totalVendas",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalMovimentacoes"
    FROM "Fornecedor" f
    JOIN "Loja" l ON l.id = f."lojaId"
    LEFT JOIN "Produto" p ON p."fornecedorId" = f.id
    LEFT JOIN "Movimento" m ON m."produtoId" = p.id AND m."estorno" = false
    LEFT JOIN "Pedido" ped ON ped.id = m."pedidoId"
    WHERE f."organizacaoId" = ${Number(scope.organizacaoId)}
      ${statusFilterSql}
      ${lojaFilter}
      AND (m.id IS NULL OR m."pedidoId" IS NULL OR ped."status" = 'CONCLUIDO')
    GROUP BY f.id, f.nome, f.ativo, l.nome
    ORDER BY f.nome ASC
  `;

  return rawResults.map((sup) => ({
    id: Number(sup.id),
    nome: sup.nome,
    ativo: Boolean(sup.ativo),
    lojaNome: sup.lojaNome,
    totalReposicoes: Number(sup.totalReposicoes || 0),
    totalVendas: Number(sup.totalVendas || 0),
    totalEntradas: Number(sup.totalReposicoes || 0),
    totalSaidas: Number(sup.totalVendas || 0),
    totalMovimentacoes: Number(sup.totalMovimentacoes || 0),
    produtoMaisMovimentado: "Geral",
  }));
}
