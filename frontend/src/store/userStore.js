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

// pág. usuários:
// 1.	redirecionar para home do dashboard se acesso negado

// pág. produtos:
// 1.	verificar renderização quebrada de itens da tabela de produtos (transformar em componente e renderizar depois de obter os dados com animação fadeInTop ?)

// comp. editarUsuario:
// transformar em um formulário de edição coringa ?
// passar o tipo de formulário como prop e renderizar os campos baseados no tipo
// mudar a rota de put dependendo do tipo de formulário (usuário, produto, categoria, fornecedor)
// adicionar validação de campos (ex: email válido, campos obrigatórios, etc)