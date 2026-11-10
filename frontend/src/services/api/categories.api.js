import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de gestão de categorias do estabelecimento

export const categoriesApi = {
  // função para listar categorias da loja com filtro opcional de status ('ativos', 'inativos', 'todos')
  // 1 - Serializa status na query string quando fornecido
  // 2 - Retorna a lista de categorias do estabelecimento
  getCategories: (params = {}) => {
    const cleanParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        cleanParams[key] = val;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return apiClient.get(qs ? `/categories?${qs}` : "/categories");
  },

  // função para contar categorias ativas do estabelecimento
  getCategoriesCount: () => apiClient.get("/categories/count"),

  // função para criar uma nova categoria na loja
  createCategory: (categoryData) => apiClient.post("/categories", categoryData),

  // função para atualizar o nome de uma categoria existente
  updateCategory: (id, categoryData) => apiClient.put(`/categories/${id}`, categoryData),

  // função para inativar ou reativar logicamente uma categoria (Soft Delete)
  toggleCategoryStatus: (id, ativo) =>
    apiClient.patch(`/categories/${id}/status`, { ativo }),

  // função para excluir ou inativar logicamente uma categoria
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};
