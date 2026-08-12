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
          if (req.body[key] === undefined || req.body[key] === null || req.body[key] === '') { // impede string vazia
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
