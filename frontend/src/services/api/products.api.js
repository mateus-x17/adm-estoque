import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de produtos, soft delete e planilhas .xlsx/.csv

export const productsApi = {
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

    if (Object.keys(cleanParams).length > 0) return response;
    return response.data || response;
  },

  getProductStats: async () => {
    const response = await apiClient.get("/products/stats");
    return response.data || response;
  },

  createProduct: (productData) => apiClient.post("/products", productData),

  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),

  toggleProductStatus: (id, ativo) => apiClient.patch(`/products/${id}/status`, { ativo }),

  deleteProduct: (id) => apiClient.delete(`/products/${id}`),

  exportProducts: (format = "xlsx", status = "ativos") =>
    apiClient.downloadBlob(`/products/export?format=${format}&status=${status}`),

  downloadImportTemplate: (format = "xlsx") =>
    apiClient.downloadBlob(`/products/import/template?format=${format}`),

  importProducts: (file, mode = "commit", targetLojaId = null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (targetLojaId) formData.append("lojaId", String(targetLojaId));
    return apiClient.postFormData(
      `/products/import?mode=${mode}`,
      formData,
      targetLojaId ? { "X-Loja-Id": String(targetLojaId) } : {}
    );
  },
};
