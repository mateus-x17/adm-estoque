import React from "react";
import FornecedorRow from "./FornecedorRow.jsx";

// arquivo responsável pelo contêiner de listagem de fornecedores com estado de carregamento e repasse RBAC

// componente de tabela/lista de fornecedores
// 1 - Exibe estado de carregamento ou mensagem vazia quando não há registros
// 2 - Mapeia cada fornecedor repassando callbacks de detalhes, edição, Soft Delete e exclusão
const FornecedoresTable = ({
  fornecedores,
  loading,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenDetails,
  canManage,
  canDelete,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="glass-card p-8 text-center text-sm text-text-secondary">
          Carregando fornecedores...
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-text-secondary">
          Nenhum fornecedor encontrado.
        </div>
      ) : (
        fornecedores.map((sup, index) => (
          <FornecedorRow
            key={sup.id}
            fornecedor={sup}
            index={index}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onOpenDetails={onOpenDetails}
            canManage={canManage}
            canDelete={canDelete}
          />
        ))
      )}
    </div>
  );
};

export default FornecedoresTable;
