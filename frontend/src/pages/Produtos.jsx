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
      setLoaded(false) //indica que esta carregando dados
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
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Catálogo
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Produtos</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Gerencie o catálogo, visualize informações e edite produtos.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => abrirEditarProduto()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-[var(--bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
          >
            <FaBoxOpen size={14} />
            Novo produto
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {showFilters && (
          <section className="glass-panel rounded-lg p-5 flex flex-col md:flex-row gap-3 w-full">
            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={13} />
              <input
                type="text"
                placeholder="Pesquisar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            >
              <option value="" className="bg-[var(--bg-elevated)]">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[var(--bg-elevated)]">
                  {cat.nome}
                </option>
              ))}
            </select>

            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
            >
              <option value="" className="bg-[var(--bg-elevated)]">Ordenar por preço</option>
              <option value="asc" className="bg-[var(--bg-elevated)]">Menor → Maior</option>
              <option value="desc" className="bg-[var(--bg-elevated)]">Maior → Menor</option>
            </select>
          </section>
        )}
      </div>

      {loaded ? (
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--line)] flex justify-between items-center">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">
              Catálogo de produtos
            </h2>
            <span className="font-mono text-[11px] uppercase text-[var(--ink-soft)] border border-[var(--line)] rounded-md px-2.5 py-1">
              Total: {totalCount}
            </span>
          </div>
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <table className="w-full md:table">
              <thead className="hidden md:table-header-group sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                    Produto
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                    Categoria
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
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
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--ink-soft)]">Carregando produtos...</span>
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