import { apiClient } from "./apiClient.js";

/**
 * Suppliers API
 */
export const suppliersApi = {
    /**
     * Get all suppliers
     */
    getSuppliers: () => apiClient.get("/suppliers"),

    /**
     * Get suppliers count
     */
    getSuppliersCount: () => apiClient.get("/suppliers/count"),

    /**
     * Get supplier statistics
     */
    getSupplierStats: () => apiClient.get("/suppliers/stats"),

    /**
     * Create a new supplier
     */
    createSupplier: (supplierData) => apiClient.post("/suppliers", supplierData),

    /**
     * Delete a supplier
     */
    deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),
};
