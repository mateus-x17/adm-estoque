# 📑 RELATÓRIO TÉCNICO 03 — MAPEAMENTO DE APIS, CONTRATOS E CADEIAS DE EXECUÇÃO
## Projeto: Estoque.OS — Catálogo Completo de Endpoints (Sincronizado Fase G / Multi-Tenant)
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  
**Responsável Técnico:** Engenheiro de Software Sênior / Arquiteto de Auditoria  

---

## 1. Visão Geral da Superfície da API

A API do **Estoque.OS** é composta por **42 rotas HTTP registradas no Express** (além da exposição de arquivos estáticos em `USE /uploads`):
- **Rotas Públicas:** 4 rotas (`GET /`, `GET /test-db`, `POST /auth/login`, `POST /auth/register`).
- **Rotas Protegidas por Autenticação JWT + Tenant Ativo + Usuário Ativo (`authMiddleware`):** 38 endpoints isolados estritamente pelo `empresaId` do estabelecimento autenticado:
  - **Acesso Operacional / Todos os Cargos (`ADMIN`, `GERENTE`, `OPERADOR`):** 15 endpoints (`/users/me` GET/PUT, `/products` GET, `/products/:id` GET, `/products/count`, `/products/stats`, `/products/:id/adjust`, `/categories` GET, `/categories/count`, `/suppliers` GET, `/suppliers/count`, `/suppliers/stats`, `/suppliers/:id` GET, `/movements` GET *[escopo individual para OPERADOR]*, `/movements/sales-report` GET *[escopo individual para OPERADOR]*).
  - **Acesso Gerencial e Administrativo (`ADMIN`, `GERENTE`):** 14 endpoints (CRUD e Soft Delete de Produtos, Categorias e Fornecedores; importação/exportação `.xlsx`/`.csv`; dropdown `/users/names`; métricas de vendedores `/movements/user-stats`).
  - **Acesso Administrativo Exclusivo (`ADMIN`):** 9 endpoints (Gestão completa de colaboradores `/users/*` + `/users/:id/status` + rotas destrutivas `DELETE /products/:id`, `DELETE /categories/:id` e `DELETE /suppliers/:id`).

> **Isolamento Cross-Tenant:** Tentativas de ler, alterar ou excluir recursos pertencentes a outra `Empresa` retornam `404 Not Found` no serviço porque todas as queries exigem `where: { id, empresaId }`.

---

## 2. Inventário de Endpoints por Módulo

### 2.1 Módulo de Autenticação (`/auth`) — 2 rotas

#### 1. `POST /auth/login`
- **Arquivo e Handler:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L35-L40) → [`authController.js#loginController`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js#L11)
- **Middlewares:** `loginLimiter` (15 req/15 min por IP), `validateRequest({ required: ['email', 'senha'] })`.
- **Entrada:** `{ email: string, senha: string, lojaSlug?: string }`.
- **Cadeia de Execução:** `requestLogger` → `loginLimiter` → `validateRequest` → `loginController` → `authService.authenticateUser` (normaliza e-mail em minúsculas; se `lojaSlug` ausente e e-mail/senha existirem em múltiplas lojas ativas, devolve seletor `{ requiresStoreSelection: true, stores }`; verifica `usuario.ativo` e `empresa.ativo`; gera JWT com `expiresIn: '8h'` contendo `id, role, empresaId, empresaSlug, empresaNome`).
- **Saída:** `200 OK` `{ token, user }` ou `{ requiresStoreSelection: true, stores }`.
- **Erros:** `400`, `401` (credenciais inválidas), `403` (usuário ou estabelecimento inativo), `429`.

#### 2. `POST /auth/register`
- **Arquivo e Handler:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L43-L48) → [`authController.js#registerController`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js#L35)
- **Middlewares:** `registerLimiter` (10 req/1 hora por IP), `validateRequest({ required: ['nomeLoja', 'nome', 'email', 'senha'] })`.
- **Entrada:** `{ nomeLoja: string, slug?: string, cnpj?: string, telefone?: string, nome: string, email: string, senha: string }`.
- **Cadeia:** `registerLimiter` → `validateRequest` → `authService.registerStoreAndAdmin` (gera slug único, executa `$transaction` criando `Empresa` + usuário fundador com papel `ADMIN`, emite JWT inicial).
- **Saída:** `201 Created` `{ message, token, user, usuario, empresa }`.

---

### 2.2 Módulo de Usuários (`/users`) — 9 rotas

#### 3. `GET /users/me`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L26) → [`userController.js#getMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L191)
- **Middlewares:** `authMiddleware` (validação JWT + cache 60s com verificação `ativo` de usuário e empresa).
- **Saída:** `200 OK` com usuário sanitizado e objeto `{ id, nome, slug }` da `empresa`.

#### 4. `PUT /users/me`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L27-L32) → [`userController.js#updateMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L202)
- **Middlewares:** `authMiddleware`, `upload.single("imagem")`, `validateRequest({ required: ["nome", "email"] })`.
- **Regras:** Envia eventual foto para `estoque-os/lojas/<slug>/usuarios` no Cloudinary; bloqueia alteração de `role` por não-`ADMIN` (HTTP `403`); invalida `userCache` e `namesCacheByTenant`.

#### 5. `GET /users/names`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L35) → [`userController.js#getUserNames`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L53)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`. *(Bloqueado com `403` para `OPERADOR` por regra de sigilo entre vendedores).*
- **Cadeia:** Cache por tenant (`namesCacheByTenant`, TTL 30s) retornando `{ id, nome, role }[]` apenas de colaboradores ativos (`ativo: true`) da loja.

#### 6. `POST /users`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L40-L45) → [`userController.js#createUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L27)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'email', 'senha', 'role'] })`.
- **Regras:** Valida `role` ∈ `{ADMIN, GERENTE, OPERADOR}` e unicidade `[empresaId, email]`. Upload opcional na subpasta da loja no Cloudinary. Status `201`.

#### 7. `GET /users`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L47) → [`userController.js#listUsers`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L86)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.
- **Query Params:** `page`, `limit`, `search`, `role`, `status` (`ativos` | `inativos` | `todos`).

#### 8. `GET /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L48) → [`userController.js#getUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L112)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`. Retorna `404` se pertencer a outro tenant.

#### 9. `PUT /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L50-L55) → [`userController.js#updateUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L126)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'email', 'role'] })`.
- **Regras:** Bloqueia rebaixamento do último `ADMIN` ativo da loja (`400`), invalida `userCache` e `namesCacheByTenant`.

#### 10. `PATCH /users/:id/status`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L58) → [`userController.js#toggleUserStatus`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L159)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`, `validateRequest({ required: ['ativo'] })`.
- **Regras:** Alterna `ativo` (`parseBooleanFlag`), impede auto-inativação ou inativação do último `ADMIN` da loja, limpa `userCache` imediatamente (bloqueando próximas chamadas do usuário inativado com HTTP `403`).

#### 11. `DELETE /users/:id`
- **Arquivo e Handler:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L60) → [`userController.js#deleteUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L176)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`.
- **Regras:** Previne autoexclusão e exclusão do último `ADMIN`. Se houver movimentações históricas, realiza **Soft Delete automático** (`{ softDeleted: true, user }`); se sem histórico, exclui mídia do Cloudinary/disco e remove do banco (`{ softDeleted: false }`). Conectado à UI real em [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx#L121-L143).

---

### 2.3 Módulo de Produtos & Planilhas (`/products`) — 12 rotas

#### 12. `GET /products/count`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L46) → [`productController.js#countProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L26)
- **Middlewares:** `authMiddleware`. Conta apenas produtos ativos (`ativo: true`) da loja.

#### 13. `GET /products/stats`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L47) → [`productController.js#getProductStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L39)
- **Middlewares:** `authMiddleware`. Retorna `{ total, lowStock, totalValue, lowStockList }` apenas de produtos ativos da loja (patrimônio em `Decimal` via SQL nativo). No frontend, [`useDashboardData.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js) unifica a chamada em paralelo evitando requisições duplicadas.

#### 14. `GET /products/export`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L48) → [`productController.js#exportProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L204)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`.
- **Query Params:** `format` (`xlsx` | `csv`), `status` (`ativos` | `inativos` | `todos`).
- **Saída:** Buffer binário via `ExcelJS` (`application/vnd.openxmlformats...` ou `text/csv; charset=utf-8` com BOM UTF-8).

#### 15. `GET /products/import/template`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L49) → [`productController.js#downloadImportTemplate`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L232)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`.
- **Saída:** Planilha modelo com cabeçalhos e 2 exemplos prontos em `.xlsx` ou `.csv`.

#### 16. `POST /products/import`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L50-L55) → [`productController.js#importProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L251)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `uploadSpreadsheet.single("file")` (Multer `memoryStorage`, limite 2MB, extensão `.xlsx`/`.csv`).
- **Query/Body:** `mode` (`preview` | `commit`), máximo 5.000 linhas por arquivo.
- **Comportamento:** Em `preview`, retorna `200` com `validCount`, `invalidCount`, `errors`, `previewRows`, `newCategories`, `newSuppliers`. Em `commit`, aborta atomicamente com `400` se houver erros ou cria categorias, fornecedores e produtos em `prisma.$transaction` (`201 Created`).

#### 17. `GET /products`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L58) → [`productController.js#listProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L13)
- **Middlewares:** `authMiddleware`.
- **Query Params:** `page`, `limit` (teto de 100 salvo `'all'`), `search`, `sortPrice`, `categoriaId`, `status` (`ativos` | `inativos` | `todos`).

#### 18. `GET /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L59) → [`productController.js#getProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L52)
- **Middlewares:** `authMiddleware`. Escopado por `empresaId`.

#### 19. `POST /products`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L62-L68) → [`productController.js#createProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L66)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'preco', 'quantidade'] })`.
- **Regras:** Valida pertencimento de `categoriaId` e `fornecedorId` opcionais à loja; salva mídia em `estoque-os/lojas/<slug>/produtos`.

#### 20. `PUT /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L70-L76) → [`productController.js#updateProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L93)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `upload.single("imagem")`, `validateRequest({ required: ['nome', 'preco', 'quantidade'] })`.

#### 21. `PATCH /products/:id/status`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L78-L83) → [`productController.js#toggleProductStatus`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L126)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['ativo'] })`.

#### 22. `DELETE /products/:id`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L86) → [`productController.js#deleteProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L148)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`. Soft Delete automático (`softDeleted: true`) se houver movimentações.

#### 23. `POST /products/:id/adjust`
- **Arquivo e Handler:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L89-L94) → [`productController.js#adjustQuantity`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L166)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`, `validateRequest({ required: ['quantidade', 'tipo'] })`.
- **Cadeia:** `Idempotency-Key` com namespace por tenant + debounce 1.2s → `prisma.$transaction` → `SELECT ... FOR UPDATE WHERE id = ... AND "empresaId" = ...` → bloqueia item inativo (`400`) e saldo insuficiente (`400`) → grava `Movimento` + atualiza `Produto`.

---

### 2.4 Módulo de Categorias (`/categories`) — 6 rotas

#### 24. `GET /categories/count`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L21) → [`categoryController.js#countCategories`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L22)
- **Middlewares:** `authMiddleware`.

#### 25. `GET /categories`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L24) → [`categoryController.js#listCategories`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L10)
- **Middlewares:** `authMiddleware`. Aceita query `status` (`ativos`, `inativos`, `todos`). Inclui `_count.produtos`. *(Observação remanescente: listagem sem `skip`/`take` explícito — aceitável para catálogos curtos de categorias).*

#### 26. `POST /categories`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L27) → [`categoryController.js#createCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L33)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['nome'] })`. Valida chave composta `empresaId_nome`. Status `201`.

#### 27. `PUT /categories/:id`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L28) → [`categoryController.js#updateCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L45)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['nome'] })`.

#### 28. `PATCH /categories/:id/status`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L29) → [`categoryController.js#toggleCategoryStatus`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L57)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ['ativo'] })`.

#### 29. `DELETE /categories/:id`
- **Arquivo e Handler:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js#L32) → [`categoryController.js#deleteCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L69)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`. Se houver produtos associados, executa Soft Delete automático.

---

### 2.5 Módulo de Fornecedores (`/suppliers`) — 8 rotas

#### 30. `GET /suppliers/stats`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L23) → [`supplierController.js#getSupplierStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L82)
- **Middlewares:** `authMiddleware`.
- **Cadeia:** Agregação SQL nativa via `$queryRaw` com `LEFT JOIN` entre `Fornecedor`, `Produto` e `Movimento` filtrando `f."empresaId"` e `f."ativo" = true` (`supplierService.js`).

#### 31. `GET /suppliers`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L26) → [`supplierController.js#listarFornecedores`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L23)
- **Middlewares:** `authMiddleware`. Aceita `status` (`ativos`, `inativos`, `todos`). Retorno `{ fornecedores }`. *(Sem paginação SQL atualmente).*

#### 32. `GET /suppliers/count`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L27) → [`supplierController.js#countFornecedores`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L35)

#### 33. `GET /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L28) → [`supplierController.js#obterFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L93)

#### 34. `POST /suppliers`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L31-L36) → [`supplierController.js#criarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L8)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ["nome"] })`. *(Campos de contato opcionais)*.

#### 35. `PUT /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L38-L43) → [`supplierController.js#atualizarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L46)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ["nome"] })`.

#### 36. `PATCH /suppliers/:id/status`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L45-L50) → [`supplierController.js#toggleFornecedorStatus`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L58)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`, `validateRequest({ required: ["ativo"] })`.

#### 37. `DELETE /suppliers/:id`
- **Arquivo e Handler:** [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js#L53-L57) → [`supplierController.js#deletarFornecedor`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L70)
- **Middlewares:** `authMiddleware`, `permit("ADMIN")`. Se houver produtos associados, executa Soft Delete automático.

---

### 2.6 Módulo de Movimentações (`/movements`) — 3 rotas

#### 38. `GET /movements/sales-report`
- **Arquivo e Handler:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L15) → [`movementController.js#getSalesReport`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L50)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`.
- **Query Params:** `period` (`'1m'`, `'6m'`, `'1y'`).
- **Isolamento:** `ADMIN`/`GERENTE` recebem `scope: 'store'` (toda a loja); `OPERADOR` recebe `scope: 'user'` (exclusivamente suas próprias vendas).

#### 39. `GET /movements/user-stats`
- **Arquivo e Handler:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L18) → [`movementController.js#getUserStats`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L31)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE")`. *(Bloqueado com `403` para `OPERADOR`).*
- **Cadeia:** Query SQL nativa `$queryRaw` única com `JOIN` filtrada por `u."empresaId" = tenantId`.

#### 40. `GET /movements`
- **Arquivo e Handler:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L22) → [`movementController.js#listMovements`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L14)
- **Middlewares:** `authMiddleware`, `permit("ADMIN", "GERENTE", "OPERADOR")`.
- **Isolamento:** Se `req.user.role === 'OPERADOR'`, `effectiveUsuarioId` é forçado para `req.user.id`, ignorando qualquer `?usuarioId` forjado na URL.
- **Observação:** Suporta `limit=all` (usado pelos gráficos de linha/barra do frontend — passível de otimização com endpoint agregado futuro).

---

### 2.7 Infraestrutura e Diagnóstico — 2 rotas (+ `/uploads`)

#### 41. `GET /`
- [`index.js#L63`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L63): Healthcheck HTTP público.

#### 42. `GET /test-db`
- [`index.js#L66-L73`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L66-L73): Raw query `SELECT NOW()` para diagnóstico de banco.

---

## 3. Matriz Sintética de Verificação de Endpoints (Estado Atual Fase G)

| Verbo | Rota | Auth | Papéis Autorizados | Status Atual |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/auth/login` | Não | Público | `CORRIGIDO / TESTADO` (Seletor multi-loja, 15 req/15m, bloqueio inativo 403) |
| `POST` | `/auth/register` | Não | Público | `CORRIGIDO / TESTADO` (Cria Loja + ADMIN + rateLimit 10/h) |
| `GET` | `/users/me` | JWT | Todos | `IMPLEMENTADO (verificado)` |
| `PUT` | `/users/me` | JWT | Todos | `IMPLEMENTADO (verificado)` (Bloqueia escalação de role + pasta do tenant) |
| `GET` | `/users/names` | JWT | `ADMIN, GERENTE` | `CORRIGIDO / TESTADO` (Cache por tenant 30s + bloqueio OPERADOR 403) |
| `POST` | `/users` | JWT | `ADMIN` | `IMPLEMENTADO (verificado)` (E-mail único por loja) |
| `GET` | `/users` | JWT | `ADMIN` | `IMPLEMENTADO (verificado)` (Paginado + filtro `status`) |
| `GET` | `/users/:id` | JWT | `ADMIN` | `IMPLEMENTADO (verificado)` (Cross-tenant 404) |
| `PUT` | `/users/:id` | JWT | `ADMIN` | `CORRIGIDO / TESTADO` (Bloqueia demotion último admin) |
| `PATCH` | `/users/:id/status` | JWT | `ADMIN` | `CORRIGIDO / TESTADO` (Soft Delete + invalidação de cache 403) |
| `DELETE` | `/users/:id` | JWT | `ADMIN` | `CORRIGIDO / TESTADO` (Fallback Soft Delete + UI conectada) |
| `GET` | `/products/count` | JWT | Todos | `IMPLEMENTADO (verificado)` (Ativos do tenant) |
| `GET` | `/products/stats` | JWT | Todos | `IMPLEMENTADO (verificado)` (`Decimal(10,2)` + consolidado na UI) |
| `GET` | `/products/export` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO / TESTADO` (`.xlsx` e `.csv` ExcelJS) |
| `GET` | `/products/import/template` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO / TESTADO` (`.xlsx` e `.csv` ExcelJS) |
| `POST` | `/products/import` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO / TESTADO` (`preview` e `commit` atômico) |
| `GET` | `/products` | JWT | Todos | `IMPLEMENTADO (verificado)` (Filtro `status`, `categoriaId`, `search`) |
| `GET` | `/products/:id` | JWT | Todos | `IMPLEMENTADO / TESTADO` (Cross-tenant 404) |
| `POST` | `/products` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` (Pasta tenant Cloudinary) |
| `PUT` | `/products/:id` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` |
| `PATCH` | `/products/:id/status` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` |
| `DELETE` | `/products/:id` | JWT | `ADMIN` | `CORRIGIDO / TESTADO` (Fallback Soft Delete se houver histórico) |
| `POST` | `/products/:id/adjust` | JWT | Todos | `CORRIGIDO / TESTADO` (`FOR UPDATE` + `Idempotency-Key` + bloqueia inativo) |
| `GET` | `/categories/count` | JWT | Todos | `IMPLEMENTADO (verificado)` |
| `GET` | `/categories` | JWT | Todos | `IMPLEMENTADO` *(sem paginação SQL; aceitável para poucos itens)* |
| `POST` | `/categories` | JWT | `ADMIN, GERENTE` | `CORRIGIDO / TESTADO` (`@@unique([empresaId, nome])`) |
| `PUT` | `/categories/:id` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` |
| `PATCH` | `/categories/:id/status` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` |
| `DELETE` | `/categories/:id` | JWT | `ADMIN` | `IMPLEMENTADO` (Fallback Soft Delete se produtos vinculados) |
| `GET` | `/suppliers/stats` | JWT | Todos | `CORRIGIDO / TESTADO` (SQL nativo `LEFT JOIN`) |
| `GET` | `/suppliers` | JWT | Todos | `IMPLEMENTADO` *(sem paginação SQL; filtro `status` ativo)* |
| `GET` | `/suppliers/count` | JWT | Todos | `IMPLEMENTADO (verificado)` |
| `GET` | `/suppliers/:id` | JWT | Todos | `IMPLEMENTADO (verificado)` |
| `POST` | `/suppliers` | JWT | `ADMIN, GERENTE` | `CORRIGIDO / TESTADO` (Via `supplierService`, apenas `nome` obrigatório) |
| `PUT` | `/suppliers/:id` | JWT | `ADMIN, GERENTE` | `CORRIGIDO / TESTADO` (Via `supplierService`) |
| `PATCH` | `/suppliers/:id/status` | JWT | `ADMIN, GERENTE` | `IMPLEMENTADO (verificado)` |
| `DELETE` | `/suppliers/:id` | JWT | `ADMIN` | `IMPLEMENTADO` (Exclusivo `ADMIN`, fallback Soft Delete) |
| `GET` | `/movements/sales-report` | JWT | Todos | `CORRIGIDO / TESTADO` (`scope: 'store'` vs `'user'`) |
| `GET` | `/movements/user-stats` | JWT | `ADMIN, GERENTE` | `CORRIGIDO / TESTADO` (SQL nativo único + bloqueio `OPERADOR`) |
| `GET` | `/movements` | JWT | Todos | `CORRIGIDO / TESTADO` (Escopo forçado p/ `OPERADOR`; aceita `limit=all`) |
| `GET` | `/` | Não | Público | `IMPLEMENTADO (verificado)` |
| `GET` | `/test-db` | Não | Público | `IMPLEMENTADO (verificado)` |
