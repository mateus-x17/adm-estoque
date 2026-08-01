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

const CustomTooltip = ({ active, payload, label, isValue }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="glass-panel rounded-md px-3 py-2 min-w-[130px]">
      <p className="font-mono text-[11px] text-[var(--ink-soft)] mb-1 truncate">{label}</p>
      <p className="text-[var(--ink)] font-semibold text-sm">
        {isValue ? `R$ ${Number(val).toFixed(2)}` : val}
      </p>
    </div>
  );
};

export default function UserStatsCharts({ type }) {
  const [userStats, setUserStats] = useState([]);

  useEffect(() => {
    movementsApi.getUserStats().then(setUserStats).catch(console.error);
  }, []);

  const isValue = type === "value";
  const dataKey = isValue ? "totalValue" : "count";

  // Monocromático: opacidade decresce por rank, maior valor = mais escuro.
  // Assim a cor comunica magnitude relativa, não é decorativa.
  const sorted = [...userStats].sort((a, b) => b[dataKey] - a[dataKey]);
  const rankOf = new Map(sorted.map((d, i) => [d.name, i]));
  const opacityFor = (name) => {
    const rank = rankOf.get(name) ?? 0;
    const n = Math.max(sorted.length - 1, 1);
    return 1 - (rank / n) * 0.65; // varia entre 1.0 e 0.35
  };

  return (
    <div className="glass-panel rounded-xl p-6 h-[380px]">
      <h2 className="font-display text-base font-semibold text-[var(--ink)] mb-1">
        {isValue ? "Valor movimentado por usuário" : "Movimentações por usuário"}
      </h2>
      <p className="font-mono text-xs text-[var(--ink-soft)] mb-6">
        {isValue ? "Total em reais de saídas registradas" : "Quantidade total de movimentações"}
      </p>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={userStats} barCategoryGap="40%">
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip isValue={isValue} />}
              cursor={{ fill: "var(--line)", opacity: 0.3 }}
            />
            <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
              {userStats.map((entry, i) => (
                <Cell key={i} fill="var(--ink)" fillOpacity={opacityFor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}