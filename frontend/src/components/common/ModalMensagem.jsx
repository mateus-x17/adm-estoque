import React from 'react'

function ModalMensagem({ mensagem, tipo, onClose }) {
  const isSucesso = tipo === 'sucesso'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-scaleIn">

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${isSucesso
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600'
              }`}
          >
            {isSucesso ? '✓' : '✕'}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isSucesso ? 'Operação realizada' : 'Ocorreu um erro'}
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {mensagem}
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${isSucesso
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
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
