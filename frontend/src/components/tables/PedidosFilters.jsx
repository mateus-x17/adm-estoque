import React from "react";

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
    onFilterChange,
}) => {
    const handleChange = (setter) => (e) => {
        setter(e.target.value);

        if (onFilterChange) {
            onFilterChange();
        }
    };

    return (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl">
            {/* Header filtros */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={onCreateClick}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                    Novo Pedido
                </button>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                    {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
            </div>

            {showFilters && (
                <div className="p-6 flex flex-col lg:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="ID do Pedido"
                        value={filterId}
                        onChange={handleChange(setFilterId)}
                        className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        value={filterDate}
                        onChange={handleChange(setFilterDate)}
                        className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={filterType}
                        onChange={handleChange(setFilterType)}
                        className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos" className="bg-white dark:bg-slate-800">
                            Todos
                        </option>

                        <option value="ENTRADA" className="bg-white dark:bg-slate-800">
                            Entrada
                        </option>

                        <option value="SAIDA" className="bg-white dark:bg-slate-800">
                            Saída
                        </option>
                    </select>
                </div>
            )}
        </section>
    );
};

export default PedidosFilters;