import { childLogger } from "../config/logger.js";
import * as orderService from "../services/orderService.js";
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
const log = childLogger("orderController");

// arquivo responsável por controlar requisições HTTP do módulo de Multipedidos e estorno de estoque

// função para listar pedidos multi-item respeitando Organização, Loja e RBAC
// 1 - Resolve o escopo de leitura da Organização/Loja conforme papel e filtro X-Loja-Id
// 2 - Encaminha filtros (busca por código, vendedor ou antigo vendedorRefId) para paginação
export async function listOrders(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const result = await orderService.listOrdersPaginated(req.query, scope, req.user);
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao listar pedidos");
    next(err);
  }
}

// função para consultar detalhes de um pedido específico e seus itens
// 1 - Resolve o escopo multi-tenant e impõe sigilo para OPERADOR no serviço
// 2 - Retorna itens congelados e movimentos vinculados ao pedido
export async function getOrder(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const order = await orderService.getOrderById(req.params.id, scope, req.user);
    res.json(order);
  } catch (err) {
    log.error({ err }, "Erro ao buscar detalhes do pedido");
    next(err);
  }
}

// função para criar um pedido multi-item com baixa/reposição atômica na loja alvo
// 1 - Valida a loja destino de gravação e extrai eventual Idempotency-Key do header ou payload
// 2 - Executa criação atômica dos itens, snapshots e livro-razão retornando 201 Created
export async function createOrder(req, res, next) {
  try {
    const storeScope = await resolveWriteStore(req, req.body?.lojaId);
    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body?.idempotencyKey;

    const order = await orderService.createOrder(
      req.body,
      req.user,
      storeScope,
      idempotencyKey
    );

    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_ORDER",
        orderId: order.id,
        codigo: order.codigo,
        valorTotal: order.valorTotal,
      },
      "Pedido multi-item criado com sucesso"
    );

    res.status(201).json(order);
  } catch (err) {
    log.warn({ err }, "Erro ao criar pedido multi-item");
    next(err);
  }
}

// função para cancelar um pedido e estornar os saldos de estoque (permitida para ADMIN e GERENTE)
// 1 - Valida escopo da Organização/Loja do gestor solicitante
// 2 - Aciona estorno transacional com criação de contrapartidas estorno = true
export async function cancelOrder(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const updatedOrder = await orderService.cancelOrder(
      req.params.id,
      req.body?.motivo,
      scope,
      req.user
    );

    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "CANCEL_ORDER",
        orderId: updatedOrder.id,
        codigo: updatedOrder.codigo,
      },
      "Pedido cancelado e estoque estornado"
    );

    res.json(updatedOrder);
  } catch (err) {
    log.warn({ err }, "Erro ao cancelar pedido");
    next(err);
  }
}
