import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage", // Nome da chave no localStorage
    }
  )
);


// resposta do login:  
// token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5OTkzMjAyLCJleHAiOjE3NjAwMjIwMDJ9.TXkm5vhKsvVLmCVh1ulZ5LukKLtT-4wWLJ0ZNCVCe84"
// user:{ email: "admin@empresa.com", id: 1, nome: "Admin Inicial", role: "ADMIN" }


// modal com menssagem recebida da api de sucesso/erro 
// enviar a mensagem como prop 
// enviar o tipo de mensagem (sucesso/erro) como prop para controlar o estilo do modal (if sucess estilo verde else estilo vermelho)