import React, { useEffect, useState } from "react";
import MovimentacaoRow from "../components/tables/MovimentacaoRow.jsx";
import ModalMovimentacao from "../components/forms/ModalMovimentacao.jsx";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
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
import { useUserStore } from "../store/userStore.js";

const PIE_COLORS = ["var(--teal)", "var(--danger)"];

const ChartTooltip = ({ active, payload, label, isPie }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 140,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {label && <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4, fontFamily: "monospace" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <span style={{ fontSize: 12, color: p.color || "var(--ink)", fontWeight: 600 }}>
            {p.name}: {p.value} unid.
          </span>
          {isPie && p.payload?.montante !== undefined && (
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
              Montante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.payload.montante)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};


const Movimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const currentUser = useUserStore((state) => state.user);
  const canFilterByUser = currentUser?.role === "ADMIN" || currentUser?.role === "GERENTE";

  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [order, setOrder] = useState("desc"); // ordem da tabela, independente do gráfico de linha

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

  const toggleOrder = () => {
    setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setPaginaAtual(1);
  };

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        // /users/names retorna [{id, nome}] e é acessível por ADMIN e GERENTE
        const data = await usersApi.getUserNames();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar usuários para filtro:", error);
      }
    };
    carregarUsuarios();
  }, []);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoaded(false);
      try {
        const paramsTable = {
          page: paginaAtual,
          limit: itensPorPagina,
          order, // ← agora controlado pelo toggle
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

        // O gráfico de linha precisa de ordem cronológica crescente para
        // desenhar a série corretamente — não deve seguir o toggle da tabela.
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
        setTotalPaginas(pagination.pages || 1);
        setTotalMovimentos(pagination.total || tableData.length);

        const pieData = pieResult.data || [];
        let pieEntradas = 0, pieSaidas = 0;
        let montanteEntradas = 0, montanteSaidas = 0;
        pieData.forEach((m) => {
          const valor = m.quantidade * Number(m.produto?.preco || 0);
          if (m.tipo === "ENTRADA") {
            pieEntradas += m.quantidade;
            montanteEntradas += valor;
          } else {
            pieSaidas += m.quantidade;
            montanteSaidas += valor;
          }
        });
        setPieChartData([
          { name: "Entradas", value: pieEntradas, montante: montanteEntradas },
          { name: "Saídas", value: pieSaidas, montante: montanteSaidas },
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
        const sortedLineData = Object.values(grouped).sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        setLineChartData(sortedLineData);
      } catch (error) {
        console.error("Error fetching movements:", error);
      } finally {
        setLoaded(true);
      }
    };

    fetchMovements();
  }, [
    paginaAtual,
    itensPorPagina,
    search,
    tipoFiltro,
    fromDate,
    toDate,
    userFilter,
    order,
  ]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, tipoFiltro, fromDate, toDate, userFilter]);

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header>
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Estoque
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">
          Movimentações
        </h1>
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
              <option
                value=""
                className="bg-[var(--bg-elevated)] text-[var(--ink)]"
              >
                Todos
              </option>
              <option
                value="ENTRADA"
                className="bg-[var(--bg-elevated)] text-[var(--ink)]"
              >
                Entrada
              </option>
              <option
                value="SAIDA"
                className="bg-[var(--bg-elevated)] text-[var(--ink)]"
              >
                Saída
              </option>
            </select>

            {canFilterByUser ? (
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full lg:w-52 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
              >
                <option value="" className="bg-[var(--bg-elevated)] text-[var(--ink)]">
                  Todos os usuários
                </option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[var(--bg-elevated)] text-[var(--ink)]">
                    {u.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full lg:w-52 px-4 py-2.5 rounded-md border border-[var(--line)] bg-[var(--line)]/20 text-sm text-[var(--ink-soft)] flex items-center gap-2 cursor-not-allowed select-none" title="Apenas Gerentes e Administradores podem filtrar por usuário">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Filtro por usuário restrito
              </div>
            )}

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

            <button
              onClick={toggleOrder}
              className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase text-[var(--ink-soft)] border border-[var(--line)] rounded-md px-4 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200 lg:w-40 shrink-0"
              title={
                order === "desc"
                  ? "Mostrando mais recentes primeiro"
                  : "Mostrando mais antigos primeiro"
              }
            >
              {order === "desc" ? (
                <FiArrowDown size={13} />
              ) : (
                <FiArrowUp size={13} />
              )}
              {order === "desc" ? "Recentes" : "Antigos"}
            </button>
          </section>
        )}
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--ink-soft)]">
            Carregando movimentações...
          </span>
        </div>
      ) : (
        <>
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
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-sm text-[var(--ink-soft)]"
                    >
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov, i) => (
                    <MovimentacaoRow
                      key={mov.id}
                      movimentacao={mov}
                      index={i}
                      abrirModal={abrirModal}
                    />
                  ))
                )}
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
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--line)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
                  <Line
                    dataKey="Entradas"
                    stroke="var(--teal)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="Saidas"
                    stroke="var(--danger)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel rounded-lg p-6">
              <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-1">
                Resumo geral
              </h3>
              <p className="font-mono text-xs text-[var(--ink-soft)] mb-4">
                Quantidade e montante (R$) por tipo
              </p>

              {/* Legenda manual com montante */}
              <div className="flex flex-col gap-2 mb-4">
                {pieChartData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-sm text-[var(--ink)]">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-[var(--ink-soft)]">{entry.value} unid. · </span>
                      <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.montante || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip isPie />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      <ModalMovimentacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        movimentacao={movSelecionada}
      />
    </div>
  );
};

export default Movimentacoes;
