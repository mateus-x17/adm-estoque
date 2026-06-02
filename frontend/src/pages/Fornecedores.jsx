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

    // Modal & Form
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
                suppliersApi.getSupplierStats()
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
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Fornecedores
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie parceiros e visualize métricas de desempenho
                    </p>
                </div>
            </header>

            {/* Button */}
            <div className="flex justify-end">
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                    <FiPlus /> Novo Fornecedor
                </button>
            </div>

            {/* Dashboard Section */}
            <FornecedorDashboard stats={stats} loading={loading} />

            {/* Table */}
            <FornecedoresTable
                fornecedores={fornecedores}
                loading={loading}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onOpenDetails={(fornecedor) => setFornecedorSelecionado(fornecedor)}
            />

            {/* Modal */}
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
