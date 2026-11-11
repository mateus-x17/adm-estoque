import React, { useEffect } from "react";
import Sidebar from "../components/common/Sidebar.jsx";
import Header from "../components/common/Header.jsx";
import { NotificationContainer } from "../components/common/NotificationContainer.jsx";
import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pelo layout estrutural autenticado (Sidebar + Header + área principal responsiva)

// função responsável por renderizar a estrutura autenticada do painel garantindo sessão ativa e área principal responsiva.
//
// 1 - recebe nenhum parâmetro externo direto (obtém sessão de useUserStore e navegação via useNavigate).
// 2 - redireciona automaticamente para /login caso não haja usuário autenticado com nome válido.
// 3 - renderiza Sidebar fixa no desktop, Header mobile, NotificationContainer e Outlet com espaçamento confortável em zoom 100%.
// 4 - retorna o layout estrutural ou null enquanto redireciona.
const Layout = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user || !user.nome) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user || !user.nome) {
    return null;
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-background">
      <aside className="hidden md:flex h-full shrink-0">
        <Sidebar closeSidebar={() => {}} />
      </aside>

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header />
        <NotificationContainer />
        <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
