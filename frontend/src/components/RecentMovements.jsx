import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { movementsApi } from "../services/api";

export default function RecentMovements() {
    const [movementsData, setMovementsData] = useState([]);

    useEffect(() => {
        movementsApi.getMovements()
            .then(setMovementsData)
            .catch(console.error);
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Movimentações Recentes
            </h2>

            <div className="space-y-4">
                {movementsData.slice(0, 5).map((mov) => (
                    <div key={mov.id} className="flex items-center gap-4 transition animate-fadeIn">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                            {mov.tipo === "ENTRADA" ? (
                                <ArrowUpRight className="w-5 h-5 text-green-500" />
                            ) : (
                                <ArrowDownRight className="w-5 h-5 text-red-500" />
                            )}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {mov.produto.nome}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {mov.tipo} • {mov.quantidade}
                            </p>
                        </div>

                        <span className="text-xs text-slate-400">
                            {new Date(mov.data).toLocaleDateString("pt-BR")}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
