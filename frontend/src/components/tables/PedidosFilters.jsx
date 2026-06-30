import React from "react";

const PedidosFilters = ({
    filterId,
    setFilterId,
    filterDate,
    setFilterDate,
    filterType,
    setFilterType,
    userFilter,
    setUserFilter,
    usuarios = [],
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
        <div className="space-y-4">
            {/* Toolbar externa */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onCreateClick}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                    Novo Pedido
                </button>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                    {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
            </div>

            {/* Painel de filtros */}
            {showFilters && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl">
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

                        <select
                            value={userFilter}
                            onChange={handleChange(setUserFilter)}
                            className="w-full lg:w-56 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" className="bg-white dark:bg-slate-800">
                                Todos os usuários
                            </option>
                            {usuarios.map((u) => (
                                <option
                                    key={u.id}
                                    value={u.id}
                                    className="bg-white dark:bg-slate-800"
                                >
                                    {u.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PedidosFilters;