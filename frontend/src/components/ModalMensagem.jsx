import React from 'react';

function ModalMensagem({ mensagem, tipo, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className={`relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-[90%] max-w-sm transform animate-scaleIn border-l-4 ${
        tipo === 'sucesso' ? 'border-green-500' : 'border-red-500'
      }`}>
        
        {/* Título */}
        <h2 className={`text-lg font-bold mb-3 ${
          tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'
        }`}>
          {tipo === 'sucesso' ? 'Sucesso' : 'Erro'}
        </h2>

        {/* Mensagem */}
        <p className="mb-4 text-gray-700 dark:text-gray-300">{mensagem}</p>

        {/* Botão */}
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 rounded-lg transition ${
            tipo === 'sucesso'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default ModalMensagem;
