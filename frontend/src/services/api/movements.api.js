import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de movimentações unitárias, relatórios e desempenho de vendedores

export const movementsApi = {
  // função para listar movimentações unitárias (extrato) aceitando busca por vendedorRefId (antigo ID) e filtros
  getMovements: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/movements?${queryString}` : "/movements";
    const response = await apiClient.get(endpoint);

    if (Object.keys(cleanParams).length > 0) return response;
    return response.data || response;
  },

  // função para estatísticas consolidadas por vendedor no Dashboard (ADMIN e GERENTE)
  getUserStats: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/movements/user-stats?${queryString}` : "/movements/user-stats";
    const response = await apiClient.get(endpoint);
    return response.data || response;
  },

  // função para gerar relatório consolidado de vendas (1m, 6m, 1y) com ranking de vendedores e fornecedores
  getSalesReport: async (period = "1m") => {
    const response = await apiClient.get(`/movements/sales-report?period=${period}`);
    return response.data || response;
  },

  // função para obter o ranking completo de vendedores do melhor ao pior (ativos e excluídos pelo antigo ID)
  getPerformanceRanking: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return apiClient.get(qs ? `/movements/performance?${qs}` : "/movements/performance");
  },

  // função para consultar o raio-X detalhado (1m, 6m, 1y e pedidos) de um vendedor ativo ou excluído por ID
  getSellerPerformanceDetail: async (refId) => apiClient.get(`/movements/performance/${refId}`),
};
