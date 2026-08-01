import { useEffect, useState } from "react";
import { productsApi, suppliersApi, categoriesApi } from "../../services/api/index.js";

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

  const lowStockRatio =
    stats.totalProdutos > 0 ? Math.round((stats.lowStock / stats.totalProdutos) * 100) : 0;

  const kpis = [
    { label: "Produtos em estoque", value: stats.totalProdutos, note: "Itens cadastrados" },
    { label: "Baixo estoque", value: stats.lowStock, note: `${lowStockRatio}% do total`, ratio: lowStockRatio },
    { label: "Fornecedores ativos", value: stats.totalFornecedores, note: "Parceiros cadastrados" },
    { label: "Categorias", value: stats.totalCategorias, note: "Segmentos distintos" },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl stat-grid-bg">
      {kpis.map((kpi, index) => (
        <div key={index} className="glass-panel rounded-xl p-5">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--ink-soft)]">
            {kpi.label}
          </span>

          <p className="font-display text-3xl font-bold text-[var(--ink)] mt-2 tabular-nums">
            {loading ? "···" : kpi.value.toLocaleString("pt-BR")}
          </p>

          {kpi.ratio !== undefined ? (
            <div className="mt-3">
              <div className="h-1 w-full rounded-full bg-[var(--line)] overflow-hidden">
                <div
                  className="h-full bg-[var(--ink)] transition-all duration-500"
                  style={{ width: `${Math.min(kpi.ratio, 100)}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-[var(--ink-soft)] mt-1.5 block">
                {kpi.note}
              </span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-[var(--ink-soft)] mt-3 block">
              {kpi.note}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}