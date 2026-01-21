import { apiClient } from "./apiClient.js";

/**
 * Movements API
 */
export const movementsApi = {
    /**
     * Get all movements with optional filters
     * @param {Object} params - Query parameters (order, tipo, etc.)
     */
    getMovements: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/movements?${queryString}` : "/movements";
        return apiClient.get(endpoint);
    },

    /**
     * Get user statistics (movement counts and values per user)
     */
    getUserStats: () => apiClient.get("/movements/user-stats"),

    /**
     * Create a new movement
     */
    createMovement: (movementData) => apiClient.post("/movements", movementData),
};
