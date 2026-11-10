import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import ModalMovimentacao from "../forms/ModalMovimentacao.jsx";

// arquivo responsável pelo card de movimentações recentes no Dashboard com modal de detalhes ao clicar

export default function RecentMovements() {
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const [movementsData, setMovementsData] = useState([]);
  const [selectedMov, setSelectedMov] = useState(null);

  useEffect(() => {
    movementsApi
      .getMovements({ limit: 10, order: "desc" })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setMovementsData(list);
      })
      .catch(console.error);
  }, [selectedLojaId]);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Movimentações recentes
        </h2>
        <span className="font-mono text-[10px] text-text-secondary">
          Clique para detalhes
        </span>
      </div>

      <div className="flex-1">
        {movementsData.length === 0 ? (
          <p className="text-xs text-text-secondary py-6 text-center">
            Nenhuma movimentação registrada recentemente.
          </p>
        ) : (
          movementsData.slice(0, 5).map((mov, i, arr) => {
            const isVenda = mov.tipo === "VENDA" || mov.tipo === "SAIDA";
            return (
              <button
                key={mov.id}
                type="button"
                onClick={() => setSelectedMov(mov)}
                className={`w-full text-left flex items-center hover:bg-white/5 transition-all duration-200 cursor-pointer rounded-lg gap-3 py-3 px-2 -mx-2 ${
                  i !== arr.length - 1 ? "border-b border-[var(--color-border-light)]" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                    mov.estorno
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : isVenda
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
                    {mov.produto?.nome}
                  </p>
                  <p className="font-mono text-xs text-text-secondary mt-0.5 truncate">
                    {isVenda ? "Venda" : "Reposição"} · {mov.quantidade} un.
                    {mov.estorno ? " · ESTORNO" : ""}
                  </p>
                </div>

                <span className="font-mono text-[11px] text-text-secondary shrink-0">
                  {new Date(mov.data).toLocaleDateString("pt-BR")}
                </span>
              </button>
            );
          })
        )}
      </div>

      <ModalMovimentacao
        isOpen={Boolean(selectedMov)}
        onClose={() => setSelectedMov(null)}
        movimentacao={selectedMov}
      />
    </div>
  );
}
