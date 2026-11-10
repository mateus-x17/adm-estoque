import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { useUserStore } from "../../store/userStore.js";
import { Sun, Moon, Menu } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

// arquivo responsável pelo cabeçalho móvel com acesso à barra lateral e exibição da loja ativa

const Header = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAnimation, setSidebarAnimation] = useState("in");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const storeName = user?.empresa?.nome || user?.empresaNome;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // função para abrir o drawer lateral em telas móveis
  const openSidebar = () => {
    setSidebarAnimation("in");
    setSidebarOpen(true);
    setIsAnimatingOut(false);
  };

  // função para fechar o drawer lateral aguardando o fim da animação CSS
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
          {storeName && (
            <span className="font-mono text-[10px] text-text-secondary truncate max-w-[150px]">
              {storeName}
            </span>
          )}
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-xl border border-[var(--color-border)] p-2 text-text-secondary hover:border-accent-purple hover:text-accent-purple transition-all duration-200 shrink-0"
        >
          {darkMode ? (
            <Sun size={18} strokeWidth={1.5} />
          ) : (
            <Moon size={18} strokeWidth={1.5} />
          )}
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
              className={`h-full ${sidebarAnimation === "in" ? "animate-slide-in-left" : "animate-slide-out-left"}`}
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
