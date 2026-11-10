import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  ArrowRightLeft,
  ShoppingCart,
  Tag,
  Truck,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Store,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import { storesApi } from "../../services/api/index.js";
import { formatImageUrl } from "../../utils/imageHelper.js";
import ModalConfirmacao from "./ModalConfirmacao.jsx";

// arquivo responsável pela barra lateral, seletor de loja global para ADMIN e filtros RBAC

const iconProps = { size: 18, strokeWidth: 1.5 };

const links = [
  { name: "Dashboard", path: "/dashboard", icon: <Home {...iconProps} /> },
  { name: "Produtos", path: "/dashboard/produtos", icon: <Package {...iconProps} /> },
  { name: "Pedidos", path: "/dashboard/pedidos", icon: <ShoppingCart {...iconProps} /> },
  { name: "Movimentações", path: "/dashboard/movimentacoes", icon: <ArrowRightLeft {...iconProps} /> },
  {
    name: "Desempenho",
    path: "/dashboard/desempenho",
    icon: <TrendingUp {...iconProps} />,
    roles: ["ADMIN", "GERENTE"],
  },
  {
    name: "Lojas / Filiais",
    path: "/dashboard/lojas",
    icon: <Building2 {...iconProps} />,
    roles: ["ADMIN"],
  },
  { name: "Usuários", path: "/dashboard/usuarios", icon: <Users {...iconProps} />, roles: ["ADMIN"] },
  { name: "Categorias", path: "/dashboard/categorias", icon: <Tag {...iconProps} /> },
  { name: "Fornecedores", path: "/dashboard/fornecedores", icon: <Truck {...iconProps} /> },
];

const Sidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const { clearUser, user } = useUserStore();
  const { clearToken } = useAuthStore();
  const { stores, selectedLojaId, setStores, setSelectedLojaId, clearTenant } = useTenantStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const orgName = user?.organizacao?.nome || user?.organizacaoNome || "Organização";
  const storeName = user?.loja?.nome || user?.lojaNome || "Minha Loja";

  // Sincroniza lojas da Organização quando o ADMIN entra ou recarrega o painel
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    storesApi
      .getStores("ativos")
      .then((list) => {
        if (active && Array.isArray(list)) setStores(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAdmin, setStores]);

  const visibleLinks = links.filter(
    (link) => !link.roles || (user?.role && link.roles.includes(user.role))
  );

  const confirmLogout = () => setIsLogoutModalOpen(true);

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    clearUser();
    clearToken();
    clearTenant();
    navigate("/");
    closeSidebar?.();
  };

  return (
    <div className="flex flex-col justify-between h-full w-64 p-4 bg-[var(--color-surface)] border-r border-[var(--color-border)] rounded-r-[2rem] text-text-primary transition-colors duration-300 shadow-[20px_0_40px_rgba(0,0,0,0.05)] overflow-y-auto custom-scrollbar">
      <div>
        <div className="flex items-baseline gap-1 font-display px-2 mb-4 mt-2">
          <span className="text-xl font-bold tracking-tight">ESTOQUE</span>
          <span className="text-xl font-bold tracking-tight text-accent-pink font-secondary">.OS</span>
        </div>

        {/* Contexto de Organização e Loja (ADMIN escolhe qual filial visualizar) */}
        <div className="mx-1 mb-5 p-3 rounded-2xl border border-[var(--color-border-light)] bg-accent-purple/5 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-purple/15 text-accent-purple flex items-center justify-center shrink-0">
              <Store size={15} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent-purple truncate">
                {orgName}
              </p>
              {!isAdmin && (
                <p className="text-xs font-semibold text-text-primary truncate">{storeName}</p>
              )}
            </div>
          </div>

          {isAdmin && (
            <select
              value={selectedLojaId}
              onChange={(e) => setSelectedLojaId(e.target.value)}
              aria-label="Selecionar loja ativa"
              className="w-full px-2.5 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs font-medium text-text-primary outline-none focus:border-accent-purple cursor-pointer"
            >
              <option value="all">Todas as Lojas ({stores.length})</option>
              {stores.map((st) => (
                <option key={st.id} value={String(st.id)}>
                  {st.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <nav className="flex flex-col gap-1.5">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-4 py-2 rounded-[14px] text-sm transition-all duration-200 ${
                  isActive
                    ? "chip-active font-semibold shadow-lg shadow-accent-purple/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)]"
                }`
              }
              onClick={() => closeSidebar?.()}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Rodapé */}
      <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-2 mb-4">
          {user?.imagem ? (
            <img
              src={formatImageUrl(user.imagem)}
              alt="User"
              className="w-10 h-10 rounded-[12px] object-cover border border-[var(--color-border)] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-text-secondary shrink-0">
              <User size={18} strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-text-primary">{user?.nome || "Usuário"}</p>
            <p className="font-secondary text-[11px] text-text-secondary uppercase truncate mt-0.5">
              #{user?.id} · {user?.role || "OPERADOR"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 w-full mb-1 px-3 py-2 rounded-xl border border-transparent text-sm text-text-secondary hover:bg-[var(--color-border-light)] hover:text-text-primary transition-all duration-200"
        >
          {darkMode ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          {darkMode ? "Modo claro" : "Modo escuro"}
        </button>

        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-sm text-text-secondary hover:bg-[var(--color-border-light)] hover:text-text-primary transition-all duration-200"
          onClick={() => {
            navigate("/dashboard/configuracoes");
            closeSidebar?.();
          }}
        >
          <Settings size={18} strokeWidth={1.5} />
          <p>Configurações</p>
        </div>

        <div
          className="flex items-center gap-3 mt-1 px-3 py-2 rounded-xl cursor-pointer text-sm text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-all duration-200"
          onClick={confirmLogout}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <p>Sair</p>
        </div>
      </div>

      <ModalConfirmacao
        isOpen={isLogoutModalOpen}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessão atual?"
        confirmText="Sair"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
