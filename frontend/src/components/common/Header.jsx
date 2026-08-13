import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { Sun, Moon, Menu } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

const Header = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAnimation, setSidebarAnimation] = useState("in");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

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
      <header className="glass-card flex justify-between items-center px-4 py-3 mx-4 mt-4 mb-2 border border-[var(--color-border-light)] rounded-full text-text-primary transition-colors duration-300 sticky top-4 z-30 shadow-lg md:hidden">
        <button
          onClick={openSidebar}
          aria-label="Abrir menu"
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-[var(--color-border-light)] transition-all duration-200"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>

        <div className="flex items-baseline gap-1 font-display">
          <span className="text-base font-bold tracking-tight">ESTOQUE</span>
          <span className="text-base font-bold tracking-tight text-accent-pink font-secondary">
            .OS
          </span>
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-xl border border-[var(--color-border)] p-2 text-text-secondary hover:border-accent-purple hover:text-accent-purple transition-all duration-200"
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
