import React from "react";
import { FiShoppingCart } from "react-icons/fi";
import { FaSearch, FaFilter } from "react-icons/fa";

/**
 * Filters section for Pedidos page
 * Includes ID, date, and type filters with responsive toggle
 */
const PedidosFilters = ({
    filterId,
    setFilterId,
    filterDate,
    setFilterDate,
    filterType,
    setFilterType,
    showFilters,
    setShowFilters,
    onCreateClick,
    onFilterChange
}) => {
    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        if (onFilterChange) onFilterChange();
    };

    return (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex justify-between w-full lg:w-auto">
                    <button
                        onClick={onCreateClick}
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
                            onChange={handleFilterChange(setFilterId)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Filter Date */}
                    <div className="relative w-full md:w-40">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={handleFilterChange(setFilterDate)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Filter Type */}
                    <div className="relative w-full md:w-40">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={filterType}
                            onChange={handleFilterChange(setFilterType)}
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
    );
};

export default PedidosFilters;
