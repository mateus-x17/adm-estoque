// arquivo responsável por centralizar as requisições HTTP do frontend com injeção automática de JWT e suporte a uploads e blobs

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// função para recuperar o token JWT salvo pelo Zustand no localStorage
// 1 - Lê a chave 'auth-token' persistida no armazenamento local do navegador
// 2 - Faz o parse do JSON e extrai state.token com fallback seguro para null
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

// função para montar os cabeçalhos HTTP com Bearer Token quando a rota exigir autenticação
// 1 - Inicializa Content-Type application/json e cabeçalhos customizados
// 2 - Se skipAuth for falso, injeta Authorization: Bearer <token> caso disponível
const buildHeaders = (customHeaders = {}, skipAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// função para padronizar o tratamento de respostas e erros HTTP vindos do backend
// 1 - Verifica se response.ok é falso e extrai mensagem e detalhes do corpo JSON de erro
// 2 - Se receber status 401 fora das rotas de login, limpa a sessão e redireciona para /auth
// 3 - Anexa status e payload completo de erro (error.data) para feedback detalhado na interface (ex: erros em planilhas)
// 4 - Em caso de sucesso, devolve o JSON decodificado
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
        errorMessage = "Não autorizado. Por favor, faça login novamente.";
      } else if (response.status === 403) {
        errorMessage = "Acesso negado. Você não tem permissão para esta ação.";
      } else if (response.status === 404) {
        errorMessage = "Recurso não encontrado.";
      } else if (response.status === 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }
    } catch {
      if (response.status === 401) {
        errorMessage = "Credenciais inválidas. Verifique seus dados e tente novamente.";
      } else if (response.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }
    }

    if (response.status === 401 && typeof window !== "undefined") {
      try {
        const currentPath = window.location.pathname;
        if (currentPath !== "/auth" && currentPath !== "/login") {
          localStorage.removeItem("auth-token");
          setTimeout(() => {
            window.location.href = "/auth";
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

// função genérica para executar chamadas JSON via fetch API
// 1 - Concatena API_BASE_URL com o endpoint informado
// 2 - Aplica headers de autenticação (exceto quando skipAuth = true)
// 3 - Processa a resposta através de handleResponse
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

// Cliente HTTP unificado exportado para todos os módulos de serviço
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

  patch: (endpoint, data, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),

  // função para envio de formulários multipart/form-data (imagens e planilhas) via POST
  // 1 - Injeta token JWT sem fixar Content-Type para o navegador definir o boundary automaticamente
  // 2 - Devolve o JSON tratado pelo handleResponse
  postFormData: async (endpoint, formData) => {
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

  // função para atualização de registros com arquivos via PUT multipart/form-data
  putFormData: async (endpoint, formData) => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: formData,
    });

    return handleResponse(response);
  },

  // função para realizar download autenticado de arquivos binários (.xlsx, .csv)
  // 1 - Executa GET enviando o Bearer Token no cabeçalho
  // 2 - Se houver erro HTTP, encaminha para o mesmo fluxo de erro de handleResponse
  // 3 - Extrai o nome sugerido do cabeçalho Content-Disposition e retorna { blob, filename }
  downloadBlob: async (endpoint) => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return handleResponse(response);
    }

    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : "download";
    const blob = await response.blob();
    return { blob, filename };
  },
};
