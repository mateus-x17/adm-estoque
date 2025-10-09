import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm.jsx";
import RegisterForm from "../components/RegisterForm.jsx";
import { useThemeStore } from "../store/useThemeStore.js";
import { FiSun, FiMoon } from "react-icons/fi";

const Auth = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex absolute top-0 w-full justify-between p-4 z-30">
        <h1 className="top-4 left-4 ml-8 text-2xl font-bold">
          <Link to={"/"}>{isLogin ? "Login" : "Registrar"}</Link>
        </h1>

        <button
          onClick={toggleDarkMode}
          className="rounded-full mr-8 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {darkMode ? <FiSun className="h-6 w-6" /> : <FiMoon className="h-6 w-6" />}
        </button>
      </div>

      {/* Card principal */}
      <div className="relative w-full md:w-[800px] h-auto md:h-[500px] rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-800 mt-20 mb-8 mx-5">
        {/* Painel gradiente */}
        <div
          className={`
            bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center p-10 z-20
            md:absolute md:top-0 md:left-0 md:w-1/2 md:h-full w-full h-auto
            transition-transform duration-700 ease-in-out
            ${isLogin ? "md:translate-x-full" : "md:translate-x-0"}
          `}
        >
          {isLogin ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Novo por aqui?</h2>
              <p className="mb-6 text-center">Crie uma conta para começar sua jornada conosco.</p>
              <button
                onClick={() => setIsLogin(false)}
                className="border border-white px-6 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Registrar
              </button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h2>
              <p className="mb-6 text-center">Já tem uma conta? Faça login para continuar.</p>
              <button
                onClick={() => setIsLogin(true)}
                className="border border-white px-6 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Login
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
          {/* TRACK dos formulários */}
          <div
            className={`
              flex md:flex-row flex-col md:w-[200%] w-full h-full transition-transform duration-700 ease-in-out
              ${isLogin ? "md:translate-x-0" : "md:-translate-x-1/2"}
            `}
          >
            {/* Login */}
            <div
              className={`
                w-full md:w-1/2 flex flex-col items-center justify-center p-10 h-full
                ${isLogin ? "block" : "hidden"} md:block
              `}
            >
              <div className="flex flex-col justify-center items-center h-full w-full">
                <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 transition-all duration-300">
                  Faça login para acessar sua conta.
                </p>
                <LoginForm />
              </div>
            </div>

            {/* Registro */}
            <div
              className={`
                w-full md:w-1/2 flex flex-col items-center justify-center p-10 h-full
                ${!isLogin ? "block" : "hidden"} md:block
              `}
            >
              <div className="flex flex-col justify-center items-center h-full w-full">
                <h2 className="text-3xl font-bold mb-4">Crie sua conta</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 transition-all duration-300">
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
