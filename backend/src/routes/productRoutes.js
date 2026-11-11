import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { permit } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  adjustQuantity,
  countProducts,
  getProductStats,
  exportProducts,
  downloadImportTemplate,
  importProducts,
} from "../controllers/productController.js";
import { upload } from "../config/multerConfig.js";
import { AppError } from "../utils/errorHandler.js";

// arquivo de roteamento de produtos, planilhas em lote e movimentações de estoque por tenant

const router = express.Router();

const ALLOWED_SPREADSHEET_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/octet-stream",
]);

// 1 - Configuração dedicada do Multer em memória para recebimento seguro de planilhas (.xlsx e .csv, máximo 2MB)
const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();
    if ([".xlsx", ".csv"].includes(ext) && (!mime || ALLOWED_SPREADSHEET_MIMES.has(mime))) {
      cb(null, true);
    } else {
      cb(new AppError("Formato inválido. Apenas arquivos .xlsx ou .csv são aceitos.", 400));
    }
  },
});

// 2 - Autenticação obrigatória com validação de tenant e status ativo
router.use(authMiddleware);

// 3 - Rotas agregadas e de planilhas (declaradas obrigatoriamente antes de /:id para evitar conflito de rotas)
router.get("/count", countProducts);
router.get("/stats", getProductStats);
router.get("/export", permit("ADMIN", "GERENTE"), exportProducts);
router.get("/import/template", permit("ADMIN", "GERENTE"), downloadImportTemplate);
router.post(
  "/import",
  permit("ADMIN", "GERENTE"),
  uploadSpreadsheet.single("file"),
  importProducts
);

// 4 - Rotas de consulta geral (leitura restrita à loja autenticada)
router.get("/", listProducts);
router.get("/:id", getProduct);

// 5 - Rotas de alteração de catálogo (criação, edição e Soft Delete restritos a ADMIN e GERENTE)
router.post(
  "/",
  permit("ADMIN", "GERENTE"),
  upload.single("imagem"),
  validateRequest({ required: ["nome", "preco", "quantidade"] }),
  createProduct
);

router.put(
  "/:id",
  permit("ADMIN", "GERENTE"),
  upload.single("imagem"),
  validateRequest({ required: ["nome", "preco", "quantidade"] }),
  updateProduct
);

router.patch(
  "/:id/status",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["ativo"] }),
  toggleProductStatus
);

// 6 - Rota de exclusão definitiva ou Soft Delete restrita exclusivamente ao ADMIN do estabelecimento
router.delete("/:id", permit("ADMIN"), deleteProduct);

// 7 - Rota especializada para movimentação de estoque (acessível por ADMIN, GERENTE e OPERADOR da loja)
router.post(
  "/:id/adjust",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  validateRequest({ required: ["quantidade", "tipo"] }),
  adjustQuantity
);

export default router;
