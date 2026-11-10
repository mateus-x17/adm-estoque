import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit, FiTrash, FiX, FiPower } from "react-icons/fi";
import { categoriesApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pela página de gestão de categorias com RBAC e Soft Delete por estabelecimento

const Categorias = () => {
  const user = useUserStore((state) => state.user);
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";
  const canDelete = user?.role === "ADMIN";

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState("ativos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState("");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });

  // função para carregar as categorias da loja conforme o filtro de status selecionado
  // 1 - Aciona categoriesApi.getCategories informando status ('ativos', 'inativos' ou 'todos')
  // 2 - Atualiza o estado local garantindo array válido e encerra loading
  const fetchCategorias = useCallback(async (status = statusFiltro) => {
    setLoading(true);
    try {
      const data = await categoriesApi.getCategories({ status });
      setCategorias(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    fetchCategorias(statusFiltro);
  }, [statusFiltro, fetchCategorias]);

  // função para salvar criação ou edição de categoria via API real
  // 1 - Se editingId existir, chama PUT /categories/:id; caso contrário, chama POST /categories
  // 2 - Fecha modal, exibe mensagem de confirmação e recarrega a lista
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      if (editingId) {
        await categoriesApi.updateCategory(editingId, { nome: nome.trim() });
      } else {
        await categoriesApi.createCategory({ nome: nome.trim() });
      }

      setModalOpen(false);
      setNome("");
      setEditingId(null);
      setModalMsg({
        visible: true,
        mensagem: `Categoria ${editingId ? "atualizada" : "criada"} com sucesso!`,
        tipo: "sucesso",
      });
      fetchCategorias(statusFiltro);
    } catch (err) {
      console.error(err);
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao salvar categoria",
        tipo: "erro",
      });
    }
  };

  // função para abrir modal preenchido para edição da categoria selecionada
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setNome(cat.nome);
    setModalOpen(true);
  };

  // função para alternar status ativo/inativo da categoria (Soft Delete)
  // 1 - Envia PATCH /categories/:id/status invertendo o estado atual
  // 2 - Atualiza a listagem e exibe confirmação na tela
  const handleToggleStatus = async (cat) => {
    const novoStatus = cat.ativo === false;
    if (!novoStatus && !window.confirm(`Deseja inativar a categoria "${cat.nome}"?`)) {
      return;
    }

    try {
      await categoriesApi.toggleCategoryStatus(cat.id, novoStatus);
      setModalMsg({
        visible: true,
        mensagem: novoStatus
          ? `Categoria "${cat.nome}" reativada com sucesso!`
          : `Categoria "${cat.nome}" marcada como inativa.`,
        tipo: "sucesso",
      });
      fetchCategorias(statusFiltro);
    } catch (err) {
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao alterar status da categoria",
        tipo: "erro",
      });
    }
  };

  // função para excluir ou aplicar Soft Delete automático em uma categoria (exclusivo ADMIN)
  // 1 - Solicita confirmação ao administrador antes de chamar DELETE /categories/:id
  // 2 - Exibe a mensagem devolvida pelo servidor (exclusão física ou preservação lógica se houver produtos)
  const handleDelete = async (cat) => {
    if (
      !window.confirm(
        `Deseja excluir a categoria "${cat.nome}"? Se houver produtos vinculados, ela será apenas inativada.`
      )
    ) {
      return;
    }

    try {
      const result = await categoriesApi.deleteCategory(cat.id);
      setModalMsg({
        visible: true,
        mensagem: result?.message || "Categoria excluída com sucesso!",
        tipo: "sucesso",
      });
      fetchCategorias(statusFiltro);
    } catch (err) {
      console.error(err);
      setModalMsg({
        visible: true,
        mensagem: err.message || "Erro ao excluir categoria",
        tipo: "erro",
      });
    }
  };

  // função para abrir o modal limpo para cadastro de nova categoria
  const openModal = () => {
    setEditingId(null);
    setNome("");
    setModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Catálogo
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Categorias
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Gerencie as categorias dos produtos do estabelecimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
          >
            <option value="ativos">Somente Ativas</option>
            <option value="inativos">Somente Inativas</option>
            <option value="todos">Todas</option>
          </select>

          {canManage && (
            <button
              onClick={openModal}
              className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none"
            >
              <FiPlus size={14} /> Nova categoria
            </button>
          )}
        </div>
      </header>

      {/* Lista de Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-sm text-text-secondary">
            Carregando categorias...
          </div>
        ) : categorias.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-text-secondary">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          categorias.map((cat) => {
            const isInactive = cat.ativo === false;
            return (
              <div
                key={cat.id}
                className={`glass-card hover-card flex items-center justify-between p-4 px-4 sm:px-5 gap-3 ${
                  isInactive ? "opacity-75 border-dashed" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className="font-mono text-xs text-text-secondary shrink-0">
                    #{cat.id}
                  </span>
                  <span className="font-semibold text-text-primary text-sm truncate">
                    {cat.nome}
                  </span>
                  {isInactive && (
                    <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/25 font-mono text-[10px] uppercase shrink-0">
                      Inativa
                    </span>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-pink hover:bg-white/5 transition-all duration-200"
                      title="Editar categoria"
                    >
                      <FiEdit size={16} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(cat)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                        isInactive
                          ? "text-accent-green hover:bg-accent-green/10"
                          : "text-text-secondary hover:text-amber-400 hover:bg-white/5"
                      }`}
                      title={isInactive ? "Reativar categoria" : "Inativar categoria"}
                    >
                      <FiPower size={16} />
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(cat)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-accent-red hover:bg-white/5 transition-all duration-200"
                        title="Excluir categoria"
                      >
                        <FiTrash size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-[var(--color-bg)] border border-[var(--color-border-light)] w-full max-w-md rounded-[24px] shadow-xl overflow-hidden p-5 sm:p-6 animate-scale-in"
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary px-4 py-2 text-xs font-semibold w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2 text-xs font-semibold w-full sm:w-auto"
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
          onClose={() => setModalMsg({ visible: false, mensagem: "", tipo: "" })}
        />
      )}
    </div>
  );
};

export default Categorias;
