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

// função responsável por exibir o gráfico comparativo e os destaques de movimentação por fornecedor.
//
// 1 - recebe stats (array), loading (boolean) e statusFiltro (string opcional, padrão 'ativos').
// 2 - oculta durante carregamento e trata estado vazio com mensagem contextual segundo o filtro.
// 3 - retorna os dois cartões analíticos em grade responsiva com altura confortável para zoom 100%.
const FornecedorDashboard = ({ stats, loading, statusFiltro = "ativos" }) => {
  if (loading) {
    return null;
  }

  const emptyMessage =
    statusFiltro === "inativos"
      ? "Não há fornecedores inativos cadastrados nesta unidade."
      : statusFiltro === "ativos"
      ? "Não há fornecedores ativos com movimentação no momento."
      : "Nenhum fornecedor encontrado para exibir estatísticas.";

  const hasData = Array.isArray(stats) && stats.length > 0;

  const barChartData = hasData
    ? stats.map((s) => ({
        name: s.nome,
        Vendas: s.totalVendas !== undefined ? s.totalVendas : s.totalSaidas,
        Reposições: s.totalReposicoes !== undefined ? s.totalReposicoes : s.totalEntradas,
      }))
    : [];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico de barras */}
      <div className="glass-card p-4 sm:p-5 flex flex-col">
        <h3 className="font-display text-base font-semibold text-text-primary mb-3">
          Movimentações por fornecedor
        </h3>
        {!hasData ? (
          <div className="flex-1 min-h-[180px] flex items-center justify-center text-center text-xs text-text-secondary border border-dashed border-[var(--color-border-light)] rounded-xl p-5">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
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
        )}
      </div>

      {/* Destaques / Barra de informações */}
      <div className="glass-card p-4 sm:p-5 flex flex-col">
        <h3 className="font-display text-base font-semibold text-text-primary mb-3">
          Destaques &amp; Indicadores
        </h3>
        {!hasData ? (
          <div className="flex-1 min-h-[180px] flex items-center justify-center text-center text-xs text-text-secondary border border-dashed border-[var(--color-border-light)] rounded-xl p-5">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[220px] custom-scrollbar">
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-[var(--color-border-light)] bg-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center text-text-primary font-mono text-xs font-semibold shrink-0">
                    {s.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{s.nome}</p>
                      {s.ativo === false && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-bold uppercase">
                          Inativo
                        </span>
                      )}
                    </div>
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
        )}
      </div>
    </section>
  );
};

export default FornecedorDashboard;
