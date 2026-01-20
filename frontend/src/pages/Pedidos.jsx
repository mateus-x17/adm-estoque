import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaUser, FaSearch, FaFilter, FaCalendarAlt } from "react-icons/fa";
import PedidoRow from "../components/PedidoRow";
import EditarItem from "../components/EditarItem";

const Pedidos = () => {
    const { token } = useUserStore();
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
    }, [token]);

    const fetchPedidos = async () => {
        try {
            const res = await fetch("http://localhost:5000/movements?order=desc", {
                headers: { authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPedidos(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleItemCreated = () => {
        fetchPedidos();
    }

    // Filter Logic
    const filteredPedidos = pedidos.filter(ped => {
        // Filter by ID
        if (filterId && !ped.id.toString().includes(filterId)) return false;

        // Filter by Type
        if (filterType !== "todos" && ped.tipo !== filterType) return false;

        // Filter by Date
        if (filterDate) {
            const pedDate = new Date(ped.data).toLocaleDateString("en-CA"); // YYYY-MM-DD
            if (pedDate !== filterDate) return false;
        }

        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPedidos = filteredPedidos.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
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
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex justify-between w-full lg:w-auto">
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 whitespace-nowrap"
                        >
                            <FiShoppingCart /> Novo Pedido
                        </button>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <FaFilter size={20} />
                        </button>
                    </div>

                    <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col md:flex-row gap-4 w-full lg:w-auto`}>
                        {/* Filter ID */}
                        <div className="relative w-full md:w-40">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ID do Pedido"
                                value={filterId}
                                onChange={e => { setFilterId(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Filter Date */}
                        <div className="relative w-full md:w-40">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Filter Type */}
                        <div className="relative w-full md:w-40">
                            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={filterType}
                                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            >
                                <option value="todos" className="bg-white dark:bg-slate-800">Todos os Tipos</option>
                                <option value="ENTRADA" className="bg-white dark:bg-slate-800">Entrada</option>
                                <option value="SAIDA" className="bg-white dark:bg-slate-800">Saída</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pedidos Table */}
            <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Pedidos</h2>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        Total: {filteredPedidos.length}
                    </span>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-300">
                            <tr>
                                <th className="hidden md:table-cell px-6 py-4">ID</th>
                                <th className="hidden md:table-cell px-6 py-4">Produto</th>
                                <th className="hidden md:table-cell px-6 py-4">Tipo</th>
                                <th className="hidden md:table-cell px-6 py-4 text-center">Quantidade</th>
                                <th className="hidden md:table-cell px-6 py-4">Data</th>
                                <th className="hidden md:table-cell px-6 py-4">Resp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : currentPedidos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            ) : (
                                currentPedidos.map((ped, index) => (
                                    <PedidoRow key={ped.id} pedido={ped} index={index} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredPedidos.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <FiChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple logic to show window of pages could be added, but handled simply here
                                // Showing first 5 or logic to center around current page
                                let p = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    p = currentPage - 2 + i;
                                    if (p > totalPages) p = i + (totalPages - 4); // clamp end
                                }

                                return (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all
                                            ${currentPage === p
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <FiChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

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
