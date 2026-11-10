import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Auth from "../pages/Auth.jsx";
import AdminLogin from "../pages/AdminLogin.jsx";
import Layout from "../layout/Layout.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Produtos from "../pages/Produtos.jsx";
import Usuarios from "../pages/Usuarios.jsx";
import Lojas from "../pages/Lojas.jsx";
import DesempenhoVendedores from "../pages/DesempenhoVendedores.jsx";
import Configuracoes from "../pages/Configuracoes.jsx";
import Movimentacoes from "../pages/Movimentacoes.jsx";
import Categorias from "../pages/Categorias.jsx";
import Pedidos from "../pages/Pedidos.jsx";
import Fornecedores from "../pages/Fornecedores.jsx";
import NotFound from "../components/common/NotFound.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

// arquivo responsável pelo roteamento principal com Portais Admin/Loja e guardas RBAC por rota

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Auth />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute element={<Layout />} />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "produtos",
        element: <Produtos />,
      },
      {
        path: "pedidos",
        element: <Pedidos />,
      },
      {
        path: "movimentacoes",
        element: <Movimentacoes />,
      },
      {
        path: "desempenho",
        element: (
          <ProtectedRoute
            element={<DesempenhoVendedores />}
            requiredRole={["ADMIN", "GERENTE"]}
          />
        ),
      },
      {
        path: "lojas",
        element: <ProtectedRoute element={<Lojas />} requiredRole="ADMIN" />,
      },
      {
        path: "usuarios",
        element: <ProtectedRoute element={<Usuarios />} requiredRole="ADMIN" />,
      },
      {
        path: "categorias",
        element: <Categorias />,
      },
      {
        path: "fornecedores",
        element: <Fornecedores />,
      },
      {
        path: "configuracoes",
        element: <Configuracoes />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
