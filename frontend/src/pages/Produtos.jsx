import React, { useState, useEffect } from "react";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import ModalProduto from "../components/ModalProduto.jsx";
import ProdutoRow from "../components/ProdutoRow.jsx";
import EditarItem from "../components/EditarItem.jsx";
import { productsApi } from "../services/api";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [editandoProduto, setEditandoProduto] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortPrice, setSortPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const carregarProdutos = async () => {
    try {
      const data = await productsApi.getProducts();
      setProdutos(data);
      setTimeout(() => setLoaded(true), 50);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const atualizarProduto = (produtoAtualizado) => {
    if (!produtoAtualizado) return;
    setProdutos((prev) =>
      prev.map((p) => (p.id === produtoAtualizado.id ? produtoAtualizado : p))
    );
    setProdutoSelecionado((prev) =>
      prev?.id === produtoAtualizado.id ? produtoAtualizado : prev
    );
  };

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado({ ...produto, type: "produto" });
    setEditandoProduto(false);
  };

  const abrirEditarProduto = (produto = null) => {
    setProdutoSelecionado(produto ? { ...produto, type: "produto" } : null);
    setEditandoProduto(true);
  };

  const produtosFiltrados = produtos
    .filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortPrice) return 0;
      return sortPrice === "asc" ? a.preco - b.preco : b.preco - a.preco;
    });

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Produtos
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Gerencie o catálogo, visualize informações e edite produtos.
        </p>
      </header>

      {/* Filtros */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex justify-between w-full lg:w-auto">
            <button
              onClick={() => abrirEditarProduto()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
            >
              <FaBoxOpen />
              Novo Produto
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-2 text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <FaSearch size={20} />
            </button>
          </div>

          <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col md:flex-row gap-4 w-full lg:w-auto`}>
            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="" className="bg-white dark:bg-slate-800">Ordenar por preço</option>
              <option value="asc" className="bg-white dark:bg-slate-800">Menor → Maior</option>
              <option value="desc" className="bg-white dark:bg-slate-800">Maior → Menor</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabela */}
      {loaded ? (
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-3xl shadow-inner overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <table className="w-full bg-white dark:bg-slate-900 rounded-3xl md:table">
              <thead className="hidden md:table-header-group sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Produto
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Nome
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Categoria
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto, index) => (
                  <ProdutoRow
                    key={produto.id}
                    produto={produto}
                    index={index}
                    abrirModal={abrirModalProduto}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 py-20">
          <div className="w-12 h-12 border-4 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-slate-600 dark:text-slate-300">
            Carregando produtos...
          </span>
        </div>
      )}

      {produtoSelecionado && !editandoProduto && (
        <ModalProduto
          produtoSelecionado={produtoSelecionado}
          fecharModal={() => setProdutoSelecionado(null)}
          onItemUpdated={atualizarProduto}
        />
      )}

      {editandoProduto && (
        <EditarItem
          type={produtoSelecionado ? "produto" : "CriarProduto"}
          itemData={produtoSelecionado}
          onClose={() => setEditandoProduto(false)}
          onItemUpdated={(produtoAtualizado) => {
            atualizarProduto(produtoAtualizado);
            setEditandoProduto(false);
          }}
        />
      )}
    </div>
  );
};

export default Produtos;
