// arquivo responsável por definir as rotas protegidas de gestão de Lojas e filiais de cada Organização.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, authMiddleware, roleMiddleware (permit) e validationMiddleware.
// usado por: index.js montado sob o prefixo /stores.

// importações da biblioteca web: express provê o construtor Router para registro das rotas.
import express from "express";
// importações de autenticação: authMiddleware valida a sessão JWT e a organização do usuário logado.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit restringe ações de criação, edição e exclusão de lojas ao ADMIN.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest garante campos obrigatórios no corpo das requisições.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações dos controladores: métodos responsáveis por gerenciar o ciclo de vida das lojas.
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
} from "../controllers/storeController.js";

// roteador Express para os endpoints de lojas
const router = express.Router();

// 1 - Autenticação obrigatória com tenant e status ativo
router.use(authMiddleware);

// 2 - Leitura de lojas (ADMIN vê todas da rede; GERENTE e OPERADOR veem apenas sua filial)
router.get("/", listStores);
router.get("/:id", getStore);

// 3 - Governança e escrita de lojas restritas ao papel ADMIN da organização
router.use(permit("ADMIN"));

router.post("/", validateRequest({ required: ["nome"] }), createStore);
router.put("/:id", validateRequest({ required: ["nome"] }), updateStore);
router.patch("/:id/status", validateRequest({ required: ["ativo"] }), toggleStoreStatus);
router.delete("/:id", deleteStore);

export default router;
