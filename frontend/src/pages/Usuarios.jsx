import React, { useState, useEffect } from "react";
import { FaUser, FaSearch } from "react-icons/fa";
import { useUserStore } from "../store/userStore";
import { useThemeStore } from "../store/useThemeStore.js";
import ModalMensagem from "../components/ModalMensagem.jsx";
import EditarItem from "../components/EditarItem.jsx";
import { useNavigate } from "react-router-dom";

const getRoleColor = (role) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-500/10 text-purple-600";
    case "GERENTE":
      return "bg-blue-500/10 text-blue-600";
    case "OPERADOR":
      return "bg-emerald-500/10 text-emerald-600";
    default:
      return "bg-slate-500/10 text-slate-600";
  }
};

const getInitials = (name) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase();

const Usuarios = () => {
  const url = "http://localhost:5000/users";
  const navigate = useNavigate();
  const { token } = useUserStore();
  const { darkMode } = useThemeStore();

  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [editarUser, setEditarUser] = useState({ visible: false, userData: null, type: "usuario" });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const abrirEditarUsuario = (user = null, tipo = "usuario") => {
    setEditarUser({ visible: true, userData: user, type: tipo });
  };

  const carregarUsuarios = async () => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsuarios(data);
      } else {
        setModal({
          visible: true,
          mensagem: `${data.error} você será redirecionado para home`,
          tipo: "erro",
        });
        setTimeout(() => navigate("/dashboard"), 5000);
      }
    } catch {
      setModal({
        visible: true,
        mensagem: "Erro de conexão com o servidor",
        tipo: "erro",
      });
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios
    .filter(u => u.nome.toLowerCase().includes(search.toLowerCase()))
    .filter(u => filterRole === "todos" || u.role.toLowerCase() === filterRole);

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Usuários
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Gerencie permissões, visualize perfis e administre acessos ao sistema.
        </p>
      </header>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <button
          onClick={() => abrirEditarUsuario(null, "CriarUsuario")}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition"
        >
          <FaUser />
          Novo Usuário
        </button>

        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="todos" className="bg-white dark:bg-slate-800">Todos</option>
          <option value="admin" className="bg-white dark:bg-slate-800">Admin</option>
          <option value="gerente" className="bg-white dark:bg-slate-800">Gerente</option>
          <option value="operador" className="bg-white dark:bg-slate-800">Operador</option>
        </select>
      </section>

      {modal.visible && (
        <ModalMensagem
          mensagem={modal.mensagem}
          tipo={modal.tipo}
          onClose={() => setModal({ visible: false })}
        />
      )}

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {usuariosFiltrados.map(user => (
          <div
            key={user.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-500 text-white flex items-center justify-center font-bold">
                {user.imagem ? (
                  <img
                    src={`http://localhost:5000${user.imagem}`}
                    alt={user.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user.nome)
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                  {user.nome}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
              {user.role}
            </span>

            <div className="mt-4 text-xs text-slate-500 space-y-1">
              <p>Criado em {new Date(user.createdAt).toLocaleDateString()}</p>
              <p>Atualizado em {new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => abrirEditarUsuario(user, "usuario")}
                className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition"
              >
                Editar
              </button>
              <button className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>

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
