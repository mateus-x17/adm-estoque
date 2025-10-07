import { useEffect, useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { FaMoon, FaSun } from "react-icons/fa";
import { HiMenu } from "react-icons/hi";
import Sidebar from "./Sidebar";

const Header = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false); // controla se a sidebar está aberta
  const [sidebarAnimation, setSidebarAnimation] = useState("slideInLeft"); // controla a animação
  const [isAnimatingOut, setIsAnimatingOut] = useState(false); // controla se está animando para fechar

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // Função para abrir a sidebar
  const openSidebar = () => {
    setSidebarAnimation("slideInLeft");
    setSidebarOpen(true);
    setIsAnimatingOut(false);
  };

  // Função para fechar a sidebar com animação
  const closeSidebar = () => {
    setSidebarAnimation("slideOutLeft");
    setIsAnimatingOut(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setIsAnimatingOut(false);
    }, 300); // tempo igual ao da animação (0.3s) para remover do DOM após a animação
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 shadow sticky top-0 z-10 md:hidden">
        {/* Ícone do menu hambúrguer */}
        <button
          onClick={openSidebar}
          className="mr-2 p-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <HiMenu size={28} />
        </button>

        {/* nome sistema */}
        <h2 className="text-lg font-semibold">Dashboard-ADM</h2>

        {/* Botão para alternar entre modos light/dark*/}
        <button
          onClick={toggleDarkMode}
          className="flex px-3 py-1 mt-1 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Tema:
          {darkMode ? <FaSun className="mt-1 ml-2" /> : <FaMoon className="mt-1 ml-2" />}
        </button>
      </header>

      {/* Overlay e Sidebar */}
      {(sidebarOpen || isAnimatingOut) && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity duration-300"
            onClick={closeSidebar}
          />
          {/* sideBar */}
          <div className="relative">
            <div className={`h-full ${sidebarAnimation === "slideInLeft" ? "animate-slideInLeft" : "animate-slideOutLeft"}`}>
              <Sidebar
                closeSidebar={closeSidebar}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

// criar uma sidebar quese ativa ao clicar no icone do menu hamburger
// adicionar animação de transição ao abrir e fechar a sidebar
// adicionar links para as páginas principais do sistema

// {/* user */ }
// <div className="flex items-center gap-3">
//   <FaUser size={20} className="text-green-500 dark:text-blue-500" />
//   {/* user infos */}
//   <div>
//     {/* nome usuario */}
//     <p className="font-semibold">Mateus </p>
//     {/* role do usuario */}
//     <p className="text-sm text-gray-600 dark:text-gray-400">administrador</p>
//   </div>
// </div>

// {/* configurações */ }
// <div className="flex justify-start  hover:text-gray-500 dark:hover:text-blue-500 cursor-pointer">
//   <FaGear size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
//   <p className="mt-3 ml-3">configurações</p>
// </div>

// {/* logout */ }
// <div className="flex justify-start hover:text-red-700 dark:hover:text-red-500 cursor-pointer">
//   <FiLogOut size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
//   <p className="mt-3 ml-3">sair</p>
// </div>
