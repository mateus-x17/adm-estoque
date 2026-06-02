import { apiClient } from "./apiClient.js";

/**
 * Products API
 */
export const productsApi = {
    /**
     * Get all products
     */
    getProducts: async (params = {}) => {
        const cleanParams = {};
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined && val !== null && val !== '') {
                cleanParams[key] = val;
            }
        }
        const queryString = new URLSearchParams(cleanParams).toString();
        const endpoint = queryString ? `/products?${queryString}` : "/products";
        const response = await apiClient.get(endpoint);
        
        // If query parameters are provided, return the full response (with pagination details).
        // If no parameters are provided, return the raw data array for backwards compatibility.
        if (Object.keys(cleanParams).length > 0) {
            return response;
        }
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
