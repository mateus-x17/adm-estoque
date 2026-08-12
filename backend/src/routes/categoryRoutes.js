import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { createCategory, listCategories, updateCategory, deleteCategory, countCategories } from "../controllers/categoryController.js";

// arquivo de rotas para o módulo de categorias
const router = express.Router();

// 1 - Aplica o middleware de autenticação em TODAS as rotas deste arquivo
// Qualquer requisição sem token válido parará aqui
router.use(authMiddleware);

// 2 - Rota para contagem (/count)
// Declarada ANTES da rota /:id para evitar colisão (onde "count" seria interpretado como um ID)
router.get("/count", countCategories);

// 3 - Rota para listagem geral (livre para todos autenticados)
router.get("/", listCategories);

// 4 - Rotas de criação e edição (/ e /:id) protegidas por RBAC (Role-Based Access Control)
// Apenas ADMIN e GERENTE podem acessar, e o corpo deve ter 'nome'
router.post("/", permit("ADMIN", "GERENTE"), validateRequest({ required: ['nome'] }), createCategory);
router.put("/:id", permit("ADMIN", "GERENTE"), validateRequest({ required: ['nome'] }), updateCategory);

// 5 - Rota de deleção é a mais restrita, permitida APENAS para ADMIN
router.delete("/:id", permit("ADMIN"), deleteCategory);

export default router;
