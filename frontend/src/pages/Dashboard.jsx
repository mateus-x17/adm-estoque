import { Clock, Download } from "lucide-react";
import KPISection from "../components/dashboard/KPISection.jsx";
import StockFlowChart from "../components/dashboard/StockFlowChart.jsx";
import LowStockAlert from "../components/dashboard/LowStockAlert.jsx";
import RecentMovements from "../components/dashboard/RecentMovements.jsx";
import UserStatsCharts from "../components/dashboard/UserStatsCharts.jsx";
import MontanteGrafic from "../components/dashboard/MontanteGrafic.jsx";

const Dashboard = () => {
  return (
    <div className="w-full min-h-screen pt-4 pb-12 px-4 md:px-8 space-y-8 max-w-7xl mx-auto bg-[var(--bg)] transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b border-[var(--line)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
            Painel
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)] tracking-tight mt-1">
            Visão Geral
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Monitoramento em tempo real do seu estoque.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--line)] rounded-md text-sm font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hoje
          </button>
          <button className="px-4 py-2 bg-[var(--ink)] text-[var(--bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity duration-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
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
        <UserStatsCharts type="count" />
        <UserStatsCharts type="value" />

        <div className="lg:col-span-2">
          <MontanteGrafic />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;