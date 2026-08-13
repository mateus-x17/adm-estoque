import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/forms/LoginForm.jsx";
import RegisterForm from "../components/forms/RegisterForm.jsx";
import { useThemeStore } from "../store/useThemeStore.js";
import { FiSun, FiMoon, FiArrowLeft } from "react-icons/fi";

const Auth = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 md:pt-10 pb-10 transition-colors duration-300 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-pink/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra superior */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          <FiArrowLeft size={16} />
          Voltar
        </Link>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-full border border-[var(--color-border)] p-2.5 text-text-secondary hover:border-accent-purple hover:text-accent-purple bg-[var(--color-surface)] transition-all duration-300"
        >
          {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
        </button>
      </div>

      {/* Card principal */}
      <div className="relative w-full md:w-[820px] h-auto md:h-[560px] rounded-3xl overflow-hidden glass-card shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        {/* Painel lateral animado */}
        <div
          className={`
            bg-gradient-to-br from-accent-purple to-accent-pink text-white flex flex-col items-center justify-center p-10 z-20 text-center
            md:absolute md:top-0 md:left-0 md:w-1/2 md:h-full w-full h-auto
            transition-transform duration-700 ease-in-out relative overflow-hidden
            ${isLogin ? "md:translate-x-full" : "md:translate-x-0"}
          `}
        >
          {/* Noise overlay opcional */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-white/70 mb-3">
              {isLogin ? "Novo acesso" : "Já tem conta"}
            </span>

            {isLogin ? (
              <>
                <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">Novo por aqui?</h2>
                <p className="mb-8 text-sm text-white/80 max-w-xs leading-relaxed">
                  Crie um acesso para começar a gerenciar seu estoque de forma inteligente.
                </p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold hover:bg-white hover:text-accent-purple transition-all duration-300 shadow-lg hover:shadow-white/20"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">Bem-vindo de volta!</h2>
                <p className="mb-8 text-sm text-white/80 max-w-xs leading-relaxed">
                  Já tem uma conta? Entre para continuar de onde parou.
                </p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold hover:bg-white hover:text-accent-pink transition-all duration-300 shadow-lg hover:shadow-white/20"
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>

        {/* VIEWPORT dos formulários */}
        <div
          className={`
            md:absolute md:top-0 md:h-full md:w-1/2 w-full h-auto overflow-hidden z-10
            ${isLogin ? "md:left-0" : "md:right-0"}
          `}
        >
          <div
            className={`
              flex md:flex-row flex-col md:w-[200%] w-full h-full transition-transform duration-700 ease-in-out
              ${isLogin ? "md:translate-x-0" : "md:-translate-x-1/2"}
            `}
          >
            {/* Login */}
            <div className={`w-full md:w-1/2 flex flex-col items-center justify-center p-10 h-full ${isLogin ? "block" : "hidden"} md:block`}>
              <div className="flex flex-col justify-center items-center h-full w-full max-w-xs mx-auto">
                <h2 className="font-display text-3xl font-bold text-text-primary mb-2 tracking-tight">Acesso ao Sistema</h2>
                <p className="text-sm text-text-secondary mb-8 text-center">
                  Insira suas credenciais para entrar.
                </p>
                <LoginForm />
              </div>
            </div>

            {/* Registro */}
            <div className={`w-full md:w-1/2 flex flex-col items-center justify-center p-10 h-full ${!isLogin ? "block" : "hidden"} md:block`}>
              <div className="flex flex-col justify-center items-center h-full w-full max-w-xs mx-auto">
                <h2 className="font-display text-3xl font-bold text-text-primary mb-2 tracking-tight">Crie sua conta</h2>
                <p className="text-sm text-text-secondary mb-8 text-center">
                  Preencha os dados abaixo para se registrar.
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

export default Auth;