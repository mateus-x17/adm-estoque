import React, { useState } from "react";
import { createPortal } from "react-dom";
import EditarItem from "./EditarItem.jsx";
import ModalMensagem from "../common/ModalMensagem.jsx";
import ModalConfirmacao from "../common/ModalConfirmacao.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";
import { productsApi } from "../../services/api/index.js";
import { useUserStore } from "../../store/userStore.js";

// arquivo responsável por renderizar o modal de detalhes de produto com ações reais de edição, Soft Delete e exclusão RBAC

// componente modal de detalhes do produto selecionado
// 1 - Exibe imagem, status ativo/inativo, categoria, preço formatado em BRL, estoque atual e fornecedor
// 2 - Aplica regras RBAC: GERENTE e ADMIN podem editar e inativar/reativar; apenas ADMIN pode excluir
// 3 - Aciona endpoints reais da API para alteração de status (PATCH /status) e exclusão (DELETE /:id)
function ModalProduto({ produtoSelecionado, fecharModal, onItemUpdated, onItemDeleted }) {
  const [editando, setEditando] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "", closeAfter: false });
  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null });

  const user = useUserStore((state) => state.user);
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";
  const canDelete = user?.role === "ADMIN";
  const isInactive = produtoSelecionado?.ativo === false;

  // função para alternar o status lógico (ativo/inativo) do produto via Soft Delete
  // 1 - Quando estiver inativando, abre o modal estilizado de confirmação do sistema
  // 2 - Chama productsApi.toggleProductStatus enviando o novo estado booleano
  const executeToggleStatus = async () => {
    const novoStatus = isInactive;
    setProcessing(true);
    try {
      const updated = await productsApi.toggleProductStatus(produtoSelecionado.id, novoStatus);
      if (onItemUpdated) onItemUpdated(updated);
      setModalMsg({
        visible: true,
        mensagem: novoStatus
          ? `Produto "${produtoSelecionado.nome}" reativado com sucesso.`
          : `Produto "${produtoSelecionado.nome}" marcado como inativo.`,
        tipo: "sucesso",
        closeAfter: false,
      });
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao alterar status do produto.",
        tipo: "erro",
        closeAfter: false,
      });
    } finally {
      setProcessing(false);
      setConfirmState({ isOpen: false, action: null });
    }
  };

  const handleToggleStatus = () => {
    if (isInactive) {
      executeToggleStatus();
      return;
    }
    setConfirmState({ isOpen: true, action: "inactivate" });
  };

  // função para excluir ou aplicar Soft Delete automático no produto (exclusivo ADMIN)
  // 1 - Abre modal de confirmação estilizado antes de chamar DELETE /products/:id
  // 2 - Quando possuir movimentações históricas, trata softDeleted=true retornando produto inativo
  const executeDelete = async () => {
    setProcessing(true);
    try {
      const result = await productsApi.deleteProduct(produtoSelecionado.id);
      if (result.softDeleted && result.produto && onItemUpdated) {
        onItemUpdated(result.produto);
      } else if (onItemDeleted) {
        onItemDeleted(produtoSelecionado.id);
      } else if (onItemUpdated) {
        onItemUpdated(produtoSelecionado);
      }

      setModalMsg({
        visible: true,
        mensagem: result.message || "Produto removido com sucesso.",
        tipo: "sucesso",
        closeAfter: true,
      });
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao excluir produto.",
        tipo: "erro",
        closeAfter: false,
      });
    } finally {
      setProcessing(false);
      setConfirmState({ isOpen: false, action: null });
    }
  };

  const handleDelete = () => {
    setConfirmState({ isOpen: true, action: "delete" });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300"
      onClick={fecharModal}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-display text-base font-semibold text-text-primary truncate">
              Detalhes do produto
            </h2>
            {isInactive && (
              <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/25 font-mono text-[10px] uppercase shrink-0">
                Inativo
              </span>
            )}
          </div>
          <button
            onClick={fecharModal}
            className="text-xl text-text-secondary hover:text-text-primary transition-colors duration-200 leading-none px-1"
            aria-label="Fechar"
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
              <div className="w-24 h-24 rounded-2xl border-2 border-[var(--color-border-light)] bg-[var(--color-surface)] mb-3 flex items-center justify-center text-xs text-text-secondary">
                Sem Imagem
              </div>
            )}

            <h3 className="font-display text-lg font-semibold text-text-primary">
              {produtoSelecionado.nome}
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="inline-block px-3 py-1 rounded-full border border-[var(--color-border-light)] bg-white/5 text-[10px] uppercase text-text-secondary">
                {produtoSelecionado?.categoria?.nome || "Sem categoria"}
              </span>
              <span
                className={`inline-block px-3 py-1 rounded-full border font-mono text-[10px] uppercase ${
                  isInactive
                    ? "border-accent-red/25 bg-accent-red/10 text-accent-red"
                    : "border-accent-green/25 bg-accent-green/10 text-accent-green"
                }`}
              >
                {isInactive ? "Inativo" : "Ativo"}
              </span>
            </div>
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
                {produtoSelecionado.preco !== undefined && produtoSelecionado.preco !== null
                  ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      Number(produtoSelecionado.preco)
                    )
                  : "—"}
              </p>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Quantidade em estoque
              </span>
              <p className="text-text-primary font-medium mt-1">
                {produtoSelecionado.quantidade ?? 0} un.
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

        <footer className="px-5 py-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end bg-[var(--color-bg)]">
          {!canManage && (
            <button
              onClick={fecharModal}
              className="w-full sm:w-auto btn-secondary px-5 py-2 text-xs font-semibold"
            >
              Fechar
            </button>
          )}

          {canManage && (
            <>
              <button
                disabled={processing}
                onClick={handleToggleStatus}
                className="w-full sm:w-auto btn-secondary px-5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {isInactive ? "Reativar" : "Inativar"}
              </button>

              <button
                disabled={processing}
                onClick={() => setEditando(true)}
                className="w-full sm:w-auto btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Editar
              </button>
            </>
          )}

          {canDelete && (
            <button
              disabled={processing}
              onClick={handleDelete}
              className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300 disabled:opacity-50"
            >
              Excluir
            </button>
          )}
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
            const shouldClose = modalMsg.closeAfter;
            setModalMsg({ visible: false, mensagem: "", tipo: "", closeAfter: false });
            if (shouldClose) fecharModal();
          }}
        />
      )}

      <ModalConfirmacao
        isOpen={confirmState.isOpen}
        variant={confirmState.action === "delete" ? "danger" : "warning"}
        loading={processing}
        title={confirmState.action === "delete" ? "Excluir produto" : "Inativar produto"}
        message={
          confirmState.action === "delete"
            ? `Deseja excluir o produto "${produtoSelecionado.nome}"? Caso possua vendas ou reposições registradas, ele será preservado como inativo.`
            : `Deseja inativar o produto "${produtoSelecionado.nome}"? Ele não poderá receber novas movimentações até ser reativado.`
        }
        confirmText={confirmState.action === "delete" ? "Sim, excluir" : "Sim, inativar"}
        onCancel={() => setConfirmState({ isOpen: false, action: null })}
        onConfirm={confirmState.action === "delete" ? executeDelete : executeToggleStatus}
      />
    </div>,
    document.body
  );
}

export default ModalProduto;
