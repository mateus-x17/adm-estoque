import { AppError } from '../utils/errorHandler.js';

// middleware fábrica para validação de esquemas dos dados da requisição
// 1 - Recebe um "schema" que pode ser uma função validadora customizada ou um objeto definindo os campos requeridos
// 2 - Retorna um middleware que avalia os dados de req.body antes que o controlador seja alcançado
// 3 - Se schema for uma função, executa passando o body. Se a função falhar, ela mesma deve lançar um erro
// 4 - Se schema for um objeto listando campos "required", itera sobre eles e verifica a existência de cada chave no body
// 5 - Caso falte alguma chave exigida, lança um erro formatado de AppError (Status 400 - Bad Request)
// 6 - Em caso de sucesso, chama next()
// 7 - O catch captura os erros e os envia ao manipulador central de erros (next(err)), formatando fallback caso não seja um AppError conhecido
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (typeof schema === 'function') {
        schema(req.body);
      } else if (schema && Array.isArray(schema.required)) {
        for (const key of schema.required) {
          const val = req.body[key];
          if (val === undefined || val === null || val === '') {
            throw new AppError(`${key} é obrigatório`, 400);
          }
        }
      }

      // Validações básicas de formato e integridade de tipos quando os campos estão presentes
      if (req.body.email && typeof req.body.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email.trim())) {
          throw new AppError('Formato de e-mail inválido', 400);
        }
      }

      if (req.body.preco !== undefined && req.body.preco !== null && req.body.preco !== '') {
        const p = Number(req.body.preco);
        if (isNaN(p) || p < 0) {
          throw new AppError('Preço deve ser um valor numérico positivo', 400);
        }
      }

      if (req.body.quantidade !== undefined && req.body.quantidade !== null && req.body.quantidade !== '') {
        const q = Number(req.body.quantidade);
        if (isNaN(q) || q < 0) {
          throw new AppError('Quantidade deve ser um valor numérico positivo', 400);
        }
      }

      next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      return next(new AppError('Dados inválidos', 400));
    }
  };
};
