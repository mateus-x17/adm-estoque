import { useEffect, useState } from "react";
import { AlertCircle, Package, Truck, ListTree, TrendingUp } from "lucide-react";
import { productsApi, suppliersApi, categoriesApi } from "../services/api";

export default function KPISection() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProdutos: 0,
        lowStock: 0,
        totalFornecedores: 0,
        totalCategorias: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, forn, cats] = await Promise.all([
                    productsApi.getProductStats(),
                    suppliersApi.getSuppliersCount(),
                    categoriesApi.getCategoriesCount(),
                ]);

                setStats({
                    totalProdutos: statsData.total,
                    lowStock: statsData.lowStock,
                    totalFornecedores: forn.count,
                    totalCategorias: cats.count,
                });
            } catch (error) {
                console.error("Error fetching KPI data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const kpis = [
        {
            title: "Produtos em Estoque",
            value: stats.totalProdutos,
            icon: Package,
            color: "from-blue-500 to-indigo-600",
            trend: "Total itens",
        },
        {
            title: "Baixo Estoque",
            value: stats.lowStock,
            icon: AlertCircle,
            color: "from-amber-400 to-orange-500",
            trend: "Requer atenção",
        },
        {
            title: "Fornecedores Ativos",
            value: stats.totalFornecedores,
            icon: Truck,
            color: "from-emerald-500 to-teal-600",
            trend: "Parceiros",
        },
        {
            title: "Categorias",
            value: stats.totalCategorias,
            icon: ListTree,
            color: "from-fuchsia-500 to-pink-600",
            trend: "Segmentos",
        },
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
                <div
                    key={index}
                    className="group relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm transition animate-fadeIn">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.color}`}>
                            <kpi.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {kpi.title}
                            </h3>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {loading ? "..." : kpi.value}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-medium text-emerald-500 uppercase">
                            {kpi.trend}
                        </span>
                    </div>
                </div>
            ))}
        </section>
    );
}
