import { logger } from '../config/logger.js';

// arquivo responsável por padronizar classes de erro operacionais e o tratamento centralizado de exceções HTTP no Express com Pino.

// classe responsável por padronizar os erros operacionais da aplicação.
//
// 1 - recebe message (string) e statusCode (number opcional, padrão 500).
// 2 - repassa a mensagem para a classe nativa Error.
// 3 - define a propriedade statusCode na instância.
// 4 - captura o stack trace para depuração interna via Error.captureStackTrace.
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// função responsável por interceptar erros nas rotas do Express, registrar logs estruturados e evitar vazamento de detalhes internos ao cliente.
//
// 1 - recebe err (Error|AppError), req (Request), res (Response) e next (NextFunction).
// 2 - normaliza status HTTP para erros do Multer (400), JSON malformado (400) e exceções conhecidas do Prisma (P2002/P2025/P2003).
// 3 - monta metadados da requisição e do usuário autenticado (sem incluir senhas ou payloads sensíveis).
// 4 - registra logger.error para falhas internas >= 500 e logger.warn para erros de cliente < 500.
// 5 - oculta mensagens brutas de sistema em erros >= 500 não operacionais, enviando resposta JSON segura ao cliente.
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500;
  let publicMessage = err.message || 'Erro interno no servidor';

  // 2 - trata erros de upload do Multer e corpo JSON inválido como 400
  if (err?.name === 'MulterError') {
    status = 400;
    publicMessage =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'O arquivo enviado excede o tamanho máximo permitido.'
        : 'Falha no upload do arquivo enviado.';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    publicMessage = 'Corpo da requisição JSON malformado.';
  } else if (err?.code === 'P2002') {
    status = 409;
    publicMessage = 'Já existe um registro com os mesmos dados únicos.';
  } else if (err?.code === 'P2025') {
    status = 404;
    publicMessage = 'Registro solicitado não encontrado.';
  } else if (err?.code === 'P2003') {
    status = 400;
    publicMessage = 'Referência de relacionamento inválida.';
  }

  // 3 - monta metadados de auditoria para registro interno
  const meta = {
    method: req.method,
    path: req.originalUrl || req.url,
    requestId: req.requestId || null,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    status,
  };

  // 4 - registra erro completo nos logs privados conforme criticidade
  if (status >= 500) {
    logger.error({ err, stack: err.stack, ...meta }, `CRITICAL ERROR: ${err.message}`);
  } else {
    logger.warn({ ...meta, message: err.message }, err.message);
  }

  // 5 - suprime mensagens brutas de banco/infraestrutura em erros 500 não operacionais
  const isOperational = err instanceof AppError;
  if (status >= 500 && !isOperational) {
    publicMessage = 'Erro interno no servidor. Tente novamente mais tarde.';
  }

  res.status(status).json({ error: publicMessage });
}
