import React from "react";
import { createPortal } from "react-dom";

const ModalConfirmacao = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar" }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-6 flex flex-col text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-full border border-[var(--color-border-light)] text-text-primary font-semibold text-sm hover:bg-[var(--color-surface)] transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-full bg-accent-red text-white font-semibold text-sm shadow-lg shadow-accent-red/20 hover:shadow-accent-red/40 transition-all duration-300"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalConfirmacao;
