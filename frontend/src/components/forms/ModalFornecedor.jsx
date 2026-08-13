import React from "react";
import { createPortal } from "react-dom";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

function ModalFornecedor({ fornecedor, fecharModal, onEdit, onDelete }) {
  if (!fornecedor) return null;

  const email = fornecedor.email || "—";
  const telefone = fornecedor.telefone || "—";
  const endereco = fornecedor.endereco || "—";

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
            Detalhes do fornecedor
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
            <div className="w-12 h-12 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center text-text-primary shrink-0">
              <FiTruck size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-text-primary truncate">
                {fornecedor.nome}
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-1">#{fornecedor.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Email
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{email}</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Telefone
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{telefone}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
                Endereço
              </span>
              <p className="text-text-primary font-medium mt-1 break-words">{endereco}</p>
            </div>
          </div>
        </div>

        <footer className="px-6 py-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-3 sm:justify-end bg-[var(--color-bg)]">
          <button
            onClick={() => onEdit?.(fornecedor)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[var(--color-border-light)] text-text-primary font-semibold text-xs hover:border-accent-purple/50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FiEdit size={14} />
            Editar
          </button>

          <button
            onClick={() => onDelete?.(fornecedor.id)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiTrash size={14} />
            Excluir
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ModalFornecedor;