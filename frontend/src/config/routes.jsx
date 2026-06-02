import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Auth from '../pages/Auth.jsx';
import Layout from '../layout/Layout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Produtos from '../pages/Produtos.jsx';
import Usuarios from '../pages/Usuarios.jsx';
import Configuracoes from '../pages/Configuracoes.jsx';
import Movimentacoes from '../pages/Movimentacoes.jsx';
import Categorias from '../pages/Categorias.jsx';
import Pedidos from '../pages/Pedidos.jsx';
import Fornecedores from '../pages/Fornecedores.jsx';
import NotFound from '../components/common/NotFound.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute element={<Layout />} />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'produtos',
        element: <Produtos />,
      },
      {
        path: 'usuarios',
        element: <Usuarios />,
      },
      {
        path: 'configuracoes',
        element: <Configuracoes />,
      },
      {
        path: 'movimentacoes',
        element: <Movimentacoes />,
      },
      {
        path: 'categorias',
        element: <Categorias />,
      },
      {
        path: 'pedidos',
        element: <Pedidos />,
      },
      {
        path: 'fornecedores',
        element: <Fornecedores />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
