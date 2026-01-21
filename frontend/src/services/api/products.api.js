import { apiClient } from "./apiClient.js";

/**
 * Products API
 */
export const productsApi = {
    /**
     * Get all products
     */
    getProducts: () => apiClient.get("/products"),

    /**
     * Get product statistics (total, low stock, etc.)
     */
    getProductStats: () => apiClient.get("/products/stats"),

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
