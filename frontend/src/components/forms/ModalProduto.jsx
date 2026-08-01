import React, { useState } from "react";
import EditarItem from "./EditarItem.jsx";
import ModalMensagem from "../common/ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

function ModalProduto({ produtoSelecionado, fecharModal, onItemUpdated }) {
  const [editando, setEditando] = useState(false);
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[var(--bg-elevated)] border border-[var(--line)] rounded-lg shadow-xl flex flex-col overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)] truncate">
            Detalhes do produto
          </h2>
          <button
            onClick={fecharModal}
            className="text-xl text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors duration-200"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col items-center text-center mb-6">
            {produtoSelecionado.imagem && (
              <img
                src={formatImageUrl(produtoSelecionado.imagem)}
                alt={produtoSelecionado.nome}
                className="w-36 h-36 object-cover rounded-lg border border-[var(--line)] mb-4"
              />
            )}

            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
              {produtoSelecionado.nome}
            </h3>

            <span className="font-mono text-xs text-[var(--ink-soft)] mt-0.5">
              {produtoSelecionado?.categoria?.nome || "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="sm:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Descrição
              </span>
              <p className="mt-1 text-[var(--ink)] break-words">
                {produtoSelecionado.descricao || "—"}
              </p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Preço
              </span>
              <p className="text-[var(--ink)] mt-1">R$ {produtoSelecionado.preco || "—"}</p>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Quantidade
              </span>
              <p className="text-[var(--ink)] mt-1">{produtoSelecionado.quantidade || "—"}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                Fornecedor
              </span>
              <p className="text-[var(--ink)] mt-1">
                {produtoSelecionado?.fornecedor?.nome || "—"}
              </p>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-[var(--line)] flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setEditando(true)}
            className="w-full sm:w-auto px-5 py-2 rounded-md border border-[var(--accent)]/40 text-[var(--accent)] font-medium text-sm hover:bg-[var(--accent)]/10 transition-colors duration-200"
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
            className="w-full sm:w-auto px-5 py-2 rounded-md border border-[var(--danger)]/40 text-[var(--danger)] font-medium text-sm hover:bg-[var(--danger-soft)] transition-colors duration-200"
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