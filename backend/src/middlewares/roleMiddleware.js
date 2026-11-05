import { AppError } from "../utils/errorHandler.js";

// middleware fábrica responsável por controlar a autorização baseada em papéis (roles)
// 1 - A função externa recebe uma lista de roles permitidos (rest operator)
// 2 - Retorna um middleware que valida a role do usuário autenticado
// 3 - Se não autenticado, encaminha AppError 401 para o handler central
// 4 - Se sem permissão, encaminha AppError 403 para o handler central
// 5 - Caso positivo, chama next()
export function permit(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return next(new AppError("Não autenticado", 401));
    
    if (!allowedRoles.includes(user.role)) {
      return next(new AppError("Acesso negado", 403));
    }
    next();
  };
}
