import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="h-screen flex md:flex-row flex-col">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1">
        <Header /> {/* flex-1 aqui faz a coluna ocupar todo o espaço */}
        <main className="p-4 flex-1 overflow-y-auto bg-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
