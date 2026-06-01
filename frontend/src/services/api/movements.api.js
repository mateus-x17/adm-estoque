import { apiClient } from "./apiClient.js";

/**
 * Movements API
 */
export const movementsApi = {
    /**
     * Get all movements with optional filters
     * @param {Object} params - Query parameters (order, tipo, etc.)
     */
    getMovements: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/movements?${queryString}` : "/movements";
        const response = await apiClient.get(endpoint);
        return response.data || response;
    },

    /**
     * Get user statistics (movement counts and values per user)
     */
    getUserStats: async () => {
        const response = await apiClient.get("/movements/user-stats");
        return response.data || response;
    },

    /**
     * Create a new movement
     */
    createMovement: (movementData) => apiClient.post("/movements", movementData),
};
