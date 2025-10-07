import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

// const Layout = ({ children }) => {
//   return (
//     <div className="h-screen flex md:flex-row flex-col">
//       <div className="hidden md:block">
//         <Sidebar />
//       </div>
//       <div className="flex flex-col flex-1">
//         <Header /> {/* flex-1 aqui faz a coluna ocupar todo o espaço */}
//         <main className="w-full flex-1 overflow-y-auto bg-gray-200">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

const Layout = () => {
  return (
    <div className="h-screen flex md:flex-row flex-col">
      <div className="hidden md:block">
        <Sidebar closeSidebar={() => {}} /> {/* closeSidebar para fechar a sidebar */}
      </div>
      <div className="flex flex-col flex-1">
        <Header /> {/* flex-1 aqui faz a coluna ocupar todo o espaço */}
        <main className="w-full flex-1 overflow-y-auto bg-gray-200">
          <Outlet /> {/* Outlet para renderizar as rotas filhas */}
        </main>
      </div>
    </div>
  );
};
export default Layout;
