import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, ShoppingCart, ShieldCheck, Upload } from "lucide-react";
import {
  productsApi,
  suppliersApi,
  ordersApi,
} from "../../services/api/index.js";
import { useUserStore } from "../../store/userStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável pelo modal de criação de Pedidos Multi-Item com carrinho dinâmico e baixa/reposição atômica

// função auxiliar para formatar moeda brasileira (R$) no carrinho e resumo de pedido
// 1 - Utiliza Intl.NumberFormat pt-BR garantindo exibição segura mesmo com valores nulos
const formatBRL = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

// componente modal para criação de Pedidos Multi-Item com carrinho dinâmico
// 1 - Carrega catálogo ativo e fornecedores da loja alvo escolhida pelo ADMIN ou vinculada à equipe
// 2 - Valida saldo por item antes de adicionar ao carrinho e envia Idempotency-Key contra cliques duplicados
const ModalPedidoMultiItem = ({ isOpen, onClose, onOrderCreated }) => {
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId } = useTenantStore();
  const isAdmin = user?.role === "ADMIN";

  const [targetLojaId, setTargetLojaId] = useState("");
  const [tipo, setTipo] = useState("VENDA");
  const [clienteNome, setClienteNome] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [observacao, setObservacao] = useState("");

  // Campos comprobatórios de pagamento / recebimento
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [statusPagamento, setStatusPagamento] = useState("PAGO");
  const [comprovanteCodigo, setComprovanteCodigo] = useState("");
  const [recebidoPor, setRecebidoPor] = useState("");
  const [comprovanteFile, setComprovanteFile] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [itemQtd, setItemQtd] = useState(1);
  const [cart, setCart] = useState([]);

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setCart([]);
    setClienteNome("");
    setFornecedorId("");
    setObservacao("");
    setFormaPagamento("PIX");
    setStatusPagamento("PAGO");
    setComprovanteCodigo("");
    setRecebidoPor("");
    setComprovanteFile(null);
    if (isAdmin) {
      if (selectedLojaId && selectedLojaId !== "all") {
        setTargetLojaId(String(selectedLojaId));
      } else if (stores.length > 0) {
        setTargetLojaId(String(stores[0].id));
      }
    } else if (user?.lojaId) {
      setTargetLojaId(String(user.lojaId));
    }
  }, [isOpen, isAdmin, selectedLojaId, stores, user]);

  // Carrega produtos ativos e fornecedores da loja alvo escolhida
  useEffect(() => {
    if (!isOpen || !targetLojaId) return;
    let active = true;
    const load = async () => {
      setLoadingCatalog(true);
      setCart([]);
      try {
        const [prodRes, supRes] = await Promise.all([
          productsApi.getProducts({ limit: "all", status: "ativos" }),
          suppliersApi.getSuppliers({ status: "ativos" }),
        ]);
        if (!active) return;

        const allProds = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];
        const allSups = Array.isArray(supRes) ? supRes : supRes?.fornecedores || [];

        const lojaProds = allProds.filter((p) => Number(p.lojaId) === Number(targetLojaId));
        const lojaSups = allSups.filter((s) => Number(s.lojaId) === Number(targetLojaId));

        setProdutos(lojaProds);
        setFornecedores(lojaSups);
        if (lojaProds.length > 0) setSelectedProdId(String(lojaProds[0].id));
        else setSelectedProdId("");
      } catch (err) {
        console.error("Erro ao carregar catálogo do pedido:", err);
      } finally {
        if (active) setLoadingCatalog(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isOpen, targetLojaId]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setError("");
    const prod = produtos.find((p) => Number(p.id) === Number(selectedProdId));
    const qty = Number(itemQtd);
    if (!prod) {
      setError("Selecione um produto válido.");
      return;
    }
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      setError("Informe uma quantidade inteira positiva.");
      return;
    }

    const existing = cart.find((c) => c.produtoId === prod.id);
    const totalRequested = (existing ? existing.quantidade : 0) + qty;
    if (tipo === "VENDA" && totalRequested > prod.quantidade) {
      setError(`Saldo insuficiente para "${prod.nome}" (disponível: ${prod.quantidade}).`);
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((c) => (c.produtoId === prod.id ? { ...c, quantidade: c.quantidade + qty } : c))
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          produtoId: prod.id,
          nome: prod.nome,
          preco: Number(prod.preco || 0),
          estoqueAtual: prod.quantidade,
          quantidade: qty,
        },
      ]);
    }
    setItemQtd(1);
  };

  const handleRemoveItem = (produtoId) => {
    setCart((prev) => prev.filter((item) => item.produtoId !== produtoId));
  };

  const totalGeral = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (cart.length === 0) {
      setError("Adicione pelo menos 1 produto ao carrinho do pedido.");
      return;
    }

    if (statusPagamento === "PAGO") {
      if (formaPagamento !== "DINHEIRO" && !comprovanteCodigo.trim() && !comprovanteFile) {
        setError(
          `Para pagamento via ${formaPagamento}, informe o código/NSU/ID do comprovante ou anexe o arquivo comprobatório.`
        );
        return;
      }
      if (formaPagamento === "DINHEIRO" && !recebidoPor.trim() && !comprovanteCodigo.trim() && !comprovanteFile) {
        setError(
          "Para pagamento em DINHEIRO, informe quem recebeu/conferiu ou o número do recibo."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const itensPayload = cart.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade }));

      if (comprovanteFile) {
        const fd = new FormData();
        fd.append("tipo", tipo);
        if (targetLojaId) fd.append("lojaId", String(targetLojaId));
        if (tipo === "VENDA" && clienteNome.trim()) fd.append("clienteNome", clienteNome.trim());
        if (tipo === "REPOSICAO" && fornecedorId) fd.append("fornecedorId", String(fornecedorId));
        if (observacao.trim()) fd.append("observacao", observacao.trim());
        fd.append("formaPagamento", formaPagamento);
        fd.append("statusPagamento", statusPagamento);
        if (comprovanteCodigo.trim()) fd.append("comprovanteCodigo", comprovanteCodigo.trim());
        if (recebidoPor.trim()) fd.append("recebidoPor", recebidoPor.trim());
        fd.append("itens", JSON.stringify(itensPayload));
        fd.append("comprovante", comprovanteFile);
        await ordersApi.createOrder(fd, idempotencyKey);
      } else {
        await ordersApi.createOrder(
          {
            tipo,
            lojaId: targetLojaId ? Number(targetLojaId) : undefined,
            clienteNome: tipo === "VENDA" ? clienteNome.trim() || undefined : undefined,
            fornecedorId: tipo === "REPOSICAO" && fornecedorId ? Number(fornecedorId) : undefined,
            observacao: observacao.trim() || undefined,
            formaPagamento,
            statusPagamento,
            comprovanteCodigo: comprovanteCodigo.trim() || undefined,
            recebidoPor: recebidoPor.trim() || undefined,
            itens: itensPayload,
          },
          idempotencyKey
        );
      }

      onOrderCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Falha ao registrar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-purple/10 text-accent-purple">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-text-primary">
                Novo Pedido Multi-Item
              </h2>
              <p className="text-[11px] text-text-secondary">
                Agrupa múltiplos produtos com preço congelado e atualização atômica de estoque
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Tipo + Loja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Tipo da Operação *
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setError("");
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
              >
                <option value="VENDA">Venda (Saída de Estoque)</option>
                <option value="REPOSICAO">Reposição (Entrada de Fornecedor)</option>
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Filial / Loja Destino *
                </label>
                <select
                  value={targetLojaId}
                  onChange={(e) => setTargetLojaId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={String(st.id)}>
                      {st.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tipo === "VENDA" ? (
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Ex: Cliente Balcão / João Silva"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Fornecedor (Opcional)
                </label>
                <select
                  value={fornecedorId}
                  onChange={(e) => setFornecedorId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                >
                  <option value="">Sem fornecedor específico</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Entrega balcão / Detalhe extra"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
              />
            </div>
          </div>

          {/* Comprovação de Pagamento e Recebimento */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-accent-green" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-primary font-semibold">
                Comprovação de Pagamento / Recebimento
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-text-secondary block mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                >
                  <option value="PIX">PIX</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="TRANSFERENCIA">Transferência / TED</option>
                  <option value="A_PRAZO">Faturado / A Prazo</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-text-secondary block mb-1">
                  Situação do Pagamento *
                </label>
                <select
                  value={statusPagamento}
                  onChange={(e) => setStatusPagamento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                >
                  <option value="PAGO">Pago / Confirmado</option>
                  <option value="PENDENTE">Pendente (Anexar depois)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-text-secondary block mb-1">
                  Código Comprovante / NSU / ID PIX
                </label>
                <input
                  type="text"
                  value={comprovanteCodigo}
                  onChange={(e) => setComprovanteCodigo(e.target.value)}
                  placeholder="Ex: E2E PIX, NSU 94821 ou Nº Recibo/NF"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-text-secondary block mb-1">
                  Recebido / Conferido por
                </label>
                <input
                  type="text"
                  value={recebidoPor}
                  onChange={(e) => setRecebidoPor(e.target.value)}
                  placeholder="Nome do recebedor ou conferente"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-secondary block mb-1">
                Anexar Comprovante (Foto ou PDF opcional até 5MB)
              </label>
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-secondary cursor-pointer hover:border-accent-purple transition-colors">
                <span className="flex items-center gap-2 truncate">
                  <Upload size={14} className="text-accent-purple shrink-0" />
                  {comprovanteFile ? comprovanteFile.name : "Clique para anexar imagem ou PDF do comprovante..."}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.jfif,.pdf"
                  className="hidden"
                  onChange={(e) => setComprovanteFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {/* Seletor de adição ao carrinho */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-light)] space-y-2.5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
              Adicionar Produtos ao Pedido
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                disabled={loadingCatalog || produtos.length === 0}
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
              >
                {produtos.length === 0 ? (
                  <option value="">Nenhum produto ativo disponível nesta loja</option>
                ) : (
                  produtos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nome} — {formatBRL(p.preco)} (Saldo: {p.quantidade})
                    </option>
                  ))
                )}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={itemQtd}
                  onChange={(e) => setItemQtd(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none text-center"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={loadingCatalog || produtos.length === 0}
                  className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="border border-[var(--color-border-light)] rounded-xl overflow-hidden">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                Nenhum item adicionado ainda. Escolha produtos acima para montar o pedido.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-bg)] text-text-secondary border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2 text-right">Unit.</th>
                    <th className="px-3 py-2 text-center">Qtd.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {cart.map((item) => (
                    <tr key={item.produtoId}>
                      <td className="px-3 py-2 font-medium text-text-primary">{item.nome}</td>
                      <td className="px-3 py-2 text-right text-text-secondary">
                        {formatBRL(item.preco)}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{item.quantidade}</td>
                      <td className="px-3 py-2 text-right font-semibold text-accent-purple">
                        {formatBRL(item.preco * item.quantidade)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.produtoId)}
                          className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
            <div>
              <span className="text-[11px] text-text-secondary block">Valor Total do Pedido</span>
              <span className="font-display text-lg font-bold text-text-primary">
                {formatBRL(totalGeral)} ({cart.reduce((a, b) => a + b.quantidade, 0)} un.)
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-xl border border-[var(--color-border)] text-text-secondary hover:text-text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? "Registrando..." : "Finalizar Pedido"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalPedidoMultiItem;
