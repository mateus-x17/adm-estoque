import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiX } from "react-icons/fi";

function ModalMensagem({ mensagem, tipo, onClose, autoCloseTime = 4000 }) {
  const isSucesso = tipo === 'sucesso';

  useEffect(() => {
    if (autoCloseTime > 0 && onClose) {
      const timer = setTimeout(onClose, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoCloseTime, onClose]);

  return createPortal(
    <div className="fixed top-6 right-6 z-[9999] animate-scale-in pointer-events-auto">
      <div className="flex items-center gap-4 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-2xl p-4 shadow-2xl min-w-[300px] max-w-sm">
        <div
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border ${
            isSucesso
              ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
              : 'border-accent-red/30 bg-accent-red/10 text-accent-red'
          }`}
        >
          {isSucesso ? <FiCheck size={18} /> : <FiX size={18} />}
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="font-display text-sm font-semibold text-text-primary mb-0.5">
            {isSucesso ? 'Sucesso' : 'Erro'}
          </h2>
          <p className="text-xs text-text-secondary leading-snug break-words">
            {mensagem}
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-[var(--color-surface)] transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}

export default ModalMensagem;