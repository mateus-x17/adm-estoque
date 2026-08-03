import React from "react";
import FornecedorRow from "./FornecedorRow.jsx";

const FornecedoresTable = ({ fornecedores, loading, onEdit, onDelete, onOpenDetails }) => {
  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="hidden md:table-cell px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
              ID
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
              Nome
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
              Contato
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
              Endereço
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" className="p-6 text-center text-sm text-[var(--ink-soft)]">
                Carregando...
              </td>
            </tr>
          ) : fornecedores.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-6 text-center text-sm text-[var(--ink-soft)]">
                Nenhum fornecedor cadastrado.
              </td>
            </tr>
          ) : (
            fornecedores.map((sup, index) => (
              <FornecedorRow
                key={sup.id}
                fornecedor={sup}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenDetails={onOpenDetails}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FornecedoresTable;