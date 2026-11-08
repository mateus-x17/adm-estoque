import { prisma, Prisma } from '../config/prismaClient.js';
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
// Executa em uma única consulta SQL no PostgreSQL via queryRaw eliminando o gargalo de N+1 queries (I3)
// Agrega contagem de movimentações, total de itens movimentados e valor financeiro de vendas com 1 roundtrip
export async function getUserStatsAggregated({ from, to } = {}) {
  const dateConditions = [];

  if (from && from !== 'undefined') {
    const fromDate = typeof from === 'string' && from.includes('-') && from.length === 10
      ? dateFromYMD(from, false)
      : new Date(from);
    if (!isNaN(fromDate.getTime())) {
      dateConditions.push(Prisma.sql`m.data >= ${fromDate}`);
    }
  }

  if (to && to !== 'undefined') {
    const toDate = typeof to === 'string' && to.includes('-') && to.length === 10
      ? dateFromYMD(to, true)
      : new Date(to);
    if (!isNaN(toDate.getTime())) {
      dateConditions.push(Prisma.sql`m.data <= ${toDate}`);
    }
  }

  const whereClause = dateConditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(dateConditions, ' AND ')}`
    : Prisma.empty;

  const rawResults = await prisma.$queryRaw`
    SELECT
      u.id AS "usuarioId",
      u.nome AS "name",
      COUNT(m.id)::int AS "count",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalQuantity",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade * p.preco ELSE 0 END), 0)::float AS "totalValue"
    FROM "Usuario" u
    JOIN "Movimento" m ON m."usuarioId" = u.id
    JOIN "Produto" p ON m."produtoId" = p.id
    ${whereClause}
    GROUP BY u.id, u.nome
    ORDER BY "count" DESC
  `;

  return rawResults.map((r) => ({
    usuarioId: Number(r.usuarioId),
    name: r.name || 'Desconhecido',
    count: Number(r.count || 0),
    totalQuantity: Number(r.totalQuantity || 0),
    totalValue: Number(r.totalValue || 0),
    // Propriedades retrocompatíveis
    totalMovimentos: Number(r.count || 0),
    totalMovimentacoes: Number(r.count || 0),
  }));
}

// função para agregar os dados históricos de vendas para relatórios e exportação
// 1 - Valida o parâmetro de período recebido ('1m', '6m' ou '1y'), atribuindo '1m' como padrão
// 2 - Calcula dinamicamente a data de corte inicial retroativa com base no intervalo de dias
// 3 - Executa consulta ao banco trazendo todas as saídas ('VENDA') no intervalo com os dados dos produtos
// 4 - Consolida o montante financeiro total faturado, volume de peças, ticket médio e produtos líderes
// 5 - Monta a linha do tempo cronológica com pontos de dados estruturados para renderização de gráficos
export async function getSalesReportData(period = '1m') {
  const normalizedPeriod = ['1m', '6m', '1y'].includes(period) ? period : '1m';
  const now = new Date();
  const startDate = new Date();

  if (normalizedPeriod === '1m') {
    startDate.setDate(now.getDate() - 30);
  } else if (normalizedPeriod === '6m') {
    startDate.setDate(now.getDate() - 180);
  } else if (normalizedPeriod === '1y') {
    startDate.setDate(now.getDate() - 365);
  }

  const movements = await prisma.movimento.findMany({
    where: {
      tipo: 'VENDA',
      data: {
        gte: startDate,
        lte: now,
      },
    },
    include: {
      produto: {
        select: {
          id: true,
          nome: true,
          preco: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    orderBy: {
      data: 'asc',
    },
  });

  let totalValor = 0;
  let totalQuantidade = 0;
  const productAggregation = {};
  const timelineBuckets = {};

  for (const mov of movements) {
    const preco = Number(mov.produto?.preco || 0);
    const qtd = Number(mov.quantidade || 0);
    const valorMovimento = qtd * preco;

    totalValor += valorMovimento;
    totalQuantidade += qtd;

    const prodId = mov.produtoId;
    const prodNome = mov.produto?.nome || `Produto #${prodId}`;
    if (!productAggregation[prodId]) {
      productAggregation[prodId] = {
        id: prodId,
        nome: prodNome,
        quantidadeVendida: 0,
        valorTotal: 0,
      };
    }
    productAggregation[prodId].quantidadeVendida += qtd;
    productAggregation[prodId].valorTotal += valorMovimento;

    const dateObj = new Date(mov.data);
    let bucketKey = '';
    let bucketLabel = '';

    if (normalizedPeriod === '1m') {
      const dia = String(dateObj.getDate()).padStart(2, '0');
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      bucketKey = `${dateObj.getFullYear()}-${mes}-${dia}`;
      bucketLabel = `${dia}/${mes}`;
    } else {
      const mesAno = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      bucketKey = `${dateObj.getFullYear()}-${mes}`;
      bucketLabel = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
    }

    if (!timelineBuckets[bucketKey]) {
      timelineBuckets[bucketKey] = {
        label: bucketLabel,
        key: bucketKey,
        valor: 0,
        quantidade: 0,
      };
    }
    timelineBuckets[bucketKey].valor += valorMovimento;
    timelineBuckets[bucketKey].quantidade += qtd;
  }

  const topProdutos = Object.values(productAggregation)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      valorTotal: Number(p.valorTotal.toFixed(2)),
      percentual: totalValor > 0 ? Number(((p.valorTotal / totalValor) * 100).toFixed(1)) : 0,
    }));

  const timeline = Object.keys(timelineBuckets)
    .sort()
    .map((k) => ({
      label: timelineBuckets[k].label,
      date: timelineBuckets[k].key,
      valor: Number(timelineBuckets[k].valor.toFixed(2)),
      quantidade: timelineBuckets[k].quantidade,
    }));

  return {
    period: normalizedPeriod,
    periodLabel: normalizedPeriod === '1m' ? 'Último Mês (30 dias)' : normalizedPeriod === '6m' ? 'Últimos 6 Meses' : 'Último 1 Ano',
    generatedAt: now.toISOString(),
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    summary: {
      totalVendasValor: Number(totalValor.toFixed(2)),
      totalVendasQuantidade: totalQuantidade,
      totalTransacoes: movements.length,
      ticketMedio: movements.length > 0 ? Number((totalValor / movements.length).toFixed(2)) : 0,
      precoMedioItem: totalQuantidade > 0 ? Number((totalValor / totalQuantidade).toFixed(2)) : 0,
    },
    topProdutos,
    timeline,
  };
}