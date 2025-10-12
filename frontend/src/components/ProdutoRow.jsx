import React from "react";

const ProdutoRow = ({ produto, index, abrirModal }) => {
  return (
    <tr
      style={{ animationDelay: `${index * 0.1}s` }}
      className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform animate-slideInLeft"
    >
      <td className="px-4 py-3">
        <img
          src={`http://localhost:5000${produto.imagem}`} // ✅ prefixo do backend
          alt={produto.nome}
          className="w-14 h-14 object-cover rounded-md"
        />
      </td>

      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
        {produto.nome}
      </td>

      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
        {/* optional chaining para evitar erro quando produto.categoria ainda não estiver disponível */}
        {produto?.categoria?.nome || "—"}
      </td>

      <td className="px-4 py-3 text-center">
        <button
          onClick={() => abrirModal(produto)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Informações
        </button>
      </td>
    </tr>
  );
};

export default ProdutoRow;
