import React from "react";
import { formatImageUrl } from "../../utils/imageHelper.js";

// arquivo responsável por exibir uma linha de produto no catálogo com indicador de status ativo/inativo

// componente de linha do catálogo de produtos
// 1 - Renderiza miniatura, nome, categoria, saldo/preço e badge visual caso esteja inativo (Soft Delete)
// 2 - Dispara abertura do modal de detalhes ao clicar no botão de ação
const ProdutoRow = ({ produto, index, abrirModal }) => {
  const isInactive = produto?.ativo === false;

  return (
    <div
      style={{ animationDelay: `${index * 0.04}s` }}
      className={`glass-card hover-card flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 animate-fade-up ${
        isInactive ? "opacity-75 border-dashed" : ""
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <img
          src={formatImageUrl(produto.imagem) || "/default.png"}
          alt={produto.nome}
          className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border-light)] flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text-primary text-sm truncate">{produto.nome}</p>
            {isInactive && (
              <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/25 font-mono text-[10px] uppercase tracking-wider shrink-0">
                Inativo
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
            {produto?.categoria?.nome || "Sem categoria"} • Qtd: {produto.quantidade ?? 0} •{" "}
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              Number(produto.preco || 0)
            )}
          </p>
        </div>
      </div>

      <button
        onClick={() => abrirModal(produto)}
        className="btn-secondary px-5 py-2 text-xs font-semibold shrink-0 w-full sm:w-auto"
      >
        Ver detalhes
      </button>
    </div>
  );
};

export default ProdutoRow;
