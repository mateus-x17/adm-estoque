// arquivo responsável por padronizar, gerar, buscar e compor relatórios de Matrícula funcional de colaboradores.
// atua na camada de utilitários de Recursos Humanos e identificação do backend.
// tecnologias principais: JavaScript nativo (Date, Map, Set, Math, RegExp).
// usado por: userService, movementService e authMiddleware para emissão de matrículas determinísticas e relatórios de desligamento.

// função responsável por gerar o código oficial de matrícula determinística a partir do identificador único do usuário no banco.
//
// contexto: invocada no cadastro de usuários e na composição de respostas públicas para padronizar o identificador no formato MAT-00001.
//
// parâmetros:
//   - userId (number|string, obrigatório): ID numérico da tabela Usuario.
//
// retorno: string formatada no padrão 'MAT-00001' ou null caso o ID seja inválido.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe o identificador userId.
// 2 - converte userId para número com Number(userId).
// 3 - valida se o número é válido e maior que zero; retorna null se for inválido.
// 4 - trunca a parte inteira e aplica padStart com 5 dígitos precedido do prefixo MAT-.
// 5 - retorna a string de matrícula gerada.
export function formatMatricula(userId) {
  // 2 e 3 - valida tipo numérico
  const num = Number(userId);
  if (!num || isNaN(num) || num <= 0) return null;
  // 4 e 5 - formata e retorna
  return `MAT-${String(Math.trunc(num)).padStart(5, "0")}`;
}

// função responsável por formatar a matrícula para exibição visual indicando quando o colaborador foi desligado.
//
// contexto: chamada na montagem de telas e relatórios para destacar colaboradores demitidos com o sufixo (CANCELADA).
//
// parâmetros:
//   - refId (number|string, obrigatório): ID numérico original do colaborador.
//   - rawMatricula (string|null, opcional, padrão null): código de matrícula pré-existente no registro.
//   - isCanceled (boolean, opcional, padrão false): flag indicando se o vínculo funcional foi rescindido.
//
// retorno: string de exibição (ex.: 'MAT-00042' ou 'MAT-00042 (CANCELADA)').
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe refId, rawMatricula e isCanceled.
// 2 - resolve a base da matrícula utilizando rawMatricula, formatMatricula(refId) ou fallback `#${refId}`.
// 3 - se isCanceled for true, acrescenta o sufixo ' (CANCELADA)'.
// 4 - retorna a string formatada final.
export function formatMatriculaDisplay(refId, rawMatricula = null, isCanceled = false) {
  // 2 - resolve a base
  const base = rawMatricula || formatMatricula(refId) || `#${refId}`;
  // 3 e 4 - anexa cancelamento se aplicável
  return isCanceled ? `${base} (CANCELADA)` : base;
}

// função responsável por interpretar termos de busca textuais e extrair IDs numéricos ou códigos normalizados de matrícula.
//
// contexto: invocada por userService e movementService nos filtros de busca por nome ou matrícula.
//
// parâmetros:
//   - input (string|number|null, opcional): texto digitado pelo usuário na barra de pesquisa.
//
// retorno: objeto contendo:
//   - raw (string): termo original limpo.
//   - upper (string): termo em caixa alta.
//   - numericId (number|null): ID extraído se o termo for número puro ou padrão MAT-00012.
//   - normalizedMatricula (string|null): código determinístico formatado (ex.: 'MAT-00012').
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe input.
// 2 - converte para string e remove espaços em branco; retorna valores nulos se vazio.
// 3 - converte o texto para maiúsculas e testa correspondência com o padrão regex /^MAT[-\s]?0*(\d+)$/.
// 4 - se houver correspondência com MAT-, extrai o número do grupo de captura e monta o objeto de retorno.
// 5 - caso contrário, testa se o termo é um número inteiro puro positivo e monta o retorno correspondente.
// 6 - se não corresponder a nenhum padrão de matrícula, retorna objeto com numericId e normalizedMatricula nulos.
export function parseMatriculaSearch(input) {
  // 2 - valida entrada vazia
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return { raw: "", upper: "", numericId: null, normalizedMatricula: null };
  }

  // 3 e 4 - valida padrão com prefixo MAT-
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

  // 5 - valida número inteiro puro
  const numericCandidate = Number(trimmed);
  if (!isNaN(numericCandidate) && Number.isInteger(numericCandidate) && numericCandidate > 0) {
    return {
      raw: trimmed,
      upper,
      numericId: numericCandidate,
      normalizedMatricula: formatMatricula(numericCandidate),
    };
  }

  // 6 - fallback para busca textual livre
  return {
    raw: trimmed,
    upper,
    numericId: null,
    normalizedMatricula: null,
  };
}

// função responsável por construir a linha do tempo mensal contínua entre a admissão e a data de referência/demissão do colaborador.
//
// contexto: utilizada na geração de relatórios de desempenho e de rescisão para incluir meses com faturamento zero.
//
// parâmetros:
//   - dataInicio (Date|string, obrigatório): data de início do período (data de admissão).
//   - dataTermino (Date|string, obrigatório): data final do período trabalhado.
//
// retorno: array de objetos com cada mês do intervalo contendo key (YYYY-MM), label (Mês/Ano), contadores zerados e Set de pedidos.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe dataInicio e dataTermino.
// 2 - converte ambas para instâncias de Date posicionadas no primeiro dia do mês.
// 3 - itera mês a mês enquanto o cursor for menor ou igual ao mês de término (com limite seguro de 120 meses).
// 4 - a cada iteração, gera a chave 'YYYY-MM', o rótulo pt-BR com inicial maiúscula e o acumulador zerado.
// 5 - incrementa o mês do cursor com setMonth(cursor.getMonth() + 1).
// 6 - retorna a lista de meses montada.
export function buildWorkedMonthsTimeline(dataInicio, dataTermino) {
  // 2 - posiciona datas no início dos meses
  const start = new Date(dataInicio);
  const end = new Date(dataTermino);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  const months = [];

  // 3 a 5 - itera acumulando os períodos mensais
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
  // 6 - retorna a linha do tempo
  return months;
}

// função responsável por converter strings de data de demissão para o último segundo do dia especificado (23:59:59.999).
//
// contexto: chamada no registro de rescisão para garantir que movimentações do dia da demissão entrem integralmente nos cálculos.
//
// parâmetros:
//   - rawDate (string|Date|null, opcional): data informada pelo usuário.
//
// retorno: instância de Date apontando para as 23:59:59.999 da data ou a data atual se não informada.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe rawDate.
// 2 - se rawDate for nulo, retorna new Date() no momento atual.
// 3 - se for uma string no formato 'YYYY-MM-DD', extrai ano, mês e dia e instancia Date com horário 23:59:59.999 local.
// 4 - para outros formatos, converte via new Date(rawDate); se inválida, retorna a data atual.
// 5 - retorna a instância de Date final.
export function parseDismissalDate(rawDate) {
  // 2 - trata ausência de data
  if (!rawDate) return new Date();
  // 3 - trata formato ISO simples YYYY-MM-DD
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    const [year, month, day] = rawDate.trim().split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  // 4 e 5 - fallback para parsing flexível
  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// função responsável por consolidar o payload padronizado do Relatório Final de Desligamento de Colaborador.
//
// contexto: invocada por userService ao demitir colaborador ou ao reemitir seu relatório rescisório.
//
// parâmetros:
//   - params (objeto, obrigatório): dados de entrada da rescisão.
//       - params.refId (number|string, obrigatório): ID de referência do colaborador demitido.
//       - params.nome (string, obrigatório): nome do colaborador.
//       - params.email (string, obrigatório): e-mail funcional.
//       - params.matricula (string|null, opcional): matrícula cadastrada.
//       - params.dataInicio (string|Date, obrigatório): data de admissão.
//       - params.dataTermino (string|Date, obrigatório): data de demissão/rescisão.
//       - params.motivo (string|null, opcional): justificativa do desligamento.
//       - params.salesMovements (array, opcional, padrão []): lista de movimentações de venda válidas do período.
//       - params.sellerOrders (array, opcional, padrão []): lista de pedidos do vendedor.
//
// retorno: objeto estruturado com as chaves vendedor, resumo, vendasPorMes, topProdutos e pedidos.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura de agregação e formatação).
//
// passo a passo:
// 1 - recebe o objeto de parâmetros com os dados do colaborador, período, movimentações e pedidos.
// 2 - inicializa datas de início e término e gera o código de matrícula com cancelamento explícito.
// 3 - gera a linha do tempo contínua de meses via buildWorkedMonthsTimeline e mapeia em monthIndexMap.
// 4 - itera sobre salesMovements acumulando faturamentoTotal, totalPecas, pedidos únicos e agrupando por mês e por produto.
// 5 - calcula estatísticas de pedidos cancelados, pedidos concluídos e ticket médio.
// 6 - ordena o ranking de produtos por faturamento descendente limitando aos 10 principais.
// 7 - retorna o objeto completo do relatório de desligamento formatado.
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
  // 2 - calcula datas limites e matrícula
  const start = new Date(dataInicio);
  const end = new Date(dataTermino);
  const safeStart = start <= end ? start : end;
  const matriculaCode = matricula || formatMatricula(refId);

  // 3 - inicializa estrutura de linha do tempo
  const timeline = buildWorkedMonthsTimeline(safeStart, end);
  const monthIndexMap = new Map(timeline.map((m) => [m.key, m]));
  const totalOrderIds = new Set();
  const productMap = new Map();
  let faturamentoTotal = 0;
  let totalPecas = 0;

  // 4 - acumula movimentações nos meses correspondentes e produtos
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

  // 5 - calcula métricas agregadas
  const totalPedidosCancelados = sellerOrders.filter((p) => p.status === "CANCELADO").length;
  const totalPedidosConcluidos = totalOrderIds.size;
  faturamentoTotal = Number(faturamentoTotal.toFixed(2));

  // 6 e 7 - monta e retorna payload final
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
