# 📑 RELATÓRIO TÉCNICO 07 — DIAGNÓSTICO: AUDITORIA DE CÓDIGO E PERFORMANCE
## Projeto: Estoque.OS — Auditoria Pós-Fase H + Referência de Performance
**Data da Atualização:** 2026-11-11  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Auditoria Estruturada Pós-Fase H, RH & Segurança Integral (`B1–B11`, `I1–I11`, `A1–A8`)

> Legenda: `RESOLVIDO (Verificado)` · `HARDENED / PARCIAL` · `PARCIAL / OBSERVAÇÃO` · `ENCONTRADO / ABERTO`.

### 1.1 Síntese das Principais Mudanças Verificadas
1. **`B3` / `B6` / `B7` (`RESOLVIDO`):** Isolamento estrito em dois níveis (`organizacaoId` + `lojaId`) aplicado em [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js); bloqueio imediato (`403`) para usuários `SUSPENSO`/`FERIAS` no [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js); exclusão física real de `Usuario` com arquivamento permanente em `RegistroDesligamento` (garantindo busca/filtro de desligados na página de Usuários com `Data de Demissão` mesmo com 0 vendas, `MAT-XXXXX (CANCELADA)` e relatório mensal); proteção da última loja ativa e do último `ADMIN ATIVO`.
2. **`B4` (`HARDENED / PARCIAL`):** Além de Multer e `validateRequest`, o endurecimento de segurança de 11/11/2026 implementou whitelist ancorada de extensões/MIME com nome randômico via `crypto.randomBytes(4)` em [`multerConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/multerConfig.js) e [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js), contenção de path traversal (`removeLocalUploadIfSafe` + `cleanupStoredMedia`), validação de `comprovanteUrl` (`sanitizeSafeUrl`), proteção contra Formula Injection em exportações (`sanitizeSpreadsheetCell`), senha mínima de `>= 6` caracteres no [`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) e [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js), além de `escapeHtml` e sanitização de URL (`formatImageUrl`) contra XSS nos PDFs/DOM do frontend. Como melhoria futura não bloqueante, `schema.prisma` mantém colunas `String` (`text` sem `VarChar`) e não exige regex de complexidade mista na senha.
3. **`B9` (`PARCIAL / OBSERVAÇÃO`):** `LoginForm.jsx` foi unificado em [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js); restam apenas **2 chamadas diretas `fetch()`** em [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx).
4. **`B10` (`PARCIAL / OBSERVAÇÃO`):** `/orders`, `/movements`, `/products` e `/users` paginam com teto máximo de 100 itens por página. Entretanto `GET /movements?limit=all` continua habilitado para alimentar gráficos client-side de fluxo ([`useDashboardData.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js)) e `/categories` / `/suppliers` retornam listas completas.
5. **`B11` (`HARDENED / PARCIAL`):** Endurecido com `trust proxy = 1`, fail-fast de `JWT_SECRET` (`< 16` chars em produção), `CORS` multi-origem normalizado, `limit: "1mb"` em JSON/URL-encoded, `dotfiles: "ignore"` em `/uploads`, rate limit global `apiLimiter` (`400 req / 15 min / IP`) em [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) (removida a declaração não utilizada `loginLimiter`), ocultação de `details` de `/test-db` e de erros internos `>= 500` em [`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js), além de verificação JWT estrita (`HS256`, `^Bearer\s+(\S+)$`, `userId > 0`, isolamento `try/catch` JWT vs Prisma) em [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js). Em `npm audit fix` (sem `--force`), o `frontend` zerou vulnerabilidades (`0`, com `react-router-dom ^7.18.5` e `vite ^7.3.8`) e o `backend` caiu de `14` para `5` advisories transitivos de CLI/dependências (`deepmerge-ts` via `@prisma/config` e `uuid` via `exceljs`, atualizando `express ^5.2.1` e `multer ^2.5.0`). Como risco arquitetural aceito para compatibilidade cross-domain Vercel ↔ Render, o JWT permanece em `localStorage` via Zustand (ao invés de cookies `HttpOnly`), com superfície de XSS mitigada por `escapeHtml` e sanitização de URL; recomenda-se também rotação preventiva de credenciais externas previamente trafegadas em ambiente de testes.
6. **`I1` / `I2` / `I7` / `I8` / `I9` (`RESOLVIDO`):** Módulo de Multipedidos & Comprovantes ([`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js)) utiliza `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, `Decimal(10, 2)` congelado, comprovação (`PIX`/NSU/anexo validado) e estorno atômico.
7. **`I11` (`MELHORADO / PARCIAL`):** Suíte oficial [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (`7/7` cenários E2E reais aprovados) somada à verificação unitária de regressão de segurança (`verify_security.mjs`), `npm --prefix frontend run lint` (`0` erros/avisos) e `vite build` (`2420` módulos); ainda sem suíte E2E de UI (Playwright) nem pipeline CI/CD automatizado.
8. **`A2` / `A5` (`ENCONTRADO / ABERTO`):** Upload ao Cloudinary continua síncrono dentro da requisição HTTP (com timeout rígido de 10s); caches (`userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rateLimit`) permanecem em memória local do processo Node.js (dependendo de Redis em arquitetura multi-instância).
9. **Conformidade com [`promptFuncExplic.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic.md) (`AUDITORIA CONCLUÍDA`):** `100%` das funções criadas ou alteradas na auditoria de segurança/estabilidade seguem o cabeçalho e a enumeração por passos exigidos; o código legado anterior não foi reescrito em respeito à Regra nº 9 (no `backend/src`, `38` arquivos / `157` funções nomeadas: `10/38` cabeçalho antes dos imports, `20/157` estritamente conformes e `91/157` com passos numerados; no `frontend/src`, `79` arquivos escaneados de `81` totais / `75` funções nomeadas de topo: `9/79` cabeçalho antes dos imports, `8/75` estritamente conformes, `19/75` com passos numerados e `54/75` sem comentário).

*(A matriz tabular item por item encontra-se no [`Relatório 11`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)).*

---

## 2. Diagnóstico de Performance: Baseline Histórica vs Estado Pós-Fase H

### 2.1 Medições Reais da Baseline Histórica `(MEDIDO em 08/11/2026 — Pré-Otimizações Fase A–H)`
*Os dados abaixo referem-se às medições reais executadas em `08/11/2026` antes da implementação do `userCache`, remoção do N+1, índices multi-tenant e módulo `/orders`:*

| Endpoint Inspecionado (Baseline 08/11) | Fria (Warmup) | Mediana (p50) | p95 | Concorrência 10 (p50) | Causa Raiz Identificada na Época |
|---|---:|---:|---:|---:|---|
| `GET /` | `21.0 ms` | `5.2 ms` | `7.8 ms` | `46.1 ms` | Resposta em memória |
| `GET /test-db` | `141.7 ms` | `141.2 ms` | `154.0 ms` | `893.0 ms` | Latência RTT WAN Brasil → Neon AWS `us-east-1` |
| `GET /users/names` | `559.4 ms` | `282.9 ms` | `290.8 ms` | `647.4 ms` | 2 roundtrips DB antes do cache |
| `GET /suppliers/stats` | `1045.7 ms` | `537.2 ms` | `661.6 ms` | `1531.2 ms` | Agregação em Node antes da query SQL nativa |
| `GET /products` | `944.6 ms` | `546.8 ms` | `612.0 ms` | `1529.7 ms` | Roundtrip `authMiddleware` + índices legados |
| `GET /movements/user-stats` | `1440.7 ms` | `718.4 ms` | `1012.6 ms` | `2232.9 ms` *(máx 3117.9 ms)* | N+1 queries sequenciais antes da query SQL |
| `GET /movements?limit=all` | `1020.3 ms` | `862.4 ms` | `1190.0 ms` | `1783.7 ms` | Full scan sem teto |

### 2.2 Status Atual Pós-Fase H `(Verificado vs NÃO MEDIDO)`
- **Otimizações já em vigor no código Pós-Fase H (`[IMPLEMENTADO (verificado)]`):**
  - `userCache` (TTL 60s) elimina 1 roundtrip WAN (~140 ms da baseline) por requisição autenticada em cache hit.
  - `namesCacheByScope` (TTL 30s) elimina consultas repetidas em dropdowns.
  - `/movements/user-stats`, `/movements/performance`, `/movements/performance/:refId` e `/suppliers/stats` executam agregação diretamente no PostgreSQL via `$queryRaw` indexado por `(organizacaoId, lojaId, data)` e `(organizacaoId, vendedorRefId, data)`.
- **Benchmark de Carga HTTP Pós-Fase H:** **`NÃO MEDIDO`** nesta entrega. A suíte E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) foi executada pós-correções de segurança e reordenação das 9 migrações contra o banco NeonDB ativo (`ep-bold-poetry-adxi7rof-pooler`), obtendo **7/7 cenários aprovados**; o deploy em produção (`https://adm-estoque.onrender.com/test-db`) também foi validado com HTTP `200` e `CORS` ativo para a Vercel.
- **Métrica de Bundle Frontend (`MEDIDO em 11/11/2026` via `vite build`):**
  - **2.420 módulos** transformados em `1m 42s`.
  - CSS: `48,39 kB` (`gzip: 9,39 kB`).
  - JS principal (`index-HtmucMcS.js`): **`1.020,48 kB`** (`gzip: 284,61 kB`) — com alerta nativo do Rollup/Vite sugerindo *code-splitting* para chunks acima de 500 kB.
