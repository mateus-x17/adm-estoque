import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  LineChart,
  FileText,
  Users,
  Truck,
} from "lucide-react";
import { movementsApi } from "../../services/api/index.js";
import { useUserStore } from "../../store/userStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelo modal executivo e gerador de PDF A4 (1m, 6m, 1y) com ranking de vendedores e fornecedores

const ModalExportarRelatorio = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState("1m");
  const [chartType, setChartType] = useState("barras");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupWarning, setPopupWarning] = useState(false);

  const currentUser = useUserStore((state) => state.user);
  const { stores, selectedLojaId, setSelectedLojaId } = useTenantStore();
  const isAdmin = currentUser?.role === "ADMIN";

  const scopeLabel =
    reportData?.scope === "user"
      ? "Minhas Vendas (Operador)"
      : reportData?.scope === "network"
      ? "Consolidado da Organização (Todas as Lojas)"
      : `Filial: ${reportData?.lojaNome || currentUser?.lojaNome || "Loja"}`;

  const displayName =
    reportData?.empresaNome ||
    currentUser?.organizacaoNome ||
    currentUser?.lojaNome ||
    "Estabelecimento";

  useEffect(() => {
    if (!isOpen) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await movementsApi.getSalesReport(period);
        setReportData(data);
      } catch (err) {
        console.error("Erro ao carregar dados do relatório:", err);
        setError("Não foi possível carregar os dados de vendas para o período selecionado.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, period, selectedLojaId]);

  if (!isOpen) return null;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const renderSvgChart = (isForPrint = false) => {
    const timeline = reportData?.timeline || [];
    if (timeline.length === 0) {
      return (
        <div className="flex items-center justify-center h-44 text-xs text-text-secondary">
          Nenhuma movimentação de venda concluída registrada no período selecionado.
        </div>
      );
    }

    const maxVal = Math.max(...timeline.map((item) => item.valor), 1);
    const chartHeight = isForPrint ? 160 : 180;
    const chartWidth = 580;
    const paddingLeft = 42;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    if (chartType === "barras") {
      const barWidth = Math.max(10, Math.min(34, (plotWidth / timeline.length) * 0.7));
      const step = plotWidth / timeline.length;

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + plotHeight * (1 - pct);
            const val = maxVal * pct;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={isForPrint ? "#e2e8f0" : "var(--color-border-light)"}
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  fontSize="8"
                  textAnchor="end"
                  fill={isForPrint ? "#64748b" : "var(--color-text-secondary)"}
                  fontFamily="sans-serif"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}

          {timeline.map((item, index) => {
            const x = paddingLeft + index * step + (step - barWidth) / 2;
            const barH = Math.max(3, (item.valor / maxVal) * plotHeight);
            const y = paddingTop + plotHeight - barH;
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={isForPrint ? "#4f46e5" : "url(#barGradientModal)"}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize="7"
                  textAnchor="middle"
                  fontWeight="600"
                  fill={isForPrint ? "#1e293b" : "var(--color-text-primary)"}
                >
                  {item.valor >= 1000 ? `${(item.valor / 1000).toFixed(1)}k` : Math.round(item.valor)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  fontSize="8"
                  textAnchor="middle"
                  fill={isForPrint ? "#475569" : "var(--color-text-secondary)"}
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="barGradientModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    const points = timeline.map((item, index) => {
      const step = timeline.length > 1 ? plotWidth / (timeline.length - 1) : plotWidth / 2;
      const x = paddingLeft + index * step;
      const y = paddingTop + plotHeight * (1 - item.valor / maxVal);
      return { x, y, item };
    });

    const pathD = points.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ""
    );
    const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${
      paddingTop + plotHeight
    } Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingTop + plotHeight * (1 - pct);
          const val = maxVal * pct;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={isForPrint ? "#e2e8f0" : "var(--color-border-light)"}
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                fontSize="8"
                textAnchor="end"
                fill={isForPrint ? "#64748b" : "var(--color-text-secondary)"}
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill={isForPrint ? "#e0e7ff" : "url(#lineAreaGradModal)"} opacity={0.45} />
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 6}
              fontSize="7"
              textAnchor="middle"
              fontWeight="600"
              fill={isForPrint ? "#1e293b" : "var(--color-text-primary)"}
            >
              {p.item.valor > 0
                ? p.item.valor >= 1000
                  ? `${(p.item.valor / 1000).toFixed(1)}k`
                  : Math.round(p.item.valor)
                : ""}
            </text>
            <text
              x={p.x}
              y={chartHeight - 8}
              fontSize="8"
              textAnchor="middle"
              fill={isForPrint ? "#475569" : "var(--color-text-secondary)"}
            >
              {p.item.label}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="lineAreaGradModal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // função para imprimir / salvar relatório executivo em PDF A4 contendo gráficos, ranking de vendedores e fornecedores
  const handleExportPdf = () => {
    if (!reportData) return;

    const summary = reportData.summary || {};
    const topProdutos = reportData.topProdutos || [];
    const rankingVendedores = reportData.rankingVendedores || [];
    const resumoFornecedores = reportData.resumoFornecedores || [];

    const printWindow = window.open("", "_blank", "width=900,height=920");
    if (!printWindow) {
      setPopupWarning(true);
      return;
    }

    const svgElement = document.getElementById("report-svg-container");
    const svgHtml = svgElement ? svgElement.innerHTML : "";

    const sellersHtml =
      rankingVendedores.length > 0
        ? `
      <div class="chart-section">
        <div class="section-title">
          <span>Ranking de Vendedores (Melhor ao Pior no Período)</span>
          <span style="font-size:10px;font-weight:normal;color:#64748b;">Inclui histórico preservado por ID</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:32px;">Pos.</th>
              <th>Colaborador (Nome · E-mail · Matrícula)</th>
              <th>Loja</th>
              <th class="text-right">Pedidos</th>
              <th class="text-right">Peças</th>
              <th class="text-right">Faturamento</th>
              <th class="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            ${rankingVendedores
              .map(
                (v) => `
              <tr>
                <td><strong>${v.posicao}º</strong></td>
                <td>
                  <strong>${v.nome}</strong>
                  <div style="color:#64748b;font-size:9px;">
                    ${v.email || "—"} · ${v.matriculaDisplay || v.matricula || `#${v.vendedorRefId}`}
                  </div>
                </td>
                <td>${v.lojaNome || "—"}</td>
                <td class="text-right">${v.totalPedidos}</td>
                <td class="text-right">${v.totalPecas} un.</td>
                <td class="text-right"><strong>${formatCurrency(v.totalFaturado)}</strong></td>
                <td class="text-right">${v.percentualParticipacao}%</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
        : "";

    const suppliersHtml =
      resumoFornecedores.length > 0
        ? `
      <div class="chart-section">
        <div class="section-title">
          <span>Saídas por Fornecedor no Período</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fornecedor</th>
              <th class="text-right">Qtd. Vendida</th>
              <th class="text-right">Faturamento Gerado</th>
            </tr>
          </thead>
          <tbody>
            ${resumoFornecedores
              .map(
                (s) => `
              <tr>
                <td>${s.nome}</td>
                <td class="text-right">${s.quantidadeVendida} un.</td>
                <td class="text-right"><strong>${formatCurrency(s.valorTotal)}</strong></td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
        : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Executivo - ${displayName}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 14mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; font-size: 10.5px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 14px; }
          .logo { font-size: 19px; font-weight: 800; }
          .logo span { color: #4f46e5; }
          .meta-info { text-align: right; font-size: 9.5px; color: #475569; }
          .title-section { margin-bottom: 12px; }
          .title-section h1 { font-size: 15px; margin: 0 0 4px 0; color: #1e293b; }
          .badge { display: inline-block; background: #e0e7ff; color: #3730a3; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 9.5px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
          .kpi-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 9px; }
          .kpi-label { font-size: 8.5px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 3px; }
          .kpi-value { font-size: 13px; font-weight: 700; color: #0f172a; }
          .chart-section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; page-break-inside: avoid; }
          .section-title { font-size: 11px; font-weight: 700; margin-bottom: 8px; color: #1e293b; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 5px 7px; border-bottom: 1px solid #cbd5e1; }
          td { padding: 5px 7px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ESTOQUE<span>.OS</span></div>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">${displayName}</div>
          </div>
          <div class="meta-info">
            <div><strong>Escopo:</strong> ${scopeLabel}</div>
            <div><strong>Emissor:</strong> ${currentUser?.nome || "Usuário"} (${currentUser?.role || ""})</div>
            <div><strong>Emissão:</strong> ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        <div class="title-section">
          <h1>Relatório Consolidado de Vendas &amp; Desempenho</h1>
          <span class="badge">Período: ${reportData.periodLabel}</span>
          <span style="font-size:9.5px;color:#64748b;margin-left:8px;">
            (${new Date(reportData.startDate).toLocaleDateString("pt-BR")} até ${new Date(reportData.endDate).toLocaleDateString("pt-BR")})
          </span>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Faturamento Líquido</div>
            <div class="kpi-value" style="color:#4f46e5;">${formatCurrency(summary.totalVendasValor)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Peças Vendidas</div>
            <div class="kpi-value">${summary.totalVendasQuantidade || 0} un.</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Pedidos Concluídos</div>
            <div class="kpi-value">${summary.totalTransacoes || 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Médio</div>
            <div class="kpi-value">${formatCurrency(summary.ticketMedio)}</div>
          </div>
        </div>

        <div class="chart-section">
          <div class="section-title">
            <span>Evolução Cronológica de Vendas</span>
            <span style="font-size:9px;font-weight:normal;color:#64748b;">Em Reais (R$)</span>
          </div>
          ${svgHtml}
        </div>

        ${sellersHtml}

        <div class="chart-section">
          <div class="section-title">
            <span>Produtos Líderes no Período</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:28px;">#</th>
                <th>Produto</th>
                <th class="text-right">Qtd.</th>
                <th class="text-right">Faturamento</th>
                <th class="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              ${
                topProdutos.length > 0
                  ? topProdutos
                      .map(
                        (p, idx) => `
                <tr>
                  <td><strong>${idx + 1}</strong></td>
                  <td>${p.nome}</td>
                  <td class="text-right">${p.quantidadeVendida} un.</td>
                  <td class="text-right"><strong>${formatCurrency(p.valorTotal)}</strong></td>
                  <td class="text-right">${p.percentual}%</td>
                </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Sem vendas no período.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        ${suppliersHtml}

        <div class="footer">
          <div>Estoque.OS &bull; Relatório Gerencial Auditável</div>
          <div>Gerado automaticamente pelo painel</div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 300); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-border)] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-accent-purple/10 text-accent-purple shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-text-primary truncate">
                Relatório Executivo &amp; Exportação PDF
              </h2>
              <p className="text-xs text-text-secondary truncate">
                {displayName} • {scopeLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Controles */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-secondary shrink-0" />
                <span className="text-xs font-semibold text-text-secondary">Período:</span>
              </div>
              <div className="flex flex-wrap gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                {[
                  { id: "1m", label: "1 Mês" },
                  { id: "6m", label: "6 Meses" },
                  { id: "1y", label: "1 Ano" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      period === item.id
                        ? "bg-accent-purple text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {isAdmin && stores.length > 0 && (
                <select
                  value={selectedLojaId}
                  onChange={(e) => setSelectedLojaId(e.target.value)}
                  aria-label="Filtrar loja do relatório"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
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

            <div className="flex items-center gap-1 self-end lg:self-auto">
              <span className="text-xs font-semibold text-text-secondary mr-2">Gráfico:</span>
              <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => setChartType("barras")}
                  className={`p-1.5 rounded-md text-xs font-medium ${
                    chartType === "barras"
                      ? "bg-accent-purple text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartType("linhas")}
                  className={`p-1.5 rounded-md text-xs font-medium ${
                    chartType === "linhas"
                      ? "bg-accent-purple text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Consolidando métricas e rankings...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-accent-purple text-xs font-semibold mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Faturamento Líquido
                  </div>
                  <div className="font-display text-base md:text-lg font-bold text-text-primary">
                    {formatCurrency(reportData?.summary?.totalVendasValor)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-accent-blue text-xs font-semibold mb-1">
                    <Package className="w-3.5 h-3.5" />
                    Itens Vendidos
                  </div>
                  <div className="font-display text-base md:text-lg font-bold text-text-primary">
                    {reportData?.summary?.totalVendasQuantidade || 0} un.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-accent-pink text-xs font-semibold mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Pedidos Concluídos
                  </div>
                  <div className="font-display text-base md:text-lg font-bold text-text-primary">
                    {reportData?.summary?.totalTransacoes || 0}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Ticket Médio
                  </div>
                  <div className="font-display text-base md:text-lg font-bold text-text-primary">
                    {formatCurrency(reportData?.summary?.ticketMedio)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Evolução no Período ({reportData?.periodLabel})
                  </h3>
                  <span className="text-[10px] text-text-secondary">Valores em R$</span>
                </div>
                <div id="report-svg-container" className="pt-2">
                  {renderSvgChart(false)}
                </div>
              </div>

              {/* Ranking de Vendedores (Melhor ao Pior) - apenas para ADMIN e GERENTE */}
              {reportData?.rankingVendedores?.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-accent-pink" />
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Ranking de Vendedores (Melhor ao Pior)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-text-secondary">
                          <th className="pb-2">Pos.</th>
                          <th className="pb-2">Vendedor</th>
                          <th className="pb-2">Loja</th>
                          <th className="pb-2 text-right">Pedidos</th>
                          <th className="pb-2 text-right">Faturamento</th>
                          <th className="pb-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)]">
                        {reportData.rankingVendedores.map((v) => (
                          <tr key={v.vendedorRefId} className="text-text-primary">
                            <td className="py-2 font-mono font-bold text-accent-purple">
                              {v.posicao}º
                            </td>
                            <td className="py-2 font-medium">
                              <div>{v.nome}</div>
                              <div className="text-[10px] font-mono text-text-secondary">
                                {v.email || "—"} · {v.matriculaDisplay || v.matricula || `#${v.vendedorRefId}`}
                              </div>
                            </td>
                            <td className="py-2 text-text-secondary">{v.lojaNome}</td>
                            <td className="py-2 text-right">{v.totalPedidos}</td>
                            <td className="py-2 text-right font-semibold text-accent-purple">
                              {formatCurrency(v.totalFaturado)}
                            </td>
                            <td className="py-2 text-right text-text-secondary">
                              {v.percentualParticipacao}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Produtos Líderes & Fornecedores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                    Produtos Mais Vendidos
                  </h3>
                  {reportData?.topProdutos?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-text-secondary">
                            <th className="pb-2">#</th>
                            <th className="pb-2">Produto</th>
                            <th className="pb-2 text-right">Qtd.</th>
                            <th className="pb-2 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-light)]">
                          {reportData.topProdutos.map((prod, idx) => (
                            <tr key={prod.id}>
                              <td className="py-1.5 font-mono text-text-secondary">{idx + 1}</td>
                              <td className="py-1.5 font-medium text-text-primary">{prod.nome}</td>
                              <td className="py-1.5 text-right">{prod.quantidadeVendida}</td>
                              <td className="py-1.5 text-right font-semibold text-accent-purple">
                                {formatCurrency(prod.valorTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-4">
                      Sem vendas registradas.
                    </p>
                  )}
                </div>

                {reportData?.resumoFornecedores?.length > 0 && (
                  <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4 text-accent-purple" />
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Vendas por Fornecedor
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-text-secondary">
                            <th className="pb-2">Fornecedor</th>
                            <th className="pb-2 text-right">Qtd.</th>
                            <th className="pb-2 text-right">Faturamento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-light)]">
                          {reportData.resumoFornecedores.map((sup) => (
                            <tr key={sup.id}>
                              <td className="py-1.5 font-medium text-text-primary">{sup.nome}</td>
                              <td className="py-1.5 text-right">{sup.quantidadeVendida} un.</td>
                              <td className="py-1.5 text-right font-semibold text-accent-purple">
                                {formatCurrency(sup.valorTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        {popupWarning && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-500/10 border-t border-amber-500/25 text-xs text-amber-400 flex items-center justify-between gap-2">
            <span>Pop-up bloqueado pelo navegador. Habilite pop-ups para este site e tente imprimir novamente.</span>
            <button
              type="button"
              onClick={() => setPopupWarning(false)}
              className="underline font-semibold shrink-0"
            >
              Entendi
            </button>
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="text-[11px] text-text-secondary text-center sm:text-left">
            Pronto para impressão / exportação PDF A4 vetorial
          </span>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleExportPdf}
              disabled={loading || !!error || !reportData}
              className="flex-1 sm:flex-none btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent-purple/20 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar em PDF
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalExportarRelatorio;
