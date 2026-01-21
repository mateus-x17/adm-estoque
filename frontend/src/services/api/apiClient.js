/**
 * Base API Client
 * Handles all HTTP requests with automatic token management
 */

const API_BASE_URL = "http://localhost:5000";

/**
 * Get authentication token from user store
 */
const getToken = () => {
    const storeData = localStorage.getItem("auth-storage");  // ✅ CORRIGIDO: era "user-store"
    if (!storeData) {
        console.log("[API Client] No auth-storage found in localStorage");
        return null;
    }

    try {
        const parsed = JSON.parse(storeData);
        const token = parsed?.state?.token || null;
        console.log("[API Client] Token from storage:", token ? "✅ Found" : "❌ Missing in state");
        return token;
    } catch (error) {
        console.error("[API Client] Error parsing auth-storage:", error);
        return null;
    }
};

/**
 * Build headers with authentication
 * @param {Object} customHeaders - Custom headers to merge
 * @param {Boolean} skipAuth - If true, don't add auth token
 */
const buildHeaders = (customHeaders = {}, skipAuth = false) => {
    const headers = {
        "Content-Type": "application/json",
        ...customHeaders,
    };

    if (!skipAuth) {
        const token = getToken();
        console.log("[API Client] Token retrieved:", token ? "✅ Found" : "❌ Not found");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
            console.log("[API Client] Authorization header added");
        }
    } else {
        console.log("[API Client] Skipping auth (public endpoint)");
    }

    return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
    console.log(`[API Client] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        let errorMessage = "Erro ao processar requisição";

        try {
            const errorData = await response.json();
            console.error("[API Client] Error response:", errorData);

            // Extract user-friendly message
            if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.error) {
                errorMessage = errorData.error;
            } else if (response.status === 401) {
                errorMessage = "Não autorizado. Por favor, faça login novamente.";
            } else if (response.status === 403) {
                errorMessage = "Acesso negado. Você não tem permissão para esta ação.";
            } else if (response.status === 404) {
                errorMessage = "Recurso não encontrado.";
            } else if (response.status === 500) {
                errorMessage = "Erro no servidor. Tente novamente mais tarde.";
            }
        } catch (parseError) {
            // If response is not JSON, use status-based messages
            console.error("[API Client] Could not parse error response");
            if (response.status === 401) {
                errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
            } else if (response.status >= 500) {
                errorMessage = "Erro no servidor. Tente novamente mais tarde.";
            }
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    // Success response
    const data = await response.json();
    console.log("[API Client] Success response:", data);
    return data;
};

/**
 * Base request function
 * @param {String} endpoint - API endpoint
 * @param {Object} options - Fetch options (method, body, headers, skipAuth)
 */
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const { skipAuth = false, ...fetchOptions } = options;

    const config = {
        ...fetchOptions,
        headers: buildHeaders(fetchOptions.headers, skipAuth),
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error(`API Error [${options.method || 'GET'}] ${endpoint}:`, error);
        throw error;
    }
};

/**
 * HTTP Methods
 */
export const apiClient = {
    get: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: "GET" }),

    post: (endpoint, data, options = {}) =>
        request(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(data),
        }),

    put: (endpoint, data, options = {}) =>
        request(endpoint, {
            ...options,
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: "DELETE" }),

    // For FormData uploads (images, files)
    postFormData: async (endpoint, formData, options = {}) => {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: formData,
        });

        return handleResponse(response);
    },
};
