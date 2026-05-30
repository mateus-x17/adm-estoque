import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

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
    logger.error({ err, ...meta }, message);
  } else {
    logger.warn({ ...meta }, message);
  }

  res.status(status).json({ error: message });
}
