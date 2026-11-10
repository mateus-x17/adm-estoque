import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de gestão de fornecedores do estabelecimento

export const suppliersApi = {
  // função para listar fornecedores da loja com filtro opcional de status ('ativos', 'inativos', 'todos')
  getSuppliers: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
    const response = await apiClient.get(qs ? `/suppliers?${qs}` : "/suppliers");
    return response.data || response;
  },

  // função para contar fornecedores ativos da loja
  getSuppliersCount: async () => {
    const response = await apiClient.get("/suppliers/count");
    return response.data || response;
  },

  // função para obter estatísticas agregadas de movimentação por fornecedor
  getSupplierStats: async () => {
    const response = await apiClient.get("/suppliers/stats");
    return response.data || response;
  },

  // função para criar novo fornecedor
  createSupplier: (supplierData) => apiClient.post("/suppliers", supplierData),

  // função para inativar ou reativar logicamente um fornecedor (Soft Delete)
  toggleSupplierStatus: (id, ativo) =>
    apiClient.patch(`/suppliers/${id}/status`, { ativo }),

  // função para excluir ou inativar logicamente um fornecedor
  deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),
};
