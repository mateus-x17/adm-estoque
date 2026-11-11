import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit, FiTrash, FiX, FiPower, FiSliders, FiSearch } from "react-icons/fi";
import { categoriesApi } from "../services/api/index.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalConfirmacao from "../components/common/ModalConfirmacao.jsx";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";

// arquivo responsável pela página de gestão de categorias com RBAC, multi-loja, filtros colapsáveis e Soft Delete

// função responsável por renderizar a página de gestão de categorias de produtos por Organização e Loja.
//
// 1 - recebe nenhum parâmetro direto (verifica permissões RBAC e filial ativa nas stores Zustand).
// 2 - busca categorias filtradas por status/texto e executa criação, edição, Soft Delete e exclusão.
// 3 - retorna a lista compacta de categorias e modais de edição/confirmação.
const Categorias = () => {
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId } = useTenantStore();
  const isAdmin = user?.role === "ADMIN";
  const canManage = user?.role === "ADMIN" || user?.role === "GERENTE";
  const canDelete = user?.role === "ADMIN";

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState("ativos");
  const [searchFiltro, setSearchFiltro] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState("");
  const [targetLojaId, setTargetLojaId] = useState("");
  const [modalMsg, setModalMsg] = useState({ visible: false, mensagem: "", tipo: "" });

  const [confirmState, setConfirmState] = useState({ isOpen: false, action: null, item: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // função para carregar as categorias da organização/loja conforme filtro de status e loja selecionada
  const fetchCategorias = useCallback(
    async (status = statusFiltro) => {
      setLoading(true);
      try {
        const data = await categoriesApi.getCategories({
          status,
          ...(selectedLojaId && selectedLojaId !== "all" ? { lojaId: selectedLojaId } : {}),
        });
        setCategorias(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [statusFiltro, selectedLojaId]
  );

  useEffect(() => {
    fetchCategorias(statusFiltro);
  }, [statusFiltro, fetchCategorias]);

  const categoriasFiltradas = useMemo(() => {
    const q = searchFiltro.trim().toLowerCase();
    if (!q) return categorias;
    return categorias.filter(
      (c) =>
        c.nome?.toLowerCase().includes(q) ||
        String(c.id) === q ||
        c.loja?.nome?.toLowerCase().includes(q)
    );
  }, [categorias, searchFiltro]);

  // função para salvar criação ou edição de categoria via API real
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      if (editingId) {
        await categoriesApi.updateCategory(editingId, { nome: nome.trim() });
      } else {
        await categoriesApi.createCategory({
          nome: nome.trim(),
          ...(isAdmin && targetLojaId ? { lojaId: Number(targetLojaId) } : {}),
        });
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

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setNome(cat.nome);
    setModalOpen(true);
  };

  // função para alternar status ativo/inativo da categoria com confirmação estilizada ao inativar
  const executeToggleStatus = async (cat) => {
    const novoStatus = cat.ativo === false;
    setConfirmLoading(true);
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
    } finally {
      setConfirmLoading(false);
      setConfirmState({ isOpen: false, action: null, item: null });
    }
  };

  const handleToggleStatus = (cat) => {
    if (cat.ativo === false) {
      executeToggleStatus(cat);
      return;
    }
    setConfirmState({ isOpen: true, action: "inactivate", item: cat });
  };

  // função para excluir ou aplicar Soft Delete automático em uma categoria com confirmação estilizada
  const executeDelete = async (cat) => {
    setConfirmLoading(true);
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
    } finally {
      setConfirmLoading(false);
      setConfirmState({ isOpen: false, action: null, item: null });
    }
  };

  const handleDelete = (cat) => {
    setConfirmState({ isOpen: true, action: "delete", item: cat });
  };

  const openModal = () => {
    setEditingId(null);
    setNome("");
    setModalOpen(true);
  };

  return (
    <div className="w-full pb-6 space-y-4 sm:space-y-5 max-w-[1440px] mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-2 pb-3 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Catálogo
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Categorias
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gerencie as categorias dos produtos do estabelecimento.
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
              onClick={openModal}
              className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiPlus size={14} /> Nova categoria
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
              placeholder="Buscar por nome, #ID ou loja..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
          >
            <option value="ativos">Somente Ativas</option>
            <option value="inativos">Somente Inativas</option>
            <option value="todos">Todas</option>
          </select>
        </section>
      )}

      {/* Lista de Cards */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="glass-card p-6 text-center text-sm text-text-secondary">
            Carregando categorias...
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-text-secondary">
            {statusFiltro === "inativos"
              ? "Não há categorias inativas no momento."
              : "Nenhuma categoria encontrada."}
          </div>
        ) : (
          categoriasFiltradas.map((cat) => {
            const isInactive = cat.ativo === false;
            return (
              <div
                key={cat.id}
                className={`glass-card hover-card flex items-center justify-between px-4 py-3 gap-3 ${
                  isInactive ? "opacity-75 border-dashed" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className="font-mono text-xs text-text-secondary shrink-0">#{cat.id}</span>
                  <span className="font-semibold text-text-primary text-sm truncate">{cat.nome}</span>
                  {cat.loja?.nome && (
                    <span className="font-mono text-[10px] text-text-secondary hidden sm:inline shrink-0">
                      @{cat.loja.nome}
                    </span>
                  )}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingId && isAdmin && stores.length > 0 && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5 ml-1">
                      Loja / Filial Destino
                    </label>
                    <select
                      value={
                        targetLojaId ||
                        (selectedLojaId !== "all" ? selectedLojaId : String(stores[0].id))
                      }
                      onChange={(e) => setTargetLojaId(e.target.value)}
                      className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none"
                    >
                      {stores.map((st) => (
                        <option key={st.id} value={String(st.id)}>
                          {st.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

      <ModalConfirmacao
        isOpen={confirmState.isOpen}
        variant={confirmState.action === "delete" ? "danger" : "warning"}
        loading={confirmLoading}
        title={confirmState.action === "delete" ? "Excluir categoria" : "Inativar categoria"}
        message={
          confirmState.action === "delete"
            ? `Deseja excluir a categoria "${confirmState.item?.nome}"? Se houver produtos vinculados, ela será preservada como inativa.`
            : `Deseja inativar a categoria "${confirmState.item?.nome}"? Você poderá reativá-la depois pelo filtro de inativas.`
        }
        confirmText={confirmState.action === "delete" ? "Sim, excluir" : "Sim, inativar"}
        onCancel={() => setConfirmState({ isOpen: false, action: null, item: null })}
        onConfirm={() =>
          confirmState.action === "delete"
            ? executeDelete(confirmState.item)
            : executeToggleStatus(confirmState.item)
        }
      />

      <ModalMensagem
        visible={modalMsg.visible}
        mensagem={modalMsg.mensagem}
        tipo={modalMsg.tipo}
        onClose={() => setModalMsg({ visible: false, mensagem: "", tipo: "" })}
      />
    </div>
  );
};

export default Categorias;
