import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { HiMenu, HiHome, HiCube, HiUsers, HiSwitchHorizontal, HiShoppingCart, HiTag } from "react-icons/hi";

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
    {
      <div className={ isOpen ? `p-4 h-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white` : `hidden`}>
        <h1 className="text-lg font-bold">Estoque</h1>
        <nav className="flex flex-col gap-3 mt-4">
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
      </div>
   
    }
    </>
  );
};
export default Sidebar;