import React from "react";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

const FornecedorRow = ({ fornecedor, index, onEdit, onDelete, onOpenDetails }) => {
  const email = fornecedor.email || "";
  const telefone = fornecedor.telefone || "";
  const contatoCompacto = [email, telefone].filter(Boolean).join(" • ") || "—";

  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className="glass-card hover-card flex flex-col md:flex-row justify-between p-4 md:px-5 md:py-4 gap-4 animate-fade-up cursor-pointer"
      onClick={() => onOpenDetails?.(fornecedor)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-accent-purple/5 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
          <FiTruck size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-secondary shrink-0">#{fornecedor.id}</span>
            <p className="text-sm font-semibold text-text-primary truncate">{fornecedor.nome}</p>
          </div>
          <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
            {contatoCompacto}
          </p>
          <p className="text-xs font-secondary text-text-secondary mt-0.5 truncate hidden md:block">
            {fornecedor.endereco || "Endereço não informado"}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center md:justify-end gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs text-text-secondary md:hidden truncate flex-1">
          {fornecedor.endereco || "—"}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(fornecedor);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-pink hover:bg-white/5 transition-all duration-200"
            title="Editar"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(fornecedor.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-red hover:bg-white/5 transition-all duration-200"
            title="Excluir"
          >
            <FiTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FornecedorRow;