// arquivo responsável por centralizar requisições HTTP com JWT, cabeçalho de loja selecionada (X-Loja-Id), uploads e downloads binários

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// função para recuperar o token JWT persistido no localStorage pelo Zustand
const getToken = () => {
  const storeData = localStorage.getItem("auth-token");
  if (!storeData) return null;

  try {
    const parsed = JSON.parse(storeData);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

// função para recuperar a filial atualmente selecionada pelo ADMIN no localStorage ('all' ou ID numérico)
const getSelectedLojaId = () => {
  const scopeData = localStorage.getItem("tenant-scope");
  if (!scopeData) return null;

  try {
    const parsed = JSON.parse(scopeData);
    const lojaId = parsed?.state?.selectedLojaId;
    return lojaId && lojaId !== "all" ? String(lojaId) : null;
  } catch {
    return null;
  }
};

// função para montar headers padrão com Bearer Token e X-Loja-Id (quando aplicável)
const buildHeaders = (customHeaders = {}, skipAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    if (!headers["X-Loja-Id"] && !headers["x-loja-id"]) {
      const lojaId = getSelectedLojaId();
      if (lojaId) headers["X-Loja-Id"] = lojaId;
    }
  }

  return headers;
};

// função para tratar respostas HTTP e limpar sessão expirada (401)
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = "Erro ao processar requisição";
    let errorData = null;

    try {
      errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (response.status === 401) {
        errorMessage = "Não autorizado. Faça login novamente.";
      } else if (response.status === 403) {
        errorMessage = "Acesso negado. Você não tem permissão para esta ação.";
      } else if (response.status === 404) {
        errorMessage = "Recurso não encontrado.";
      } else if (response.status === 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }
    } catch {
      if (response.status === 401) {
        errorMessage = "Credenciais inválidas. Verifique seus dados.";
      } else if (response.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }
    }

    if (response.status === 401 && typeof window !== "undefined") {
      try {
        const currentPath = window.location.pathname;
        if (!["/auth", "/login", "/admin/login"].includes(currentPath)) {
          localStorage.removeItem("auth-token");
          localStorage.removeItem("user-data");
          setTimeout(() => {
            window.location.href = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
          }, 100);
        }
      } catch {
        // ignore
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { skipAuth = false, ...fetchOptions } = options;

  const config = {
    ...fetchOptions,
    headers: buildHeaders(fetchOptions.headers, skipAuth),
  };

  const response = await fetch(url, config);
  return handleResponse(response);
};

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),

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

  patch: (endpoint, data, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),

  postFormData: async (endpoint, formData, customHeaders = {}) => {
    const token = getToken();
    const lojaId = getSelectedLojaId();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(lojaId ? { "X-Loja-Id": lojaId } : {}),
      ...customHeaders,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  putFormData: async (endpoint, formData, customHeaders = {}) => {
    const token = getToken();
    const lojaId = getSelectedLojaId();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(lojaId ? { "X-Loja-Id": lojaId } : {}),
      ...customHeaders,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  patchFormData: async (endpoint, formData, customHeaders = {}) => {
    const token = getToken();
    const lojaId = getSelectedLojaId();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(lojaId ? { "X-Loja-Id": lojaId } : {}),
      ...customHeaders,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  downloadBlob: async (endpoint) => {
    const token = getToken();
    const lojaId = getSelectedLojaId();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(lojaId ? { "X-Loja-Id": lojaId } : {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) return handleResponse(response);

    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : "download";
    const blob = await response.blob();
    return { blob, filename };
  },
};
