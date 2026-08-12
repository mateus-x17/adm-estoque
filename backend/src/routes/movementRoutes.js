import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { listMovements, getUserStats } from "../controllers/movementController.js";

// arquivo de rotas para leitura de movimentações
const router = express.Router();

// 1 - Protege todas as rotas exigindo token JWT
router.use(authMiddleware);

// 2 - Rota estatística /user-stats
// Permite que apenas cargos gerenciais e administradores acessem o relatório financeiro consolidado
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);

// 3 - Rota base de listagem de histórico
// Todos podem visualizar o histórico (com o parâmetro do permit explícito para documentação, mas que engloba todos os níveis ativos)
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements);

export default router;
