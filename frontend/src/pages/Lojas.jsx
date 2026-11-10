import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiPower, FiMapPin, FiPhone, FiX } from "react-icons/fi";
import { Building2 } from "lucide-react";
import { storesApi } from "../services/api/index.js";
import { useTenantStore } from "../store/useTenantStore.js";
import { useUserStore } from "../store/userStore.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";

// arquivo responsável pela gestão de Lojas/Filiais da Organização (exclusivo ADMIN)

const Lojas = () => {
  const user = useUserStore((state) => state.user);
  const { setStores: syncTenantStores } = useTenantStore();

  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "sucesso" });

  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    cnpj: "",
    telefone: "",
    endereco: "",
  });

  // função para carregar lojas da Organização e sincronizar o seletor global da Sidebar
  // 1 - Busca lojas filtradas por status (todos/ativos/inativos) para listagem na tabela
  // 2 - Atualiza lista de lojas ativas no useTenantStore mantendo dropdown global sempre atualizado
  const fetchLojas = useCallback(async () => {
    setLoading(true);
    try {
      const list = await storesApi.getStores(statusFilter);
      setLojas(list);
      const activeOnly = await storesApi.getStores("ativos");
      syncTenantStores(activeOnly);
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao carregar filiais.",
        tipo: "erro",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, syncTenantStores]);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  const openModal = (store = null) => {
    setEditingStore(store);
    setFormData({
      nome: store?.nome || "",
      slug: store?.slug || "",
      cnpj: store?.cnpj || "",
      telefone: store?.telefone || "",
      endereco: store?.endereco || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStore) {
        await storesApi.updateStore(editingStore.id, formData);
        setModalMsg({ visible: true, mensagem: "Filial atualizada com sucesso!", tipo: "sucesso" });
      } else {
        await storesApi.createStore(formData);
        setModalMsg({ visible: true, mensagem: "Nova loja criada na rede!", tipo: "sucesso" });
      }
      setFormOpen(false);
      await fetchLojas();
    } catch (err) {
      setModalMsg({ visible: true, mensagem: err.message || "Erro ao salvar loja.", tipo: "erro" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (loja) => {
    const novoStatus = !loja.ativo;
    if (
      !novoStatus &&
      !window.confirm(`Deseja desativar a filial "${loja.nome}"? Colaboradores vinculados perderão acesso até reativação.`)
    ) {
      return;
    }
    try {
      await storesApi.toggleStoreStatus(loja.id, novoStatus);
      setModalMsg({
        visible: true,
        mensagem: novoStatus ? `Filial "${loja.nome}" reativada!` : `Filial "${loja.nome}" desativada.`,
        tipo: "sucesso",
      });
      await fetchLojas();
    } catch (err) {
      setModalMsg({ visible: true, mensagem: err.message || "Erro ao alterar status da loja.", tipo: "erro" });
    }
  };

  const handleDelete = async (loja) => {
    if (!window.confirm(`Deseja excluir a loja "${loja.nome}"? Caso possua histórico, será apenas desativada.`)) {
      return;
    }
    try {
      const res = await storesApi.deleteStore(loja.id);
      setModalMsg({
        visible: true,
        mensagem: res.message || "Operação concluída!",
        tipo: "sucesso",
      });
      await fetchLojas();
    } catch (err) {
      setModalMsg({ visible: true, mensagem: err.message || "Erro ao excluir loja.", tipo: "erro" });
    }
  };

  return (
    <div className="w-full min-h-screen pt-2 pb-12 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-purple">
            Rede • {user?.organizacaoNome || "Organização"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Lojas &amp; Filiais
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Cadastre unidades da sua organização, gerencie status operacional e acompanhe equipe e catálogo por loja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
          >
            <option value="todos">Todas</option>
            <option value="ativos">Ativas</option>
            <option value="inativos">Inativas</option>
          </select>

          <button
            onClick={() => openModal(null)}
            className="btn-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <FiPlus size={15} />
            Nova Loja / Filial
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-text-secondary animate-pulse">
          Carregando unidades da organização...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lojas.map((loja) => (
            <div
              key={loja.id}
              className={`glass-card p-5 rounded-2xl flex flex-col justify-between gap-4 border ${
                loja.ativo ? "border-[var(--color-border)]" : "border-accent-red/30 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display font-bold text-base text-text-primary truncate">
                        {loja.nome}
                      </h2>
                      <p className="font-mono text-[11px] text-text-secondary truncate">
                        @{loja.slug} · ID #{loja.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      loja.ativo
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : "bg-red-500/15 text-red-500 border border-red-500/30"
                    }`}
                  >
                    {loja.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-text-secondary">
                  {loja.endereco && (
                    <p className="flex items-center gap-2">
                      <FiMapPin size={12} className="shrink-0 text-accent-pink" />
                      <span className="truncate">{loja.endereco}</span>
                    </p>
                  )}
                  {loja.telefone && (
                    <p className="flex items-center gap-2">
                      <FiPhone size={12} className="shrink-0 text-accent-purple" />
                      <span>{loja.telefone}</span>
                    </p>
                  )}
                  {loja.cnpj && <p className="font-mono text-[11px]">CNPJ: {loja.cnpj}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--color-border-light)] text-center">
                  <div className="p-2 rounded-xl bg-[var(--color-bg)]">
                    <p className="font-display font-bold text-sm text-text-primary">
                      {loja._count?.usuarios || 0}
                    </p>
                    <p className="text-[10px] text-text-secondary">Equipe</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--color-bg)]">
                    <p className="font-display font-bold text-sm text-text-primary">
                      {loja._count?.produtos || 0}
                    </p>
                    <p className="text-[10px] text-text-secondary">Produtos</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--color-bg)]">
                    <p className="font-display font-bold text-sm text-text-primary">
                      {loja._count?.pedidos || 0}
                    </p>
                    <p className="text-[10px] text-text-secondary">Pedidos</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-light)]">
                <button
                  onClick={() => openModal(loja)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-text-primary hover:border-accent-purple flex items-center gap-1.5"
                >
                  <FiEdit2 size={12} />
                  Editar
                </button>
                <button
                  onClick={() => handleToggleStatus(loja)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-text-secondary hover:text-accent-pink flex items-center gap-1.5"
                >
                  <FiPower size={12} />
                  {loja.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDelete(loja)}
                  className="p-1.5 rounded-lg border border-red-500/25 text-red-500 hover:bg-red-500/10"
                  title="Excluir loja"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h3 className="font-display text-lg font-bold text-text-primary">
                  {editingStore ? `Editar ${editingStore.nome}` : "Cadastrar Nova Loja"}
                </h3>
                <button onClick={() => setFormOpen(false)} className="text-text-secondary hover:text-text-primary">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Nome da Loja / Filial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: TechStock Filial Sul"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Código único (slug opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="Ex: techstock-sul"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs font-mono text-text-primary outline-none focus:border-accent-purple"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Av. Brasil, 500"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg)] text-xs text-text-primary outline-none focus:border-accent-purple"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 text-xs rounded-xl border border-[var(--color-border)] text-text-secondary hover:text-text-primary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-5 py-2 text-xs font-semibold"
                  >
                    {saving ? "Salvando..." : editingStore ? "Salvar Alterações" : "Criar Loja"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ModalMensagem
        visible={modalMsg.visible}
        mensagem={modalMsg.mensagem}
        tipo={modalMsg.tipo}
        onClose={() => setModalMsg({ ...modalMsg, visible: false })}
      />
    </div>
  );
};

export default Lojas;
