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
} from "../controllers/userController.js";
import { upload } from "../config/multerConfig.js";

const router = express.Router();

// apenas ADMIN pode gerenciar usuários
router.use(authMiddleware); //todas rotas usam esse middleware de autenticacao

// usuário logado (qualquer role autenticada)
router.get("/me", getMe);
router.put(
  "/me",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email"] }),
  updateMe
);

// apenas ADMIN pode gerenciar usuários (CRUD)
router.use(permit("ADMIN"));

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
