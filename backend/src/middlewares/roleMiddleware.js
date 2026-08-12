// middleware fábrica responsável por controlar a autorização baseada em papéis (roles)
// 1 - A função externa recebe uma lista de roles permitidos (rest operator)
// 2 - Retorna um middleware propriamente dito (req, res, next)
// 3 - Verifica se existe um usuário na requisição (garante que passou pelo authMiddleware)
// 4 - Verifica se a role do usuário está incluída na lista de roles permitidas fornecida
// 5 - Caso negativo, retorna status 403 (Acesso negado) proibindo a operação
// 6 - Caso positivo, chama next() para prosseguir
export function permit(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    
    if (!allowedRoles.includes(user.role)) { // checa restrição de nível de acesso
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}
