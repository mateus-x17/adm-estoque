import { useEffect } from "react";
import { CgLogIn } from "react-icons/cg";
import { HiHome } from "react-icons/hi";
import { FiSun, FiMoon } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useThemeStore } from "../../store/useThemeStore.js";

function HeaderHome() {
  const { darkMode, toggleDarkMode } = useThemeStore();

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: <HiHome size={18} /> },
    { name: "Login", path: "/auth", icon: <CgLogIn size={18} /> },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--line)] backdrop-blur transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-header)" }}
      >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-baseline gap-1 font-display">
          <span className="text-lg font-bold tracking-tight text-[var(--ink)]">ESTOQUE</span>
          <span className="text-lg font-bold tracking-tight text-[var(--accent)] font-mono">.OS</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className="flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] border-b-2 border-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] pb-1 transition-colors duration-200"
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="ml-2 rounded-md border border-[var(--line)] p-2 text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
          </nav>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className="p-2 rounded-md text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors duration-200"
              >
                {link.icon}
              </NavLink>
            ))}
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="rounded-md border border-[var(--line)] p-2 text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderHome;