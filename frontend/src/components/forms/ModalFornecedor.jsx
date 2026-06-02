import React from "react";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

function ModalFornecedor({ fornecedor, fecharModal, onEdit, onDelete }) {
  if (!fornecedor) return null;

  const email = fornecedor.email || "—";
  const telefone = fornecedor.telefone || "—";
  const endereco = fornecedor.endereco || "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
            Detalhes do Fornecedor
          </h2>
          <button
            onClick={fecharModal}
            className="text-2xl text-gray-500 hover:text-red-500 transition"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FiTruck />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {fornecedor.nome}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                #{fornecedor.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-semibold">Email</span>
              <p className="break-words">{email}</p>
            </div>

            <div>
              <span className="font-semibold">Telefone</span>
              <p className="break-words">{telefone}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold">Endereço</span>
              <p className="mt-1 break-words">{endereco}</p>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => onEdit?.(fornecedor)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition flex items-center justify-center gap-2"
          >
            <FiEdit />
            Editar
          </button>

          <button
            onClick={() => onDelete?.(fornecedor.id)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2"
          >
            <FiTrash />
            Excluir
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ModalFornecedor;

