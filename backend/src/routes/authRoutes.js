import express from "express";
import rateLimit from "express-rate-limit";
import { loginController, registerController } from "../controllers/authController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";

// arquivo de rotas públicas para autenticação (Portal Admin e Portal da Loja) e registro de Organizações

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    message: "Muitas tentativas de login a partir deste IP. Tente novamente mais tarde.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    message: "Muitas tentativas de cadastro a partir deste endereço IP. Tente novamente mais tarde.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rota POST /login: autentica ADMIN (/admin/login) ou equipe da loja (/login)
router.post(
  "/login",
  loginLimiter,
  validateRequest({ required: ["email", "senha"] }),
  loginController
);

// Rota POST /register: cria nova Organização + 1ª Loja + usuário fundador ADMIN
router.post(
  "/register",
  registerLimiter,
  validateRequest({ required: ["nome", "email", "senha"] }),
  registerController
);

export default router;
