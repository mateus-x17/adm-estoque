import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom' // cria rotas e provedor de rotas
import './index.css'
import App from './App.jsx'
import Layout from './layout/Layout.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Produtos from './pages/Produtos.jsx'
import Home from './pages/Home.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Movimentacoes from './pages/Movimentacoes.jsx'
import Categorias from './pages/Categorias.jsx'
import Pedidos from './pages/Pedidos.jsx'
import Fornecedores from './pages/Fornecedores.jsx'
import NotFound from './components/NotFound.jsx'

// cria as rotas
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/auth',
    element: <Auth />
  },
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'produtos', // rota = /dashboard/produtos
        element: <Produtos />
      },
      {
        path: 'usuarios', // rota = /dashboard/usuarios
        element: <Usuarios />
      },
      {
        path: 'movimentacoes', // rota = /dashboard/movimentacoes
        element: <Movimentacoes />
      },
      {
        path: 'categorias', // rota = /dashboard/categorias
        element: <Categorias />
      },
      {
        path: 'pedidos', // rota = /dashboard/pedidos
        element: <Pedidos />
      },
      {
        path: 'fornecedores', // rota = /dashboard/fornecedores
        element: <Fornecedores />
      }
    ]
  },
  // pagina não encontrada 
  {
    path: '*',
    element: <NotFound />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} /> {/* provedor de rotas */}
  </StrictMode>,
)
