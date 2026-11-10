import express from "express";
import rateLimit from 'express-rate-limit';
import { loginController, registerController } from "../controllers/authController.js";
import { validateRequest } from '../middlewares/validationMiddleware.js';

// arquivo central de rotas de autenticação e criação de estabelecimentos (públicas)
// 1 - Inicializa o roteador do Express
const router = express.Router();

// 2 - Configura limitador de taxa no login (máximo 15 tentativas por 15 minutos por IP contra força bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    message: 'Muitas tentativas de login a partir deste IP. Tente novamente mais tarde.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 3 - Configura limitador de taxa na criação de lojas/contas (máximo 10 cadastros por hora por IP contra DoS/bots)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    message: 'Muitas tentativas de cadastro a partir deste endereço IP. Tente novamente mais tarde.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4 - Rota POST /login: autentica usuário (suporta slug opcional da loja e seleção de estabelecimento quando multi-loja)
router.post(
  "/login",
  loginLimiter,
  validateRequest({ required: ['email', 'senha'] }),
  loginController
);

// 5 - Rota POST /register: cadastra novo estabelecimento (Empresa) e cria automaticamente o usuário fundador ADMIN
router.post(
  "/register",
  registerLimiter,
  validateRequest({ required: ['nomeLoja', 'nome', 'email', 'senha'] }),
  registerController
);

// 6 - Exporta o roteador para montagem em index.js
export default router;
