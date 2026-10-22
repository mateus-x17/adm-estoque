import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { movementsApi } from "../../services/api/index.js";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 shadow-xl">
      <p className="font-semibold text-xs text-text-primary mb-2 border-b border-[var(--color-border-light)] pb-1">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="text-text-primary font-bold ml-auto">{p.value} unid.</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex items-center gap-5 justify-center pt-3">
    {payload.map((entry) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
        <span className="font-mono text-xs text-text-secondary">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function StockFlowChart() {
  const [loading, setLoading] = useState(true);
  const [allMovements, setAllMovements] = useState([]);
  const [periodo, setPeriodo] = useState("all"); // "all", "30d", "month"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await movementsApi.getMovements({ limit: "all" });
        const movements = Array.isArray(res) ? res : (res?.data || []);
        setAllMovements(movements);
      } catch (error) {
        console.error("Error fetching stock flow data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!allMovements.length) return [];

    const now = new Date();
    const filteredMovements = allMovements.filter((m) => {
      if (periodo === "all") return true;
      const d = new Date(m.data);
      if (periodo === "30d") {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return d >= past30;
      }
      if (periodo === "month") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      return true;
    });

    const products = [...new Set(allMovements.map((m) => m.produto?.nome).filter(Boolean))];

    return products.map((produto) => {
      const reposicoes = filteredMovements
        .filter((m) => m.produto?.nome === produto && (m.tipo === "REPOSICAO" || m.tipo === "ENTRADA"))
        .reduce((acc, cur) => acc + cur.quantidade, 0);

      const vendas = filteredMovements
        .filter((m) => m.produto?.nome === produto && (m.tipo === "VENDA" || m.tipo === "SAIDA"))
        .reduce((acc, cur) => acc + cur.quantidade, 0);

      // Nome curto para exibição sem cortar excessivamente no eixo X
      const shortName = produto.length > 18 ? `${produto.slice(0, 16)}...` : produto;

      return {
        produto,
        shortName,
        Vendas: vendas,
        Reposições: reposicoes,
      };
    });
  }, [allMovements, periodo]);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">
            Fluxo de mercadorias
          </h2>
          <p className="font-secondary text-xs text-text-secondary mt-1">
            Volume de vendas e reposições por produto
          </p>
        </div>

        {/* Seletor de Período dinâmico */}
        <div className="flex items-center gap-1 bg-surface-dark/40 p-1 rounded-lg border border-[var(--color-border-light)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriodo("all")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              periodo === "all"
                ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30 shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Geral
          </button>
          <button
            type="button"
            onClick={() => setPeriodo("month")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              periodo === "month"
                ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30 shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Mês atual
          </button>
          <button
            type="button"
            onClick={() => setPeriodo("30d")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              periodo === "30d"
                ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30 shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Últimos 30d
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[340px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorReposicoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="shortName"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-border-light)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-border-light)", opacity: 0.3 }} />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="Vendas" fill="url(#colorVendas)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reposições" fill="url(#colorReposicoes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}