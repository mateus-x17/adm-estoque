import React, { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { movementsApi } from "../services/api";

// Tooltip customizado premium
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl min-w-[160px]">
            <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
            <p className="text-white font-bold text-base">
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
        <div className="col-span-2 flex justify-center">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-4 sm:p-8 shadow-sm">

                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Montante de Saídas ao Longo do Tempo
                </h2>
                <p className="text-xs text-slate-500 mb-4 sm:mb-6">
                    Valor total em reais de saídas registradas por dia
                </p>

                <div className="h-[280px] sm:h-[320px] lg:h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={saidaMontanteData}>

                            <defs>
                                <linearGradient id="gradMontante" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradMontanteLine" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="50%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#fb923c" />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(148,163,184,0.12)"
                            />

                            <XAxis
                                dataKey="data"
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `R$${v}`}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(148,163,184,0.2)", strokeWidth: 1 }} />

                            <Area
                                type="monotone"
                                dataKey="montante"
                                stroke="url(#gradMontanteLine)"
                                strokeWidth={3}
                                fill="url(#gradMontante)"
                                dot={{ r: 4, fill: "#f472b6", strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: "#c084fc", strokeWidth: 0 }}
                                name="Montante"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
