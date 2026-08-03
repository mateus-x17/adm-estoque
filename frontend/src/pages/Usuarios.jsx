import React, { useState, useEffect } from "react";
import { FaUser, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useThemeStore } from "../store/useThemeStore.js";
import { usersApi } from "../services/api/index.js";

import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import PaginationControls from "../components/common/PaginationControls.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

const getRoleStyle = (role) => {
  if (role === "ADMIN") return "border-[var(--accent)]/40 text-[var(--accent)]";
  return "border-[var(--line)] text-[var(--ink-soft)]";
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
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Acesso
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Usuários</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Gerencie permissões, visualize perfis e administre acessos ao sistema.
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => abrirEditarUsuario(null, "CriarUsuario")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-[var(--bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
          >
            <FaUser size={14} />
            Novo usuário
          </button>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
          >
            {filtrosAbertos ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtrosAbertos && (
          <section className="glass-panel rounded-lg">
            <div className="p-5 flex flex-col lg:flex-row gap-3">
              <div className="relative w-full lg:w-1/3">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={13} />
                <input
                  type="text"
                  placeholder="Pesquisar por nome"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full lg:w-48 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
              >
                <option value="todos" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Todos</option>
                <option value="admin" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Admin</option>
                <option value="gerente" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Gerente</option>
                <option value="operador" className="bg-[var(--bg-elevated)] text-[var(--ink)]">Operador</option>
              </select>

              <select
                value={usuariosPorPagina}
                onChange={(e) => {
                  setPaginaAtual(1);
                  setUsuariosPorPagina(Number(e.target.value));
                }}
                className="w-full lg:w-40 px-4 py-2.5 rounded-md border border-[var(--line)] bg-transparent text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
              >
                <option value={10} className="bg-[var(--bg-elevated)] text-[var(--ink)]">10 por página</option>
                <option value={15} className="bg-[var(--bg-elevated)] text-[var(--ink)]">15 por página</option>
                <option value={25} className="bg-[var(--bg-elevated)] text-[var(--ink)]">25 por página</option>
                <option value={30} className="bg-[var(--bg-elevated)] text-[var(--ink)]">30 por página</option>
                <option value={50} className="bg-[var(--bg-elevated)] text-[var(--ink)]">50 por página</option>
              </select>
            </div>

            <p className="px-5 pb-4 font-mono text-xs text-center text-[var(--ink-soft)]">
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
          <div className="w-6 h-6 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--ink-soft)]">Carregando usuários...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-20 text-sm text-[var(--ink-soft)]">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usuarios.map((user) => (
              <div
                key={user.id}
                className="glass-panel rounded-lg p-5 hover:border-[var(--accent)]/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-md overflow-hidden border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center font-semibold text-sm shrink-0">
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
                    <h3 className="font-medium text-[var(--ink)] truncate">{user.nome}</h3>
                    <p className="text-xs text-[var(--ink-soft)] truncate">{user.email}</p>
                  </div>
                </div>

                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md border font-mono text-[11px] uppercase tracking-wide ${getRoleStyle(user.role)}`}
                >
                  {user.role}
                </span>

                <div className="mt-4 font-mono text-[11px] text-[var(--ink-soft)] space-y-0.5">
                  <p>#{user.id}</p>
                  <p>Criado em {new Date(user.createdAt).toLocaleDateString()}</p>
                  <p>Atualizado em {new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => abrirEditarUsuario(user, "usuario")}
                    className="flex-1 py-2 rounded-md border border-[var(--line)] text-sm font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
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
                    className="flex-1 py-2 rounded-md border border-[var(--danger)]/30 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors duration-200"
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