// arquivo responsável pela padronização, geração e interpretação de Matrícula única baseada no ID do colaborador

// função para gerar código oficial de matrícula a partir do identificador único do banco de dados
// 1 - Recebe o ID numérico do usuário e formata no padrão determinístico MAT-00001
export function formatMatricula(userId) {
  const num = Number(userId);
  if (!num || isNaN(num) || num <= 0) return null;
  return `MAT-${String(Math.trunc(num)).padStart(5, "0")}`;
}

// função para montar exibição de matrícula indicando visualmente quando cancelada (colaborador desligado)
// 1 - Preserva o código original derivado do ID e acrescenta sufixo (CANCELADA) caso excluido=true
export function formatMatriculaDisplay(refId, rawMatricula = null, isCanceled = false) {
  const base = rawMatricula || formatMatricula(refId) || `#${refId}`;
  return isCanceled ? `${base} (CANCELADA)` : base;
}

// função para extrair ID numérico e código normalizado a partir de buscas ou parâmetros de rota ('MAT-00063', '63', etc.)
// 1 - Limpa espaços, converte para maiúsculo e detecta padrão MAT-<numeros> ou número puro
// 2 - Retorna numericId (usado em vendedorRefId/usuario.id) e normalizedMatricula (para LIKE / equals)
export function parseMatriculaSearch(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return { raw: "", upper: "", numericId: null, normalizedMatricula: null };
  }

  const upper = trimmed.toUpperCase();
  const matMatch = upper.match(/^MAT[-\s]?0*(\d+)$/);
  if (matMatch) {
    const idNum = Number(matMatch[1]);
    return {
      raw: trimmed,
      upper,
      numericId: !isNaN(idNum) && idNum > 0 ? idNum : null,
      normalizedMatricula: formatMatricula(idNum),
    };
  }

  const numericCandidate = Number(trimmed);
  if (!isNaN(numericCandidate) && Number.isInteger(numericCandidate) && numericCandidate > 0) {
    return {
      raw: trimmed,
      upper,
      numericId: numericCandidate,
      normalizedMatricula: formatMatricula(numericCandidate),
    };
  }

  return {
    raw: trimmed,
    upper,
    numericId: null,
    normalizedMatricula: null,
  };
}

// função auxiliar para gerar todos os meses calendário entre a admissão (início) e demissão/referência (término)
// 1 - Percorre cronologicamente do mês de início até o mês de término preenchendo zeros para meses sem vendas
export function buildWorkedMonthsTimeline(dataInicio, dataTermino) {
  const start = new Date(dataInicio);
  const end = new Date(dataTermino);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  const months = [];

  while (cursor <= endMonth && months.length < 120) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const rawLabel = cursor.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    months.push({
      key,
      label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
      pedidosConcluidos: 0,
      pecas: 0,
      faturamento: 0,
      _orderIds: new Set(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

// função auxiliar para interpretar data de demissão (YYYY-MM-DD local até 23:59:59 ou timestamp explícito)
// 1 - Quando recebe YYYY-MM-DD fixa no último segundo do dia para não cortar vendas realizadas na data de desligamento
export function parseDismissalDate(rawDate) {
  if (!rawDate) return new Date();
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    const [year, month, day] = rawDate.trim().split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// função compartilhada para montar payload padronizado do Relatório Final de Desligamento filtrado por meses trabalhados
// 1 - Mantém identificação enxuta (Nome, E-mail e Matrícula CANCELADA) com Data de Início e Data de Término (Demissão)
export function buildDismissalReportPayload({
  refId,
  nome,
  email,
  matricula,
  dataInicio,
  dataTermino,
  motivo = null,
  salesMovements = [],
  sellerOrders = [],
}) {
  const start = new Date(dataInicio);
  const end = new Date(dataTermino);
  const safeStart = start <= end ? start : end;
  const matriculaCode = matricula || formatMatricula(refId);

  const timeline = buildWorkedMonthsTimeline(safeStart, end);
  const monthIndexMap = new Map(timeline.map((m) => [m.key, m]));
  const totalOrderIds = new Set();
  const productMap = new Map();
  let faturamentoTotal = 0;
  let totalPecas = 0;

  for (const mov of salesMovements) {
    const val = Number(mov.valorTotal || 0);
    const qty = Number(mov.quantidade || 0);
    const d = new Date(mov.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const orderKey = mov.pedidoId ? `P_${mov.pedidoId}` : `M_${mov.id}`;

    faturamentoTotal += val;
    totalPecas += qty;
    totalOrderIds.add(orderKey);

    if (monthIndexMap.has(key)) {
      const mb = monthIndexMap.get(key);
      mb.faturamento += val;
      mb.pecas += qty;
      mb._orderIds.add(orderKey);
    }

    const pName = mov.produto?.nome || `Produto #${mov.produtoId}`;
    const prodAcc = productMap.get(mov.produtoId) || {
      produtoId: mov.produtoId,
      nome: pName,
      quantidade: 0,
      faturamento: 0,
    };
    prodAcc.quantidade += qty;
    prodAcc.faturamento += val;
    productMap.set(mov.produtoId, prodAcc);
  }

  const totalPedidosCancelados = sellerOrders.filter((p) => p.status === "CANCELADO").length;
  const totalPedidosConcluidos = totalOrderIds.size;
  faturamentoTotal = Number(faturamentoTotal.toFixed(2));

  return {
    vendedor: {
      vendedorRefId: Number(refId),
      nome,
      email,
      matricula: matriculaCode,
      matriculaCancelada: true,
      matriculaDisplay: formatMatriculaDisplay(refId, matriculaCode, true),
      dataInicio: safeStart.toISOString(),
      dataTermino: end.toISOString(),
      motivo: motivo || null,
    },
    resumo: {
      faturamentoTotal,
      totalPedidosConcluidos,
      totalPecas,
      totalPedidosCancelados,
      ticketMedio:
        totalPedidosConcluidos > 0
          ? Number((faturamentoTotal / totalPedidosConcluidos).toFixed(2))
          : 0,
    },
    vendasPorMes: timeline.map((m) => ({
      mes: m.key,
      label: m.label,
      pedidosConcluidos: m._orderIds.size,
      pecas: m.pecas,
      faturamento: Number(m.faturamento.toFixed(2)),
    })),
    topProdutos: Array.from(productMap.values())
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10)
      .map((p) => ({ ...p, faturamento: Number(p.faturamento.toFixed(2)) })),
    pedidos: sellerOrders.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      status: p.status,
      valorTotal: Number(p.valorTotal),
      createdAt: p.createdAt,
      itensCount: p.itens?.length || 0,
    })),
  };
}
