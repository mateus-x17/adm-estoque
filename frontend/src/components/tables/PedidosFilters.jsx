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
    if (onFilterChange) onFilterChange();
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200";
  const optionClass = "bg-[var(--bg-elevated)] text-[var(--ink)]";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onCreateClick}
          className="px-5 py-2.5 rounded-md bg-[var(--ink)] text-[var(--bg)] text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
        >
          Novo pedido
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
        >
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {showFilters && (
        <section className="glass-panel rounded-lg p-5 flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            placeholder="ID do pedido"
            value={filterId}
            onChange={handleChange(setFilterId)}
            className={`lg:w-40 ${inputClass}`}
          />

          <input
            type="date"
            value={filterDate}
            onChange={handleChange(setFilterDate)}
            className={`lg:w-44 ${inputClass}`}
          />

          <select
            value={filterType}
            onChange={handleChange(setFilterType)}
            className={`lg:w-40 ${inputClass}`}
          >
            <option value="todos" className={optionClass}>Todos</option>
            <option value="ENTRADA" className={optionClass}>Entrada</option>
            <option value="SAIDA" className={optionClass}>Saída</option>
          </select>

          <select
            value={userFilter}
            onChange={handleChange(setUserFilter)}
            className={`lg:w-52 ${inputClass}`}
          >
            <option value="" className={optionClass}>Todos os usuários</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id} className={optionClass}>
                {u.nome}
              </option>
            ))}
          </select>
        </section>
      )}
    </div>
  );
};

export default PedidosFilters;