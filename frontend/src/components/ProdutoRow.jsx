import React from "react";

const ProdutoRow = ({ produto, index, abrirModal }) => {
  return (
    <tr
      style={{ animationDelay: `${index * 0.05}s` }}
      className="
        block md:table-row
        border-b border-gray-200 dark:border-gray-600
        hover:bg-gray-100 dark:hover:bg-gray-700
        transition animate-fadeIn
      "
    >
      {/* Mobile Card */}
      <td className="block md:hidden p-4 space-y-3">
        <div className="flex items-center gap-4">
          <img
            src={
              produto.imagem
                ? `http://localhost:5000${produto.imagem.startsWith("/") ? "" : "/"}${produto.imagem}`
                : "/default.png"
            }
            alt={produto.nome}
            className="w-16 h-16 rounded-lg object-cover shadow-sm flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {produto.nome}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {produto?.categoria?.nome || "—"}
            </p>
          </div>
        </div>

        <button
          onClick={() => abrirModal(produto)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition"
        >
          Ver detalhes
        </button>
      </td>

      {/* Desktop cells */}
      <td className="hidden md:table-cell px-4 py-3">
        <img
          src={
            produto.imagem
              ? `http://localhost:5000${produto.imagem.startsWith("/") ? "" : "/"}${produto.imagem}`
              : "/default.png"
          }
          alt={produto.nome}
          className="w-14 h-14 rounded-lg object-cover shadow-sm"
        />
      </td>

      <td className="hidden md:table-cell px-4 py-3 font-medium text-gray-900 dark:text-white">
        {produto.nome}
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-gray-700 dark:text-gray-300">
        {produto?.categoria?.nome || "—"}
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-center">
        <button
          onClick={() => abrirModal(produto)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Ver detalhes
        </button>
      </td>
    </tr>
  );
};

export default ProdutoRow;
