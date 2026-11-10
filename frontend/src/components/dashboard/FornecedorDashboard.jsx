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

// arquivo responsável pelo painel analítico de desempenho e movimentações por fornecedor

// componente gráfico e de destaques por fornecedor
// 1 - Transforma estatísticas agregadas em série comparativa de Vendas x Reposições
// 2 - Adapta altura e alinhamento de cards para boa leitura tanto em desktop quanto em telas móveis
const FornecedorDashboard = ({ stats, loading }) => {
  if (loading || !stats || stats.length === 0) {
    return null;
  }

  const barChartData = stats.map((s) => ({
    name: s.nome,
    Vendas: s.totalVendas !== undefined ? s.totalVendas : s.totalSaidas,
    Reposições: s.totalReposicoes !== undefined ? s.totalReposicoes : s.totalEntradas,
  }));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Gráfico de barras */}
      <div className="glass-card p-4 sm:p-6">
        <h3 className="font-display text-base font-semibold text-text-primary mb-4">
          Movimentações por fornecedor
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barChartData}>
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 16,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }} />
            <Bar dataKey="Vendas" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Reposições" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Destaques */}
      <div className="glass-card p-4 sm:p-6 flex flex-col">
        <h3 className="font-display text-base font-semibold text-text-primary mb-4">
          Destaques
        </h3>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[260px] custom-scrollbar">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 sm:p-4 rounded-xl border border-[var(--color-border-light)] bg-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center text-text-primary font-mono text-xs font-semibold shrink-0">
                  {s.nome.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.nome}</p>
                  <p className="font-mono text-[11px] text-text-secondary">
                    Vol. total: {s.totalMovimentacoes}
                  </p>
                </div>
              </div>
              <div className="sm:text-right pl-12 sm:pl-0">
                <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                  Produto top
                </p>
                <p className="text-xs sm:text-sm font-medium text-text-primary mt-0.5 truncate">
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
