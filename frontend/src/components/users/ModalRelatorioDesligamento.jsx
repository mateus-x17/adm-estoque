import React from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiX, FiCheckCircle } from "react-icons/fi";

// arquivo responsável pela exibição e impressão A4 do Relatório Final de Desligamento filtrado por meses trabalhados

const formatBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

// função para gerar impressão/PDF A4 do relatório trabalhista mantendo apenas Nome, E-mail, Matrícula Cancelada, Início e Término
function printDismissalReportPdf(relatorio) {
  const win = window.open("", "_blank", "width=900,height=720");
  if (!win || !relatorio) return;

  const { vendedor, resumo, vendasPorMes = [], topProdutos = [] } = relatorio;

  const mesesRows = vendasPorMes
    .map(
      (m) => `
      <tr>
        <td>${m.label}</td>
        <td style="text-align:center">${m.pedidosConcluidos}</td>
        <td style="text-align:center">${m.pecas}</td>
        <td style="text-align:right;font-weight:700">${formatBRL(m.faturamento)}</td>
      </tr>`
    )
    .join("");

  const produtosRows = topProdutos
    .map(
      (p, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${p.nome}</td>
        <td style="text-align:center">${p.quantidade}</td>
        <td style="text-align:right;font-weight:700">${formatBRL(p.faturamento)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Relatório de Desligamento - ${vendedor.nome}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; padding: 28px; font-size: 12px; }
      .header { border-bottom: 2px solid #7c3aed; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
      h1 { margin: 0 0 6px; font-size: 20px; color: #111827; }
      .badge-cancel { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #fee2e2; color: #b91c1c; font-family: monospace; font-weight: 700; font-size: 11px; border: 1px solid #fecaca; }
      .id-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 18px; }
      .id-box small { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; }
      .id-box strong { font-size: 13px; color: #111827; }
      .dates-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
      .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
      .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
      .kpi small { font-size: 10px; text-transform: uppercase; color: #6b7280; display: block; }
      .kpi strong { font-size: 16px; color: #111827; margin-top: 4px; display: block; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; margin: 18px 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
      th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; color: #4b5563; }
      @media print { body { padding: 12px; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>Relatório Final de Desligamento &amp; Vendas</h1>
        <span style="color:#6b7280">Histórico consolidado filtrado pelos meses de atuação na empresa</span>
      </div>
      <span class="badge-cancel">${vendedor.matriculaDisplay}</span>
    </div>

    <div class="id-box">
      <div><small>Nome</small><strong>${vendedor.nome}</strong></div>
      <div><small>E-mail</small><strong>${vendedor.email}</strong></div>
      <div><small>Matrícula</small><strong>${vendedor.matriculaDisplay}</strong></div>
    </div>

    <div class="dates-box">
      <div class="kpi"><small>Data de Início</small><strong>${formatDateBR(vendedor.dataInicio)}</strong></div>
      <div class="kpi"><small>Data de Término</small><strong>${formatDateBR(vendedor.dataTermino)}</strong></div>
    </div>

    <div class="kpis">
      <div class="kpi"><small>Faturamento Total</small><strong>${formatBRL(resumo.faturamentoTotal)}</strong></div>
      <div class="kpi"><small>Pedidos Concluídos</small><strong>${resumo.totalPedidosConcluidos}</strong></div>
      <div class="kpi"><small>Peças Vendidas</small><strong>${resumo.totalPecas} un.</strong></div>
      <div class="kpi"><small>Ticket Médio</small><strong>${formatBRL(resumo.ticketMedio)}</strong></div>
    </div>

    <h2>Vendas Mês a Mês no Período Trabalhado (${formatDateBR(vendedor.dataInicio)} a ${formatDateBR(vendedor.dataTermino)})</h2>
    <table>
      <thead>
        <tr>
          <th>Mês / Competência</th>
          <th style="text-align:center">Pedidos Concluídos</th>
          <th style="text-align:center">Peças</th>
          <th style="text-align:right">Faturamento</th>
        </tr>
      </thead>
      <tbody>
        ${mesesRows || '<tr><td colspan="4" style="text-align:center;color:#6b7280">Nenhuma venda registrada no período trabalhado.</td></tr>'}
      </tbody>
    </table>

    ${
      topProdutos.length > 0
        ? `<h2>Produtos Mais Vendidos Durante o Vínculo</h2>
           <table>
             <thead>
               <tr><th>#</th><th>Produto</th><th style="text-align:center">Quantidade</th><th style="text-align:right">Total</th></tr>
             </thead>
             <tbody>${produtosRows}</tbody>
           </table>`
        : ""
    }
  </body>
  </html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// função para exibir modal pós-demissão com histórico mensal entre dataInicio e dataTermino
const ModalRelatorioDesligamento = ({ relatorio, onClose }) => {
  if (!relatorio) return null;

  const { vendedor, resumo, vendasPorMes = [], topProdutos = [] } = relatorio;

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border-light)] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-[var(--color-border-light)] flex items-start justify-between gap-4 bg-[var(--color-surface)]/50">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              <FiCheckCircle size={13} /> Matrícula Cancelada &amp; Relatório Gerado
            </span>
            <h2 className="font-display text-xl font-bold text-text-primary mt-1">
              Relatório Final de Desligamento
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Identificação enxuta: Nome, E-mail e Matrícula Cancelada */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
            <div>
              <span className="text-[10px] font-mono uppercase text-text-secondary">Nome</span>
              <p className="text-sm font-semibold text-text-primary mt-0.5 truncate">{vendedor.nome}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-text-secondary">E-mail</span>
              <p className="text-sm font-medium text-text-primary mt-0.5 truncate">{vendedor.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-text-secondary">Matrícula</span>
              <p className="mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-accent-red/15 text-accent-red border border-accent-red/30">
                  {vendedor.matriculaDisplay}
                </span>
              </p>
            </div>
          </div>

          {/* Data de Início e Data de Término */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--color-surface)]/60 border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Data de Início</span>
              <p className="text-sm font-bold text-text-primary mt-1">
                {formatDateBR(vendedor.dataInicio)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--color-surface)]/60 border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Data de Término</span>
              <p className="text-sm font-bold text-text-primary mt-1">
                {formatDateBR(vendedor.dataTermino)}
              </p>
            </div>
          </div>

          {/* KPIs consolidados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/40">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Faturamento</span>
              <p className="text-base font-bold text-accent-purple mt-1">
                {formatBRL(resumo.faturamentoTotal)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/40">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Pedidos</span>
              <p className="text-base font-bold text-text-primary mt-1">
                {resumo.totalPedidosConcluidos}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/40">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Peças</span>
              <p className="text-base font-bold text-text-primary mt-1">{resumo.totalPecas} un.</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/40">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Ticket Médio</span>
              <p className="text-base font-bold text-text-primary mt-1">
                {formatBRL(resumo.ticketMedio)}
              </p>
            </div>
          </div>

          {/* Tabela mês a mês filtrada pelos meses em que trabalhou */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
              Vendas Filtradas pelos Meses Trabalhados
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-light)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--color-surface)] text-text-secondary">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Competência</th>
                    <th className="text-center px-4 py-2.5 font-medium">Pedidos</th>
                    <th className="text-center px-4 py-2.5 font-medium">Peças</th>
                    <th className="text-right px-4 py-2.5 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {vendasPorMes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-text-secondary">
                        Nenhuma venda concluída durante o vínculo.
                      </td>
                    </tr>
                  ) : (
                    vendasPorMes.map((m) => (
                      <tr key={m.mes} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 font-medium text-text-primary">{m.label}</td>
                        <td className="px-4 py-2.5 text-center text-text-secondary">
                          {m.pedidosConcluidos}
                        </td>
                        <td className="px-4 py-2.5 text-center text-text-secondary">{m.pecas}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                          {formatBRL(m.faturamento)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {topProdutos.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
                Principais Produtos Vendidos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topProdutos.slice(0, 6).map((p) => (
                  <div
                    key={p.produtoId}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)]/40 border border-[var(--color-border-light)] text-xs"
                  >
                    <span className="truncate font-medium text-text-primary pr-2">{p.nome}</span>
                    <span className="font-mono text-text-secondary shrink-0">
                      {p.quantidade}x · {formatBRL(p.faturamento)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/30 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs font-semibold"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => printDismissalReportPdf(relatorio)}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <FiPrinter size={14} />
            Imprimir / Salvar PDF A4
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalRelatorioDesligamento;

