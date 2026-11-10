import { apiClient } from "./apiClient.js";

// arquivo responsável pelas chamadas HTTP do módulo de Multipedidos e estorno transacional

export const ordersApi = {
  // função para listar pedidos multi-item com suporte a paginação e busca por código/vendedor/ID antigo
  // 1 - Remove parâmetros vazios e serializa query string para GET /orders
  getOrders: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return apiClient.get(qs ? `/orders?${qs}` : "/orders");
  },

  // função para obter detalhes completos de um pedido incluindo itens e movimentos vinculados
  // 1 - Solicita GET /orders/:id com cabeçalho X-Loja-Id automático do apiClient
  getOrderById: async (id) => apiClient.get(`/orders/${id}`),

  // função para criar um pedido multi-item atômico (VENDA ou REPOSICAO)
  // 1 - Injeta cabeçalho Idempotency-Key quando fornecido e envia itens no payload POST /orders
  createOrder: async (orderData, idempotencyKey = null) =>
    apiClient.post(
      "/orders",
      orderData,
      idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}
    ),

  // função para cancelar um pedido concluído e estornar o estoque (ADMIN e GERENTE)
  // 1 - Envia POST /orders/:id/cancel com justificativa opcional
  cancelOrder: async (id, motivo = "") =>
    apiClient.post(`/orders/${id}/cancel`, { motivo }),
};
