# 📑 RELATÓRIO TÉCNICO 03 — MAPEAMENTO DE APIS, CONTRATOS E CADEIAS DE EXECUÇÃO
## Projeto: Estoque.OS — Catálogo Completo de Endpoints (Fase 1.4)
**Data da Auditoria:** 2026-11-08  
**Classificação do Projeto:** Nível de Refinamento `MEDIUM`  
**Responsável Técnico:** Senior Software Architect / Lead Auditor  
**Documento de Origem:** `PROMPT_MASTER_UNIFICADO.md`  

---

## 1. Visão Geral da Superfície da API

A API do **Estoque.OS** é composta por **34 rotas HTTP registradas no Express**:
- **Rotas Públicas:** 4 rotas (`GET /`, `GET /test-db`, `POST /auth/login`, `POST /auth/register`).
- **Rotas Protegidas por Autenticação JWT:** 30 rotas.
  - **Acesso Operacional Geral (ADMIN, GERENTE, OPERADOR):** 11 rotas (`/users/me`, `/users/names`, `/products`, `/products/:id`, `/products/count`, `/products/stats`, `/products/:id/adjust`, `/categories`, `/categories/count`, `/suppliers`, `/suppliers/count`, `/suppliers/:id`, `/movements`).
  - **Acesso Gerencial Restrito (ADMIN, GERENTE):** 11 rotas (Criação e edição de Produtos, Categorias e Fornecedores; Métricas de operadores `/movements/user-stats` e `/suppliers/stats`).
  - **Acesso Administrativo Exclusivo (ADMIN):** 8 rotas (CRUD completo de usuários `/users/*`, deleção de produtos `/products/:id` e deleção de categorias `/categories/:id`).

---

## 2. Inventário de Endpoints por Módulo

### 2.1 Módulo de Autenticação (`/auth`)

#### 1. `POST /auth/login`
- **Arquivo e Handler:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L16) → [`authController.js#loginController`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js#L6)
- **Autenticação / Middlewares:** `loginLimiter` (10 req/15 min por IP), `validateRequest({ required: ['email', 'senha'] })`.
- **Entrada:**
  - Headers: `Content-Type: application/json`
  - Body: `{ email: string, senha: string }`
- **Cadeia de Execução:** `requestLogger` → `loginLimiter` → `validateRequest` → `loginController` → `authService.authenticateUser` → `prisma.usuario.findUnique` → `bcrypt.compare` → `jwt.sign`.
- **Tabelas Acessadas:** `Usuario` (leitura).
- **Saída:** Status `200 OK`.
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "Lucas Silva",
      "email": "lucas.admin@example.com",
      "role": "ADMIN",
      "imagem": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-03-01T14:30:00.000Z"
    }
  }
  ```
- **Erros Possíveis:** `400` (email/senha ausentes ou inválidos), `401` (credenciais inválidas), `429` (muitas tentativas).
- **Sinalização Crítica:** Validação de formato de e-mail aplicada pelo middleware genérico; sem normalização prévia de caixa (case-sensitive lookup no Postgres).

#### 2. `POST /auth/register`
- **Arquivo e Handler:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L20) → [`authController.js#registerController`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js#L19)
- **Autenticação / Middlewares:** `validateRequest({ required: ['nome', 'email', 'senha'] })`.
- **Entrada:** Body: `{ nome: string, email: string, senha: string }`.
- **Cadeia de Execução:** `requestLogger` → `validateRequest` → `registerController` → `authService.registerUser` → `prisma.usuario.findUnique` → `bcrypt.hash` → `prisma.usuario.create`.
- **Tabelas Acessadas:** `Usuario` (leitura e inserção).
- **Saída:** Status `201 Created`. Retorna `{ message: string, usuario: UserSafe }`.
- **Sinalização Crítica (`PROBLEMA - Catálogo I10`):** **Ausência de rate limiting nesta rota**. Ao contrário do `/login`, a rota de registro não possui limitador contra criação massiva de contas automatizadas (spam/botnet).

---

### 2.2 Módulo de Usuários (`/users`)

#### 3. `GET /users/me`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L25) → [`userController.js#getMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L126)
- **Autenticação / Middlewares:** `authMiddleware`.
- **Cadeia:** `authMiddleware` (valida token e busca usuário) → `getMe` → `userService.getUserById(req.user.id)` → `prisma.usuario.findUnique`.
- **Tabelas Acessadas:** `Usuario` (duas consultas: uma pelo middleware e outra pelo serviço).
- **Saída:** `200 OK` com dados do próprio usuário.

#### 4. `PUT /users/me`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L26-L31) → [`userController.js#updateMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L142)
- **Autenticação / Middlewares:** `authMiddleware`, `upload.single("imagem")`, `validateRequest({ required: ["nome", "email"] })`.
- **Entrada:** Multipart/form-data com `nome`, `email`, opcional `senha`, `role`, `removerImagem` e arquivo `imagem`.
- **Cadeia:** `authMiddleware` → `multer` → `validateRequest` → `updateMe` (guardrail de role: se `!isAdmin && role !== undefined` lança 403) → `uploadToCloudinary` → `userService.updateUser`.
- **Tabelas:** `Usuario` (update).
- **Saída:** `200 OK`.

#### 5. `GET /users/names`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L35) → [`userController.js#getUserNames`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L32)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`.
- **Cadeia:** Consulta otimizada com projeção `select: { id: true, nome: true }` ordenada alfabeticamente.
- **Saída:** `200 OK` com array `Array<{ id: number, nome: string }>`.

#### 6. `POST /users`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L42-L46) → [`userController.js#createUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L13)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'email', 'senha', 'role'] })`.
- **Saída:** `201 Created`.

#### 7. `GET /users`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L48) → [`userController.js#listUsers`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L50)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.
- **Query Params:** `page` (default 1), `limit` (default 10), `search`, `role`.
- **Saída:** `200 OK` com `{ data: User[], pagination: { page, limit, total, totalPages } }`.

#### 8. `GET /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L49) → [`userController.js#getUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L74)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.

#### 9. `PUT /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L51-L55) → [`userController.js#updateUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L89)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'email', 'role'] })`.

#### 10. `DELETE /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L57) → [`userController.js#deleteUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L112)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.
- **Sinalização Crítica (`PROBLEMA`):** O backend implementa todas as travas e a deleção real, mas a interface frontend em [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx#L231-L238) possui o botão com exclusão simulada e não chama esta rota!

---

### 2.3 Módulo de Produtos (`/products`)

#### 11. `GET /products/count`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L25) → [`productController.js#countProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L23)
- **Middlewares:** `authMiddleware`.
- **Saída:** `200 OK` `{ count: number }`.

#### 12. `GET /products/stats`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L26) → [`productController.js#getProductStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L36)
- **Middlewares:** `authMiddleware`.
- **Cadeia:** `count()`, `count({ where: { quantidade: { lt: 10 } } })`, `findMany(take: 5)` e `$queryRaw` para `SUM(preco * quantidade)`.
- **Saída:** `{ total, lowStock, totalValue, lowStockList }`.
- **Sinalização Crítica:** No frontend, tanto [`KPISection.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/KPISection.jsx) quanto [`LowStockAlert.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/LowStockAlert.jsx) disparam requisições simultâneas para esta mesma rota ao carregar o dashboard, duplicando chamadas.

#### 13. `GET /products`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L30) → [`productController.js#listProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L10)
- **Middlewares:** `authMiddleware`.
- **Query Params:** `page`, `limit` (ou `'all'`), `search`, `sortPrice`, `categoriaId`.
- **Saída:** `{ data: Produto[], pagination: { page, limit, total, pages } }`.

#### 14. `GET /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L31) → [`productController.js#getProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L50)
- **Middlewares:** `authMiddleware`.

#### 15. `POST /products`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L36-L41) → [`productController.js#createProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L65)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'preco', 'quantidade', 'categoriaId'] })`.
- **Saída:** `201 Created`.

#### 16. `PUT /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L43-L48) → [`productController.js#updateProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L85)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'preco', 'quantidade', 'categoriaId'] })`.

#### 17. `DELETE /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L50) → [`productController.js#deleteProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L105)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.

#### 18. `POST /products/:id/adjust`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L55-L59) → [`productController.js#adjustQuantity`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L122)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`, `validateRequest({ required: ['quantidade', 'tipo'] })`.
- **Entrada:**
  - Path: `id` (ID do produto).
  - Body: `{ quantidade: number, tipo: "REPOSICAO"|"VENDA"|"ENTRADA"|"SAIDA", observacao?: string }`.
- **Cadeia:** `authMiddleware` → `roleMiddleware` → `validationMiddleware` → `adjustQuantity` → `productService.adjustProductQuantity` → `prisma.$transaction`.
- **Tabelas:** `Produto` (leitura e atualização) e `Movimento` (inserção).
- **Saída:** `200 OK` `{ ok: true, novaQuantidade: number, movimento: Movimento }`.
- **Sinalização Crítica (`PROBLEMA - Catálogo I1`):** Falta de lock pessimista (`SELECT FOR UPDATE`) no saldo lido dentro da transação Prisma.

---

### 2.4 Módulo de Categorias (`/categories`)

#### 19. `GET /categories/count`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L16) → [`categoryController.js#countCategories`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L23)
- **Middlewares:** `authMiddleware`. Retorna `{ count: number }`.

#### 20. `GET /categories`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L19) → [`categoryController.js#listCategories`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L10)
- **Middlewares:** `authMiddleware`. Retorna array `Categoria[]` sem paginação (`PROBLEMA B10`).

#### 21. `POST /categories`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L23) → [`categoryController.js#createCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L38)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['nome'] })`. Status `201 Created`.

#### 22. `PUT /categories/:id`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L24) → [`categoryController.js#updateCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L54)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['nome'] })`.

#### 23. `DELETE /categories/:id`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L27) → [`categoryController.js#deleteCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L70)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.

---

### 2.5 Módulo de Fornecedores (`/suppliers`)

#### 24. `GET /suppliers/stats`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L19) → [`supplierController.js#getSupplierStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L88)
- **Middlewares:** `authMiddleware` (sem restrição de papel, livre para operadores).
- **Cadeia:** Consulta Prisma com include triplo (`fornecedor -> produtos -> movimentos`) e agregações em memória no Node.js (`PROBLEMA I4`).

#### 25. `POST /suppliers`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L22-L28) → [`supplierController.js#criarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L10)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ["nome", "email", "telefone", "endereco"] })`.

#### 26. `PUT /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L30-L36) → [`supplierController.js#atualizarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L53)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ["nome", "email", "telefone", "endereco"] })`.

#### 27. `DELETE /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L38-L43) → [`supplierController.js#deletarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L70)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`.

#### 28. `GET /suppliers`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L46) → [`supplierController.js#listarFornecedores`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L27)
- **Middlewares:** `authMiddleware`. Retorna `{ fornecedores: Fornecedor[] }` sem paginação (`PROBLEMA B10`).

#### 29. `GET /suppliers/count`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L47) → [`supplierController.js#countFornecedores`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L39)
- **Middlewares:** `authMiddleware`.

#### 30. `GET /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L48) → [`supplierController.js#obterFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L138)
- **Middlewares:** `authMiddleware`.

---

### 2.6 Módulo de Movimentações (`/movements`)

#### 31. `GET /movements/user-stats`
- **Arquivo e Handler:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L14) → [`movementController.js#getUserStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L35)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`.
- **Query Params:** `from`, `to`.
- **Cadeia:** `groupBy` por `usuarioId` + N consultas `prisma.usuario.findUnique` + N consultas `prisma.movimento.findMany`.
- **Sinalização Crítica (`PROBLEMA - Catálogo I3`):** N+1 queries graves sob iteração de operadores.

#### 32. `GET /movements`
- **Arquivo e Handler:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L18) → [`movementController.js#listMovements`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L10)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`.
- **Query Params:** `page`, `limit` (aceita `'all'`), `search`, `tipo`, `date`, `from`, `to`, `order`, `usuarioId`.
- **Sinalização Crítica (`PROBLEMA - Catálogo I3/I4`):** O frontend dispara chamadas paralelas com `limit: "all"` nesta rota para abastecer gráficos de pizza e linha em [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx#L132-L136) e no [`Dashboard.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Dashboard.jsx), trazendo todo o histórico do PostgreSQL sem limite.

---

### 2.7 Rotas de Infraestrutura e Diagnóstico

#### 33. `GET /`
- Retorna texto simples: `"🚀 Backend Estoque rodando"`. Rota pública de healthcheck L4/L7.

#### 34. `GET /test-db`
- Executa raw query: `prisma.$queryRaw\`SELECT NOW()`` e retorna timestamp do PostgreSQL/Neon. Rota pública de diagnóstico de conectividade.

---

## 3. Matriz Sintética de Verificação de Endpoints

| Verbo | Rota | Autenticação | Papéis Autorizados | Validação de Entrada | Tabelas Acessadas | Status / Falha Mapeada |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/auth/login` | Não | Público | `required: ['email', 'senha']` | `Usuario` | `IMPLEMENTADO (verificado)` (Rate limit ativo) |
| `POST` | `/auth/register`| Não | Público | `required: ['nome', 'email', 'senha']`| `Usuario` | `PROBLEMA I10` (Sem rate limit) |
| `GET` | `/users/me` | JWT | Todos | Nenhuma | `Usuario` | `IMPLEMENTADO (verificado)` |
| `PUT` | `/users/me` | JWT | Todos | `required: ['nome', 'email']` | `Usuario` | `IMPLEMENTADO (verificado)` (Guardrail role ativo) |
| `GET` | `/users/names` | JWT | Todos | Nenhuma | `Usuario` | `IMPLEMENTADO (verificado)` (Projeção enxuta) |
| `POST` | `/users` | JWT | `ADMIN` | `required: ['nome', 'email', 'senha', 'role']` | `Usuario` | `IMPLEMENTADO (verificado)` |
| `GET` | `/users` | JWT | `ADMIN` | Query: `page, limit, search, role` | `Usuario` | `IMPLEMENTADO (verificado)` (Paginado) |
| `GET` | `/users/:id` | JWT | `ADMIN` | Path: `id` | `Usuario` | `IMPLEMENTADO (verificado)` |
| `PUT` | `/users/:id` | JWT | `ADMIN` | `required: ['nome', 'email', 'role']` | `Usuario` | `PROBLEMA B7` (Sem trava de demotion do último admin) |
| `DELETE`| `/users/:id` | JWT | `ADMIN` | Path: `id` | `Usuario` | `PROBLEMA` (Simulado na interface frontend) |
| `GET` | `/products/count`| JWT | Todos | Nenhuma | `Produto` | `IMPLEMENTADO (verificado)` |
| `GET` | `/products/stats`| JWT | Todos | Nenhuma | `Produto` | `IMPLEMENTADO (verificado)` (Agregação SQL nativa) |
| `GET` | `/products` | JWT | Todos | Query: `page, limit, search, sortPrice`| `Produto, Categoria, Fornecedor` | `IMPLEMENTADO (verificado)` (Paginado) |
| `GET` | `/products/:id` | JWT | Todos | Path: `id` | `Produto, Categoria, Fornecedor` | `IMPLEMENTADO (verificado)` |
| `POST` | `/products` | JWT | `ADMIN, GERENTE`| `required: ['nome', 'preco', 'quantidade', 'categoriaId']` | `Produto` | `IMPLEMENTADO (verificado)` (Upload Cloudinary) |
| `PUT` | `/products/:id` | JWT | `ADMIN, GERENTE`| `required: ['nome', 'preco', 'quantidade', 'categoriaId']` | `Produto` | `IMPLEMENTADO (verificado)` (Limpeza de fotos) |
| `DELETE`| `/products/:id` | JWT | `ADMIN` | Path: `id` | `Produto, Movimento` | `IMPLEMENTADO (verificado)` (Checa FK de movimentos) |
| `POST` | `/products/:id/adjust`| JWT | `ADMIN, GERENTE, OPERADOR` | `required: ['quantidade', 'tipo']` | `Produto, Movimento` | `PROBLEMA I1` (Transação sem lock atômico no banco) |
| `GET` | `/categories/count`| JWT | Todos | Nenhuma | `Categoria` | `IMPLEMENTADO (verificado)` |
| `GET` | `/categories`| JWT | Todos | Nenhuma | `Categoria` | `PROBLEMA B10` (Listagem sem paginação) |
| `POST` | `/categories`| JWT | `ADMIN, GERENTE`| `required: ['nome']` | `Categoria` | `IMPLEMENTADO (verificado)` (Unicidade validada) |
| `PUT` | `/categories/:id`| JWT | `ADMIN, GERENTE`| `required: ['nome']` | `Categoria` | `IMPLEMENTADO (verificado)` |
| `DELETE`| `/categories/:id`| JWT | `ADMIN` | Path: `id` | `Categoria, Produto` | `IMPLEMENTADO (verificado)` (Impede deleção se FK ativa) |
| `GET` | `/suppliers/stats`| JWT | Todos | Nenhuma | `Fornecedor, Produto, Movimento`| `PROBLEMA I4` (Agregação tripla em memória no Node) |
| `POST` | `/suppliers` | JWT | `ADMIN, GERENTE`| `required: ['nome', 'email', 'telefone', 'endereco']` | `Fornecedor` | `PROBLEMA` (Controller ignora supplierService) |
| `PUT` | `/suppliers/:id`| JWT | `ADMIN, GERENTE`| `required: ['nome', 'email', 'telefone', 'endereco']` | `Fornecedor` | `PROBLEMA` (Controller ignora supplierService) |
| `DELETE`| `/suppliers/:id`| JWT | `ADMIN, GERENTE`| Path: `id` | `Fornecedor, Produto` | `IMPLEMENTADO (verificado)` |
| `GET` | `/suppliers` | JWT | Todos | Nenhuma | `Fornecedor` | `PROBLEMA B10` (Listagem sem paginação) |
| `GET` | `/suppliers/count`| JWT | Todos | Nenhuma | `Fornecedor` | `IMPLEMENTADO (verificado)` |
| `GET` | `/suppliers/:id`| JWT | Todos | Path: `id` | `Fornecedor` | `IMPLEMENTADO (verificado)` |
| `GET` | `/movements/user-stats`| JWT | `ADMIN, GERENTE`| Query: `from, to` | `Movimento, Usuario` | `PROBLEMA I3` (N+1 queries manuais via Promise.all) |
| `GET` | `/movements` | JWT | Todos | Query: filtros complexos, `limit: all` | `Movimento, Produto, Usuario` | `PROBLEMA I4` (Suporta limit=all sem teto máximo) |
| `GET` | `/` | Não | Público | Nenhuma | Nenhuma | `IMPLEMENTADO (verificado)` (Healthcheck L4/L7) |
| `GET` | `/test-db` | Não | Público | Nenhuma | Nenhuma | `IMPLEMENTADO (verificado)` (Raw query diagnostic) |
| `POST` | `/movements` | - | - | - | - | `INEXISTENTE` (Documentado no README mas inexistente) |
| `GET` | `/movements/:id`| - | - | - | - | `INEXISTENTE` (Documentado no README mas inexistente) |

