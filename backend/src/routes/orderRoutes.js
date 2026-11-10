import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { uploadComprovante } from "../config/multerConfig.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrderProof,
  cancelOrder,
} from "../controllers/orderController.js";

// arquivo de roteamento para o módulo transacional de Multipedidos (Pedido + ItemPedido + Comprovante + Estorno)

const router = express.Router();

// middleware auxiliar para desserializar itens enviados em FormData mantendo compatibilidade com JSON puro
// 1 - Quando a requisição envia comprovante via multipart/form-data, converte a string JSON de req.body.itens para array
function parseOrderMultipartBody(req, res, next) {
  if (typeof req.body?.itens === "string") {
    try {
      req.body.itens = JSON.parse(req.body.itens);
    } catch {
      req.body.itens = [];
    }
  }
  next();
}

router.use(authMiddleware);

router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listOrders);
router.get("/:id", permit("ADMIN", "GERENTE", "OPERADOR"), getOrder);

router.post(
  "/",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  uploadComprovante.single("comprovante"),
  parseOrderMultipartBody,
  validateRequest({ required: ["tipo", "itens"] }),
  createOrder
);

// Anexar ou confirmar comprovante/pagamento em pedido já lançado
router.patch(
  "/:id/proof",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  uploadComprovante.single("comprovante"),
  updateOrderProof
);

// Cancelamento com estorno de estoque autorizado apenas para ADMIN da rede ou GERENTE da loja
router.post("/:id/cancel", permit("ADMIN", "GERENTE"), cancelOrder);

export default router;

