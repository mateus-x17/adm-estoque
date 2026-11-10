# RELATÓRIO 02 — MAPEAMENTO DETALHADO DE MÓDULOS
**Projeto:** Estoque.OS  
**Data da Auditoria:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  

---

## 1. Módulos de Domínio do Backend (`backend/src`) `[IMPLEMENTADO (verificado)]`

### 1.1 Autenticação, Portais e Abertura de Rede (`/auth`)
- **Arquivos:** [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js), [`authController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js), [`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js).
- **Entradas:** `{ email, senha, organizacaoSlug?, lojaSlug?, portal? ('admin'|'loja') }` no login; `{ nomeOrganizacao, nomeLoja, slug?, cnpj?, telefone?, endereco?, nome, email, senha }` no registro.
- **Saídas:** JWT (`expiresIn: '8h'`) carregando `id`, `role`, `organizacaoId`, `organizacaoSlug`, `organizacaoNome`, `lojaId`, `lojaSlug`, `lojaNome`; seletor `{ requiresOrgSelection: true, organizations }` quando credenciais válidas coincidem em 2+ organizações ativas; ou lista `lojas` da rede no login de `ADMIN`.
- **Regras Críticas:**
  - Portal `admin` rejeita contas `GERENTE`/`OPERADOR` (`403`); portal `loja` orienta `ADMIN` a entrar por `/admin/login` (`403`).
  - Rate limit dedicado: `loginLimiter` (**25 req / 15 min**) e `registerLimiter` (**15 req / 1 h**).
  - Registro público cria `Organizacao` → `Loja` (1ª unidade) → `Usuario` (`role: 'ADMIN'`, `lojaId: null`) em `prisma.$transaction`.

### 1.2 Escopo Multi-Tenant e Lojas/Filiais (`/stores` & `tenantScope`)
- **Arquivos:** [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js), [`storeRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/storeRoutes.js), [`storeController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/storeController.js), [`storeService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js).
- **Funcionamento de `resolveReadScope(req)` e `resolveWriteStore(req)`:**
  - Para `GERENTE` e `OPERADOR`, **ignora** qualquer `?lojaId` ou `X-Loja-Id` forjado, travando estritamente em `req.user.lojaId`.
  - Para `ADMIN`: em leitura aceita `all`/`todas` (`isNetworkWide: true`) ou `X-Loja-Id`/`?lojaId` de uma loja da própria organização (`404` se pertencer a outra org); em escrita aceita filial ativa explícita ou resolve automaticamente se a rede tiver exatamente 1 filial ativa.
- **Governança de Filiais (`/stores`):** `GET` acessível para contexto; `POST`, `PUT`, `PATCH /:id/status` (com proteção contra desativar a última loja ativa e `invalidateUserCache()` imediato) e `DELETE /:id` (remoção física se vazia, ou Soft Delete automático se possuir histórico) exclusivos de `ADMIN`.

### 1.3 Equipe, Transferência de Filial e Exclusão Real (`/users`)
- **Arquivos:** [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js), [`userController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js), [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js).
- **Evolução Fase H:**
  - **Remoção do Softban em `Usuario`:** Não existe mais coluna `ativo` nem rota `PATCH /users/:id/status`. `DELETE /users/:id` executa **exclusão física real** (`prisma.usuario.delete`), apaga avatar do Cloudinary/disco, limpa `userCache`/`namesCacheByScope`, dispara `ON DELETE SET NULL` em `Pedido.usuarioId`/`Movimento.usuarioId` e preserva permanentemente `vendedorRefId`, `vendedorNomeSnapshot` e `vendedorEmailSnapshot`.
  - **Transferência de Filial (`PATCH /users/:id/store`):** `ADMIN` move um `GERENTE` ou `OPERADOR` para outra loja ativa da mesma Organização com invalidação imediata de cache (`invalidateUserCache`).
  - **Sigilo de Dropdown:** `GET /users/names` restringe a `ADMIN` (rede inteira ou filial filtrada via `X-Loja-Id`) e `GERENTE` (apenas sua filial), usando cache por escopo (TTL `30s`) e retornando `403` para `OPERADOR`.

### 1.4 Catálogo, Planilhas Nativas e Estoque Unitário (`/products`, `/categories`, `/suppliers`)
- **Arquivos:** [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js), [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js), [`categoryService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js), [`supplierService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js).
- **Soft Delete no Domínio Correto:** `Produto`, `Categoria` e `Fornecedor` mantêm `ativo: Boolean` e `PATCH /:id/status` (`ADMIN`/`GERENTE`). Chamadas `DELETE /:id` (exclusivas `ADMIN`) convertem automaticamente para `ativo = false` quando houver vínculo em `ItemPedido`, `Movimento`, `Pedido` ou `Produto`.
- **Planilhas (`ExcelJS`):** Importação em memória (`<= 2MB`, teto `5.000` linhas) em modo `preview` ou `commit` atômico na loja alvo via `resolveWriteStore`; exportação `.xlsx`/`.csv` respeitando filtro de rede ou filial via `resolveReadScope`.
- **Ajuste Avulso (`POST /products/:id/adjust`):** Lock `SELECT ... FOR UPDATE`, `Idempotency-Key` com namespace `${organizacaoId}:${lojaId}:${key}` + debounce `1.2s`, gravação de `precoUnitario`, `valorTotal`, `vendedorRefId` e snapshots no `Movimento`.

### 1.5 Multipedidos Transacionais e Estorno (`/orders`) `[IMPLEMENTADO (verificado)]`
- **Arquivos:** [`orderRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/orderRoutes.js), [`orderController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/orderController.js), [`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js).
- **Mecanismo Atômico (`createOrder`):**
  1. Agrupa produtos repetidos no carrinho e ordena `produtoId ASC`.
  2. Executa `SELECT ... WHERE id = ANY(...) AND "organizacaoId" = ... AND "lojaId" = ... ORDER BY id ASC FOR UPDATE` prevenindo *deadlocks* entre caixas concorrentes.
  3. Valida produto ativo e saldo suficiente (em `VENDA`), congela `precoUnitario` no `ItemPedido` e cria **espelho contábil** em `Movimento` dentro da mesma `prisma.$transaction`.
  4. Suporta `Idempotency-Key` (TTL `10 min` por `${orgId}:${lojaId}:${key}`).
- **Estorno (`cancelOrder`):** Exclusivo `ADMIN`/`GERENTE` da loja (`OPERADOR` recebe `403`). Bloqueia `Pedido` + `Produto`s via `FOR UPDATE`, valida estoque caso seja estorno de `REPOSICAO`, cria movimentações inversas marcadas `estorno = true` e grava `status = 'CANCELADO'`, `canceladoPorRefId`, `canceladoPorNome`, `canceladoEm`, `motivoCancelamento`.

### 1.6 Livro-Razão, Relatórios Executivos e Desempenho (`/movements`)
- **Arquivos:** [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js), [`movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js), [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js).
- **Exclusão Segura de Estornos:** Todas as agregações (`getUserStatsAggregated`, `getSalesReportData`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail` e `supplierService.getSupplierStats`) filtram `m.estorno = false` e `(p.id IS NULL OR p.status <> 'CANCELADO')`, impedindo inflação artificial de faturamento.
- **Auditoria do Ex-Vendedor:** `getSellerPerformanceRanking` e `getSellerPerformanceDetail` buscam por `vendedorRefId`, `vendedorNomeSnapshot` ou `vendedorEmailSnapshot`, exibindo comparativo simultâneo de `1m` (30d), `6m` (180d), `1y` (365d) e total histórico mesmo após a conta do usuário ter sido apagada da tabela `Usuario`.

---

## 2. Módulos e Interface do Frontend (`frontend/src`) `[IMPLEMENTADO (verificado)]`

| Camada / Componente | Arquivo Principal | Responsabilidade Real | Papel RBAC |
|---|---|---|---|
| **Roteamento** | [`routes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) | Portais `/admin/login`, `/login`, `/auth`, Landing `/`, área `/dashboard/*` com `<ProtectedRoute>` | Todos / Guards por cargo |
| **Cliente HTTP** | [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) | Bearer JWT + cabeçalho automático `X-Loja-Id` a partir de `tenant-scope`, blobs `.xlsx`/`.csv`, redirect 401 por portal | Todos |
| **Estado Global** | [`useTenantStore.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/store/useTenantStore.js) | Lista de filiais da Organização e `selectedLojaId` (`"all"` ou ID) sincronizados com `Sidebar` | `ADMIN` (seletor ativo) |
| **Shell & Navegação** | [`Sidebar.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx) | Menu responsivo + dropdown global de filial para `ADMIN` + logout limpando `tenant-scope` | Todos (itens filtrados) |
| **Dashboard & PDF** | [`Dashboard.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Dashboard.jsx), [`ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx) | KPIs da rede/loja, gráficos Recharts, modal PDF A4 (`1m`/`6m`/`1y`) com ranking de vendedores e fornecedores | Todos (`OPERADOR` sem stats de terceiros) |
| **Multipedidos** | [`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx), [`ModalPedidoMultiItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalPedidoMultiItem.jsx) | Carrinho multi-produto com validação de saldo, expansão de itens congelados e botão Estornar/Cancelar | Todos criam; `ADMIN`/`GERENTE` estornam |
| **Auditoria Equipe** | [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx) | Ranking melhor→pior, switch `includeDeleted`, busca direta por ID antigo `#id`, comparativo `1m/6m/1y`, ficha PDF | `ADMIN`, `GERENTE` |
| **Filiais & Equipe** | [`Lojas.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx), [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx) | CRUD de filiais + Soft Delete; CRUD de usuários, transferência rápida de loja (`PATCH /:id/store`) e exclusão real | Exclusivo `ADMIN` |
| **Catálogo & Ledger** | [`Produtos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Produtos.jsx), [`Categorias.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Categorias.jsx), [`Fornecedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Fornecedores.jsx), [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx) | Catálogo com Soft Delete, planilhas `.xlsx`/`.csv`, e livro-razão unitário com badge `ESTORNO` / `Ex-colaborador #ID` | Conforme RBAC |

---

## 3. Pontos de Acoplamento Críticos `[INFERIDO DO CÓDIGO]`
- **Dependência do Header `X-Loja-Id` no Admin:** Para operações de escrita (`POST /products`, `POST /orders`, `POST /products/import`), caso o `ADMIN` possua 2+ lojas ativas e esteja em visão consolidada (`"all"`), deve enviar `lojaId` no corpo/modal ou escolher uma loja no seletor (senão `resolveWriteStore` rejeita com HTTP `400`).
- **Acoplamento Residual de `EditarItem.jsx`:** Diferente dos módulos novos, [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx) ainda realiza `fetch()` direto em duas linhas (`L308` e `L360`) — devendo ser migrado para `apiClient` na manutenção futura (vide Relatório 08 / Falha B9).
