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
