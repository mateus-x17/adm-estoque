// arquivo responsável por definir as rotas protegidas para gestão de categorias de produtos isoladas por Organização e Loja.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, authMiddleware, roleMiddleware (permit) e validationMiddleware.
// usado por: index.js montado sob o prefixo /categories.

// importações da biblioteca web: express provê o construtor Router para registro dos endpoints.
import express from "express";
// importações de autenticação: authMiddleware assegura a presença e validade do token JWT e o tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit bloqueia o acesso para perfis que não possuam os papéis exigidos.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest checa a existência dos campos obrigatórios no corpo da requisição.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações dos controladores: métodos responsáveis por responder às operações de categorias.
import {
  createCategory,
  listCategories,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  countCategories,
} from "../controllers/categoryController.js";

// roteador Express para os endpoints de categorias
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
