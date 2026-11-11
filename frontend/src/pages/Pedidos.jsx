import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiRotateCcw,
  FiSliders,
  FiFileText,
  FiPaperclip,
  FiPrinter,
  FiX,
} from "react-icons/fi";
import { Search, ShoppingCart, ShieldCheck, Upload } from "lucide-react";
import { ordersApi, usersApi } from "../services/api/index.js";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";
import { formatImageUrl } from "../utils/imageHelper.js";
import { escapeHtml } from "../utils/validators.js";
import PaginationControls from "../components/common/PaginationControls.jsx";
import ModalPedidoMultiItem from "../components/forms/ModalPedidoMultiItem.jsx";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalConfirmacao from "../components/common/ModalConfirmacao.jsx";

// arquivo responsável pela página de Multipedidos (filtros colapsáveis, comprovação de pagamento, recibo PDF e estorno estilizado)

const formatBRL = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

const PAYMENT_LABELS = {
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito",
  CARTAO_DEBITO: "Cartão Débito",
  DINHEIRO: "Dinheiro",
  BOLETO: "Boleto",
  TRANSFERENCIA: "Transferência",
  A_PRAZO: "A Prazo",
};

// função responsável por gerenciar pedidos multi-item com comprovação de pagamento, estorno e recibo PDF.
//
// 1 - recebe nenhum parâmetro direto (controla filtros, paginação, expansão de itens e modais de comprovante/estorno).
// 2 - consulta GET /orders isolando por Organização/Loja e sigilo operacional do OPERADOR.
// 3 - retorna a página completa de pedidos com cartões compactos e botões sem quebra em zoom 100%.
const Pedidos = () => {
  const currentUser = useUserStore((state) => state.user);
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "GERENTE";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
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

  // Estado para modal estilizado de estorno (substitui window.prompt)
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState("Cancelamento solicitado");
  const [cancelingOrder, setCancelingOrder] = useState(false);

  // Estado para modal de anexar/confirmar comprovante de pedido
  const [proofModalOrder, setProofModalOrder] = useState(null);
  const [proofForm, setProofForm] = useState({
    formaPagamento: "PIX",
    statusPagamento: "PAGO",
    comprovanteCodigo: "",
    recebidoPor: "",
    file: null,
  });
  const [savingProof, setSavingProof] = useState(false);

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
  // 1 - Envia filtros de paginação, busca por código/comprovante/vendedor/ID antigo e tipo/status para GET /orders
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

  const handleOpenCancelModal = (order) => {
    setCancelTarget(order);
    setCancelMotivo("Cancelamento solicitado");
  };

  const executeCancelOrder = async () => {
    if (!cancelTarget) return;
    setCancelingOrder(true);
    try {
      await ordersApi.cancelOrder(cancelTarget.id, cancelMotivo.trim() || "Cancelado pelo gestor");
      setFeedback({
        visible: true,
        mensagem: `Pedido ${cancelTarget.codigo} cancelado e estoque estornado com sucesso!`,
        tipo: "sucesso",
      });
      setCancelTarget(null);
      await fetchOrders();
    } catch (err) {
      setFeedback({
        visible: true,
        mensagem: err.message || "Erro ao cancelar pedido.",
        tipo: "erro",
      });
    } finally {
      setCancelingOrder(false);
    }
  };

  const openProofModal = (order) => {
    setProofModalOrder(order);
    setProofForm({
      formaPagamento: order.formaPagamento || "PIX",
      statusPagamento: order.statusPagamento === "PENDENTE" ? "PAGO" : order.statusPagamento || "PAGO",
      comprovanteCodigo: order.comprovanteCodigo || "",
      recebidoPor: order.recebidoPor || order.clienteNome || "",
      file: null,
    });
  };

  // função para salvar atualização de comprovante/recebimento de um pedido existente
  // 1 - Valida código, recebedor ou arquivo anexo antes de confirmar pagamento PAGO
  // 2 - Envia PATCH /orders/:id/proof via FormData ou JSON e atualiza a listagem
  const handleSaveProof = async (e) => {
    e.preventDefault();
    if (!proofModalOrder) return;
    setSavingProof(true);
    try {
      let payload;
      if (proofForm.file) {
        payload = new FormData();
        payload.append("formaPagamento", proofForm.formaPagamento);
        payload.append("statusPagamento", proofForm.statusPagamento);
        payload.append("comprovanteCodigo", proofForm.comprovanteCodigo.trim());
        payload.append("recebidoPor", proofForm.recebidoPor.trim());
        payload.append("comprovante", proofForm.file);
      } else {
        payload = {
          formaPagamento: proofForm.formaPagamento,
          statusPagamento: proofForm.statusPagamento,
          comprovanteCodigo: proofForm.comprovanteCodigo.trim(),
          recebidoPor: proofForm.recebidoPor.trim(),
        };
      }

      await ordersApi.updateOrderProof(proofModalOrder.id, payload);
      setFeedback({
        visible: true,
        mensagem: `Comprovante do pedido ${proofModalOrder.codigo} atualizado!`,
        tipo: "sucesso",
      });
      setProofModalOrder(null);
      await fetchOrders();
    } catch (err) {
      setFeedback({
        visible: true,
        mensagem: err.message || "Erro ao atualizar comprovante do pedido.",
        tipo: "erro",
      });
    } finally {
      setSavingProof(false);
    }
  };

  // função responsável por gerar recibo e comprovante formal de pedido em PDF A4 com sanitização HTML.
  //
  // 1 - recebe order (object) com os dados do pedido, pagamento, comprovação e itens congelados.
  // 2 - abre popup A4 via window.open ou notifica caso pop-ups estejam bloqueados.
  // 3 - escapa todos os dados dinâmicos com escapeHtml para prevenir XSS armazenado no documento.
  // 4 - escreve o HTML no popup, aciona window.print() e não retorna valor.
  const handlePrintReceipt = (order) => {
    const win = window.open("", "_blank", "width=820,height=880");
    if (!win) {
      setFeedback({
        visible: true,
        mensagem: "Habilite pop-ups no navegador para visualizar/imprimir o recibo.",
        tipo: "erro",
      });
      return;
    }

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Comprovante ${escapeHtml(order.codigo)}</title>
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          body { font-family: Arial, sans-serif; color: #0f172a; font-size: 12px; }
          .head { display:flex; justify-content:space-between; border-bottom:2px solid #4f46e5; padding-bottom:10px; margin-bottom:14px; }
          .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:14px; }
          .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          table { width:100%; border-collapse:collapse; margin-top:8px; }
          th { background:#f1f5f9; text-align:left; padding:7px; border-bottom:1px solid #cbd5e1; }
          td { padding:6px 7px; border-bottom:1px solid #f1f5f9; }
          .right { text-align:right; }
          .sign { margin-top:34px; display:flex; justify-content:space-between; gap:30px; }
          .line { flex:1; border-top:1px solid #334155; padding-top:6px; text-align:center; font-size:10px; color:#475569; }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <strong style="font-size:18px;">ESTOQUE<span style="color:#4f46e5;">.OS</span></strong>
            <div style="font-size:11px;color:#475569;">Comprovante de Pedido e Entrega / Pagamento</div>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:15px;">${escapeHtml(order.codigo)}</strong>
            <div style="font-size:10px;color:#64748b;">${escapeHtml(new Date(order.createdAt).toLocaleString("pt-BR"))}</div>
          </div>
        </div>
        <div class="box grid">
          <div><strong>Loja:</strong> ${escapeHtml(order.loja?.nome || "—")}</div>
          <div><strong>Operação:</strong> ${escapeHtml(order.tipo)} (${escapeHtml(order.status)})</div>
          <div><strong>Cliente / Fornecedor:</strong> ${escapeHtml(order.clienteNome || order.fornecedor?.nome || "Balcão")}</div>
          <div><strong>Responsável:</strong> ${escapeHtml(order.vendedorNomeSnapshot)} (#${escapeHtml(order.vendedorRefId)})</div>
          <div><strong>Pagamento:</strong> ${escapeHtml(PAYMENT_LABELS[order.formaPagamento] || order.formaPagamento || "Não informado")} · <strong>${escapeHtml(order.statusPagamento || "PAGO")}</strong></div>
          <div><strong>Cód. Comprovante / NSU / PIX:</strong> ${escapeHtml(order.comprovanteCodigo || "—")}</div>
          <div><strong>Recebido / Conferido por:</strong> ${escapeHtml(order.recebidoPor || "—")}</div>
          <div><strong>Valor Total:</strong> <strong>${escapeHtml(formatBRL(order.valorTotal))}</strong></div>
        </div>
        <table>
          <thead><tr><th>Item</th><th class="right">Unit.</th><th class="right">Qtd.</th><th class="right">Subtotal</th></tr></thead>
          <tbody>
            ${(order.itens || [])
              .map(
                (i) =>
                  `<tr><td>${escapeHtml(i.produtoNomeSnapshot)}</td><td class="right">${escapeHtml(formatBRL(
                    i.precoUnitario
                  ))}</td><td class="right">${escapeHtml(i.quantidade)}</td><td class="right"><strong>${escapeHtml(formatBRL(
                    i.subtotal
                  ))}</strong></td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        ${order.observacao ? `<p style="margin-top:12px;"><strong>Observações:</strong> ${escapeHtml(order.observacao)}</p>` : ""}
        <div class="sign">
          <div class="line">Assinatura do Responsável (${escapeHtml(order.vendedorNomeSnapshot)})</div>
          <div class="line">Assinatura / Recebimento (${escapeHtml(order.recebidoPor || order.clienteNome || "Cliente / Recebedor")})</div>
        </div>
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
      </body>
      </html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="w-full pb-6 space-y-4 sm:space-y-5 max-w-[1440px] mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2 pb-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Operação Comercial · Multipedidos
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Pedidos
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {canManage
              ? "Registre pedidos multi-item, audite comprovantes de pagamento/recebimento e realize estornos."
              : "Crie pedidos multi-item com comprovante e acompanhe exclusivamente suas próprias vendas."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFiltrosAbertos((prev) => !prev)}
            className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5"
          >
            <FiSliders size={13} />
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"
          >
            <FiPlus size={15} />
            Novo Pedido Multi-Item
          </button>
        </div>
      </header>

      {/* Filtros Colapsáveis */}
      {filtrosAbertos && (
        <div className="glass-card p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center animate-fade-up">
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Código, comprovante, produto, cliente, matrícula ou ID..."
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
      )}

      {/* Lista de Pedidos Multi-Item */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--color-border-light)] flex items-center justify-between">
          <span className="text-xs font-mono text-text-secondary">
            {totalCount} pedido(s) encontrado(s)
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-text-secondary animate-pulse">
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
            <ShoppingCart size={24} className="opacity-40" />
            Nenhum pedido encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-light)]">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isDeletedSeller = !order.usuario;
              const payLabel = PAYMENT_LABELS[order.formaPagamento] || order.formaPagamento;
              const payStatus = order.status === "CANCELADO" ? "ESTORNADO" : order.statusPagamento || "PAGO";

              return (
                <div key={order.id} className="p-3 sm:p-3.5 hover:bg-[var(--color-border-light)]/20 transition-colors">
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
                        {payLabel && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              payStatus === "PAGO"
                                ? "bg-accent-green/15 text-accent-green"
                                : payStatus === "PENDENTE"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {payLabel} · {payStatus}
                          </span>
                        )}
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

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0">
                      <span
                        className={`font-display text-base font-bold mr-1 ${
                          order.status === "CANCELADO"
                            ? "line-through text-text-secondary"
                            : "text-text-primary"
                        }`}
                      >
                        {formatBRL(order.valorTotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(order)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-text-secondary hover:text-text-primary text-xs flex items-center gap-1"
                        title="Imprimir / Salvar Recibo Comprobatório"
                      >
                        <FiPrinter size={12} />
                        Recibo
                      </button>

                      {order.status === "CONCLUIDO" && (
                        <button
                          type="button"
                          onClick={() => openProofModal(order)}
                          className="px-2.5 py-1.5 rounded-lg border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10 text-xs flex items-center gap-1"
                          title="Anexar ou confirmar comprovante de pagamento/recebimento"
                        >
                          <FiPaperclip size={12} />
                          Comprovante
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-2 rounded-lg border border-[var(--color-border)] text-text-secondary hover:text-text-primary"
                        title="Ver itens e comprovação do pedido"
                      >
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>

                      {canManage && order.status === "CONCLUIDO" && (
                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(order)}
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
                    <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] space-y-3">
                      {/* Painel de Comprovação Financeira / Entrega */}
                      <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)] grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-text-secondary block">
                            Pagamento / Situação
                          </span>
                          <span className="font-semibold text-text-primary">
                            {payLabel || "Não informado"} ({payStatus})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-text-secondary block">
                            Cód. Comprovante / NSU / PIX
                          </span>
                          <span className="font-mono text-text-primary">
                            {order.comprovanteCodigo || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-text-secondary block">
                            Recebido / Conferido por
                          </span>
                          <span className="text-text-primary">{order.recebidoPor || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-text-secondary block">
                            Arquivo Anexo
                          </span>
                          {order.comprovanteUrl ? (
                            <a
                              href={formatImageUrl(order.comprovanteUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent-pink hover:underline font-medium"
                            >
                              <FiFileText size={12} />
                              Abrir Comprovante
                            </a>
                          ) : (
                            <span className="text-text-secondary">Sem anexo</span>
                          )}
                        </div>
                      </div>

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
                                <td className="px-3 py-2 text-center font-mono">{item.quantidade}</td>
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
            mensagem: "Pedido multi-item registrado com comprovante e estoque atualizado!",
            tipo: "sucesso",
          });
          fetchOrders();
        }}
      />

      {/* Modal para Anexar / Confirmar Comprovante Posterior */}
      {proofModalOrder &&
        createPortal(
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
            onClick={() => !savingProof && setProofModalOrder(null)}
          >
            <div
              className="w-full max-w-md bg-[var(--color-bg)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-accent-green" />
                  <h3 className="font-display text-base font-bold text-text-primary">
                    Comprovante · {proofModalOrder.codigo}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !savingProof && setProofModalOrder(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProof} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-text-secondary block mb-1">Forma</label>
                    <select
                      value={proofForm.formaPagamento}
                      onChange={(e) =>
                        setProofForm({ ...proofForm, formaPagamento: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CARTAO_CREDITO">Cartão Crédito</option>
                      <option value="CARTAO_DEBITO">Cartão Débito</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="BOLETO">Boleto</option>
                      <option value="TRANSFERENCIA">Transferência</option>
                      <option value="A_PRAZO">A Prazo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-text-secondary block mb-1">Situação</label>
                    <select
                      value={proofForm.statusPagamento}
                      onChange={(e) =>
                        setProofForm({ ...proofForm, statusPagamento: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none"
                    >
                      <option value="PAGO">Pago / Confirmado</option>
                      <option value="PENDENTE">Pendente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">
                    Código Comprovante / NSU / ID PIX
                  </label>
                  <input
                    type="text"
                    value={proofForm.comprovanteCodigo}
                    onChange={(e) =>
                      setProofForm({ ...proofForm, comprovanteCodigo: e.target.value })
                    }
                    placeholder="Ex: E2E-PIX, NSU maquininha ou Nº Recibo"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">
                    Recebido / Conferido por
                  </label>
                  <input
                    type="text"
                    value={proofForm.recebidoPor}
                    onChange={(e) =>
                      setProofForm({ ...proofForm, recebidoPor: e.target.value })
                    }
                    placeholder="Nome de quem recebeu / conferiu"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">
                    Anexar Nova Imagem ou PDF (Opcional)
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-secondary cursor-pointer hover:border-accent-purple">
                    <Upload size={14} className="text-accent-purple shrink-0" />
                    <span className="truncate">
                      {proofForm.file ? proofForm.file.name : "Escolher arquivo..."}
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.jfif,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        setProofForm({ ...proofForm, file: e.target.files?.[0] || null })
                      }
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    disabled={savingProof}
                    onClick={() => setProofModalOrder(null)}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProof}
                    className="btn-primary px-5 py-2 text-xs font-semibold"
                  >
                    {savingProof ? "Salvando..." : "Salvar Comprovante"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ModalConfirmacao
        isOpen={Boolean(cancelTarget)}
        variant="danger"
        loading={cancelingOrder}
        title="Estornar Pedido"
        message={
          cancelTarget
            ? `Deseja cancelar e estornar o pedido ${cancelTarget.codigo} (${formatBRL(cancelTarget.valorTotal)})?\nOs saldos dos itens serão devolvidos atomicamente ao estoque.`
            : ""
        }
        withInput
        inputLabel="Motivo do cancelamento / estorno"
        inputPlaceholder="Descreva brevemente o motivo..."
        inputValue={cancelMotivo}
        onInputChange={setCancelMotivo}
        confirmText="Confirmar Estorno"
        onCancel={() => setCancelTarget(null)}
        onConfirm={executeCancelOrder}
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
