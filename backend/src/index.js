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


// configs
dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
// validate minimal env
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  logger.warn('JWT_SECRET is missing or too short. Define a secure JWT_SECRET in your .env');
}
const app = express();
const PORT = process.env.PORT || 5000;
// middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
); //permitir requisição do endpoint de frontend
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use("/uploads", express.static("uploads")); // servir imagens gravadas em /uploads

// rate limiter for auth (login) to reduce brute force
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas. Tente novamente mais tarde.' });



// Teste de conexão
app.get("/", (req, res) => res.send("🚀 Backend Estoque rodando"));
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ message: "✅ Conexão com Neon/Postgres funcionando!", result });
  } catch (error) {
    res.status(500).json({ error: "Erro ao conectar no banco", details: error.message });
  }
});


// Rotas
app.use("/users", userRoutes);
// apply loginLimiter to login route inside authRoutes by mounting limiter on route below
app.use('/auth', authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/movements", movementRoutes);


// global error handler (must be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, `Servidor rodando`);
  logger.info(`URL: http://localhost:${PORT}`);
});

// lembrese de adc as variaveis de ambiente no arquivo .env
// ex: DATABASE_URL="postgresql://usuario:senha@endereco:porta/banco?schema=public"
// ex: JWT_SECRET="sua_chave_secreta"
// ex: PORT=5000