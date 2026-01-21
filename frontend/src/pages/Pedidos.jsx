import React, { useState, useEffect } from "react";
import EditarItem from "../components/EditarItem";
import PedidosFilters from "../components/PedidosFilters";
import PedidosTableContainer from "../components/PedidosTableContainer";
import PaginationControls from "../components/PaginationControls";
import { movementsApi } from "../services/api";

const Pedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Filters
    const [filterId, setFilterId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("todos");
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchPedidos();
    }, []);

    const fetchPedidos = async () => {
        try {
            const data = await movementsApi.getMovements({ order: 'desc' });
            setPedidos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemCreated = () => {
        fetchPedidos();
    };

    const handleFilterChange = () => {
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Filter Logic
    const filteredPedidos = pedidos.filter(ped => {
        if (filterId && !ped.id.toString().includes(filterId)) return false;
        if (filterType !== "todos" && ped.tipo !== filterType) return false;
        if (filterDate) {
            const pedDate = new Date(ped.data).toLocaleDateString("en-CA");
            if (pedDate !== filterDate) return false;
        }
        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPedidos = filteredPedidos.slice(startIndex, startIndex + itemsPerPage);

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
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onCreateClick={() => setModalOpen(true)}
                onFilterChange={handleFilterChange}
            />

            {/* Pedidos Table */}
            <PedidosTableContainer
                pedidos={currentPedidos}
                totalCount={filteredPedidos.length}
                loading={loading}
            />

            {/* Pagination */}
            {!loading && filteredPedidos.length > 0 && (
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
