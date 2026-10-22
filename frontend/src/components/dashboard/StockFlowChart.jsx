import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MoreHorizontal } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 shadow-xl">
      <p className="font-mono text-[11px] text-text-secondary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-text-secondary">{p.name}</span>
          <span className="text-text-primary font-semibold ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex items-center gap-5 justify-center pt-4">
    {payload.map((entry) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
        <span className="font-mono text-[11px] text-text-secondary">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function StockFlowChart() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const movements = await movementsApi.getMovements();
        const products = [...new Set(movements.map((m) => m.produto.nome))];

        const formattedData = products.map((produto) => {
          const reposicoes = movements
            .filter((m) => m.produto.nome === produto && (m.tipo === "REPOSICAO" || m.tipo === "ENTRADA"))
            .reduce((acc, cur) => acc + cur.quantidade, 0);

          const vendas = movements
            .filter((m) => m.produto.nome === produto && (m.tipo === "VENDA" || m.tipo === "SAIDA"))
            .reduce((acc, cur) => acc + cur.quantidade, 0);

          return { produto, Vendas: vendas, Reposições: reposicoes };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching stock flow data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">
            Fluxo de mercadorias
          </h2>
          <p className="font-secondary text-xs text-text-secondary mt-1">
            Volume de vendas e reposições por produto
          </p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-text-secondary" />
      </div>

      <div className="flex-1 min-h-[340px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="25%" barGap={6}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="colorReposicoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="produto"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--color-border-light)" }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-border-light)", opacity: 0.5 }} />
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