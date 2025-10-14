import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustQuantity,
  countProducts
} from "../controllers/productController.js";
import { upload } from "../config/multerConfig.js";

const router = express.Router();

router.use(authMiddleware);

// obter numero de produtos
// - deve ficar acima das rotas de listagem de produtos para ser executada primeiro e evitar problemas de concorrencia
router.get("/count", countProducts);
// listagem e obtençaõ de produtos especificos
router.get("/", listProducts);
router.get("/:id", getProduct);


// criar/editar/delete -> gerentes e admins
router.post("/", permit("ADMIN","GERENTE"), upload.single("imagem"), createProduct);
router.put("/:id", permit("ADMIN","GERENTE"), upload.single("imagem"), updateProduct);
router.delete("/:id", permit("ADMIN"), deleteProduct);

// ajustar quantidade -> gerentes e operadores (dependendo da regra)
router.post("/:id/adjust", permit("ADMIN","GERENTE","OPERADOR"), adjustQuantity);

export default router;
