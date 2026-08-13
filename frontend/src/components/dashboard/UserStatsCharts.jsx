import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { movementsApi } from "../../services/api/index.js";

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

export default function UserStatsCharts({ type }) {
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, [periodType, selectedMonth, selectedYear]);

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
    <div className="glass-card p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary mb-0.5">
            {isValue ? "Valor movimentado por usuário" : "Movimentações por usuário"}
          </h2>
          <p className="font-secondary text-xs text-text-secondary">
            {isValue ? "Total em reais de saídas registradas" : "Quantidade total de movimentações"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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

      <div className="h-[220px] sm:h-[240px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Carregando...</span>
          </div>
        ) : userStats.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary">
            Nenhuma movimentação no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userStats} barCategoryGap="30%">
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-border-light)" }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip isValue={isValue} />}
                cursor={{ fill: "var(--color-border-light)", opacity: 0.3 }}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {userStats.map((entry, i) => (
                  <Cell key={i} fill="var(--color-chart-1)" fillOpacity={opacityFor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}