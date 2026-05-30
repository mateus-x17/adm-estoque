# 📦 ADM Estoque

Sistema de gerenciamento de estoque com backend em **Node.js + Express + Prisma** e frontend em **React + Vite**. O projeto permite controlar produtos, categorias, fornecedores, movimentações de estoque e usuários com permissões de administrador.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![React](https://img.shields.io/badge/react-v19-blue.svg)

---

## ✨ Visão Geral do Projeto

O sistema foi desenvolvido para ser uma aplicação de estoque completa:

- Backend com APIs REST, autenticação JWT e controle de acesso por roles
- Frontend Single Page Application com navegação protegida e dashboard analítico
- Upload de imagens de produto/usuário com entrega de arquivos estáticos
- Estado global leve com **Zustand** e integração com APIs via cliente centralizado
- Logs estruturados com **pino** e tratamento global de erros

---

## 🧩 Funcionalidades Principais

### Backend
- Autenticação e registro de usuários
- Autorização via JWT
- Controle de acesso por papel (**ADMIN**, **GERENTE**, **OPERADOR**)
- CRUD de produtos com upload de imagem
- CRUD de categorias
- CRUD de fornecedores
- Histórico de movimentações de estoque
- Estatísticas e contagens para dashboard
- Validação centralizada de payloads de requisição
- Registro de requisições HTTP e tratamento de erros global

### Frontend
- Login e registro de usuários
- Dashboard administrativo com gráficos e cards de KPI
- Listagem e gerenciamento de produtos
- Exibição de categorias e fornecedores
- Tela de movimentações com filtros e gráficos
- Sistema de pedidos/faturas
- Gerenciamento de usuários com permissões
- Modo escuro e notificações de interface
- Roteamento protegido e layout persistente

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Uso |
|------------|-----|
| Node.js | Runtime do servidor |
| Express | Framework HTTP |
| Prisma | ORM para PostgreSQL |
| PostgreSQL | Banco de dados relacional |
| JWT | Autenticação baseada em token |
| bcryptjs | Hash de senhas |
| multer | Upload de arquivos |
| helmet | Segurança HTTP |
| cors | Configuração de CORS |
| express-rate-limit | Proteção de login |
| pino | Logging estruturado |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React | Biblioteca UI |
| Vite | Ferramenta de build |
| Zustand | Gerenciamento de estado |
| React Router v7 | Navegação SPA |
| TailwindCSS | Estilização utilitária |
| Recharts | Visualização de gráficos |
| Framer Motion | Animações |
| react-icons | Ícones de interface |

---

## 📁 Estrutura do Repositório

```
adm-estoque/
├── backend/
│   ├── prisma/
│   │   ├── migrations/      # Migrações do banco de dados
│   │   ├── schema.prisma    # Modelos e índices do Prisma
│   │   ├── seed.js          # Dados iniciais de usuários, categorias, etc.
│   │   └── seedMovements.js # Popula movimentações de estoque
│   ├── src/
│   │   ├── config/          # Prisma client, logger, multer
│   │   ├── controllers/     # Endpoints chamam os controllers
│   │   ├── middlewares/     # Autenticação, autorização, validação e logs
│   │   ├── routes/          # Definição de rotas REST
│   │   ├── services/        # Regras de negócio e persistência
│   │   ├── utils/           # Handler de erros e sanitização
│   │   └── index.js         # Servidor Express e inicialização
│   ├── uploads/            # Arquivos de imagem enviados
│   ├── .env.example        # Exemplo de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── public/             # Arquivos estáticos
│   ├── src/
│   │   ├── components/     # Componentes UI organizados por domínio
│   │   │   ├── common/     # Botões, modais, navegação, notificações
│   │   │   ├── forms/      # Formulários e modais de cadastro/edição
│   │   │   ├── tables/     # Tabelas e listas do dashboard
│   │   │   └── dashboard/  # Cards e gráficos do dashboard
│   │   ├── config/         # Rotas e configurações centrais
│   │   ├── hooks/          # Hooks reutilizáveis
│   │   ├── layout/         # Layout principal e fluxo de páginas
│   │   ├── pages/          # Páginas de rota principais
│   │   ├── services/       # API clients e integrações HTTP
│   │   ├── store/          # Zustand stores para estado global
│   │   ├── utils/          # Validações e helpers
│   │   └── index.css       # Estilos globais
│   └── package.json
└── README.md
```

---

## 🧠 Arquitetura do Backend

### Principais componentes
- `src/index.js` - configura o servidor, middleware, rotas e error handler
- `src/config/prismaClient.js` - instancia o Prisma Client
- `src/config/logger.js` - logger estruturado com `pino`
- `src/middlewares/authMiddleware.js` - valida JWT e carrega usuário
- `src/middlewares/roleMiddleware.js` - controla acesso por roles
- `src/middlewares/requestLogger.js` - registra cada requisição HTTP
- `src/utils/errorHandler.js` - tratamento global de erros
- `src/services/*Service.js` - abstrai lógica de dados e regras de negócio
- `src/controllers/*Controller.js` - recepciona requisições e chama serviços

### Fluxo de requisição
1. Requisição chega ao Express
2. Validação de CORS, JSON e proteção de cabeçalhos
3. Autenticação / autorização se necessário
4. Controller executa a ação chamando o Service
5. Service interage com Prisma
6. Errors são capturadas pelo middleware global

### Segurança e validação
- Autenticação via JWT com `authMiddleware`
- Controle de acesso por `permit('ADMIN', 'GERENTE', ...)`
- Limitação de tentativas de login com `express-rate-limit`
- Proteção de cabeçalhos com `helmet`
- Validação simples de payloads em `validationMiddleware.js`

---

## 🧩 Backend: Principais Endpoints

### Autenticação
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| POST | `/auth/login` | Login do usuário | Rate limit |
| POST | `/auth/register` | Cria novo usuário | Público |

### Usuários
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| GET | `/users` | Lista usuários | ADMIN |
| GET | `/users/:id` | Busca usuário por ID | ADMIN |
| POST | `/users` | Cria usuário com upload de imagem | ADMIN |
| PUT | `/users/:id` | Atualiza usuário e imagem | ADMIN |
| DELETE | `/users/:id` | Exclui usuário | ADMIN |

### Produtos
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| GET | `/products` | Lista produtos | Autenticado |
| GET | `/products/:id` | Busca produto por ID | Autenticado |
| POST | `/products` | Cria produto com upload de imagem | ADMIN, GERENTE |
| PUT | `/products/:id` | Atualiza produto | ADMIN, GERENTE |
| DELETE | `/products/:id` | Exclui produto | ADMIN |
| POST | `/products/:id/adjust` | Ajusta quantidade do estoque | ADMIN, GERENTE, OPERADOR |
| GET | `/products/count` | Conta total de produtos | Autenticado |
| GET | `/products/stats` | Estatísticas de produto | Autenticado |

### Categorias
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| GET | `/categories` | Lista categorias | Autenticado |
| GET | `/categories/count` | Contagem de categorias | Autenticado |
| POST | `/categories` | Cria categoria | ADMIN, GERENTE |
| PUT | `/categories/:id` | Atualiza categoria | ADMIN, GERENTE |
| DELETE | `/categories/:id` | Exclui categoria | ADMIN |

### Fornecedores
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| GET | `/suppliers` | Lista fornecedores | Autenticado |
| GET | `/suppliers/stats` | Estatísticas de fornecedores | Autenticado |
| GET | `/suppliers/count` | Contagem de fornecedores | Autenticado |
| POST | `/suppliers` | Cria fornecedor | ADMIN, GERENTE |
| PUT | `/suppliers/:id` | Atualiza fornecedor | ADMIN, GERENTE |
| DELETE | `/suppliers/:id` | Exclui fornecedor | ADMIN, GERENTE |

### Movimentações
| Método | Rota | Descrição | Proteção |
|--------|------|-----------|----------|
| GET | `/movements` | Lista movimentações de estoque | ADMIN, GERENTE, OPERADOR |
| GET | `/movements/user-stats` | Estatísticas de usuário | ADMIN, GERENTE |

---

## 🧠 Arquitetura do Frontend

### Estrutura principal
- `src/main.jsx` - inicializa o React e o roteador
- `src/config/routes.js` - define rotas públicas e protegidas
- `src/layout/Layout.jsx` - layout da aplicação com `Sidebar`, `Header` e `NotificationContainer`
- `src/components/ProtectedRoute.jsx` - protege rotas administrativas
- `src/store/` - stores do Zustand para autenticação, usuário e notificações
- `src/services/api/` - clientes HTTP centralizados para backend
- `src/hooks/` - hooks utilitários para formulários e chamadas de API
- `src/pages/` - páginas de rota para cada área funcional

### Organização de componentes
- `components/common/` - botões, inputs, notificações, barra lateral, modais gerais
- `components/forms/` - formulários de login, registro, edição e modais de CRUD
- `components/tables/` - tabelas e linhas de listagem de dados
- `components/dashboard/` - cartões e gráficos de dashboard

### Estado e UX
- `useAuthStore` - guarda token JWT localmente
- `useUserStore` - persiste dados do usuário logado
- `useNotificationStore` - mostra alertas de sucesso/erro na interface
- `useThemeStore` - controla modo claro/escuro

### Integração com backend
- `services/api/apiClient.js` - ponto central para requisições HTTP
- `services/api/auth.api.js` - login e registro
- `services/api/products.api.js` - produtos
- `services/api/categories.api.js` - categorias
- `services/api/suppliers.api.js` - fornecedores
- `services/api/movements.api.js` - movimentações
- `services/api/users.api.js` - usuários

---

## 📌 Frontend: Páginas e Rotas

| Rota | Página | Objetivo |
|------|--------|----------|
| `/` | `Home` | Página inicial pública |
| `/auth` | `Auth` | Login e registro |
| `/dashboard` | `Dashboard` | Visão geral do sistema |
| `/dashboard/produtos` | `Produtos` | Gerenciamento de produtos |
| `/dashboard/usuarios` | `Usuarios` | Gerenciamento de usuários |
| `/dashboard/movimentacoes` | `Movimentacoes` | Histórico e entrada/saída |
| `/dashboard/categorias` | `Categorias` | Gestão de categorias |
| `/dashboard/pedidos` | `Pedidos` | Pedidos e filtros |
| `/dashboard/fornecedores` | `Fornecedores` | Gestão de fornecedores |

---

## 🔧 Como Executar

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Atualize o .env com as credenciais do PostgreSQL
npm run prisma:migrate
npm run prisma:generate
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### URLs padrão
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 🔐 Permissões de Acesso

| Role | Permissões |
|------|------------|
| **ADMIN** | Gerencia usuários, produtos, categorias, fornecedores e movimentações |
| **GERENTE** | Gerencia produtos, categorias, fornecedores e movimentações |
| **OPERADOR** | Registra e visualiza movimentações |

---

## 💡 Observações

- O backend expõe a rota de teste `/test-db` para verificar a conexão com o banco
- O servidor usa `helmet`, `cors` e `rate-limit` para melhorar a segurança
- O frontend centraliza as rotas em `src/config/routes.js` e protege as áreas administrativas com `ProtectedRoute`
- Os uploads gravam arquivos em `backend/uploads` e são servidos por `/uploads`

---

## 🧪 Scripts Disponíveis

### Backend
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor com nodemon |
| `npm run start` | Inicia servidor em modo produção |
| `npm run prisma:migrate` | Executa migrações Prisma |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run seed` | Popula dados iniciais |
| `npm run seedMovements` | Popula movimentações de estoque |

### Frontend
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza build gerado |
| `npm run lint` | Executa ESLint |

---

## 👤 Autor
Desenvolvido por **Mateus**

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

