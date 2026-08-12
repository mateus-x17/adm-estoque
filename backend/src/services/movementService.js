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
      tipo && tipo !== 'undefined' && tipo !== 'null' && ['ENTRADA', 'SAIDA'].includes(tipo)
        ? {
            tipo,
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

// serviço extra para agregar estatísticas de usuário baseado no histórico de movimentações geral
export async function getUserStatsAggregated() {
  const stats = await prisma.movimento.groupBy({
    by: ['usuarioId'],
    _count: { _all: true },
    _sum: { quantidade: true }
  });

  const results = await Promise.all(
    stats.map(async (s) => {
      const usuario = await prisma.usuario.findUnique({
        where: { id: s.usuarioId },
        select: { nome: true, email: true }
      });

      const saidaAgg = await prisma.movimento.aggregate({
        where: { usuarioId: s.usuarioId, tipo: 'SAIDA' },
        _sum: { quantidade: true }
      });

      return {
        usuarioId: s.usuarioId,
        nome: usuario?.nome || 'Desconhecido',
        email: usuario?.email,
        totalMovimentos: s._count._all || 0,
        totalQuantidade: s._sum.quantidade || 0,
        totalSaidaQuantidade: saidaAgg._sum.quantidade || 0
      };
    })
  );

  return results;
}