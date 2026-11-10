import { prisma, Prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// arquivo responsável pelas regras de negócio e consultas analíticas de movimentações isoladas por loja e perfil

// função utilitária para construir Date local a partir de string YYYY-MM-DD sem deslocamento de fuso UTC
// 1 - Quebra ano, mês e dia numericamente
// 2 - Retorna início (00:00:00.000) ou fim (23:59:59.999) do dia selecionado
function dateFromYMD(ymd, endOfDay = false) {
  const [year, month, day] = ymd.split('-').map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// serviço focado na listagem paginada e filtragem de movimentações com isolamento por tenant e RBAC
// 1 - Exige empresaId válido da sessão impedindo leitura de movimentações de outras lojas
// 2 - Aplica restrição estrita de visibilidade: usuários com cargo OPERADOR visualizam exclusivamente suas próprias movimentações
// 3 - Constrói cláusulas opcionais de ID, produto, data, intervalo de datas, tipo e pesquisa textual
// 4 - Executa busca paginada e contagem total em paralelo via Promise.all
// 5 - Retorna objeto estruturado com data e metadados de paginação
export async function listMovementsPaginated(filters = {}, empresaId, requestingUser = null) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

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

  // Regra estrita de RBAC: OPERADOR não pode consultar vendas ou movimentações de outros vendedores
  const isOperador = requestingUser?.role === 'OPERADOR';
  const effectiveUsuarioId = isOperador
    ? Number(requestingUser.id)
    : usuarioId && usuarioId !== 'undefined' && usuarioId !== 'null' && !isNaN(Number(usuarioId))
    ? Number(usuarioId)
    : undefined;

  const where = {
    AND: [
      { empresaId: Number(empresaId) },
      id && !isNaN(Number(id)) ? { id: Number(id) } : {},
      produtoId && !isNaN(Number(produtoId)) ? { produtoId: Number(produtoId) } : {},
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
      normalizedTipo ? { tipo: normalizedTipo } : {},
      effectiveUsuarioId ? { usuarioId: effectiveUsuarioId } : {},
      search && search !== 'undefined' && search !== 'null'
        ? {
            produto: {
              nome: {
                contains: search,
                mode: 'insensitive',
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

  const [movements, total] = await Promise.all([
    prisma.movimento.findMany({
      where,
      include: {
        produto: true,
        usuario: { select: { id: true, nome: true, email: true, role: true } },
      },
      orderBy,
      skip,
      take: limitSafe,
    }),
    prisma.movimento.count({ where }),
  ]);

  return {
    data: movements,
    pagination: {
      page: pageSafe,
      limit: isAll ? 'all' : limitSafe,
      total,
      pages: isAll ? 1 : Math.ceil(total / limitSafe),
    },
  };
}

// serviço otimizado para agregar estatísticas de colaboradores do estabelecimento via SQL nativo
// 1 - Obriga empresaId para garantir que gerentes e administradores vejam apenas sua equipe
// 2 - Aplica filtros de data opcionais com parâmetros seguros do Prisma.sql
// 3 - Retorna contagem, quantidade de peças movimentadas e valor total de vendas por colaborador
export async function getUserStatsAggregated({ from, to } = {}, empresaId) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  const tenantId = Number(empresaId);

  const conditions = [Prisma.sql`u."empresaId" = ${tenantId}`];

  if (from && from !== 'undefined') {
    const fromDate =
      typeof from === 'string' && from.includes('-') && from.length === 10
        ? dateFromYMD(from, false)
        : new Date(from);
    if (!isNaN(fromDate.getTime())) {
      conditions.push(Prisma.sql`m.data >= ${fromDate}`);
    }
  }

  if (to && to !== 'undefined') {
    const toDate =
      typeof to === 'string' && to.includes('-') && to.length === 10
        ? dateFromYMD(to, true)
        : new Date(to);
    if (!isNaN(toDate.getTime())) {
      conditions.push(Prisma.sql`m.data <= ${toDate}`);
    }
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  const rawResults = await prisma.$queryRaw`
    SELECT
      u.id AS "usuarioId",
      u.nome AS "name",
      COUNT(m.id)::int AS "count",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalQuantity",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade * p.preco ELSE 0 END), 0)::float AS "totalValue"
    FROM "Usuario" u
    JOIN "Movimento" m ON m."usuarioId" = u.id AND m."empresaId" = u."empresaId"
    JOIN "Produto" p ON m."produtoId" = p.id AND p."empresaId" = u."empresaId"
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
    totalMovimentos: Number(r.count || 0),
    totalMovimentacoes: Number(r.count || 0),
  }));
}

// função para agregar dados históricos de vendas da loja (ou do próprio operador) para relatórios e exportação PDF
// 1 - Valida o período ('1m', '6m' ou '1y') e o empresaId da sessão
// 2 - Aplica regra de privacidade RBAC: se o solicitante for OPERADOR, filtra estritamente suas próprias vendas
// 3 - Consolida montante faturado, volume de peças, ticket médio, top 5 produtos e timeline cronológica
// 4 - Retorna os indicadores acompanhados do escopo ('user' para operador, 'store' para gerente/admin)
export async function getSalesReportData(period = '1m', empresaId, requestingUser = null) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

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

  const isOperador = requestingUser?.role === 'OPERADOR';

  const movements = await prisma.movimento.findMany({
    where: {
      empresaId: Number(empresaId),
      tipo: 'VENDA',
      ...(isOperador ? { usuarioId: Number(requestingUser.id) } : {}),
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
    periodLabel:
      normalizedPeriod === '1m'
        ? 'Último Mês (30 dias)'
        : normalizedPeriod === '6m'
        ? 'Últimos 6 Meses'
        : 'Último 1 Ano',
    scope: isOperador ? 'user' : 'store',
    empresaNome: requestingUser?.empresaNome || null,
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
