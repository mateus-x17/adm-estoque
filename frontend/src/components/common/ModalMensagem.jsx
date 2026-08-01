import React from 'react'

function ModalMensagem({ mensagem, tipo, onClose }) {
  const isSucesso = tipo === 'sucesso'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-[var(--bg-elevated)] border border-[var(--line)] shadow-xl p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-md border ${
              isSucesso
                ? 'border-[var(--teal)]/30 text-[var(--teal)]'
                : 'border-[var(--danger)]/30 text-[var(--danger)]'
            }`}
          >
            {isSucesso ? '✓' : '✕'}
          </div>

          <h2 className="font-display text-base font-semibold text-[var(--ink)]">
            {isSucesso ? 'Operação realizada' : 'Ocorreu um erro'}
          </h2>
        </div>

        <p className="text-sm text-[var(--ink-soft)] mb-6">{mensagem}</p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-opacity duration-200 hover:opacity-90 ${
              isSucesso
                ? 'bg-[var(--teal)] text-white'
                : 'bg-[var(--danger)] text-white'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalMensagem