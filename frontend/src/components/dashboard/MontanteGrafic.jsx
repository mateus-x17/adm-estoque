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

const ENTRADA_COLOR = "var(--color-chart-3)";
const SAIDA_COLOR = "var(--color-chart-4)";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 min-w-[160px] space-y-1 shadow-xl">
      <p className="font-mono text-[11px] text-text-secondary mb-1">{label}</p>
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

  const [periodType, setPeriodType] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [tipoFiltro, setTipoFiltro] = useState("SAIDA");

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setChartData([]);
      try {
        let from, to;

        if (periodType === "month") {
          const [year, month] = selectedMonth.split("-");
          const lastDay = new Date(year, month, 0).getDate();
          from = `${year}-${month}-01`;
          to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
        } else {
          from = `${selectedYear}-01-01`;
          to = `${selectedYear}-12-31`;
        }

        const tipoParam = tipoFiltro === "AMBOS" ? undefined : tipoFiltro;

        const res = await movementsApi.getMovements({ limit: "all", from, to, ...(tipoParam ? { tipo: tipoParam } : {}) });
        const data = res.data || [];

        const grouped = {};
        data.forEach((mov) => {
          const d = new Date(mov.data);
          
          const rawKey = periodType === "year"
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

          const label = periodType === "year"
            ? d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
            : d.toLocaleDateString("pt-BR");

          if (!grouped[rawKey]) grouped[rawKey] = { rawKey, data: label, Entradas: 0, Saídas: 0 };

          const valor = mov.quantidade * Number(mov.produto.preco);
          if (mov.tipo === "ENTRADA") grouped[rawKey].Entradas += valor;
          else grouped[rawKey]["Saídas"] += valor;
        });

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
    <div className="glass-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-text-primary mb-1">
            {title}
          </h2>
          <p className="font-secondary text-xs text-text-secondary">
            Valor total em reais por dia / mês no período selecionado
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center shrink-0">
          <div className="flex rounded-md border border-[var(--color-border-light)] overflow-hidden">
            {TIPO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipoFiltro(opt.value)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors duration-200 ${
                  tipoFiltro === opt.value
                    ? "bg-accent-purple text-white"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-md border border-[var(--color-border-light)] overflow-hidden">
            {PERIODO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriodType(opt.value)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors duration-200 ${
                  periodType === opt.value
                    ? "bg-accent-purple text-white"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {periodType === "month" ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[var(--color-surface)] text-text-primary">
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
            <div className="w-5 h-5 border-2 border-[var(--color-accent-purple)] border-t-[var(--color-surface)] rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Carregando...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary">
            Nenhuma movimentação registrada neste período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {showEntradas && (
                  <linearGradient id="gradEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ENTRADA_COLOR} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ENTRADA_COLOR} stopOpacity={0} />
                  </linearGradient>
                )}
                {showSaidas && (
                  <linearGradient id="gradSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SAIDA_COLOR} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={SAIDA_COLOR} stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>

              <XAxis
                dataKey="data"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-border-light)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-border-light)", strokeWidth: 1 }} />
              {tipoFiltro === "AMBOS" && <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }} />}

              {showEntradas && (
                <Area
                  type="monotone"
                  dataKey="Entradas"
                  stroke={ENTRADA_COLOR}
                  strokeWidth={2}
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
                  strokeWidth={2}
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