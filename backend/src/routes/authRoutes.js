import express from "express";
import rateLimit from 'express-rate-limit';
import { loginController, registerController} from "../controllers/authController.js";
import { validateRequest } from '../middlewares/validationMiddleware.js';

// arquivo central de rotas de autenticação (não protegidas)
// 1 - Inicializa o roteador do express
const router = express.Router();

// 2 - Configura um limitador de taxa (rate limiter) específico para a rota de login
// Evita ataques de força bruta limitando a 10 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas. Tente novamente mais tarde.' });

// 3 - Define a rota POST /login
// Aplica o rate limiter, o middleware de validação do corpo (exigindo email e senha) e chama o controlador
router.post("/login", loginLimiter, validateRequest({ required: ['email', 'senha'] }), loginController);

// 4 - Define a rota POST /register
// Aplica o middleware de validação (exigindo nome, email e senha) e chama o controlador
router.post("/register", validateRequest({ required: ['nome', 'email', 'senha'] }), registerController);

// 5 - Exporta o roteador para ser anexado ao arquivo principal (app.js)
export default router;
