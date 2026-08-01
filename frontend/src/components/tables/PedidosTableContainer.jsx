import React from "react";
import PedidoRow from "./PedidoRow.jsx";

const PedidosTableContainer = ({ pedidos, totalCount, loading, filterId }) => {
  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col">
      <div className="p-5 border-b border-[var(--line)] flex justify-between items-center">
        <h2 className="font-display text-base font-semibold text-[var(--ink)]">
          Histórico de pedidos
        </h2>
        <span className="font-mono text-[11px] uppercase text-[var(--ink-soft)] border border-[var(--line)] rounded-md px-2.5 py-1">
          Total: {totalCount}
        </span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="hidden md:table-header-group">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                ID
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Produto
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Tipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Quantidade
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Data
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Resp.
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-sm text-[var(--ink-soft)]">
                  Carregando...
                </td>
              </tr>
            ) : pedidos.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-sm text-[var(--ink-soft)]">
                  {filterId ? "Pedido não encontrado." : "Nenhum pedido encontrado."}
                </td>
              </tr>
            ) : (
              pedidos.map((ped, index) => (
                <PedidoRow key={ped.id} pedido={ped} index={index} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PedidosTableContainer;