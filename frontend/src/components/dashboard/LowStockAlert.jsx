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
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Baixo estoque
        </h2>
        <span className="font-mono text-[11px] text-text-secondary">
          {lowStockList.length} {lowStockList.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {lowStockList.length > 0 ? (
        <div className="space-y-4 flex-1">
          {lowStockList.map((prod) => {
            const severity = 1 - prod.quantidade / maxQty; // 0 a 1, maior = mais crítico
            return (
              <div key={prod.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-sm text-text-primary truncate max-w-[140px]"
                    title={prod.nome}
                  >
                    {prod.nome}
                  </span>
                  <span className="font-mono text-xs text-text-secondary shrink-0">
                    {prod.quantidade} un.
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border-light)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(severity * 100, 8)}%`,
                      backgroundColor: severity > 0.6 ? "var(--color-accent-red)" : "var(--color-accent-pink)",
                    }}
                  />
                </div>
              </div>
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