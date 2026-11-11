import React from "react";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

// arquivo responsável por renderizar linha do livro-razão unitário com suporte a snapshot de ex-colaborador, estorno e pedido vinculado

// função responsável por renderizar uma linha resumida de movimentação no histórico com snapshot de vendedor.
//
// 1 - recebe movimentacao (object), abrirModal (function) e index (number).
// 2 - identifica tipo da operação, status de estorno, código do pedido e possível ex-colaborador.
// 3 - retorna o cartão compacto com botão de abertura do modal de auditoria.
const MovimentacaoRow = ({ movimentacao, abrirModal, index }) => {
  const dataCompacta = new Date(movimentacao.data).toLocaleDateString("pt-BR");
  const isVenda = movimentacao.tipo === "VENDA" || movimentacao.tipo === "SAIDA";
  const isEstorno = Boolean(movimentacao.estorno);

  const badgeClass = isEstorno
    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
    : isVenda
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";

  const Icon = isVenda ? FiArrowUpRight : FiArrowDownRight;
  const iconColor = isVenda ? "text-accent-green" : "text-accent-red";
  const iconBg = isVenda
    ? "bg-accent-green/10 border-accent-green"
    : "bg-accent-red/10 border-accent-red";
  const labelTipo = isVenda ? "VENDA" : "REPOSIÇÃO";

  const vendedorNome =
    movimentacao.usuario?.nome || movimentacao.vendedorNomeSnapshot || "Sistema";
  const vendedorRef = movimentacao.vendedorRefId ? `#${movimentacao.vendedorRefId}` : "";
  const isDeletedSeller = !movimentacao.usuario && Boolean(movimentacao.vendedorNomeSnapshot);

  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className="glass-card hover-card flex flex-col md:flex-row md:items-center justify-between p-3 sm:px-4 sm:py-3 gap-3 animate-fade-up"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${iconBg} ${iconColor}`}
        >
          <Icon size={16} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text-primary text-sm truncate">
              {movimentacao.produto?.nome}
            </p>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border ${badgeClass}`}>
              {labelTipo}
              {isEstorno ? " (Estorno)" : ""}
            </span>
            {movimentacao.pedido?.codigo && (
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] text-text-secondary">
                {movimentacao.pedido.codigo}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
            <p className="text-xs font-mono text-text-secondary">
              Qtd: <span className="font-semibold text-text-primary">{movimentacao.quantidade}</span>
            </p>
            <span className="w-1 h-1 rounded-full bg-[var(--color-border-light)]" />
            <p className="text-xs font-mono text-text-secondary truncate">
              {vendedorNome} {vendedorRef}
              {isDeletedSeller ? " (Ex-colab.)" : ""}
            </p>
            {movimentacao.loja?.nome && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--color-border-light)]" />
                <p className="text-[11px] font-mono text-text-secondary truncate">
                  @{movimentacao.loja.nome}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
        <p className="font-mono text-xs text-text-secondary">{dataCompacta}</p>
        <button
          onClick={() => abrirModal(movimentacao)}
          className="btn-secondary px-3.5 py-1.5 text-xs font-semibold"
        >
          Detalhes
        </button>
      </div>
    </div>
  );
};

export default MovimentacaoRow;
