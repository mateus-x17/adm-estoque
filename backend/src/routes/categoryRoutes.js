import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createCategory,
  listCategories,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  countCategories,
} from "../controllers/categoryController.js";

// arquivo de rotas para o módulo de categorias do estabelecimento
const router = express.Router();

// 1 - Autenticação obrigatória com tenant e status ativo
router.use(authMiddleware);

// 2 - Rota para contagem de categorias ativas da loja
router.get("/count", countCategories);

// 3 - Rota para listagem geral de categorias da loja
router.get("/", listCategories);

// 4 - Rotas de criação e edição permitidas para ADMIN e GERENTE da loja
router.post("/", permit("ADMIN", "GERENTE"), validateRequest({ required: ['nome'] }), createCategory);
router.put("/:id", permit("ADMIN", "GERENTE"), validateRequest({ required: ['nome'] }), updateCategory);
router.patch("/:id/status", permit("ADMIN", "GERENTE"), validateRequest({ required: ['ativo'] }), toggleCategoryStatus);

// 5 - Rota de exclusão restrita ao perfil ADMIN da loja
router.delete("/:id", permit("ADMIN"), deleteCategory);

export default router;
