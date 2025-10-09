import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

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
  // verificar se o store userStore tem dados do usuário
  // se não tiver, redirecionar para a página de login antes de renderizar o layout com o dashboard
    const {user } = useUserStore();
    if (!user || !user.nome) {
      // Se não houver dados do usuário, redirecionar para a página de login
      alert("Por favor, efetue o login primeiro.");
      window.location.replace("http://localhost:5173/auth");
      return null; // Ou um componente de carregamento, se preferir
    }


  return (
    <div className="h-screen flex md:flex-row flex-col overflow-hidden">
      {/* Sidebar fixa no desktop */}
      <aside className="hidden md:flex h-full">
        <Sidebar closeSidebar={() => {}} />
      </aside>

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 h-full">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
