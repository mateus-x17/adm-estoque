# 📑 RELATÓRIO TÉCNICO 11 — MATRIZ CONSOLIDADA DE FALHAS (PÓS-FASE H)
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-11  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  
**Base de Verificação:** Inspeção direta no código + auditoria de segurança (`npm audit`, AppSec e XSS) + suíte E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (**`7/7` cenários aprovados** contra Neon ativo `ep-bold-poetry-adxi7rof-pooler`) + `npx prisma migrate status` (`up to date`) + `eslint .` + `vite build` (`2.420` módulos) + verificação de produção Render (`200 OK`).

---

## 1. Falhas Básicas (`B1` a `B11`)

| Código | Descrição da Falha | Status Pós-Auditoria | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **B1** | Segredos em logs, código ou respostas | `CONTROLADO / ATENÇÃO INFRA` | `backend/.env` ignorado pelo Git; `JWT_SECRET` exigido no startup de produção (`index.js`); `errorHandler.js` e `/test-db` ocultam mensagens brutas em prod. *(Ação contínua de infraestrutura: rotacionar senha Neon/Cloudinary caso tenham sido exibidas fora de canal privado).* | Baixa |
| **B2** | Escalada por *mass assignment* | `RESOLVIDO / TESTADO` | `POST /auth/register` cria Organização nova intencionalmente; `PUT /users/me` bloqueia `role` com `403`; `createUser`/`updateUser` validam `Role`. | Nenhuma |
| **B3** | IDOR / Autorização apenas no frontend | `RESOLVIDO / TESTADO` | `tenantScope.js` isola `organizacaoId` (`404` cross-org) e trava `GERENTE`/`OPERADOR` em `req.user.lojaId`; `OPERADOR` recebe `403` em `/performance*`, `/users*`, `/orders/:id/cancel`; suspensos/férias bloqueados (`403`); `removeLocalUploadIfSafe` previne Path Traversal. | Nenhuma |
| **B4** | Validação de entrada, uploads, URLs e fórmulas | `RESOLVIDO / PARCIAL SCHEMA` | Multer (`multerConfig.js` & `productRoutes.js`) exige extensão ancorada + MIME type whitelist; senha mínima `>= 6` chars; body JSON max `1MB`; `sanitizeSafeUrl` e `formatImageUrl` bloqueiam `javascript:`/`data:`; `sanitizeSpreadsheetCell` neutraliza CSV/Excel Formula Injection. *(Resta apenas adicionar `@db.VarChar` no `schema.prisma`).* | Baixa |
| **B5** | Tratamento centralizado de erros | `RESOLVIDO / VERIFICADO` | `errorHandler.js` intercepta exceções sem retornar stack trace nem vazar erros de Prisma/PostgreSQL em respostas `>= 500` não operacionais, além de tratar `MulterError` (`400`) e `P2002`/`P2025` (`409`/`404`). | Nenhuma |
| **B6** | Deleção com violação de FK / 500 | `RESOLVIDO / TESTADO` | `Loja`, `Produto`, `Categoria`, `Fornecedor` usam Soft Delete automático; `Usuario` usa exclusão física real c/ `ON DELETE SET NULL` gravando `RegistroDesligamento` (`dataDemissao`), marcando `MAT-XXXXX (CANCELADA)` e gerando `relatorioDesligamento`. | Nenhuma |
| **B7** | Autoexclusão / lockout do último `ADMIN` | `RESOLVIDO / TESTADO` | `userService.js` bloqueia autoexclusão/auto-suspensão e proteção contra remoção/rebaixamento/suspensão do último `ADMIN ATIVO`; `storeService.js` protege última loja ativa. | Nenhuma |
| **B8** | Frontend quebrando em estado nulo / rotas abertas | `RESOLVIDO / VERIFICADO` | `ProtectedRoute.jsx` aceita array `requiredRole={["ADMIN", "GERENTE"]}`; `apiClient.js` possui espera de `1000ms` c/ `serverToast.js` para cold-start no Render. | Nenhuma |
| **B9** | Chamadas HTTP fora do cliente único | `PARCIAL / MELHORADO` | `LoginForm.jsx` foi migrado; apenas [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx) (`L308`, `L360`) ainda contém `fetch()` direto fora de `apiClient.js`. | Baixa |
| **B10** | Listagens sem paginação / `limit=all` | `PARCIAL / ABERTO` | `/orders`, `/movements`, `/products`, `/users` paginam até 100 itens; `GET /movements?limit=all` ainda é usado por gráficos no frontend; `/categories` e `/suppliers` não paginam. | Média |
| **B11** | Headers, CORS, JWT, XSS & `npm audit` | `MELHORADO / VERIFICADO` | `Helmet` + `CORS` multi-origem + `HS256` estrito + `escapeHtml` em todos os 4 geradores HTML/PDF (`document.write`) + `rel="noopener noreferrer"` + `npm audit fix` (`0` vulns no frontend; crítica `proxy-addr` e altas em `multer <=2.4.0` corrigidas no backend). JWT segue em `localStorage` via Zustand p/ compatibilidade Cross-Domain. | Baixa |

---

## 2. Falhas Intermediárias (`I1` a `I11`)

| Código | Descrição da Falha | Status Pós-Fase H | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **I1** | Condição de corrida / *lost update* | `RESOLVIDO / TESTADO` | Lock ordenado `ORDER BY id ASC FOR UPDATE` em `orderService.js` (criação e estorno) + `FOR UPDATE` em `productService.adjustProductQuantity`. | Nenhuma |
| **I2** | Operações multi-passo sem transação | `RESOLVIDO / TESTADO` | Criação de Org+Loja+Admin, Multipedidos+Movimentos, Estorno+Devolução e Importação de Planilhas encapsulados em `prisma.$transaction`. | Nenhuma |
| **I3** | N+1 consultas ao banco | `RESOLVIDO / TESTADO` | `getUserStatsAggregated`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail` e `getSupplierStats` rodam SQL nativo agregado (`$queryRaw`). | Nenhuma |
| **I4** | Agregação em RAM no Node.js | `RESOLVIDO / MELHORADO` | KPIs, rankings e fornecedores agregados no PostgreSQL. Apenas gráficos de fluxo mensais no frontend ainda somam movimentos via `limit=all`. | Baixa |
| **I5** | Consulta sem projeção / timestamps | `PARCIAL / ABERTO` | `listProducts` ainda inclui objetos completos `categoria`/`fornecedor`; `Categoria` e `Fornecedor` não possuem `createdAt`/`updatedAt`. | Baixa |
| **I6** | Índices multi-tenant ausentes | `RESOLVIDO / VERIFICADO` | Índices compostos `[organizacaoId, lojaId, ...]` e `[organizacaoId, vendedorRefId, ...]` criados na migração `20261110020000_organizacao_multipedidos`. | Nenhuma |
| **I7** | Valores em ponto flutuante (`Float`) | `RESOLVIDO / TESTADO` | `Produto.preco`, `Pedido.valorTotal`, `ItemPedido` e `Movimento` usam `Decimal(10, 2)` (`numeric(10,2)`) com congelamento histórico. | Nenhuma |
| **I8** | TOCTOU sem lock no banco | `RESOLVIDO / TESTADO` | Checagem de produto ativo e saldo disponível feita dentro da transação após aquisição do lock `FOR UPDATE`. | Nenhuma |
| **I9** | Ausência de idempotência | `RESOLVIDO / TESTADO` | `Idempotency-Key` com namespace `${orgId}:${lojaId}:${key}` em `/orders` (`orderService.js`) e `/products/:id/adjust` (`productService.js`). | Nenhuma |
| **I10** | Falta de rate limit & Proxy reverso | `RESOLVIDO / VERIFICADO` | `trust proxy = 1` + `apiLimiter` global (`400/15m`) em `index.js`; `loginLimiter` (25/15m) e `registerLimiter` (15/1h) em `authRoutes.js`. | Nenhuma |
| **I11** | Ausência de testes / CI | `MELHORADO / PARCIAL` | Suíte E2E `multitenant_audit.test.mjs` (`7/7` cenários reais); ainda faltam testes unitários isolados, E2E de browser (Playwright) e workflow CI/CD. | Média |

---

## 3. Falhas Avançadas (`A1` a `A8`)

| Código | Descrição da Falha | Status Pós-Fase H | Evidência Verificada no Código | Severidade Residual |
|---|---|---|---|---|
| **A1** | Falta de cache e invalidação | `RESOLVIDO / TESTADO` | `userCache` (`60s`) e `namesCacheByScope` (`30s`) invalidados em criação/edição/transferência/exclusão de usuário e desativação de loja. | Baixa (single-node) |
| **A2** | Upload síncrono na requisição HTTP | `ENCONTRADO / ABERTO` | Upload ao Cloudinary ainda ocorre de forma síncrona durante criação/edição de usuários e produtos. | Média |
| **A3** | Integração externa sem timeout | `RESOLVIDO / VERIFICADO` | `uploadToCloudinary` usa `Promise.race` com timeout de **10s** e `fs.unlink` garantido no `finally`. | Nenhuma |
| **A4** | Pooling de conexão Neon em produção | `RESOLVIDO / VERIFICADO` | Pooler `-pooler` ativo em produção Render/Neon (`ep-bold-poetry-adxi7rof-pooler`) com `&connect_timeout=15` documentado e validado via `/test-db` (`200 OK`). | Baixa |
| **A5** | Estado em RAM / código morto | `MELHORADO / SINGLE-NODE` | `loginLimiter` morto removido de `index.js`. `userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rate-limit` seguem em memória local (exigem Redis p/ 2+ instâncias). | Baixa/Média |
| **A6** | Observabilidade / Correlation ID | `RESOLVIDO / VERIFICADO` | `Pino` JSON logger + header UUID `X-Request-Id` em `requestLogger.js`. | Baixa |
| **A7** | Health checks & Graceful Shutdown | `RESOLVIDO / VERIFICADO` | `/`, `/test-db` (sem `details` em prod) e rotina `SIGTERM`/`SIGINT` em `index.js` fechando HTTP e `prisma.$disconnect()` com timeout 10s. | Nenhuma |
| **A8** | Proxy reverso, Docker e Bundle Split | `PARCIAL / PAAS` | `trust proxy = 1` configurado para Render; sem `Dockerfile`; bundle Vite único (`1.020,48 kB`, `2.420` módulos) precisa de *code-splitting*. | Baixa/Média |
