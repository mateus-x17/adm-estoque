import React, { useEffect, useState } from "react";
import MovimentacaoRow from "../components/tables/MovimentacaoRow.jsx";
import ModalMovimentacao from "../components/forms/ModalMovimentacao.jsx";
import { FiFilter } from "react-icons/fi";
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
import { movementsApi, usersApi } from "../services/api/index.js";

const Movimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // filtros
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  // paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(8);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalMovimentos, setTotalMovimentos] = useState(0);

  // modal
  const [modalAberto, setModalAberto] = useState(false);
  const [movSelecionada, setMovSelecionada] = useState(null);

  // gráficos
  const [lineChartData, setLineChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  const pieColors = ["#22c55e", "#ef4444"];

  const abrirModal = (mov) => {
    setMovSelecionada(mov);
    setModalAberto(true);
  };

  // carregar lista de usuários para filtro
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await usersApi.getUsers({
          page: 1,
          limit: 100,
          search: "",
          role: "todos",
        });
        setUsuarios(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar usuários para filtro de movimentações:", error);
      }
    };

    carregarUsuarios();
  }, []);

  // carregar movimentações: 3 requests em paralelo para tabela, pie e line chart
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        // 1) Tabela – paginada com todos os filtros ativos
        const paramsTable = {
          page: paginaAtual,
          limit: itensPorPagina,
          order: "desc",
          search: search || undefined,
          tipo: tipoFiltro || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          usuarioId: userFilter || undefined,
        };

        // 2) PieChart (Resumo Geral) – todos os filtros, sem paginação
        const paramsPie = {
          limit: "all",
          order: "desc",
          search: search || undefined,
          tipo: tipoFiltro || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          usuarioId: userFilter || undefined,
        };

        // 3) LineChart (Entradas x Saídas) – apenas filtro de período
        const paramsLine = {
          limit: "all",
          order: "asc",
          from: fromDate || undefined,
          to: toDate || undefined,
        };

        const [tableResult, pieResult, lineResult] = await Promise.all([
          movementsApi.getMovements(paramsTable),
          movementsApi.getMovements(paramsPie),
          movementsApi.getMovements(paramsLine),
        ]);

        // --- tabela ---
        const tableData = tableResult.data || [];
        const pagination = tableResult.pagination || {
          page: paginaAtual,
          limit: itensPorPagina,
          total: tableData.length,
          pages: 1,
        };
        setMovimentacoes(tableData);
        setLoaded(true);
        setTotalPaginas(pagination.pages || 1);
        setTotalMovimentos(pagination.total || tableData.length);

        // --- PieChart: soma de quantidades por tipo com base em todos os filtros ---
        const pieData = pieResult.data || [];
        let pieEntradas = 0;
        let pieSaidas = 0;
        pieData.forEach((m) => {
          if (m.tipo === "ENTRADA") pieEntradas += m.quantidade;
          else pieSaidas += m.quantidade;
        });
        setPieChartData([
          { name: "Entradas", value: pieEntradas },
          { name: "Saídas", value: pieSaidas },
        ]);

        // --- LineChart: entradas x saídas agrupadas por dia (apenas filtro de período) ---
        const lineData = lineResult.data || [];
        const grouped = {};
        lineData.forEach((m) => {
          const dateObj = new Date(m.data);
          const dateKey = dateObj.toISOString().split("T")[0];
          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              date: dateKey,
              label: dateObj.toLocaleDateString("pt-BR"),
              Entradas: 0,
              Saidas: 0,
            };
          }
          if (m.tipo === "ENTRADA") grouped[dateKey].Entradas += m.quantidade;
          else grouped[dateKey].Saidas += m.quantidade;
        });
        const sortedLineData = Object.values(grouped).sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        setLineChartData(sortedLineData);
      } catch (error) {
        console.error("Error fetching movements:", error);
      }
    };

    fetchMovements();
  }, [paginaAtual, itensPorPagina, search, tipoFiltro, fromDate, toDate, userFilter]);

  // volta para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [search, tipoFiltro, fromDate, toDate, userFilter]);

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* header */}
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Movimentações
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Controle de entradas e saídas de produtos
        </p>
      </header>

      {/* filtros colapsáveis */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl">
        <button
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          className="w-full px-6 py-4 flex items-center justify-between font-semibold"
        >
          <span className="text-sm text-slate-900 dark:text-white">
            {" "}
            Filtros
          </span>
          <span className="text-sm text-slate-500">
            {filtrosAbertos ? "Ocultar" : "Mostrar"}
          </span>
        </button>

        {filtrosAbertos && (
          <div className="p-6 pt-0 flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-white dark:bg-slate-800">Todos</option>
              <option value="ENTRADA" className="bg-white dark:bg-slate-800">Entrada</option>
              <option value="SAIDA" className="bg-white dark:bg-slate-800">Saída</option>
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full lg:w-56 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-white dark:bg-slate-800">
                Todos os usuários
              </option>
              {usuarios.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                  className="bg-white dark:bg-slate-800"
                >
                  {u.nome}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white"
            />
          </div>
        )}
      </section>

      {/* tabela */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-700/50 rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Histórico de Movimentações
          </h2>
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-semibold">
            Total: {totalMovimentos}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="hidden md:table-cell px-4 py-3 text-center">
                Tipo
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-center">
                Qtd
              </th>
              <th className="hidden md:table-cell px-4 py-3">Usuário</th>
              <th className="hidden md:table-cell px-4 py-3">Data</th>
              <th className="md:hidden px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loaded &&
              movimentacoes.map((mov, i) => (
                <MovimentacaoRow
                  key={mov.id}
                  movimentacao={mov}
                  index={i}
                  abrirModal={abrirModal}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {paginaAtual} de {totalPaginas}
          </span>

          <button
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
          >
            Próximo
          </button>
        </div>
      )}

      {/* gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-700/50 rounded-3xl p-6">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">
            Entradas x Saídas
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineChartData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="Entradas" stroke="#22c55e" />
              <Line dataKey="Saidas" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-700/50 rounded-3xl p-6">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">
            Resumo geral
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${(percent * 100).toFixed(0)}%`
                }
              >
                {pieChartData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                formatter={(value, name) => [
                  `${value} unid.`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <ModalMovimentacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        movimentacao={movSelecionada}
      />
    </div>
  );
};

export default Movimentacoes;
