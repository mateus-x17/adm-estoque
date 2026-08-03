import React from "react";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

const FornecedorRow = ({ fornecedor, index, onEdit, onDelete, onOpenDetails }) => {
  const email = fornecedor.email || "";
  const telefone = fornecedor.telefone || "";
  const contatoCompacto = [email, telefone].filter(Boolean).join(" • ") || "—";

  return (
    <tr
      style={{ animationDelay: `${index * 0.04}s` }}
      className="block md:table-row border-b border-[var(--line)] hover:bg-[var(--line)]/20 transition-colors duration-200 animate-fade-up"
    >
      {/* Mobile */}
      <td
        className="block md:hidden p-4 space-y-3 cursor-pointer"
        onClick={() => onOpenDetails?.(fornecedor)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
              <FiTruck size={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{fornecedor.nome}</p>
              <p className="font-mono text-[11px] text-[var(--ink-soft)]">#{fornecedor.id}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(fornecedor);
              }}
              className="p-2 text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              <FiEdit size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(fornecedor.id);
              }}
              className="p-2 text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors duration-200"
            >
              <FiTrash size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-[var(--ink-soft)]">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
              Contato
            </span>
            <span className="text-[var(--ink)] break-words">{contatoCompacto}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
              Endereço
            </span>
            <span className="text-[var(--ink)]">{fornecedor.endereco || "—"}</span>
          </div>
        </div>
      </td>

      {/* Desktop */}
      <td className="hidden md:table-cell px-6 py-3 font-mono text-xs text-[var(--ink-soft)]">
        #{fornecedor.id}
      </td>
      <td
        className="hidden md:table-cell px-6 py-3 text-sm font-medium text-[var(--ink)] cursor-pointer"
        onClick={() => onOpenDetails?.(fornecedor)}
        title="Clique para ver detalhes"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md border border-[var(--line)] flex items-center justify-center text-[var(--ink-soft)]">
            <FiTruck size={13} />
          </div>
          {fornecedor.nome}
        </div>
      </td>
      <td
        className="hidden md:table-cell px-6 py-3 cursor-pointer"
        onClick={() => onOpenDetails?.(fornecedor)}
        title="Clique para ver detalhes"
      >
        <div className="max-w-[280px]">
          <p className="truncate text-sm text-[var(--ink)]">{email || "—"}</p>
          <p className="truncate font-mono text-xs text-[var(--ink-soft)]">{telefone || "—"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell px-6 py-3 text-sm text-[var(--ink-soft)]">
        <p className="max-w-[360px] truncate" title={fornecedor.endereco || ""}>
          {fornecedor.endereco || "—"}
        </p>
      </td>
      <td className="hidden md:table-cell px-6 py-3">
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onEdit(fornecedor)}
            className="text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(fornecedor.id)}
            className="text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors duration-200"
          >
            <FiTrash size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default FornecedorRow;