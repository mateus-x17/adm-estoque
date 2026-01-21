import { apiClient } from "./apiClient.js";

/**
 * Authentication API
 */
export const authApi = {
    /**
     * Login user
     * @param {Object} credentials - { email, password }
     */
    login: (credentials) => apiClient.post("/auth/login", credentials),

    /**
     * Register new user
     * @param {Object} userData - { nome, email, password, cargo }
     */
    register: (userData) => apiClient.post("/auth/register", userData),
};
