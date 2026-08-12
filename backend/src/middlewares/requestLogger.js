import { childLogger } from '../config/logger.js';

// middleware responsável por registrar (log) informações sobre todas as requisições HTTP que entram na aplicação
// 1 - Marca o tempo de início da requisição (start)
// 2 - Cria uma instância do logger dedicada a eventos http
// 3 - Extrai o método HTTP (GET, POST, etc) e a rota solicitada (path)
// 4 - Configura um ouvinte para o evento 'finish' na resposta HTTP, que dispara apenas quando a requisição é concluída
// 5 - Quando a requisição termina, calcula a duração em milissegundos
// 6 - Extrai dados do usuário da requisição (se houver, injetados pelo authMiddleware)
// 7 - Registra todos esses metadados informando que a requisição finalizou, junto ao status code de resposta
// 8 - Chama next() para dar seguimento imediato à rota
export function requestLogger(req, res, next) {
    const start = Date.now();
    const log = childLogger('http');
    const method = req.method;
    const path = req.originalUrl || req.url;

    res.on('finish', () => { // listener que aguarda o fim do processamento para medir o tempo real da resposta
        const ms = Date.now() - start;
        const status = res.statusCode;
        const user = req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null;

        log.info({ method, path, status, durationMs: ms, user }, 'HTTP request finished');
    });

    next();
}
