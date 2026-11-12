// arquivo responsável por definir as rotas públicas de autenticação, login de usuários e registro de novas organizações.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js, express-rate-limit e middleware de validação.
// usado por: index.js montado sob o prefixo /auth.

// importações da biblioteca web: express provê o construtor Router para declaração de rotas HTTP.
import express from "express";
// importações de segurança: rateLimit protege os endpoints de autenticação contra ataques de força bruta.
import rateLimit from "express-rate-limit";
// importações dos controladores: loginController e registerController processam credenciais e criação de organizações.
import { loginController, registerController } from "../controllers/authController.js";
// importações de validação: validateRequest garante campos obrigatórios antes da execução dos controladores.
import { validateRequest } from "../middlewares/validationMiddleware.js";

// roteador Express para os endpoints de autenticação
const router = express.Router();

// rate limiter estrito para tentativas de login: máximo de 25 tentativas por janela de 15 minutos por IP
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

// rate limiter para criação de organizações: máximo de 15 cadastros por hora por IP para mitigar spam
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

// rota pública POST /auth/login: autentica colaboradores da loja (/login) ou administradores corporativos (/admin/login)
router.post(
  "/login",
  loginLimiter,
  validateRequest({ required: ["email", "senha"] }),
  loginController
);

// rota pública POST /auth/register: cria uma nova Organização locatária, a filial inicial e o administrador fundador
router.post(
  "/register",
  registerLimiter,
  validateRequest({ required: ["nome", "email", "senha"] }),
  registerController
);

export default router;
