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
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./utils/errorHandler.js";
import { logger } from './config/logger.js';

// arquivo principal que inicializa o servidor Node.js/Express
// 1 - Carrega as variáveis de ambiente a partir do arquivo .env
dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// 2 - Valida se a chave JWT existe e tem um tamanho seguro mínimo
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  logger.warn('JWT_SECRET is missing or too short. Define a secure JWT_SECRET in your .env');
}

// 3 - Cria a instância da aplicação Express
const app = express();
const PORT = process.env.PORT || 5000;

// 4 - Configuração de Middlewares Globais
// Helmet: injeta cabeçalhos de segurança na resposta HTTP (proteção contra XSS, Clickjacking, etc)
// A política cross-origin permite que recursos sejam carregados por domínios diferentes, essencial se o front estiver em outro domínio/porta
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// CORS: Permite requisições vindas do endereço do frontend, incluindo envio de cookies/credenciais
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Express JSON: Faz o parse (leitura) de corpos de requisição em formato JSON
app.use(express.json());

// Logger Customizado: Intercepta todas as requisições para medir tempo de resposta e registrar o acesso
app.use(requestLogger);

// Arquivos Estáticos: Expõe a pasta local "uploads" publicamente sob a rota "/uploads"
app.use("/uploads", express.static("uploads"));

// 5 - Configuração do limitador de requisições
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas. Tente novamente mais tarde.' });

// 6 - Rota de teste simples (Healthcheck) para saber se a API subiu
app.get("/", (req, res) => res.send("🚀 Backend Estoque rodando"));

// 7 - Rota de teste específica para verificar se a conexão com o banco de dados via Prisma foi estabelecida com sucesso
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ message: "✅ Conexão com Neon/Postgres funcionando!", result });
  } catch (error) {
    res.status(500).json({ error: "Erro ao conectar no banco", details: error.message });
  }
});

// 8 - Montagem de todos os módulos de rotas sob seus respectivos prefixos
app.use("/users", userRoutes);
app.use('/auth', authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/movements", movementRoutes);

// 9 - Middleware global de captura e tratamento de Erros
// Obrigatoriamente deve ser o último middleware a ser declarado no express (depois das rotas)
app.use(errorHandler);

// 10 - Inicia de fato o servidor na porta configurada, passando a "ouvir" conexões HTTP
app.listen(PORT, () => {
  logger.info({ port: PORT }, `Servidor rodando`);
  logger.info(`URL: http://localhost:${PORT}`);
});