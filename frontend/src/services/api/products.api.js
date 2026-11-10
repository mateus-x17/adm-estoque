import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de produtos, soft delete e planilhas .xlsx/.csv

export const productsApi = {
  // função para listar produtos da loja com suporte a busca, categoria, ordenação, status e paginação
  getProducts: async (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/products?${queryString}` : "/products";
    const response = await apiClient.get(endpoint);

    if (Object.keys(cleanParams).length > 0) {
      return response;
    }
    return response.data || response;
  },

  // função para obter estatísticas de produtos ativos e patrimônio total da loja
  getProductStats: async () => {
    const response = await apiClient.get("/products/stats");
    return response.data || response;
  },

  // função para criar um novo produto
  createProduct: (productData) => apiClient.post("/products", productData),

  // função para atualizar um produto existente
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),

  // função para inativar ou reativar logicamente um produto (Soft Delete)
  toggleProductStatus: (id, ativo) =>
    apiClient.patch(`/products/${id}/status`, { ativo }),

  // função para excluir definitivamente ou aplicar Soft Delete automático em um produto
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),

  // função para exportar catálogo em planilha (.xlsx ou .csv) via download autenticado
  // 1 - Requisita blob ao endpoint GET /products/export passando format e status
  // 2 - Retorna { blob, filename } pronto para acionar download no navegador
  exportProducts: (format = "xlsx", status = "ativos") =>
    apiClient.downloadBlob(`/products/export?format=${format}&status=${status}`),

  // função para baixar planilha modelo de importação (.xlsx ou .csv)
  downloadImportTemplate: (format = "xlsx") =>
    apiClient.downloadBlob(`/products/import/template?format=${format}`),

  // função para pré-validar ('preview') ou efetivar ('commit') importação em lote via planilha
  // 1 - Monta FormData com o arquivo selecionado e o modo de execução
  // 2 - Envia via postFormData para POST /products/import
  importProducts: (file, mode = "commit") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    return apiClient.postFormData(`/products/import?mode=${mode}`, formData);
  },
};
