import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  getUserNames,
} from "../controllers/userController.js";
import { upload } from "../config/multerConfig.js";

// arquivo de rotas para gerenciamento de usuários
const router = express.Router();

// 1 - Todas as rotas usam autenticação inicial
router.use(authMiddleware);

// 2 - Rota "Meu Perfil"
// Disponível para o próprio usuário autenticado independente da 'role' (cargo)
router.get("/me", getMe);
router.put(
  "/me",
  upload.single("imagem"), // permite envio de nova foto de perfil
  validateRequest({ required: ["nome", "email"] }),
  updateMe
);

// 3 - Lista otimizada apenas com id e nome dos usuários
// Usada em dropdowns/filtros; acessível apenas para perfis gerenciais
router.get("/names", permit("ADMIN", "GERENTE"), getUserNames);

// 4 - Barreira administrativa central
// Daqui para baixo, todas as rotas (CRUD completo) ficam restritas ao nível ADMIN
router.use(permit("ADMIN"));

// 5 - Rotas administrativas de gestão (Criação, listagem geral, consulta de terceiro, alteração, deleção)
router.post("/",
  upload.single("imagem"),
  validateRequest({ required: ['nome', 'email', 'senha', 'role'] }),
  createUser
);

router.get("/", listUsers);
router.get("/:id", getUser);

router.put("/:id",
  upload.single("imagem"),
  validateRequest({ required: ['nome', 'email', 'role'] }),
  updateUser
);

router.delete("/:id", deleteUser);

export default router;
