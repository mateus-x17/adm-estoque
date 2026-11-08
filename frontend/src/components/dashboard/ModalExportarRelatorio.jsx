import React, { useState, useEffect } from "react";
import { X, Printer, Calendar, TrendingUp, Package, DollarSign, BarChart3, LineChart, FileText } from "lucide-react";
import { movementsApi } from "../../services/api/index.js";
import { useUserStore } from "../../store/userStore.js";

// arquivo responsável por renderizar o modal de exportação de relatórios de vendas em PDF
// 1 - Controla a seleção de períodos históricos (1 mês, 6 meses, 1 ano) e o tipo de visualização gráfica
// 2 - Carrega os dados agregados da API de movimentações (/movements/sales-report)
// 3 - Renderiza o painel executivo com cards de KPIs, gráficos vetoriais em SVG e tabela de produtos líderes
// 4 - Executa a exportação nativa para PDF utilizando a janela de impressão do navegador com layout A4 otimizado

const ModalExportarRelatorio = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState("1m"); // '1m' | '6m' | '1y'
  const [chartType, setChartType] = useState("barras"); // 'barras' | 'linhas'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = useUserStore((state) => state.user);

  // função para carregar os dados consolidados da API de acordo com o período selecionado
  // 1 - Define estado de carregamento e limpa erros prévios
  // 2 - Invoca a API movementsApi.getSalesReport informando o período (1m, 6m ou 1y)
  // 3 - Armazena o resultado no estado local ou registra falha em caso de exceção
  useEffect(() => {
    if (!isOpen) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await movementsApi.getSalesReport(period);
        setReportData(data);
      } catch (err) {
        console.error("Erro ao carregar dados do relatório de vendas:", err);
        setError("Não foi possível carregar os dados de vendas para o período selecionado.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, period]);

  if (!isOpen) return null;

  // função auxiliar para formatar valores monetários em padrão BRL
  // 1 - Recebe valor numérico e aplica o formatador internacional pt-BR com símbolo de moeda
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  // função para renderizar o gráfico vetorial em SVG nativo (barras ou linhas)
  // 1 - Identifica os limites da série temporal e o valor máximo para dimensionamento
  // 2 - Calcula proporções relativas e projeta coordenadas vetoriais X e Y no viewBox
  // 3 - Retorna elementos SVG nativos (retângulos para barras ou caminhos para linhas)
  const renderSvgChart = (isForPrint = false) => {
    const timeline = reportData?.timeline || [];
    if (timeline.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-xs text-text-secondary">
          Nenhuma movimentação de venda registrada no período selecionado.
        </div>
      );
    }

    const maxVal = Math.max(...timeline.map((item) => item.valor), 1);
    const chartHeight = isForPrint ? 160 : 180;
    const chartWidth = 580;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    if (chartType === "barras") {
      const barWidth = Math.max(10, Math.min(36, (plotWidth / timeline.length) * 0.7));
      const step = plotWidth / timeline.length;

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Linhas de grade de fundo */}
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

          {/* Barras e rótulos */}
          {timeline.map((item, index) => {
            const x = paddingLeft + index * step + (step - barWidth) / 2;
            const barH = Math.max(3, (item.valor / maxVal) * plotHeight);
            const y = paddingTop + (plotHeight - barH);

            return (
              <g key={index} className="group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={isForPrint ? "#6366f1" : "url(#barGradient)"}
                  className="transition-all duration-200"
                />
                {/* Rótulo do valor no topo da barra */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="7.5"
                  textAnchor="middle"
                  fontWeight="600"
                  fill={isForPrint ? "#1e293b" : "var(--color-text-primary)"}
                >
                  {item.valor > 0 ? (item.valor >= 1000 ? `${(item.valor / 1000).toFixed(1)}k` : Math.round(item.valor)) : ""}
                </text>
                {/* Rótulo do eixo X */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  fontSize="8"
                  textAnchor="middle"
                  fill={isForPrint ? "#475569" : "var(--color-text-secondary)"}
                  fontFamily="sans-serif"
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    // Gráfico de Linha
    const points = timeline.map((item, index) => {
      const step = timeline.length > 1 ? plotWidth / (timeline.length - 1) : plotWidth / 2;
      const x = paddingLeft + index * step;
      const y = paddingTop + plotHeight * (1 - item.valor / maxVal);
      return { x, y, item };
    });

    const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
    const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
        {/* Linhas de grade de fundo */}
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

        {/* Área preenchida sob a linha */}
        <path d={areaD} fill={isForPrint ? "#e0e7ff" : "url(#lineAreaGrad)"} opacity={isForPrint ? 0.6 : 0.4} />

        {/* Linha principal de tendência */}
        <path d={pathD} fill="none" stroke={isForPrint ? "#4f46e5" : "#6366f1"} strokeWidth="2.5" strokeLinecap="round" />

        {/* Pontos de dados */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 6}
              fontSize="7.5"
              textAnchor="middle"
              fontWeight="600"
              fill={isForPrint ? "#1e293b" : "var(--color-text-primary)"}
            >
              {p.item.valor > 0 ? (p.item.valor >= 1000 ? `${(p.item.valor / 1000).toFixed(1)}k` : Math.round(p.item.valor)) : ""}
            </text>
            <text
              x={p.x}
              y={chartHeight - 8}
              fontSize="8"
              textAnchor="middle"
              fill={isForPrint ? "#475569" : "var(--color-text-secondary)"}
              fontFamily="sans-serif"
            >
              {p.item.label}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // função para exportar o relatório diretamente para PDF utilizando a janela nativa de impressão
  // 1 - Gera dinamicamente um documento HTML formatado especificamente para folha A4 com estilos inline
  // 2 - Inclui cabeçalho corporativo, dados do operador emissor, KPIs, o gráfico SVG e tabela de itens
  // 3 - Abre uma janela de impressão isolada com window.open e aciona a rotina nativa window.print()
  const handleExportPdf = () => {
    if (!reportData) return;

    const summary = reportData.summary || {};
    const topProdutos = reportData.topProdutos || [];
    const printWindow = window.open("", "_blank", "width=850,height=900");

    if (!printWindow) {
      alert("Por favor, permita pop-ups no navegador para gerar a visualização em PDF do relatório.");
      return;
    }

    const svgElement = document.getElementById("report-svg-container");
    const svgHtml = svgElement ? svgElement.innerHTML : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Executivo de Vendas - Estoque.OS</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #4f46e5;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: #475569;
          }
          .title-section {
            margin-bottom: 14px;
          }
          .title-section h1 {
            font-size: 16px;
            margin: 0 0 4px 0;
            color: #1e293b;
          }
          .badge {
            display: inline-block;
            background: #e0e7ff;
            color: #3730a3;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 10px;
          }
          .kpi-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          .chart-section {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            background: #ffffff;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #1e293b;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: 6px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 6px 8px;
            border-bottom: 1px solid #cbd5e1;
            font-weight: 600;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }
          .text-right {
            text-align: right;
          }
          .footer {
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #94a3b8;
          }
          .signature-area {
            display: flex;
            justify-content: flex-end;
            margin-top: 35px;
          }
          .signature-line {
            width: 200px;
            border-top: 1px solid #64748b;
            text-align: center;
            padding-top: 4px;
            font-size: 9px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ESTOQUE<span>.OS</span></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Sistema de Gestão de Inventário e Movimentações</div>
          </div>
          <div class="meta-info">
            <div><strong>Emissão:</strong> ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Operador Emissor:</strong> ${currentUser?.nome || "Administrador"}</div>
            <div><strong>Status:</strong> Documento Oficial do Sistema</div>
          </div>
        </div>

        <div class="title-section">
          <h1>Relatório Consolidado de Desempenho de Vendas</h1>
          <div>
            <span class="badge">Período: ${reportData.periodLabel}</span>
            <span style="font-size: 10px; color: #64748b; margin-left: 8px;">
              (${new Date(reportData.startDate).toLocaleDateString("pt-BR")} até ${new Date(reportData.endDate).toLocaleDateString("pt-BR")})
            </span>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Faturamento Total</div>
            <div class="kpi-value" style="color: #4f46e5;">${formatCurrency(summary.totalVendasValor)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Itens Vendidos</div>
            <div class="kpi-value">${summary.totalVendasQuantidade || 0} unidades</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total de Saídas</div>
            <div class="kpi-value">${summary.totalTransacoes || 0} operações</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Médio / Venda</div>
            <div class="kpi-value">${formatCurrency(summary.ticketMedio)}</div>
          </div>
        </div>

        <div class="chart-section">
          <div class="section-title">
            <span>Evolução Cronológica de Vendas (${chartType === "barras" ? "Gráfico de Barras" : "Gráfico de Linha"})</span>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">Valores expressos em Reais (R$)</span>
          </div>
          <div>
            ${svgHtml}
          </div>
        </div>

        <div class="chart-section" style="margin-bottom: 0;">
          <div class="section-title">
            <span>Produtos Líderes de Vendas no Período</span>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">Top 5 por volume financeiro</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Produto</th>
                <th class="text-right" style="width: 100px;">Qtd. Vendida</th>
                <th class="text-right" style="width: 120px;">Faturamento Total</th>
                <th class="text-right" style="width: 80px;">Participação</th>
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
                        </tr>
                      `
                      )
                      .join("")
                  : `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">Nenhum produto vendido no período.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="signature-area">
          <div class="signature-line">
            Assinatura do Responsável
          </div>
        </div>

        <div class="footer">
          <div>Estoque.OS &bull; Livro-Razão & Auditoria de Movimentações &bull; Cópia autêntica gerada eletronicamente</div>
          <div>Página 1 de 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-purple/10 text-accent-purple">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-text-primary">Exportar Relatório de Vendas</h2>
              <p className="text-xs text-text-secondary">Visão consolidada do histórico de vendas com exportação direta para PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Barra de Controles: Período e Tipo de Gráfico */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)]">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-text-secondary mr-1" />
              <span className="text-xs font-semibold text-text-secondary mr-2">Período:</span>
              <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                {[
                  { id: "1m", label: "Último Mês (30d)" },
                  { id: "6m", label: "Últimos 6 Meses" },
                  { id: "1y", label: "Último 1 Ano" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      period === item.id
                        ? "bg-accent-purple text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <span className="text-xs font-semibold text-text-secondary mr-2">Gráfico:</span>
              <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => setChartType("barras")}
                  className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                    chartType === "barras"
                      ? "bg-accent-purple text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)]"
                  }`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartType("linhas")}
                  className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                    chartType === "linhas"
                      ? "bg-accent-purple text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)]"
                  }`}
                  title="Gráfico de Linha"
                >
                  <LineChart className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Consolidando métricas e histórico de vendas...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Cards de Métricas Consolidadas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-accent-purple text-xs font-semibold mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Faturamento Total
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
                    Total de Saídas
                  </div>
                  <div className="font-display text-base md:text-lg font-bold text-text-primary">
                    {reportData?.summary?.totalTransacoes || 0} ops.
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

              {/* Pré-visualização do Gráfico SVG */}
              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Evolução de Vendas no Período ({reportData?.periodLabel})
                  </h3>
                  <span className="text-[10px] text-text-secondary">Valores em R$</span>
                </div>
                <div id="report-svg-container" className="pt-2">
                  {renderSvgChart(false)}
                </div>
              </div>

              {/* Tabela de Produtos Líderes */}
              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                  Top 5 Produtos Mais Vendidos
                </h3>
                {reportData?.topProdutos?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-text-secondary">
                          <th className="pb-2 font-semibold">#</th>
                          <th className="pb-2 font-semibold">Produto</th>
                          <th className="pb-2 font-semibold text-right">Qtd. Vendida</th>
                          <th className="pb-2 font-semibold text-right">Faturamento</th>
                          <th className="pb-2 font-semibold text-right">% Participação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)]">
                        {reportData.topProdutos.map((prod, idx) => (
                          <tr key={prod.id} className="text-text-primary">
                            <td className="py-2 text-text-secondary font-mono">{idx + 1}</td>
                            <td className="py-2 font-medium">{prod.nome}</td>
                            <td className="py-2 text-right">{prod.quantidadeVendida} un.</td>
                            <td className="py-2 text-right font-semibold text-accent-purple">
                              {formatCurrency(prod.valorTotal)}
                            </td>
                            <td className="py-2 text-right text-text-secondary">{prod.percentual}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary text-center py-4">
                    Nenhum produto vendido no período selecionado.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="text-[11px] text-text-secondary">
            Documento pronto para exportação vetorial em folha A4
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportPdf}
              disabled={loading || !!error || !reportData}
              className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-accent-purple/20 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar em PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalExportarRelatorio;
