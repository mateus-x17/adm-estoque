import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -------------------------------------------------------------------------
// Zustand Store para Autenticação (Global State)
// Utiliza o middleware 'persist' para salvar o token do usuário no localStorage do navegador.
// Garantindo que, ao dar F5 na página, o usuário não seja deslogado, pois o estado hidrata automaticamente
// a partir do localStorage('auth-token') antes da árvore do React montar totalmente.
// -------------------------------------------------------------------------
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: 'auth-token', // Chave que será salva no Application -> Local Storage do DevTools
      getStorage: () => localStorage, // Tipo de persistência (SessionStorage é apagado ao fechar a aba, Local persiste)
    }
  )
);
