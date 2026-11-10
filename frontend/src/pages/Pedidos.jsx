import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiChevronDown, FiChevronUp, FiRotateCcw } from "react-icons/fi";
import { Search, ShoppingCart } from "lucide-react";
import { ordersApi, usersApi } from "../services/api/index.js";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";
import PaginationControls from "../components/common/PaginationControls.jsx";
import ModalPedidoMultiItem from "../components/forms/ModalPedidoMultiItem.jsx";
import ModalMensagem from "../components/common/ModalMensagem.jsx";

// arquivo responsável pela página de Multipedidos (criação com múltiplos itens, visualização expansível e estorno/cancelamento)

const formatBRL = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const Pedidos = () => {
  const currentUser = useUserStore((state) => state.user);
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "GERENTE";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDate, setFilterDate] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [orderSort, setOrderSort] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ visible: false, mensagem: "", tipo: "sucesso" });

  useEffect(() => {
    if (!canManage) {
      setUsuarios([]);
      return;
    }
    usersApi
      .getUserNames()
      .then((res) => setUsuarios(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {});
  }, [canManage, selectedLojaId]);

  // função para carregar pedidos paginados respeitando Organização, Loja selecionada e sigilo de OPERADOR
  // 1 - Envia filtros de paginação, busca por código/vendedor/ID antigo e tipo/status para GET /orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders({
        page: currentPage,
        limit: 10,
        order: orderSort,
        search: search || undefined,
        tipo: filterType !== "todos" ? filterType : undefined,
        status: filterStatus !== "todos" ? filterStatus : undefined,
        date: filterDate || undefined,
        vendedorRefId: canManage && userFilter ? userFilter : undefined,
      });
      setOrders(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, orderSort, search, filterType, filterStatus, filterDate, canManage, userFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, selectedLojaId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStatus, filterDate, userFilter, selectedLojaId]);

  const handleCancelOrder = async (order) => {
    const motivo = window.prompt(
      `Deseja cancelar e estornar o pedido ${order.codigo} (${formatBRL(order.valorTotal)})?\nInforme o motivo (opcional):`,
      "Cancelamento solicitado"
    );
    if (motivo === null) return;

    try {
      await ordersApi.cancelOrder(order.id, motivo);
      setFeedback({
        visible: true,
        mensagem: `Pedido ${order.codigo} cancelado e estoque estornado com sucesso!`,
        tipo: "sucesso",
      });
      await fetchOrders();
    } catch (err) {
      setFeedback({
        visible: true,
        mensagem: err.message || "Erro ao cancelar pedido.",
        tipo: "erro",
      });
    }
  };

  return (
    <div className="w-full min-h-screen pt-2 pb-12 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Operação Comercial · Multipedidos
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {canManage
              ? "Registre pedidos multi-item, audite valores congelados por cupom e realize estornos."
              : "Crie pedidos multi-item e acompanhe exclusivamente suas próprias vendas e lançamentos."}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <FiPlus size={15} />
          Novo Pedido Multi-Item
        </button>
      </header>

      {/* Filtros */}
      <div className="glass-card p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center">
        <div className="relative lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, produto, cliente, vendedor ou ID antigo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
        >
          <option value="todos">Todos os tipos</option>
          <option value="VENDA">Vendas</option>
          <option value="REPOSICAO">Reposições</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
        >
          <option value="todos">Todos os status</option>
          <option value="CONCLUIDO">Concluídos</option>
          <option value="CANCELADO">Cancelados</option>
        </select>

        {canManage ? (
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
          >
            <option value="">Todos os vendedores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.nome} (#{u.id})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
          />
        )}

        <button
          onClick={() => setOrderSort((prev) => (prev === "desc" ? "asc" : "desc"))}
          className="btn-secondary px-3 py-2 text-xs font-medium"
        >
          {orderSort === "desc" ? "Mais recentes" : "Mais antigos"}
        </button>
      </div>

      {/* Lista de Pedidos Multi-Item */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border-light)] flex items-center justify-between">
          <span className="text-xs font-mono text-text-secondary">
            {totalCount} pedido(s) encontrado(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-text-secondary animate-pulse">
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
            <ShoppingCart size={24} className="opacity-40" />
            Nenhum pedido encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-light)]">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isDeletedSeller = !order.usuario;
              return (
                <div key={order.id} className="p-4 hover:bg-[var(--color-border-light)]/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-text-primary">
                          {order.codigo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.tipo === "VENDA"
                              ? "bg-accent-purple/15 text-accent-purple"
                              : "bg-emerald-500/15 text-emerald-500"
                          }`}
                        >
                          {order.tipo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === "CANCELADO"
                              ? "bg-red-500/15 text-red-500"
                              : "bg-sky-500/15 text-sky-400"
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.loja?.nome && (
                          <span className="text-[11px] font-mono text-text-secondary">
                            @{order.loja.nome}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary mt-1">
                        Vendedor:{" "}
                        <strong className="text-text-primary">{order.vendedorNomeSnapshot}</strong>{" "}
                        <span className="font-mono text-[10px]">
                          (#{order.vendedorRefId}
                          {isDeletedSeller ? " · Ex-colaborador" : ""})
                        </span>
                        {" · "}
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                        {" · "}
                        {order.itens?.length || 0} item(ns)
                        {order.clienteNome ? ` · Cliente: ${order.clienteNome}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <span
                        className={`font-display text-base font-bold ${
                          order.status === "CANCELADO"
                            ? "line-through text-text-secondary"
                            : "text-text-primary"
                        }`}
                      >
                        {formatBRL(order.valorTotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-2 rounded-lg border border-[var(--color-border)] text-text-secondary hover:text-text-primary"
                        title="Ver itens do pedido"
                      >
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>

                      {canManage && order.status === "CONCLUIDO" && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium flex items-center gap-1.5"
                          title="Cancelar e estornar estoque"
                        >
                          <FiRotateCcw size={12} />
                          Estornar
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] space-y-2">
                      {order.observacao && (
                        <p className="text-xs text-text-secondary">
                          <strong>Obs.:</strong> {order.observacao}
                        </p>
                      )}
                      {order.status === "CANCELADO" && (
                        <p className="text-xs text-red-400">
                          Cancelado por {order.canceladoPorNome} em{" "}
                          {order.canceladoEm
                            ? new Date(order.canceladoEm).toLocaleString("pt-BR")
                            : "—"}{" "}
                          {order.motivoCancelamento ? `(${order.motivoCancelamento})` : ""}
                        </p>
                      )}

                      <div className="overflow-x-auto rounded-xl border border-[var(--color-border-light)]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--color-bg)] text-text-secondary">
                            <tr>
                              <th className="px-3 py-2">Produto (Snapshot)</th>
                              <th className="px-3 py-2 text-right">Preço Congelado</th>
                              <th className="px-3 py-2 text-center">Qtd.</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border-light)]">
                            {(order.itens || []).map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-medium text-text-primary">
                                  {item.produtoNomeSnapshot}
                                </td>
                                <td className="px-3 py-2 text-right text-text-secondary">
                                  {formatBRL(item.precoUnitario)}
                                </td>
                                <td className="px-3 py-2 text-center font-mono">
                                  {item.quantidade}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-accent-purple">
                                  {formatBRL(item.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ModalPedidoMultiItem
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onOrderCreated={() => {
          setFeedback({
            visible: true,
            mensagem: "Pedido multi-item registrado e estoque atualizado com sucesso!",
            tipo: "sucesso",
          });
          fetchOrders();
        }}
      />

      <ModalMensagem
        visible={feedback.visible}
        mensagem={feedback.mensagem}
        tipo={feedback.tipo}
        onClose={() => setFeedback({ ...feedback, visible: false })}
      />
    </div>
  );
};

export default Pedidos;
