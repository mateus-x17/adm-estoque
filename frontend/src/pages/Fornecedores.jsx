import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";
import { FiPlus } from "react-icons/fi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import FornecedorRow from "../components/FornecedorRow";
import EditarItem from "../components/EditarItem";

const Fornecedores = () => {
    const url = "http://localhost:5000/suppliers";
    const { token } = useUserStore();

    const [fornecedores, setFornecedores] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalType, setModalType] = useState("CriarFornecedor");

    // Cores gráfico
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const [resSup, resStats] = await Promise.all([
                fetch(url, { headers: { authorization: `Bearer ${token}` } }),
                fetch(`${url}/stats`, { headers: { authorization: `Bearer ${token}` } })
            ]);

            const dataSup = await resSup.json();
            const dataStats = await resStats.json();

            setFornecedores(dataSup.fornecedores || []);
            setStats(dataStats);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Excluir fornecedor?")) return;
        try {
            await fetch(`${url}/${id}`, {
                method: "DELETE",
                headers: { authorization: `Bearer ${token}` },
            });
            fetchData();
        } catch (err) {
            console.error(err);
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
        // EditarItem closes itself or we might need to handle closing if it doesn't fully manage 'modalOpen' state 
        // passing 'onClose' to it which sets modalOpen(false).
    };

    const barChartData = stats.map(s => ({
        name: s.nome,
        Entradas: s.totalEntradas,
        Saidas: s.totalSaidas
    }));

    return (
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Fornecedores
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie parceiros e visualize métricas de desempenho
                    </p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                    <FiPlus /> Novo Fornecedor
                </button>
            </header>

            {/* Dashboard Section */}
            {!loading && stats.length > 0 && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Movimentações por Fornecedor</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barChartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Destaques</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {stats.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {s.nome.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{s.nome}</p>
                                            <p className="text-xs text-slate-500">Vol. Total: {s.totalMovimentacoes}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Produto Top</p>
                                        <p className="font-medium text-sm text-indigo-600 dark:text-indigo-400">{s.produtoMaisMovimentado}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Tabela */}
            <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-300">
                        <tr>
                            <th className="hidden md:table-cell px-6 py-4">ID</th>
                            <th className="hidden md:table-cell px-6 py-4">Nome</th>
                            <th className="hidden md:table-cell px-6 py-4">Contato</th>
                            <th className="hidden md:table-cell px-6 py-4">Endereço</th>
                            <th className="hidden md:table-cell px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="5" className="p-6 text-center">Carregando...</td></tr>
                        ) : fornecedores.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center">Nenhum fornecedor cadastrado.</td></tr>
                        ) : (
                            fornecedores.map((sup, index) => (
                                <FornecedorRow
                                    key={sup.id}
                                    fornecedor={sup}
                                    index={index}
                                    onEdit={openEditModal}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal com EditarItem */}
            {modalOpen && (
                <EditarItem
                    type={modalType}
                    itemData={editingItem}
                    onClose={() => setModalOpen(false)}
                    onItemUpdated={handleItemUpdated}
                />
            )}

        </div>
    );
};

export default Fornecedores;
