import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { useUserStore } from "../../store/userStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import { Sun, Moon, Menu } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

// arquivo responsável pelo cabeçalho móvel com acesso à barra lateral e exibição da Organização/Loja selecionada

const Header = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId, setSelectedLojaId } = useTenantStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAnimation, setSidebarAnimation] = useState("in");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const selectedStoreObj = stores.find((s) => String(s.id) === String(selectedLojaId));
  const subtitle = isAdmin
    ? selectedLojaId === "all"
      ? `${user?.organizacaoNome || "Rede"} • Todas`
      : selectedStoreObj?.nome || user?.organizacaoNome
    : user?.loja?.nome || user?.lojaNome || user?.organizacaoNome;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const openSidebar = () => {
    setSidebarAnimation("in");
    setSidebarOpen(true);
    setIsAnimatingOut(false);
  };

  const closeSidebar = () => {
    setSidebarAnimation("out");
    setIsAnimatingOut(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  return (
    <>
      <header className="glass-card flex justify-between items-center px-3.5 py-2.5 mx-3 mt-3 mb-1 border border-[var(--color-border-light)] rounded-full text-text-primary transition-colors duration-300 sticky top-3 z-30 shadow-lg md:hidden">
        <button
          onClick={openSidebar}
          aria-label="Abrir menu"
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-all duration-200 shrink-0"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        <div className="flex flex-col items-center min-w-0 px-2">
          <div className="flex items-baseline gap-0.5 font-display">
            <span className="text-sm font-bold tracking-tight">ESTOQUE</span>
            <span className="text-sm font-bold tracking-tight text-accent-pink font-secondary">
              .OS
            </span>
          </div>

          {isAdmin && stores.length > 0 ? (
            <select
              value={selectedLojaId}
              onChange={(e) => setSelectedLojaId(e.target.value)}
              aria-label="Trocar filial no mobile"
              className="mt-0.5 bg-transparent font-mono text-[10px] text-accent-purple outline-none max-w-[160px] truncate text-center"
            >
              <option value="all">Todas as Lojas</option>
              {stores.map((st) => (
                <option key={st.id} value={String(st.id)}>
                  {st.nome}
                </option>
              ))}
            </select>
          ) : (
            subtitle && (
              <span className="font-mono text-[10px] text-text-secondary truncate max-w-[160px]">
                {subtitle}
              </span>
            )
          )}
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-xl border border-[var(--color-border)] p-2 text-text-secondary hover:border-accent-purple hover:text-accent-purple transition-all duration-200 shrink-0"
        >
          {darkMode ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
      </header>

      {(sidebarOpen || isAnimatingOut) && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <div className="relative h-full">
            <div
              className={`h-full ${
                sidebarAnimation === "in" ? "animate-slide-in-left" : "animate-slide-out-left"
              }`}
            >
              <Sidebar closeSidebar={closeSidebar} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
