import React, { useState } from "react";
import EditarItem from "./EditarItem.jsx";

import ModalMensagem from "./ModalMensagem.jsx";


function ModalProduto({ produtoSelecionado, fecharModal, onItemUpdated }) {
  const [editando, setEditando] = useState(false);
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });


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
            Detalhes do Produto
          </h2>
          <button
            onClick={fecharModal}
            className="text-2xl text-gray-500 hover:text-red-500 transition"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col items-center text-center mb-6">
            {produtoSelecionado.imagem && (
              <img
                src={`http://localhost:5000${produtoSelecionado.imagem.startsWith("/") ? "" : "/"
                  }${produtoSelecionado.imagem}`}
                alt={produtoSelecionado.nome}
                className="w-32 h-32 sm:w-36 sm:h-36 object-cover rounded-xl shadow mb-4"
              />
            )}

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {produtoSelecionado.nome}
            </h3>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Categoria: {produtoSelecionado?.categoria?.nome || "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="sm:col-span-2">
              <span className="font-semibold">Descrição</span>
              <p className="mt-1 break-words">
                {produtoSelecionado.descricao || "—"}
              </p>
            </div>

            <div>
              <span className="font-semibold">Preço</span>
              <p>R$ {produtoSelecionado.preco || "—"}</p>
            </div>

            <div>
              <span className="font-semibold">Quantidade</span>
              <p>{produtoSelecionado.quantidade || "—"}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold">Fornecedor</span>
              <p>{produtoSelecionado?.fornecedor?.nome || "—"}</p>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setEditando(true)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition"
          >
            Editar
          </button>

          <button
            onClick={() => {
              // Em um sistema real, aqui chamaria o productsApi.deleteProduct(id)
              setModalMsg({
                visible: true,
                mensagem: `Funcionalidade de excluir ${produtoSelecionado.nome} (Simulada)`,
                tipo: "sucesso"
              });
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition"
          >
            Excluir
          </button>

        </footer>
      </div>

      {editando && (
        <EditarItem
          type="produto"
          itemData={produtoSelecionado}
          onClose={() => setEditando(false)}
          onItemUpdated={(produtoAtualizado) => {
            if (onItemUpdated) onItemUpdated(produtoAtualizado);
            setEditando(false);
          }}
        />
      )}


      {modalMsg.visible && (
        <ModalMensagem
          mensagem={modalMsg.mensagem}
          tipo={modalMsg.tipo}
          onClose={() => {
            setModalMsg({ visible: false });
            if (modalMsg.tipo === "sucesso") fecharModal();
          }}
        />
      )}
    </div>

  );
}

export default ModalProduto;
