import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { movementsApi } from "../../services/api/index.js";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-md px-3 py-2 min-w-[150px]">
      <p className="font-mono text-[11px] text-[var(--ink-soft)] mb-1">{label}</p>
      <p className="text-[var(--ink)] font-semibold text-sm">
        R$ {Number(payload[0]?.value).toFixed(2)}
      </p>
    </div>
  );
};

export default function MontanteGrafic() {
  const [saidaMontanteData, setSaidaMontanteData] = useState([]);

  useEffect(() => {
    movementsApi.getMovements()
      .then((movements) => {
        const saidas = movements.filter((m) => m.tipo === "SAIDA");

        const saidasPorData = saidas.reduce((acc, mov) => {
          const data = new Date(mov.data).toLocaleDateString("pt-BR");
          if (!acc[data]) acc[data] = { data, montante: 0 };
          acc[data].montante += mov.quantidade * Number(mov.produto.preco);
          return acc;
        }, {});

        const sorted = Object.values(saidasPorData).sort((a, b) => {
          const [da, ma, ya] = a.data.split("/");
          const [db, mb, yb] = b.data.split("/");
          return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });

        setSaidaMontanteData(sorted);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6">
      <h2 className="font-display text-base sm:text-lg font-semibold text-[var(--ink)] mb-1">
        Montante de saídas ao longo do tempo
      </h2>
      <p className="font-mono text-xs text-[var(--ink-soft)] mb-6">
        Valor total em reais de saídas registradas por dia
      </p>

      <div className="h-[280px] sm:h-[320px] lg:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={saidaMontanteData}>
            <defs>
              <linearGradient id="gradMontante" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="data"
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${v}`}
              width={56}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="montante"
              stroke="var(--ink)"
              strokeWidth={1.5}
              fill="url(#gradMontante)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--ink)", strokeWidth: 0 }}
              name="Montante"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}