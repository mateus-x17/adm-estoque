import React, { useEffect } from "react";
import Sidebar from "../components/common/Sidebar.jsx";
import Header from "../components/common/Header.jsx";
import { NotificationContainer } from "../components/common/NotificationContainer.jsx";
import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável pelo layout estrutural autenticado (Sidebar + Header + área principal responsiva)

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
    <div className="h-screen w-full flex overflow-hidden bg-background">
      <aside className="hidden md:flex h-full">
        <Sidebar closeSidebar={() => {}} />
      </aside>

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header />
        <NotificationContainer />
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:p-5 md:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
