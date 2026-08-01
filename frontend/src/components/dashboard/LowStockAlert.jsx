import { useEffect, useState } from "react";
import { productsApi } from "../../services/api/index.js";

export default function LowStockAlert() {
  const [lowStockList, setLowStockList] = useState([]);

  useEffect(() => {
    productsApi.getProductStats()
      .then((data) => setLowStockList(data.lowStockList || []))
      .catch(console.error);
  }, []);

  // Quanto menor a quantidade, mais crítico — usado como % de preenchimento da barra.
  const maxQty = Math.max(...lowStockList.map((p) => p.quantidade), 1);

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-base font-semibold text-[var(--ink)]">
          Baixo estoque
        </h2>
        <span className="font-mono text-[11px] text-[var(--ink-soft)]">
          {lowStockList.length} {lowStockList.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {lowStockList.length > 0 ? (
        <div className="space-y-4">
          {lowStockList.map((prod) => {
            const severity = 1 - prod.quantidade / maxQty; // 0 a 1, maior = mais crítico
            return (
              <div key={prod.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-sm text-[var(--ink)] truncate max-w-[140px]"
                    title={prod.nome}
                  >
                    {prod.nome}
                  </span>
                  <span className="font-mono text-xs text-[var(--ink-soft)] shrink-0">
                    {prod.quantidade} un.
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-[var(--line)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(severity * 100, 8)}%`,
                      backgroundColor: severity > 0.6 ? "#C24A3B" : "var(--ink-soft)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-soft)]">
          Nenhum produto com baixo estoque.
        </p>
      )}
    </div>
  );
}