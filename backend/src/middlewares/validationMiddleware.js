import { AppError } from '../utils/errorHandler.js';

// Simple schema validator using a plain object of required fields or custom function
// schema can be: { required: ['email','senha'] } or a function(reqBody) that throws AppError
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (typeof schema === 'function') {
        schema(req.body);
      } else if (schema && Array.isArray(schema.required)) {
        for (const key of schema.required) {
          if (req.body[key] === undefined || req.body[key] === null || req.body[key] === '') {
            throw new AppError(`${key} é obrigatório`, 400);
          }
        }
      }
      next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      return next(new AppError('Dados inválidos', 400));
    }
  };
};
