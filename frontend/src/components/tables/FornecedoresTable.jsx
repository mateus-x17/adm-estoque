import React from "react";
import FornecedorRow from "./FornecedorRow.jsx";

const FornecedoresTable = ({ fornecedores, loading, onEdit, onDelete, onOpenDetails }) => {
  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="glass-card p-8 text-center text-sm text-text-secondary">
          Carregando...
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-text-secondary">
          Nenhum fornecedor cadastrado.
        </div>
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
    </div>
  );
};

export default FornecedoresTable;