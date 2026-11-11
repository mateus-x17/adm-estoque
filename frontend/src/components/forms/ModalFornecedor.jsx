import React from "react";
import { createPortal } from "react-dom";
import { FiEdit, FiTrash, FiTruck, FiPower } from "react-icons/fi";

// arquivo responsável por exibir os detalhes de um fornecedor em modal com controles RBAC e Soft Delete

// função responsável por renderizar o modal de exibição dos detalhes de um fornecedor com ações RBAC.
//
// 1 - recebe fornecedor (object), fecharModal (function), callbacks de ação e flags canManage/canDelete (boolean).
// 2 - extrai contato e indicador de status inativo exibindo botões condicionais conforme a permissão.
// 3 - retorna o modal via createPortal ajustado para zoom 100% ou null quando fornecedor estiver vazio.
function ModalFornecedor({
  fornecedor,
  fecharModal,
  onEdit,
  onToggleStatus,
  onDelete,
  canManage = false,
  canDelete = false,
}) {
  if (!fornecedor) return null;

  const email = fornecedor.email || "—";
  const telefone = fornecedor.telefone || "—";
  const endereco = fornecedor.endereco || "—";
  const isInactive = fornecedor?.ativo === false;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-xl max-h-[92dvh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--color-border)] bg-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-display text-base font-semibold text-text-primary truncate">
              Detalhes do fornecedor
            </h2>
            {isInactive && (
              <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/25 font-mono text-[10px] uppercase shrink-0">
                Inativo
              </span>
            )}
          </div>
          <button
            onClick={fecharModal}
            className="text-xl text-text-secondary hover:text-text-primary transition-colors duration-200 px-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 custom-scrollbar">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center text-text-primary shrink-0">
              <FiTruck size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-lg font-semibold text-text-primary truncate">
                {fornecedor.nome}
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-0.5">
                #{fornecedor.id} • {isInactive ? "Inativo" : "Ativo"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

        <footer className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-[var(--color-border)] flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end bg-[var(--color-bg)]">
          {!canManage && (
            <button
              onClick={fecharModal}
              className="w-full sm:w-auto btn-secondary px-6 py-2.5 text-xs font-semibold"
            >
              Fechar
            </button>
          )}

          {canManage && (
            <>
              <button
                onClick={() => onToggleStatus?.(fornecedor)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[var(--color-border-light)] text-text-primary font-semibold text-xs hover:border-accent-purple/50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FiPower size={14} />
                {isInactive ? "Reativar" : "Inativar"}
              </button>

              <button
                onClick={() => onEdit?.(fornecedor)}
                className="w-full sm:w-auto btn-primary px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FiEdit size={14} />
                Editar
              </button>
            </>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete?.(fornecedor)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FiTrash size={14} />
              Excluir
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ModalFornecedor;
