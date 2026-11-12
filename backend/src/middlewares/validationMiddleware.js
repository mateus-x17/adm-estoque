// arquivo responsável por validar esquemas e regras de integridade nos dados do corpo (body) das requisições HTTP.
// atua na camada de middlewares de validação de entrada do backend.
// tecnologias principais: Express.js e AppError.
// usado por: rotas de criação e edição para garantir dados obrigatórios, formatos de e-mail e números positivos antes de atingir os controladores.

// importações de erros: AppError formata exceções operacionais com código HTTP 400 (Bad Request).
import { AppError } from '../utils/errorHandler.js';

// função responsável por construir um middleware de validação que avalia campos obrigatórios e formatos de entrada no corpo da requisição.
//
// contexto: invocada nas rotas antes dos controllers para barrar dados ausentes ou mal formatados na entrada.
//
// parâmetros:
//   - schema (objeto|função, obrigatório): especificação de validação contendo array required ou função validadora síncrona.
//
// retorno: função middleware do Express (req, res, next) => void.
// erros:
//   - AppError(400) se algum campo obrigatório de schema.required estiver ausente ou vazio.
//   - AppError(400) se e-mail, preço ou quantidade possuírem formato ou valor inválido.
// efeitos colaterais: nenhum (validação de entrada síncrona em memória).
//
// passo a passo:
// 1 - recebe o parâmetro schema.
// 2 - retorna a função middleware do Express com req, res e next.
// 3 - se schema for uma função, executa-a passando req.body.
// 4 - se schema possuir a propriedade required em array, verifica se cada chave existe e não é vazia em req.body.
// 5 - valida o formato de e-mail com regex caso req.body.email esteja presente.
// 6 - valida se req.body.preco é um número positivo caso informado.
// 7 - valida se req.body.quantidade é um número positivo caso informado.
// 8 - chama next() se todas as validações passarem, ou encaminha o erro capturado para o handler central com next(err).
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // 3 - validação via função customizada
      if (typeof schema === 'function') {
        schema(req.body);
      } else if (schema && Array.isArray(schema.required)) {
        // 4 - validação de campos obrigatórios
        for (const key of schema.required) {
          const val = req.body[key];
          if (val === undefined || val === null || val === '') {
            throw new AppError(`${key} é obrigatório`, 400);
          }
        }
      }

      // 5 - validação de formato de e-mail
      if (req.body.email && typeof req.body.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email.trim())) {
          throw new AppError('Formato de e-mail inválido', 400);
        }
      }

      // 6 - validação de preço positivo
      if (req.body.preco !== undefined && req.body.preco !== null && req.body.preco !== '') {
        const p = Number(req.body.preco);
        if (isNaN(p) || p < 0) {
          throw new AppError('Preço deve ser um valor numérico positivo', 400);
        }
      }

      // 7 - validação de quantidade positiva
      if (req.body.quantidade !== undefined && req.body.quantidade !== null && req.body.quantidade !== '') {
        const q = Number(req.body.quantidade);
        if (isNaN(q) || q < 0) {
          throw new AppError('Quantidade deve ser um valor numérico positivo', 400);
        }
      }

      // 8 - libera para o controlador
      next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      return next(new AppError('Dados inválidos', 400));
    }
  };
};
