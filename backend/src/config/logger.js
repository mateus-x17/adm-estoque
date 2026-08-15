import pino from 'pino';

// arquivo responsável por configurar o sistema de logs (Pino)
// 1 - Determina se está em ambiente de desenvolvimento (padrão quando NODE_ENV não é 'production')
const isDev = process.env.NODE_ENV !== 'production';

// 2 - Obtém o nível de log (level) a partir da variável de ambiente LOG_LEVEL, ou define "debug" em dev e "info" em prod
const level = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// 3 - Configuração de transporte: utiliza pino-pretty em desenvolvimento para formatação legível e colorida
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

// 4 - Instancia e exporta o logger principal configurado
export const logger = pino({
  level,
  transport,
});

// função para criar loggers filhos específicos por módulo
// 1 - Recebe o nome do módulo como argumento (ex: "userController")
// 2 - Retorna um novo logger filho a partir do logger principal, anexando a propriedade { module: moduleName } em todos os logs deste filho
export function childLogger(moduleName) {
  return logger.child({ module: moduleName });
}

export default logger;

