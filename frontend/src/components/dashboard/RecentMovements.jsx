import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import ModalMovimentacao from "../forms/ModalMovimentacao.jsx";

// arquivo responsável pelo card de movimentações recentes no Dashboard com modal de detalhes ao clicar

// função responsável pelo card lateral de movimentações recentes com abertura de detalhes em modal.
//
// 1 - não recebe parâmetros diretos (carrega últimas 10 movimentações via movementsApi ao alterar selectedLojaId).
// 2 - exibe até 5 registros resumidos permitindo abrir o ModalMovimentacao ao clicar.
// 3 - retorna o card glassmorphism com espaçamento enxuto.
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
    <div className="glass-card p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Movimentações recentes
        </h2>
        <span className="font-mono text-[10px] text-text-secondary shrink-0">
          Clique para detalhes
        </span>
      </div>

      <div className="flex-1">
        {movementsData.length === 0 ? (
          <p className="text-xs text-text-secondary py-5 text-center">
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
                className={`w-full text-left flex items-center hover:bg-white/5 transition-all duration-200 cursor-pointer rounded-lg gap-2.5 py-2 px-1.5 -mx-1.5 ${
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
