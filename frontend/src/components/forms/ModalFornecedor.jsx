import React from "react";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

function ModalFornecedor({ fornecedor, fecharModal, onEdit, onDelete }) {
  if (!fornecedor) return null;

  const email = fornecedor.email || "—";
  const telefone = fornecedor.telefone || "—";
  const endereco = fornecedor.endereco || "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[var(--bg-elevated)] border border-[var(--line)] rounded-lg shadow-xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)] truncate">
            Detalhes do fornecedor
          </h2>
          <button
            onClick={fecharModal}
            className="text-xl text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors duration-200"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-md border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
              <FiTruck size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-[var(--ink)] truncate">
                {fornecedor.nome}
              </h3>
              <p className="font-mono text-xs text-[var(--ink-soft)]">#{fornecedor.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Email
              </span>
              <p className="text-[var(--ink)] mt-1 break-words">{email}</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Telefone
              </span>
              <p className="text-[var(--ink)] mt-1 break-words">{telefone}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Endereço
              </span>
              <p className="text-[var(--ink)] mt-1 break-words">{endereco}</p>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-[var(--line)] flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => onEdit?.(fornecedor)}
            className="w-full sm:w-auto px-5 py-2 rounded-md border border-[var(--accent)]/40 text-[var(--accent)] font-medium text-sm hover:bg-[var(--accent)]/10 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FiEdit size={15} />
            Editar
          </button>

          <button
            onClick={() => onDelete?.(fornecedor.id)}
            className="w-full sm:w-auto px-5 py-2 rounded-md border border-[var(--danger)]/40 text-[var(--danger)] font-medium text-sm hover:bg-[var(--danger-soft)] transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FiTrash size={15} />
            Excluir
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ModalFornecedor;