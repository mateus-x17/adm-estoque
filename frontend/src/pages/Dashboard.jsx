import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const urlProdutos = "http://localhost:5000/products/count";
  const urlFornecedores = "http://localhost:5000/suppliers/count";
  const urlMovements = "http://localhost:5000/movements";

  const [totalProdutos, setTotalProdutos] = useState(null);
  const [totalFornecedores, setTotalFornecedores] = useState(null);
  const [movementsData, setMovementsData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const { token } = useUserStore();

  // -----------------------
  // Buscar KPIs e Movimentações
  // -----------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // KPIs
        const resProdutos = await fetch(urlProdutos, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const produtosData = await resProdutos.json();
        setTotalProdutos(produtosData.count);

        const resFornec = await fetch(urlFornecedores, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const fornecedoresData = await resFornec.json();
        setTotalFornecedores(fornecedoresData.count);

        // Movimentações
        const resMov = await fetch(urlMovements, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const movements = await resMov.json();
        setMovementsData(movements);

        // Preparar dados para gráfico de barras
        const products = [...new Set(movements.map((m) => m.produto.nome))];
        const formattedData = products.map((produto) => {
          const entradas = movements
            .filter((m) => m.produto.nome === produto && m.tipo === "ENTRADA")
            .reduce((acc, cur) => acc + cur.quantidade, 0);
          const saidas = movements
            .filter((m) => m.produto.nome === produto && m.tipo === "SAIDA")
            .reduce((acc, cur) => acc + cur.quantidade, 0);
          return { produto, Entradas: entradas, Saidas: saidas };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Erro ao obter dados:", error);
      }
    };

    fetchData();
  }, []);

  // -----------------------
  // KPIs
  // -----------------------
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
    { title: "Categorias", value: 5, color: "from-purple-600 to-pink-500" },
  ];

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
            className={`relative rounded-2xl shadow-lg p-6 text-white font-semibold transform transition-all duration-300 animate-fadeIn bg-gradient-to-r ${kpi.color} hover:-translate-y-2`}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            <h3 className="text-lg mb-2 drop-shadow">{kpi.title}</h3>
            <p className="text-4xl font-bold drop-shadow-lg">
              {kpi.value !== null ? kpi.value : "..."}
            </p>
          </div>
        ))}
      </section>

      {/* Gráfico de Barras */}
      <section className="mt-16 max-w-6xl mx-auto animate-fadeInUp">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Entradas e Saídas por Produto
        </h2>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 h-96">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="produto" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Entradas" fill="rgba(75, 192, 192, 0.7)" />
                <Bar dataKey="Saidas" fill="rgba(255, 99, 132, 0.7)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-center mt-20">
              Carregando gráfico de barras...
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
