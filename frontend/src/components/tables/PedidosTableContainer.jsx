import React, { useState } from "react";
import PedidoRow from "./PedidoRow.jsx";
import ModalPedido from "../forms/ModalPedido.jsx";

const PedidosTableContainer = ({ pedidos, totalCount, loading, filterId }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const abrirModal = (pedido) => {
    setPedidoSelecionado(pedido);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setPedidoSelecionado(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Histórico de pedidos
        </h2>
        <span className="font-mono text-[11px] uppercase text-text-secondary border border-[var(--color-border-light)] bg-[var(--color-surface)] rounded-full px-3 py-1">
          Total: {totalCount}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando pedidos...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.length === 0 ? (
            <div className="glass-card p-8 text-center text-sm text-text-secondary">
              {filterId ? "Pedido não encontrado." : "Nenhum pedido encontrado."}
            </div>
          ) : (
            pedidos.map((ped, index) => (
              <PedidoRow key={ped.id} pedido={ped} index={index} onClick={() => abrirModal(ped)} />
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <ModalPedido
          pedido={pedidoSelecionado}
          fecharModal={fecharModal}
        />
      )}
    </div>
  );
};

export default PedidosTableContainer;