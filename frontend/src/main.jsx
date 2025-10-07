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
    element: <Layout/>,
    children:[
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'produtos', // rota = /dashboard/produtos
        element: <Produtos />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} /> {/* provedor de rotas */}
  </StrictMode>,
)
