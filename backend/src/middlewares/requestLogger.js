// arquivo responsável por registrar logs estruturados de requisições HTTP com Correlation ID (X-Request-Id) e métricas de latência.
// atua na camada de middlewares globais do backend.
// tecnologias principais: Pino Logger e Node.js crypto nativo.
// usado por: index.js para instrumentação de todas as rotas da API.

// importações de criptografia: crypto gera identificadores universais únicos (UUID v4) para rastreabilidade de requisições.
import crypto from 'crypto';
// importações de logging: childLogger instancia um logger filho com contexto HTTP.
import { childLogger } from '../config/logger.js';

// logger filho contextualizado para o ciclo de vida das requisições HTTP
const log = childLogger('http');

// função responsável por interceptar requisições HTTP, injetar Correlation ID e registrar tempo de resposta ao concluir.
//
// contexto: registrado globalmente em index.js antes de todas as rotas da aplicação.
//
// parâmetros:
//   - req (Request, obrigatório): objeto da requisição contendo headers, method, url e user.
//   - res (Response, obrigatório): objeto de resposta onde o evento finish é monitorado.
//   - next (NextFunction, obrigatório): função para prosseguir a cadeia de middlewares.
//
// retorno: nenhum (chama next()).
// erros: nenhum.
// efeitos colaterais: atribui req.requestId, define o cabeçalho X-Request-Id na resposta e emite log estruturado ao finalizar.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - registra o timestamp inicial com Date.now().
// 3 - extrai ou gera o Correlation ID via req.headers['x-request-id'] ou crypto.randomUUID().
// 4 - injeta req.requestId e define o header de resposta X-Request-Id.
// 5 - registra o ouvinte no evento finish da resposta para calcular a duração em milissegundos.
// 6 - grava o log estruturado com requestId, método, caminho, status HTTP, duração e usuário autenticado.
// 7 - chama next() liberando o fluxo da requisição.
export function requestLogger(req, res, next) {
  // 2 - marca início
  const start = Date.now();
  const method = req.method;
  const path = req.originalUrl || req.url;

  // 3 e 4 - define Correlation ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // 5 e 6 - monitora finalização da resposta
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const user = req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null;

    log.info({ requestId, method, path, status, durationMs: ms, user }, 'HTTP request finished');
  });

  // 7 - prossegue
  next();
}
