import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FornecedorDashboard = ({ stats, loading }) => {
  if (loading || !stats || stats.length === 0) {
    return null;
  }

  const barChartData = stats.map((s) => ({
    name: s.nome,
    Entradas: s.totalEntradas,
    Saidas: s.totalSaidas,
  }));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de barras */}
      <div className="glass-panel rounded-lg p-6">
        <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-4">
          Movimentações por fornecedor
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--line)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--line)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
            <Bar dataKey="Entradas" fill="var(--ink)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Saidas" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Destaques */}
      <div className="glass-panel rounded-lg p-6 flex flex-col">
        <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-4">
          Destaques
        </h3>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-[var(--line)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md border border-[var(--line)] flex items-center justify-center text-[var(--ink)] font-mono text-xs font-semibold">
                  {s.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{s.nome}</p>
                  <p className="font-mono text-[11px] text-[var(--ink-soft)]">
                    Vol. total: {s.totalMovimentacoes}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  Produto top
                </p>
                <p className="text-sm font-medium text-[var(--accent)]">
                  {s.produtoMaisMovimentado}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FornecedorDashboard;