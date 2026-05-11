export function requestLogger(req, res, next) {
    const start = Date.now();
    const method = req.method;
    const path = req.originalUrl || req.url;

    // Loga APÓS a resposta ser enviada, quando o authMiddleware já populou req.user
    res.on('finish', () => {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        const ms = Date.now() - start;
        const status = res.statusCode;

        // req.user já foi preenchido pelo authMiddleware neste momento
        const userInfo = req.user
            ? ` | User: [${req.user.id}] ${req.user.email}`
            : ' | Unauthenticated';

        console.log(`[${timestamp}] ${method} ${path} ${status} (${ms}ms)${userInfo}`);
    });

    next();
}
