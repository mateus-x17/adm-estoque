import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustQuantity,
  countProducts,
  getProductStats
} from "../controllers/productController.js";
import { upload } from "../config/multerConfig.js";

// arquivo de roteamento de produtos
const router = express.Router();

// 1 - Autenticação requerida em todas as rotas
router.use(authMiddleware);

// 2 - Rotas de dados agregados (estatísticas e contagem)
// Devem ser declaradas antes das rotas com parâmetro dinâmico (/:id) para que o express não confunda "count" com um ID de produto.
router.get("/count", countProducts);
router.get("/stats", getProductStats);

// 3 - Rotas de consulta geral (leitura)
// Acessíveis por todos os usuários autenticados
router.get("/", listProducts);
router.get("/:id", getProduct);

// 4 - Rotas de alteração de catálogo (criar, atualizar, excluir)
// Reservadas apenas para ADMIN e GERENTE
// Utiliza upload.single("imagem") fornecido pelo multer para lidar com o parsing do multipart/form-data e salvar o arquivo no servidor
router.post("/", 
  permit("ADMIN", "GERENTE"), 
  upload.single("imagem"), 
  validateRequest({ required: ['nome', 'preco', 'quantidade', 'categoriaId'] }),
  createProduct
);

router.put("/:id", 
  permit("ADMIN", "GERENTE"), 
  upload.single("imagem"), 
  validateRequest({ required: ['nome', 'preco', 'quantidade', 'categoriaId'] }),
  updateProduct
);

router.delete("/:id", permit("ADMIN"), deleteProduct);

// 5 - Rota especializada para movimentação de estoque
// Além da gerência, OPERADORES também podem acessar esta rota específica
// Exige validação de que os campos "quantidade" e "tipo" (REPOSICAO/VENDA) foram enviados
router.post("/:id/adjust", 
  permit("ADMIN", "GERENTE", "OPERADOR"),
  validateRequest({ required: ['quantidade', 'tipo'] }),
  adjustQuantity
);

export default router;
