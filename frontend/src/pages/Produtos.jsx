import React, { useState, useEffect } from "react";
import ModalProduto from "../components/ModalProduto.jsx";
import ProdutoRow from "../components/ProdutoRow.jsx";
import { useUserStore } from "../store/userStore.js";

const Produtos = () => {
  const url = "http://localhost:5000/products";
  const { token } = useUserStore();

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortPrice, setSortPrice] = useState(null); // "asc" | "desc"

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

  // Filtro e ordenação
  const produtosFiltrados = produtos
    .filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortPrice) return 0;
      if (sortPrice === "asc") return a.preco - b.preco;
      if (sortPrice === "desc") return b.preco - a.preco;
      return 0;
    });

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-hidden bg-gray-200 dark:bg-gray-900 transition-all duration-500">
      <header className="mb-6 text-center animate-fadeInDown">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
          Gerenciamento de <span className="text-yellow-400">Produtos</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Visualize, filtre e gerencie os produtos cadastrados.
        </p>
      </header>

      {/* Filtro e pesquisa */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 mt-6 bg-gray-200 dark:bg-gray-800 p-4 rounded-lg transition-colors duration-500">
        {/* Botão de cadastro */}
        <button
          className="w-full sm:w-[20%] px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-colors"
          onClick={() => alert("Abrir formulário de cadastro")}
        >
          Cadastrar
        </button>

        {/* Pesquisa */}
        <input
          type="text"
          placeholder="Pesquisar produto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[40%] px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600"
        />

        {/* Ordenação por preço */}
        <select
          value={sortPrice || ""}
          onChange={(e) => setSortPrice(e.target.value || null)}
          className="w-full sm:w-[20%] px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600 truncate"
        >
          <option value="">Ordenar por preço</option>
          <option value="asc">Menor → Maior</option>
          <option value="desc">Maior → Menor</option>
        </select>
      </div>

      {/* Tabela */}
      {loaded ? (
        <div className="flex-1 overflow-auto overflow-x-auto overflow-y-auto bg-gray-300 dark:bg-gray-800 p-4 rounded-xl shadow-inner animate-fadeInUp transition-all duration-500 mt-6">
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
              {produtosFiltrados.map((produto, index) => (
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
        <div className="flex-grow flex items-center justify-center mt-6">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        </div>
      )}

      {/* Modal de detalhes */}
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
