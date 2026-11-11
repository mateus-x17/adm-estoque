import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from "lucide-react";

// arquivo responsável pelo modal padronizado de confirmação, aviso e entrada de justificativa do sistema

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconWrap: "bg-accent-red/10 text-accent-red border-accent-red/25",
    confirmBtn: "bg-accent-red text-white shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-500/10 text-amber-500 border-amber-500/25",
    confirmBtn: "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600",
  },
  primary: {
    icon: CheckCircle2,
    iconWrap: "bg-accent-purple/10 text-accent-purple border-accent-purple/25",
    confirmBtn: "btn-primary",
  },
  info: {
    icon: Info,
    iconWrap: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    confirmBtn: "bg-accent-purple text-white shadow-lg shadow-accent-purple/20 hover:opacity-95",
  },
};

// função responsável pelo modal padronizado de confirmação com suporte opcional a data e justificativa.
//
// 1 - recebe isOpen, title, message, onConfirm, onCancel, rótulos, variante semântica e campos opcionais de input/data.
// 2 - registra atalho de teclado Escape enquanto aberto e aplica tema visual da variante selecionada.
// 3 - retorna o modal centralizado via createPortal com rolagem segura ou null quando fechado.
const ModalConfirmacao = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  showCancel = true,
  loading = false,
  withInput = false,
  inputLabel = "",
  inputPlaceholder = "",
  inputValue = "",
  onInputChange = null,
  withDateInput = false,
  dateLabel = "",
  dateValue = "",
  onDateChange = null,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) onCancel?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const Icon = cfg.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 transition-opacity duration-300 animate-fade-in"
      onClick={() => !loading && onCancel?.()}
    >
      <div
        className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto custom-scrollbar bg-[var(--color-bg)] border border-[var(--color-border)] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] p-5 flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => !loading && onCancel?.()}
          aria-label="Fechar"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[var(--color-surface)] transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 ${cfg.iconWrap}`}>
            <Icon size={20} />
          </div>

          <h3 className="font-display text-lg font-bold text-text-primary mb-1.5">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line mb-4">
            {message}
          </p>
        </div>

        {withDateInput && (
          <div className="mb-4 text-left">
            {dateLabel && (
              <label className="block text-[11px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                {dateLabel}
              </label>
            )}
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
            />
          </div>
        )}

        {withInput && (
          <div className="mb-5 text-left">
            {inputLabel && (
              <label className="block text-[11px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                {inputLabel}
              </label>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full mt-1">
          {showCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-full border border-[var(--color-border-light)] text-text-primary font-semibold text-xs sm:text-sm hover:bg-[var(--color-surface)] transition-colors duration-200 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full sm:flex-1 px-4 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 ${cfg.confirmBtn}`}
          >
            {loading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalConfirmacao;
