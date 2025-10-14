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
      return "bg-purple-500";
    case "GERENTE":
      return "bg-blue-500";
    case "OPERADOR":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getInitials = (name) => {
  const names = name.split(" ");
  return names.map((n) => n[0]).join("").toUpperCase();
};

const Usuarios = () => {
  const url = "http://localhost:5000/users";
  const navigate = useNavigate();
  const { token } = useUserStore();
  const { darkMode } = useThemeStore();

  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [editarUser, setEditarUser] = useState({ visible: false, userData: null });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const abrirEditarUsuario = (user) => setEditarUser({ visible: true, userData: user });

  const carregarUsuarios = async () => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsuarios(data);
      } else {
        console.error("Erro ao carregar usuarios:", data.error);
        setModal({
          visible: true,
          mensagem: `${data.error} você será redirecionado para home`,
          tipo: "erro",
        });
        setTimeout(() => navigate("/dashboard"), 5000);
      }
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
      setModal({ visible: true, mensagem: "Erro de conexão com o servidor", tipo: "erro" });
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Filtragem de usuários por pesquisa e role
  const usuariosFiltrados = usuarios
    .filter((u) => u.nome.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => filterRole === "todos" || u.role.toLowerCase() === filterRole);

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-all duration-500 relative">
      {/* Cabeçalho */}
      <header className="w-full h-[20%] mb-6 pb-3 text-center bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fadeInDown">
          Gerenciamento de <span className="text-yellow-300">Usuários</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 animate-fadeInUp">
          Visualize, filtre e gerencie todos os usuários cadastrados no sistema.
        </p>
      </header>

      {/* Barra de filtro e pesquisa */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 mt-6 bg-gray-200 dark:bg-gray-800 p-4 rounded-lg transition-colors duration-500">
        {/* Botão Cadastrar */}
        <button
          className="w-full sm:w-[20%] px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-colors"
          onClick={() => abrirEditarUsuario(null)}
        >
          <FaUser className="inline mr-2" />
          Cadastrar
        </button>

        {/* Pesquisa */}
        <div className="relative w-full sm:w-[40%]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar usuário"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600 outline-none truncate"
          />
        </div>

        {/* Select role */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full sm:w-[20%] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 dark:focus:ring-blue-600 outline-none truncate"
        >
          <option value="todos">Todos</option>
          <option value="admin">Admin</option>
          <option value="gerente">Gerente</option>
          <option value="operador">Operador</option>
        </select>
      </div>

      {/* Modal de erro */}
      {modal.visible && (
        <ModalMensagem
          mensagem={modal.mensagem}
          tipo={modal.tipo}
          onClose={() => setModal({ visible: false })}
        />
      )}

      {/* Grid de usuários */}
      <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-6">
        {usuariosFiltrados.map((user, index) => (
          <div
            key={user.id}
            className={`
              relative rounded-2xl shadow-lg p-6 text-white transform transition-all duration-[700ms]
              bg-gradient-to-r from-green-900 via-green-700 to-green-500
              dark:from-gray-800 dark:via-gray-700 dark:to-gray-600
              hover:scale-110 hover:-translate-y-1 hover:shadow-2xl animate-fadeIn
            `}
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
          >
            {/* Avatar */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-white relative">
                {user.imagem ? (
                  <img
                    src={`http://localhost:5000${user.imagem}`}
                    alt={user.nome}
                    className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-white text-indigo-500 flex items-center justify-center font-bold text-lg transform transition-transform duration-300 hover:scale-110">
                    {getInitials(user.nome)}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h3 className="text-xl font-bold truncate">{user.nome}</h3>
                <p className="text-sm truncate">{user.email}</p>
              </div>
            </div>

            {/* Role */}
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                user.role
              )}`}
            >
              {user.role}
            </span>

            {/* Datas */}
            <p className="mt-2 text-xs">
              Criado: {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs">
              Atualizado: {new Date(user.updatedAt).toLocaleDateString()}
            </p>

            {/* Botões */}
            <div className="mt-4 flex gap-2">
              <button
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                onClick={() => abrirEditarUsuario(user)}
              >
                Editar
              </button>
              <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Overlay do formulário de edição */}
      {editarUser.visible && (
        <EditarItem
          type="usuario"
          itemData={editarUser.userData}
          onClose={() => setEditarUser({ visible: false, userData: null })}
          onItemUpdated={carregarUsuarios}
        />
      )}
    </div>
  );
};

export default Usuarios;
