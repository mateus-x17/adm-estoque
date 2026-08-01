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
    <div className="glass-panel rounded-md px-4 py-3">
      <p className="font-mono text-[11px] text-[var(--ink-soft)] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--ink-soft)]">{p.name}</span>
          <span className="text-[var(--ink)] font-semibold ml-auto">{p.value}</span>
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
        <span className="font-mono text-[11px] text-[var(--ink-soft)]">{entry.value}</span>
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
          const entradas = movements
            .filter((m) => m.produto.nome === produto && m.tipo === "ENTRADA")
            .reduce((acc, cur) => acc + cur.quantidade, 0);

          const saidas = movements
            .filter((m) => m.produto.nome === produto && m.tipo === "SAIDA")
            .reduce((acc, cur) => acc + cur.quantidade, 0);

          return { produto, Entradas: entradas, Saídas: saidas };
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
    <div className="glass-panel rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-[var(--ink)]">
            Fluxo de mercadorias
          </h2>
          <p className="font-mono text-xs text-[var(--ink-soft)] mt-1">
            Volume de entradas e saídas por produto
          </p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-[var(--ink-soft)]" />
      </div>

      <div className="h-[340px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--ink-soft)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
              <XAxis
                dataKey="produto"
                tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--line)", opacity: 0.3 }} />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="Entradas" fill="var(--ink)" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saídas" fill="var(--ink)" fillOpacity={0.25} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}