import crypto from 'crypto';
import { childLogger } from '../config/logger.js';

// middleware responsável por registrar (log) informações estruturadas sobre todas as requisições HTTP
// 1 - Injeta um Correlation ID (X-Request-Id) único para rastreabilidade de ponta a ponta (A6)
// 2 - Marca o tempo de início da requisição (start)
// 3 - Injeta o header X-Request-Id na resposta para consumo do frontend e debugging
// 4 - Registra método, caminho, status HTTP, tempo de execução e dados do usuário via Pino
export function requestLogger(req, res, next) {
    const start = Date.now();
    const log = childLogger('http');
    const method = req.method;
    const path = req.originalUrl || req.url;

    // Correlation ID / Request ID (A6)
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
        const ms = Date.now() - start;
        const status = res.statusCode;
        const user = req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null;

        log.info({ requestId, method, path, status, durationMs: ms, user }, 'HTTP request finished');
    });

    next();
}
