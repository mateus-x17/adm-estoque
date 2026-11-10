import React, { useState, useEffect, useCallback } from "react";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import { FiDownload, FiUploadCloud } from "react-icons/fi";
import ModalProduto from "../components/forms/ModalProduto.jsx";
import ModalImportarPlanilha from "../components/forms/ModalImportarPlanilha.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import ProdutoRow from "../components/tables/ProdutoRow.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import { productsApi, categoriesApi } from "../services/api/index.js";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pela página de listagem e gestão do catálogo de produtos do estabelecimento
// 1 - Aplica controle RBAC para criação, edição e importação/exportação em lote via planilhas (.xlsx e .csv)
// 2 - Suporta filtro por status (ativos, inativos, todos) para compatibilidade com Soft Delete

const Produtos = () => {
  const user = useUserStore((state) => state.user);
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [editandoProduto, setEditandoProduto] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [sortPrice, setSortPrice] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("ativos");
  const [categorias, setCategorias] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });
  const itemsPerPage = 8;

  // efeito para carregar categorias ativas da loja no select de filtro
  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((res) => setCategorias(res.data || res || []))
      .catch(() => {});
  }, []);

  // função para consultar a listagem paginada de produtos com filtros de busca, categoria, preço e status
  // 1 - Monta objeto de parâmetros omitindo valores vazios
  // 2 - Atualiza estado da lista, paginação e contagem total retornada pela API
  const carregarProdutos = useCallback(async () => {
    try {
      setLoaded(false);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        sortPrice: sortPrice || undefined,
        categoriaId: categoriaFiltro || undefined,
        status: statusFiltro || "ativos",
      };

      const result = await productsApi.getProducts(params);
      setProdutos(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalCount(result.pagination?.total || 0);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      setLoaded(true);
    }
  }, [currentPage, search, sortPrice, categoriaFiltro, statusFiltro]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortPrice, categoriaFiltro, statusFiltro]);

  // função para atualizar estado local após criação, edição ou alteração de status de um produto
  // 1 - Sincroniza imediatamente o item atualizado na lista e no modal aberto
  // 2 - Recarrega a página atual para refletir eventuais mudanças de filtro ou totalização
  const atualizarProduto = (produtoAtualizado) => {
    if (!produtoAtualizado) {
      carregarProdutos();
      return;
    }

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

  // função para exportar o catálogo atual em planilha (.xlsx ou .csv)
  // 1 - Chama productsApi.exportProducts respeitando o filtro de status selecionado
  // 2 - Dispara o download do Blob no navegador e exibe toast de confirmação
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const { blob, filename } = await productsApi.exportProducts(format, statusFiltro);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalMsg({
        visible: true,
        mensagem: `Catálogo exportado em ${format.toUpperCase()} com sucesso!`,
        tipo: "sucesso",
      });
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao exportar catálogo.",
        tipo: "erro",
      });
    } finally {
      setExporting(false);
    }
  };

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado({ ...produto, type: "produto" });
    setEditandoProduto(false);
  };

  const abrirEditarProduto = (produto = null) => {
    setProdutoSelecionado(produto ? { ...produto, type: "produto" } : null);
    setEditandoProduto(true);
  };

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
          Catálogo
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
          Produtos
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Gerencie o catálogo, importe planilhas e acompanhe disponibilidade em estoque.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => abrirEditarProduto()}
                className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <FaBoxOpen size={14} />
                Novo produto
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
              >
                <FiUploadCloud size={14} />
                Importar Planilha
              </button>

              <button
                disabled={exporting}
                onClick={() => handleExport("xlsx")}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <FiDownload size={14} />
                Exportar .XLSX
              </button>

              <button
                disabled={exporting}
                onClick={() => handleExport("csv")}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <FiDownload size={14} />
                Exportar .CSV
              </button>
            </div>
          ) : (
            <span className="text-xs text-text-secondary font-mono">
              Visualização de catálogo da loja
            </span>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 ml-auto"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {showFilters && (
          <section className="glass-card p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full animate-fade-up">
            <div className="relative w-full">
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
              className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
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
              className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              <option value="">Ordenar por preço</option>
              <option value="asc">Menor → Maior</option>
              <option value="desc">Maior → Menor</option>
            </select>

            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
            >
              <option value="ativos">Somente Ativos</option>
              <option value="inativos">Somente Inativos</option>
              <option value="todos">Todos os Status</option>
            </select>
          </section>
        )}
      </div>

      {loaded ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-display text-base sm:text-lg font-semibold text-text-primary">
              Catálogo de produtos
            </h2>
            <span className="font-mono text-[11px] uppercase text-text-secondary border border-[var(--color-border-light)] bg-[var(--color-surface)] rounded-full px-3 py-1">
              Total: {totalCount}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {produtos.length === 0 ? (
              <div className="glass-card p-8 text-center text-sm text-text-secondary">
                Nenhum produto encontrado.
              </div>
            ) : (
              produtos.map((produto, index) => (
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
          onItemDeleted={() => {
            setProdutoSelecionado(null);
            carregarProdutos();
          }}
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

      <ModalImportarPlanilha
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          carregarProdutos();
          categoriesApi
            .getCategories()
            .then((res) => setCategorias(res.data || res || []))
            .catch(() => {});
        }}
      />

      {modalMsg.visible && (
        <ModalMensagem
          mensagem={modalMsg.mensagem}
          tipo={modalMsg.tipo}
          onClose={() => setModalMsg({ visible: false, mensagem: "", tipo: "" })}
        />
      )}
    </div>
  );
};

export default Produtos;
