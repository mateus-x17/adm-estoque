import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Movimentacoes = () => {
  const url = "http://localhost:5000/movements";
  const { token } = useUserStore();

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortDate, setSortDate] = useState("desc");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Dados dos gráficos
  const [movementsData, setMovementsData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const pieColors = ["#4BC0C0", "#FF6384"];

  // -----------------------
  // Fetch movimentações
  // -----------------------
  const carregarMovimentacoes = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      params.append("order", sortDate);

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMovimentacoes(data);
        setTimeout(() => setLoaded(true), 50);
      } else {
        console.error("Erro ao carregar movimentações:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
  }, [sortDate, fromDate, toDate]);

  // -----------------------
  // Processar dados para gráfico de linhas e pizza
  // -----------------------
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const res = await fetch(url, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setMovementsData(data);

        // Gráfico de linhas
        const groupedByDate = {};
        let totalEntradas = 0;
        let totalSaidas = 0;

        data.forEach((m) => {
          const date = new Date(m.data).toLocaleDateString("pt-BR");
          if (!groupedByDate[date])
            groupedByDate[date] = { date, Entradas: 0, Saidas: 0 };
          if (m.tipo === "ENTRADA") {
            groupedByDate[date].Entradas += m.quantidade;
            totalEntradas += m.quantidade;
          }
          if (m.tipo === "SAIDA") {
            groupedByDate[date].Saidas += m.quantidade;
            totalSaidas += m.quantidade;
          }
        });

        const formattedLineData = Object.values(groupedByDate).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setLineChartData(formattedLineData);

        // Gráfico de pizza
        setPieChartData([
          { name: "Entradas", value: totalEntradas },
          { name: "Saídas", value: totalSaidas },
        ]);
      } catch (err) {
        console.error("Erro ao buscar movimentos:", err);
      }
    };

    fetchMovements();
  }, []);

  // -----------------------
  // Filtrar e paginar
  // -----------------------
  const movimentacoesFiltradas = movimentacoes
    .filter((m) => m.produto.nome.toLowerCase().includes(search.toLowerCase()))
    .filter((m) => (tipoFiltro ? m.tipo === tipoFiltro : true))
    .sort((a, b) => {
      if (sortDate === "asc") return new Date(a.data) - new Date(b.data);
      return new Date(b.data) - new Date(a.data);
    });

  const totalPaginas = Math.ceil(
    movimentacoesFiltradas.length / itensPorPagina
  );
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div className="flex flex-col w-full min-h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-500 p-8">
      {/* Cabeçalho */}
      <header className="mb-6 text-center animate-fadeInDown">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
          Movimentações de <span className="text-yellow-400">Produtos</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Veja todas as entradas, saídas e ajustes de estoque.
        </p>
      </header>

      {/* Filtros */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 mt-6 bg-gray-200 dark:bg-gray-800 p-4 rounded-lg transition-colors duration-500">
        <input
          type="text"
          placeholder="Pesquisar produto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[30%] px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
        />
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="w-full sm:w-[20%] px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
        >
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">ENTRADA</option>
          <option value="SAIDA">SAIDA</option>
        </select>
        <div className="flex gap-2 w-full sm:w-[30%]">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-1/2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-1/2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
          />
        </div>
        <select
          value={sortDate}
          onChange={(e) => setSortDate(e.target.value)}
          className="w-full sm:w-[15%] px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
        >
          <option value="desc">Mais recentes → antigos</option>
          <option value="asc">Mais antigos → recentes</option>
        </select>
      </div>

      {/* Tabela */}
      {loaded ? (
        <div className="overflow-x-auto bg-gray-300 dark:bg-gray-800 p-4 rounded-xl shadow-inner mt-6">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full min-w-[800px] bg-white dark:bg-gray-600 rounded-xl shadow-md">
              <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Quantidade</th>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Observação</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesPaginadas.map((mov) => (
                  <tr
                    key={mov.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-2">{mov.produto.nome}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                          mov.tipo === "ENTRADA"
                            ? "bg-green-500"
                            : mov.tipo === "SAIDA"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      >
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{mov.quantidade}</td>
                    <td className="px-4 py-2">{mov.usuario.nome}</td>
                    <td className="px-4 py-2">
                      {new Date(mov.data).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{mov.observacao || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              {"<"}
            </button>
            <span className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
              {paginaAtual} / {totalPaginas}
            </span>
            <button
              onClick={() =>
                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              {">"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-6">
          <div className="w-16 h-16 border-4 border-t-4 border-blue-500 dark:border-yellow-400 rounded-full animate-spin"></div>
          <p className="text-gray-700 dark:text-gray-200 font-medium animate-pulse">
            Carregando movimentações...
          </p>
        </div>
      )}

      {/* Gráfico */}
      <div className="mt-6">
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Entradas e Saídas por Dia
          </h2>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Gráfico de Linhas */}
            {lineChartData.length > 0 && (
              <div className="w-full lg:w-3/5 h-72 lg:h-80 p-2 bg-white dark:bg-gray-700 rounded-xl shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <XAxis dataKey="date" stroke="#8884d8" />
                    <YAxis stroke="#8884d8" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Entradas"
                      stroke="rgba(75,192,192,0.7)"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="Saidas"
                      stroke="rgba(255,99,132,0.7)"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Pizza */}
            {pieChartData.length > 0 && (
              <div className="w-full lg:w-2/5 h-72 lg:h-80 p-2 bg-white dark:bg-gray-700 rounded-xl shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData.map((item) => ({
                        ...item,
                        name: `${item.name} (${(
                          (item.value /
                            pieChartData.reduce((a, b) => a + b.value, 0)) *
                          100
                        ).toFixed(1)}%)`,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Quantidade"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movimentacoes;
