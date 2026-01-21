import React, { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { movementsApi } from "../services/api";

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

                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
                    Montante de Saídas ao Longo do Tempo
                </h2>

                <div className="h-[280px] sm:h-[320px] lg:h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={saidaMontanteData}>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                className="hidden sm:block"
                            />

                            <XAxis dataKey="data" />
                            <YAxis />

                            <Tooltip formatter={(v) => `R$ ${Number(v).toFixed(2)}`} />

                            <Legend className="hidden sm:block" />

                            <Line
                                type="monotone"
                                dataKey="montante"
                                stroke="#ec4899"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
