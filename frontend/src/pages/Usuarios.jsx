import React, { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useThemeStore } from "../store/useThemeStore.js";
import { useUserStore } from "../store/userStore.js";
import { usersApi } from "../services/api/index.js";

import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

// arquivo responsável pela página de administração de colaboradores da loja (exclusivo ADMIN)
// 1 - Suporta filtragem por nome, cargo (role), status lógico (ativo/inativo) e paginação
// 2 - Permite criar, editar, inativar/reativar via Soft Delete e excluir colaboradores respeitando histórico de movimentações

// função auxiliar para estilizar a tag visual de cargo RBAC do colaborador
const getRoleStyle = (role) => {
  if (role === "ADMIN") return "bg-accent-purple/10 text-accent-purple border-accent-purple/25";
  if (role === "GERENTE") return "bg-accent-pink/10 text-accent-pink border-accent-pink/25";
  return "bg-white/5 text-text-secondary border-white/10";
};

// função auxiliar para extrair as iniciais do nome quando o colaborador não possuir foto
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

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [editarUser, setEditarUser] = useState({ visible: false, userData: null, type: "usuario" });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // função para carregar a listagem paginada de colaboradores da loja atual
  // 1 - Envia filtros de busca, cargo e status para usersApi.getUsers
  // 2 - Redireciona ao painel em caso de bloqueio de permissão inesperado
  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUsers({
        page: paginaAtual,
        limit: usuariosPorPagina,
        search,
        role: filterRole,
        status: filterStatus,
      });
      setUsuarios(response.data || []);
      setTotalPaginas(response.pagination?.totalPages || 1);
      setTotalUsuarios(response.pagination?.total || 0);
    } catch (error) {
      const errorMsg = error.message || "Erro de conexão com o servidor";

      setModal({
        visible: true,
        mensagem: `${errorMsg}. Você será redirecionado para home`,
        tipo: "erro",
      });

      setTimeout(() => navigate("/dashboard"), 5000);
    } finally {
      setLoading(false);
    }
  }, [paginaAtual, usuariosPorPagina, search, filterRole, filterStatus, navigate]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, filterRole, filterStatus]);

  const abrirEditarUsuario = (user = null, tipo = "usuario") => {
    setEditarUser({ visible: true, userData: user, type: tipo });
  };

  // função para inativar ou reativar logicamente um colaborador (Soft Delete)
  // 1 - Impede que o administrador tente inativar a própria conta em uso
  // 2 - Chama PATCH /users/:id/status enviando ativo: true/false e recarrega a lista
  const handleToggleStatus = async (user) => {
    const novoStatus = user.ativo === false;
    if (
      !novoStatus &&
      !window.confirm(
        `Deseja inativar "${user.nome}"? O acesso será bloqueado imediatamente mantendo o histórico de vendas.`
      )
    ) {
      return;
    }

    try {
      await usersApi.toggleUserStatus(user.id, novoStatus);
      setModal({
        visible: true,
        mensagem: novoStatus
          ? `Colaborador "${user.nome}" reativado com sucesso!`
          : `Colaborador "${user.nome}" marcado como inativo.`,
        tipo: "sucesso",
      });
      await carregarUsuarios();
    } catch (error) {
      setModal({
        visible: true,
        mensagem: error.message || "Erro ao alterar status do usuário.",
        tipo: "erro",
      });
    }
  };

  // função para excluir ou aplicar Soft Delete automático em um colaborador
  // 1 - Pede confirmação explícita antes de acionar DELETE /users/:id
  // 2 - Exibe a mensagem retornada pela API (exclusão física ou preservação por histórico)
  const handleExcluirUsuario = async (user) => {
    const confirmacao = window.confirm(
      `Deseja realmente excluir o colaborador "${user.nome}" (${user.email})? Se houver vendas registradas, ele será apenas inativado.`
    );
    if (!confirmacao) return;

    try {
      const result = await usersApi.deleteUser(user.id);
      setModal({
        visible: true,
        mensagem: result?.message || `Usuário "${user.nome}" excluído com sucesso!`,
        tipo: "sucesso",
      });
      await carregarUsuarios();
    } catch (error) {
      setModal({
        visible: true,
        mensagem: error.message || "Erro ao excluir o usuário.",
        tipo: "erro",
      });
    }
  };

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 space-y-6 sm:space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Acesso & Equipe
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Usuários
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Gerencie colaboradores, cargos RBAC e ativação de contas da loja.
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
            className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
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
                  placeholder="Pesquisar por nome"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
              >
                <option value="todos">Todos os Cargos</option>
                <option value="admin">Admin</option>
                <option value="gerente">Gerente</option>
                <option value="operador">Operador</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativos">Somente Ativos</option>
                <option value="inativos">Somente Inativos</option>
              </select>

              <select
                value={usuariosPorPagina}
                onChange={(e) => {
                  setPaginaAtual(1);
                  setUsuariosPorPagina(Number(e.target.value));
                }}
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
              >
                <option value={10}>10 por página</option>
                <option value={15}>15 por página</option>
                <option value={25}>25 por página</option>
                <option value={30}>30 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>

            <p className="px-5 pb-4 font-mono text-xs text-center text-text-secondary">
              {totalUsuarios} usuário(s) encontrado(s)
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
          <span className="text-sm text-text-secondary">Carregando usuários...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="glass-card text-center p-8 text-sm text-text-secondary">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usuarios.map((user) => {
              const isInactive = user.ativo === false;
              const isSelf = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`glass-card hover-card flex flex-col p-5 ${
                    isInactive ? "opacity-75 border-dashed" : ""
                  }`}
                >
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

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wide ${getRoleStyle(user.role)}`}
                    >
                      {user.role}
                    </span>

                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wide ${
                        isInactive
                          ? "bg-accent-red/10 text-accent-red border-accent-red/25"
                          : "bg-accent-green/10 text-accent-green border-accent-green/25"
                      }`}
                    >
                      {isInactive ? "Inativo" : "Ativo"}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-text-secondary space-y-1 mb-4">
                    <p>ID: <span className="text-text-primary">#{user.id}</span></p>
                    <p>Criado: <span className="text-text-primary">{new Date(user.createdAt).toLocaleDateString()}</span></p>
                    <p>Atualizado: <span className="text-text-primary">{new Date(user.updatedAt).toLocaleDateString()}</span></p>
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
                      onClick={() => handleToggleStatus(user)}
                      title={isSelf ? "Você não pode inativar a si mesmo" : isInactive ? "Reativar usuário" : "Inativar usuário"}
                      className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold border transition-all duration-200 disabled:opacity-40 ${
                        isInactive
                          ? "border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
                          : "border-[var(--color-border-light)] text-text-primary hover:border-amber-400/40 hover:text-amber-400"
                      }`}
                    >
                      {isInactive ? "Reativar" : "Inativar"}
                    </button>

                    <button
                      disabled={isSelf}
                      onClick={() => handleExcluirUsuario(user)}
                      title={isSelf ? "Você não pode excluir a si mesmo" : "Excluir ou aplicar Soft Delete"}
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
    </div>
  );
};

export default Usuarios;
