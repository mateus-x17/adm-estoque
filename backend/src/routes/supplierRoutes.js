import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import {
  criarFornecedor,
  listarFornecedores,
  atualizarFornecedor,
  deletarFornecedor,
} from "../controllers/supplierController.js";

const router = express.Router();

// 🔹 Apenas ADMIN e GERENTE podem criar/editar/deletar fornecedores
router.post("/", authMiddleware, permit("ADMIN", "GERENTE"), criarFornecedor);
router.put("/:id", authMiddleware, permit("ADMIN", "GERENTE"), atualizarFornecedor);
router.delete("/:id", authMiddleware, permit("ADMIN", "GERENTE"), deletarFornecedor);

// 🔹 Todos podem listar fornecedores
router.get("/", authMiddleware, listarFornecedores);

export default router;
