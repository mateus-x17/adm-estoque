import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

/**
 * Dashboard component for supplier statistics
 * Displays bar chart of movements and highlights list
 */
const FornecedorDashboard = ({ stats, loading }) => {
    if (loading || !stats || stats.length === 0) {
        return null;
    }

    const barChartData = stats.map(s => ({
        name: s.nome,
        Entradas: s.totalEntradas,
        Saidas: s.totalSaidas
    }));

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">
                    Movimentações por Fornecedor
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Highlights List */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">
                    Destaques
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                    {s.nome.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {s.nome}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Vol. Total: {s.totalMovimentacoes}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Produto Top</p>
                                <p className="font-medium text-sm text-indigo-600 dark:text-indigo-400">
                                    {s.produtoMaisMovimentado}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FornecedorDashboard;
