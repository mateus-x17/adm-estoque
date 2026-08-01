import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";

export default function RecentMovements() {
  const [movementsData, setMovementsData] = useState([]);

  useEffect(() => {
    movementsApi.getMovements().then(setMovementsData).catch(console.error);
  }, []);

  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--line)] p-6">
      <h2 className="font-display text-base font-semibold text-[var(--ink)] mb-4">
        Movimentações recentes
      </h2>

      <div>
        {movementsData.slice(0, 5).map((mov, i, arr) => {
          const isEntrada = mov.tipo === "ENTRADA";
          return (
            <div
              key={mov.id}
              className={`flex items-center gap-3 py-3 ${
                i !== arr.length - 1 ? "border-b border-[var(--line)]" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center border ${
                  isEntrada
                    ? "border-[var(--teal)]/30 text-[var(--teal)]"
                    : "border-red-400/30 text-red-500"
                }`}
              >
                {isEntrada ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">
                  {mov.produto.nome}
                </p>
                <p className="font-mono text-xs text-[var(--ink-soft)]">
                  {mov.tipo} · {mov.quantidade}
                </p>
              </div>

              <span className="font-mono text-xs text-[var(--ink-soft)] shrink-0">
                {new Date(mov.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}