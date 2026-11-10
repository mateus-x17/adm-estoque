import React, { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useThemeStore } from "../store/useThemeStore.js";
import { useUserStore } from "../store/userStore.js";
import { useTenantStore } from "../store/useTenantStore.js";
import { usersApi } from "../services/api/index.js";

import ModalMensagem from "../components/common/ModalMensagem.jsx";
import ModalConfirmacao from "../components/common/ModalConfirmacao.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

// arquivo responsável pela administração da equipe da Organização (criar, transferir de filial e excluir preservando antigo ID)

const getRoleStyle = (role) => {
  if (role === "ADMIN") return "bg-accent-purple/10 text-accent-purple border-accent-purple/25";
  if (role === "GERENTE") return "bg-accent-pink/10 text-accent-pink border-accent-pink/25";
  return "bg-white/5 text-text-secondary border-white/10";
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Usuarios = () => {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const currentUser = useUserStore((state) => state.user);
  const { stores } = useTenantStore();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [filterLojaId, setFilterLojaId] = useState("todos");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [editarUser, setEditarUser] = useState({ visible: false, userData: null, type: "usuario" });
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUsers({
        page: paginaAtual,
        limit: usuariosPorPagina,
        search,
        role: filterRole,
        lojaId: filterLojaId,
      });
      setUsuarios(response.data || []);
      setTotalPaginas(response.pagination?.totalPages || 1);
      setTotalUsuarios(response.pagination?.total || 0);
    } catch (error) {
      const errorMsg = error.message || "Erro de conexão com o servidor";
      setModal({
        visible: true,
        mensagem: `${errorMsg}. Você será redirecionado ao Dashboard`,
        tipo: "erro",
      });
      setTimeout(() => navigate("/dashboard"), 4000);
    } finally {
      setLoading(false);
    }
  }, [paginaAtual, usuariosPorPagina, search, filterRole, filterLojaId, navigate]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, filterRole, filterLojaId]);

  const abrirEditarUsuario = (user = null, tipo = "usuario") => {
    setEditarUser({ visible: true, userData: user, type: tipo });
  };

  // função rápida para transferir um Gerente ou Operador para outra filial da rede
  const handleTransferStore = async (user, newLojaId) => {
    if (!newLojaId || Number(newLojaId) === Number(user.lojaId)) return;
    try {
      await usersApi.transferUserStore(user.id, Number(newLojaId));
      const targetStore = stores.find((s) => Number(s.id) === Number(newLojaId));
      setModal({
        visible: true,
        mensagem: `"${user.nome}" transferido(a) para a filial "${targetStore?.nome || newLojaId}" com sucesso!`,
        tipo: "sucesso",
      });
      await carregarUsuarios();
    } catch (error) {
      setModal({
        visible: true,
        mensagem: error.message || "Erro ao transferir loja do colaborador.",
        tipo: "erro",
      });
    }
  };

  // função para abrir confirmação estilizada antes de excluir definitivamente o usuário preservando antigo ID
  const handleExcluirUsuario = (user) => {
    setConfirmDeleteUser(user);
  };

  const executeExcluirUsuario = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    try {
      const result = await usersApi.deleteUser(confirmDeleteUser.id);
      setModal({
        visible: true,
        mensagem: result?.message || `Usuário "${confirmDeleteUser.nome}" excluído definitivamente!`,
        tipo: "sucesso",
      });
      await carregarUsuarios();
    } catch (error) {
      setModal({
        visible: true,
        mensagem: error.message || "Erro ao excluir o usuário.",
        tipo: "erro",
      });
    } finally {
      setDeletingUser(false);
      setConfirmDeleteUser(null);
    }
  };

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Equipe da Organização
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Usuários &amp; Alocação
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Cadastre gerentes e operadores por loja, transfira colaboradores entre filiais ou exclua contas mantendo histórico auditável por ID.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => abrirEditarUsuario(null, "CriarUsuario")}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <FiPlus size={14} />
            Novo Usuário
          </button>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtrosAbertos && (
          <section className="glass-card animate-fade-up">
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={13} />
                <input
                  type="text"
                  placeholder="Nome, e-mail ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none"
              >
                <option value="todos">Todos os Cargos</option>
                <option value="admin">Admin</option>
                <option value="gerente">Gerente</option>
                <option value="operador">Operador</option>
              </select>

              <select
                value={filterLojaId}
                onChange={(e) => setFilterLojaId(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none"
              >
                <option value="todos">Todas as Lojas</option>
                {stores.map((st) => (
                  <option key={st.id} value={String(st.id)}>
                    {st.nome}
                  </option>
                ))}
              </select>

              <select
                value={usuariosPorPagina}
                onChange={(e) => {
                  setPaginaAtual(1);
                  setUsuariosPorPagina(Number(e.target.value));
                }}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none"
              >
                <option value={10}>10 por página</option>
                <option value={15}>15 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>

            <p className="px-5 pb-4 font-mono text-xs text-center text-text-secondary">
              {totalUsuarios} usuário(s) ativo(s) encontrado(s)
            </p>
          </section>
        )}
      </div>

      {modal.visible && (
        <ModalMensagem
          mensagem={modal.mensagem}
          tipo={modal.tipo}
          onClose={() => setModal({ visible: false, mensagem: "", tipo: "" })}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Carregando equipe...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="glass-card text-center p-8 text-sm text-text-secondary">
          Nenhum colaborador encontrado.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usuarios.map((user) => {
              const isSelf = currentUser?.id === user.id;
              const isAdminRow = user.role === "ADMIN";

              return (
                <div key={user.id} className="glass-card hover-card flex flex-col p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-surface)] text-text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {user.imagem ? (
                        <img
                          src={formatImageUrl(user.imagem)}
                          alt={user.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(user.nome)
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-medium text-text-primary truncate">{user.nome}</h3>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wide ${getRoleStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>

                    <span className="inline-block px-2.5 py-0.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-bg)] font-mono text-[10px] text-text-primary">
                      {isAdminRow
                        ? "Todas as Lojas (Rede)"
                        : user.loja?.nome || "Sem filial"}
                    </span>
                  </div>

                  {/* Troca rápida de filial para Gerente / Operador */}
                  {!isAdminRow && stores.length > 1 && (
                    <div className="mb-3">
                      <label className="text-[10px] font-mono uppercase text-text-secondary block mb-1">
                        Transferir de Filial
                      </label>
                      <select
                        value={user.lojaId ? String(user.lojaId) : ""}
                        onChange={(e) => handleTransferStore(user, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary outline-none focus:border-accent-purple"
                      >
                        {stores.map((st) => (
                          <option key={st.id} value={String(st.id)}>
                            {st.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="font-mono text-[11px] text-text-secondary space-y-1 mb-4">
                    <p>
                      ID: <span className="text-text-primary">#{user.id}</span>
                    </p>
                    <p>
                      Criado:{" "}
                      <span className="text-text-primary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => abrirEditarUsuario(user, "usuario")}
                      className="flex-1 btn-secondary py-2 px-3 text-xs font-semibold"
                    >
                      Editar
                    </button>

                    <button
                      disabled={isSelf}
                      onClick={() => handleExcluirUsuario(user)}
                      title={
                        isSelf
                          ? "Você não pode excluir a si mesmo"
                          : "Excluir definitivamente preservando vendas no ID antigo"
                      }
                      className="flex-1 py-2 px-3 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300 disabled:opacity-40"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {totalPaginas > 1 && (
            <PaginationControls
              currentPage={paginaAtual}
              totalPages={totalPaginas}
              onPageChange={setPaginaAtual}
            />
          )}
        </>
      )}

      {editarUser.visible && (
        <EditarItem
          type={editarUser.type}
          itemData={editarUser.userData}
          onClose={() => setEditarUser({ visible: false, userData: null })}
          onItemUpdated={carregarUsuarios}
        />
      )}

      <ModalConfirmacao
        isOpen={Boolean(confirmDeleteUser)}
        variant="danger"
        loading={deletingUser}
        title="Excluir colaborador"
        message={
          confirmDeleteUser
            ? `Deseja excluir definitivamente "${confirmDeleteUser.nome}" (ID #${confirmDeleteUser.id})?\n\nA conta e o acesso serão encerrados na hora, mas todas as vendas anteriores continuarão preservadas e pesquisáveis pelo ID #${confirmDeleteUser.id} na aba Desempenho.`
            : ""
        }
        confirmText="Excluir usuário"
        onCancel={() => setConfirmDeleteUser(null)}
        onConfirm={executeExcluirUsuario}
      />
    </div>
  );
};

export default Usuarios;
