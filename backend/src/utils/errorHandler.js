import { logger } from '../config/logger.js';

// classe responsável por padronizar os erros da aplicação
// 1 - Estende a classe Error padrão do JavaScript
// 2 - Recebe a mensagem e o código de status HTTP (padrão 500)
// 3 - Atribui o código de status e captura a stack trace do erro
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor); // captura o rastro da pilha onde o erro ocorreu para facilitar o debug
  }
}

// middleware global de tratamento de erros
// 1 - Recebe o erro, a requisição, a resposta e a função next do Express
// 2 - Extrai o status code e a mensagem do erro, ou define valores padrão para erros genéricos (500)
// 3 - Monta um objeto meta com informações adicionais sobre a requisição e o usuário autenticado para incluir no log
// 4 - Registra o erro no log (usa error para erros de servidor >= 500, e warn para erros do cliente)
// 5 - Retorna a resposta HTTP com o status correspondente e uma mensagem JSON para o cliente
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const meta = {
    method: req.method,
    path: req.originalUrl || req.url,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    status
  };

  if (status >= 500) {
    logger.error({ err, stack: err.stack, ...meta }, `CRITICAL ERROR: ${message}`);
  } else {
    logger.warn({ ...meta, message: err.message }, message);
  }

  res.status(status).json({ error: message });
}
