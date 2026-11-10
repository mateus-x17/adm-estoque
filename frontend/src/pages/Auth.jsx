import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/forms/LoginForm.jsx";
import RegisterForm from "../components/forms/RegisterForm.jsx";
import { useThemeStore } from "../store/useThemeStore.js";
import { FiSun, FiMoon, FiArrowLeft } from "react-icons/fi";

// arquivo responsável pela tela unificada de autenticação e criação de estabelecimentos (responsiva para mobile e desktop)

const Auth = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-20 pb-10 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto">
      {/* Elementos decorativos de fundo otimizados para GPU */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.22) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236, 72, 153, 0.20) 0%, transparent 70%)" }}
      />

      {/* Barra superior */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-4 sm:px-6 py-4 z-30 bg-background/60 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
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

      {/* Card principal: altura ajustada para acomodar campos de abertura de loja sem cortes no mobile ou desktop */}
      <div className="relative w-full max-w-[860px] h-auto md:h-[630px] rounded-3xl overflow-hidden glass-card shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        {/* Painel lateral animado */}
        <div
          className={`
            bg-gradient-to-br from-accent-purple to-accent-pink text-white flex flex-col items-center justify-center p-7 sm:p-10 z-20 text-center
            md:absolute md:top-0 md:left-0 md:w-1/2 md:h-full w-full h-auto
            transition-transform duration-700 ease-in-out relative overflow-hidden
            ${isLogin ? "md:translate-x-full" : "md:translate-x-0"}
          `}
        >
          <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/80 mb-2">
              {isLogin ? "Nova loja · Multi-Tenant" : "Já possui acesso"}
            </span>

            {isLogin ? (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
                  Cadastre sua loja
                </h2>
                <p className="mb-6 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
                  Crie seu ambiente exclusivo com estoque isolado, equipe, categorias e planilhas em segundos.
                </p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="rounded-full border border-white/40 px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-white hover:text-accent-purple transition-all duration-300 shadow-lg hover:shadow-white/20"
                >
                  Criar estabelecimento
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
                  Bem-vindo de volta!
                </h2>
                <p className="mb-6 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
                  Já possui conta vinculada a um estabelecimento? Acesse o painel agora.
                </p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="rounded-full border border-white/40 px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-white hover:text-accent-pink transition-all duration-300 shadow-lg hover:shadow-white/20"
                >
                  Entrar na minha loja
                </button>
              </>
            )}
          </div>
        </div>

        {/* VIEWPORT dos formulários */}
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
            {/* Login */}
            <div
              className={`w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-9 min-h-full ${
                isLogin ? "flex" : "hidden"
              } md:flex`}
            >
              <div className="flex flex-col justify-center items-center w-full max-w-xs mx-auto">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-1.5 tracking-tight text-center">
                  Acesso ao Sistema
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mb-6 text-center">
                  Insira suas credenciais para acessar sua loja.
                </p>
                <LoginForm />
              </div>
            </div>

            {/* Registro de Estabelecimento + Admin */}
            <div
              className={`w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8 min-h-full ${
                !isLogin ? "flex" : "hidden"
              } md:flex`}
            >
              <div className="flex flex-col justify-center items-center w-full max-w-xs mx-auto">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-1 tracking-tight text-center">
                  Abrir Estabelecimento
                </h2>
                <p className="text-xs text-text-secondary mb-5 text-center">
                  Configure sua loja e o administrador principal.
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
