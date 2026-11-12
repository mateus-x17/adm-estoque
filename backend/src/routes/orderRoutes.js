// arquivo responsável por definir as rotas protegidas do módulo transacional de Multipedidos (Pedidos, Itens, Comprovantes e Cancelamento com Estorno).
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, Multer, authMiddleware e roleMiddleware (permit).
// usado por: index.js montado sob o prefixo /orders.

// importações da biblioteca web: express provê o construtor Router para declaração de rotas HTTP.
import express from "express";
// importações de autenticação: authMiddleware valida a sessão JWT e o tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit bloqueia operações restritas conforme o papel do usuário.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest garante presença de campos obrigatórios no payload.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações de upload: uploadComprovante intercepta arquivos de comprovante em imagem ou PDF.
import { uploadComprovante } from "../config/multerConfig.js";
// importações dos controladores: métodos responsáveis por processar pedidos e estornos.
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrderProof,
  cancelOrder,
} from "../controllers/orderController.js";

// roteador Express para os endpoints de pedidos
const router = express.Router();

// função responsável por desserializar a lista de itens recebida como string JSON em requisições multipart/form-data.
//
// contexto: middleware auxiliar executado antes de createOrder quando o formulário envia comprovante de pagamento junto dos itens do pedido.
//
// parâmetros:
//   - req (Request, obrigatório): requisição Express cujo req.body.itens pode vir serializado em JSON.
//   - res (Response, obrigatório): resposta HTTP do Express.
//   - next (NextFunction, obrigatório): função para prosseguir a cadeia de execução.
//
// retorno: nenhum (chama next()).
// erros: nenhum (trata falha de parsing atribuindo array vazio).
// efeitos colaterais: altera req.body.itens convertendo a string para array de objetos.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - verifica se req.body.itens é uma string.
// 3 - tenta executar JSON.parse em req.body.itens; caso falhe no bloco catch, atribui array vazio.
// 4 - chama next() liberando o fluxo da requisição.
function parseOrderMultipartBody(req, res, next) {
  // 2 e 3 - converte string JSON em array
  if (typeof req.body?.itens === "string") {
    try {
      req.body.itens = JSON.parse(req.body.itens);
    } catch {
      req.body.itens = [];
    }
  }
  // 4 - prossegue
  next();
}

// 1 - Autenticação obrigatória com tenant e status ativo
router.use(authMiddleware);

// 2 - Listagem paginada de pedidos e consulta de pedido individual
router.get("/", permit("ADMIN", "GERENTE", "OPERADOR"), listOrders);
router.get("/:id", permit("ADMIN", "GERENTE", "OPERADOR"), getOrder);

// 3 - Criação atômica de pedido com suporte a múltiplos itens e upload opcional de comprovante
router.post(
  "/",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  uploadComprovante.single("comprovante"),
  parseOrderMultipartBody,
  validateRequest({ required: ["tipo", "itens"] }),
  createOrder
);

// 4 - Anexar ou atualizar comprovante de pagamento em pedido existente
router.patch(
  "/:id/proof",
  permit("ADMIN", "GERENTE", "OPERADOR"),
  uploadComprovante.single("comprovante"),
  updateOrderProof
);

// 5 - Cancelamento de pedido com estorno de estoque (exclusivo para ADMIN da rede ou GERENTE da loja)
router.post("/:id/cancel", permit("ADMIN", "GERENTE"), cancelOrder);

export default router;
