import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { HiMenu, HiHome, HiCube, HiUsers, HiSwitchHorizontal, HiShoppingCart, HiTag } from "react-icons/hi";
import { FaUser } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";
import { FaMoon, FaSun} from "react-icons/fa";
import { useUserStore } from "../store/userStore";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: <HiHome size={20} /> },
  { name: "Produtos", path: "/dashboard/produtos", icon: <HiCube size={20} /> },
  { name: "Usuários", path: "/dashboard/usuarios", icon: <HiUsers size={20} /> },
  { name: "Movimentações", path: "/dashboard/movimentacoes", icon: <HiSwitchHorizontal size={20} /> },
  { name: "Pedidos", path: "/dashboard/pedidos", icon: <HiShoppingCart size={20} /> },
  { name: "Categorias", path: "/dashboard/categorias", icon: <HiTag size={20} /> },
];

// const Sidebar = ({closeSidebar}) => {
//   const { darkMode, toggleDarkMode } = useThemeStore();

//     // Adiciona ou remove a classe 'dark' no body
//     useEffect(() => {
//       if (darkMode) {
//         document.documentElement.classList.add("dark");
//       } else {
//         document.documentElement.classList.remove("dark");
//       }
//     }, [darkMode]);

//   return (
//     <>
//       <div className={`p-4 h-[100dvh] bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200`}>
//         <h1 className="text-lg font-bold">Estoque</h1>
//         {/* links para pages */}
//         <nav className="h-[70%] flex flex-col gap-3 mt-4">
//           {links.map((link) => (
//             <NavLink
//               key={link.path}
//               to={link.path}
//               end={true}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700 ${isActive ? "bg-gray-300 dark:bg-gray-700 font-semibold" : ""
//                 }`
//               }
//               onClick={() => closeSidebar()} // Fecha a sidebar ao clicar em um link (apenas para mobile)
//             >
//               {link.icon}
//               <span>{link.name}</span>
//             </NavLink>
//           ))}
//         </nav>

//         {/* config do sistema */}
//         <div className="h-[30%] pt-4 border-t border-gray-400 dark:border-gray-300 ">
//           <div className="flex items-center gap-3">
//             <FaUser size={20} className="text-green-500 dark:text-blue-500" />
//             {/* user infos */}
//             <div>
//               {/* nome usuario */}
//               <p className="font-semibold">Mateus </p>
//               {/* role do usuario */}
//               <p className="text-sm text-gray-600 dark:text-gray-400">administrador</p>
//             </div>
//           </div>

//           {/* Botão para alternar entre modos light/dark*/}
//           <button
//             onClick={toggleDarkMode}
//             className="flex px-3 py-1 mt-1 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
//           >
//             Tema: 
//             {darkMode ? <FaSun className="mt-1 ml-2"/> : <FaMoon className="mt-1 ml-2"/>}
//           </button>

//           {/* configurações */}
//           <div className="flex justify-start  hover:text-gray-500 dark:hover:text-blue-500 cursor-pointer">
//             <FaGear size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
//             <p className="mt-3 ml-3">configurações</p>
//           </div>

//           {/* logout */}
//           <div className="flex justify-start hover:text-red-700 dark:hover:text-red-500 cursor-pointer">
//             <FiLogOut size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer" />
//             <p className="mt-3 ml-3">sair</p>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// };
const Sidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const {clearUser} = useUserStore();
  // Função de logout (simples - por hora)
  const logout = () => {
    // Lógica de logout aqui
    clearUser(); // Limpa os dados do usuário no Zustand
    alert("Logout de usuário realizado com sucesso!");
    // Exemplo: redirecionar para a pággin home com hook useNavigate: navigate('/');
    navigate('/');
  }

  return (
    <div className="flex flex-col justify-between h-full w-64 p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Topo */}
      <div>
        <h1 className="text-lg font-bold">Estoque</h1>

        <nav className="flex flex-col gap-3 mt-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700 ${
                  isActive ? "bg-gray-300 dark:bg-gray-700 font-semibold" : ""
                }`
              }
              onClick={() => closeSidebar()}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="pt-4 border-t border-gray-400 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <FaUser size={20} className="text-green-500 dark:text-blue-500" />
          <div>
            <p className="font-semibold">Mateus</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">administrador</p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex px-3 py-1 mt-2 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Tema:
          {darkMode ? <FaSun className="mt-1 ml-2" /> : <FaMoon className="mt-1 ml-2" />}
        </button>

        <div className="flex items-center gap-3 mt-3 cursor-pointer hover:text-gray-500 dark:hover:text-blue-400">
          <FaGear size={20} />
          <p>Configurações</p>
        </div>

        <div className="flex items-center gap-3 mt-3 cursor-pointer hover:text-red-700 dark:hover:text-red-500"
          onClick={logout}>
          <FiLogOut size={20} />
          <p>Sair</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;