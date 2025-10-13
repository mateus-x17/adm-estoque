import React, { useState, useEffect } from "react";
import ModalProduto from "../components/ModalProduto.jsx";
import ProdutoRow from "../components/ProdutoRow.jsx";
import { useUserStore } from "../store/userStore.js";

const Produtos = () => {
  const url = "http://localhost:5000/products";
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { token } = useUserStore();

  const abrirModal = (produto) => setProdutoSelecionado(produto);
  const fecharModal = () => setProdutoSelecionado(null);

  const carregarProdutos = async () => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      // Evita erro de JSON caso seja HTML (ex.: login redirecionado)
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Resposta não é JSON:", text);
        return;
      }

      if (response.ok) {
        setProdutos(data);
        setTimeout(() => setLoaded(true), 50);
      } else {
        console.error("Erro ao carregar produtos:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  // Atualiza produto no array e no modal
  const atualizarProduto = (produtoAtualizado) => {
    if (!produtoAtualizado) return;

    setProdutos((prev) =>
      prev.map((p) => (p.id === produtoAtualizado.id ? produtoAtualizado : p))
    );

    setProdutoSelecionado((prev) =>
      prev?.id === produtoAtualizado.id ? produtoAtualizado : prev
    );
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-hidden bg-gray-200 dark:bg-gray-900 transition-all duration-500">
      <header className="mb-6 text-center animate-fadeInDown">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
          Gerenciamento de <span className="text-yellow-400">Produtos</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Visualize, edite e gerencie os produtos cadastrados.
        </p>
      </header>

      {loaded ? (
        <div className="flex-1 overflow-auto overflow-x-auto overflow-y-auto bg-gray-300 dark:bg-gray-800 p-4 rounded-xl shadow-inner animate-fadeInUp transition-all duration-500">
          <table className="w-full min-w-[600px] bg-white dark:bg-gray-600 rounded-xl shadow-md">
            <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Imagem</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto, index) => (
                <ProdutoRow
                  key={produto.id}
                  produto={produto}
                  index={index}
                  abrirModal={abrirModal}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        </div>
      )}

      {produtoSelecionado && (
        <ModalProduto
          produtoSelecionado={produtoSelecionado}
          fecharModal={fecharModal}
          onItemUpdated={atualizarProduto}
        />
      )}
    </div>
  );
};

export default Produtos;
