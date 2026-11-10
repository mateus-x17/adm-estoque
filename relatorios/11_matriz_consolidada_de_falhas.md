# 📑 RELATÓRIO TÉCNICO 11 — MATRIZ CONSOLIDADA DE FALHAS (PÓS-FASE H)
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  
**Base de Verificação:** Inspeção direta no código atual + suíte E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (`7/7`) + `eslint .` + `vite build`.

---

## 1. Falhas Básicas (`B1` a `B11`)

| Código | Descrição da Falha | Status Pós-Fase H | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **B1** | Segredos em logs, código ou respostas | `CONTROLADO` | `backend/.env` ignorado pelo Git; `errorHandler.js` retorna `{ error: message }`. *(Recomendação contínua: rotacionar credencial Neon se exposta externamente).* | Baixa |
| **B2** | Escalada por *mass assignment* | `RESOLVIDO / TESTADO` | `POST /auth/register` cria Organização nova intencionalmente; `PUT /users/me` bloqueia `role` com `403`; `createUser`/`updateUser` validam `Role`. | Nenhuma |
| **B3** | IDOR / Autorização apenas no frontend | `RESOLVIDO / TESTADO` | `tenantScope.js` isola `organizacaoId` (`404` cross-org) e trava `GERENTE`/`OPERADOR` em `req.user.lojaId`; `OPERADOR` recebe `403` em `/performance*`, `/users*`, `/orders/:id/cancel`; portal errado retorna `403`. | Nenhuma |
| **B4** | Validação de entrada e teto de texto | `PARCIAL / ABERTO` | `validationMiddleware.js` checa obrigatórios, e-mail, `preco >= 0`, `quantidade >= 0`; Multer limita `5MB`/`2MB`. Faltam limites `VarChar` no `schema.prisma` e regra mínima de senha. | Média |
| **B5** | Tratamento centralizado de erros | `RESOLVIDO / VERIFICADO` | `errorHandler.js` intercepta exceções sem retornar stack trace na resposta HTTP (`res.status(status).json({ error: message })`). | Baixa |
| **B6** | Deleção com violação de FK / 500 | `RESOLVIDO / TESTADO` | `Loja`, `Produto`, `Categoria`, `Fornecedor` usam Soft Delete automático; `Usuario` usa exclusão física real c/ `ON DELETE SET NULL` preservando `vendedorRefId`. | Nenhuma |
| **B7** | Autoexclusão / lockout do último `ADMIN` | `RESOLVIDO / TESTADO` | `userService.js` bloqueia autoexclusão e proteção contra remoção/rebaixamento do último `ADMIN`; `storeService.js` protege última loja ativa. | Nenhuma |
| **B8** | Frontend quebrando em estado nulo / rotas abertas | `RESOLVIDO / VERIFICADO` | `ProtectedRoute.jsx` aceita array `requiredRole={["ADMIN", "GERENTE"]}`; estados de loading e fallback seguros em páginas. | Nenhuma |
| **B9** | Chamadas HTTP fora do cliente único | `PARCIAL / MELHORADO` | `LoginForm.jsx` foi migrado; apenas [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx) (`L308`, `L360`) ainda contém `fetch()` direto fora de `apiClient.js`. | Baixa |
| **B10** | Listagens sem paginação / `limit=all` | `PARCIAL / ABERTO` | `/orders`, `/movements`, `/products`, `/users` paginam até 100 itens; `GET /movements?limit=all` ainda é usado por gráficos no frontend; `/categories` e `/suppliers` não paginam. | Média |
| **B11** | Headers, CORS, JWT & `localStorage` | `PARCIAL / ABERTO` | `Helmet` + `CORS(FRONTEND_URL)` + Bcrypt cost 10 + JWT `8h` ativos. Token permanece em `localStorage` via Zustand em vez de cookie `HttpOnly`. | Média |

---

## 2. Falhas Intermediárias (`I1` a `I11`)

| Código | Descrição da Falha | Status Pós-Fase H | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **I1** | Condição de corrida / *lost update* | `RESOLVIDO / TESTADO` | Lock ordenado `ORDER BY id ASC FOR UPDATE` em `orderService.js` (criação e estorno) + `FOR UPDATE` em `productService.adjustProductQuantity`. | Nenhuma |
| **I2** | Operações multi-passo sem transação | `RESOLVIDO / TESTADO` | Criação de Org+Loja+Admin, Multipedidos+Movimentos, Estorno+Devolução e Importação de Planilhas encapsulados em `prisma.$transaction`. | Nenhuma |
| **I3** | N+1 consultas ao banco | `RESOLVIDO / TESTADO` | `getUserStatsAggregated`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail` e `getSupplierStats` rodam SQL nativo agregado (`$queryRaw`). | Nenhuma |
| **I4** | Agregação em RAM no Node.js | `RESOLVIDO / MELHORADO` | KPIs, rankings e fornecedores agregados no PostgreSQL. Apenas gráficos de fluxo mensais no frontend ainda somam movimentos via `limit=all`. | Baixa |
| **I5** | Consulta sem projeção / timestamps | `PARCIAL / ABERTO` | `listProducts` ainda inclui objetos completos `categoria`/`fornecedor`; `Categoria` e `Fornecedor` não possuem `createdAt`/`updatedAt`. | Baixa |
| **I6** | Índices multi-tenant ausentes | `RESOLVIDO / VERIFICADO` | Índices compostos `[organizacaoId, lojaId, ...]` e `[organizacaoId, vendedorRefId, ...]` criados na migração `20261110_organizacao_multipedidos`. | Nenhuma |
| **I7** | Valores em ponto flutuante (`Float`) | `RESOLVIDO / TESTADO` | `Produto.preco`, `Pedido.valorTotal`, `ItemPedido` e `Movimento` usam `Decimal(10, 2)` (`numeric(10,2)`) com congelamento histórico. | Nenhuma |
| **I8** | TOCTOU sem lock no banco | `RESOLVIDO / TESTADO` | Checagem de produto ativo e saldo disponível feita dentro da transação após aquisição do lock `FOR UPDATE`. | Nenhuma |
| **I9** | Ausência de idempotência | `RESOLVIDO / TESTADO` | `Idempotency-Key` com namespace `${orgId}:${lojaId}:${key}` em `/orders` (`orderService.js`) e `/products/:id/adjust` (`productService.js`). | Nenhuma |
| **I10** | Falta de rate limit em auth/cadastro | `RESOLVIDO / VERIFICADO` | `loginLimiter` (25/15m) e `registerLimiter` (15/1h) acoplados em `authRoutes.js`. | Nenhuma |
| **I11** | Ausência de testes / CI | `MELHORADO / PARCIAL` | Suíte E2E `multitenant_audit.test.mjs` (`7/7` cenários reais); ainda faltam testes unitários isolados, E2E de browser (Playwright) e workflow CI/CD. | Média |

---

## 3. Falhas Avançadas (`A1` a `A8`)

| Código | Descrição da Falha | Status Pós-Fase H | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **A1** | Falta de cache e invalidação | `RESOLVIDO / TESTADO` | `userCache` (`60s`) e `namesCacheByScope` (`30s`) invalidados em criação/edição/transferência/exclusão de usuário e desativação de loja. | Baixa (single-node) |
| **A2** | Upload síncrono na requisição HTTP | `ENCONTRADO / ABERTO` | Upload ao Cloudinary ainda ocorre de forma síncrona durante criação/edição de usuários e produtos. | Média |
| **A3** | Integração externa sem timeout | `RESOLVIDO / VERIFICADO` | `uploadToCloudinary` usa `Promise.race` com timeout de **10s** e `fs.unlink` garantido no `finally`. | Nenhuma |
| **A4** | Pooling de conexão Neon em produção | `DEPENDE DE ENV` | Suporta `-pooler` na variável `DATABASE_URL` do Render/Vercel. | Média |
| **A5** | Estado em RAM / código morto | `PARCIAL / ABERTO` | `userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rate-limit` vivem em memória local (exigem Redis p/ 2+ instâncias); `index.js#L62` tem `loginLimiter` não usado. | Média |
| **A6** | Observabilidade / Correlation ID | `RESOLVIDO / VERIFICADO` | `Pino` JSON logger + header UUID `X-Request-Id` em `requestLogger.js`. | Baixa |
| **A7** | Health checks & Graceful Shutdown | `RESOLVIDO / VERIFICADO` | `/`, `/test-db` e rotina `SIGTERM`/`SIGINT` em `index.js` fechando HTTP e `prisma.$disconnect()` com timeout 10s. | Nenhuma |
| **A8** | Proxy reverso, Docker e Bundle Split | `PARCIAL / PAAS` | Hospedagem Vercel/Render gerencia TLS; sem `Dockerfile`; bundle Vite único (`940,80 kB`) precisa de *code-splitting*. | Baixa/Média |
