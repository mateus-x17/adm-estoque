// arquivo responsável por definir as rotas protegidas de gestão de fornecedores isolados por Organização e Loja.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, authMiddleware, roleMiddleware (permit) e validationMiddleware.
// usado por: index.js montado sob o prefixo /suppliers.

// importações da biblioteca web: express provê o construtor Router para registro das rotas.
import express from "express";
// importações de autenticação: authMiddleware valida a sessão JWT e o tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit restringe mutações a ADMIN e GERENTE e exclusões ao ADMIN.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest checa a existência dos campos obrigatórios no body.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações dos controladores: métodos responsáveis por processar cadastros e métricas de fornecedores.
import {
  criarFornecedor,
  listarFornecedores,
  atualizarFornecedor,
  toggleFornecedorStatus,
  deletarFornecedor,
  countFornecedores,
  getSupplierStats,
  obterFornecedor,
} from "../controllers/supplierController.js";

// roteador Express para os endpoints de fornecedores
const router = express.Router();

// 1 - Autenticação obrigatória com validação de usuário/estabelecimento ativo e injeção de tenant
router.use(authMiddleware);

// 2 - Estatísticas agregadas (declarada antes das rotas dinâmicas com :id para evitar conflito de roteamento)
router.get("/stats", getSupplierStats);

// 3 - Rotas de leitura acessíveis por colaboradores autenticados da loja
router.get("/", listarFornecedores);
router.get("/count", countFornecedores);
router.get("/:id", obterFornecedor);

// 4 - Rotas de criação, edição e ativação/inativação lógica (ADMIN e GERENTE)
router.post(
  "/",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome"] }),
  criarFornecedor,
);

router.put(
  "/:id",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["nome"] }),
  atualizarFornecedor,
);

router.patch(
  "/:id/status",
  permit("ADMIN", "GERENTE"),
  validateRequest({ required: ["ativo"] }),
  toggleFornecedorStatus,
);

// 5 - Rota de exclusão definitiva ou Soft Delete restrita exclusivamente ao ADMIN do estabelecimento
router.delete(
  "/:id",
  permit("ADMIN"),
  deletarFornecedor,
);

export default router;
