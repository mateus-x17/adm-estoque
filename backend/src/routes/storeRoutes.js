import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
} from "../controllers/storeController.js";

// arquivo de rotas para gestão de Lojas (unidades/filiais) da Organização

const router = express.Router();

router.use(authMiddleware);

// Leitura acessível para montar contexto da loja (ADMIN vê todas da rede; demais veem apenas a própria)
router.get("/", listStores);
router.get("/:id", getStore);

// Escrita e governança restritas ao ADMIN da Organização
router.use(permit("ADMIN"));

router.post("/", validateRequest({ required: ["nome"] }), createStore);
router.put("/:id", validateRequest({ required: ["nome"] }), updateStore);
router.patch("/:id/status", validateRequest({ required: ["ativo"] }), toggleStoreStatus);
router.delete("/:id", deleteStore);

export default router;

