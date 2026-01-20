import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";
import { FiPlus, FiEdit, FiTrash, FiX } from "react-icons/fi";

const Categorias = () => {
    const url = "http://localhost:5000/categories";
    const { token } = useUserStore();

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [nome, setNome] = useState("");

    const fetchCategorias = async () => {
        try {
            const res = await fetch(url, {
                headers: { authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCategorias(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome) return;

        try {
            const method = editingId ? "PUT" : "POST";
            const endpoint = editingId ? `${url}/${editingId}` : url;

            const res = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ nome }),
            });

            if (res.ok) {
                setModalOpen(false);
                setNome("");
                setEditingId(null);
                fetchCategorias();
            } else {
                alert("Erro ao salvar categoria");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setNome(cat.nome);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) return;

        try {
            const res = await fetch(`${url}/${id}`, {
                method: "DELETE",
                headers: { authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchCategorias();
            } else {
                alert("Erro ao excluir categoria");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openModal = () => {
        setEditingId(null);
        setNome("");
        setModalOpen(true);
    };

    return (
        <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Categorias
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie as categorias dos produtos
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FiPlus /> Nova Categoria
                </button>
            </header>

            {/* Lista */}
            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="text-center py-6">
                                    Carregando...
                                </td>
                            </tr>
                        ) : categorias.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center py-6">
                                    Nenhuma categoria encontrada.
                                </td>
                            </tr>
                        ) : (
                            categorias.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">#{cat.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {cat.nome}
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-4">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                            title="Excluir"
                                        >
                                            <FiTrash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? "Editar Categoria" : "Nova Categoria"}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome da Categoria
                                </label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Ex: Eletrônicos"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categorias;
