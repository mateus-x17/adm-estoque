# 📑 RELATÓRIO TÉCNICO 10 — PLANO CONSOLIDADO DE IMPLEMENTAÇÃO (CONCLUÍDO + ROADMAP P0/P1/P2)
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Resumo de Fases Já Concluídas (`Fases A → H + UX/RH`) `[IMPLEMENTADO (verificado)]`

1. **Fases A–F (Estabilização, Queries N+1, `Decimal`, Cache, PDF A4 & Confiabilidade):** Lock `FOR UPDATE`, `Idempotency-Key`, SQL nativo, `userCache` (60s), `cloudinaryConfig` (timeout 10s), relatórios SVG/A4, Logger `Pino` + `X-Request-Id` e `Graceful Shutdown`.
2. **Fase G (Multi-Tenant Inicial & Planilhas `.xlsx`/`.csv`):** Soft Delete em catálogo, engine `ExcelJS`, sigilo de `OPERADOR`, modais via `createPortal` e responsividade mobile.
3. **Fase H + UX/Comprovantes + Gestão RH & Matrícula:**
   - Migrações `20261110_organizacao_multipedidos`, `20261110_pedido_comprovantes` e `20261110_matricula_situacao_rh` evoluindo `Organizacao → Lojas`, comprovantes de pagamento/recebimento (`PIX`, `NSU`, anexo Cloudinary) e `SituacaoFuncionario` + Matrícula única (`MAT-00001`).
   - Portais `/admin/login` e `/login`, seletor global de filial (`X-Loja-Id`), transferência de `GERENTE` (`PATCH /users/:id/store`) e controle imediato de situação (`PATCH /users/:id/situation`).
   - Exclusão física definitiva de `Usuario` mantendo snapshots de Matrícula cancelada (`MAT-XXXXX (CANCELADA)`), `Data de Início`/`Término` e geração automática do Relatório Mensal de Desligamento (`ModalRelatorioDesligamento.jsx`).
   - Multipedidos transacionais (`/orders`), dashboard interativo (`1m/6m/1y`, estoque baixo com quantidades e navegação clicável, `ModalMovimentacao.jsx`), confirmação estilizada (`ModalConfirmacao.jsx`) substituindo alerts nativos e painel [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx) com busca por Matrícula/ID.

---

## 2. Roadmap Futuro Priorizado `[RECOMENDAÇÃO]`

| Prioridade | Ação Técnica Recomendada | Arquivo / Camada Alvo | Benefício Direto |
|---|---|---|---|
| **P0** | Rotacionar credenciais de banco que eventualmente tenham trafegado fora de ambiente privado | Infraestrutura (Neon / Render `.env`) | Eliminação de risco residual de credencial (`B1`) |
| **P0** | Confirmar string `-pooler` (PgBouncer) configurada em `DATABASE_URL` no Render | Infraestrutura Produção (`A4`) | Estabilidade sob picos simultâneos |
| **P1** | Aplicar `React.lazy()` + `<Suspense>` por rota em `routes.jsx` | [`routes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) | Reduz chunk único de `1.007,67 kB` para `< 300 kB` no carregamento inicial |
| **P1** | Migrar as 2 chamadas `fetch()` restantes em `EditarItem.jsx` para `apiClient` e remover `loginLimiter` morto de `index.js` | [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx), [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) | Consistência de `X-Loja-Id`, `401` e higiene (`B9`/`A5`) |
| **P1** | Criar endpoint agregado `/movements/flow-summary` eliminando `?limit=all` no Dashboard | [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js), [`useDashboardData.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js) | Fim de payloads ilimitados (`B10`) |
| **P1** | Configurar pipeline CI (GitHub Actions) rodando `npm test`, `npm run lint` e `vite build` em PRs | `.github/workflows/` (`[INEXISTENTE]`) | Proteção contínua contra regressões (`I11`) |
| **P2** | Migrar JWT para cookie `HttpOnly` + Refresh Token e adicionar complexidade mínima de senha + `VarChar` no schema | Auth / Prisma (`B4`, `B11`) | Proteção contra XSS e limites rígidos de colunas |
| **P2** | Externalizar caches/rate-limit/idempotência para **Redis** + Upload direto assíncrono no Cloudinary (Signed Uploads) | Infra / Media (`A2`, `A5`) | Habilita escalabilidade horizontal (2+ containers Render) |
