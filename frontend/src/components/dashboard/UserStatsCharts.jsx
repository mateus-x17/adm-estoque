import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";
import { movementsApi } from "../services/api";

const COLORS_COUNT = [
    "#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6",
    "#fb7185", "#fb923c", "#facc15", "#34d399", "#38bdf8",
];

const COLORS_VALUE = [
    "#f472b6", "#fb923c", "#facc15", "#a3e635", "#34d399",
    "#22d3ee", "#60a5fa", "#818cf8", "#c084fc", "#e879f9",
];

// Tooltip customizado premium
const CustomTooltip = ({ active, payload, label, isValue }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl min-w-[140px]">
            <p className="text-xs text-slate-400 mb-1 font-medium truncate">{label}</p>
            <p className="text-white font-bold text-base">
                {isValue ? `R$ ${Number(val).toFixed(2)}` : val}
            </p>
        </div>
    );
};

export default function UserStatsCharts({ type }) {
    const [userStats, setUserStats] = useState([]);

    useEffect(() => {
        movementsApi.getUserStats()
            .then(setUserStats)
            .catch(console.error);
    }, []);

    const isValue = type === "value";
    const COLORS = isValue ? COLORS_VALUE : COLORS_COUNT;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm h-[400px]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {isValue
                    ? "Valor Movimentado por Usuário"
                    : "Movimentações por Usuário"}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
                {isValue ? "Total em reais de saídas registradas" : "Quantidade total de movimentações"}
            </p>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userStats} barCategoryGap="35%">
                        <defs>
                            {userStats.map((_, i) => (
                                <linearGradient
                                    key={i}
                                    id={`grad-user-${type}-${i}`}
                                    x1="0" y1="0" x2="0" y2="1"
                                >
                                    <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                                    <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.45} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(148,163,184,0.12)"
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={<CustomTooltip isValue={isValue} />}
                            cursor={{ fill: "rgba(148,163,184,0.06)" }}
                        />
                        <Bar
                            dataKey={isValue ? "totalValue" : "count"}
                            radius={[8, 8, 0, 0]}
                        >
                            {userStats.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={`url(#grad-user-${type}-${i})`}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
