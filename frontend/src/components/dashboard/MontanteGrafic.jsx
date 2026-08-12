import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { movementsApi } from "../../services/api/index.js";

const ENTRADA_COLOR = "var(--teal)";
const SAIDA_COLOR = "var(--danger)";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-md px-3 py-2 min-w-[160px] space-y-1">
      <p className="font-mono text-[11px] text-[var(--ink-soft)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold text-sm" style={{ color: p.stroke }}>
          {p.name}: R$ {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

const PERIODO_OPTIONS = [
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
];

const TIPO_OPTIONS = [
  { label: "Saídas", value: "SAIDA" },
  { label: "Entradas", value: "ENTRADA" },
  { label: "Ambos", value: "AMBOS" },
];

export default function MontanteGrafic() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = String(now.getFullYear());

  const [periodType, setPeriodType] = useState("month"); // "month" | "year"
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [tipoFiltro, setTipoFiltro] = useState("SAIDA"); // "SAIDA" | "ENTRADA" | "AMBOS"

  // Gera lista de anos razoáveis
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  // -------------------------------------------------------------------------
  // CORE LOGIC: fetchData
  // Monta a regra de negócio do Recharts baseado nas seleções de tempo (mensal ou anual).
  // 1 - Dispara uma query pesada para a API pedindo limite total ("all") das movimentações dentro daquele range de datas
  // 2 - Agrupa os resultados dia-a-dia (se mês) ou mês-a-mês (se ano), somando o Montante (Qtd * Preço) 
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setChartData([]);
      try {
        let from, to;

        // Formatação das extremidades de tempo (Data inicial e final ISO) que a API do backend precisa para filtrar
        if (periodType === "month") {
          const [year, month] = selectedMonth.split("-");
          const lastDay = new Date(year, month, 0).getDate();
          from = `${year}-${month}-01`;
          to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
        } else {
          from = `${selectedYear}-01-01`;
          to = `${selectedYear}-12-31`;
        }

        // Caso "AMBOS" esteja selecionado, não envia o tipo para a API (trazendo tanto ENTRADA quanto SAIDA)
        const tipoParam = tipoFiltro === "AMBOS" ? undefined : tipoFiltro;

        const res = await movementsApi.getMovements({ limit: "all", from, to, ...(tipoParam ? { tipo: tipoParam } : {}) });
        const data = res.data || [];

        // Lógica matemática complexa: 
        // Em vez de passar os dados brutos, nós criamos um 'dicionário' chamado 'grouped'.
        // Assim, múltiplas vendas no mesmo dia (ex: 5 saídas diferentes em 12/08) são aglutinadas num ponto só no gráfico de área, criando uma visualização fluida.
        const grouped = {};
        data.forEach((mov) => {
          const d = new Date(mov.data);
          
          // Chave de agrupamento exata que também serve para sort() depois
          const rawKey = periodType === "year"
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

          // Label elegante humano ('ago de 2026' ou '12/08') que o Recharts vai renderizar visualmente no tooltip
          const label = periodType === "year"
            ? d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
            : d.toLocaleDateString("pt-BR");

          if (!grouped[rawKey]) grouped[rawKey] = { rawKey, data: label, Entradas: 0, Saídas: 0 };

          // Cálculo do Montante absoluto (R$) = Qtd vendida * Preço base
          const valor = mov.quantidade * Number(mov.produto.preco);
          if (mov.tipo === "ENTRADA") grouped[rawKey].Entradas += valor;
          else grouped[rawKey]["Saídas"] += valor;
        });

        // O Object.values transforma nosso dicionário de volta num array normal e ordena usando o rawKey (yyyy-mm-dd) alfabeticamente/cronologicamente
        const sorted = Object.values(grouped).sort((a, b) => a.rawKey.localeCompare(b.rawKey));

        setChartData(sorted);
      } catch (err) {
        console.error("MontanteGrafic error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodType, selectedMonth, selectedYear, tipoFiltro]);

  const showEntradas = tipoFiltro === "ENTRADA" || tipoFiltro === "AMBOS";
  const showSaidas = tipoFiltro === "SAIDA" || tipoFiltro === "AMBOS";

  const title =
    tipoFiltro === "AMBOS"
      ? "Entradas e Saídas ao longo do tempo"
      : tipoFiltro === "ENTRADA"
      ? "Montante de entradas ao longo do tempo"
      : "Montante de saídas ao longo do tempo";

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-[var(--ink)] mb-1">
            {title}
          </h2>
          <p className="font-mono text-xs text-[var(--ink-soft)]">
            Valor total em reais por dia / mês no período selecionado
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center shrink-0">
          {/* Tipo filter */}
          <div className="flex rounded-md border border-[var(--line)] overflow-hidden">
            {TIPO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipoFiltro(opt.value)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors duration-200 ${
                  tipoFiltro === opt.value
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Period type toggle */}
          <div className="flex rounded-md border border-[var(--line)] overflow-hidden">
            {PERIODO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriodType(opt.value)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors duration-200 ${
                  periodType === opt.value
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date selector */}
          {periodType === "month" ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[var(--bg-elevated)] text-[var(--ink)]">
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="h-[280px] sm:h-[320px] lg:h-[360px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
            <span className="text-sm text-[var(--ink-soft)]">Carregando...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--ink-soft)]">
            Nenhuma movimentação registrada neste período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {showEntradas && (
                  <linearGradient id="gradEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E8F79" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1E8F79" stopOpacity={0} />
                  </linearGradient>
                )}
                {showSaidas && (
                  <linearGradient id="gradSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C24A3B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#C24A3B" stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>

              <XAxis
                dataKey="data"
                tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
              {tipoFiltro === "AMBOS" && <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />}

              {showEntradas && (
                <Area
                  type="monotone"
                  dataKey="Entradas"
                  stroke={ENTRADA_COLOR}
                  strokeWidth={1.5}
                  fill="url(#gradEntrada)"
                  dot={false}
                  activeDot={{ r: 4, fill: ENTRADA_COLOR, strokeWidth: 0 }}
                />
              )}
              {showSaidas && (
                <Area
                  type="monotone"
                  dataKey="Saídas"
                  stroke={SAIDA_COLOR}
                  strokeWidth={1.5}
                  fill="url(#gradSaida)"
                  dot={false}
                  activeDot={{ r: 4, fill: SAIDA_COLOR, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}