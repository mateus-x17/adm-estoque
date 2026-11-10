# FASE 8 — MATRIZ CONSOLIDADA DE FALHAS (ATUALIZADA PÓS-FASE G)
**Projeto:** Estoque.OS  
**Data da Atualização:** 10/11/2026  
**Branch Auditada:** `feature/multitenant`  
**Observação Metodológica:** Todos os status abaixo refletem inspeção direta nos arquivos atuais e execução de `npm --prefix backend test` (`multitenant_audit.test.mjs` — 6/6) + `vite build` + `eslint .`.  

---

## 1. LEGENDA DE STATUS

- `CORRIGIDO / TESTADO`: Corrigido no código-fonte e validado por execução/teste automatizado real.
- `CORRIGIDO / VERIFICADO`: Corrigido/verificado por leitura direta de código e compilação/lint.
- `PARCIAL / ABERTO`: Mitigado parcialmente, mas com limitação conhecida e documentada.
- `ENCONTRADO / ABERTO`: Falha ou ausência estrutural ainda pendente no código atual.

---

## 2. AUDITORIA DAS FALHAS BÁSICAS (`B1` A `B11`)

| Código | Descrição da Falha | Status Atual | Evidência / Localização Atual no Código | Severidade Residual |
|---|---|---|---|---|
| **B1** | Segredos em logs, código ou respostas | `CONTROLADO (PÓS-CLEANUP)` | `backend/.env` devidamente ignorado no Git (verificado com `git status --ignored`); [`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js) retorna apenas `{ error: message }`. Logs de token removidos de `EditarItem.jsx`. *(Recomendação contínua: rotacionar senhas que já transitaram fora do repo).* | Baixa |
| **B2** | Escalada de privilégio por *mass assignment* | `CORRIGIDO / TESTADO` | `authService.registerStoreAndAdmin` cria nova `Empresa` + fundador `ADMIN` intencionalmente; `userController.updateMe` lança `403` se não-`ADMIN` tentar enviar `role`; `userService.createUser`/`updateUser` validam whitelist `["ADMIN", "GERENTE", "OPERADOR"]`. | Resolvida |
| **B3** | Autorização ausente, só no frontend ou IDOR | `CORRIGIDO / TESTADO` | Multi-Tenancy (`empresaId`) isola 100% das queries (`404` em acesso cruzado); `OPERADOR` isolado no backend (`GET /movements` força `req.user.id`, `/users/names` e `/movements/user-stats` exigem `ADMIN|GERENTE`, `sales-report` aplica `scope: 'user'`); UI real conectada ao `DELETE`. | Resolvida |
| **B4** | Validação de entrada e limites de texto | `PARCIAL / ABERTO` | Multer limita uploads (5MB imagem / 2MB planilha até 5.000 linhas) e `validationMiddleware.js` valida obrigatórios, e-mail e números `>= 0`. Porém `schema.prisma` mantém campos `String` (`text` sem teto de tamanho) e não exige complexidade mínima de senha no cadastro. | Média |
| **B5** | Tratamento centralizado de erros | `CORRIGIDO / VERIFICADO` | [`backend/src/utils/errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js) captura `AppError` e erros gerais enviando `{ error: message }` sem expor `stack` na resposta HTTP. *(Obs.: erros não previstos do Prisma caem como 500 se não interceptados no service).* | Baixa |
| **B6** | Deleção com violação de FK / erro 500 | `CORRIGIDO / TESTADO` | `userService`, `productService`, `categoryService` e `supplierService` verificam vínculos e executam **Soft Delete automático** (`ativo = false`, `softDeleted: true`), mantendo integridade histórica. | Resolvida |
| **B7** | Autoexclusão ou lockout do último `ADMIN` | `CORRIGIDO / TESTADO` | [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) bloqueia autoexclusão, auto-inativação e remoção/inativação/rebaixamento do último `ADMIN` ativo da loja. | Resolvida |
| **B8** | Frontend quebrando com estado nulo / sem rotas protegidas | `CORRIGIDO / VERIFICADO` | `Sidebar.jsx` protegido contra usuário nulo; `routes.jsx` valida autenticação e `allowedRoles` por rota (incluindo exclusividade `ADMIN` em `/usuarios`); feedback de loading/vazio presente nas telas. | Resolvida |
| **B9** | Chamadas HTTP espalhadas fora do cliente único | `PARCIAL / MELHORADO` | `apiClient.js` centraliza JSON, `FormData`, download de Blob e interceptor 401. *(Obs.: `EditarItem.jsx` e `LoginForm.jsx` ainda contêm `fetch` direto para formulários/seleção de loja, embora padronizados com `VITE_API_BASE_URL`).* | Baixa |
| **B10** | Listagens sem paginação ou `limit=all` ilimitado | `PARCIAL / ABERTO` | `GET /products` e `GET /users` paginam até 100 por página. Porém `GET /movements` aceita `limit=all` (usado nos gráficos do Dashboard/Movimentações) e `GET /categories` / `GET /suppliers` não paginam. | Média |
| **B11** | Headers de segurança, JWT e armazenamento de token | `PARCIAL / ABERTO` | `helmet({ crossOriginResourcePolicy: "cross-origin" })` e `cors({ origin: FRONTEND_URL })` **ESTÃO ATIVOS** em [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L39-L48); Bcrypt usa custo 10 e JWT expira em `8h`. **Lacuna real:** token JWT permanece em `localStorage` no navegador (vulnerável se houver XSS), sem migração para cookie `HttpOnly`. | Média |

---

## 3. AUDITORIA DAS FALHAS INTERMEDIÁRIAS (`I1` A `I11`)

| Código | Descrição da Falha | Status Atual | Evidência / Localização Atual no Código | Severidade Residual |
|---|---|---|---|---|
| **I1** | Condição de corrida / *lost update* | `CORRIGIDO / TESTADO` | Lock pessimista `SELECT ... FOR UPDATE WHERE id AND "empresaId"` em `productService.adjustProductQuantity` dentro de `prisma.$transaction`. | Resolvida |
| **I2** | Operações multi-passo sem transação | `CORRIGIDO / TESTADO` | Criação de Loja+Admin (`authService`), ajuste de estoque (`productService`) e importação de planilhas (`productSpreadsheetService`) encapsulados em `prisma.$transaction`. | Resolvida |
| **I3** | N+1 consultas ao banco | `CORRIGIDO / TESTADO` | `movementService.getUserStatsAggregated` consolidado em query SQL nativa única com `JOIN` e filtro `u."empresaId"`. | Resolvida |
| **I4** | Agregação em memória RAM no Node.js | `CORRIGIDO / MELHORADO` | `/suppliers/stats` e `/products/stats` calculam agregados direto no PostgreSQL. *(Apenas `StockFlowChart` no frontend ainda pede `movements?limit=all`).* | Baixa |
| **I5** | Consulta sem projeção | `PARCIAL / ABERTO` | `listProductsPaginated` ainda traz relações completas `categoria` e `fornecedor`; `Categoria` e `Fornecedor` não têm `createdAt`/`updatedAt`. | Baixa |
| **I6** | Índices ausentes ou redundantes | `CORRIGIDO / MELHORADO` | Índices compostos multi-tenant criados (`[empresaId, ativo]`, `[empresaId, categoriaId, quantidade]`, `[empresaId, produtoId, data]`). *(2 índices menores redundantes em `Empresa.slug` e `Usuario[empresaId,email]` junto de `@unique`)*. | Baixa |
| **I7** | Preço em ponto flutuante (`Float`) | `CORRIGIDO / TESTADO` | `Produto.preco` migrado para `Decimal @db.Decimal(10, 2)` (`numeric(10, 2)` no PostgreSQL). | Resolvida |
| **I8** | TOCTOU sem lock no banco | `CORRIGIDO / TESTADO` | Validação de produto ativo e saldo disponível ocorre após `FOR UPDATE`. | Resolvida |
| **I9** | Ausência de idempotência | `CORRIGIDO / TESTADO` | `Idempotency-Key` com namespace do tenant (`${empresaId}:${key}`) e debounce 1.2s em `productService.js`. | Resolvida |
| **I10** | Falta de rate limiting no cadastro | `CORRIGIDO / TESTADO` | `registerLimiter` (10 req/h) e `loginLimiter` (15 req/15m) ativos em [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L11-L32). | Resolvida |
| **I11** | Ausência de testes automatizados e CI/CD | `PARCIAL / MELHORADO` | Criada suíte oficial [`backend/tests/multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (`npm --prefix backend test` — **6/6 baterias E2E aprovadas**). Ainda **faltam** testes unitários isolados, testes automatizados de **frontend** (Vitest/Playwright) e pipeline **CI/CD**. | Média |

---

## 4. AUDITORIA DAS FALHAS AVANÇADAS (`A1` A `A8`)

| Código | Descrição da Falha | Status Atual | Evidência / Localização Atual no Código | Severidade Residual |
|---|---|---|---|---|
| **A1** | Falta de cache e estratégia de invalidação | `CORRIGIDO / TESTADO` | `userCache` (60s) em `authMiddleware.js` e `namesCacheByTenant` (30s) em `userController.js`, com invalidação imediata em `update/toggleStatus/delete` (validado no Teste 5 -> 403 imediato). | Baixa (single-node) |
| **A2** | Trabalho lento síncrono no HTTP request | `ENCONTRADO / ABERTO` | Upload de fotos para Cloudinary em `createProduct`/`updateProduct`/`createUser`/`updateUser` ainda ocorre de forma síncrona durante o request HTTP. | Média |
| **A3** | Integração externa sem timeout | `CORRIGIDO / TESTADO` | `uploadToCloudinary` possui `Promise.race` com timeout rígido de **10s** e limpeza de arquivo temporário no `finally`. | Resolvida |
| **A4** | Pooling de conexão Neon em produção | `DEPENDE DE ENV` | Suporta string pooler PgBouncer na variável `DATABASE_URL`; exige confirmação de uso da URL `-pooler` nas variáveis do servidor de produção (Render). | Média |
| **A5** | Estado em memória impedindo escala horizontal | `PARCIAL / ABERTO` | `userCache`, `namesCacheByTenant`, `idempotencyStore`, `recentOperations` e `rate-limit` residem em RAM local do processo Node.js (exigirá Redis para múltiplas instâncias). Há também 1 declaração morta `loginLimiter` em [`index.js#L60`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L60). | Média |
| **A6** | Logs estruturados e Correlation ID | `CORRIGIDO / TESTADO` | `Pino` JSON logger + UUID `X-Request-Id` ativos em `requestLogger.js`. *(Ainda sem APM/Sentry externo)*. | Resolvida |
| **A7** | Health checks e Graceful Shutdown | `CORRIGIDO / TESTADO` | Rotas `/`, `/test-db` e rotina `shutdown('SIGTERM'/'SIGINT')` desconectando HTTP + Prisma com fallback de 10s em `index.js`. | Resolvida |
| **A8** | Proxy reverso, Docker e automação de deploy | `PARCIAL / PAAS` | Deploy atual delega TLS/CDN/Compressão para **Vercel + Render**; repositório ainda não possui `Dockerfile` / `docker-compose.yml` para portabilidade imediata on-premise. | Baixa/Média |
