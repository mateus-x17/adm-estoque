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

  // função para criar um pedido multi-item atômico (VENDA ou REPOSICAO) com suporte a FormData (comprovante anexo) ou JSON
  // 1 - Injeta cabeçalho Idempotency-Key quando fornecido
  // 2 - Utiliza postFormData quando payload for FormData para preservar envio de arquivo comprovante
  createOrder: async (orderData, idempotencyKey = null) => {
    const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
    if (orderData instanceof FormData) {
      return apiClient.postFormData("/orders", orderData, headers);
    }
    return apiClient.post("/orders", orderData, Object.keys(headers).length ? { headers } : {});
  },

  // função para anexar ou atualizar comprovante de pagamento/recebimento de um pedido existente
  // 1 - Aceita FormData (arquivo + campos) ou JSON enviando via PATCH /orders/:id/proof
  updateOrderProof: async (id, proofData) => {
    if (proofData instanceof FormData) {
      return apiClient.patchFormData(`/orders/${id}/proof`, proofData);
    }
    return apiClient.patch(`/orders/${id}/proof`, proofData);
  },

  // função para cancelar um pedido concluído e estornar o estoque (ADMIN e GERENTE)
  // 1 - Envia POST /orders/:id/cancel com justificativa opcional
  cancelOrder: async (id, motivo = "") =>
    apiClient.post(`/orders/${id}/cancel`, { motivo }),
};
