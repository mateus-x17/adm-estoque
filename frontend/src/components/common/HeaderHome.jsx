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
      className="sticky top-4 z-40 mx-4 md:mx-auto max-w-6xl border border-[var(--color-border)] rounded-full bg-[var(--color-bg)]/80 backdrop-blur-md transition-colors duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-baseline gap-1 font-display">
          <span className="text-xl font-bold tracking-tight text-text-primary">ESTOQUE</span>
          <span className="text-xl font-bold tracking-tight text-accent-purple font-mono">.OS</span>
        </NavLink>

        <div className="flex items-center gap-4">
          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className="flex items-center gap-2 text-sm font-medium text-text-secondary border-b-2 border-transparent hover:border-accent-purple hover:text-text-primary pb-1 transition-all duration-300"
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="ml-2 rounded-full border border-[var(--color-border-light)] p-2.5 text-text-secondary hover:border-accent-purple hover:text-accent-purple bg-[var(--color-surface)] transition-all duration-300"
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
                className="p-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-all duration-300"
              >
                {link.icon}
              </NavLink>
            ))}
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="p-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-all duration-300"
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