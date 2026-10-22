import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";

export default function RecentMovements() {
  const [movementsData, setMovementsData] = useState([]);

  useEffect(() => {
    movementsApi.getMovements().then(setMovementsData).catch(console.error);
  }, []);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="font-display text-base font-semibold text-text-primary mb-4">
        Movimentações recentes
      </h2>

      <div className="flex-1">
        {movementsData.slice(0, 5).map((mov, i, arr) => {
          const isVenda = mov.tipo === "VENDA" || mov.tipo === "SAIDA";
          return (
            <div
              key={mov.id}
              className={`flex items-center hover:bg-white/5 transition-all duration-200 cursor-pointer rounded-lg gap-3 py-3 px-2 -mx-2 ${i !== arr.length - 1 ? "border-b border-[var(--color-border-light)]" : ""
                }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isVenda
                  ? "border-accent-green/20 text-accent-green bg-accent-green/5"
                  : "border-accent-red/20 text-accent-red bg-accent-red/5"
                  }`}
              >
                {isVenda ? (
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <ArrowDownRight className="w-4 h-4" strokeWidth={1.5} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {mov.produto.nome}
                </p>
                <p className="font-mono text-xs text-text-secondary mt-0.5">
                  {isVenda ? "Venda" : "Reposição"} · {mov.quantidade}
                </p>
              </div>

              <span className="font-mono text-[11px] text-text-secondary shrink-0">
                {new Date(mov.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}