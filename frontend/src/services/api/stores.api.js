import { apiClient } from "./apiClient.js";

// arquivo responsável pelas chamadas HTTP do módulo de Lojas/Filiais da Organização

export const storesApi = {
  // função para listar lojas da Organização (ADMIN vê todas; equipe vê apenas a própria loja)
  // 1 - Consulta GET /stores com filtro de status e normaliza resposta em array
  getStores: async (status = "todos") => {
    const response = await apiClient.get(`/stores?status=${status}`);
    return Array.isArray(response) ? response : response.data || [];
  },

  // função para obter detalhes de uma loja específica
  // 1 - Consulta GET /stores/:id com contadores vinculados
  getStoreById: async (id) => apiClient.get(`/stores/${id}`),

  // função exclusiva de ADMIN para criar nova loja/filial na rede
  // 1 - Envia payload cadastral via POST /stores
  createStore: async (storeData) => apiClient.post("/stores", storeData),

  // função exclusiva de ADMIN para editar dados cadastrais de uma loja
  // 1 - Atualiza nome, slug e dados operacionais via PUT /stores/:id
  updateStore: async (id, storeData) => apiClient.put(`/stores/${id}`, storeData),

  // função exclusiva de ADMIN para inativar ou reativar logicamente uma loja
  // 1 - Envia PATCH /stores/:id/status atualizando flag ativo
  toggleStoreStatus: async (id, ativo) => apiClient.patch(`/stores/${id}/status`, { ativo }),

  // função exclusiva de ADMIN para excluir (ou inativar caso possua histórico) uma loja
  // 1 - Dispara DELETE /stores/:id com fallback automático de Soft Delete no servidor
  deleteStore: async (id) => apiClient.delete(`/stores/${id}`),
};
