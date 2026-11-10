import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import {
  listMovements,
  getUserStats,
  getSalesReport,
  getPerformanceRanking,
  getPerformanceDetail,
} from "../controllers/movementController.js";

// arquivo de rotas para extrato unitário de movimentações, relatórios de vendas e desempenho de vendedores

const router = express.Router();

router.use(authMiddleware);

// Relatório executivo (ADMIN escolhe rede/loja; GERENTE vê sua loja; OPERADOR vê apenas suas vendas)
router.get("/sales-report", permit("ADMIN", "GERENTE", "OPERADOR"), getSalesReport);

// Ranking do melhor ao pior vendedor e raio-X individual (incluindo busca por ID antigo de ex-funcionários)
router.get("/performance", permit("ADMIN", "GERENTE"), getPerformanceRanking);
router.get("/performance/:refId", permit("ADMIN", "GERENTE"), getPerformanceDetail);

// Estatísticas agregadas de vendas por vendedor no Dashboard (vedado ao OPERADOR)
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);

// Listagem paginada do extrato item a item (OPERADOR recebe estritamente seus registros)
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements);

export default router;
