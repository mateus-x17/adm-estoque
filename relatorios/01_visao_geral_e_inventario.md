# RELATÓRIO 01 — VISÃO GERAL E INVENTÁRIO DO PROJETO
**Projeto:** Estoque.OS  
**Data da Auditoria:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  
**Nível de Classificação Detectado:** **MEDIUM / PRODUCTION-READY CORE** *(Plataforma SaaS Multi-Organização / Multi-Filial com Multipedidos Atômicos, Estornos, Exclusão Real Preservando Histórico e Auditoria de Vendedores)*  

---

## 1. Visão Geral Executiva do Projeto `[IMPLEMENTADO (verificado)]`

O **Estoque.OS** é uma aplicação web Full-Stack B2B destinada a **redes varejistas e estabelecimentos comerciais multi-filiais**, estruturada sob o modelo **Organização (Rede/Empresa) → múltiplas Lojas (Unidades/Filiais)**. O sistema organiza autenticação em dois portais dedicados (**Portal do Administrador** em `/admin/login` e **Portal da Loja** em `/login`), controle de acesso baseado em papéis (**RBAC**: `ADMIN`, `GERENTE` e `OPERADOR`), gestão de catálogo e fornecedores por filial, importação/exportação nativa de planilhas (`.xlsx` e `.csv`), **Multipedidos atômicos** (`Pedido` + `ItemPedido`) com **preço unitário congelado** e estorno transacional, **exclusão física real de colaboradores preservando o antigo ID (`vendedorRefId`) e snapshots históricos**, além de relatórios executivos PDF A4 e painel dedicado de desempenho por vendedor (`1m`, `6m`, `1y`).

---

## 2. Stack Tecnológica Comprovada `[IMPLEMENTADO (verificado)]`

### 2.1 Backend (`/backend`)
*Verificado em [`backend/package.json`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/package.json):*
- **Runtime:** Node.js (Módulos ES `import/export`)
- **Framework Web:** `express` `^5.1.0`
- **ORM e Banco de Dados:** `@prisma/client` `^6.16.2` / `prisma` `^6.16.2` conectado a **PostgreSQL (Neon Cloud)**
- **Planilhas Nativas:** `exceljs` `^4.4.0` (importação/exportação `.xlsx` e `.csv` UTF-8 BOM sem microserviço externo)
- **Armazenamento de Mídia:** `cloudinary` `^2.10.0` + `multer` `^2.0.2` (disco local temporário para mídias + memória até 2MB para planilhas)
- **Segurança & Rede:** `bcryptjs` `^3.0.2`, `jsonwebtoken` `^9.0.2`, `helmet` `^7.2.0`, `express-rate-limit` `^6.8.0`, `cors` `^2.8.5`
- **Observabilidade:** `pino` `^8.14.0` com Correlation ID (`X-Request-Id`)
- **Testes:** Script oficial `npm test` (`node --test tests/multitenant_audit.test.mjs`) executando 7 baterias E2E contra API + PostgreSQL reais

### 2.2 Frontend (`/frontend`)
*Verificado em [`frontend/package.json`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/package.json):*
- **Biblioteca UI:** `react` `^19.1.1` / `react-dom` `^19.1.1`
- **Bundler & Dev Server:** `vite` `^7.1.6` com `@vitejs/plugin-react` `^5.0.2`
- **Roteamento:** `react-router-dom` `^7.9.1`
- **Gerenciamento de Estado Global:** `zustand` `^5.0.8` (`persist` no `localStorage` para `auth-token`, `user-data`, `tenant-scope`, `theme`)
- **Estilização & Animações:** `tailwindcss` `^3.4.17` + CSS custom properties + `framer-motion` `^12.23.22`
- **Visualização & Ícones:** `recharts` `^3.3.0`, `lucide-react` `^0.562.0`, `react-icons` `^5.5.0`
- **Lint & Qualidade:** `eslint` `^9.35.0` + `eslint-plugin-react-hooks` `^5.2.0` + `eslint-plugin-react-refresh` `^0.4.20`

---

## 3. Métricas de Inventário do Repositório `(MEDIDO Pós-Fase H)`

> Medições coletadas diretamente via filesystem PowerShell excluindo `node_modules`, `.git`, `dist`, `build`, `uploads` e `.vscode`.

| Escopo / Diretório | Quantidade de Arquivos | Contagem Real de Linhas | Finalidade |
|---|---:|---:|---|
| `backend/src` | 37 arquivos | 5.992 linhas | Servidor Express, rotas, controllers, services, middlewares, configs e `tenantScope` |
| `backend/prisma` | 11 arquivos | 1.470 linhas | `schema.prisma`, 6 arquivos SQL de migração, `seed.js`, `seedMovements.js`, `reset.js` |
| `backend/tests` | 1 arquivo | 497 linhas | Suíte E2E real [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) |
| `frontend/src` | 78 arquivos | 11.113 linhas | Páginas, portais, componentes, tabelas, formulários, stores Zustand, `apiClient` e hooks |
| **Subtotal Código + Dados + Testes** | **127 arquivos** | **19.072 linhas** | Núcleo executável completo da plataforma |
| `relatorios` + `README` + config raiz | 41 arquivos | — | Relatórios 01–14, `00_REGISTRO_DE_PROGRESSO.md`, `README.md`, manifests e prompts |
| **Total do Repositório (excluindo artefatos)** | **168 arquivos** | — | Árvore completa versionável |

---

## 4. Mapa de Arquivos por Camada `[IMPLEMENTADO (verificado)]`

### 4.1 Backend (`backend/`)
- **Entrypoint & Config (`backend/src/config/` + `index.js`):**
  - [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) — Inicialização Express 5, Helmet, CORS, Pino logger, 8 grupos de rotas, Error Handler e Graceful Shutdown.
  - [`prismaClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/prismaClient.js) — Singleton do `PrismaClient`.
  - [`cloudinaryConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) — `getTenantFolder(org, loja, subfolder)` + `uploadToCloudinary` (10s timeout) + `deleteFromCloudinary`.
  - [`multerConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/multerConfig.js) — Storage em disco local (5MB para imagens).
  - [`logger.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/logger.js) — Logger JSON estruturado via Pino.
- **Middlewares & Utils (`middlewares/` + `utils/`):**
  - [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) — JWT + `userCache` (60s) + validação ativa de `Organizacao` e `Loja`.
  - [`roleMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/roleMiddleware.js) — `permit(...roles)`.
  - [`validationMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/validationMiddleware.js) — `validateRequest(schema)` com checagem de obrigatórios, e-mail, preço e quantidade.
  - [`requestLogger.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/requestLogger.js) — Injeta `X-Request-Id` e mede `durationMs`.
  - [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) — `generateSlug`, `resolveReadScope` e `resolveWriteStore` com cabeçalho `X-Loja-Id`.
  - [`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js) & [`sanitizers.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js).
- **Domínios (`routes/`, `controllers/`, `services/`):**
  - **Auth:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js), [`authController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js), [`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js).
  - **Lojas / Filiais:** [`storeRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/storeRoutes.js), [`storeController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/storeController.js), [`storeService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js).
  - **Usuários & Equipe:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js), [`userController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js), [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js).
  - **Produtos & Planilhas:** [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js), [`productController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js), [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js), [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js).
  - **Categorias & Fornecedores:** [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js), [`categoryController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js), [`categoryService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js), [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js), [`supplierController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js), [`supplierService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js).
  - **Multipedidos & Estorno:** [`orderRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/orderRoutes.js), [`orderController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/orderController.js), [`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js).
  - **Movimentações, Relatórios & Desempenho:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js), [`movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js), [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js).

### 4.2 Frontend (`frontend/src/`)
- **Portais & Páginas (`pages/`):** [`Home.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Home.jsx), [`AdminLogin.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx), [`Auth.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx), [`Dashboard.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Dashboard.jsx), [`Lojas.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx), [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx), [`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx), [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx), [`Produtos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Produtos.jsx), [`Categorias.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Categorias.jsx), [`Fornecedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Fornecedores.jsx), [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx), [`Configuracoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Configuracoes.jsx).
- **Clientes HTTP & Estado (`services/api/`, `store/`, `hooks/`):** [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) (com injeção automática de `X-Loja-Id`), [`stores.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/stores.api.js), [`orders.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/orders.api.js), [`movements.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/movements.api.js), [`products.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/products.api.js), [`users.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/users.api.js), [`useTenantStore.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/store/useTenantStore.js), [`userStore.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/store/userStore.js), [`useAuthStore.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/store/useAuthStore.js), [`useDashboardData.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js).

---

## 5. Avaliação de Complexidade & Arquitetura `[IMPLEMENTADO (verificado)]`

- **Classificação:** `MEDIUM` com arquitetura SaaS Multi-Organização / Multi-Filial coerente, lock pessimista ordenado no PostgreSQL (`ORDER BY id ASC FOR UPDATE`) em multipedidos, isolamento estrito por `organizacaoId` / `lojaId` e trilha contábil imutável (`vendedorRefId` + snapshots).
- **Atenção Pós-Build Frontend:** O bundle `vite build` compilou **2.416 módulos** sem erros, porém emitiu aviso de chunk único (`dist/assets/index-Cy6oivvd.js` = **940,80 kB**, gzip `266,41 kB`), recomendando *code-splitting* por rotas (`React.lazy`).
