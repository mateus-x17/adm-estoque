import { apiClient } from "./apiClient.js";

/**
 * Users API
 */
export const usersApi = {
    /**
     * Get all users
     */
    getUsers: async () => {
        const response = await apiClient.get("/users");
        return response.data || response;
    },

    /**
     * Create a new user
     */
    createUser: (userData) => apiClient.post("/users", userData),
};
