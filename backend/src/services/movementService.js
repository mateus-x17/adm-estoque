import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

/**
 * Constrói um Date a partir de uma string "YYYY-MM-DD" usando os componentes
 * de ano/mês/dia diretamente (sem passar pelo parser ISO, que interpreta
 * a string como UTC e pode deslocar o dia ao reaplicar horários no fuso local).
 */
function dateFromYMD(ymd, endOfDay = false) {
  const [year, month, day] = ymd.split('-').map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// serviço focado na busca super completa e relatorial de movimentações de estoque
// 1 - Recebe um objeto de filtros que pode conter diversos parâmetros simultâneos
// 2 - Constrói um array 'where.AND' condicionalmente, adicionando apenas os filtros que o usuário preencheu (ID, data específica, range de datas, produto, tipo, usuário)
// 3 - Lida dinamicamente com paginação, limitando o limite a 100 itens para evitar sobrecarga (ou aceitando 'all' em casos excepcionais de relatórios)
// 4 - Dispara paralelamente via Promise.all duas queries ao Prisma: uma pra buscar a página de dados com paginação (skip, take) e relações (include) e outra para contar o total absoluto dos filtros para criar páginas
// 5 - Retorna um objeto JSON padronizado com os dados em 'data' e os metadados de paginação em 'pagination'
export async function listMovementsPaginated(filters = {}) {
  const {
    id,
    date,
    produtoId,
    from,
    to,
    order,
    page = 1,
    limit = 20,
    tipo,
    usuarioId,
    search,
  } = filters;

  let normalizedTipo = undefined;
  if (tipo && tipo !== 'undefined' && tipo !== 'null') {
    const upper = String(tipo).toUpperCase();
    if (upper === 'ENTRADA' || upper === 'REPOSICAO') normalizedTipo = 'REPOSICAO';
    else if (upper === 'SAIDA' || upper === 'VENDA') normalizedTipo = 'VENDA';
  }

  const where = {
    AND: [
      id && !isNaN(Number(id))
        ? {
          id: Number(id),
        }
        : {},
      produtoId && !isNaN(Number(produtoId))
        ? {
          produtoId: Number(produtoId),
        }
        : {},
      date && date !== 'undefined' && date !== 'null'
        ? {
          data: {
            gte: dateFromYMD(date, false),
            lte: dateFromYMD(date, true),
          },
        }
        : from || to
          ? {
            data: {
              ...(from && from !== 'undefined' && from !== 'null'
                ? { gte: dateFromYMD(from, false) }
                : {}),
              ...(to && to !== 'undefined' && to !== 'null'
                ? { lte: dateFromYMD(to, true) }
                : {}),
            },
          }
          : {},
      normalizedTipo
        ? {
          tipo: normalizedTipo,
        }
        : {},
      usuarioId && usuarioId !== 'undefined' && usuarioId !== 'null' && !isNaN(Number(usuarioId))
        ? {
          usuarioId: Number(usuarioId),
        }
        : {},
      search && search !== 'undefined' && search !== 'null'
        ? {
          produto: {
            nome: {
              contains: search,
              mode: "insensitive", // busca sem distinção entre maiúscula e minúscula
            },
          },
        }
        : {},
    ],
  };

  const isAll = limit === 'all';
  const limitSafe = isAll ? undefined : Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = isAll ? undefined : (pageSafe - 1) * limitSafe;

  const orderBy = { data: order === 'asc' ? 'asc' : 'desc' };

  // executa chamadas pesadas ao DB em paralelo (Promise.all) em vez de em série para melhorar performance (TTFB)
  const [movements, total] = await Promise.all([
    prisma.movimento.findMany({
      where,
      include: { produto: true, usuario: { select: { id: true, nome: true, email: true, role: true } } },
      orderBy,
      skip,
      take: limitSafe,
    }),
    prisma.movimento.count({ where })
  ]);

  return {
    data: movements,
    pagination: {
      page: pageSafe,
      limit: isAll ? 'all' : limitSafe,
      total,
      pages: isAll ? 1 : Math.ceil(total / limitSafe)
    }
  };
}

// serviço otimizado para agregar estatísticas de usuário baseado no histórico de movimentações geral
// Executa em uma única consulta SQL no PostgreSQL via queryRaw eliminando o gargalo de N+1 queries
export async function getUserStatsAggregated() {
  const rawResults = await prisma.$queryRaw`
    SELECT
      u.id AS "usuarioId",
      u.nome AS "nome",
      u.email AS "email",
      COUNT(m.id)::int AS "totalMovimentos",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalQuantidade",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade ELSE 0 END), 0)::int AS "totalVendaQuantidade",
      COALESCE(SUM(CASE WHEN m.tipo = 'REPOSICAO' THEN m.quantidade ELSE 0 END), 0)::int AS "totalReposicaoQuantidade"
    FROM "Usuario" u
    JOIN "Movimento" m ON m."usuarioId" = u.id
    GROUP BY u.id, u.nome, u.email
    ORDER BY "totalMovimentos" DESC
  `;

  return rawResults.map((r) => ({
    usuarioId: Number(r.usuarioId),
    nome: r.nome || 'Desconhecido',
    email: r.email,
    totalMovimentos: Number(r.totalMovimentos || 0),
    totalQuantidade: Number(r.totalQuantidade || 0),
    totalVendaQuantidade: Number(r.totalVendaQuantidade || 0),
    totalReposicaoQuantidade: Number(r.totalReposicaoQuantidade || 0),
    totalSaidaQuantidade: Number(r.totalVendaQuantidade || 0),
    totalEntradaQuantidade: Number(r.totalReposicaoQuantidade || 0),
  }));
}