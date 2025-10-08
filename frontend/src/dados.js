const usuarios = [
  {
    id: 1,
    nome: "Mateus Inácio",
    email: "mateus.inacio@empresa.com",
    senha: "hashed_senha_123",
    role: "ADMIN",
    createdAt: new Date("2025-01-10T10:00:00Z"),
    updatedAt: new Date("2025-03-01T14:30:00Z"),
  },
  {
    id: 2,
    nome: "Ana Souza",
    email: "ana.souza@empresa.com",
    senha: "hashed_senha_456",
    role: "OPERADOR",
    createdAt: new Date("2025-02-20T09:15:00Z"),
    updatedAt: new Date("2025-04-12T18:00:00Z"),
  },
  {
    id: 3,
    nome: "Lucas Pereira",
    email: "lucas.pereira@empresa.com",
    senha: "hashed_senha_789",
    role: "GERENTE",
    createdAt: new Date("2025-03-05T08:45:00Z"),
    updatedAt: new Date("2025-06-01T11:20:00Z"),
  },
];

const categorias = [
  { id: 1, nome: "Eletrônicos" },
  { id: 2, nome: "Alimentos" },
  { id: 3, nome: "Limpeza" },
  { id: 4, nome: "Vestuário" },
];

const fornecedores = [
  {
    id: 1,
    nome: "TechDistribuidora LTDA",
    contato: "contato@techdistribuidora.com",
    endereco: "Rua Alfa, 123 - São Paulo, SP",
  },
  {
    id: 2,
    nome: "Alimentos Silva",
    contato: "vendas@alimentossilva.com.br",
    endereco: "Av. Central, 45 - Belo Horizonte, MG",
  },
  {
    id: 3,
    nome: "HigieneMax",
    contato: "comercial@higienemax.com",
    endereco: "Rua das Flores, 789 - Curitiba, PR",
  },
];

const produtos = [
  {
    id: 1,
    nome: "Notebook Dell Inspiron 15",
    descricao: "Intel i7, 16GB RAM, 512GB SSD",
    preco: 4899.90,
    quantidade: 12,
    imagem: "uploads/produtos/notebook_dell.jpg",
    categoriaId: 1,
    fornecedorId: 1,
    createdAt: new Date("2025-02-10T09:00:00Z"),
    updatedAt: new Date("2025-04-01T12:30:00Z"),
  },
  {
    id: 2,
    nome: "Arroz Branco 5kg",
    descricao: "Pacote de arroz tipo 1",
    preco: 25.50,
    quantidade: 80,
    imagem: "uploads/produtos/arroz_branco.jpg",
    categoriaId: 2,
    fornecedorId: 2,
    createdAt: new Date("2025-03-15T11:00:00Z"),
    updatedAt: new Date("2025-04-15T16:00:00Z"),
  },
  {
    id: 3,
    nome: "Detergente Líquido 500ml",
    descricao: "Limpeza eficiente com fragrância suave",
    preco: 4.99,
    quantidade: 200,
    imagem: "uploads/produtos/detergente.jpg",
    categoriaId: 3,
    fornecedorId: 3,
    createdAt: new Date("2025-03-25T10:30:00Z"),
    updatedAt: new Date("2025-05-05T09:00:00Z"),
  },
  {
    id: 4,
    nome: "Camiseta Básica Branca",
    descricao: "Algodão 100%, tamanho M",
    preco: 39.90,
    quantidade: 45,
    imagem: "uploads/produtos/camiseta_branca.jpg",
    categoriaId: 4,
    fornecedorId: null,
    createdAt: new Date("2025-04-02T15:00:00Z"),
    updatedAt: new Date("2025-06-02T10:00:00Z"),
  },
];

export { usuarios, categorias, fornecedores, produtos }; 
