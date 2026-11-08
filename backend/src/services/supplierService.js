import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// serviço responsável por criar um novo fornecedor
// 1 - Desestrutura nome, email, telefone e endereco dos dados fornecidos
// 2 - Valida se o nome foi fornecido e é do tipo texto válido
// 3 - Retorna um erro 400 (Bad Request) caso a validação falhe
// 4 - Cria o fornecedor no banco de dados, aplicando trim() no nome
export async function createSupplier(data) {
  const { nome, email, telefone, endereco } = data;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de fornecedor é obrigatório', 400);
  }

  return prisma.fornecedor.create({
    data: { nome: nome.trim(), email, telefone, endereco }
  });
}

// serviço responsável por listar todos os fornecedores
// 1 - Executa a função findMany do Prisma na tabela fornecedor
// 2 - Retorna o array de fornecedores obtido
export async function listSuppliers() {
  return prisma.fornecedor.findMany();
}

// serviço responsável por atualizar os dados de um fornecedor
// 1 - Desestrutura os campos do fornecedor
// 2 - Busca o fornecedor pelo ID (convertido para inteiro) para checar a existência
// 3 - Se não encontrar, lança o erro 404
// 4 - Atualiza os campos fornecidos, garantindo que o nome, se vier, passe pelo trim()
export async function updateSupplier(id, data) {
  const { nome, email, telefone, endereco } = data;

  const supplier = await prisma.fornecedor.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: { nome: nome ? nome.trim() : undefined, email, telefone, endereco }
  });
}

// serviço responsável por deletar um fornecedor
// 1 - Busca o fornecedor no banco com base no ID passado
// 2 - Valida se existem produtos vinculados antes da exclusão (prevenção de erro P2003)
// 3 - Remove o registro do fornecedor do banco
export async function deleteSupplier(id) {
  const supplierId = parseInt(id);
  const supplier = await prisma.fornecedor.findUnique({
    where: { id: supplierId },
    include: { _count: { select: { produtos: true } } },
  });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  if (supplier._count.produtos > 0) {
    throw new AppError(
      `Não é possível excluir o fornecedor "${supplier.nome}" porque ele possui ${supplier._count.produtos} produto(s) vinculado(s).`,
      400
    );
  }

  return prisma.fornecedor.delete({ where: { id: supplierId } });
}

// serviço responsável por recuperar um fornecedor por ID
export async function getSupplierById(id) {
  const supplierId = parseInt(id);
  if (isNaN(supplierId)) throw new AppError('ID de fornecedor inválido', 400);

  const supplier = await prisma.fornecedor.findUnique({
    where: { id: supplierId }
  });

  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);
  return supplier;
}

// serviço responsável pela contagem de fornecedores
// 1 - Chama o método count() na entidade fornecedor
// 2 - Retorna a quantidade numérica exata de registros
export async function countSuppliers() {
  return prisma.fornecedor.count();
}

// serviço responsável por levantar a estatística de fluxo por fornecedor
// Otimizado com agregação SQL direta no PostgreSQL (I4), eliminando triplo include e loops em memória
export async function getSupplierStats() {
  const rawResults = await prisma.$queryRaw`
    SELECT
      f.id AS "id",
      f.nome AS "nome",
      COALESCE(SUM(CASE WHEN m.tipo = 'REPOSICAO' THEN m.quantidade ELSE 0 END), 0)::int AS "totalReposicoes",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade ELSE 0 END), 0)::int AS "totalVendas",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalMovimentacoes"
    FROM "Fornecedor" f
    LEFT JOIN "Produto" p ON p."fornecedorId" = f.id
    LEFT JOIN "Movimento" m ON m."produtoId" = p.id
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
    produtoMaisMovimentado: "Geral"
  }));
}
