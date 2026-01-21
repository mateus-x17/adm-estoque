import { useEffect, useState } from "react";
import {
  AlertCircle,
  Package,
  Truck,
  ListTree,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";
import { useUserStore } from "../store/userStore";

const Dashboard = () => {
  const urlProdutosStats = "http://localhost:5000/products/stats";
  const urlFornecedores = "http://localhost:5000/suppliers/count";
  const urlCategories = "http://localhost:5000/categories/count";
  const urlUserStats = "http://localhost:5000/movements/user-stats";
  const urlMovements = "http://localhost:5000/movements";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProdutos: 0,
    lowStock: 0,
    totalValue: 0,
    lowStockList: [],
  });
  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [movementsData, setMovementsData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [saidaMontanteData, setSaidaMontanteData] = useState([]);

  const { token } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resStats = await fetch(urlProdutosStats, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await resStats.json();
        setStats({
          totalProdutos: statsData.total,
          lowStock: statsData.lowStock,
          totalValue: statsData.totalValue,
          lowStockList: statsData.lowStockList,
        });

        const resFornec = await fetch(urlFornecedores, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fornecedoresData = await resFornec.json();
        setTotalFornecedores(fornecedoresData.count);

        const resCats = await fetch(urlCategories, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const catsData = await resCats.json();
        setTotalCategorias(catsData.count);

        const resMov = await fetch(urlMovements, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const movements = await resMov.json();
        setMovementsData(movements);
        // saidas das movimentações
        const saidas = movements.filter((m) => m.tipo === "SAIDA");
        const saidasPorData = saidas.reduce((acc, mov) => {
          const data = new Date(mov.data).toLocaleDateString("pt-BR");
          if (!acc[data]) {
            acc[data] = {
              data,
              montante: 0,
            };
          }
          acc[data].montante += mov.quantidade * Number(mov.produto.preco);
          return acc;
        }, {});

        const sortedData = Object.values(saidasPorData).sort((a, b) => {
          const [da, ma, ya] = a.data.split("/");
          const [db, mb, yb] = b.data.split("/");
          return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });

        setSaidaMontanteData(sortedData);

        const resUserStats = await fetch(urlUserStats, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await resUserStats.json();
        setUserStats(userData);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const kpis = [
    {
      title: "Produtos em Estoque",
      value: stats.totalProdutos,
      icon: Package,
      color: "from-blue-500 to-indigo-600",
      trend: "Total itens",
    },
    {
      title: "Baixo Estoque",
      value: stats.lowStock,
      icon: AlertCircle,
      color: "from-amber-400 to-orange-500",
      trend: "Requer atenção",
    },
    {
      title: "Fornecedores Ativos",
      value: totalFornecedores,
      icon: Truck,
      color: "from-emerald-500 to-teal-600",
      trend: "Parceiros",
    },
    {
      title: "Categorias",
      value: totalCategorias,
      icon: ListTree,
      color: "from-fuchsia-500 to-pink-600",
      trend: "Segmentos",
    },
  ];

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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {kpi.title}
                </h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? "..." : (kpi.value ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-500 uppercase">
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Fluxo de Mercadorias
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Volume de entradas e saídas por produto
                </p>
              </div>
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-[380px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="produto" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Entradas" fill="#6366f1" />
                    <Bar dataKey="Saidas" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          {/* Alerta de Baixo Estoque */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Alerta de Baixo Estoque
            </h2>
            <div className="space-y-4">
              {stats.lowStockList && stats.lowStockList.length > 0 ? (
                stats.lowStockList.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                        {prod.quantidade}
                      </div>
                      <span
                        className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
                        title={prod.nome}
                      >
                        {prod.nome}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum produto com baixo estoque.
                </p>
              )}
            </div>
          </div>

          {/* Movimentações Recentes */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              Movimentações Recentes
            </h2>
            <div className="space-y-4">
              {movementsData.slice(0, 5).map((mov) => (
                <div key={mov.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                    {mov.tipo === "ENTRADA" ? (
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {mov.produto.nome}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {mov.tipo} • {mov.quantidade}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(mov.data).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* User Stats Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm h-[400px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Movimentações por Usuário
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Movimentações"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm h-[400px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Valor Movimentado por Usuário (Saídas)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                />
                <Bar
                  dataKey="totalValue"
                  fill="#ec4899"
                  radius={[4, 4, 0, 0]}
                  name="Valor Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Montante de Saídas ao Longo do Tempo */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm h-[400px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Montante de Saídas ao Longo do Tempo
          </h2>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={saidaMontanteData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="montante"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Montante (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
