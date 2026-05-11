import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { MoreHorizontal } from "lucide-react";
import { movementsApi } from "../services/api";

// Tooltip customizado com visual premium
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-xs text-slate-400 mb-2 font-medium">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-sm font-semibold">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                    />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="text-white">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

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
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Fluxo de Mercadorias
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Volume de entradas e saídas por produto
                    </p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-[380px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            barCategoryGap="30%"
                            barGap={6}
                        >
                            {/* Definição de gradientes SVG */}
                            <defs>
                                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                </linearGradient>
                                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(148,163,184,0.12)"
                            />
                            <XAxis
                                dataKey="produto"
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                            <Legend
                                wrapperStyle={{ paddingTop: "16px", fontSize: "13px", color: "#94a3b8" }}
                            />
                            <Bar dataKey="Entradas" fill="url(#gradEntradas)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Saídas" fill="url(#gradSaidas)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
