// arquivo responsável por definir as rotas protegidas de extrato unitário de movimentações, relatórios de vendas e desempenho de vendedores.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, authMiddleware e roleMiddleware (permit).
// usado por: index.js montado sob o prefixo /movements.

// importações da biblioteca web: express provê o construtor Router para registro das rotas.
import express from "express";
// importações de autenticação: authMiddleware valida a sessão JWT e o tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit restringe relatórios globais a ADMIN e GERENTE e libera extrato próprio ao OPERADOR.
import { permit } from "../middlewares/roleMiddleware.js";
// importações dos controladores: métodos de consulta e agregação de movimentações.
import {
  listMovements,
  getUserStats,
  getSalesReport,
  getPerformanceRanking,
  getPerformanceDetail,
} from "../controllers/movementController.js";

// roteador Express para os endpoints de movimentações
const router = express.Router();

// 1 - Autenticação obrigatória com tenant e status ativo
router.use(authMiddleware);

// 2 - Relatório executivo de vendas (ADMIN escolhe rede/loja; GERENTE vê sua loja; OPERADOR vê apenas suas vendas)
router.get("/sales-report", permit("ADMIN", "GERENTE", "OPERADOR"), getSalesReport);

// 3 - Ranking de vendedores do melhor ao pior e raio-X detalhado de desempenho (ADMIN e GERENTE)
router.get("/performance", permit("ADMIN", "GERENTE"), getPerformanceRanking);
router.get("/performance/:refId", permit("ADMIN", "GERENTE"), getPerformanceDetail);

// 4 - Estatísticas agregadas de vendas por vendedor no Dashboard (vedado ao OPERADOR)
router.get("/user-stats", permit("ADMIN", "GERENTE"), getUserStats);

// 5 - Listagem paginada do extrato unitário de movimentações de estoque
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listMovements);

export default router;
