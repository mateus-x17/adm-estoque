import { apiClient } from "./apiClient.js";

// arquivo responsável pelas chamadas de autenticação e abertura de contas de estabelecimentos

export const authApi = {
  // função para autenticar colaborador em sua loja (suporta lojaSlug e seleção quando multi-loja)
  // 1 - Envia credenciais { email, senha, lojaSlug } ignorando o token prévio (skipAuth)
  login: (credentials) =>
    apiClient.post("/auth/login", credentials, { skipAuth: true }),

  // função para cadastrar novo estabelecimento e seu usuário administrador fundador
  // 1 - Envia { nomeLoja, slug, cnpj, telefone, nome, email, senha } para POST /auth/register
  register: (storeData) =>
    apiClient.post("/auth/register", storeData, { skipAuth: true }),
};
