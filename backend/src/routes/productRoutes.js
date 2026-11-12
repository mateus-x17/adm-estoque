// arquivo responsável por definir as rotas protegidas de catálogo de produtos, importação/exportação de planilhas e ajuste de estoque.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, Multer (armazenamento em disco e memória), authMiddleware, roleMiddleware e validationMiddleware.
// usado por: index.js montado sob o prefixo /products.

// importações da biblioteca web: express provê o construtor Router para registro das rotas.
import express from "express";
// importações de upload: multer cria instâncias para processar uploads de planilhas em memória.
import multer from "multer";
// importações de caminho: path extrai a extensão do arquivo enviado para validação de tipo.
import path from "path";
// importações de autenticação: authMiddleware assegura a presença de sessão JWT e tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit bloqueia acessos a operações de escrita e planilhas por perfil.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest checa campos obrigatórios nos corpos das requisições.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações dos controladores: métodos responsáveis por executar operações sobre produtos.
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
// importações de upload em disco: upload processa fotos de produtos direcionando para a pasta uploads/produtos.
import { upload } from "../config/multerConfig.js";
// importações de erros: AppError emite status HTTP 400 em caso de extensão de planilha incompatível.
import { AppError } from "../utils/errorHandler.js";

// roteador Express para os endpoints de produtos
const router = express.Router();

// conjunto de MIME types oficiais e tolerados para upload de planilhas Excel e CSV
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
