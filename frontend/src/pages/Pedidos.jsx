import React, { useState, useEffect } from "react";
import EditarItem from "../components/forms/EditarItem.jsx";
import PedidosFilters from "../components/tables/PedidosFilters.jsx";
import PedidosTableContainer from "../components/tables/PedidosTableContainer.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { movementsApi, usersApi } from "../services/api/index.js";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pela página de lançamento e acompanhamento de pedidos e movimentações de estoque
// 1 - Protege o filtro por vendedor com RBAC (OPERADOR visualiza apenas suas próprias vendas/reposições)
// 2 - Permite lançar vendas ou reposições de produtos ativos da loja com feedback imediato

const Pedidos = () => {
  const currentUser = useUserStore((state) => state.user);
  const canFilterByUser = currentUser?.role === "ADMIN" || currentUser?.role === "GERENTE";

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [filterId, setFilterId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [order, setOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // efeito para carregar nomes de vendedores apenas quando ADMIN ou GERENTE estão autenticados
  useEffect(() => {
    if (!canFilterByUser) {
      setUsuarios([]);
      return;
    }

    const carregarUsuarios = async () => {
      try {
        const response = await usersApi.getUserNames();
        const lista = Array.isArray(response) ? response : response?.data || [];
        setUsuarios(lista);
      } catch (error) {
        console.error("Erro ao carregar usuários para filtro de pedidos:", error);
      }
    };

    carregarUsuarios();
  }, [canFilterByUser]);

  // função para buscar movimentações paginadas do estabelecimento (ou apenas do operador)
  // 1 - Serializa filtros ativos e consulta GET /movements
  // 2 - Atualiza tabela e metadados de paginação
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        order,
        tipo: filterType !== "todos" ? filterType : undefined,
        usuarioId: canFilterByUser && userFilter ? userFilter : undefined,
        id: filterId || undefined,
        date: filterDate || undefined,
      };

      const result = await movementsApi.getMovements(params);
      const serverData = result.data || [];
      const pagination = result.pagination || {
        page: currentPage,
        limit: itemsPerPage,
        total: serverData.length,
        pages: 1,
      };

      setPedidos(serverData);
      setTotalPages(pagination.pages || 1);
      setTotalCount(pagination.total || serverData.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterId, filterDate, filterType, userFilter, order]);

  const handleItemCreated = () => {
    if (currentPage === 1) {
      fetchPedidos();
    } else {
      setCurrentPage(1);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const toggleOrder = () => {
    setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1);
  };

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)] mb-6 sm:mb-8">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Movimentação
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {canFilterByUser
              ? "Gerencie pedidos e registre movimentações de estoque da loja."
              : "Registre vendas/reposições e acompanhe os seus próprios lançamentos."}
          </p>
        </div>
      </header>

      <PedidosFilters
        filterId={filterId}
        setFilterId={setFilterId}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterType={filterType}
        setFilterType={setFilterType}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        usuarios={usuarios}
        canFilterByUser={canFilterByUser}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onCreateClick={() => setModalOpen(true)}
        onFilterChange={handleFilterChange}
        order={order}
        onToggleOrder={toggleOrder}
      />

      <PedidosTableContainer
        pedidos={pedidos}
        totalCount={totalCount}
        loading={loading}
        filterId={filterId}
      />

      {!loading && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {modalOpen && (
        <EditarItem
          type="CriarPedido"
          itemData={null}
          onClose={() => setModalOpen(false)}
          onItemUpdated={handleItemCreated}
        />
      )}
    </div>
  );
};

export default Pedidos;
