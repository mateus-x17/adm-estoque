import React from "react";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

const MovimentacaoRow = ({ movimentacao, abrirModal, index }) => {
  const dataCompacta = new Date(movimentacao.data).toLocaleDateString("pt-BR");
  const isEntrada = movimentacao.tipo === "ENTRADA";

  const badgeClass = isEntrada
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";
    
  const Icon = isEntrada ? FiArrowDownRight : FiArrowUpRight;
  const iconColor = isEntrada ? "text-accent-green" : "text-accent-red";
  const iconBg = isEntrada ? "bg-accent-green/10 border-accent-green" : "bg-accent-red/10 border-accent-red";

  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className="glass-card hover-card flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 animate-fade-up"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${iconBg} ${iconColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text-primary text-sm truncate">
              {movimentacao.produto.nome}
            </p>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border ${badgeClass}`}>
              {movimentacao.tipo}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs font-mono text-text-secondary truncate">
              Qtd: <span className="font-semibold text-text-primary">{movimentacao.quantidade}</span>
            </p>
            <span className="w-1 h-1 rounded-full bg-[var(--color-border-light)]"></span>
            <p className="text-xs font-mono text-text-secondary truncate">
              {movimentacao.usuario?.nome || "Sistema"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
        <p className="font-mono text-xs text-text-secondary">{dataCompacta}</p>
        <button
          onClick={() => abrirModal(movimentacao)}
          className="btn-secondary px-4 py-2 text-xs font-semibold"
        >
          Detalhes
        </button>
      </div>
    </div>
  );
};

export default MovimentacaoRow;