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
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelo gráfico comparativo de entradas (reposições) e saídas (vendas) por produto no Dashboard

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

// função principal para buscar movimentações e plotar barras responsivas filtradas por Mês Atual, 6 Meses e Último Ano
// 1 - Carrega as movimentações da loja/rede (ou do operador) recarregando ao alternar selectedLojaId
// 2 - Ignora registros de estorno/cancelamento e agrupa vendas x reposições conforme a janela (1m, 6m, 1y)
export default function StockFlowChart() {
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const [loading, setLoading] = useState(true);
  const [allMovements, setAllMovements] = useState([]);
  const [periodo, setPeriodo] = useState("1m"); // "1m" (Mês atual), "6m" (6 Meses), "1y" (Último ano)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await movementsApi.getMovements({ limit: "all" });
        const movements = Array.isArray(res) ? res : res?.data || [];
        setAllMovements(movements);
      } catch (error) {
        console.error("Error fetching stock flow data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLojaId]);

  const chartData = useMemo(() => {
    if (!allMovements.length) return [];

    const now = new Date();
    const startCutoff = new Date(now);
    if (periodo === "1m") {
      startCutoff.setDate(1);
      startCutoff.setHours(0, 0, 0, 0);
    } else if (periodo === "6m") {
      startCutoff.setMonth(now.getMonth() - 6);
    } else {
      startCutoff.setFullYear(now.getFullYear() - 1);
    }

    const validMovements = allMovements.filter((m) => {
      if (m.estorno || m.pedido?.status === "CANCELADO") return false;
      const d = new Date(m.data);
      return d >= startCutoff;
    });

    const products = [...new Set(validMovements.map((m) => m.produto?.nome).filter(Boolean))];

    return products.map((produto) => {
      const reposicoes = validMovements
        .filter((m) => m.produto?.nome === produto && (m.tipo === "REPOSICAO" || m.tipo === "ENTRADA"))
        .reduce((acc, cur) => acc + cur.quantidade, 0);

      const vendas = validMovements
        .filter((m) => m.produto?.nome === produto && (m.tipo === "VENDA" || m.tipo === "SAIDA"))
        .reduce((acc, cur) => acc + cur.quantidade, 0);

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
    <div className="glass-card p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">
            Fluxo de mercadorias
          </h2>
          <p className="font-secondary text-xs text-text-secondary mt-1">
            Volume líquido de vendas e reposições por produto
          </p>
        </div>

        {/* Seletor executivo de janela: Mês atual, 6 Meses e Último ano */}
        <div className="flex flex-wrap items-center gap-1 bg-surface-dark/40 p-1 rounded-lg border border-[var(--color-border-light)] self-start sm:self-auto">
          {[
            { id: "1m", label: "Mês atual" },
            { id: "6m", label: "6 Meses" },
            { id: "1y", label: "Último ano" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriodo(opt.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                periodo === opt.id
                  ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[260px] sm:min-h-[340px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-secondary">
            Nenhuma movimentação registrada no período selecionado.
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
