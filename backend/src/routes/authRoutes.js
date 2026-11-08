import express from "express";
import rateLimit from 'express-rate-limit';
import { loginController, registerController} from "../controllers/authController.js";
import { validateRequest } from '../middlewares/validationMiddleware.js';

// arquivo central de rotas de autenticação (não protegidas)
// 1 - Inicializa o roteador do express
const router = express.Router();

// 2 - Configura limitadores de taxa (rate limiters) específicos para autenticação
// Evita ataques de força bruta limitando a 10 tentativas a cada 15 minutos por IP no login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Muitas tentativas de login a partir deste IP. Tente novamente mais tarde.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Proteção contra DoS e criação em massa de contas (I10): máximo de 10 cadastros por hora por IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    message: 'Muitas tentativas de cadastro a partir deste endereço IP. Tente novamente mais tarde.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 3 - Define a rota POST /login
// Aplica o rate limiter, o middleware de validação do corpo (exigindo email e senha) e chama o controlador
router.post("/login", loginLimiter, validateRequest({ required: ['email', 'senha'] }), loginController);

// 4 - Define a rota POST /register
// Aplica o rate limiter contra DoS/bots, middleware de validação e chama o controlador
router.post("/register", registerLimiter, validateRequest({ required: ['nome', 'email', 'senha'] }), registerController);

// 5 - Exporta o roteador para ser anexado ao arquivo principal (app.js)
export default router;
