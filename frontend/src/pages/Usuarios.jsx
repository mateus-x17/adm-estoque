import React, { useState, useEffect } from "react";
import { FaUser, FaSearch } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useThemeStore } from "../store/useThemeStore.js";
import { usersApi } from "../services/api/index.js";

import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

const getRoleStyle = (role) => {
  if (role === "ADMIN") return "bg-accent-purple/10 text-accent-purple border-accent-purple/20";
  return "bg-white/5 text-text-secondary border-white/10";
};

const getInitials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Usuarios = () => {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
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

  const abrirEditarUsuario = (user = null, tipo = "usuario") => {
    setEditarUser({ visible: true, userData: user, type: tipo });
  };

  const carregarUsuarios = async () => {
    setLoading(true); //indica carregameto de dados
    try {
      const response = await usersApi.getUsers({
        page: paginaAtual,
        limit: usuariosPorPagina,
        search,
        role: filterRole,
      });
      setUsuarios(response.data);
      setTotalPaginas(response.pagination.totalPages);
      setTotalUsuarios(response.pagination.total);
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
  };

  useEffect(() => {
    carregarUsuarios();
  }, [paginaAtual, usuariosPorPagina, search, filterRole]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, filterRole]);

  return (
    <div className="w-full min-h-screen pt-4 pb-12 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-[var(--color-border)] mb-8">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Acesso
          </span>
          <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight mt-1">Usuários</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie permissões, visualize perfis e administre acessos ao sistema.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => abrirEditarUsuario(null, "CriarUsuario")}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <FiPlus size={14} />
            Novo Usuário
          </button>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtrosAbertos && (
          <section className="glass-card animate-fade-up">
            <div className="p-5 flex flex-col lg:flex-row gap-3">
              <div className="relative w-full lg:w-1/3">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={13} />
                <input
                  type="text"
                  placeholder="Pesquisar por nome"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-5 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full lg:w-48 px-5 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
              >
                <option value="todos">Todos</option>
                <option value="admin">Admin</option>
                <option value="gerente">Gerente</option>
                <option value="operador">Operador</option>
              </select>

              <select
                value={usuariosPorPagina}
                onChange={(e) => {
                  setPaginaAtual(1);
                  setUsuariosPorPagina(Number(e.target.value));
                }}
                className="w-full lg:w-40 px-5 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
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
            {usuarios.map((user) => (
              <div
                key={user.id}
                className="glass-card hover-card flex flex-col p-5"
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

                <div className="mb-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wide ${getRoleStyle(user.role)}`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="font-mono text-[11px] text-text-secondary space-y-1 mb-4">
                  <p>ID: <span className="text-text-primary">#{user.id}</span></p>
                  <p>Criado: <span className="text-text-primary">{new Date(user.createdAt).toLocaleDateString()}</span></p>
                  <p>Atualizado: <span className="text-text-primary">{new Date(user.updatedAt).toLocaleDateString()}</span></p>
                </div>

                <div className="mt-auto flex gap-2 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => abrirEditarUsuario(user, "usuario")}
                    className="flex-1 btn-secondary py-2 text-xs font-semibold"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      setModal({
                        visible: true,
                        mensagem: `Exclusão de ${user.nome} (simulada pelo sistema)`,
                        tipo: "sucesso",
                      })
                    }
                    className="flex-1 px-4 py-2 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-all duration-300"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
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