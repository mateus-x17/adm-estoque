import React, { useState } from "react";
import { produtos } from "../dados.js";
import ModalProduto from "../components/ModalProduto.jsx";

const Produtos = () => {
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const abrirModal = (produto) => setProdutoSelecionado(produto);
  const fecharModal = () => setProdutoSelecionado(null);

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-hidden  bg-gray-200 dark:bg-gray-900 transition-all duration-500">
      {/* Cabeçalho */}
      <header className="mb-6 text-center animate-fadeInDown">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
          Gerenciamento de <span className="text-yellow-400">Produtos</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Visualize, edite e gerencie os produtos cadastrados.
        </p>
      </header>

      {/* Container da tabela com rolagem */}
      <div className="flex-1 overflow-auto overflow-x-auto overflow-y-auto bg-gray-300 dark:bg-gray-800 p-4 rounded-xl shadow-inner animate-fadeInUp transition-all duration-500">
        <table className="w-full min-w-[600px] bg-white dark:bg-gray-700 rounded-xl shadow-md animate-fadeInUp">
          <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Imagem</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-center">Categoria</th>
              <th className="px-4 py-3 text-center">detalhes</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr
                key={produto.id}
                className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <td className="px-4 py-3">
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-14 h-14 object-cover rounded-md"
                  />
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                  {produto.nome}
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                  {produto.categoriaId}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de informações */}
      {produtoSelecionado && (
        <ModalProduto
          produtoSelecionado={produtoSelecionado}
          fecharModal={fecharModal}
        />
      )}
    </div>
  );
};

export default Produtos;
