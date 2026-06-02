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
        const cleanParams = {};
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined && val !== null && val !== '') {
                cleanParams[key] = val;
            }
        }
        const queryString = new URLSearchParams(cleanParams).toString();
        const endpoint = queryString ? `/movements?${queryString}` : "/movements";
        const response = await apiClient.get(endpoint);
        
        // If parameters (like page, limit, or filters) are passed, we return the full response
        // containing pagination metadata. Otherwise, return the raw data array directly 
        // to maintain compatibility with the dashboard components.
        if (Object.keys(cleanParams).length > 0) {
            return response;
        }
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
