import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  ListTree,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useUserStore } from "../store/userStore";

const Dashboard = () => {
  const urlProdutos = "http://localhost:5000/products/count";
  const urlFornecedores = "http://localhost:5000/suppliers/count";
  const urlMovements = "http://localhost:5000/movements";

  const [loading, setLoading] = useState(true);
  const [totalProdutos, setTotalProdutos] = useState(null);
  const [totalFornecedores, setTotalFornecedores] = useState(null);
  const [movementsData, setMovementsData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const { token } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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

        const resMov = await fetch(urlMovements, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const movements = await resMov.json();
        setMovementsData(movements);

        const products = [...new Set(movements.map(m => m.produto.nome))];

        const formattedData = products.map(produto => {
          const entradas = movements
            .filter(m => m.produto.nome === produto && m.tipo === "ENTRADA")
            .reduce((acc, cur) => acc + cur.quantidade, 0);

          const saidas = movements
            .filter(m => m.produto.nome === produto && m.tipo === "SAIDA")
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
      value: totalProdutos,
      icon: Package,
      color: "from-blue-500 to-indigo-600",
      trend: "+12.5% vs mês anterior"
    },
    {
      title: "Pedidos Pendentes",
      value: 15,
      icon: Clock,
      color: "from-amber-400 to-orange-500",
      trend: "Estável"
    },
    {
      title: "Fornecedores Ativos",
      value: totalFornecedores,
      icon: Truck,
      color: "from-emerald-500 to-teal-600",
      trend: "+2 novos este mês"
    },
    {
      title: "Categorias",
      value: 5,
      icon: ListTree,
      color: "from-fuchsia-500 to-pink-600",
      trend: "Mapeadas"
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
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
                  {loading ? "..." : kpi.value ?? 0}
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

        <aside className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Movimentações Recentes
          </h2>
          <div className="space-y-4">
            {movementsData.slice(0, 5).map(mov => (
              <div key={mov.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                  <ArrowUpRight className="w-5 h-5" />
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
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
