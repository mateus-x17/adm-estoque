import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getMe,
  updateMe,
  getUserNames,
} from "../controllers/userController.js";
import { upload } from "../config/multerConfig.js";

// arquivo de rotas para gerenciamento de colaboradores do estabelecimento

const router = express.Router();

// 1 - Autenticação obrigatória com verificação de tenant e status ativo
router.use(authMiddleware);

// 2 - Rota "Meu Perfil" acessível por qualquer colaborador logado da loja
router.get("/me", getMe);
router.put(
  "/me",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email"] }),
  updateMe
);

// 3 - Lista otimizada de colaboradores da loja para dropdowns (restrita a gerentes e administradores)
router.get("/names", permit("ADMIN", "GERENTE"), getUserNames);

// 4 - Barreira administrativa: rotas restritas exclusivamente ao nível ADMIN da loja
router.use(permit("ADMIN"));

router.post(
  "/",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email", "senha", "role"] }),
  createUser
);

router.get("/", listUsers);
router.get("/:id", getUser);

router.put(
  "/:id",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email", "role"] }),
  updateUser
);

// 5 - Rota de Soft Delete / Reativação rápida de colaborador
router.patch("/:id/status", validateRequest({ required: ["ativo"] }), toggleUserStatus);

router.delete("/:id", deleteUser);

export default router;
