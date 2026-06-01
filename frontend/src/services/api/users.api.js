import { apiClient } from "./apiClient.js";

/**
 * Users API
 */
export const usersApi = {
  /**
   * Get all users
   */
  getUsers: async ({ page = 1, limit = 10, search = "", role = "" } = {}) => {
    const query = new URLSearchParams({
      page,
      limit,
      search,
      role,
    });
    const response = await apiClient.get(`/users?${query.toString()}`);
    return response;
  },

  /**
   * Create a new user
   */
  createUser: (userData) => apiClient.post("/users", userData),
};
