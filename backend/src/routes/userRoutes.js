import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// apenas ADMIN pode gerenciar usuários
router.use(authMiddleware); //todas rotas usam esse middleware de autenticacao
router.use(permit("ADMIN")); //todas rotas usam o middleware permit que verifica o role

router.post("/", createUser);
router.get("/", listUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
