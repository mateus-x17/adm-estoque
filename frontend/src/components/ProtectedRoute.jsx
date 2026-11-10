import React from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "../store/userStore.js";

// arquivo responsável por proteger rotas privadas exigindo autenticação e verificando cargos RBAC

// função para validar sessão ativa e restringir acesso por cargo (string ou array de cargos permitidos)
const ProtectedRoute = ({ element, requiredRole = null }) => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return element;
};

export default ProtectedRoute;
