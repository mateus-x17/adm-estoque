# 📑 RELATÓRIO TÉCNICO 06 — CATÁLOGO DE REGRAS DE NEGÓCIO (RN-001 a RN-026)
## Projeto: Estoque.OS — Regras Verificadas e Cobertura Automatizada (Sincronizado Fase G)
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  
**Responsável Técnico:** Senior Software Architect / Lead Auditor  

---

## 1. Visão Geral das Regras de Negócio

Este catálogo reflete as regras efetivamente aplicadas pelo código-fonte na branch `feature/multitenant`, indicando a camada de imposição (banco de dados, serviço/middleware HTTP ou frontend) e sua cobertura pela suíte de auditoria em [`backend/tests/multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs).

---

## 2. Catálogo Estruturado de Regras de Negócio

### 2.1 Autenticação, Credenciais e Multi-Tenancy

#### [RN-001] Autenticação Obrigatória com Criptografia Irreversível
- **Descrição:** Senhas armazenadas e comparadas via Bcrypt (salt cost 10). Token JWT válido por `8h` carrega `id`, `role`, `empresaId`, `empresaSlug` e `empresaNome`.
- **Camada:** API / Service ([`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js), [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)).
- **Coberta por Testes:** `SIM` (Testes 1 e 2 de `multitenant_audit.test.mjs`).

#### [RN-002] Onboarding Público de Novo Estabelecimento (`POST /auth/register`)
- **Descrição:** O cadastro público cria uma nova `Empresa` (`slug` único, `ativo = true`) e automaticamente o usuário fundador com `role = 'ADMIN'` em transação atômica (`prisma.$transaction`), emitindo JWT inicial. Usuários operacionais comuns (`GERENTE`, `OPERADOR`) são criados internamente pelo `ADMIN` da loja via `POST /users`.
- **Camada:** API / Service ([`authService.js#registerStoreAndAdmin`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L142-L209)).
- **Coberta por Testes:** `SIM` (Teste 1 de `multitenant_audit.test.mjs`).

#### [RN-003] Limitação de Taxa em Autenticação e Cadastro (Rate Limit)
- **Descrição:** `POST /auth/login` limitado a **15 tentativas / 15 min / IP** (`loginLimiter`) e `POST /auth/register` limitado a **10 cadastros / 1 hora / IP** (`registerLimiter`).
- **Camada:** API / Middleware (`express-rate-limit` em [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L11-L32)). *(Obs.: armazenado em memória local do processo).*

#### [RN-022] Isolamento Estrito Multi-Tenant por `empresaId` e Pastas Cloudinary
- **Descrição:** Nenhum usuário pode ler, criar, editar, importar, exportar ou movimentar recursos de outro estabelecimento. Consultas cross-tenant retornam `404`. Imagens no Cloudinary ficam isoladas em `estoque-os/lojas/<slug>/produtos` e `.../usuarios`.
- **Camada:** Banco (`empresaId` + índices), API Services, Cloudinary ([`cloudinaryConfig.js#getTenantFolder`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js#L20-L28)).
- **Coberta por Testes:** `SIM` (Teste 3 de `multitenant_audit.test.mjs`).

#### [RN-023] E-mail Único por Estabelecimento & Seleção Multi-Loja no Login
- **Descrição:** O e-mail é único dentro de cada loja (`@@unique([empresaId, email])`), permitindo que um gerente/funcionário atue em lojas distintas usando o mesmo e-mail. Se não informar `lojaSlug` e suas credenciais coincidirem em múltiplas lojas ativas, o backend retorna `{ requiresStoreSelection: true, stores }` para seleção na tela de login.
- **Camada:** Banco (`schema.prisma`), API Service ([`authService.js#authenticateUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L40-L135)) e UI ([`LoginForm.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/LoginForm.jsx)).
- **Coberta por Testes:** `SIM` (Testes 1 e 2 de `multitenant_audit.test.mjs`).

---

### 2.2 Gestão de Usuários, RBAC e Soft Delete

#### [RN-004] Administração de Colaboradores Exclusiva de `ADMIN`
- **Descrição:** Apenas `ADMIN` da loja pode criar, listar, editar, alternar status ou excluir colaboradores (`/users*`). `GERENTE` e `OPERADOR` recebem `403`.
- **Camada:** API RBAC ([`userRoutes.js#L38`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L38)) e UI ([`Sidebar.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx)).
- **Coberta por Testes:** `SIM` (Teste 4 de `multitenant_audit.test.mjs`).

#### [RN-005] Proibição de Autoexclusão e Auto-Inativação
- **Descrição:** Nenhum usuário pode excluir ou inativar a própria conta em uso.
- **Camada:** API / Service ([`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L291-L293)).

#### [RN-006] e [RN-009] Proteção Integral do Último Administrador Ativo da Loja
- **Descrição:** A loja nunca pode ficar sem ao menos 1 usuário `ADMIN` com `ativo = true`. Tanto a exclusão (`deleteUser`), inativação (`toggleUserStatus`) quanto o rebaixamento (`updateUser`) bloqueiam a operação se `activeAdmins <= 1` naquela loja. **(`PROBLEMA B7` RESOLVIDO)**.
- **Camada:** API / Service ([`userService.js#L220-L227`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L220-L227), [`L300-L307`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L300-L307), [`L346-L353`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L346-L353)).

#### [RN-007], [RN-012], [RN-016], [RN-017], [RN-020] Soft Delete Automático com Preservação de Histórico
- **Descrição:** Ao chamar `DELETE /:id` em `Usuario`, `Produto`, `Categoria` ou `Fornecedor` que possua movimentações ou vínculos históricos, o backend automaticamente aplica Soft Delete (`ativo = false`, `softDeleted: true`), preservando auditoria e integridade referencial sem erros HTTP 500 ou bloqueios irreversíveis. Exclusão física só ocorre quando não há histórico vinculado. Todas as telas no frontend (`Usuarios.jsx`, `ModalProduto.jsx`, `Categorias.jsx`, `ModalFornecedor.jsx`, `FornecedorRow.jsx`) estão conectadas às rotas reais de `DELETE` e `PATCH /:id/status`.
- **Camada:** Banco (`ativo Boolean`), API Services e Frontend UI.
- **Coberta por Testes:** `SIM` (Teste 5 de `multitenant_audit.test.mjs`).

#### [RN-008] Bloqueio de Auto-Escalação de Cargo em `/users/me`
- **Descrição:** Usuários não-`ADMIN` recebem `403` se enviarem o campo `role` ao editar o próprio perfil.
- **Camada:** API / Controller ([`userController.js#L217-L219`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L217-L219)).

#### [RN-024] Bloqueio Imediato de Conta ou Loja Inativa e Invalidação de Cache
- **Descrição:** Usuários ou lojas com `ativo = false` têm o login bloqueado (`403`) e são rejeitados imediatamente nas rotas autenticadas (`authMiddleware.js`). Ao alternar status/cargo/exclusão, `invalidateUserCache` e `invalidateUserNamesCache` limpam o cache na hora. Produtos inativos também têm movimentações bloqueadas (`400`) em `adjustProductQuantity`.
- **Camada:** API Middlewares & Services.
- **Coberta por Testes:** `SIM` (Testes 2 e 5 de `multitenant_audit.test.mjs`).

#### [RN-026] Separação Estrita entre `GERENTE` e `ADMIN`
- **Descrição:** `GERENTE` administra todo o catálogo, fornecedores, planilhas (`.xlsx`/`.csv`) e vê histórico/métricas de vendas da equipe inteira da loja, mas é bloqueado (`403`) em `/users*` e em todas as rotas destrutivas `DELETE /products/:id`, `DELETE /categories/:id` e `DELETE /suppliers/:id` (exclusivas do `ADMIN`).
- **Camada:** API RBAC (`permit(...)`) e UI condicionais.
- **Coberta por Testes:** `SIM` (Teste 4 de `multitenant_audit.test.mjs`).

---

### 2.3 Catálogo, Estoque e Planilhas

#### [RN-010] e [RN-011] Gestão de Catálogo (`ADMIN`/`GERENTE`) vs. Exclusão (`ADMIN`)
- **Descrição:** Operadores (`OPERADOR`) apenas consultam catálogo ativo e movimentam estoque; `ADMIN` e `GERENTE` criam, editam, inativam/reativam e gerenciam planilhas; apenas `ADMIN` executa `DELETE`.
- **Camada:** API RBAC (`productRoutes.js`, `categoryRoutes.js`, `supplierRoutes.js`).

#### [RN-013] e [RN-014] Saldo Não-Negativo e Concorrência Atômica (`FOR UPDATE` + Idempotência)
- **Descrição:** Movimentações (`REPOSICAO`/`VENDA`, aceitando `ENTRADA`/`SAIDA`) usam lock pessimista `SELECT ... FOR UPDATE WHERE id AND "empresaId"` dentro de `prisma.$transaction`, impedindo *lost update* e saldo negativo, somado a `Idempotency-Key` (namespace por tenant) e debounce de 1.2s contra duplo clique. **(`PROBLEMA I1` RESOLVIDO)**.
- **Camada:** Banco (Row Lock) + API Service ([`productService.js#adjustProductQuantity`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L310-L419)).

#### [RN-015] Unicidade de Nome de Categoria por Loja
- **Descrição:** Duplicidade de nome de categoria é bloqueada apenas dentro da mesma loja via `@@unique([empresaId, nome])`.
- **Camada:** Banco (`schema.prisma`) e API Service (`categoryService.js`).

#### [RN-025] Importação e Exportação em Lote via Planilhas (`.xlsx` / `.csv`)
- **Descrição:** Motor nativo com `ExcelJS` (`POST /products/import`, `GET /products/export`, `GET /products/import/template`). Suporta arquivo até 2MB e máximo de **5.000 linhas**. Em `mode=preview`, retorna diagnóstico de linhas válidas/inválidas e lista de categorias/fornecedores a criar na loja. Em `mode=commit`, se existir ao menos 1 linha inválida, aborta atomicamente (`400`); se 100% válido, cria categorias/fornecedores ausentes e produtos em transação única (`201`).
- **Camada:** API Service ([`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js)) e UI ([`ModalImportarPlanilha.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalImportarPlanilha.jsx)).
- **Coberta por Testes:** `SIM` (Teste 6 de `multitenant_audit.test.mjs`).

---

### 2.4 Relatórios, Sigilo de Operador e Auditoria

#### [RN-018] e [RN-019] Sigilo Operacional para `OPERADOR` (Backend + Frontend)
- **Descrição:** Usuários `OPERADOR` não podem visualizar vendas ou estatísticas de colegas nem consultar a lista de vendedores. No backend:
  - `GET /movements/user-stats` e `GET /users/names` retornam `403` para `OPERADOR`.
  - `GET /movements` força `effectiveUsuarioId = req.user.id`, ignorando qualquer `?usuarioId` forjado na URL.
  - `GET /movements/sales-report` filtra apenas vendas do próprio operador (`scope: 'user'`), enquanto `ADMIN` e `GERENTE` obtêm `scope: 'store'`.
- **(`PROBLEMA B3` RESOLVIDO)**.
- **Coberta por Testes:** `SIM` (Teste 4 de `multitenant_audit.test.mjs`).

#### [RN-021] Exportação Nativa de Relatório de Vendas em PDF (`1m`, `6m`, `1y`)
- **Descrição:** Dashboard extrai métricas de vendas (faturamento, volume, ticket médio, top 5 produtos e timeline SVG em barras ou linhas) em janelas de 30, 180 e 365 dias com geração de página A4 via `ModalExportarRelatorio.jsx`, exibindo o estabelecimento ativo e o escopo (`Visão Geral da Loja` vs `Minhas Vendas (Operador)`).
- **Coberta por Testes:** `SIM` (API testada no Teste 4 para `1m`, `6m`, `1y`).

---

## 3. Matriz de Rastreabilidade Atualizada (Estado Real)

| ID | Regra de Negócio | Protegida no Backend/Banco? | Coberta por Teste? | Status |
| :--- | :--- | :---: | :---: | :--- |
| **RN-001..002** | Bcrypt, JWT 8h e Onboarding Loja+ADMIN | Sim | Sim | `IMPLEMENTADO / TESTADO` |
| **RN-003** | Rate limit em `/login` e `/register` | Sim (API em memória) | Não direto | `CORRIGIDO` |
| **RN-004..008** | RBAC Usuários, autoexclusão, último ADMIN | Sim | Sim | `IMPLEMENTADO / TESTADO` |
| **RN-009** | Bloqueio rebaixamento último ADMIN | Sim (`userService`) | Sim | `CORRIGIDO / TESTADO` |
| **RN-010..014** | Catálogo RBAC + `FOR UPDATE` + Idempotência | Sim (`$transaction` + Lock) | Sim | `CORRIGIDO / TESTADO` |
| **RN-015..017** | Unicidade por loja + Soft Delete automático | Sim | Sim | `IMPLEMENTADO / TESTADO` |
| **RN-018..019** | Sigilo total de `OPERADOR` no backend e UI | Sim (`movementService` + RBAC) | Sim | `CORRIGIDO / TESTADO` |
| **RN-020** | Exclusão real e toggle de status na UI | Sim (UI + API) | Sim | `CORRIGIDO / TESTADO` |
| **RN-021** | Relatório de Vendas PDF (`1m`, `6m`, `1y`) | Sim (`scope` por perfil) | Sim (API) | `IMPLEMENTADO / TESTADO` |
| **RN-022..026** | Multi-Tenant, Cache Invalidation, Planilhas e `GERENTE` | Sim | Sim (`6/6`) | `IMPLEMENTADO / TESTADO` |
