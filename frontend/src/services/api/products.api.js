import { apiClient } from "./apiClient.js";

/**
 * Products API
 */
export const productsApi = {
    /**
     * Get all products
     */
    getProducts: async () => {
        const response = await apiClient.get("/products");
        return response.data || response;
    },

    /**
     * Get product statistics (total, low stock, etc.)
     */
    getProductStats: async () => {
        const response = await apiClient.get("/products/stats");
        return response.data || response;
    },

    /**
     * Create a new product
     */
    createProduct: (productData) => apiClient.post("/products", productData),

    /**
     * Update an existing product
     */
    updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),

    /**
     * Delete a product
     */
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
};
