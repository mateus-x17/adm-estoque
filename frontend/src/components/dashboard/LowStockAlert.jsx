import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { productsApi } from "../services/api";

export default function LowStockAlert() {
    const [lowStockList, setLowStockList] = useState([]);

    useEffect(() => {
        productsApi.getProductStats()
            .then((data) => setLowStockList(data.lowStockList || []))
            .catch(console.error);
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Alerta de Baixo Estoque
            </h2>

            <div className="space-y-4">
                {lowStockList.length > 0 ? (
                    lowStockList.map((prod) => (
                        <div
                            key={prod.id}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                                    {prod.quantidade}
                                </div>
                                <span
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
                                    title={prod.nome}
                                >
                                    {prod.nome}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nenhum produto com baixo estoque.
                    </p>
                )}
            </div>
        </div>
    );
}
