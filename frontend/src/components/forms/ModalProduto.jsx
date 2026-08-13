import React, { useState } from "react";
import { createPortal } from "react-dom";
import EditarItem from "./EditarItem.jsx";
import ModalMensagem from "../common/ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

function ModalProduto({ produtoSelecionado, fecharModal, onItemUpdated }) {
  const [editando, setEditando] = useState(false);
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-white/5">
          <h2 className="font-display text-base font-semibold text-text-primary truncate">
            Detalhes do produto
          </h2>
          <button
            onClick={fecharModal}
            className="text-xl text-text-secondary hover:text-text-primary transition-colors duration-200 leading-none"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
          <div className="flex flex-col items-center text-center mb-6">
            {produtoSelecionado.imagem ? (
              <img
                src={formatImageUrl(produtoSelecionado.imagem)}
                alt={produtoSelecionado.nome}
                className="w-24 h-24 object-cover rounded-2xl border-2 border-[var(--color-border)] mb-3 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-2 border-[var(--color-border-light)] bg-[var(--color-surface)] mb-3 flex items-center justify-center text-text-secondary">
                Sem Imagem
              </div>
            )}

            <h3 className="font-display text-lg font-semibold text-text-primary">
              {produtoSelecionado.nome}
            </h3>

            <span className="inline-block px-3 py-1 rounded-full border border-[var(--color-border-light)] bg-white/5 text-[10px] uppercase text-text-secondary mt-2">
              {produtoSelecionado?.categoria?.nome || "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-black/20 p-4 rounded-2xl border border-[var(--color-border)]">
            <div className="sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Descrição
              </span>
              <p className="mt-1 text-text-primary break-words">
                {produtoSelecionado.descricao || "—"}
              </p>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Preço
              </span>
              <p className="text-text-primary font-medium mt-1">
                R$ {produtoSelecionado.preco || "—"}
              </p>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Quantidade
              </span>
              <p className="text-text-primary font-medium mt-1">
                {produtoSelecionado.quantidade || "—"}
              </p>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[var(--color-border)]">
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Fornecedor
              </span>
              <p className="text-text-primary mt-1">
                {produtoSelecionado?.fornecedor?.nome || "—"}
              </p>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-2 sm:justify-end bg-[var(--color-bg)]">
          <button
            onClick={() => setEditando(true)}
            className="w-full sm:w-auto btn-secondary px-5 py-2 text-xs font-semibold"
          >
            Editar
          </button>

          <button
            onClick={() => {
              setModalMsg({
                visible: true,
                mensagem: `Funcionalidade de excluir ${produtoSelecionado.nome} (simulada)`,
                tipo: "sucesso",
              });
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300"
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
    </div>,
    document.body
  );
}

export default ModalProduto;