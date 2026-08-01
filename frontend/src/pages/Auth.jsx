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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-300">
      {/* Barra superior */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
        >
          <FiArrowLeft size={16} />
          Voltar
        </Link>

        <button
          onClick={toggleDarkMode}
          aria-label="Alternar tema"
          className="rounded-md border border-[var(--line)] p-2 text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
        </button>
      </div>

      {/* Card principal */}
      <div className="relative w-full md:w-[820px] h-auto md:h-[520px] rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
        {/* Painel console — mesma assinatura visual da home */}
        <div
          className={`
            bg-[var(--console-bg)] text-white flex flex-col items-center justify-center p-10 z-20 text-center
            md:absolute md:top-0 md:left-0 md:w-1/2 md:h-full w-full h-auto
            transition-transform duration-700 ease-in-out
            ${isLogin ? "md:translate-x-full" : "md:translate-x-0"}
          `}
        >
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
            {isLogin ? "Novo acesso" : "Já tem conta"}
          </span>

          {isLogin ? (
            <>
              <h2 className="font-display text-2xl font-bold mb-3">Novo por aqui?</h2>
              <p className="mb-6 text-sm text-[var(--console-text-soft)] max-w-xs">
                Crie um acesso para começar a gerenciar seu estoque.
              </p>
              <button
                onClick={() => setIsLogin(false)}
                className="rounded-md border border-white/30 px-6 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold mb-3">Bem-vindo de volta!</h2>
              <p className="mb-6 text-sm text-[var(--console-text-soft)] max-w-xs">
                Já tem uma conta? Entre para continuar de onde parou.
              </p>
              <button
                onClick={() => setIsLogin(true)}
                className="rounded-md border border-white/30 px-6 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
              >
                Entrar
              </button>
            </>
          )}
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
              <div className="flex flex-col justify-center items-center h-full w-full">
                <h2 className="font-display text-2xl font-bold text-[var(--ink)] mb-2">Bem-vindo de volta!</h2>
                <p className="text-sm text-[var(--ink-soft)] mb-6">
                  Faça login para acessar sua conta.
                </p>
                <LoginForm />
              </div>
            </div>

            {/* Registro */}
            <div className={`w-full md:w-1/2 flex flex-col items-center justify-center p-10 h-full ${!isLogin ? "block" : "hidden"} md:block`}>
              <div className="flex flex-col justify-center items-center h-full w-full">
                <h2 className="font-display text-2xl font-bold text-[var(--ink)] mb-2">Crie sua conta</h2>
                <p className="text-sm text-[var(--ink-soft)] mb-6">
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