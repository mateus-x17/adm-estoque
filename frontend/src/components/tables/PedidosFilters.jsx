import React from "react";
import { FiArrowDown, FiArrowUp, FiPlus } from "react-icons/fi";

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
  order,
  onToggleOrder,
}) => {
  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    if (onFilterChange) onFilterChange();
  };

  const inputClass =
    "w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onCreateClick}
          className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
        >
          <FiPlus size={14} />
          Novo pedido
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {showFilters && (
        <section className="glass-card p-5 flex flex-col lg:flex-row gap-3 animate-fade-up">
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
            <option value="todos">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </select>

          <select
            value={userFilter}
            onChange={handleChange(setUserFilter)}
            className={`lg:w-52 ${inputClass}`}
          >
            <option value="">Todos os usuários</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          <button
            onClick={onToggleOrder}
            className="btn-secondary px-4 py-2 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 lg:w-40 shrink-0"
            title={order === "desc" ? "Mostrando mais recentes primeiro" : "Mostrando mais antigos primeiro"}
          >
            {order === "desc" ? <FiArrowDown size={14} /> : <FiArrowUp size={14} />}
            {order === "desc" ? "Recentes" : "Antigos"}
          </button>
        </section>
      )}
    </div>
  );
};

export default PedidosFilters;