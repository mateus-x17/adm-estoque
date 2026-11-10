import { apiClient } from "./apiClient.js";

// arquivo responsável pelas requisições HTTP de usuários, transferência entre filiais e exclusão definitiva

export const usersApi = {
  getMe: async () => apiClient.get("/users/me"),

  // função para listar usuários da Organização com filtro opcional por lojaId, cargo e busca por nome/e-mail/ID
  getUsers: async ({ page = 1, limit = 10, search = "", role = "", lojaId = "" } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(role && role !== "todos" ? { role } : {}),
      ...(lojaId && lojaId !== "todos" && lojaId !== "all" ? { lojaId: String(lojaId) } : {}),
    });
    return apiClient.get(`/users?${params.toString()}`);
  },

  // função para buscar lista resumida de vendedores para dropdowns (ADMIN e GERENTE)
  getUserNames: async () => apiClient.get("/users/names"),

  // função para criar colaborador ou administrador na Organização
  createUser: (userData) => apiClient.post("/users", userData),

  // função para atualizar usuário ou transferir sua filial via PUT
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),

  // função exclusiva de ADMIN para transferir rapidamente um GERENTE ou OPERADOR para outra loja
  transferUserStore: (id, lojaId) => apiClient.patch(`/users/${id}/store`, { lojaId }),

  // função para excluir definitivamente um colaborador preservando vendedorRefId e histórico de vendas
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};
