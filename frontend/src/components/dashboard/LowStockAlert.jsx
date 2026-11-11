import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productsApi } from "../../services/api/index.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelo painel lateral de avisos de baixo estoque com quantidades exatas, percentual e atalho direto

// função responsável pelo painel lateral de alertas de baixo estoque com navegação direta ao produto.
//
// 1 - não recebe parâmetros diretos (consulta getProductStats sempre que selectedLojaId muda).
// 2 - limita os itens visíveis ao top 6 crítico (< 10 unidades) e calcula o percentual restante.
// 3 - retorna o card glassmorphism com espaçamento enxuto e nomes fluindo sem corte prematuro.
export default function LowStockAlert() {
  const navigate = useNavigate();
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const [lowStockList, setLowStockList] = useState([]);
  const [totalLowStock, setTotalLowStock] = useState(0);

  useEffect(() => {
    productsApi
      .getProductStats()
      .then((data) => {
        setLowStockList((data.lowStockList || []).slice(0, 6));
        setTotalLowStock(data.lowStock || (data.lowStockList || []).length);
      })
      .catch(console.error);
  }, [selectedLojaId]);

  const MIN_THRESHOLD = 10;

  return (
    <div className="glass-card p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Baixo estoque
        </h2>
        <span className="font-mono text-[11px] text-text-secondary shrink-0">
          {totalLowStock} {totalLowStock === 1 ? "produto" : "produtos"} (&lt; 10 un.)
        </span>
      </div>

      {lowStockList.length > 0 ? (
        <div className="space-y-2.5 flex-1">
          {lowStockList.map((prod) => {
            const pctOfMin = Math.min(Math.round((prod.quantidade / MIN_THRESHOLD) * 100), 100);
            const deficitPct = Math.max(100 - pctOfMin, 8);
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => navigate(`/dashboard/produtos?focus=${prod.id}`)}
                className="w-full text-left p-1.5 -mx-1.5 rounded-xl hover:bg-white/5 transition-colors group"
                title={`Abrir "${prod.nome}" em Produtos`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className="text-sm text-text-primary truncate flex-1 min-w-0 group-hover:text-accent-purple transition-colors"
                    title={prod.nome}
                  >
                    {prod.nome}
                  </span>
                  <span className="font-mono text-[11px] text-text-secondary shrink-0">
                    <strong className={prod.quantidade <= 3 ? "text-accent-red" : "text-text-primary"}>
                      {prod.quantidade} un.
                    </strong>{" "}
                    ({pctOfMin}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border-light)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${deficitPct}%`,
                      backgroundColor: prod.quantidade <= 3 ? "var(--color-accent-red)" : "var(--color-accent-pink)",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-secondary flex-1">
          Nenhum produto com baixo estoque.
        </p>
      )}
    </div>
  );
}
