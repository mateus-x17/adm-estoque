// arquivo responsável por inicializar o servidor Express, configurar segurança HTTP (Helmet, CORS, Rate Limit), registrar rotas e gerenciar Graceful Shutdown.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from "./config/prismaClient.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import movementRoutes from "./routes/movementRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./utils/errorHandler.js";
import { logger } from './config/logger.js';

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1 - carrega as variáveis de ambiente a partir do arquivo .env com caminho absoluto robusto
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback caso esteja em outro diretório

// 2 - valida se JWT_SECRET existe e possui tamanho seguro mínimo (falha imediatamente em produção)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  if (process.env.NODE_ENV === "production") {
    logger.fatal("JWT_SECRET ausente ou muito curto em produção. Abortando inicialização.");
    process.exit(1);
  }
  logger.warn("JWT_SECRET ausente ou muito curto. Defina um segredo forte com pelo menos 16 caracteres no .env.");
}

// 3 - cria a instância da aplicação Express e ativa trust proxy para identificar IP real atrás de proxies (Render)
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// função responsável por normalizar a lista de origens permitidas no CORS a partir de FRONTEND_URL.
//
// 1 - recebe rawFrontendUrl (string|undefined).
// 2 - divide por vírgula caso múltiplas origens estejam configuradas e remove espaços/barras finais.
// 3 - retorna o array de origens válidas com fallback seguro para http://localhost:5173.
function parseAllowedOrigins(rawFrontendUrl) {
  if (!rawFrontendUrl) return ["http://localhost:5173"];
  const origins = String(rawFrontendUrl)
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return origins.length > 0 ? origins : ["http://localhost:5173"];
}

const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);

// 4 - configuração de middlewares globais de segurança e parsing
// Helmet injeta cabeçalhos de segurança (CSP, nosniff, X-Frame-Options, HSTS). cross-origin libera mídia para outro domínio.
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// logger estruturado com Correlation ID (X-Request-Id)
app.use(requestLogger);

// expõe uploads locais ignorando arquivos ocultos (dotfiles)
app.use("/uploads", express.static("uploads", { dotfiles: "ignore" }));

// 5 - rate limiter global da API para proteção contra abuso e floods (além dos limiters estritos em /auth)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  message: {
    message: "Muitas requisições a partir deste IP. Tente novamente em alguns instantes.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// 6 - rota de healthcheck simples para monitoramento da API
app.get("/", (req, res) => res.send("🚀 Backend Estoque rodando"));

// 7 - rota para verificar conectividade com PostgreSQL/NeonDB sem vazar detalhes internos em produção
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ message: "✅ Conexão com Neon/Postgres funcionando!", result });
  } catch (error) {
    logger.error({ err: error }, "Falha no healthcheck /test-db");
    res.status(500).json({
      error: "Erro ao conectar no banco",
      ...(process.env.NODE_ENV !== "production" ? { details: error.message } : {}),
    });
  }
});

// 8 - Montagem de todos os módulos de rotas sob seus respectivos prefixos
app.use("/users", userRoutes);
app.use('/auth', authRoutes);
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/orders", orderRoutes);
app.use("/movements", movementRoutes);

// 9 - Middleware global de captura e tratamento de Erros
// Obrigatoriamente deve ser o último middleware a ser declarado no express (depois das rotas)
app.use(errorHandler);

// 10 - Inicia de fato o servidor na porta configurada, passando a "ouvir" conexões HTTP
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `Servidor rodando`);
  logger.info(`URL: http://localhost:${PORT}`);
});

// 11 - Graceful Shutdown (A7): Encerramento gracioso de conexões HTTP e Prisma
const shutdown = async (signal) => {
  logger.info({ signal }, 'Recebido sinal de encerramento. Iniciando Graceful Shutdown...');
  server.close(async () => {
    logger.info('Servidor HTTP fechado. Encerrando conexões com o banco de dados Neon...');
    try {
      await prisma.$disconnect();
      logger.info('Conexões com PostgreSQL encerradas com sucesso.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Erro ao desconectar do banco de dados');
      process.exit(1);
    }
  });

  // Timeout de contingência caso conexões fiquem pendentes por mais de 10s
  setTimeout(() => {
    logger.error('Graceful shutdown expirou (10s). Forçando encerramento imediato.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;