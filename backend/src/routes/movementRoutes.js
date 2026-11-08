import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { listMovements, getUserStats, getSalesReport } from "../controllers/movementController.js";

// arquivo de rotas para leitura de movimentações e relatórios de auditoria
// 1 - Inicializa o roteador do Express
const router = express.Router();

// 2 - Protege todas as rotas exigindo token JWT de sessão ativa
router.use(authMiddleware);

// 3 - Rota de relatório executivo consolidado de vendas (/sales-report)
// Retorna totais de vendas no último mês (1m), 6 meses (6m) e 1 ano (1y) com timeline para gráficos e PDF
router.get("/sales-report", permit("ADMIN", "GERENTE", "OPERADOR"), getSalesReport);

// 4 - Rota estatística /user-stats
// Permite que apenas cargos gerenciais e administradores acessem o relatório financeiro consolidado
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);

// 5 - Rota base de listagem de histórico
// Todos podem visualizar o histórico de movimentações com filtros e paginação
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements);

export default router;
