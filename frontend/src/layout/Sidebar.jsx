import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { HiMenu, HiHome, HiCube, HiUsers, HiSwitchHorizontal, HiShoppingCart, HiTag } from "react-icons/hi";
import { FaUser } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";

const links = [
  { name: "Dashboard", path: "/", icon: <HiHome size={20} /> },
  { name: "Produtos", path: "/produtos", icon: <HiCube size={20} /> },
  { name: "Usuários", path: "/usuarios", icon: <HiUsers size={20} /> },
  { name: "Movimentações", path: "/movimentacoes", icon: <HiSwitchHorizontal size={20} /> },
  { name: "Pedidos", path: "/pedidos", icon: <HiShoppingCart size={20} /> },
  { name: "Categorias", path: "/categorias", icon: <HiTag size={20} /> },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
  <div className={ isOpen ? `p-4 h-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200` : `hidden`}>
    <h1 className="text-lg font-bold">Estoque</h1>
    {/* links para pages */}
    <nav className="h-[70%] flex flex-col gap-3 mt-4">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700 ${
              isActive ? "bg-gray-300 dark:bg-gray-700 font-semibold" : ""
            }`
          }
        >
          {link.icon}
          <span>{link.name}</span>
        </NavLink>
      ))}
    </nav>

    {/* config do sistema */}
    <div className="h-[30%] pt-4 border-t border-gray-400 dark:border-gray-300 ">
      <div className="flex items-center gap-3">
        <FaUser size={20} className="text-green-500 dark:text-blue-500"/>
        {/* user infos */}
        <div>
          {/* nome usuario */}
          <p className="font-semibold">Mateus </p> 
          {/* role do usuario */}
          <p className="text-sm text-gray-600 dark:text-gray-400">administrador</p>
        </div>
      </div>

      {/* configurações */}
      <div className="flex justify-start  hover:text-gray-500 dark:hover:text-blue-500 cursor-pointer">
        <FaGear size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer"/>
        <p className="mt-3 ml-3">configurações</p>
      </div>

      {/* logout */}
      <div className="flex justify-start hover:text-red-700 dark:hover:text-red-500 cursor-pointer">
        <FiLogOut size={20} className="mt-3 text-gray-600 dark:text-gray-400 cursor-pointer"/>
        <p className="mt-3 ml-3">sair</p>
      </div>
    </div>
  </div>
    </>
  );
};
export default Sidebar;