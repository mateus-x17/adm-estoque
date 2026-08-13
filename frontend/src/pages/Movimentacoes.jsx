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

const PIE_COLORS = ["var(--color-chart-3)", "var(--color-chart-4)"];

const ChartTooltip = ({ active, payload, label, isPie }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-card"
      style={{
        padding: "8px 12px",
        minWidth: 140,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {label && <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4, fontFamily: "monospace" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <span style={{ fontSize: 12, color: p.color || "var(--color-text-primary)", fontWeight: 600 }}>
            {p.name}: {p.value} unid.
          </span>
          {isPie && p.payload?.montante !== undefined && (
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
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
  
  const [order, setOrder] = useState("desc");

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
          order,
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
    <div className="w-full min-h-screen pt-4 pb-12 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-[var(--color-border)] mb-8">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Estoque
          </span>
          <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight mt-1">
            Movimentações
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Controle de entradas e saídas de produtos.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtrosAbertos && (
          <section className="glass-card p-5 flex flex-col lg:flex-row gap-3 animate-fade-up">
            <input
              type="text"
              placeholder="Buscar produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200"
            />

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full lg:w-40 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>

            {canFilterByUser ? (
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full lg:w-52 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
              >
                <option value="">Todos os usuários</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full lg:w-52 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-white/5 text-xs text-text-secondary flex items-center gap-2 cursor-not-allowed select-none" title="Apenas Gerentes e Administradores podem filtrar por usuário">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Filtro restrito
              </div>
            )}

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full lg:w-44 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full lg:w-44 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            />

            <button
              onClick={toggleOrder}
              className="btn-secondary px-4 py-2 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 lg:w-40 shrink-0"
              title={order === "desc" ? "Mostrando mais recentes primeiro" : "Mostrando mais antigos primeiro"}
            >
              {order === "desc" ? <FiArrowDown size={14} /> : <FiArrowUp size={14} />}
              {order === "desc" ? "Recentes" : "Antigos"}
            </button>
          </section>
        )}
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando movimentações...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Histórico de movimentações
              </h2>
              <span className="font-mono text-[11px] uppercase text-text-secondary border border-[var(--color-border-light)] bg-[var(--color-surface)] rounded-full px-3 py-1">
                Total: {totalMovimentos}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {movimentacoes.length === 0 ? (
                <div className="glass-card p-8 text-center text-sm text-text-secondary">
                  Nenhuma movimentação encontrada.
                </div>
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
            </div>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual((p) => p - 1)}
                className="btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-40 disabled:hover:border-[var(--color-border-light)] disabled:hover:text-text-primary"
              >
                Anterior
              </button>

              <span className="font-mono text-xs text-text-secondary">
                Página <span className="text-text-primary font-medium">{paginaAtual}</span> de {totalPaginas}
              </span>

              <button
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual((p) => p + 1)}
                className="btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-40 disabled:hover:border-[var(--color-border-light)] disabled:hover:text-text-primary"
              >
                Próximo
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="font-display text-lg font-semibold text-text-primary mb-6">
                Entradas x saídas
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineChartData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }} />
                  <Line
                    dataKey="Entradas"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="Saidas"
                    stroke="var(--color-chart-4)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold text-text-primary mb-1">
                Resumo geral
              </h3>
              <p className="font-mono text-xs text-text-secondary mb-6">
                Quantidade e montante (R$) por tipo
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {pieChartData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-sm font-medium text-text-primary">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-text-secondary">{entry.value} unid. · </span>
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.montante || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    innerRadius={45}
                    label={false}
                    labelLine={false}
                  >
                    {pieChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip isPie />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
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
