# Sistema de Gerenciamento de Estoque (Estoque.OS)

## 1. Visão Geral

### 1.1 O que é o sistema
O **Sistema de Gerenciamento de Estoque** é uma aplicação web fullstack desenvolvida para o controle abrangente de mercadorias, categorias, fornecedores e controle de usuários. O sistema permite acompanhar o fluxo de entrada e saída de produtos em tempo real, garantindo rastreabilidade por operador e fornecendo métricas estratégicas para a tomada de decisão.

### 1.2 Funcionalidades
- **Gestão de Autenticação e Controle de Acesso (RBAC):** Sistema de login seguro via JWT com permissões baseadas em papéis (`ADMIN`, `GERENTE`, `OPERADOR`).
- **Gestão de Produtos:** Cadastro, edição, exclusão e listagem paginada de produtos com upload de fotos, filtros por nome/categoria e ordenação de preços.
- **Gestão de Categorias:** Organização de itens por categorias personalizadas.
- **Gestão de Fornecedores:** Controle de informações de contato e vínculo direto com produtos.
- **Movimentações de Estoque:** Registro de entradas e saídas de produtos com atualização automática de saldo, vinculação do operador e adição de observações.
- **Gestão de Usuários:** Administração de contas e atribuição de funções por administradores.
- **Upload de Mídias em Nuvem (Cloudinary):** Integração com o Cloudinary para hospedagem de imagens de produtos e avatares de usuários com URLs seguras HTTPS (mantendo gravação local histórica).
- **Dashboard e Relatórios Estatísticos:** Métricas sobre valor total em estoque, número de produtos e alerta automático de estoque baixo (< 10 unidades).
- **Customização Visual:** Suporte nativo a temas Claro e Escuro (Dark/Light mode).

### 1.3 Valor entregue
O sistema elimina o controle manual de produtos, reduz erros de inventário e previne rupturas de estoque através de alertas inteligentes. Além disso, proporciona transparência operacional ao registrar qual usuário executou cada entrada ou saída de mercadorias.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais
1. O sistema deve permitir autenticação de usuários via e-mail e senha com geração de token JWT.
2. O sistema deve permitir a criação, leitura, atualização e exclusão (CRUD) de produtos.
3. O sistema deve permitir o upload e gerenciamento de fotos de produtos e avatares de usuários no Cloudinary.
4. O sistema deve permitir a categorização de produtos e associação com fornecedores.
5. O sistema deve registrar cada movimentação de estoque (`ENTRADA` ou `SAIDA`), atualizando automaticamente a quantidade do produto e vinculando o usuário responsável.
6. O sistema deve proibir movimentações de saída que resultem em saldo de estoque negativo.
7. O sistema deve permitir que administradores gerenciem outros usuários e alterem suas funções.
8. O sistema deve permitir que o usuário logado visualize e edite suas informações de perfil na página de configurações.
9. O sistema deve exibir estatísticas consolidadas contendo a contagem total de produtos, alerta de baixo estoque e o valor financeiro acumulado.

### 2.2 Requisitos Não Funcionais
- **Segurança:** Autenticação baseada em JSON Web Token (JWT), senhas criptografadas com BcryptJS, cabeçalhos de segurança com Helmet, proteção CORS e rate-limiting na rota de autenticação.
- **Performance:** Respostas REST céleres com Express.js, paginação otimizada no banco PostgreSQL via Prisma ORM e consultas indexadas.
- **Escalabilidade:** Arquitetura desacoplada entre backend (API) e frontend (SPA), com armazenamento externo de mídia em CDN (Cloudinary).
- **Usabilidade:** Interface moderna e responsiva construída em React + Vite + Tailwind CSS, com suporte a tema escuro/claro.

---

## 3. Regras de Negócio
- Apenas usuários com função `ADMIN` têm permissão para criar, editar, listar e excluir outros usuários do sistema.
- Apenas usuários `ADMIN` e `GERENTE` têm permissão para cadastrar, editar e remover produtos, categorias e fornecedores.
- Usuários com função `OPERADOR` possuem acesso de leitura aos cadastros e permissão para realizar movimentações de estoque (`ENTRADA` e `SAIDA`).
- Uma movimentação do tipo `SAIDA` não pode ser realizada se a quantidade solicitada for superior ao saldo atual disponível do produto.
- A quantidade de produtos em estoque não pode assumir valores negativos.
- Cada usuário no sistema deve possuir um e-mail único.
- O nome de cada categoria de produtos deve ser único.
- Usuários não-administradores não podem alterar seu próprio papel (role) através da tela de configurações.

---

## 4. Arquitetura de Software

### 4.1 Visão Geral
O projeto é estruturado como uma aplicação desacoplada (Cliente-Servidor API RESTful):
- **Backend:** Node.js com Express e padrão em camadas (Routes -> Middlewares -> Controllers -> Services -> Prisma ORM -> PostgreSQL / Cloudinary).
- **Frontend:** Single Page Application (SPA) em React com Vite, Tailwind CSS para estilização e Zustand para gerenciamento de estado global.

### 4.2 Stack Tecnológica
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand, React Router DOM, Lucide React, React Icons, Framer Motion, Recharts.
- **Backend:** Node.js (ES Modules), Express.js 5, Prisma ORM, Cloudinary SDK, Multer, Pino Logger, BcryptJS, JsonWebToken, Helmet, Express Rate Limit.
- **Banco de Dados:** PostgreSQL (hospedado na nuvem via Neon Database).
- **Armazenamento de Mídias:** Cloudinary (upload via Cloudinary API com fallback/histórico local no diretório `uploads/`).

---

## 5. Design da API

### 5.1 Endpoints Principais

#### Autenticação
- `POST /auth/login` - Autenticação de usuário e retorno do JWT.
- `POST /auth/register` - Registro inicial de novos usuários.

#### Usuários
- `GET /users/me` - Obter perfil do usuário autenticado.
- `PUT /users/me` - Atualizar perfil e avatar do usuário autenticado.
- `GET /users` - Listagem paginada de usuários (Requer `ADMIN`).
- `POST /users` - Cadastro de usuário com foto (Requer `ADMIN`).
- `GET /users/:id` - Obter dados de um usuário (Requer `ADMIN`).
- `PUT /users/:id` - Atualizar dados e função do usuário (Requer `ADMIN`).
- `DELETE /users/:id` - Deletar usuário (Requer `ADMIN`).

#### Produtos
- `GET /products` - Listagem paginada e filtrada de produtos.
- `GET /products/count` - Total de produtos cadastrados.
- `GET /products/stats` - Estatísticas financeiras e alertas de estoque.
- `GET /products/:id` - Obter detalhes de um produto.
- `POST /products` - Cadastrar produto com foto (Requer `ADMIN` ou `GERENTE`).
- `PUT /products/:id` - Atualizar produto (Requer `ADMIN` ou `GERENTE`).
- `DELETE /products/:id` - Excluir produto (Requer `ADMIN`).
- `POST /products/:id/adjust` - Ajustar quantidade e gerar movimentação (`ADMIN`, `GERENTE`, `OPERADOR`).

#### Categorias
- `GET /categories` - Listagem de categorias.
- `GET /categories/:id` - Detalhes da categoria.
- `POST /categories` - Criar categoria (Requer `ADMIN` ou `GERENTE`).
- `PUT /categories/:id` - Editar categoria (Requer `ADMIN` ou `GERENTE`).
- `DELETE /categories/:id` - Deletar categoria (Requer `ADMIN` ou `GERENTE`).

#### Fornecedores
- `GET /suppliers` - Listagem de fornecedores.
- `GET /suppliers/:id` - Detalhes do fornecedor.
- `POST /suppliers` - Criar fornecedor (Requer `ADMIN` ou `GERENTE`).
- `PUT /suppliers/:id` - Editar fornecedor (Requer `ADMIN` ou `GERENTE`).
- `DELETE /suppliers/:id` - Deletar fornecedor (Requer `ADMIN` ou `GERENTE`).

#### Movimentações
- `GET /movements` - Histórico de movimentações de estoque.
- `GET /movements/:id` - Detalhes de uma movimentação.
- `POST /movements` - Registrar entrada ou saída de produto.

### 5.2 Padrões Utilizados
- Comunicação via JSON.
- Status HTTP padronizados (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
- Autenticação via cabeçalho `Authorization: Bearer <token>`.

---

## 6. Estrutura do Projeto

### 6.1 Organização de Pastas (Backend)
```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── seedMovements.js
├── src/
│   ├── config/
│   │   ├── cloudinaryConfig.js
│   │   ├── logger.js
│   │   ├── multerConfig.js
│   │   └── prismaClient.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── movementController.js
│   │   ├── productController.js
│   │   ├── supplierController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── requestLogger.js
│   │   ├── roleMiddleware.js
│   │   └── validationMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── movementRoutes.js
│   │   ├── productRoutes.js
│   │   ├── supplierRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── categoryService.js
│   │   ├── movementService.js
│   │   ├── productService.js
│   │   ├── supplierService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── sanitizers.js
│   └── index.js
└── uploads/
    ├── produtos/
    └── usuarios/
```

### 6.2 Padrões Adotados
- **Separação de Responsabilidades:** Camadas isoladas de rotas, middlewares de autorização, controladores e serviços com regras de negócio.
- **Tratamento Centralizado de Erros:** Erros tratados por middleware global com mensagens amigáveis e logging via Pino.
- **Mídias Flexíveis:** Utilitário no frontend e backend garantindo interoperabilidade entre URLs do Cloudinary e uploads locais.

---

## 7. Instalação e Execução Local

Siga os passos abaixo para clonar, instalar e rodar o projeto na sua máquina.

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/gerenciador-de-estoque.git
   ```

2. Acesse a pasta do projeto:
   ```bash
   cd gerenciador-de-estoque
   ```

3. Configure as variáveis de ambiente do Backend:
   Acesse a pasta `backend` e crie o arquivo `.env`:
   ```bash
   cd backend
   ```
   Preencha o arquivo `.env` com as configurações necessárias:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
   JWT_SECRET="seu_jwt_secret_super_seguro"
   FRONTEND_URL="http://localhost:5173"

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   ```

4. Instale as dependências do Backend:
   ```bash
   npm install
   ```

5. Execute as migrações e popule o banco de dados (se aplicável):
   ```bash
   npx prisma db push
   npm run seed
   ```

6. Inicie o servidor Backend:
   ```bash
   npm run dev
   ```

7. Em outro terminal, instale e inicie o Frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

8. Acesse a aplicação no navegador:
   ```
   http://localhost:5173
   ```
