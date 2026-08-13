import React, { useState, useEffect } from "react";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import ModalProduto from "../components/forms/ModalProduto.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import ProdutoRow from "../components/tables/ProdutoRow.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { productsApi, categoriesApi } from "../services/api/index.js";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [editandoProduto, setEditandoProduto] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortPrice, setSortPrice] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    categoriesApi.getCategories()
      .then((res) => setCategorias(res.data || res || []))
      .catch(() => {});
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoaded(false)
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        sortPrice: sortPrice || undefined,
        categoriaId: categoriaFiltro || undefined,
      };
      
      const result = await productsApi.getProducts(params);
      setProdutos(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalCount(result.pagination?.total || 0);
      setLoaded(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, [currentPage, search, sortPrice, categoriaFiltro]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortPrice, categoriaFiltro]);

  const atualizarProduto = (produtoAtualizado) => {
    if (!produtoAtualizado) return;

    setProdutos((prev) => {
      const existe = prev.some((p) => p.id === produtoAtualizado.id);
      if (existe) {
        return prev.map((p) => (p.id === produtoAtualizado.id ? produtoAtualizado : p));
      }
      return [...prev, produtoAtualizado];
    });

    setProdutoSelecionado((prevSel) =>
      prevSel && prevSel.id === produtoAtualizado.id
        ? { ...produtoAtualizado, type: "produto" }
        : prevSel
    );

    carregarProdutos();
  };

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado({ ...produto, type: "produto" });
    setEditandoProduto(false);
  };

  const abrirEditarProduto = (produto = null) => {
    setProdutoSelecionado(produto ? { ...produto, type: "produto" } : null);
    setEditandoProduto(true);
  };

  const produtosFiltrados = produtos;

  return (
    <div className="w-full min-h-screen pt-4 pb-12 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
          Catálogo
        </span>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight mt-1">Produtos</h1>
        <p className="text-sm text-text-secondary mt-1">
          Gerencie o catálogo, visualize informações e edite produtos.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => abrirEditarProduto()}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <FaBoxOpen size={14} />
            Novo produto
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {showFilters && (
          <section className="glass-card p-5 flex flex-col md:flex-row gap-3 w-full animate-fade-up">
            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
              <input
                type="text"
                placeholder="Pesquisar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full lg:w-48 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>

            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value)}
              className="w-full lg:w-48 px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              <option value="">Ordenar por preço</option>
              <option value="asc">Menor → Maior</option>
              <option value="desc">Maior → Menor</option>
            </select>
          </section>
        )}
      </div>

      {loaded ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Catálogo de produtos
            </h2>
            <span className="font-mono text-[11px] uppercase text-text-secondary border border-[var(--color-border-light)] bg-[var(--color-surface)] rounded-full px-3 py-1">
              Total: {totalCount}
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {produtosFiltrados.length === 0 ? (
              <div className="glass-card p-8 text-center text-sm text-text-secondary">
                Nenhum produto encontrado.
              </div>
            ) : (
              produtosFiltrados.map((produto, index) => (
                <ProdutoRow
                  key={produto.id}
                  produto={produto}
                  index={index}
                  abrirModal={abrirModalProduto}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando produtos...</span>
        </div>
      )}

      {loaded && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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