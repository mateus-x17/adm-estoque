import { childLogger } from '../config/logger.js';

export function requestLogger(req, res, next) {
    const start = Date.now();
    const log = childLogger('http');
    const method = req.method;
    const path = req.originalUrl || req.url;

    res.on('finish', () => {
        const ms = Date.now() - start;
        const status = res.statusCode;
        const user = req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null;

        log.info({ method, path, status, durationMs: ms, user }, 'HTTP request finished');
    });

    next();
}
