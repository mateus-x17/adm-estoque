import { apiClient } from "./apiClient.js";

/**
 * Suppliers API
 */
export const suppliersApi = {
    /**
     * Get all suppliers
     */
    getSuppliers: async () => {
        const response = await apiClient.get("/suppliers");
        return response.data || response;
    },

    /**
     * Get suppliers count
     */
    getSuppliersCount: async () => {
        const response = await apiClient.get("/suppliers/count");
        return response.data || response;
    },

    /**
     * Get supplier statistics
     */
    getSupplierStats: async () => {
        const response = await apiClient.get("/suppliers/stats");
        return response.data || response;
    },

    /**
     * Create a new supplier
     */
    createSupplier: (supplierData) => apiClient.post("/suppliers", supplierData),

    /**
     * Delete a supplier
     */
    deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),
};
