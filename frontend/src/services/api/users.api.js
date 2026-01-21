import { apiClient } from "./apiClient.js";

/**
 * Users API
 */
export const usersApi = {
    /**
     * Get all users
     */
    getUsers: () => apiClient.get("/users"),

    /**
     * Create a new user
     */
    createUser: (userData) => apiClient.post("/users", userData),
};
