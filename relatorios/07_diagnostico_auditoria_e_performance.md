# 📑 RELATÓRIO TÉCNICO 07 — DIAGNÓSTICO: AUDITORIA DE CÓDIGO E PERFORMANCE
## Projeto: Estoque.OS — Auditoria Pós-Fase H + Referência de Performance
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Auditoria Estruturada Pós-Fase H & RH (`B1–B11`, `I1–I11`, `A1–A8`)

> Legenda: `RESOLVIDO (Verificado)` · `PARCIAL / OBSERVAÇÃO` · `ENCONTRADO / ABERTO`.

### 1.1 Síntese das Principais Mudanças Verificadas
1. **`B3` / `B6` / `B7` (`RESOLVIDO`):** Isolamento estrito em dois níveis (`organizacaoId` + `lojaId`) aplicado em [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js); bloqueio imediato (`403`) para usuários `SUSPENSO`/`FERIAS` no [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js); remoção segura de `Usuario` mantendo snapshots de matrícula cancelada (`MAT-XXXXX (CANCELADA)`), `vendedorRefId` e relatório mensal de desligamento; proteção da última loja ativa e do último `ADMIN ATIVO`.
2. **`B4` (`PARCIAL / OBSERVAÇÃO`):** Multer e `validateRequest` bloqueiam uploads `> 5MB`/`2MB`, formatos inválidos, preços/quantidades negativos e e-mail malformado. Porém `schema.prisma` mantém colunas `String` (`text` sem `VarChar`) e não impõe regex de complexidade mínima de senha no backend.
3. **`B9` (`PARCIAL / OBSERVAÇÃO`):** `LoginForm.jsx` foi unificado em `apiClient.js`; restam apenas **2 chamadas diretas `fetch()`** em [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx).
4. **`B10` (`PARCIAL / OBSERVAÇÃO`):** `/orders`, `/movements`, `/products` e `/users` paginam com teto máximo de 100 itens por página. Entretanto `GET /movements?limit=all` continua habilitado para alimentar gráficos client-side de fluxo ([`StockFlowChart`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js)) e `/categories` / `/suppliers` retornam listas completas.
5. **`B11` (`PARCIAL / OBSERVAÇÃO`):** `helmet`, `cors` restrito a `FRONTEND_URL`, Bcrypt cost 10 e JWT `8h` estão ativos; token JWT segue armazenado em `localStorage` via Zustand (ao invés de cookies `HttpOnly`).
6. **`I1` / `I2` / `I7` / `I8` / `I9` (`RESOLVIDO`):** Módulo de Multipedidos & Comprovantes ([`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js)) utiliza `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, `Decimal(10, 2)` congelado, comprovação (`PIX`/NSU/anexo) e estorno atômico.
7. **`I11` (`MELHORADO / PARCIAL`):** Suíte oficial [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) expandida para cobrir **7 cenários E2E reais** (incluindo comprovação de pedido, preservação de posição no ranking, geração de matrícula, suspensão/reativação e `relatorioDesligamento`), porém sem testes unitários isolados nem suíte UI (Playwright) / CI/CD.
8. **`A2` / `A5` (`ENCONTRADO / ABERTO`):** Upload ao Cloudinary continua síncrono dentro da requisição HTTP (com timeout rígido de 10s); caches (`userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rateLimit`) permanecem em memória local do processo Node.js. Além disso, existe 1 declaração não utilizada `const loginLimiter` em [`index.js#L62`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L62) (a ativa está em [`authRoutes.js#L10`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L10)).

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
- **Benchmark de Carga HTTP Pós-Fase H:** **`NÃO MEDIDO`** nesta entrega. A suíte E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) obteve **7/7 aprovados** contra PostgreSQL Neon antes da rotação de credenciais; após a adição das migrações `20261110_pedido_comprovantes` e `20261110_matricula_situacao_rh`, foram verificados `npx prisma generate`, `node --check` em todos os arquivos `.js`/`.mjs`, `eslint .` e `vite build` (enquanto `npx prisma migrate deploy` local retornou `P1001` no host Neon configurado localmente).
- **Métrica de Bundle Frontend (`MEDIDO em 10/11/2026` via `vite build`):**
  - **2.418 módulos** transformados em `1m 28s`.
  - CSS: `47,46 kB` (`gzip: 9,27 kB`).
  - JS principal (`index-BMzMu_fe.js`): **`1.007,67 kB`** (`gzip: 281,01 kB`) — com alerta nativo do Rollup/Vite sugerindo *code-splitting* para chunks acima de 500 kB.
