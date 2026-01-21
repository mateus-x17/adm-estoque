/**
 * Base API Client
 * Handles all HTTP requests with automatic token management
 */

const API_BASE_URL = "http://localhost:5000";

/**
 * Get authentication token from user store
 */
const getToken = () => {
    const storeData = localStorage.getItem("user-store");
    if (!storeData) return null;

    try {
        const parsed = JSON.parse(storeData);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
};

/**
 * Build headers with authentication
 */
const buildHeaders = (customHeaders = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...customHeaders,
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: "An error occurred"
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
};

/**
 * Base request function
 */
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: buildHeaders(options.headers),
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
