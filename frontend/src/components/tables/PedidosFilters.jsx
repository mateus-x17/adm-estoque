import React from "react";
import { FiArrowDown, FiArrowUp, FiPlus, FiLock } from "react-icons/fi";

// arquivo responsável pelos controles de criação e filtragem de pedidos/movimentações com restrição RBAC

// componente barra de filtros de pedidos
// 1 - Exibe botão de novo pedido e alternância do painel avançado de filtros
// 2 - Exibe seletor de usuário apenas para ADMIN/GERENTE, mostrando bloqueio informativo ao OPERADOR
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
  canFilterByUser = false,
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
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onCreateClick}
          className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
        >
          <FiPlus size={14} />
          Novo pedido
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {showFilters && (
        <section className="glass-card p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-up">
          <input
            type="text"
            placeholder="ID do pedido"
            value={filterId}
            onChange={handleChange(setFilterId)}
            className={inputClass}
          />

          <input
            type="date"
            value={filterDate}
            onChange={handleChange(setFilterDate)}
            className={inputClass}
          />

          <select
            value={filterType}
            onChange={handleChange(setFilterType)}
            className={inputClass}
          >
            <option value="todos">Todos os tipos</option>
            <option value="VENDA">Venda</option>
            <option value="REPOSICAO">Reposição</option>
          </select>

          {canFilterByUser ? (
            <select
              value={userFilter}
              onChange={handleChange(setUserFilter)}
              className={inputClass}
            >
              <option value="">Todos os usuários</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-white/5 text-xs text-text-secondary flex items-center gap-2 cursor-not-allowed select-none"
              title="Apenas Gerentes e Administradores podem consultar vendas de outros vendedores"
            >
              <FiLock size={13} className="shrink-0" />
              <span>Somente suas vendas</span>
            </div>
          )}

          <button
            onClick={onToggleOrder}
            className="btn-secondary px-4 py-2 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full"
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
