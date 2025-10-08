import React from "react";

const kpis = [
  { title: "Produtos em estoque", value: 120, color: "from-indigo-500 to-blue-500" },
  { title: "Pedidos pendentes", value: 15, color: "from-amber-500 to-yellow-400" },
  { title: "Fornecedores ativos", value: 8, color: "from-green-500 to-emerald-600" },
  { title: "Categorias", value: 5, color: "from-purple-600 to-pink-500" },
];

const Dashboard = () => {
  return (
    <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-500 p-8">
      {/* Cabeçalho do Dashboard */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fadeInDown">
          Visão Geral
        </h1>
        <p className="text-gray-600 dark:text-gray-400 animate-fadeInUp">
          Acompanhe os principais indicadores do seu estoque e operações.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`
              relative rounded-2xl shadow-lg p-6
              text-white font-semibold transform 
              transition-all duration-300 animate-fadeIn
              bg-gradient-to-r ${kpi.color}
              hover:-translate-y-2
              hover:shadowLight-lg dark:hover:shadowDark-lg
            `}
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
          >
            {/* Conteúdo interno */}
            <h3 className="text-lg mb-2 drop-shadow">{kpi.title}</h3>
            <p className="text-4xl font-bold drop-shadow-lg">{kpi.value}</p>
          </div>
        ))}
      </section>

      {/* Área de gráficos */}
      <section className="mt-16 max-w-6xl mx-auto animate-fadeInUp">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Relatórios e Gráficos
        </h2>
        <div
          className="
            relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-72 flex items-center justify-center 
            transition-all duration-300 hover:shadow-2xl hover:-translate-y-2
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-green-500/10 rounded-2xl" />
          <p className="relative text-gray-600 dark:text-gray-300">
            Aqui será exibido o gráfico (Chart.js)
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
