import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { listMovements, getUserStats, getSalesReport } from "../controllers/movementController.js";

// arquivo de rotas para leitura de movimentações e relatórios de vendas isolados por estabelecimento

const router = express.Router();

// 1 - Protege todas as rotas exigindo token JWT ativo e verificação de empresa/usuário ativo
router.use(authMiddleware);

// 2 - Rota de relatório consolidado de vendas (/sales-report)
// GERENTE e ADMIN visualizam as vendas de toda a loja; OPERADOR visualiza apenas suas próprias vendas
router.get("/sales-report", permit("ADMIN", "GERENTE", "OPERADOR"), getSalesReport);

// 3 - Rota estatística /user-stats (restrita a ADMIN e GERENTE; bloqueada para OPERADOR por regra de sigilo entre vendedores)
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);

// 4 - Rota base de listagem de histórico com paginação
// OPERADOR recebe exclusivamente seus próprios registros; GERENTE e ADMIN enxergam todo o estabelecimento
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements);

export default router;
