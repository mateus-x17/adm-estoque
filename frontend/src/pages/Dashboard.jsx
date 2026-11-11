import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import KPISection from "../components/dashboard/KPISection.jsx";
import StockFlowChart from "../components/dashboard/StockFlowChart.jsx";
import LowStockAlert from "../components/dashboard/LowStockAlert.jsx";
import RecentMovements from "../components/dashboard/RecentMovements.jsx";
import UserStatsCharts from "../components/dashboard/UserStatsCharts.jsx";
import MontanteGrafic from "../components/dashboard/MontanteGrafic.jsx";
import ModalExportarRelatorio from "../components/dashboard/ModalExportarRelatorio.jsx";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";

// arquivo responsável por renderizar o Dashboard executivo multi-loja / filial com acesso a relatórios PDF e Desempenho

// função responsável por renderizar o Dashboard executivo multi-loja com KPIs, gráficos analíticos e atalho de relatórios PDF.
//
// 1 - recebe nenhum parâmetro externo (lê usuário e loja selecionada via Zustand).
// 2 - define permissões de visualização (canViewUserStats) e rótulo de escopo da rede/filial.
// 3 - retorna o painel completo com espaçamento compacto ajustado para zoom 100% sem cortes.
const Dashboard = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId } = useTenantStore();

  const canViewUserStats = user?.role === "ADMIN" || user?.role === "GERENTE";
  const orgName = user?.organizacao?.nome || user?.organizacaoNome;
  const selectedStoreObj = stores.find((s) => String(s.id) === String(selectedLojaId));
  const scopeSubtitle =
    user?.role === "ADMIN"
      ? selectedLojaId === "all"
        ? `${orgName || "Rede"} • Todas as Lojas`
        : `${orgName || "Rede"} • ${selectedStoreObj?.nome || "Filial"}`
      : `${orgName || "Rede"} • ${user?.loja?.nome || user?.lojaNome || "Minha Loja"}`;

  return (
    <div className="w-full pb-6 space-y-4 sm:space-y-5 max-w-[1440px] mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-2 pb-3 border-b border-[var(--color-border)]">
        <div className="min-w-0">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            {scopeSubtitle}
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Visão Geral
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {user?.role === "ADMIN"
              ? "Monitoramento da Organização com seleção global de filiais e exportação de relatórios."
              : user?.role === "GERENTE"
                ? "Acompanhamento completo da sua filial, equipe de vendedores e faturamento."
                : "Resumo de catálogo e acompanhamento exclusivo das suas movimentações."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {canViewUserStats && (
            <Link
              to="/dashboard/desempenho"
              className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 text-accent-pink" />
              Desempenho Vendedores
            </Link>
          )}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar relatório (PDF)
          </button>
        </div>
      </header>

      <KPISection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <section className="lg:col-span-2">
          <StockFlowChart />
        </section>

        <aside className="flex flex-col gap-4 sm:gap-5">
          <LowStockAlert />
          <RecentMovements />
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {canViewUserStats && (
          <>
            <UserStatsCharts type="count" />
            <UserStatsCharts type="value" />
          </>
        )}

        <div className="lg:col-span-2">
          <MontanteGrafic />
        </div>
      </div>

      <ModalExportarRelatorio
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
