import React, { useEffect, useState } from "react";
import MovimentacaoRow from "../components/tables/MovimentacaoRow.jsx";
import ModalMovimentacao from "../components/forms/ModalMovimentacao.jsx";
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

const pieColors = ["var(--ink)", "var(--accent)"];

const Movimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(8);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalMovimentos, setTotalMovimentos] = useState(0);

  const [modalAberto, setModalAberto] = useState(false);
  const [movSelecionada, setMovSelecionada] = useState(null);

  const [lineChartData, setLineChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  const abrirModal = (mov) => {
    setMovSelecionada(mov);
    setModalAberto(true);
  };

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await usersApi.getUsers({ page: 1, limit: 100, search: "", role: "todos" });
        setUsuarios(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar usuários para filtro de movimentações:", error);
      }
    };
    carregarUsuarios();
  }, []);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
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

        const paramsPie = {
          limit: "all",
          order: "desc",
          search: search || undefined,
          tipo: tipoFiltro || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          usuarioId: userFilter || undefined,
        };

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
        const sortedLineData = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
        setLineChartData(sortedLineData);
      } catch (error) {
        console.error("Error fetching movements:", error);
      }
    };

    fetchMovements();
  }, [paginaAtual, itensPorPagina, search, tipoFiltro, fromDate, toDate, userFilter]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, tipoFiltro, fromDate, toDate, userFilter]);

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header>
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Estoque
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">Movimentações</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Controle de entradas e saídas de produtos.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
          >
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtrosAbertos && (
          <section className="glass-panel rounded-lg p-5 flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            />

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full lg:w-40 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            >
              <option value="" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Todos</option>
              <option value="ENTRADA" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Entrada</option>
              <option value="SAIDA" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Saída</option>
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full lg:w-52 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            >
              <option value="" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Todos os usuários</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id} className="bg-[var(--bg-elevated)] text-[var(--ink)]">
                  {u.nome}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full lg:w-44 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full lg:w-44 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            />
          </section>
        )}
      </div>

      <div className="glass-panel rounded-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[var(--line)] flex justify-between items-center">
          <h2 className="font-display text-base font-semibold text-[var(--ink)]">
            Histórico de movimentações
          </h2>
          <span className="font-mono text-[11px] uppercase text-[var(--ink-soft)] border border-[var(--line)] rounded-md px-2.5 py-1">
            Total: {totalMovimentos}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Produto
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Tipo
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Qtd
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Usuário
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Data
              </th>
              <th className="md:hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {loaded &&
              movimentacoes.map((mov, i) => (
                <MovimentacaoRow key={mov.id} movimentacao={mov} index={i} abrirModal={abrirModal} />
              ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((p) => p - 1)}
            className="px-4 py-2 rounded-md border border-[var(--line)] text-sm text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200 disabled:opacity-40 disabled:hover:border-[var(--line)]"
          >
            Anterior
          </button>

          <span className="font-mono text-xs text-[var(--ink-soft)]">
            Página {paginaAtual} de {totalPaginas}
          </span>

          <button
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((p) => p + 1)}
            className="px-4 py-2 rounded-md border border-[var(--line)] text-sm text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200 disabled:opacity-40 disabled:hover:border-[var(--line)]"
          >
            Próximo
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-lg p-6">
          <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-4">
            Entradas x saídas
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineChartData}>
              <XAxis dataKey="label" tick={{ fill: "var(--ink-soft)", fontSize: 11 }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
              <Line dataKey="Entradas" stroke="var(--ink)" strokeWidth={2} dot={false} />
              <Line dataKey="Saidas" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-4">
            Resumo geral
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
              <Tooltip
                formatter={(value, name) => [`${value} unid.`, name]}
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
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