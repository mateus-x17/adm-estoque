export function permit(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}
