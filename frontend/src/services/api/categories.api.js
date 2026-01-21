import { apiClient } from "./apiClient.js";

/**
 * Categories API
 */
export const categoriesApi = {
    /**
     * Get all categories
     */
    getCategories: () => apiClient.get("/categories"),

    /**
     * Get categories count
     */
    getCategoriesCount: () => apiClient.get("/categories/count"),

    /**
     * Create a new category
     */
    createCategory: (categoryData) => apiClient.post("/categories", categoryData),

    /**
     * Delete a category
     */
    deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};
