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

                    return { produto, Entradas: entradas, Saidas: saidas };
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
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="produto" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Entradas" fill="#6366f1" />
                            <Bar dataKey="Saidas" fill="#f43f5e" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
