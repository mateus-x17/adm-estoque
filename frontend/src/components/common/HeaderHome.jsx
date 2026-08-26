import { useEffect } from "react";
import { CgLogIn } from "react-icons/cg";
import { FiSun, FiMoon } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useThemeStore } from "../../store/useThemeStore.js";

function HeaderHome() {
  const { darkMode, toggleDarkMode } = useThemeStore();

  const navLinks = [
    { name: "Funcionalidades", href: "#funcionalidades" },
    { name: "Módulos", href: "#modulos" },
    { name: "Painel", href: "/dashboard" },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 flex justify-center">
      <div className="w-full max-w-6xl border border-[var(--color-border-light)] rounded-full bg-[var(--color-bg)]/70 backdrop-blur-xl transition-colors duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between px-6 py-3.5">
          
          {/* Left: Logo */}
          <NavLink to="/" className="flex items-baseline gap-1 font-display">
            <span className="text-xl font-bold tracking-tight text-text-primary">ESTOQUE</span>
            <span className="text-xl font-bold tracking-tight text-accent-purple font-mono">.OS</span>
          </NavLink>

          {/* Middle: Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith("#") ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-300"
                >
                  {link.name}
                </a>
              ) : (
                <NavLink
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-300"
                >
                  {link.name}
                </NavLink>
              )
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="rounded-full border border-[var(--color-border-light)] p-2.5 text-text-secondary hover:border-accent-purple hover:text-accent-purple bg-[var(--color-surface)] transition-all duration-300 shadow-sm"
            >
              {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
            <NavLink
              to="/auth"
              className="hidden md:flex items-center gap-2 btn-primary px-5 py-2 text-sm font-medium"
            >
              Acessar Sistema
            </NavLink>
            <NavLink
              to="/auth"
              className="md:hidden flex items-center justify-center btn-primary w-10 h-10 rounded-full"
              aria-label="Acessar Sistema"
            >
              <CgLogIn size={18} />
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderHome;