import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de gestão de colaboradores da loja

export const usersApi = {
  // função para obter os dados completos do usuário autenticado e da loja vinculada
  getMe: async () => {
    return apiClient.get("/users/me");
  },

  // função para listar os colaboradores do estabelecimento com paginação e filtros de cargo e status
  // 1 - Constrói query string incluindo status ('todos', 'ativos', 'inativos') para suporte a Soft Delete
  // 2 - Retorna payload paginado do backend
  getUsers: async ({ page = 1, limit = 10, search = "", role = "", status = "todos" } = {}) => {
    const query = new URLSearchParams({
      page,
      limit,
      search,
      role,
      status,
    });
    return apiClient.get(`/users?${query.toString()}`);
  },

  // função para buscar lista resumida de colaboradores da loja (disponível apenas para ADMIN e GERENTE)
  getUserNames: async () => {
    return apiClient.get("/users/names");
  },

  // função para criar um novo colaborador vinculado ao estabelecimento atual
  createUser: (userData) => apiClient.post("/users", userData),

  // função para inativar ou reativar logicamente um colaborador (Soft Delete)
  // 1 - Envia PATCH para /users/:id/status com { ativo }
  toggleUserStatus: (id, ativo) =>
    apiClient.patch(`/users/${id}/status`, { ativo }),

  // função para excluir um colaborador (ou aplicar Soft Delete automático caso possua histórico)
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};
