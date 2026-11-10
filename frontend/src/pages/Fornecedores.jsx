import React, { useCallback, useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import EditarItem from "../components/forms/EditarItem.jsx";
import FornecedorDashboard from "../components/dashboard/FornecedorDashboard.jsx";
import FornecedoresTable from "../components/tables/FornecedoresTable.jsx";
import { suppliersApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalFornecedor from "../components/forms/ModalFornecedor.jsx";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pela página de listagem e gestão de fornecedores por loja com RBAC e Soft Delete

const Fornecedores = () => {
  const user = useUserStore((state) => state.user);
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";
  const canDelete = user?.role === "ADMIN";

  const [fornecedores, setFornecedores] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState("ativos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState("CriarFornecedor");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // função para buscar fornecedores filtrados por status e métricas agregadas da loja
  // 1 - Dispara requisições paralelas de listagem e estatísticas
  // 2 - Atualiza estados locais de tabela e gráficos com segurança
  const fetchData = useCallback(async (status = statusFiltro) => {
    setLoading(true);
    try {
      const [dataSup, dataStats] = await Promise.all([
        suppliersApi.getSuppliers({ status }),
        suppliersApi.getSupplierStats(),
      ]);

      setFornecedores(dataSup.fornecedores || []);
      setStats(dataStats || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    fetchData(statusFiltro);
  }, [statusFiltro, fetchData]);

  // função para alternar status ativo/inativo de um fornecedor via Soft Delete
  // 1 - Solicita confirmação caso esteja inativando o parceiro
  // 2 - Envia PATCH /suppliers/:id/status e recarrega lista e métricas
  const handleToggleStatus = async (fornecedor) => {
    const novoStatus = fornecedor.ativo === false;
    if (!novoStatus && !window.confirm(`Deseja inativar o fornecedor "${fornecedor.nome}"?`)) {
      return;
    }

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
    }
  };

  // função para excluir ou aplicar Soft Delete automático em um fornecedor (exclusivo ADMIN)
  // 1 - Confirma a exclusão e chama DELETE /suppliers/:id
  // 2 - Exibe o retorno do backend informando remoção física ou preservação como inativo
  const handleDelete = async (fornecedor) => {
    const targetId = typeof fornecedor === "object" ? fornecedor.id : fornecedor;
    const targetName = typeof fornecedor === "object" ? fornecedor.nome : `#${targetId}`;

    if (
      !window.confirm(
        `Deseja excluir o fornecedor "${targetName}"? Se houver produtos vinculados, ele será preservado como inativo.`
      )
    ) {
      return;
    }

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
    }
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
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Parceiros
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Fornecedores
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Gerencie parceiros e visualize métricas de desempenho da loja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
          >
            <option value="ativos">Somente Ativos</option>
            <option value="inativos">Somente Inativos</option>
            <option value="todos">Todos</option>
          </select>

          {canManage && (
            <button
              onClick={openNewModal}
              className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none"
            >
              <FiPlus size={14} /> Novo fornecedor
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando fornecedores...</span>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <FornecedorDashboard stats={stats} loading={loading} />

          <FornecedoresTable
            fornecedores={fornecedores}
            loading={loading}
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

      {modalMsg.visible && (
        <ModalMensagem
          mensagem={modalMsg.mensagem}
          tipo={modalMsg.tipo}
          onClose={() => setModalMsg({ visible: false, mensagem: "", tipo: "" })}
        />
      )}

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
    </div>
  );
};

export default Fornecedores;
