import React from "react";
import { formatImageUrl } from "../../utils/imageHelper.js";

const ProdutoRow = ({ produto, index, abrirModal }) => {
  return (
    <tr
      style={{ animationDelay: `${index * 0.04}s` }}
      className="block md:table-row border-b border-[var(--line)] hover:bg-[var(--line)]/20 transition-colors duration-200 animate-fade-up"
    >
      {/* Mobile card */}
      <td className="block md:hidden p-4 space-y-3">
        <div className="flex items-center gap-4">
          <img
            src={formatImageUrl(produto.imagem) || "/default.png"}
            alt={produto.nome}
            className="w-14 h-14 rounded-md object-cover border border-[var(--line)] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--ink)] truncate">{produto.nome}</p>
            <p className="text-sm text-[var(--ink-soft)]">
              {produto?.categoria?.nome || "—"}
            </p>
          </div>
        </div>

        <button
          onClick={() => abrirModal(produto)}
          className="w-full rounded-md border border-[var(--line)] text-sm font-medium py-2 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          Ver detalhes
        </button>
      </td>

      {/* Desktop cells */}
      <td className="hidden md:table-cell px-4 py-3">
        <img
          src={formatImageUrl(produto.imagem) || "/default.png"}
          alt={produto.nome}
          className="w-12 h-12 rounded-md object-cover border border-[var(--line)]"
        />
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-sm font-medium text-[var(--ink)]">
        {produto.nome}
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-sm text-[var(--ink-soft)]">
        {produto?.categoria?.nome || "—"}
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-center">
        <button
          onClick={() => abrirModal(produto)}
          className="rounded-md border border-[var(--line)] text-sm font-medium px-4 py-1.5 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          Ver detalhes
        </button>
      </td>
    </tr>
  );
};

export default ProdutoRow;