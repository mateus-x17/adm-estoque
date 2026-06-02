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

    // Filters
    const [filterId, setFilterId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("todos");
    const [showFilters, setShowFilters] = useState(false);
    const [userFilter, setUserFilter] = useState("");
    const [usuarios, setUsuarios] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // carregar usuários para filtro
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
                console.error("Erro ao carregar usuários para filtro de pedidos:", error);
            }
        };

        carregarUsuarios();
    }, []);

    // buscar pedidos paginados do backend
    useEffect(() => {
        const fetchPedidos = async () => {
            try {
                const params = {
                    page: currentPage,
                    limit: itemsPerPage,
                    order: "desc",
                    tipo: filterType !== "todos" ? filterType : undefined,
                    usuarioId: userFilter || undefined,
                };

                const result = await movementsApi.getMovements(params);
                const serverData = result.data || [];
                const pagination = result.pagination || {
                    page: currentPage,
                    limit: itemsPerPage,
                    total: serverData.length,
                    pages: 1,
                };

                // filtros adicionais (ID e data) ainda aplicados no frontend sobre a página atual
                const filtered = serverData.filter((ped) => {
                    if (filterId && !ped.id.toString().includes(filterId)) return false;
                    if (filterDate) {
                        const pedDate = new Date(ped.data).toLocaleDateString("en-CA");
                        if (pedDate !== filterDate) return false;
                    }
                    return true;
                });

                setPedidos(filtered);
                setTotalPages(pagination.pages || 1);
                setTotalCount(pagination.total || serverData.length);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPedidos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filterId, filterDate, filterType, userFilter]);

    const handleItemCreated = () => {
        // recarrega página atual após criação
        setLoading(true);
        setCurrentPage(1);
    };

    const handleFilterChange = () => {
        setCurrentPage(1); // Reset to first page when filters change
    };

    return (
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Pedidos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie pedidos e registre movimentações de estoque
                    </p>
                </div>
            </header>

            {/* Filters Section */}
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
            />

            {/* Pedidos Table */}
            <PedidosTableContainer
                pedidos={pedidos}
                totalCount={totalCount}
                loading={loading}
            />

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Modal Novo Pedido */}
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
