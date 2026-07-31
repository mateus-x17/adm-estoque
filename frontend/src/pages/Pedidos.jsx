import React, { useState, useEffect } from "react";
import EditarItem from "../components/forms/EditarItem.jsx";
import PedidosFilters from "../components/tables/PedidosFilters.jsx";
import PedidosTableContainer from "../components/tables/PedidosTableContainer.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { movementsApi, usersApi } from "../services/api/index.js";

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [filterId, setFilterId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [order, setOrder] = useState("desc"); // "desc" = mais recentes primeiro

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await usersApi.getUsers({
          page: 1,
          limit: 100,
          search: "",
          role: "todos",
        });
        setUsuarios(response.data || []);
      } catch (error) {
        console.error(
          "Erro ao carregar usuários para filtro de pedidos:",
          error,
        );
      }
    };

    carregarUsuarios();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        order,
        tipo: filterType !== "todos" ? filterType : undefined,
        usuarioId: userFilter || undefined,
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
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
            Movimentação
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">
            Pedidos
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Gerencie pedidos e registre movimentações de estoque.
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
