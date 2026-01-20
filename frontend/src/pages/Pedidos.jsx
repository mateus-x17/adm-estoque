import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import { FiShoppingCart } from "react-icons/fi";
import PedidoRow from "../components/PedidoRow";
import EditarItem from "../components/EditarItem";

const Pedidos = () => {
    const { token } = useUserStore();
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchPedidos();
    }, [token]);

    const fetchPedidos = async () => {
        try {
            // Reutilizando endpoint de movimentações
            const res = await fetch("http://localhost:5000/movements?order=desc", {
                headers: { authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPedidos(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleItemCreated = () => {
        fetchPedidos();
    }

    return (
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Pedidos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie pedidos e registre movimentações de estoque
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                    <FiShoppingCart /> Novo Pedido
                </button>
            </header>

            {/* Lista de Pedidos Recentes */}
            <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Pedidos</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-300">
                            <tr>
                                <th className="hidden md:table-cell px-6 py-4">ID</th>
                                <th className="hidden md:table-cell px-6 py-4">Produto</th>
                                <th className="hidden md:table-cell px-6 py-4">Tipo</th>
                                <th className="hidden md:table-cell px-6 py-4 text-center">Quantidade</th>
                                <th className="hidden md:table-cell px-6 py-4">Data</th>
                                <th className="hidden md:table-cell px-6 py-4">Resp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        Nenhum pedido registrado.
                                    </td>
                                </tr>
                            ) : (
                                pedidos.map((ped, index) => (
                                    <PedidoRow key={ped.id} pedido={ped} index={index} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo Pedido */}
            {modalOpen && (
                <EditarItem
                    type="CriarPedido"
                    itemData={null}
                    onClose={() => setModalOpen(false)}
                    onItemUpdated={handleItemCreated}
                />
            )}
        </div>
    );
};

export default Pedidos;
