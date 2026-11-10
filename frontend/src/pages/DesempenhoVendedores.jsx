import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, TrendingUp, Printer, Award, UserX, Calendar, Package, SlidersHorizontal } from "lucide-react";
import { movementsApi } from "../services/api/index.js";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";

// arquivo responsável pela página de Desempenho & Auditoria de Vendedores (ADMIN e GERENTE),
// incluindo ranking do melhor ao pior, comparação 1m/6m/1y e busca por antigo ID de ex-colaboradores excluídos

const formatBRL = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 shadow-xl">
      <p className="font-mono text-[11px] text-text-secondary mb-1">{label}</p>
      <p className="text-xs font-bold text-accent-purple">
        {formatBRL(payload[0]?.value)}
      </p>
      <p className="text-[11px] text-text-secondary">
        {payload[0]?.payload?.pecas || 0} unid. vendidas
      </p>
    </div>
  );
};

const DesempenhoVendedores = () => {
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId, setSelectedLojaId } = useTenantStore();
  const isAdmin = user?.role === "ADMIN";

  const [period, setPeriod] = useState("1m");
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [rankingData, setRankingData] = useState({ ranking: [], totalFaturadoPeriodo: 0 });
  const [loadingRanking, setLoadingRanking] = useState(true);

  const [selectedRefId, setSelectedRefId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [directIdInput, setDirectIdInput] = useState("");
  const [toastMsg, setToastMsg] = useState({ visible: false, mensagem: "", tipo: "erro" });

  // função para carregar ranking completo de vendedores do melhor ao pior no período selecionado
  // 1 - Passa período (1m/6m/1y), pesquisa e flag includeDeleted para exibir ou ocultar ex-colaboradores excluídos
  // 2 - Seleciona automaticamente o primeiro vendedor do ranking para carregar seu raio-X detalhado
  const fetchRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const res = await movementsApi.getPerformanceRanking({
        period,
        search,
        includeDeleted: String(includeDeleted),
      });
      setRankingData(res || { ranking: [], totalFaturadoPeriodo: 0 });
      if (res?.ranking?.length > 0 && !selectedRefId) {
        setSelectedRefId(res.ranking[0].vendedorRefId);
      }
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    } finally {
      setLoadingRanking(false);
    }
  }, [period, search, includeDeleted, selectedRefId]);

  useEffect(() => {
    setSelectedRefId(null);
  }, [selectedLojaId]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking, selectedLojaId]);

  // função para buscar o raio-X individual (1m, 6m, 1y, evolução e pedidos) por Matrícula ou ID antigo
  const fetchSellerDetail = useCallback(async (refId) => {
    if (!refId) return;
    setLoadingDetail(true);
    setDetailError("");
    try {
      const data = await movementsApi.getSellerPerformanceDetail(encodeURIComponent(String(refId).trim()));
      setDetailData(data);
    } catch (err) {
      setDetailData(null);
      setDetailError(err.message || "Colaborador não encontrado para esta matrícula ou ID.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRefId) {
      fetchSellerDetail(selectedRefId);
    }
  }, [selectedRefId, selectedLojaId, fetchSellerDetail]);

  const handleLookupById = (e) => {
    e.preventDefault();
    const trimmed = directIdInput.trim();
    if (!trimmed) return;
    setSelectedRefId(trimmed);
  };

  // função para gerar PDF A4 individual do vendedor contendo identificação enxuta (Nome, E-mail e Matrícula) e vendas pelos meses trabalhados
  const handlePrintSellerPdf = () => {
    if (!detailData) return;
    const { vendedor, periodos, mesesTrabalhados = [], topProdutos, pedidosRecentes } = detailData;
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      setToastMsg({
        visible: true,
        mensagem: "Permita pop-ups no navegador para exportar o PDF de desempenho.",
        tipo: "erro",
      });
      return;
    }

    const formatDateBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
    const mesesRows = mesesTrabalhados
      .map(
        (m) => `
          <tr>
            <td>${m.label}</td>
            <td class="right">${m.pedidosConcluidos}</td>
            <td class="right">${m.pecas}</td>
            <td class="right"><strong>${formatBRL(m.faturamento)}</strong></td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório de Vendas - ${vendedor.nome}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 14mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: Arial, sans-serif; color: #0f172a; font-size: 11px; margin: 0; }
          .header { display:flex; justify-content:space-between; border-bottom:2px solid #4f46e5; padding-bottom:10px; margin-bottom:14px; }
          .id-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; margin-bottom:10px; }
          .dates-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:12px; }
          .id-item small { display:block; font-size:9px; text-transform:uppercase; color:#64748b; }
          .id-item strong { font-size:12px; color:#0f172a; }
          .mat-cancel { color:#991b1b; background:#fee2e2; padding:2px 7px; border-radius:999px; font-family:monospace; font-size:10px; }
          .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:14px 0; }
          .card { border:1px solid #e2e8f0; border-radius:8px; padding:10px; background:#f8fafc; }
          .card h4 { margin:0 0 6px 0; font-size:10px; color:#64748b; text-transform:uppercase; }
          .val { font-size:15px; font-weight:700; color:#4f46e5; }
          table { width:100%; border-collapse:collapse; margin-top:8px; font-size:10px; }
          th { background:#f1f5f9; text-align:left; padding:6px; border-bottom:1px solid #cbd5e1; }
          td { padding:5px 6px; border-bottom:1px solid #f1f5f9; }
          .right { text-align:right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <strong style="font-size:18px;">ESTOQUE<span style="color:#4f46e5;">.OS</span></strong>
            <div style="color:#64748b;font-size:10px;">Relatório Individual de Vendas do Colaborador</div>
          </div>
          <div style="text-align:right;font-size:9.5px;color:#475569;">
            <div><strong>Emissão:</strong> ${new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        <div class="id-grid">
          <div class="id-item"><small>Nome</small><strong>${vendedor.nome}</strong></div>
          <div class="id-item"><small>E-mail</small><strong>${vendedor.email || "—"}</strong></div>
          <div class="id-item">
            <small>Matrícula</small>
            <strong class="${vendedor.matriculaCancelada ? "mat-cancel" : ""}">
              ${vendedor.matriculaDisplay || vendedor.matricula || `#${vendedor.vendedorRefId}`}
            </strong>
          </div>
        </div>

        <div class="dates-grid">
          <div class="card"><small style="color:#64748b;font-size:9px;text-transform:uppercase;">Data de Início (Admissão)</small><div style="font-weight:700;margin-top:2px;">${formatDateBR(vendedor.dataInicio)}</div></div>
          <div class="card"><small style="color:#64748b;font-size:9px;text-transform:uppercase;">Data de Demissão (Término)</small><div style="font-weight:700;margin-top:2px;">${vendedor.dataTermino ? formatDateBR(vendedor.dataTermino) : "Em atividade"}</div></div>
        </div>

        <div class="grid3">
          <div class="card">
            <h4>Último Mês (30d)</h4>
            <div class="val">${formatBRL(periodos.mes.faturamento)}</div>
            <div>${periodos.mes.pedidosConcluidos} pedidos · ${periodos.mes.pecas} peças</div>
            <div style="color:#64748b;font-size:9px;">Cancelados: ${periodos.mes.pedidosCancelados}</div>
          </div>
          <div class="card">
            <h4>Último Semestre (180d)</h4>
            <div class="val">${formatBRL(periodos.semestre.faturamento)}</div>
            <div>${periodos.semestre.pedidosConcluidos} pedidos · ${periodos.semestre.pecas} peças</div>
            <div style="color:#64748b;font-size:9px;">Cancelados: ${periodos.semestre.pedidosCancelados}</div>
          </div>
          <div class="card">
            <h4>Último Ano (365d)</h4>
            <div class="val">${formatBRL(periodos.ano.faturamento)}</div>
            <div>${periodos.ano.pedidosConcluidos} pedidos · ${periodos.ano.pecas} peças</div>
            <div style="color:#64748b;font-size:9px;">Cancelados: ${periodos.ano.pedidosCancelados}</div>
          </div>
        </div>

        ${
          mesesTrabalhados.length > 0
            ? `<h3>Vendas nos Meses Trabalhados</h3>
               <table>
                 <thead><tr><th>Mês</th><th class="right">Pedidos</th><th class="right">Peças</th><th class="right">Faturamento</th></tr></thead>
                 <tbody>${mesesRows}</tbody>
               </table>`
            : ""
        }

        <h3>Top Produtos Vendidos (Último Ano)</h3>
        <table>
          <thead><tr><th>Produto</th><th class="right">Peças</th><th class="right">Faturamento</th></tr></thead>
          <tbody>
            ${
              topProdutos.length > 0
                ? topProdutos
                    .map(
                      (p) =>
                        `<tr><td>${p.nome}</td><td class="right">${p.quantidade} un.</td><td class="right"><strong>${formatBRL(
                          p.faturamento
                        )}</strong></td></tr>`
                    )
                    .join("")
                : `<tr><td colspan="3">Sem produtos vendidos.</td></tr>`
            }
          </tbody>
        </table>

        <h3 style="margin-top:16px;">Pedidos Recentes</h3>
        <table>
          <thead><tr><th>Código</th><th>Data</th><th>Loja</th><th>Status</th><th class="right">Total</th></tr></thead>
          <tbody>
            ${
              pedidosRecentes.slice(0, 12).length > 0
                ? pedidosRecentes
                    .slice(0, 12)
                    .map(
                      (ped) =>
                        `<tr><td>${ped.codigo}</td><td>${new Date(ped.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}</td><td>${ped.loja?.nome || "—"}</td><td>${
                          ped.status
                        }</td><td class="right"><strong>${formatBRL(ped.valorTotal)}</strong></td></tr>`
                    )
                    .join("")
                : `<tr><td colspan="5">Sem pedidos registrados.</td></tr>`
            }
          </tbody>
        </table>
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const selectedRankInfo = rankingData.ranking.find(
    (r) => Number(r.vendedorRefId) === Number(detailData?.vendedor?.vendedorRefId)
  );

  return (
    <div className="w-full min-h-screen pt-2 pb-12 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Auditoria &amp; Metas • {rankingData.scopeLabel || "Loja"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Desempenho de Colaboradores
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Ranking do melhor ao pior vendedor, comparativo Mês/Semestre/Ano e consulta por Matrícula ou ID de contas ativas e desligadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Busca direta por Matrícula ou ID (inclusive matrícula cancelada) */}
          <form onSubmit={handleLookupById} className="flex items-center gap-2 flex-1 sm:flex-none">
            <input
              type="text"
              value={directIdInput}
              onChange={(e) => setDirectIdInput(e.target.value)}
              placeholder="Matrícula ou ID (ex: MAT-00063)"
              className="w-full sm:w-52 px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
            />
            <button type="submit" className="btn-secondary px-4 py-2 text-xs font-semibold whitespace-nowrap">
              Buscar Matrícula
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFiltrosAbertos((prev) => !prev)}
            className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <SlidersHorizontal size={13} />
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>
      </header>

      {/* Filtros Colapsáveis do Ranking */}
      {filtrosAbertos && (
        <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)]">
              <Calendar size={14} className="text-text-secondary ml-1.5" />
              {[
                { id: "1m", label: "1 Mês" },
                { id: "6m", label: "6 Meses" },
                { id: "1y", label: "1 Ano" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === p.id ? "bg-accent-purple text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {isAdmin && stores.length > 0 && (
              <select
                value={selectedLojaId}
                onChange={(e) => setSelectedLojaId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
              >
                <option value="all">Todas as Lojas ({stores.length})</option>
                {stores.map((st) => (
                  <option key={st.id} value={String(st.id)}>
                    {st.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar matrícula, nome, email ou ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="accent-accent-purple rounded"
              />
              Incluir ex-funcionários excluídos
            </label>
          </div>
        </div>
      )}

      {/* Grade principal: Ranking (esq) + Detalhes 1m/6m/1y (dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ranking do melhor ao pior */}
        <div className="lg:col-span-5 glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-accent-purple" />
              <h2 className="font-display font-bold text-sm sm:text-base text-text-primary">
                Ranking (Melhor ao Pior)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-accent-pink font-semibold">
              Total: {formatBRL(rankingData.totalFaturadoPeriodo)}
            </span>
          </div>

          {loadingRanking ? (
            <div className="py-12 text-center text-xs text-text-secondary animate-pulse">
              Calculando ranking...
            </div>
          ) : rankingData.ranking.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              Nenhum vendedor encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
              {rankingData.ranking.map((seller) => {
                const isSelected = Number(detailData?.vendedor?.vendedorRefId || selectedRefId) === Number(seller.vendedorRefId);
                return (
                  <button
                    key={seller.vendedorRefId}
                    type="button"
                    onClick={() => setSelectedRefId(seller.vendedorRefId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-accent-purple bg-accent-purple/10 shadow-md"
                        : "border-[var(--color-border-light)] bg-[var(--color-bg)] hover:border-accent-purple/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                          seller.posicao === 1
                            ? "bg-amber-500/20 text-amber-500"
                            : seller.posicao === 2
                            ? "bg-slate-400/20 text-slate-300"
                            : "bg-[var(--color-surface)] text-text-secondary"
                        }`}
                      >
                        {seller.posicao}º
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-text-primary truncate">{seller.nome}</p>
                          <span className="font-mono text-[10px] text-accent-purple">
                            {seller.matriculaDisplay || seller.matricula || `#${seller.vendedorRefId}`}
                          </span>
                          {seller.excluido ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[9px] font-bold uppercase">
                              <UserX size={9} />
                              Desligado
                            </span>
                          ) : seller.situacao === "SUSPENSO" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase">
                              Suspenso
                            </span>
                          ) : seller.situacao === "FERIAS" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 text-[9px] font-bold uppercase">
                              Férias
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-text-secondary truncate">
                          {seller.lojaNome} · {seller.totalPedidos} pedidos · {seller.totalPecas} un.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display text-xs sm:text-sm font-bold text-accent-purple">
                        {formatBRL(seller.totalFaturado)}
                      </p>
                      <p className="font-mono text-[10px] text-text-secondary">
                        {seller.percentualParticipacao}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhes Individuais 1m / 6m / 1y */}
        <div className="lg:col-span-7 glass-card p-4 sm:p-6 rounded-2xl space-y-5">
          {loadingDetail ? (
            <div className="py-20 text-center text-xs text-text-secondary animate-pulse">
              Carregando histórico detalhado do colaborador...
            </div>
          ) : detailError ? (
            <div className="py-12 text-center text-xs text-accent-red">{detailError}</div>
          ) : !detailData ? (
            <div className="py-16 text-center text-xs text-text-secondary">
              Selecione um colaborador ao lado ou busque por ID para acompanhar seu desempenho.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border-light)]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl font-bold text-text-primary">
                      {detailData.vendedor.nome}
                    </h2>
                    <span
                      className={`font-mono text-xs px-2.5 py-0.5 rounded-full border ${
                        detailData.vendedor.matriculaCancelada
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : "bg-accent-purple/15 border-accent-purple/30 text-accent-purple"
                      }`}
                    >
                      {detailData.vendedor.matriculaDisplay ||
                        detailData.vendedor.matricula ||
                        `#${detailData.vendedor.vendedorRefId}`}
                    </span>
                    {selectedRankInfo?.posicao && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-accent-pink/15 text-accent-pink font-bold">
                        {selectedRankInfo.posicao}º no ranking
                      </span>
                    )}
                    {detailData.vendedor.excluido ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold uppercase">
                        Desligado (Matrícula Cancelada)
                      </span>
                    ) : detailData.vendedor.situacao === "SUSPENSO" ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase">
                        Suspenso
                      </span>
                    ) : detailData.vendedor.situacao === "FERIAS" ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 text-[10px] font-bold uppercase">
                        Em Férias
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase">
                        Atuando · {detailData.vendedor.cargoAtual}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {detailData.vendedor.email} • {detailData.vendedor.lojaAtualNome}
                    {detailData.vendedor.dataInicio
                      ? ` • Admissão: ${new Date(detailData.vendedor.dataInicio).toLocaleDateString("pt-BR")}`
                      : ""}
                    {detailData.vendedor.dataTermino
                      ? ` • Demissão: ${new Date(detailData.vendedor.dataTermino).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>

                <button
                  onClick={handlePrintSellerPdf}
                  className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shrink-0"
                >
                  <Printer size={14} />
                  PDF do Vendedor
                </button>
              </div>

              {/* Comparativo simultâneo Mês / Semestre / Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Último Mês (30d)", data: detailData.periodos.mes, color: "text-accent-purple" },
                  { title: "Último Semestre (6m)", data: detailData.periodos.semestre, color: "text-accent-pink" },
                  { title: "Último Ano (1y)", data: detailData.periodos.ano, color: "text-emerald-500" },
                ].map((box) => (
                  <div
                    key={box.title}
                    className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]"
                  >
                    <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                      {box.title}
                    </p>
                    <p className={`font-display text-lg font-bold ${box.color}`}>
                      {formatBRL(box.data.faturamento)}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      {box.data.pedidosConcluidos} pedidos · {box.data.pecas} un.
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      Ticket: {formatBRL(box.data.ticketMedio)}
                      {box.data.pedidosCancelados > 0
                        ? ` · ${box.data.pedidosCancelados} cancel.`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>

              {/* Evolução Mensal 12 meses */}
              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-accent-purple" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Evolução nos Últimos 12 Meses
                    </h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={detailData.evolucaoMensal}>
                    <XAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={10} />
                    <YAxis
                      stroke="var(--color-text-secondary)"
                      fontSize={10}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="faturamento" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Histórico filtrado pelos meses trabalhados (entre Início e Término) */}
              {Array.isArray(detailData.mesesTrabalhados) && detailData.mesesTrabalhados.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Vendas por Mês Trabalhado
                    </h3>
                    <span className="font-mono text-[11px] text-text-secondary">
                      Admissão: {new Date(detailData.vendedor.dataInicio).toLocaleDateString("pt-BR")} · Demissão:{" "}
                      {detailData.vendedor.dataTermino
                        ? new Date(detailData.vendedor.dataTermino).toLocaleDateString("pt-BR")
                        : "Em atividade"}
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-52 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs">
                      <thead className="text-text-secondary border-b border-[var(--color-border)]">
                        <tr>
                          <th className="text-left py-1.5 font-medium">Mês</th>
                          <th className="text-center py-1.5 font-medium">Pedidos</th>
                          <th className="text-center py-1.5 font-medium">Peças</th>
                          <th className="text-right py-1.5 font-medium">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)]">
                        {detailData.mesesTrabalhados.map((m) => (
                          <tr key={m.mes}>
                            <td className="py-1.5 font-medium text-text-primary">{m.label}</td>
                            <td className="py-1.5 text-center text-text-secondary">{m.pedidosConcluidos}</td>
                            <td className="py-1.5 text-center text-text-secondary">{m.pecas}</td>
                            <td className="py-1.5 text-right font-semibold text-accent-purple">
                              {formatBRL(m.faturamento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Produtos + Pedidos Recentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Package size={14} className="text-accent-pink" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Produtos Mais Vendidos (1y)
                    </h3>
                  </div>
                  {detailData.topProdutos.length === 0 ? (
                    <p className="text-xs text-text-secondary">Sem vendas no período.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailData.topProdutos.map((prod) => (
                        <div
                          key={prod.produtoId}
                          className="flex items-center justify-between text-xs border-b border-[var(--color-border-light)] pb-1.5 last:border-b-0"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-text-primary truncate">{prod.nome}</p>
                            <p className="text-[10px] text-text-secondary">{prod.quantidade} unid.</p>
                          </div>
                          <span className="font-semibold text-accent-purple shrink-0">
                            {formatBRL(prod.faturamento)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-2.5">
                    Últimos Pedidos ({detailData.pedidosRecentes.length})
                  </h3>
                  {detailData.pedidosRecentes.length === 0 ? (
                    <p className="text-xs text-text-secondary">Nenhum pedido recente.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {detailData.pedidosRecentes.slice(0, 10).map((ped) => (
                        <div
                          key={ped.id}
                          className="flex items-center justify-between text-xs border-b border-[var(--color-border-light)] pb-1.5 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-text-primary">
                              {ped.codigo}{" "}
                              {ped.status === "CANCELADO" && (
                                <span className="text-[9px] text-red-500 uppercase ml-1">Cancelado</span>
                              )}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                              {new Date(ped.createdAt).toLocaleDateString("pt-BR")} · {ped.itens?.length || 0} item(ns)
                            </p>
                          </div>
                          <span
                            className={`font-semibold ${
                              ped.status === "CANCELADO" ? "line-through text-text-secondary" : "text-text-primary"
                            }`}
                          >
                            {formatBRL(ped.valorTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalMensagem
        visible={toastMsg.visible}
        mensagem={toastMsg.mensagem}
        tipo={toastMsg.tipo}
        onClose={() => setToastMsg({ ...toastMsg, visible: false })}
      />
    </div>
  );
};

export default DesempenhoVendedores;
