import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  listOrders,
  getOrder,
  createOrder,
  cancelOrder,
} from "../controllers/orderController.js";

// arquivo de roteamento para o módulo transacional de Multipedidos (Pedido + ItemPedido + Estorno)

const router = express.Router();

router.use(authMiddleware);

router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listOrders);
router.get("/:id", permit("ADMIN", "GERENTE", "OPERADOR"), getOrder);

router.post(
  "/",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  validateRequest({ required: ["tipo", "itens"] }),
  createOrder
);

// Cancelamento com estorno de estoque autorizado apenas para ADMIN da rede ou GERENTE da loja
router.post("/:id/cancel", permit("ADMIN", "GERENTE"), cancelOrder);

export default router;

