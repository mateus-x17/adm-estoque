import React from "react";
import { Link } from "react-router-dom";
import {produtos} from '../dados.js';

const Produtos = () => {
  return (
    <>
      {/* Banner de topo com gradiente */}
      <section className="relative w-full h-[20%] pt-3 flex flex-col items-center justify-center text-center text-white overflow-hidden bg-gradient-to-r from-purple-800 via-blue-400 to-green-600 bg-[length:400%_400%] animate-gradientShift">
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold drop-shadow-lg animate-fadeInDown">
          Gerenciamento de <span className="text-yellow-300">Produtos</span>
        </h1>
        <p className="relative z-10 text-lg md:text-xl mt-4 max-w-2xl px-4 animate-fadeInUp">
          Visualize, edite e gerencie todos os produtos cadastrados no sistema.
        </p>
      </section>

      {/* Tabela de produtos */}
      <div className="w-full bg-gray-100 dark:bg-gray-900 py-16 px-6 min-h-screen transition-all duration-500">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white animate-fadeInDown">
          Lista de Produtos
        </h2>

        <div className="overflow-x-auto max-w-6xl mx-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white">
              <tr>
                <th className="px-4 py-2 text-left">Imagem</th>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Descrição</th>
                <th className="px-4 py-2 text-left">Preço</th>
                <th className="px-4 py-2 text-left">Qtd</th>
                <th className="px-4 py-2 text-left">Categoria</th>
                <th className="px-4 py-2 text-left">Fornecedor</th>
                <th className="px-4 py-2 text-left">Criado em</th>
                <th className="px-4 py-2 text-left">Atualizado em</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr
                  key={produto.id}
                  className="border-t text-dark dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <td className="px-4 py-2">
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2">{produto.nome}</td>
                  <td className="px-4 py-2">{produto.descricao}</td>
                  <td className="px-4 py-2">R$ {produto.preco.toFixed(2)}</td>
                  <td className="px-4 py-2">{produto.quantidade}</td>

                  <td className="px-4 py-2">{produto.categoriaId}</td>
                  <td className="px-4 py-2">{produto.fornecedorId ?? "-"}</td>
                  <td className="px-4 py-2">{produto.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-2">{produto.updatedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-2 flex justify-center items-center gap-2">
                    <button className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors">
                      Editar
                    </button>
                    <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Produtos;
