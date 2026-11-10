import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

// arquivo responsável pelo toast/modal flutuante de notificações com desaparecimento gradual (fade-out)

// componente toast de sucesso ou erro
// 1 - Respeita visible=true por padrão e não renderiza se visible=false ou mensagem vazia
// 2 - Aplica animação suave de fade-out antes de executar onClose ao expirar autoCloseTime ou clicar em fechar
function ModalMensagem({ visible = true, mensagem, tipo, onClose, autoCloseTime = 3500 }) {
  const isSucesso = tipo === "sucesso";
  const [isLeaving, setIsLeaving] = useState(false);
  const closeTimerRef = useRef(null);

  const handleGradualClose = useCallback(() => {
    setIsLeaving(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsLeaving(false);
      onClose?.();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    if (!visible || !mensagem) {
      setIsLeaving(false);
      return;
    }

    setIsLeaving(false);
    let fadeStartTimer = null;

    if (autoCloseTime > 0 && onClose) {
      fadeStartTimer = setTimeout(() => {
        handleGradualClose();
      }, autoCloseTime);
    }

    return () => {
      clearTimeout(fadeStartTimer);
      clearTimeout(closeTimerRef.current);
    };
  }, [visible, mensagem, autoCloseTime, onClose, handleGradualClose]);

  if (!visible || !mensagem) return null;

  return createPortal(
    <div
      className={`fixed top-5 right-5 z-[9999] pointer-events-auto transition-all duration-400 ease-out ${
        isLeaving ? "opacity-0 -translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100 animate-scale-in"
      }`}
    >
      <div className="flex items-center gap-3.5 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-2xl p-4 shadow-2xl min-w-[290px] max-w-sm">
        <div
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border ${
            isSucesso
              ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
              : "border-accent-red/30 bg-accent-red/10 text-accent-red"
          }`}
        >
          {isSucesso ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h2 className="font-display text-sm font-semibold text-text-primary mb-0.5">
            {isSucesso ? "Sucesso" : "Atenção"}
          </h2>
          <p className="text-xs text-text-secondary leading-snug break-words">{mensagem}</p>
        </div>

        <button
          type="button"
          onClick={handleGradualClose}
          aria-label="Fechar notificação"
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
