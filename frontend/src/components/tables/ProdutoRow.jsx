import React from "react";
import { formatImageUrl } from "../../utils/imageHelper.js";

const ProdutoRow = ({ produto, index, abrirModal }) => {
  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className="glass-card hover-card flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 animate-fade-up"
    >
      <div className="flex items-center gap-4 flex-1">
        <img
          src={formatImageUrl(produto.imagem) || "/default.png"}
          alt={produto.nome}
          className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border-light)] flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{produto.nome}</p>
          <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
            {produto?.categoria?.nome || "Categoria não informada"}
          </p>
        </div>
      </div>

      <button
        onClick={() => abrirModal(produto)}
        className="btn-secondary px-5 py-2 text-xs font-semibold shrink-0"
      >
        Ver detalhes
      </button>
    </div>
  );
};

export default ProdutoRow;