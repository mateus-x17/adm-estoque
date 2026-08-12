import pino from 'pino';

// arquivo responsável por configurar o sistema de logs (Pino)
// 1 - Importa a biblioteca pino para geração de logs de alta performance
// 2 - Obtém o nível de log (level) a partir da variável de ambiente LOG_LEVEL, ou define "info" como padrão
// 3 - Instancia e exporta o logger principal configurado com o nível definido
const level = process.env.LOG_LEVEL || 'info';
export const logger = pino({ level });

// função para criar loggers filhos específicos por módulo
// 1 - Recebe o nome do módulo como argumento (ex: "userController")
// 2 - Retorna um novo logger filho a partir do logger principal, anexando a propriedade { module: moduleName } em todos os logs deste filho
export function childLogger(moduleName) {
  return logger.child({ module: moduleName });
}

export default logger;
