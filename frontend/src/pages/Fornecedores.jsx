import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import EditarItem from "../components/forms/EditarItem.jsx";
import FornecedorDashboard from "../components/dashboard/FornecedorDashboard.jsx";
import FornecedoresTable from "../components/tables/FornecedoresTable.jsx";
import { suppliersApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalFornecedor from "../components/forms/ModalFornecedor.jsx";

const Fornecedores = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState("CriarFornecedor");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dataSup, dataStats] = await Promise.all([
        suppliersApi.getSuppliers(),
        suppliersApi.getSupplierStats(),
      ]);

      setFornecedores(dataSup.fornecedores || []);
      setStats(dataStats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await suppliersApi.deleteSupplier(id);
      setModalMsg({ visible: true, mensagem: "Fornecedor excluído com sucesso!", tipo: "sucesso" });
      fetchData();
    } catch (err) {
      console.error(err);
      setModalMsg({ visible: true, mensagem: "Erro ao excluir fornecedor", tipo: "erro" });
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
    fetchData();
  };

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
            Parceiros
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">Fornecedores</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Gerencie parceiros e visualize métricas de desempenho.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[var(--ink)] text-[var(--bg)] px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
        >
          <FiPlus size={15} /> Novo fornecedor
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--ink-soft)]">Carregando fornecedores...</span>
        </div>
      ) : (
        <>
          <FornecedorDashboard stats={stats} loading={loading} />

          <FornecedoresTable
            fornecedores={fornecedores}
            loading={loading}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onOpenDetails={(fornecedor) => setFornecedorSelecionado(fornecedor)}
          />
        </>
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
          onClose={() => setModalMsg({ visible: false })}
        />
      )}

      {fornecedorSelecionado && (
        <ModalFornecedor
          fornecedor={fornecedorSelecionado}
          fecharModal={() => setFornecedorSelecionado(null)}
          onEdit={(f) => {
            setFornecedorSelecionado(null);
            openEditModal(f);
          }}
          onDelete={(id) => {
            setFornecedorSelecionado(null);
            handleDelete(id);
          }}
        />
      )}
    </div>
  );
};

export default Fornecedores;