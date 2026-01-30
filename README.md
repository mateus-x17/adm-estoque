# 📦 Sistema de Gerenciamento de Estoque

Um sistema completo e moderno para gerenciamento de estoque, desenvolvido com **Node.js** e **React**. Permite o controle de produtos, categorias, fornecedores, movimentações de estoque e gerenciamento de usuários com diferentes níveis de permissão.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![React](https://img.shields.io/badge/react-v19-blue.svg)

---

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral do estoque com gráficos interativos
- Estatísticas de movimentações (entradas e saídas)
- Indicadores de desempenho em tempo real

### 📦 Produtos
- Cadastro, edição e exclusão de produtos
- Upload de imagens para produtos
- Vinculação com categorias e fornecedores
- Controle de quantidade em estoque

### 🏷️ Categorias
- Organização de produtos por categorias
- Gerenciamento completo (CRUD)

### 🚚 Fornecedores
- Cadastro de fornecedores com informações de contato
- Visualização de produtos por fornecedor

### 📋 Movimentações (Pedidos)
- Registro de entradas e saídas de estoque
- Histórico completo de movimentações
- Filtros por data, tipo e produto
- Atualização automática do estoque

### 👥 Usuários
- Sistema de autenticação com JWT
- Níveis de permissão: **ADMIN**, **GERENTE** e **OPERADOR**
- Gerenciamento de usuários (apenas ADMIN)

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Descrição |
|------------|-----------|
| **Node.js** | Runtime JavaScript |
| **Express 5** | Framework web |
| **Prisma ORM** | Mapeamento objeto-relacional |
| **PostgreSQL** | Banco de dados relacional |
| **JWT** | Autenticação via tokens |
| **Bcrypt.js** | Hash de senhas |
| **Multer** | Upload de arquivos |

### Frontend
| Tecnologia | Descrição |
|------------|-----------|
| **React 19** | Biblioteca UI |
| **Vite** | Build tool moderno |
| **TailwindCSS** | Framework CSS utilitário |
| **Zustand** | Gerenciamento de estado |
| **React Router v7** | Roteamento SPA |
| **Recharts** | Gráficos e visualizações |
| **Framer Motion** | Animações |
| **Lucide React** | Ícones |

---

## 📁 Estrutura do Projeto

```
gerenciador-de-estoque/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Modelos do banco de dados
│   │   ├── seed.js          # Dados iniciais
│   │   └── migrations/      # Migrações do banco
│   ├── src/
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── routes/          # Rotas da API
│   │   ├── middlewares/     # Autenticação e validações
│   │   ├── config/          # Configurações (DB, etc)
│   │   └── index.js         # Entry point
│   └── uploads/             # Arquivos enviados
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes reutilizáveis
    │   ├── pages/           # Páginas da aplicação
    │   ├── services/        # Camada de API
    │   ├── store/           # Estado global (Zustand)
    │   ├── hooks/           # Custom hooks
    │   └── layout/          # Layout da aplicação
    └── public/              # Arquivos estáticos
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** v18 ou superior
- **PostgreSQL** (local ou serviço como Neon/Supabase)
- **npm** ou **yarn**

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/mateus-x17/adm-estoque.git
cd adm-estoque
```

### 2️⃣ Configurar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env baseado no exemplo abaixo:
```

**Arquivo `.env`:**
```env
PORT=5000
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_banco?sslmode=require"
JWT_SECRET="sua_chave_secreta_aqui"
```

```bash
# Executar migrações do banco de dados
npm run prisma:migrate

# Gerar o Prisma Client
npm run prisma:generate

# (Opcional) Popular o banco com dados iniciais
npm run seed

# Iniciar o servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### 3️⃣ Configurar o Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

---

## 📡 Rotas da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |

### Produtos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Listar todos |
| GET | `/api/products/:id` | Buscar por ID |
| POST | `/api/products` | Criar produto |
| PUT | `/api/products/:id` | Atualizar produto |
| DELETE | `/api/products/:id` | Excluir produto |

### Categorias
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/categories` | Listar todas |
| POST | `/api/categories` | Criar categoria |
| DELETE | `/api/categories/:id` | Excluir categoria |

### Fornecedores
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/suppliers` | Listar todos |
| POST | `/api/suppliers` | Criar fornecedor |
| PUT | `/api/suppliers/:id` | Atualizar fornecedor |
| DELETE | `/api/suppliers/:id` | Excluir fornecedor |

### Movimentações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/movements` | Listar todas |
| POST | `/api/movements` | Registrar movimentação |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users` | Listar todos |
| PUT | `/api/users/:id` | Atualizar usuário |
| DELETE | `/api/users/:id` | Excluir usuário |

---

## 🔐 Níveis de Permissão

| Role | Permissões |
|------|------------|
| **ADMIN** | Acesso total: gerencia usuários, produtos, categorias, fornecedores e movimentações |
| **GERENTE** | Gerencia produtos, categorias, fornecedores e movimentações |
| **OPERADOR** | Visualiza e registra movimentações de entrada/saída |

---

## 🎨 Screenshots

### 🏠 Página Home (light/dark mode)
![Página Home da aplicação](screenshots/HomePage.png)
![Home dark mode](screenshots/Home-dark.png)

### 🔐 Login (light/dark mode)
![Página de Login dark mode](screenshots/Login-light.png)
![Página de Login](screenshots/LoginPage.png)

### 📊 Dashboard Administrativo (light/dark mode)
![Dashboard Administrativo](screenshots/Dashboard-administrativo.png)
![Dashboard Administrativo dark mode](screenshots/Dashboard-dark.png)
### 📦 Produtos (light/dark mode)
![Página de Produtos](screenshots/Pagina-produtos.png)
![Página de Produtos dark mode](screenshots/Produtos-dark.png)

### 📋 Movimentações (light/dark mode)
![Página de Movimentações](screenshots/Pagina-movimentacoes.png)
![Página de Movimentações dark mode](screenshots/Movimentacoes-dark.png)

### 🛒 Pedidos (light/dark mode)
![Página de Pedidos](screenshots/Pagina-pedidos.png)
![Página de Pedidos dark mode](screenshots/Pedidos-dark.png)

### 👥 Usuários (light/dark mode)
![Página de Usuários](screenshots/Pagina-usuarios.png)
![Página de Usuários dark mode](screenshots/Usuarios-dark.png)

### 🏷️ Categorias (light/dark mode)
![Página de Categorias](screenshots/Pagina-categorias.png)
![Página de Categorias dark mode](screenshots/Categorias-dark.png)

### 🚚 Fornecedores (light/dark mode)
![Página de Fornecedores](screenshots/Pagina-fornecedores.png)
![Página de Fornecedores dark mode](screenshots/Fornecedores-dark.png)

---

## 📜 Scripts Disponíveis

### Backend
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor com hot-reload (nodemon) |
| `npm run start` | Inicia servidor em produção |
| `npm run prisma:migrate` | Executa migrações do banco |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run seed` | Popula o banco com dados iniciais |

### Frontend
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa o ESLint |

---

## 👤 Autor

Desenvolvido por **Mateus**

