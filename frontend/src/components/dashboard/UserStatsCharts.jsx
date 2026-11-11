import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { movementsApi } from "../../services/api/index.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelo gráfico de vendas e movimentações por vendedor no Dashboard (ADMIN e GERENTE)

const PERIODO_OPTIONS = [
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
];

const CustomTooltip = ({ active, payload, label, isValue }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="glass-card px-3 py-2 min-w-[130px] shadow-xl">
      <p className="font-mono text-[11px] text-text-secondary mb-1 truncate">{label}</p>
      <p className="text-text-primary font-semibold text-sm">
        {isValue ? `R$ ${Number(val).toFixed(2)}` : val}
      </p>
    </div>
  );
};

// função responsável por exibir ranking gráfico de vendedores em quantidade ou faturamento por mês/ano.
//
// 1 - recebe props com type ('value' para valor em R$ ou contagem de operações).
// 2 - consulta getUserStats recalculando intervalo mensal ou anual conforme selectedLojaId e filtros ativos.
// 3 - retorna o card com gráfico de barras proporcional e espaçamento ajustado para zoom 100%.
export default function UserStatsCharts({ type }) {
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = String(now.getFullYear());

  const [periodType, setPeriodType] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
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

        const data = await movementsApi.getUserStats({ from, to });
        setUserStats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("UserStatsCharts error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [periodType, selectedMonth, selectedYear, selectedLojaId]);

  const isValue = type === "value";
  const dataKey = isValue ? "totalValue" : "count";

  const sorted = [...userStats].sort((a, b) => b[dataKey] - a[dataKey]);
  const rankOf = new Map(sorted.map((d, i) => [d.name, i]));

  const opacityFor = (name) => {
    const rank = rankOf.get(name) ?? 0;
    const n = Math.max(sorted.length - 1, 1);
    return 1 - (rank / n) * 0.65;
  };

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary mb-0.5">
            {isValue ? "Valor movimentado por vendedor" : "Movimentações por vendedor"}
          </h2>
          <p className="font-secondary text-xs text-text-secondary">
            {isValue
              ? "Faturamento líquido validado (inclui histórico preservado)"
              : "Volume total de operações concluídas"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-md border border-[var(--color-border-light)] overflow-hidden">
            {PERIODO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriodType(opt.value)}
                className={`px-3 py-1 text-xs font-mono transition-colors duration-200 ${
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
              className="px-2.5 py-1 rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-[195px] flex items-center justify-center">
          <span className="font-mono text-xs text-text-secondary animate-pulse">
            Carregando...
          </span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="h-[195px] flex items-center justify-center">
          <span className="font-mono text-xs text-text-secondary">
            Nenhum dado encontrado no período
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={195}>
          <BarChart data={sorted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="var(--color-text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (isValue ? `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` : v)}
            />
            <Tooltip content={<CustomTooltip isValue={isValue} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} maxBarSize={38}>
              {sorted.map((entry) => (
                <Cell
                  key={entry.vendedorRefId || entry.name}
                  fill={isValue ? "var(--color-chart-2)" : "var(--color-chart-1)"}
                  fillOpacity={opacityFor(entry.name)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
