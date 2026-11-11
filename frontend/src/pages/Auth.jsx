import React, { useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import LoginForm from "../components/forms/LoginForm.jsx";
import { useThemeStore } from "../store/useThemeStore.js";
import { FiSun, FiMoon, FiArrowLeft, FiShoppingBag, FiShield } from "react-icons/fi";

// arquivo responsável pelo Portal da Loja (login de Gerentes e Operadores vinculados às filiais)

// função responsável por renderizar o Portal da Loja para autenticação de Gerentes e Operadores.
//
// 1 - recebe nenhum parâmetro direto (lê query string mode e tema darkMode via hooks).
// 2 - redireciona automaticamente para /admin/login?mode=register caso mode=register seja informado.
// 3 - retorna o layout centralizado e compacto para visualização completa em zoom 100%.
const Auth = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (searchParams.get("mode") === "register") {
    return <Navigate to="/admin/login?mode=register" replace />;
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pt-16 pb-6 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto">
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.22) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236, 72, 153, 0.20) 0%, transparent 70%)" }}
      />

      {/* Barra superior */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-4 sm:px-6 py-3 z-30 bg-background/60 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <FiArrowLeft size={16} />
          Voltar
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/login"
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple hover:text-white transition-all"
          >
            <FiShield size={13} />
            Portal Admin
          </Link>
          <button
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="rounded-full border border-[var(--color-border)] p-2 text-text-secondary hover:border-accent-purple hover:text-accent-purple bg-[var(--color-surface)] transition-all"
          >
            {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Card principal Portal da Loja */}
      <div className="relative w-full max-w-[800px] rounded-3xl overflow-hidden glass-card shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] grid grid-cols-1 md:grid-cols-2">
        {/* Formulário Equipe */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-xs flex flex-col items-center">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-pink mb-1.5">
              Operação da Filial
            </span>
            <h1 className="font-display text-2xl font-bold mb-1 text-text-primary text-center">
              Portal da Loja
            </h1>
            <p className="text-xs text-text-secondary mb-5 text-center">
              Acesso exclusivo para Gerentes e Operadores cadastrados pelo administrador
            </p>

            <LoginForm portal="loja" />

            <p className="text-[11px] text-text-secondary mt-4 text-center">
              É administrador da rede?{" "}
              <Link to="/admin/login" className="text-accent-purple font-semibold hover:underline">
                Entrar no Portal Admin
              </Link>
            </p>
          </div>
        </div>

        {/* Painel Informativo */}
        <div className="bg-gradient-to-br from-accent-purple to-accent-pink text-white flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2.5">
            <FiShoppingBag size={18} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/80 mb-1.5">
            Gerentes &amp; Operadores
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2.5 tracking-tight">
            Operação Unificada
          </h2>
          <p className="mb-5 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
            Gerentes acompanham relatórios e vendedores da sua filial; Operadores lançam pedidos multi-item e acompanham suas próprias vendas com total sigilo.
          </p>
          <Link
            to="/admin/login?mode=register"
            className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold hover:bg-white hover:text-accent-purple transition-all shadow-lg"
          >
            Criar Minha Organização (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
