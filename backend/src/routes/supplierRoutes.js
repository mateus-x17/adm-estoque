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
  obterFornecedor
} from "../controllers/supplierController.js";

const router = express.Router();

// 🔹 Estatísticas (Deve vir antes das rotas com :id)
router.get("/stats", authMiddleware, getSupplierStats);

// 🔹 Apenas ADMIN e GERENTE podem criar/editar/deletar fornecedores
router.post("/", 
  authMiddleware, 
  permit("ADMIN", "GERENTE"), 
  validateRequest({ required: ['nome', 'email', 'telefone', 'endereco'] }),
  criarFornecedor
);
router.put("/:id", 
  authMiddleware, 
  permit("ADMIN", "GERENTE"), 
  validateRequest({ required: ['nome', 'email', 'telefone', 'endereco'] }),
  atualizarFornecedor
);
router.delete("/:id", authMiddleware, permit("ADMIN", "GERENTE"), deletarFornecedor);

// 🔹 Todos podem listar fornecedores
router.get("/:id", authMiddleware, obterFornecedor);
router.get("/", authMiddleware, listarFornecedores);
// contagem de fornecedores
router.get("/count", authMiddleware, countFornecedores);

export default router;
