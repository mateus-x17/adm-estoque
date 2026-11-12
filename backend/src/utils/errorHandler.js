// arquivo responsável por padronizar a classe de erros operacionais e o middleware centralizado de tratamento de exceções HTTP.
// atua na camada de utilitários e middleware de controle de erros do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: index.js (registrado como último middleware) e por toda a aplicação via classe AppError.

// importações de logging: logger registra eventos e falhas estruturadas com correlation ID e nível de criticidade.
import { logger } from '../config/logger.js';

// classe responsável por encapsular erros operacionais conhecidos da aplicação com código HTTP e mensagem amigável.
//
// contexto: instanciada por serviços, middlewares e controladores quando uma validação ou regra de negócio falha intencionalmente.
//
// parâmetros:
//   - message (string, obrigatório): mensagem clara do erro a ser exibida ao cliente.
//   - statusCode (number, opcional, padrão 500): código de status HTTP correspondente (400, 401, 403, 404, 409 etc.).
//
// retorno: instância de AppError derivada da classe nativa Error.
// erros: nenhum.
// efeitos colaterais: captura o stack trace da execução via Error.captureStackTrace.
//
// passo a passo:
// 1 - recebe message e statusCode.
// 2 - invoca super(message) para inicializar a classe base Error.
// 3 - atribui statusCode à instância.
// 4 - captura a pilha de execução com Error.captureStackTrace para depuração.
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// função responsável por interceptar erros em todas as rotas do Express, registrar logs com requestId e responder com JSON seguro.
//
// contexto: registrado em index.js após todas as rotas; chamado automaticamente pelo Express sempre que next(err) é invocado.
//
// parâmetros:
//   - err (Error|AppError, obrigatório): objeto de erro lançado na rota ou serviço.
//   - req (Request, obrigatório): objeto da requisição HTTP do Express contendo method, url, requestId e user.
//   - res (Response, obrigatório): objeto de resposta HTTP do Express para envio do status e corpo JSON.
//   - next (NextFunction, obrigatório): função de encadeamento do Express.
//
// retorno: nenhum (envia a resposta HTTP final ao cliente com res.status().json()).
// erros: nenhum.
// efeitos colaterais: grava logs estruturados no Pino e envia resposta JSON com status HTTP correspondente ao cliente.
//
// passo a passo:
// 1 - recebe err, req, res e next.
// 2 - determina o status HTTP inicial a partir de err.statusCode, err.status ou 500.
// 3 - normaliza mensagens para erros conhecidos de bibliotecas terceiras (Multer, JSON malformado e códigos P2002/P2025/P2003 do Prisma).
// 4 - monta o objeto de metadados meta com método, caminho, requestId, dados do usuário e status HTTP.
// 5 - registra log de erro crítico (logger.error) para status >= 500 ou log de aviso (logger.warn) para status < 500.
// 6 - em caso de erro 500 não operacional, oculta detalhes técnicos e define mensagem genérica de segurança.
// 7 - envia resposta JSON com o status HTTP e a chave { error: publicMessage }.
export function errorHandler(err, req, res, next) {
  // 2 - define status inicial e mensagem padrão
  let status = err.statusCode || err.status || 500;
  let publicMessage = err.message || 'Erro interno no servidor';

  // 3 - mapeia erros conhecidos do Multer, parser JSON e Prisma
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

  // 4 - monta metadados de auditoria e correlação
  const meta = {
    method: req.method,
    path: req.originalUrl || req.url,
    requestId: req.requestId || null,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    status,
  };

  // 5 - grava log estruturado de acordo com a severidade
  if (status >= 500) {
    logger.error({ err, stack: err.stack, ...meta }, `CRITICAL ERROR: ${err.message}`);
  } else {
    logger.warn({ ...meta, message: err.message }, err.message);
  }

  // 6 - suprime detalhes de banco em erros 500 não operacionais
  const isOperational = err instanceof AppError;
  if (status >= 500 && !isOperational) {
    publicMessage = 'Erro interno no servidor. Tente novamente mais tarde.';
  }

  // 7 - despacha resposta JSON
  res.status(status).json({ error: publicMessage });
}
