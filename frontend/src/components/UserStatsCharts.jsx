import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { movementsApi } from "../services/api";


export default function UserStatsCharts({ type }) {
    const [userStats, setUserStats] = useState([]);

    useEffect(() => {
        movementsApi.getUserStats()
            .then(setUserStats)
            .catch(console.error);
    }, []);

    const isValue = type === "value";

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm h-[400px]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {isValue
                    ? "Valor Movimentado por Usuário (Saídas)"
                    : "Movimentações por Usuário"}
            </h2>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={isValue ? (v) => `R$ ${v.toFixed(2)}` : undefined}
                        />
                        <Bar
                            dataKey={isValue ? "totalValue" : "count"}
                            fill={isValue ? "#ec4899" : "#8b5cf6"}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
