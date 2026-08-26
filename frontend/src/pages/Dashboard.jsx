import { Clock, Download } from "lucide-react";
import KPISection from "../components/dashboard/KPISection.jsx";
import StockFlowChart from "../components/dashboard/StockFlowChart.jsx";
import LowStockAlert from "../components/dashboard/LowStockAlert.jsx";
import RecentMovements from "../components/dashboard/RecentMovements.jsx";
import UserStatsCharts from "../components/dashboard/UserStatsCharts.jsx";
import MontanteGrafic from "../components/dashboard/MontanteGrafic.jsx";
import { useUserStore } from "../store/userStore.js";

const Dashboard = () => {
  const user = useUserStore((state) => state.user);
  const canViewUserStats = user?.role === "ADMIN" || user?.role === "GERENTE";

  return (
    <div className="w-full min-h-screen pt-2 pb-8 space-y-6 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-3 border-b border-[var(--color-border)] mb-6">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Painel
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Visão Geral
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Monitoramento com precisão do seu estoque.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary px-3 py-2 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Hoje
          </button>
          <button className="btn-primary px-3 py-2 text-xs font-semibold flex items-center gap-2">
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
    </div>
  );
};

export default Dashboard;