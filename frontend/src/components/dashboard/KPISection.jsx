import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink, Package, X } from "lucide-react";
import { productsApi, suppliersApi, categoriesApi } from "../../services/api/index.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelos cards de KPIs do Dashboard, incluindo modal interativo com lista completa de baixo estoque

const formatBRL = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

// função responsável por renderizar os cartões de KPIs principais do Dashboard e o modal clicável de baixo estoque.
//
// 1 - não recebe parâmetros diretos (consulta estoque, fornecedores e categorias sempre que selectedLojaId muda).
// 2 - calcula o percentual de itens críticos abaixo de 10 unidades e total de unidades restantes.
// 3 - retorna a grade responsiva de indicadores e o portal do modal detalhado com espaçamento otimizado para zoom 100%.
export default function KPISection() {
  const navigate = useNavigate();
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);

  const [loading, setLoading] = useState(true);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProdutos: 0,
    lowStock: 0,
    lowStockList: [],
    totalFornecedores: 0,
    totalCategorias: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, forn, cats] = await Promise.all([
          productsApi.getProductStats(),
          suppliersApi.getSuppliersCount(),
          categoriesApi.getCategoriesCount(),
        ]);

        setStats({
          totalProdutos: statsData.total || 0,
          lowStock: statsData.lowStock || 0,
          lowStockList: statsData.lowStockList || [],
          totalFornecedores: forn.count || 0,
          totalCategorias: cats.count || 0,
        });
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLojaId]);

  const lowStockRatio =
    stats.totalProdutos > 0 ? Math.round((stats.lowStock / stats.totalProdutos) * 100) : 0;

  const totalLowStockUnits = stats.lowStockList.reduce(
    (acc, item) => acc + Number(item.quantidade || 0),
    0
  );

  const kpis = [
    { label: "Produtos em estoque", value: stats.totalProdutos, note: "SKUs ativos cadastrados" },
    {
      label: "Baixo estoque (< 10 un.)",
      value: stats.lowStock,
      note: `${lowStockRatio}% do catálogo (${stats.lowStock} de ${stats.totalProdutos} · ${totalLowStockUnits} unid. restantes)`,
      ratio: lowStockRatio,
      clickable: true,
    },
    { label: "Fornecedores ativos", value: stats.totalFornecedores, note: "Parceiros cadastrados" },
    { label: "Categorias", value: stats.totalCategorias, note: "Segmentos distintos" },
  ];

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-0">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            onClick={kpi.clickable ? () => setLowStockModalOpen(true) : undefined}
            role={kpi.clickable ? "button" : undefined}
            tabIndex={kpi.clickable ? 0 : undefined}
            onKeyDown={
              kpi.clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLowStockModalOpen(true);
                    }
                  }
                : undefined
            }
            className={`glass-card hover-card p-3.5 sm:p-4 flex flex-col justify-between ${
              kpi.clickable
                ? "cursor-pointer hover:border-accent-pink/50 transition-all group"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-text-secondary">
                {kpi.label}
              </span>
              {kpi.clickable && (
                <span className="font-mono text-[10px] text-accent-pink group-hover:underline shrink-0">
                  Ver lista →
                </span>
              )}
            </div>

            <p className="font-display text-xl md:text-2xl font-bold text-text-primary mt-1.5 tabular-nums">
              {loading ? "···" : `${kpi.value.toLocaleString("pt-BR")} ${kpi.clickable ? "itens" : ""}`}
            </p>

            {kpi.ratio !== undefined ? (
              <div className="mt-2.5">
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border-light)] overflow-hidden">
                  <div
                    className="h-full bg-accent-pink transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(kpi.ratio, 100)}%` }}
                  />
                </div>
                <span className="font-secondary text-[11px] text-text-secondary mt-1.5 block leading-snug">
                  {kpi.note}
                </span>
              </div>
            ) : (
              <span className="font-secondary text-xs text-text-secondary mt-2.5 block">
                {kpi.note}
              </span>
            )}
          </div>
        ))}
      </section>

      {lowStockModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
            onClick={() => setLowStockModalOpen(false)}
          >
            <div
              className="w-full max-w-xl max-h-[88dvh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-text-primary">
                      Produtos com Baixo Estoque
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      {stats.lowStock} de {stats.totalProdutos} produto(s) ({lowStockRatio}%) com menos de 10 unidades • Clique no item para abrir
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLowStockModalOpen(false)}
                  className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-[var(--color-surface)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2 custom-scrollbar">
                {stats.lowStockList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
                    <Package size={24} className="opacity-40" />
                    Nenhum produto com saldo crítico abaixo de 10 unidades.
                  </div>
                ) : (
                  stats.lowStockList.map((prod) => {
                    const pctRemaining = Math.min(Math.round((prod.quantidade / 10) * 100), 100);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setLowStockModalOpen(false);
                          navigate(`/dashboard/produtos?focus=${prod.id}`);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-accent-purple/60 hover:bg-accent-purple/5 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-text-primary truncate group-hover:text-accent-purple">
                              {prod.nome}
                            </span>
                            {prod.loja?.nome && (
                              <span className="font-mono text-[10px] text-text-secondary shrink-0">
                                @{prod.loja.nome}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {prod.categoria?.nome || "Sem categoria"} · {formatBRL(prod.preco)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span
                              className={`font-mono text-xs font-bold block ${
                                prod.quantidade <= 3 ? "text-accent-red" : "text-accent-pink"
                              }`}
                            >
                              {prod.quantidade} unid. restantes
                            </span>
                            <span className="font-mono text-[10px] text-text-secondary">
                              {pctRemaining}% do mín. (10 un.)
                            </span>
                          </div>
                          <ExternalLink size={14} className="text-text-secondary group-hover:text-accent-purple" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
