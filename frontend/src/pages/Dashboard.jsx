import { useState } from "react";
import { Clock, Download } from "lucide-react";
import KPISection from "../components/dashboard/KPISection.jsx";
import StockFlowChart from "../components/dashboard/StockFlowChart.jsx";
import LowStockAlert from "../components/dashboard/LowStockAlert.jsx";
import RecentMovements from "../components/dashboard/RecentMovements.jsx";
import UserStatsCharts from "../components/dashboard/UserStatsCharts.jsx";
import MontanteGrafic from "../components/dashboard/MontanteGrafic.jsx";
import ModalExportarRelatorio from "../components/dashboard/ModalExportarRelatorio.jsx";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável por renderizar a página principal do Dashboard executivo (Visão Geral)
// 1 - Importa métricas em tempo real, gráficos de fluxo de estoque e alertas de estoque baixo
// 2 - Gerencia o estado de abertura do modal de exportação de relatórios em PDF
// 3 - Aplica controle de acesso para métricas restritas a Administradores e Gerentes
const Dashboard = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const canViewUserStats = user?.role === "ADMIN" || user?.role === "GERENTE";
  const storeName = user?.empresa?.nome || user?.empresaNome;

  return (
    <div className="w-full min-h-screen pt-2 pb-8 space-y-6 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-3 border-b border-[var(--color-border)] mb-6">
        <div className="min-w-0">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Painel {storeName ? `• ${storeName}` : ""}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Visão Geral
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {canViewUserStats
              ? "Monitoramento consolidado com precisão do seu estoque."
              : "Resumo de catálogo e acompanhamento das suas movimentações."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button className="btn-secondary px-3 py-2 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Clock className="w-3 h-3" />
            Hoje
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn-primary px-3 py-2 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Download className="w-3 h-3" />
            Exportar relatório
          </button>
        </div>
      </header>

      <KPISection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <StockFlowChart />
        </section>

        <aside className="flex flex-col gap-6">
          <LowStockAlert />
          <RecentMovements />
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canViewUserStats && (
          <>
            <UserStatsCharts type="count" />
            <UserStatsCharts type="value" />
          </>
        )}

        <div className={canViewUserStats ? "lg:col-span-2" : "col-span-1 lg:col-span-2"}>
          <MontanteGrafic />
        </div>
      </div>

      {/* Modal interativo para visualização e exportação de relatório de vendas em PDF */}
      <ModalExportarRelatorio
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;