import { prisma, Prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import {
  formatMatricula,
  formatMatriculaDisplay,
  parseMatriculaSearch,
  buildWorkedMonthsTimeline,
} from "../utils/matriculaHelper.js";

// arquivo responsável pelas consultas de auditoria de estoque, relatórios executivos e desempenho individual de vendedores

// função auxiliar para construir Date local sem deslocamento de fuso UTC
// 1 - Interpreta YYYY-MM-DD posicionando no início ou último milissegundo do dia
function dateFromYMD(ymd, endOfDay = false) {
  const [year, month, day] = String(ymd).split("-").map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// função auxiliar para calcular intervalo inicial/final baseado em período ('1m', '6m', '1y') ou datas customizadas
// 1 - Quando recebe from/to explícitos, utiliza os limites customizados; caso contrário, subtrai 30, 180 ou 365 dias de hoje
function resolveDateRange(period = "1m", from = null, to = null) {
  const now = new Date();
  if (from || to) {
    const startDate =
      from && from !== "undefined" ? dateFromYMD(from, false) : new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const endDate = to && to !== "undefined" ? dateFromYMD(to, true) : now;
    return { period: "custom", startDate, endDate };
  }

  const normalizedPeriod = ["1m", "6m", "1y"].includes(period) ? period : "1m";
  const startDate = new Date(now);
  if (normalizedPeriod === "1m") startDate.setDate(now.getDate() - 30);
  else if (normalizedPeriod === "6m") startDate.setDate(now.getDate() - 180);
  else if (normalizedPeriod === "1y") startDate.setDate(now.getDate() - 365);

  return { period: normalizedPeriod, startDate, endDate: now };
}

// função para listar movimentações unitárias do livro-razão (com busca por ID antigo de ex-funcionário e sigilo OPERADOR)
// 1 - Trava filtro de vendedor em req.user.id quando o solicitante possui papel OPERADOR
// 2 - Aplica filtros de Organização/Loja, período, pedido vinculado, tipo, produto e pesquisa textual/numérica por vendedorRefId
// 3 - Executa busca paginada e contagem paralela incluindo snapshots preservados de ex-vendedores
export async function listMovementsPaginated(filters = {}, scope, requestingUser = null) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const {
    id,
    date,
    produtoId,
    pedidoId,
    from,
    to,
    order,
    page = 1,
    limit = 20,
    tipo,
    usuarioId,
    vendedorRefId,
    estorno,
    search,
  } = filters;

  let normalizedTipo;
  if (tipo && tipo !== "undefined" && tipo !== "null") {
    const upper = String(tipo).toUpperCase();
    if (upper === "ENTRADA" || upper === "REPOSICAO") normalizedTipo = "REPOSICAO";
    else if (upper === "SAIDA" || upper === "VENDA") normalizedTipo = "VENDA";
  }

  const isOperador = requestingUser?.role === "OPERADOR";
  const requestedSeller = vendedorRefId ?? usuarioId;
  const effectiveSellerRefId = isOperador
    ? Number(requestingUser.id)
    : requestedSeller &&
      !["undefined", "null", "todos", ""].includes(String(requestedSeller))
      ? parseMatriculaSearch(requestedSeller).numericId ?? undefined
      : undefined;

  const trimmedSearch = String(search || "").trim();
  const parsedSearch = parseMatriculaSearch(trimmedSearch);

  const where = {
    AND: [
      { organizacaoId: Number(scope.organizacaoId) },
      scope.lojaId ? { lojaId: Number(scope.lojaId) } : {},
      id && !isNaN(Number(id)) ? { id: Number(id) } : {},
      produtoId && !isNaN(Number(produtoId)) ? { produtoId: Number(produtoId) } : {},
      pedidoId && !isNaN(Number(pedidoId)) ? { pedidoId: Number(pedidoId) } : {},
      estorno === "true" ? { estorno: true } : estorno === "false" ? { estorno: false } : {},
      date && date !== "undefined" && date !== "null"
        ? { data: { gte: dateFromYMD(date, false), lte: dateFromYMD(date, true) } }
        : from || to
          ? {
            data: {
              ...(from && from !== "undefined" && from !== "null" ? { gte: dateFromYMD(from, false) } : {}),
              ...(to && to !== "undefined" && to !== "null" ? { lte: dateFromYMD(to, true) } : {}),
            },
          }
          : {},
      normalizedTipo ? { tipo: normalizedTipo } : {},
      effectiveSellerRefId ? { vendedorRefId: effectiveSellerRefId } : {},
      trimmedSearch
        ? {
          OR: [
            { produto: { nome: { contains: trimmedSearch, mode: "insensitive" } } },
            { vendedorNomeSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            { vendedorEmailSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            { vendedorMatriculaSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
            { usuario: { matricula: { contains: trimmedSearch, mode: "insensitive" } } },
            { pedido: { codigo: { contains: trimmedSearch, mode: "insensitive" } } },
            ...(parsedSearch.numericId ? [{ id: parsedSearch.numericId }, { vendedorRefId: parsedSearch.numericId }] : []),
          ],
        }
        : {},
    ],
  };

  const isAll = limit === "all";
  const limitSafe = isAll ? undefined : Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = isAll ? undefined : (pageSafe - 1) * limitSafe;

  const [movements, total] = await Promise.all([
    prisma.movimento.findMany({
      where,
      include: {
        produto: true,
        loja: { select: { id: true, nome: true, slug: true } },
        pedido: { select: { id: true, codigo: true, status: true } },
        usuario: { select: { id: true, nome: true, email: true, matricula: true, situacao: true, role: true } },
      },
      orderBy: { data: order === "asc" ? "asc" : "desc" },
      skip,
      take: limitSafe,
    }),
    prisma.movimento.count({ where }),
  ]);

  return {
    data: movements,
    pagination: {
      page: pageSafe,
      limit: isAll ? "all" : limitSafe,
      total,
      pages: isAll ? 1 : Math.max(1, Math.ceil(total / limitSafe)),
    },
  };
}

// função SQL nativa para agregar movimentações e faturamento válido por vendedor (incluindo ex-colaboradores excluídos)
// 1 - Ignora estornos (estorno = true) e movimentações pertencentes a pedidos cancelados
// 2 - Agrupa pelo vendedorRefId permanente mantendo identificação de contas excluídas
export async function getUserStatsAggregated({ from, to } = {}, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const conditions = [
    Prisma.sql`m."organizacaoId" = ${Number(scope.organizacaoId)}`,
    Prisma.sql`m."estorno" = false`,
    Prisma.sql`(m."pedidoId" IS NULL OR ped."status" = 'CONCLUIDO')`,
  ];

  if (scope.lojaId) {
    conditions.push(Prisma.sql`m."lojaId" = ${Number(scope.lojaId)}`);
  }

  if (from && from !== "undefined") {
    const fromDate =
      typeof from === "string" && from.includes("-") && from.length === 10
        ? dateFromYMD(from, false)
        : new Date(from);
    if (!isNaN(fromDate.getTime())) conditions.push(Prisma.sql`m.data >= ${fromDate}`);
  }

  if (to && to !== "undefined") {
    const toDate =
      typeof to === "string" && to.includes("-") && to.length === 10
        ? dateFromYMD(to, true)
        : new Date(to);
    if (!isNaN(toDate.getTime())) conditions.push(Prisma.sql`m.data <= ${toDate}`);
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

  const rawResults = await prisma.$queryRaw`
    SELECT
      m."vendedorRefId"::int AS "vendedorRefId",
      COALESCE(MAX(u.nome), MAX(m."vendedorNomeSnapshot"), 'Colaborador') AS "name",
      COALESCE(MAX(u.email), MAX(m."vendedorEmailSnapshot")) AS "email",
      BOOL_AND(u.id IS NULL) AS "excluido",
      COUNT(m.id)::int AS "count",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalQuantity",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m."valorTotal" ELSE 0 END), 0)::float AS "totalValue"
    FROM "Movimento" m
    LEFT JOIN "Pedido" ped ON ped.id = m."pedidoId"
    LEFT JOIN "Usuario" u ON u.id = m."vendedorRefId"
    ${whereClause}
    GROUP BY m."vendedorRefId"
    ORDER BY "totalValue" DESC, "count" DESC
  `;

  return rawResults.map((r) => {
    const isDeleted = Boolean(r.excluido);
    const refId = Number(r.vendedorRefId);
    const baseName = r.name || "Desconhecido";
    return {
      usuarioId: refId,
      vendedorRefId: refId,
      name: isDeleted ? `${baseName} (#${refId} Ex-colab.)` : baseName,
      nomeLimpo: baseName,
      email: r.email || null,
      excluido: isDeleted,
      count: Number(r.count || 0),
      totalQuantity: Number(r.totalQuantity || 0),
      totalValue: Number(r.totalValue || 0),
      totalMovimentos: Number(r.count || 0),
      totalMovimentacoes: Number(r.count || 0),
    };
  });
}

// função dedicada para ranquear vendedores do melhor ao pior (ativos e contas excluídas via vendedorRefId)
// 1 - Soma vendas líquidas válidas no período (1m, 6m, 1y ou intervalo customizado) dentro da Rede ou Loja
// 2 - Combina resultados com vendedores/gerentes ativos sem vendas no período para ranking completo
// 3 - Permite busca por antigo ID numérico, nome ou e-mail e ordena do maior para o menor faturamento
export async function getSellerPerformanceRanking(
  { period = "1m", from, to, search = "", includeDeleted = true } = {},
  scope
) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const { startDate, endDate, period: resolvedPeriod } = resolveDateRange(period, from, to);
  const orgId = Number(scope.organizacaoId);
  const lojaFilterSql = scope.lojaId
    ? Prisma.sql`AND m."lojaId" = ${Number(scope.lojaId)}`
    : Prisma.empty;

  const rawSales = await prisma.$queryRaw`
    SELECT
      m."vendedorRefId"::int AS "vendedorRefId",
      COALESCE(MAX(u.nome), MAX(m."vendedorNomeSnapshot")) AS "nome",
      COALESCE(MAX(u.email), MAX(m."vendedorEmailSnapshot")) AS "email",
      COALESCE(MAX(u.matricula), MAX(m."vendedorMatriculaSnapshot")) AS "matricula",
      BOOL_AND(u.id IS NULL) AS "excluido",
      MAX(u.situacao::text) AS "situacao",
      MAX(u.role::text) AS "cargoAtual",
      COALESCE(MAX(u."dataAdmissao"), MAX(m."vendedorDataAdmissaoSnapshot"), MIN(m.data)) AS "dataInicio",
      MAX(m."vendedorDataDesligamentoSnapshot") AS "dataTermino",
      COALESCE(MAX(ul.nome), STRING_AGG(DISTINCT ml.nome, ', ')) AS "lojaNome",
      COUNT(DISTINCT COALESCE(m."pedidoId", -m.id))::int AS "totalPedidos",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalPecas",
      COALESCE(SUM(m."valorTotal"), 0)::float AS "totalFaturado"
    FROM "Movimento" m
    JOIN "Loja" ml ON ml.id = m."lojaId"
    LEFT JOIN "Pedido" ped ON ped.id = m."pedidoId"
    LEFT JOIN "Usuario" u ON u.id = m."vendedorRefId"
    LEFT JOIN "Loja" ul ON ul.id = u."lojaId"
    WHERE m."organizacaoId" = ${orgId}
      ${lojaFilterSql}
      AND m.tipo = 'VENDA'
      AND m."estorno" = false
      AND (m."pedidoId" IS NULL OR ped."status" = 'CONCLUIDO')
      AND m.data >= ${startDate}
      AND m.data <= ${endDate}
    GROUP BY m."vendedorRefId"
  `;

  // Busca também colaboradores ativos sem vendas no período para compor o ranking completo (melhor ao pior)
  const activeStaff = await prisma.usuario.findMany({
    where: {
      organizacaoId: orgId,
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      matricula: true,
      situacao: true,
      dataAdmissao: true,
      role: true,
      imagem: true,
      lojaId: true,
      loja: { select: { id: true, nome: true } },
    },
  });

  const activeById = new Map(activeStaff.map((u) => [u.id, u]));
  const mergedMap = new Map();

  for (const row of rawSales) {
    const refId = Number(row.vendedorRefId);
    const activeUser = activeById.get(refId);
    const excluido = Boolean(row.excluido) && !activeUser;
    const rawMatricula = activeUser?.matricula || row.matricula || formatMatricula(refId);
    mergedMap.set(refId, {
      vendedorRefId: refId,
      nome: activeUser?.nome || row.nome || "Desconhecido",
      email: activeUser?.email || row.email || "",
      matricula: rawMatricula,
      matriculaCancelada: excluido,
      matriculaDisplay: formatMatriculaDisplay(refId, rawMatricula, excluido),
      situacao: excluido ? "DESLIGADO" : activeUser?.situacao || row.situacao || "ATIVO",
      dataInicio: activeUser?.dataAdmissao
        ? new Date(activeUser.dataAdmissao).toISOString()
        : row.dataInicio
          ? new Date(row.dataInicio).toISOString()
          : null,
      dataTermino: excluido && row.dataTermino ? new Date(row.dataTermino).toISOString() : null,
      imagem: activeUser?.imagem || null,
      excluido,
      cargoAtual: activeUser?.role || null,
      lojaNome: activeUser?.loja?.nome || row.lojaNome || "Todas / Rede",
      totalPedidos: Number(row.totalPedidos || 0),
      totalPecas: Number(row.totalPecas || 0),
      totalFaturado: Number(Number(row.totalFaturado || 0).toFixed(2)),
    });
  }

  for (const staff of activeStaff) {
    if (!mergedMap.has(staff.id)) {
      const rawMatricula = staff.matricula || formatMatricula(staff.id);
      mergedMap.set(staff.id, {
        vendedorRefId: staff.id,
        nome: staff.nome,
        email: staff.email,
        matricula: rawMatricula,
        matriculaCancelada: false,
        matriculaDisplay: formatMatriculaDisplay(staff.id, rawMatricula, false),
        situacao: staff.situacao || "ATIVO",
        dataInicio: staff.dataAdmissao ? new Date(staff.dataAdmissao).toISOString() : null,
        dataTermino: null,
        imagem: staff.imagem || null,
        excluido: false,
        cargoAtual: staff.role,
        lojaNome: staff.loja?.nome || "Todas as Lojas (Rede)",
        totalPedidos: 0,
        totalPecas: 0,
        totalFaturado: 0,
      });
    }
  }

  let list = Array.from(mergedMap.values());

  // 1 - Ordena o conjunto completo ANTES de filtrar, preservando a posição real (#1, #2, #3...) mesmo ao pesquisar um único ID/nome/matrícula
  list.sort(
    (a, b) =>
      b.totalFaturado - a.totalFaturado ||
      b.totalPecas - a.totalPecas ||
      b.totalPedidos - a.totalPedidos ||
      a.nome.localeCompare(b.nome)
  );

  const faturamentoGlobal = list.reduce((acc, s) => acc + s.totalFaturado, 0);

  let fullRanking = list.map((s, idx) => ({
    posicao: idx + 1,
    ...s,
    ticketMedio: s.totalPedidos > 0 ? Number((s.totalFaturado / s.totalPedidos).toFixed(2)) : 0,
    percentualParticipacao:
      faturamentoGlobal > 0 ? Number(((s.totalFaturado / faturamentoGlobal) * 100).toFixed(1)) : 0,
  }));

  // 2 - Aplica filtro opcional de inclusão de ex-funcionários mantendo as posições reais originais
  const showDeleted = includeDeleted !== false && includeDeleted !== "false";
  const parsedSearch = parseMatriculaSearch(search);

  if (!showDeleted) {
    fullRanking = fullRanking.filter((s) => !s.excluido);
  } else if (parsedSearch.raw !== "") {
    // Caso ex-colaborador não tenha vendido nesta janela (ex: 1m), traz do histórico sem sobrescrever quem já ranqueou
    const trimmed = parsedSearch.raw;
    const missingDeleted = await prisma.$queryRaw`
      SELECT
        m."vendedorRefId"::int AS "vendedorRefId",
        MAX(m."vendedorNomeSnapshot") AS "nome",
        MAX(m."vendedorEmailSnapshot") AS "email",
        MAX(m."vendedorMatriculaSnapshot") AS "matricula",
        COALESCE(MAX(m."vendedorDataAdmissaoSnapshot"), MIN(m.data)) AS "dataInicio",
        MAX(m."vendedorDataDesligamentoSnapshot") AS "dataTermino",
        STRING_AGG(DISTINCT ml.nome, ', ') AS "lojaNome"
      FROM "Movimento" m
      JOIN "Loja" ml ON ml.id = m."lojaId"
      LEFT JOIN "Usuario" u ON u.id = m."vendedorRefId"
      WHERE m."organizacaoId" = ${orgId}
        ${lojaFilterSql}
        AND u.id IS NULL
        AND (
          m."vendedorNomeSnapshot" ILIKE ${"%" + trimmed + "%"}
          OR m."vendedorEmailSnapshot" ILIKE ${"%" + trimmed + "%"}
          OR m."vendedorMatriculaSnapshot" ILIKE ${"%" + trimmed + "%"}
          ${parsedSearch.numericId ? Prisma.sql`OR m."vendedorRefId" = ${parsedSearch.numericId}` : Prisma.empty}
        )
      GROUP BY m."vendedorRefId"
    `;
    let tailIdx = fullRanking.length;
    for (const del of missingDeleted) {
      const refId = Number(del.vendedorRefId);
      if (!mergedMap.has(refId)) {
        tailIdx += 1;
        const rawMatricula = del.matricula || formatMatricula(refId);
        fullRanking.push({
          posicao: tailIdx,
          vendedorRefId: refId,
          nome: del.nome,
          email: del.email,
          matricula: rawMatricula,
          matriculaCancelada: true,
          matriculaDisplay: formatMatriculaDisplay(refId, rawMatricula, true),
          situacao: "DESLIGADO",
          dataInicio: del.dataInicio ? new Date(del.dataInicio).toISOString() : null,
          dataTermino: del.dataTermino ? new Date(del.dataTermino).toISOString() : null,
          imagem: null,
          excluido: true,
          cargoAtual: null,
          lojaNome: del.lojaNome || "Histórico",
          totalPedidos: 0,
          totalPecas: 0,
          totalFaturado: 0,
          ticketMedio: 0,
          percentualParticipacao: 0,
        });
      }
    }
  }

  // 3 - Filtra pela busca (Matrícula, ID, Nome ou Email) mantendo exatamente a posicao real no ranking
  const trimmedSearch = parsedSearch.raw.toLowerCase();
  const ranking = trimmedSearch
    ? fullRanking.filter(
        (item) =>
          (parsedSearch.numericId && Number(item.vendedorRefId) === parsedSearch.numericId) ||
          (item.matricula && item.matricula.toLowerCase().includes(trimmedSearch)) ||
          item.nome.toLowerCase().includes(trimmedSearch) ||
          item.email.toLowerCase().includes(trimmedSearch)
      )
    : fullRanking;

  return {
    period: resolvedPeriod,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    scopeLabel: scope.lojaNome || "Todas as Lojas",
    totalFaturadoPeriodo: Number(faturamentoGlobal.toFixed(2)),
    ranking,
  };
}

// função para raio-X completo de um vendedor específico (ativo, suspenso ou desligado por matrícula/ID antigo)
// 1 - Interpreta Matrícula (ex: MAT-00063) ou ID numérico e consulta conta viva ou snapshots históricos (Pedido/Movimento)
// 2 - Calcula faturamento, pedidos e peças em 1m, 6m, 1y, total e todos os meses trabalhados entre dataInicio e dataTermino
// 3 - Gera evolução mensal, top produtos e pedidos recentes mantendo identificação enxuta (Nome, E-mail e Matrícula)
export async function getSellerPerformanceDetail(refId, scope) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const parsedRef = parseMatriculaSearch(refId);
  const sellerRefId = parsedRef.numericId;
  if (!sellerRefId || isNaN(sellerRefId) || sellerRefId <= 0) {
    throw new AppError("Matrícula ou ID do colaborador inválido", 400);
  }

  const orgId = Number(scope.organizacaoId);
  const lojaId = scope.lojaId ? Number(scope.lojaId) : null;

  const [aliveUser, validSalesMovements, sellerOrders] = await Promise.all([
    prisma.usuario.findFirst({
      where: { id: sellerRefId, organizacaoId: orgId },
      select: {
        id: true,
        nome: true,
        email: true,
        matricula: true,
        situacao: true,
        dataAdmissao: true,
        role: true,
        imagem: true,
        lojaId: true,
        loja: { select: { id: true, nome: true, slug: true } },
      },
    }),
    prisma.movimento.findMany({
      where: {
        organizacaoId: orgId,
        ...(lojaId ? { lojaId } : {}),
        vendedorRefId: sellerRefId,
        tipo: "VENDA",
        estorno: false,
        OR: [{ pedidoId: null }, { pedido: { status: "CONCLUIDO" } }],
      },
      include: {
        produto: { select: { id: true, nome: true } },
        loja: { select: { id: true, nome: true } },
      },
      orderBy: { data: "desc" },
    }),
    prisma.pedido.findMany({
      where: {
        organizacaoId: orgId,
        ...(lojaId ? { lojaId } : {}),
        vendedorRefId: sellerRefId,
        tipo: "VENDA",
      },
      include: {
        loja: { select: { id: true, nome: true } },
        itens: { select: { id: true, produtoNomeSnapshot: true, quantidade: true, subtotal: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  if (
    aliveUser &&
    lojaId &&
    aliveUser.lojaId !== lojaId &&
    validSalesMovements.length === 0 &&
    sellerOrders.length === 0
  ) {
    throw new AppError("Colaborador não encontrado ou sem histórico nesta loja", 404);
  }

  if (!aliveUser && validSalesMovements.length === 0 && sellerOrders.length === 0) {
    throw new AppError(
      `Nenhum registro encontrado para a matrícula ${formatMatricula(sellerRefId)} (#${sellerRefId})`,
      404
    );
  }

  const lastSnapshotMov = validSalesMovements[0] || null;
  const oldestSnapshotMov = validSalesMovements[validSalesMovements.length - 1] || null;
  const lastSnapshotOrder = sellerOrders[0] || null;
  const now = new Date();

  const rawMatricula =
    aliveUser?.matricula ||
    lastSnapshotMov?.vendedorMatriculaSnapshot ||
    lastSnapshotOrder?.vendedorMatriculaSnapshot ||
    formatMatricula(sellerRefId);

  const isExcluido = !aliveUser;
  const dataInicioRaw =
    aliveUser?.dataAdmissao ||
    lastSnapshotMov?.vendedorDataAdmissaoSnapshot ||
    lastSnapshotOrder?.vendedorDataAdmissaoSnapshot ||
    oldestSnapshotMov?.data ||
    now;

  const dataTerminoRaw = isExcluido
    ? lastSnapshotMov?.vendedorDataDesligamentoSnapshot ||
      lastSnapshotOrder?.vendedorDataDesligamentoSnapshot ||
      lastSnapshotMov?.data ||
      lastSnapshotOrder?.createdAt ||
      now
    : null;

  const effectiveStart = new Date(dataInicioRaw);
  const effectiveEnd = dataTerminoRaw ? new Date(dataTerminoRaw) : now;
  const safeStart = effectiveStart <= effectiveEnd ? effectiveStart : effectiveEnd;

  const vendedorInfo = {
    vendedorRefId: sellerRefId,
    nome:
      aliveUser?.nome ||
      lastSnapshotMov?.vendedorNomeSnapshot ||
      lastSnapshotOrder?.vendedorNomeSnapshot ||
      `Colaborador #${sellerRefId}`,
    email:
      aliveUser?.email ||
      lastSnapshotMov?.vendedorEmailSnapshot ||
      lastSnapshotOrder?.vendedorEmailSnapshot ||
      "",
    matricula: rawMatricula,
    matriculaCancelada: isExcluido,
    matriculaDisplay: formatMatriculaDisplay(sellerRefId, rawMatricula, isExcluido),
    situacao: isExcluido ? "DESLIGADO" : aliveUser?.situacao || "ATIVO",
    dataInicio: safeStart.toISOString(),
    dataTermino: dataTerminoRaw ? effectiveEnd.toISOString() : null,
    excluido: isExcluido,
    cargoAtual: aliveUser?.role || null,
    imagem: aliveUser?.imagem || null,
    lojaAtualNome:
      aliveUser?.loja?.nome ||
      lastSnapshotMov?.loja?.nome ||
      lastSnapshotOrder?.loja?.nome ||
      "Rede",
  };
  const limit1m = new Date(now);
  limit1m.setDate(now.getDate() - 30);
  const limit6m = new Date(now);
  limit6m.setDate(now.getDate() - 180);
  const limit1y = new Date(now);
  limit1y.setDate(now.getDate() - 365);

  const createEmptySummary = () => ({
    faturamento: 0,
    pecas: 0,
    orderIds: new Set(),
    pedidosCancelados: 0,
  });

  const buckets = {
    mes: createEmptySummary(),
    semestre: createEmptySummary(),
    ano: createEmptySummary(),
    total: createEmptySummary(),
  };

  const productTotals1y = new Map();
  const monthlyMap = new Map();
  const workedTimeline = buildWorkedMonthsTimeline(safeStart, effectiveEnd);
  const workedMonthMap = new Map(workedTimeline.map((m) => [m.key, m]));

  // Inicializa os últimos 12 meses para gráfico contínuo mesmo nos meses sem vendas
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyMap.set(key, {
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      faturamento: 0,
      pecas: 0,
    });
  }

  for (const mov of validSalesMovements) {
    const val = Number(mov.valorTotal || 0);
    const qty = Number(mov.quantidade || 0);
    const refOrderKey = mov.pedidoId ? `P_${mov.pedidoId}` : `M_${mov.id}`;
    const d = new Date(mov.data);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    buckets.total.faturamento += val;
    buckets.total.pecas += qty;
    buckets.total.orderIds.add(refOrderKey);

    if (d >= safeStart && d <= effectiveEnd && workedMonthMap.has(mKey)) {
      const wb = workedMonthMap.get(mKey);
      wb.faturamento += val;
      wb.pecas += qty;
      wb._orderIds.add(refOrderKey);
    }

    if (d >= limit1y) {
      buckets.ano.faturamento += val;
      buckets.ano.pecas += qty;
      buckets.ano.orderIds.add(refOrderKey);

      const prodName = mov.produto?.nome || `Produto #${mov.produtoId}`;
      const currentProd = productTotals1y.get(mov.produtoId) || {
        produtoId: mov.produtoId,
        nome: prodName,
        quantidade: 0,
        faturamento: 0,
      };
      currentProd.quantidade += qty;
      currentProd.faturamento += val;
      productTotals1y.set(mov.produtoId, currentProd);

      if (monthlyMap.has(mKey)) {
        const mb = monthlyMap.get(mKey);
        mb.faturamento += val;
        mb.pecas += qty;
      }
    }

    if (d >= limit6m) {
      buckets.semestre.faturamento += val;
      buckets.semestre.pecas += qty;
      buckets.semestre.orderIds.add(refOrderKey);
    }

    if (d >= limit1m) {
      buckets.mes.faturamento += val;
      buckets.mes.pecas += qty;
      buckets.mes.orderIds.add(refOrderKey);
    }
  }

  for (const ped of sellerOrders) {
    if (ped.status !== "CANCELADO") continue;
    const d = new Date(ped.createdAt);
    buckets.total.pedidosCancelados += 1;
    if (d >= limit1y) buckets.ano.pedidosCancelados += 1;
    if (d >= limit6m) buckets.semestre.pedidosCancelados += 1;
    if (d >= limit1m) buckets.mes.pedidosCancelados += 1;
  }

  const finalizeBucket = (b) => {
    const pedidosConcluidos = b.orderIds.size;
    const fat = Number(b.faturamento.toFixed(2));
    return {
      faturamento: fat,
      pecas: b.pecas,
      pedidosConcluidos,
      pedidosCancelados: b.pedidosCancelados,
      ticketMedio: pedidosConcluidos > 0 ? Number((fat / pedidosConcluidos).toFixed(2)) : 0,
    };
  };

  const topProdutos = Array.from(productTotals1y.values())
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 6)
    .map((p) => ({ ...p, faturamento: Number(p.faturamento.toFixed(2)) }));

  const evolucaoMensal = Array.from(monthlyMap.values()).map((m) => ({
    ...m,
    faturamento: Number(m.faturamento.toFixed(2)),
  }));

  const mesesTrabalhados = workedTimeline.map((m) => ({
    mes: m.key,
    label: m.label,
    pedidosConcluidos: m._orderIds.size,
    pecas: m.pecas,
    faturamento: Number(m.faturamento.toFixed(2)),
  }));

  return {
    vendedor: vendedorInfo,
    periodos: {
      mes: finalizeBucket(buckets.mes),
      semestre: finalizeBucket(buckets.semestre),
      ano: finalizeBucket(buckets.ano),
      total: finalizeBucket(buckets.total),
    },
    evolucaoMensal,
    mesesTrabalhados,
    topProdutos,
    pedidosRecentes: sellerOrders,
  };
}

// função consolidada para relatórios executivos de vendas e PDF A4 ('1m', '6m', '1y')
// 1 - ADMIN vê rede inteira ('network') ou filial selecionada ('store'); GERENTE vê apenas sua loja ('store'); OPERADOR vê suas vendas ('user')
// 2 - Calcula faturamento congelado (mov.valorTotal) ignorando estornos e pedidos cancelados
// 3 - Inclui ranking de vendedores (melhor ao pior) e resumo de vendas por fornecedor para ADMIN e GERENTE
export async function getSalesReportData(period = "1m", scope, requestingUser = null) {
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const { period: normalizedPeriod, startDate, endDate } = resolveDateRange(period);
  const isOperador = requestingUser?.role === "OPERADOR";

  const movements = await prisma.movimento.findMany({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      tipo: "VENDA",
      estorno: false,
      OR: [{ pedidoId: null }, { pedido: { status: "CONCLUIDO" } }],
      ...(isOperador ? { vendedorRefId: Number(requestingUser.id) } : {}),
      data: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      produto: {
        select: {
          id: true,
          nome: true,
          preco: true,
          fornecedor: { select: { id: true, nome: true } },
        },
      },
      loja: { select: { id: true, nome: true } },
    },
    orderBy: { data: "asc" },
  });

  let totalValor = 0;
  let totalQuantidade = 0;
  const uniqueOrders = new Set();
  const productAggregation = {};
  const supplierAggregation = {};
  const timelineBuckets = {};

  for (const mov of movements) {
    const qtd = Number(mov.quantidade || 0);
    const valorMovimento = Number(
      mov.valorTotal !== undefined ? mov.valorTotal : qtd * Number(mov.produto?.preco || 0)
    );

    totalValor += valorMovimento;
    totalQuantidade += qtd;
    uniqueOrders.add(mov.pedidoId ? `P_${mov.pedidoId}` : `M_${mov.id}`);

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

    const supId = mov.produto?.fornecedor?.id || 0;
    const supNome = mov.produto?.fornecedor?.nome || "Sem fornecedor";
    if (!supplierAggregation[supId]) {
      supplierAggregation[supId] = {
        id: supId,
        nome: supNome,
        quantidadeVendida: 0,
        valorTotal: 0,
      };
    }
    supplierAggregation[supId].quantidadeVendida += qtd;
    supplierAggregation[supId].valorTotal += valorMovimento;

    const dateObj = new Date(mov.data);
    let bucketKey = "";
    let bucketLabel = "";

    if (normalizedPeriod === "1m") {
      const dia = String(dateObj.getDate()).padStart(2, "0");
      const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
      bucketKey = `${dateObj.getFullYear()}-${mes}-${dia}`;
      bucketLabel = `${dia}/${mes}`;
    } else {
      const mesAno = dateObj.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
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
    .slice(0, 8)
    .map((p) => ({
      ...p,
      valorTotal: Number(p.valorTotal.toFixed(2)),
      percentual: totalValor > 0 ? Number(((p.valorTotal / totalValor) * 100).toFixed(1)) : 0,
    }));

  const resumoFornecedores = isOperador
    ? []
    : Object.values(supplierAggregation)
      .filter((s) => s.id > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 6)
      .map((s) => ({
        ...s,
        valorTotal: Number(s.valorTotal.toFixed(2)),
      }));

  let rankingVendedores = [];
  if (!isOperador) {
    const perfResult = await getSellerPerformanceRanking(
      { period: normalizedPeriod, includeDeleted: true },
      scope
    );
    rankingVendedores = perfResult.ranking;
  }

  const timeline = Object.keys(timelineBuckets)
    .sort()
    .map((k) => ({
      label: timelineBuckets[k].label,
      date: timelineBuckets[k].key,
      valor: Number(timelineBuckets[k].valor.toFixed(2)),
      quantidade: timelineBuckets[k].quantidade,
    }));

  const totalPedidos = uniqueOrders.size;
  const scopeType = isOperador ? "user" : scope.isNetworkWide ? "network" : "store";

  return {
    period: normalizedPeriod,
    periodLabel:
      normalizedPeriod === "1m"
        ? "Último Mês (30 dias)"
        : normalizedPeriod === "6m"
          ? "Últimos 6 Meses"
          : "Último 1 Ano",
    scope: scopeType,
    organizacaoNome: requestingUser?.organizacaoNome || null,
    lojaNome: scope.lojaNome || "Todas as Lojas",
    empresaNome: scope.isNetworkWide
      ? `${requestingUser?.organizacaoNome || "Rede"} — Todas as Lojas`
      : scope.lojaNome || requestingUser?.organizacaoNome,
    generatedAt: endDate.toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalVendasValor: Number(totalValor.toFixed(2)),
      totalVendasQuantidade: totalQuantidade,
      totalTransacoes: totalPedidos,
      ticketMedio: totalPedidos > 0 ? Number((totalValor / totalPedidos).toFixed(2)) : 0,
      precoMedioItem:
        totalQuantidade > 0 ? Number((totalValor / totalQuantidade).toFixed(2)) : 0,
    },
    topProdutos,
    rankingVendedores,
    resumoFornecedores,
    timeline,
  };
}
