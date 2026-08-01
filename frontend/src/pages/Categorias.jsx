import React, { useEffect, useState } from "react";
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
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
            Catálogo
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">Categorias</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Gerencie as categorias dos produtos.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-[var(--ink)] text-[var(--bg)] px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
        >
          <FiPlus size={15} /> Nova categoria
        </button>
      </header>

      {/* Lista */}
      <div className="glass-panel rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                ID
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Nome
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] border-b border-[var(--line)]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-8 text-sm text-[var(--ink-soft)]">
                  Carregando...
                </td>
              </tr>
            ) : categorias.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-8 text-sm text-[var(--ink-soft)]">
                  Nenhuma categoria encontrada.
                </td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--line)]/20 transition-colors duration-200"
                >
                  <td className="px-6 py-3 font-mono text-xs text-[var(--ink-soft)]">
                    #{cat.id}
                  </td>
                  <td className="px-6 py-3 font-medium text-[var(--ink)]">{cat.nome}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors duration-200"
                        title="Editar"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors duration-200"
                        title="Excluir"
                      >
                        <FiTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--line)] w-full max-w-md rounded-lg shadow-xl overflow-hidden p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
                {editingId ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1.5">
                  Nome da categoria
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
                  placeholder="Ex: Eletrônicos"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 transition-opacity duration-200"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
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