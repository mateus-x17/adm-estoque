// arquivo responsável por configurar e instanciar o sistema de logs estruturados em formato JSON com Pino.
// atua na camada de configuração e infraestrutura do backend.
// tecnologias principais: Pino e pino-pretty.
// usado por: index.js, requestLogger.js, errorHandler.js e todos os controllers e middlewares para auditoria e rastreamento.

// importações da biblioteca de logging: pino é a fábrica de instâncias de logger ultrarrápido em JSON.
import pino from 'pino';

// flag booleana que detecta se o ambiente atual é diferente de produção (development/test).
const isDev = process.env.NODE_ENV !== 'production';

// nível de severidade mínimo de log (debug em desenvolvimento, info em produção, ou o valor de LOG_LEVEL).
const level = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// configuração de transporte visual: formata logs de forma colorida com pino-pretty em desenvolvimento e JSON bruto em produção.
const transport = isDev
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// instância singleton do logger configurado para a aplicação.
export const logger = pino({
  level,
  transport,
});

// função responsável por criar instâncias de loggers filhos anotados com o nome do módulo solicitante.
//
// contexto: invocada no topo dos controllers, services e middlewares para associar logs ao seu componente de origem.
//
// parâmetros:
//   - moduleName (string, obrigatório): nome de identificação do módulo (ex.: 'authController', 'orderService').
//
// retorno: nova instância de logger filha herdando as configurações globais com a propriedade fixa module = moduleName.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura de instanciação de logger).
//
// passo a passo:
// 1 - recebe moduleName (string) representando o contexto de execução.
// 2 - deriva um novo logger filho a partir da instância principal do Pino vinculando a chave { module: moduleName }.
// 3 - retorna a instância especializada do logger.
export function childLogger(moduleName) {
  // 2 e 3 - cria e retorna o logger filho contextualizado
  return logger.child({ module: moduleName });
}

export default logger;
