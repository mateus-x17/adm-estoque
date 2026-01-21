/**
 * Central API exports
 * Import from here to access all API services
 * 
 * Example usage:
 * import { productsApi, movementsApi } from '@/services/api';
 * 
 * const products = await productsApi.getProducts();
 * const movements = await movementsApi.getMovements({ order: 'desc' });
 */

export { apiClient } from "./apiClient.js";
export { productsApi } from "./products.api.js";
export { movementsApi } from "./movements.api.js";
export { suppliersApi } from "./suppliers.api.js";
export { categoriesApi } from "./categories.api.js";
export { usersApi } from "./users.api.js";
export { authApi } from "./auth.api.js";
