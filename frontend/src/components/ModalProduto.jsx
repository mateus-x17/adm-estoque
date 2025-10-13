import React, { useState } from "react";
import EditarItem from "./EditarItem.jsx";

function ModalProduto({ produtoSelecionado, fecharModal, onItemUpdated }) {
  const [editando, setEditando] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={fecharModal}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-xl relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={fecharModal}
          className="absolute top-2 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500 text-2xl"
        >
          ×
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={`http://localhost:5000${produtoSelecionado.imagem.startsWith('/') ? '' : '/'}${produtoSelecionado.imagem}`}
            alt={produtoSelecionado.nome}
            className="w-32 h-32 object-cover rounded-lg mb-4 shadow"
          />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {produtoSelecionado.nome}
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Categoria: {produtoSelecionado?.categoria?.nome || "—"}
          </p>

          <div className="text-gray-700 dark:text-gray-300 text-sm text-left w-full space-y-1 mb-5">
            <p><strong>Descrição:</strong> {produtoSelecionado.descricao}</p>
            <p><strong>Preço:</strong> R$ {produtoSelecionado.preco}</p>
            <p><strong>Quantidade:</strong> {produtoSelecionado.quantidade}</p>
            <p><strong>Fornecedor:</strong> {produtoSelecionado?.fornecedor?.nome || "—"}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setEditando(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2 rounded-lg transition"
            >
              Editar
            </button>
            <button
              onClick={() => alert(`Excluir produto: ${produtoSelecionado.nome}`)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Modal lateral de edição */}
      {editando && (
        <EditarItem
          type="produto"
          itemData={produtoSelecionado}
          onClose={() => setEditando(false)}
          onItemUpdated={(produtoAtualizado) => {
            if (onItemUpdated) onItemUpdated(produtoAtualizado);
            setEditando(false); // fecha edição automaticamente
          }}
        />
      )}
    </div>
  );
}

export default ModalProduto;
