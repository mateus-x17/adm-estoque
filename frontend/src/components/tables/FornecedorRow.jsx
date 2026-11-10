import React from "react";
import { FiEdit, FiTrash, FiTruck, FiPower } from "react-icons/fi";

// arquivo responsável por exibir uma linha de fornecedor com status ativo/inativo e ações RBAC

// componente de linha de fornecedor
// 1 - Exibe nome, contato, endereço e badge de inatividade quando aplicável
// 2 - Renderiza ações de edição, inativação/reativação e exclusão de acordo com o cargo do usuário
const FornecedorRow = ({
  fornecedor,
  index,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenDetails,
  canManage = false,
  canDelete = false,
}) => {
  const email = fornecedor.email || "";
  const telefone = fornecedor.telefone || "";
  const contatoCompacto = [email, telefone].filter(Boolean).join(" • ") || "—";
  const isInactive = fornecedor?.ativo === false;

  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className={`glass-card hover-card flex flex-col md:flex-row justify-between p-4 md:px-5 md:py-4 gap-3 md:gap-4 animate-fade-up cursor-pointer ${
        isInactive ? "opacity-75 border-dashed" : ""
      }`}
      onClick={() => onOpenDetails?.(fornecedor)}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-accent-purple/5 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
          <FiTruck size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-text-secondary shrink-0">#{fornecedor.id}</span>
            <p className="text-sm font-semibold text-text-primary truncate">{fornecedor.nome}</p>
            {isInactive && (
              <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/25 font-mono text-[10px] uppercase shrink-0">
                Inativo
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
            {contatoCompacto}
          </p>
          <p className="text-xs font-secondary text-text-secondary mt-0.5 truncate hidden md:block">
            {fornecedor.endereco || "Endereço não informado"}
          </p>
        </div>
      </div>

      <div
        className="flex justify-between items-center md:justify-end gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-text-secondary md:hidden truncate flex-1">
          {fornecedor.endereco || "—"}
        </div>

        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(fornecedor);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-pink hover:bg-white/5 transition-all duration-200"
              title="Editar fornecedor"
            >
              <FiEdit size={16} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(fornecedor);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                isInactive
                  ? "text-accent-green hover:bg-accent-green/10"
                  : "text-text-secondary hover:text-amber-400 hover:bg-white/5"
              }`}
              title={isInactive ? "Reativar fornecedor" : "Inativar fornecedor"}
            >
              <FiPower size={16} />
            </button>

            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(fornecedor);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-red hover:bg-white/5 transition-all duration-200"
                title="Excluir fornecedor"
              >
                <FiTrash size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FornecedorRow;
