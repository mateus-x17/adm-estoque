import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  transferUserStore,
  changeUserSituation,
  deleteUser,
  getMe,
  updateMe,
  getUserNames,
} from "../controllers/userController.js";
import { upload } from "../config/multerConfig.js";

// arquivo de rotas para gestão de colaboradores e transferência entre lojas da Organização

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMe);
router.put(
  "/me",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email"] }),
  updateMe
);

// Lista otimizada de vendedores para filtros/selects (vedada ao OPERADOR por sigilo)
router.get("/names", permit("ADMIN", "GERENTE"), getUserNames);

// Gestão completa de equipe exclusiva do ADMIN da Organização
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

// Transferência rápida de Gerente ou Operador para outra filial da rede
router.patch("/:id/store", validateRequest({ required: ["lojaId"] }), transferUserStore);

// Alteração de situação trabalhista do funcionário (ATIVO, SUSPENSO, FERIAS)
router.patch("/:id/situation", validateRequest({ required: ["situacao"] }), changeUserSituation);

// Exclusão definitiva (demissão / cancelamento de matrícula) gerando relatório final e mantendo snapshots
router.delete("/:id", deleteUser);

export default router;
