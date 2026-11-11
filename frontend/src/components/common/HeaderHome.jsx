import { useEffect } from "react";
import { CgLogIn } from "react-icons/cg";
import { FiSun, FiMoon, FiShield } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useThemeStore } from "../../store/useThemeStore.js";

// arquivo responsável pelo cabeçalho público da landing page com acesso separado para Portal da Loja e Portal Admin

// função responsável por renderizar a barra de navegação pública da landing page com troca de tema e portais.
//
// 1 - recebe nenhum parâmetro externo direto (obtém darkMode e toggleDarkMode via useThemeStore).
// 2 - aplica ou remove a classe dark no documento conforme o estado do tema.
// 3 - renderiza links de âncora, atalho ao Portal Admin, acesso ao Portal da Loja e botão mobile.
// 4 - retorna o cabeçalho fixo responsivo dimensionado para zoom 100%.
function HeaderHome() {
  const { darkMode, toggleDarkMode } = useThemeStore();

  const navLinks = [
    { name: "Funcionalidades", href: "#funcionalidades" },
    { name: "Multi-Loja", href: "#multitenant" },
    { name: "Módulos", href: "#modulos" },
    { name: "Painel", href: "/dashboard" },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 md:px-6 flex justify-center">
      <div className="w-full max-w-6xl border border-[var(--color-border-light)] rounded-full bg-[var(--color-bg)]/75 backdrop-blur-xl transition-colors duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">
          <NavLink to="/" className="flex items-baseline gap-1 font-display">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
              ESTOQUE
            </span>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-accent-purple font-mono">
              .OS
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) =>
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
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="rounded-full border border-[var(--color-border-light)] p-2.5 text-text-secondary hover:border-accent-purple hover:text-accent-purple bg-[var(--color-surface)] transition-all duration-300 shadow-sm"
            >
              {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>

            <NavLink
              to="/admin/login"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-2 text-xs font-semibold text-accent-purple hover:bg-accent-purple hover:text-white transition-all"
            >
              <FiShield size={14} />
              Portal Admin
            </NavLink>

            <NavLink
              to="/login"
              className="hidden md:flex items-center gap-2 btn-primary px-5 py-2 text-xs sm:text-sm font-medium"
            >
              Acessar Loja
            </NavLink>

            <NavLink
              to="/login"
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
