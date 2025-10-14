import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";

const Dashboard = () => {
  const urlProdutos = "http://localhost:5000/products/count";
  const urlFornecedores = "http://localhost:5000/suppliers/count";
  const [totalProdutos, setTotalProdutos] = useState(null);
  const [totalFornecedores, setTotalFornecedores] = useState(null);
  const { token } = useUserStore();

  // Buscar os dados da API ao montar o componente
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const resProdutos = await fetch(urlProdutos, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const produtosData = await resProdutos.json();
        setTotalProdutos(produtosData.count);
        console.log(produtosData.count);

        const resFornec = await fetch(urlFornecedores, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const fornecedoresData = await resFornec.json();
        setTotalFornecedores(fornecedoresData.count);
        console.log(fornecedoresData.count);
      } catch (error) {
        console.error("Erro ao obter dados:", error);
      }
    };

    fetchKPIs();
  }, []);

  const kpis = [
    {
      title: "Produtos em estoque",
      value: totalProdutos,
      color: "from-indigo-500 to-blue-500",
    },
    {
      title: "Pedidos pendentes",
      value: 15,
      color: "from-amber-500 to-yellow-400",
    },
    {
      title: "Fornecedores ativos",
      value: totalFornecedores,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Categorias",
      value: 5,
      color: "from-purple-600 to-pink-500",
    },
  ];

  // dados para grafico com chartjs
  const data = {
    labels: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"],
    datasets: [
      {
        label: "Vendas",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-500 p-8">
      {/* Cabeçalho */}
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
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            <h3 className="text-lg mb-2 drop-shadow">{kpi.title}</h3>

            {/* Exibe “-” enquanto o valor é carregado */}
            <p className="text-4xl font-bold drop-shadow-lg">
              {kpi.value !== null ? kpi.value : "..."}
            </p>
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
          {/* Gráfico */}
          
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
