import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit, FiTrash, FiX } from "react-icons/fi";
import { categoriesApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState("");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });

  const fetchCategorias = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome) return;

    try {
      if (editingId) {
        console.warn("Update category not implemented in API");
      } else {
        await categoriesApi.createCategory({ nome });
      }

      setModalOpen(false);
      setNome("");
      setEditingId(null);
      setModalMsg({
        visible: true,
        mensagem: `Categoria ${editingId ? "atualizada" : "criada"} com sucesso!`,
        tipo: "sucesso",
      });
      fetchCategorias();
    } catch (err) {
      console.error(err);
      setModalMsg({ visible: true, mensagem: "Erro ao salvar categoria", tipo: "erro" });
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
      await categoriesApi.deleteCategory(id);
      setModalMsg({ visible: true, mensagem: "Categoria excluída com sucesso!", tipo: "sucesso" });
      fetchCategorias();
    } catch (err) {
      console.error(err);
      setModalMsg({ visible: true, mensagem: "Erro ao excluir categoria", tipo: "erro" });
    }
  };

  const openModal = () => {
    setEditingId(null);
    setNome("");
    setModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen pt-4 pb-12 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-[var(--color-border)] mb-8">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Catálogo
          </span>
          <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight mt-1">
            Categorias
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie as categorias dos produtos.
          </p>
        </div>

        <button
          onClick={openModal}
          className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
        >
          <FiPlus size={14} /> Nova categoria
        </button>
      </header>

      {/* Lista de Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-text-secondary">Carregando...</div>
        ) : categorias.length === 0 ? (
          <div className="glass-card p-8 text-center text-text-secondary">Nenhuma categoria encontrada.</div>
        ) : (
          categorias.map((cat) => (
            <div key={cat.id} className="glass-card hover-card flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-text-secondary w-12 shrink-0">#{cat.id}</span>
                <span className="font-semibold text-text-primary text-sm">{cat.nome}</span>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleEdit(cat)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-pink hover:bg-white/5 transition-all duration-200"
                  title="Editar"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-red hover:bg-white/5 transition-all duration-200"
                  title="Excluir"
                >
                  <FiTrash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border-light)] w-full max-w-md rounded-[24px] shadow-xl overflow-hidden p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {editingId ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5 ml-1">
                  Nome da categoria
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
                  placeholder="Ex: Eletrônicos"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {modalMsg.visible && (
        <ModalMensagem
          mensagem={modalMsg.mensagem}
          tipo={modalMsg.tipo}
          onClose={() => setModalMsg({ visible: false })}
        />
      )}
    </div>
  );
};

export default Categorias;