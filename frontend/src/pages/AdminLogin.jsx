import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoginForm from "../components/forms/LoginForm.jsx";
import RegisterForm from "../components/forms/RegisterForm.jsx";
import { useThemeStore } from "../store/useThemeStore.js";
import { FiSun, FiMoon, FiArrowLeft, FiShield } from "react-icons/fi";

// arquivo responsável pela página exclusiva do Portal do Administrador (login multi-loja e abertura de nova Rede/Organização)

// função responsável por renderizar o Portal do Administrador com alternância entre login e abertura de nova Organização.
//
// 1 - recebe nenhum parâmetro direto (sincroniza tema e parâmetro ?mode=register via hooks).
// 2 - ajusta dimensões do card dividido (560px–580px no desktop) evitando cortes verticais em 100% de zoom no Chrome.
// 3 - retorna o JSX completo do portal administrativo e onboarding de nova rede.
const AdminLogin = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [searchParams] = useSearchParams();
  const initialIsLogin = searchParams.get("mode") !== "register";
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "register");
  }, [searchParams]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pt-16 pb-6 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto">
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.24) 0%, transparent 70%)" }}
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
            to="/login"
            className="text-xs font-medium px-3.5 py-2 rounded-full border border-[var(--color-border-light)] text-text-secondary hover:text-text-primary hover:border-accent-purple transition-colors"
          >
            Portal da Loja
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

      {/* Card principal do Portal Admin */}
      <div className="relative w-full max-w-[840px] h-auto md:h-[560px] lg:h-[580px] rounded-3xl overflow-hidden glass-card shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div
          className={`
            bg-gradient-to-br from-accent-purple via-indigo-600 to-accent-pink text-white flex flex-col items-center justify-center p-6 sm:p-8 z-20 text-center
            md:absolute md:top-0 md:left-0 md:w-1/2 md:h-full w-full h-auto
            transition-transform duration-700 ease-in-out relative overflow-hidden
            ${isLogin ? "md:translate-x-full" : "md:translate-x-0"}
          `}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2.5">
              <FiShield size={18} />
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/80 mb-1.5">
              Portal do Administrador
            </span>

            {isLogin ? (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2.5 tracking-tight">
                  Crie sua Rede
                </h2>
                <p className="mb-5 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
                  Abra sua Organização com 1ª loja, cadastre gerentes/operadores por filial e acompanhe faturamento consolidado.
                </p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="rounded-full border border-white/40 px-6 py-2 text-xs sm:text-sm font-semibold hover:bg-white hover:text-accent-purple transition-all shadow-lg"
                >
                  Cadastrar Nova Organização
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2.5 tracking-tight">
                  Já dirige uma rede?
                </h2>
                <p className="mb-5 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
                  Entre como Administrador para gerenciar filiais, transferir gerentes, auditar vendedores e consultar relatórios.
                </p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="rounded-full border border-white/40 px-6 py-2 text-xs sm:text-sm font-semibold hover:bg-white hover:text-accent-pink transition-all shadow-lg"
                >
                  Entrar como Admin
                </button>
              </>
            )}
          </div>
        </div>

        {/* Viewport formulários */}
        <div
          className={`
            md:absolute md:top-0 md:h-full md:w-1/2 w-full h-auto overflow-y-auto z-10 custom-scrollbar
            ${isLogin ? "md:left-0" : "md:right-0"}
          `}
        >
          <div
            className={`
              flex md:flex-row flex-col md:w-[200%] w-full min-h-full transition-transform duration-700 ease-in-out
              ${isLogin ? "md:translate-x-0" : "md:-translate-x-1/2"}
            `}
          >
            {/* Login Admin */}
            <div
              className={`w-full md:w-1/2 flex flex-col items-center justify-center p-5 sm:p-7 min-h-full ${
                isLogin ? "flex" : "hidden"
              } md:flex`}
            >
              <div className="flex flex-col justify-center items-center w-full max-w-xs mx-auto">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-purple mb-1.5">
                  Gestão Multi-Loja
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-1 text-text-primary text-center">
                  Portal Administrador
                </h2>
                <p className="text-xs text-text-secondary mb-4 text-center">
                  Acesso restrito aos administradores da Organização
                </p>
                <LoginForm portal="admin" />
                <p className="text-[11px] text-text-secondary mt-4 text-center">
                  É Gerente ou Operador?{" "}
                  <Link to="/login" className="text-accent-pink font-semibold hover:underline">
                    Acessar Portal da Loja
                  </Link>
                </p>
              </div>
            </div>

            {/* Cadastro Organização + 1ª Loja + Admin */}
            <div
              className={`w-full md:w-1/2 flex flex-col items-center justify-center p-5 sm:p-6 min-h-full ${
                !isLogin ? "flex" : "hidden"
              } md:flex`}
            >
              <div className="flex flex-col justify-center items-center w-full max-w-xs mx-auto">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-pink mb-0.5">
                  Onboarding Empresarial
                </span>
                <h2 className="font-display text-xl font-bold mb-0.5 text-text-primary text-center">
                  Nova Organização
                </h2>
                <p className="text-xs text-text-secondary mb-3 text-center">
                  Crie sua rede, sua matriz e a conta fundadora
                </p>
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
