import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  criarFornecedor,
  listarFornecedores,
  atualizarFornecedor,
  toggleFornecedorStatus,
  deletarFornecedor,
  countFornecedores,
  getSupplierStats,
  obterFornecedor,
} from "../controllers/supplierController.js";

// arquivo de rotas para gestão de fornecedores isolados por estabelecimento
const router = express.Router();

// 1 - Autenticação obrigatória com validação de usuário/estabelecimento ativo e injeção de tenant
router.use(authMiddleware);

// 2 - Estatísticas agregadas (Deve vir antes das rotas dinâmicas com :id para evitar conflito de roteamento)
router.get("/stats", getSupplierStats);

// 3 - Rotas de leitura acessíveis por colaboradores autenticados da loja
router.get("/", listarFornecedores);
router.get("/count", countFornecedores);
router.get("/:id", obterFornecedor);

// 4 - Rotas de criação, edição e ativação/inativação lógica (ADMIN e GERENTE)
router.post(
  "/",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome"] }),
  criarFornecedor,
);

router.put(
  "/:id",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome"] }),
  atualizarFornecedor,
);

router.patch(
  "/:id/status",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["ativo"] }),
  toggleFornecedorStatus,
);

// 5 - Rota de exclusão definitiva ou Soft Delete restrita exclusivamente ao ADMIN do estabelecimento
router.delete(
  "/:id",
  permit("ADMIN"),
  deletarFornecedor,
);

export default router;
