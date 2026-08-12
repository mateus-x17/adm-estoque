import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  criarFornecedor,
  listarFornecedores,
  atualizarFornecedor,
  deletarFornecedor,
  countFornecedores,
  getSupplierStats,
  obterFornecedor,
} from "../controllers/supplierController.js";

// arquivo de rotas para gestão de fornecedores
const router = express.Router();

// 1 - Estatísticas (Deve vir antes das rotas com :id para evitar conflito de roteamento)
router.get("/stats", authMiddleware, getSupplierStats);

// 2 - Rotas destrutivas e de alteração protegidas por RBAC (Apenas ADMIN e GERENTE)
router.post(
  "/",
  authMiddleware,
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome", "email", "telefone", "endereco"] }),
  criarFornecedor,
);

router.put(
  "/:id",
  authMiddleware,
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome", "email", "telefone", "endereco"] }),
  atualizarFornecedor,
);

router.delete(
  "/:id",
  authMiddleware,
  permit("ADMIN", "GERENTE"),
  deletarFornecedor,
);

// 3 - Rotas de leitura (livre para todos logados)
router.get("/", authMiddleware, listarFornecedores);
router.get("/count", authMiddleware, countFornecedores);
router.get("/:id", authMiddleware, obterFornecedor);

export default router;
