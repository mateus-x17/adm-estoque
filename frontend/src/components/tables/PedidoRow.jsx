import React from "react";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

const PedidoRow = ({ pedido, index, onClick }) => {
  const dataCompacta = new Date(pedido.data).toLocaleDateString("pt-BR");
  const horaCompacta = new Date(pedido.data).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  const isEntrada = pedido.tipo === "ENTRADA";

  const badgeClass = isEntrada
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";
    
  const Icon = isEntrada ? FiArrowDownRight : FiArrowUpRight;
  const iconColor = isEntrada ? "text-accent-green" : "text-accent-red";
  const iconBg = isEntrada ? "bg-accent-green/10 border-accent-green" : "bg-accent-red/10 border-accent-red";

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 0.04}s` }}
      className="glass-card hover-card flex flex-row items-center justify-between p-4 gap-4 animate-fade-up cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 hidden sm:flex ${iconBg} ${iconColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text-primary text-sm break-words">
              {pedido.produto?.nome}
            </p>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border shrink-0 ${badgeClass}`}>
              {pedido.tipo}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <p className="text-xs font-mono text-text-secondary">
              ID: <span className="font-semibold text-text-primary">#{pedido.id}</span>
            </p>
            <span className="w-1 h-1 rounded-full bg-[var(--color-border-light)] hidden sm:block"></span>
            <p className="text-xs font-mono text-text-secondary">
              Resp: <span className="text-text-primary">{pedido.usuario?.nome}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-center shrink-0 pl-3 border-l border-[var(--color-border-light)]">
        <p className="font-mono text-xs text-text-secondary">{dataCompacta}</p>
        <p className="font-mono text-[10px] text-text-secondary opacity-70 mt-0.5">{horaCompacta}</p>
      </div>
    </div>
  );
};

export default PedidoRow;
