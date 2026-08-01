import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiHome,
  HiCube,
  HiUsers,
  HiSwitchHorizontal,
  HiShoppingCart,
  HiTag,
} from "react-icons/hi";
import { FaUser, FaTruck } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { FiLogOut, FiSun, FiMoon } from "react-icons/fi";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import ModalMensagem from "./ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: <HiHome size={18} /> },
  { name: "Produtos", path: "/dashboard/produtos", icon: <HiCube size={18} /> },
  { name: "Movimentações", path: "/dashboard/movimentacoes", icon: <HiSwitchHorizontal size={18} /> },
  { name: "Pedidos", path: "/dashboard/pedidos", icon: <HiShoppingCart size={18} /> },
  { name: "Usuários", path: "/dashboard/usuarios", icon: <HiUsers size={18} /> },
  { name: "Categorias", path: "/dashboard/categorias", icon: <HiTag size={18} /> },
  { name: "Fornecedores", path: "/dashboard/fornecedores", icon: <FaTruck size={18} /> },
];

const Sidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const { clearUser, user } = useUserStore();
  const { clearToken } = useAuthStore();

  const [logoutModal, setLogoutModal] = useState({
    visible: false,
    mensagem: "",
    tipo: "sucesso",
  });

  const logout = () => {
    setLogoutModal({
      visible: true,
      mensagem: "Logout de usuário realizado com sucesso!",
      tipo: "sucesso",
    });
  };

  const closeLogoutModal = () => {
    setLogoutModal({ visible: false, mensagem: "", tipo: "sucesso" });
    clearUser();
    clearToken();
    navigate("/");
    closeSidebar?.();
  };

  return (
    <div className="flex flex-col justify-between h-full w-64 p-4 bg-[var(--bg-elevated)] border-r border-[var(--line)] text-[var(--ink)] transition-colors duration-300">
      {/* Topo */}
      <div>
        <div className="flex items-baseline gap-1 font-display px-2 mb-6">
          <span className="text-lg font-bold tracking-tight">ESTOQUE</span>
          <span className="text-lg font-bold tracking-tight text-[var(--accent)] font-mono">.OS</span>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) =>
                `relative flex items-center gap-3 pl-3 pr-2 py-2 rounded-md text-sm transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--ink)] font-medium bg-[var(--line)]/40"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/25"
                }`
              }
              onClick={() => closeSidebar?.()}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--accent)]" />
                  )}
                  {link.icon}
                  <span>{link.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Rodapé */}
      <div className="pt-4 border-t border-[var(--line)]">
        <div className="flex items-center gap-3 px-1">
          {user.imagem ? (
            <img
              src={formatImageUrl(user.imagem)}
              alt="User"
              className="w-9 h-9 rounded-md object-cover border border-[var(--line)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-md border border-[var(--line)] flex items-center justify-center text-[var(--ink-soft)]">
              <FaUser size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.nome}</p>
            <p className="font-mono text-[11px] text-[var(--ink-soft)] uppercase truncate">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 w-full mt-4 px-3 py-2 rounded-md border border-[var(--line)] text-sm text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          {darkMode ? "Modo claro" : "Modo escuro"}
        </button>

        <div
          className="flex items-center gap-3 mt-3 px-1 py-1.5 cursor-pointer text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
          onClick={() => {
            navigate("/dashboard/configuracoes");
            closeSidebar?.();
          }}
        >
          <FaGear size={16} />
          <p>Configurações</p>
        </div>

        <div
          className="flex items-center gap-3 mt-1 px-1 py-1.5 cursor-pointer text-sm text-[var(--ink-soft)] hover:text-red-500 transition-colors duration-200"
          onClick={logout}
        >
          <FiLogOut size={16} />
          <p>Sair</p>
        </div>
      </div>

      {logoutModal.visible && (
        <ModalMensagem
          mensagem={logoutModal.mensagem}
          tipo={logoutModal.tipo}
          onClose={closeLogoutModal}
        />
      )}
    </div>
  );
};

export default Sidebar;