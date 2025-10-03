import React from "react";

const kpis = [
  { title: "Produtos em estoque", value: 120 },
  { title: "Pedidos pendentes", value: 15 },
  { title: "Fornecedores ativos", value: 8 },
  { title: "Categorias", value: 5 },
];

const Dashboard = () => {
  return (
    <div className="w-full h-full p-6 bg-gray-200 dark:bg-gray-700">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-gradient-light dark:bg-gradient-dark shadow rounded-lg p-6 flex flex-col justify-center items-start transition-transform transform hover:scale-105"
          >
            <p className="text-gray-500 dark:text-gray-300">{kpi.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* Espaço reservado para gráficos */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Gráficos</h2>
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-400 dark:text-gray-300">Aqui será o gráfico (Chart.js)</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
