import { useEffect, useState } from "react";
import { useThemeStore } from "../../store/useThemeStore.js";
import { FiSun, FiMoon, FiMenu } from "react-icons/fi";
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
      <header className="flex justify-between items-center px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--line)] text-[var(--ink)] transition-colors duration-300 sticky top-0 z-30 md:hidden">
        <button
          onClick={openSidebar}
          aria-label="Abrir menu"
          className="p-2 rounded-md text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/25 transition-colors duration-200"
        >
          <FiMenu size={22} />
        </button>

        <div className="flex items-baseline gap-1 font-display">
          <span className="text-base font-bold tracking-tight">ESTOQUE</span>
          <span className="text-base font-bold tracking-tight text-[var(--accent)] font-mono">.OS</span>
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-md border border-[var(--line)] p-2 text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
        </button>
      </header>

      {(sidebarOpen || isAnimatingOut) && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-300"
            onClick={closeSidebar}
          />
          <div className="relative">
            <div className={sidebarAnimation === "in" ? "animate-slide-in-left" : "animate-slide-out-left"}>
              <Sidebar closeSidebar={closeSidebar} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;