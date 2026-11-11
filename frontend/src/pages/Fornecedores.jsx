import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiSliders, FiSearch } from "react-icons/fi";
import EditarItem from "../components/forms/EditarItem.jsx";
import FornecedorDashboard from "../components/dashboard/FornecedorDashboard.jsx";
import FornecedoresTable from "../components/tables/FornecedoresTable.jsx";
import { suppliersApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalConfirmacao from "../components/common/ModalConfirmacao.jsx";
import ModalFornecedor from "../components/forms/ModalFornecedor.jsx";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";

// arquivo responsável pela página de listagem e gestão de fornecedores por Organização/Loja com RBAC, filtros colapsáveis e Soft Delete

// função responsável por renderizar a página de listagem, métricas e gestão de fornecedores com RBAC.
//
// 1 - recebe nenhum parâmetro direto (usa usuário logado e loja selecionada via Zustand).
// 2 - busca fornecedores e estatísticas agregadas permitindo filtros de texto e status (ativo/inativo).
// 3 - retorna o dashboard de fornecedores, listagem e modais de criação/edição e confirmação.
const Fornecedores = () => {
  const user = useUserStore((state) => state.user);
  const selectedLojaId = useTenantStore((state) => state.selectedLojaId);
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";
  const canDelete = user?.role === "ADMIN";

  const [fornecedores, setFornecedores] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState("ativos");
  const [searchFiltro, setSearchFiltro] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState("CriarFornecedor");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, item: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // função para buscar fornecedores filtrados por status e métricas agregadas da rede/loja
  const fetchData = useCallback(
    async (status = statusFiltro) => {
      setLoading(true);
      try {
        const [dataSup, dataStats] = await Promise.all([
          suppliersApi.getSuppliers({
            status,
            ...(selectedLojaId && selectedLojaId !== "all" ? { lojaId: selectedLojaId } : {}),
          }),
          suppliersApi.getSupplierStats(status),
        ]);

        setFornecedores(dataSup.fornecedores || []);
        setStats(dataStats || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [statusFiltro, selectedLojaId]
  );

  useEffect(() => {
    fetchData(statusFiltro);
  }, [statusFiltro, fetchData]);

  const fornecedoresFiltrados = useMemo(() => {
    const q = searchFiltro.trim().toLowerCase();
    if (!q) return fornecedores;
    return fornecedores.filter(
      (f) =>
        f.nome?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q) ||
        f.endereco?.toLowerCase().includes(q) ||
        String(f.id) === q
    );
  }, [fornecedores, searchFiltro]);

  // função para alternar status ativo/inativo de um fornecedor com confirmação estilizada ao inativar
  const executeToggleStatus = async (fornecedor) => {
    const novoStatus = fornecedor.ativo === false;
    setConfirmLoading(true);
    try {
      await suppliersApi.toggleSupplierStatus(fornecedor.id, novoStatus);
      setModalMsg({
        visible: true,
        mensagem: novoStatus
          ? `Fornecedor "${fornecedor.nome}" reativado com sucesso!`
          : `Fornecedor "${fornecedor.nome}" marcado como inativo.`,
        tipo: "sucesso",
      });
      setFornecedorSelecionado(null);
      fetchData(statusFiltro);
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao alterar status do fornecedor",
        tipo: "erro",
      });
    } finally {
      setConfirmLoading(false);
      setConfirmState({ isOpen: false, action: null, item: null });
    }
  };

  const handleToggleStatus = (fornecedor) => {
    if (fornecedor.ativo === false) {
      executeToggleStatus(fornecedor);
      return;
    }
    setConfirmState({ isOpen: true, action: "inactivate", item: fornecedor });
  };

  // função para excluir ou aplicar Soft Delete automático em um fornecedor com confirmação estilizada
  const executeDelete = async (fornecedor) => {
    const targetId = typeof fornecedor === "object" ? fornecedor.id : fornecedor;
    setConfirmLoading(true);
    try {
      const result = await suppliersApi.deleteSupplier(targetId);
      setModalMsg({
        visible: true,
        mensagem: result?.message || "Fornecedor removido com sucesso!",
        tipo: "sucesso",
      });
      setFornecedorSelecionado(null);
      fetchData(statusFiltro);
    } catch (err) {
      console.error(err);
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao excluir fornecedor",
        tipo: "erro",
      });
    } finally {
      setConfirmLoading(false);
      setConfirmState({ isOpen: false, action: null, item: null });
    }
  };

  const handleDelete = (fornecedor) => {
    setConfirmState({ isOpen: true, action: "delete", item: fornecedor });
  };

  const openNewModal = () => {
    setEditingItem(null);
    setModalType("CriarFornecedor");
    setModalOpen(true);
  };

  const openEditModal = (fornecedor) => {
    setEditingItem(fornecedor);
    setModalType("fornecedor");
    setModalOpen(true);
  };

  const handleItemUpdated = () => {
    fetchData(statusFiltro);
  };

  return (
    <div className="w-full pb-6 space-y-4 sm:space-y-5 max-w-[1440px] mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-2 pb-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Parceiros
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Fornecedores
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gerencie parceiros, visualize inativos e acompanhe métricas de desempenho da loja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFiltrosAbertos((prev) => !prev)}
            className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5"
          >
            <FiSliders size={13} />
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          {canManage && (
            <button
              onClick={openNewModal}
              className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiPlus size={14} /> Novo fornecedor
            </button>
          )}
        </div>
      </header>

      {filtrosAbertos && (
        <section className="glass-card p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-up">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchFiltro}
              onChange={(e) => setSearchFiltro(e.target.value)}
              placeholder="Buscar por nome, e-mail ou endereço..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
          >
            <option value="ativos">Somente Ativos</option>
            <option value="inativos">Somente Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-14">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando fornecedores...</span>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <FornecedorDashboard stats={stats} loading={loading} statusFiltro={statusFiltro} />

          <FornecedoresTable
            fornecedores={fornecedoresFiltrados}
            loading={loading}
            statusFiltro={statusFiltro}
            onEdit={openEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onOpenDetails={(fornecedor) => setFornecedorSelecionado(fornecedor)}
            canManage={canManage}
            canDelete={canDelete}
          />
        </div>
      )}

      {modalOpen && (
        <EditarItem
          type={modalType}
          itemData={editingItem}
          onClose={() => setModalOpen(false)}
          onItemUpdated={handleItemUpdated}
        />
      )}

      <ModalMensagem
        visible={modalMsg.visible}
        mensagem={modalMsg.mensagem}
        tipo={modalMsg.tipo}
        onClose={() => setModalMsg({ visible: false, mensagem: "", tipo: "" })}
      />

      {fornecedorSelecionado && (
        <ModalFornecedor
          fornecedor={fornecedorSelecionado}
          fecharModal={() => setFornecedorSelecionado(null)}
          canManage={canManage}
          canDelete={canDelete}
          onEdit={(f) => {
            setFornecedorSelecionado(null);
            openEditModal(f);
          }}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}

      <ModalConfirmacao
        isOpen={confirmState.isOpen}
        variant={confirmState.action === "delete" ? "danger" : "warning"}
        loading={confirmLoading}
        title={confirmState.action === "delete" ? "Excluir fornecedor" : "Inativar fornecedor"}
        message={
          confirmState.action === "delete"
            ? `Deseja excluir o fornecedor "${confirmState.item?.nome}"? Se houver produtos ou pedidos vinculados, ele será preservado como inativo.`
            : `Deseja inativar o fornecedor "${confirmState.item?.nome}"? Ele ficará oculto para novas compras até ser reativado.`
        }
        confirmText={confirmState.action === "delete" ? "Sim, excluir" : "Sim, inativar"}
        onCancel={() => setConfirmState({ isOpen: false, action: null, item: null })}
        onConfirm={() =>
          confirmState.action === "delete"
            ? executeDelete(confirmState.item)
            : executeToggleStatus(confirmState.item)
        }
      />
    </div>
  );
};

export default Fornecedores;
