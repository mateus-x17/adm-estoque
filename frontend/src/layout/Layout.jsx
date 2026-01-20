import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const Layout = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  // Verifique se o usuário estiver logado - usamos o useEffect para redirecionar se não estiver
  // o useEffect depende de 'user' e 'navigate'
  // evita erros de renderização condicional
  useEffect(() => {
    if (!user || !user.nome) {
      alert("Por favor, efetue o login primeiro.");
      navigate("/auth");
    }
  }, [user, navigate]);

  // Enquanto o usuário não estiver definido, pode retornar null ou um loader
  if (!user || !user.nome) {
    return null;
  }

  return (
    <div className="h-screen flex md:flex-row flex-col overflow-hidden">
      <aside className="hidden md:flex h-full">
        <Sidebar closeSidebar={() => { }} />
      </aside>

      <div className="flex flex-col flex-1 h-full">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
