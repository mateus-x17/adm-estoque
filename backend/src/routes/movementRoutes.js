import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { listMovements, getUserStats } from "../controllers/movementController.js";

const router = express.Router();
router.use(authMiddleware); //todas rotas usam esse middleware de autenticacao

// count above list
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements); // histórico (só gerentes/admin) usa o middleware permit que verifica o role
export default router;
