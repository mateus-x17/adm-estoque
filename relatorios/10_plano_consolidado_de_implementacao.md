# 📑 RELATÓRIO TÉCNICO 10 — PLANO CONSOLIDADO DE IMPLEMENTAÇÃO (CONCLUÍDO + ROADMAP P0/P1/P2)
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-11  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Resumo de Fases Já Concluídas (`Fases A → H + Hardening de Segurança`) `[IMPLEMENTADO (verificado)]`

1. **Fases A–F (Estabilização, Queries N+1, `Decimal`, Cache, PDF A4 & Confiabilidade):** Lock `FOR UPDATE`, `Idempotency-Key`, SQL nativo, `userCache` (60s), `cloudinaryConfig` (timeout 10s), relatórios SVG/A4, Logger `Pino` + `X-Request-Id` e `Graceful Shutdown`.
2. **Fase G (Multi-Tenant Inicial & Planilhas `.xlsx`/`.csv`):** Soft Delete em catálogo, engine `ExcelJS`, sigilo de `OPERADOR`, modais via `createPortal` e responsividade mobile.
3. **Fase H + UX/Comprovantes + Gestão RH, Matrícula & Histórico de Desligamentos:**
   - Migrações ordenadas cronologicamente (`20261110020000_organizacao_multipedidos`, `20261110030000_pedido_comprovantes`, `20261110040000_matricula_situacao_rh`, `20261110050000_registro_desligamento`) evoluindo `Organizacao → Lojas`, comprovantes (`PIX`, `NSU`, Cloudinary), `SituacaoFuncionario` + Matrícula única (`MAT-00001`) e tabela `RegistroDesligamento` (`dataAdmissao`, `dataDemissao`, `motivo`).
   - Portais `/admin/login` e `/login`, seletor global de filial (`X-Loja-Id`), transferência de `GERENTE` (`PATCH /users/:id/store`) e controle imediato de situação (`PATCH /users/:id/situation`).
   - Exclusão física definitiva de `Usuario` com seleção de **Data de Demissão**, mantendo `RegistroDesligamento` + snapshots (`MAT-XXXXX (CANCELADA)`), filtro de desligados na página `Usuarios.jsx`, exibição da Data de Demissão no popup `Info` (`ModalInfoUsuario.jsx`) e reemissão do Relatório Mensal (`GET /users/:refId/dismissal-report`).
   - Multipedidos transacionais (`/orders`), dashboard interativo (`1m/6m/1y`, estoque baixo clicável, `ModalMovimentacao.jsx`), confirmação estilizada (`ModalConfirmacao.jsx`) e painel [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx) com busca por Matrícula/ID.
4. **Hardening de Segurança & Resiliência Cloud (11/11/2026):**
   - `trust proxy = 1`, `apiLimiter` global, `JWT_SECRET` exigido no boot em produção, verificação JWT restrita a `HS256`, ocultação de erros internos `>= 500` em [`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js), senha mínima `>= 6`, âncora + MIME em uploads, `sanitizeSafeUrl` + `removeLocalUploadIfSafe`, neutralização de Formula Injection em `.xlsx`/`.csv`, proteção anti-XSS (`escapeHtml`) nos 4 PDFs A4, `npm audit fix` (`0` vulns no frontend) e espera `1000ms` com toast via [`serverToast.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/serverToast.js).

---

## 2. Roadmap Futuro Priorizado `[RECOMENDAÇÃO]`

| Prioridade | Ação Técnica Recomendada | Arquivo / Camada Alvo | Benefício Direto |
|---|---|---|---|
| **P0** | Rotacionar credenciais de banco/Cloudinary eventualmente compartilhadas fora de ambiente privado | Infraestrutura (Neon / Render `.env`) | Eliminação de risco residual de credencial (`B1`) |
| **P1** | Aplicar `React.lazy()` + `<Suspense>` por rota em `routes.jsx` | [`routes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) | Reduz chunk único de `1.020,48 kB` para `< 300 kB` no carregamento inicial |
| **P1** | Migrar as 2 chamadas `fetch()` restantes em `EditarItem.jsx` para `apiClient` | [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx) | Consistência de `X-Loja-Id`, toast `1000ms` e interceptor `401` (`B9`) |
| **P1** | Criar endpoint agregado `/movements/flow-summary` eliminando `?limit=all` no Dashboard | [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js), [`useDashboardData.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js) | Fim de payloads ilimitados (`B10`) |
| **P1** | Configurar pipeline CI (GitHub Actions) rodando `npm test`, `npm run lint` e `vite build` em PRs | `.github/workflows/` (`[INEXISTENTE]`) | Proteção contínua contra regressões (`I11`) |
| **P2** | Migrar JWT para cookie `HttpOnly` + Refresh Token e adicionar teto `@db.VarChar` no schema | Auth / Prisma (`B4`, `B11`) | Proteção extra contra XSS e limites rígidos de colunas |
| **P2** | Externalizar caches/rate-limit/idempotência para **Redis** + Upload direto assíncrono no Cloudinary (Signed Uploads) | Infra / Media (`A2`, `A5`) | Habilita escalabilidade horizontal (2+ containers Render) |
| **P2** | Alinhar gradualmente comentários legados ao padrão [`promptFuncExplic.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic.md) conforme evolução de cada módulo | Backend (`157` fns) & Frontend (`75` fns) | Padronização integral da documentação inline |
