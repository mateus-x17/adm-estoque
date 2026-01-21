export function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const method = req.method;
    const path = req.originalUrl || req.url;

    // O usuário é anexado à req pelo authMiddleware, se autenticado
    const userInfo = req.user
        ? ` - User: [${req.user.id}] ${req.user.email}`
        : ' - Unauthenticated';

    console.log(`[${timestamp}] ${method} ${path}${userInfo}`);
    next();
}
