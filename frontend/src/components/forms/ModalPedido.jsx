import React from "react";
import { createPortal } from "react-dom";
import { FiArrowUpRight, FiArrowDownRight, FiBox } from "react-icons/fi";

function ModalPedido({ pedido, fecharModal }) {
  if (!pedido) return null;

  const dataCompacta = new Date(pedido.data).toLocaleDateString("pt-BR");
  const horaCompacta = new Date(pedido.data).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  const isEntrada = pedido.tipo === "ENTRADA";

  const badgeClass = isEntrada
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";
    
  const Icon = isEntrada ? FiArrowDownRight : FiArrowUpRight;
  const iconColor = isEntrada ? "text-accent-green" : "text-accent-red";
  const iconBg = isEntrada ? "bg-accent-green/10 border-accent-green" : "bg-accent-red/10 border-accent-red";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] bg-white/5">
          <h2 className="font-display text-lg font-semibold text-text-primary truncate">
            Detalhes do Pedido
          </h2>
          <button
            onClick={fecharModal}
            className="text-xl text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-text-primary break-words">
                  {pedido.produto?.nome || "Produto Desconhecido"}
                </h3>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border shrink-0 ${badgeClass}`}>
                  {pedido.tipo}
                </span>
              </div>
              <p className="font-mono text-xs text-text-secondary mt-1">Pedido #{pedido.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Quantidade
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{pedido.quantidade} unidades</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Responsável
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{pedido.usuario?.nome || "—"}</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Data
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{dataCompacta}</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Hora
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{horaCompacta}</p>
            </div>
          </div>
        </div>

        <footer className="px-6 py-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-3 sm:justify-end bg-[var(--color-bg)]">
          <button
            onClick={fecharModal}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[var(--color-border-light)] text-text-primary font-semibold text-xs hover:border-accent-purple/50 transition-colors duration-200"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ModalPedido;
