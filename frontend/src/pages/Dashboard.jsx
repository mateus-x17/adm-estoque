
import { Clock } from "lucide-react";
import KPISection from "../components/KPISection";
import StockFlowChart from "../components/StockFlowChart";
import LowStockAlert from "../components/LowStockAlert";
import RecentMovements from "../components/RecentMovements";
import UserStatsCharts from "../components/UserStatsCharts";
import MontanteGrafic from "../components/MontanteGrafic";

const Dashboard = () => {

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-slate-500 dark:text-slate-400 capitalize">
                {entry.name}:
              </span>
              <span className="font-semibold dark:text-slate-200">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen pt-4 pb-12 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Visão Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitoramento em tempo real do seu ecossistema de estoque.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hoje
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all">
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* KPIs */}
      <KPISection />

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fluxo de Mercadorias */}
        <section className="lg:col-span-2">
          <StockFlowChart />
        </section>

        <aside className="flex flex-col gap-6">
          {/* Alerta de Baixo Estoque */}
          <LowStockAlert />
          {/* Movimentações Recentes */}
          <RecentMovements />
        </aside>

      </div>

      {/* User Stats Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
