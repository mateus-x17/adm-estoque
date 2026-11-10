# 📑 RELATÓRIO TÉCNICO 08 — MELHORIAS IMPLEMENTADAS E PENDÊNCIAS POR COMPONENTE
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Melhorias Já Entregues por Componente (Fases A → H + UX/RH) `[IMPLEMENTADO (verificado)]`

| Componente / Arquivo | Ciclo | Melhoria Efetivada no Código Atual |
|---|---|---|
| [`schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) | C / G / H | Hierarquia `Organizacao → Loja`, `Pedido`/`ItemPedido`/`PedidoStatus` c/ comprovantes, enum `SituacaoFuncionario` + `matricula`/`telefone`/`dataAdmissao`, `Decimal(10, 2)` e snapshots pós-exclusão. |
| [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) & [`matriculaHelper.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/matriculaHelper.js) | H / RH | `resolveReadScope`/`resolveWriteStore` (`X-Loja-Id`), `formatMatricula`, `formatMatriculaDisplay` (`(CANCELADA)`), `parseMatriculaSearch` e `buildWorkedMonthsTimeline`. |
| [`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) | H | Criação multi-item atômica (`ORDER BY id ASC FOR UPDATE`), `Idempotency-Key`, preço congelado, comprovação (`PIX`/NSU/Cloudinary/`PATCH /:id/proof`), busca por matrícula e estorno (`cancelOrder`). |
| [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) | B / E / H | SQL nativo livre de N+1 e estornos (`estorno = false`), ranking preservando posição real mesmo em buscas, consulta por Matrícula/ID e cálculo de `mesesTrabalhados`. |
| [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) | A / D / H | Criação c/ Matrícula, `updateUserSituation` (`PATCH /:id/situation`), transferência `PATCH /:id/store`, e `deleteUser` devolvendo `relatorioDesligamento` mês a mês do período trabalhado. |
| [`storeService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js) | H | CRUD de filiais + Soft Delete automático + trava da última loja ativa da Organização. |
| [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) | G / H | Engine nativo `ExcelJS` (`.xlsx` / `.csv` BOM) com `preview` e `commit` em transação única escopada por filial. |
| [`cloudinaryConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) | D / G / H | Timeout de 10s + `unlink` local garantido + subpastas `estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>`. |
| [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) | D / G / H | `userCache` (TTL 60s) com `invalidateUserCache` + verificação de conta viva, `situacao = ATIVO`, Organização ativa e Loja ativa. |
| [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) | F / H | `Helmet`, `CORS`, Logger `Pino` + `X-Request-Id`, `Graceful Shutdown` (10s) e 8 prefixos de rota. |
| **Frontend Portais, UX & RH** | E / G / H | [`AdminLogin.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx), [`Auth.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx), [`ModalMensagem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/ModalMensagem.jsx) (fade-out), [`ModalConfirmacao.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/ModalConfirmacao.jsx), [`Dashboard.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Dashboard.jsx) (filtros `1m/6m/1y`, cliques), [`ModalMovimentacao.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalMovimentacao.jsx), [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx), [`ModalInfoUsuario.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalInfoUsuario.jsx), [`ModalRelatorioDesligamento.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalRelatorioDesligamento.jsx), [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx) e [`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx). |

---

## 2. Melhorias Residuais Recomendadas por Componente `[RECOMENDAÇÃO]`

1. **Frontend — Code-Splitting em [`routes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx):**
   - *Motivo:* O bundle principal atingiu `1.007,67 kB` no `vite build`. Adotar `React.lazy(() => import(...))` + `<Suspense>` para páginas administrativas (`DesempenhoVendedores`, `Lojas`, `Usuarios`, `Pedidos`) reduzirá o JS inicial carregado na Landing/Login.
2. **Frontend — Eliminar `fetch()` Direto em [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L308-L360):**
   - *Motivo:* Último componente com `fetch()` fora de [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) (Falha `B9`). Migrar para `apiClient` garante envio automático de `X-Loja-Id` e interceptor `401`.
3. **Backend — Limpeza de Código Morto em [`index.js#L62`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L62):**
   - *Motivo:* Remover `const loginLimiter` não utilizado em `index.js` (mantendo apenas os limitadores acoplados de `authRoutes.js`).
4. **Backend — Agregação Server-Side para `StockFlowChart` (remover `limit=all`):**
   - *Motivo:* Criar `GET /movements/flow-summary` agrupando entradas vs saídas por mês no PostgreSQL (eliminando `limit=all` no Dashboard — Falha `B10`).
5. **Segurança Avançada & Escala Multi-Instância:**
   - Migrar tokens JWT de `localStorage` para cookies `HttpOnly; SameSite=Strict; Secure` com `Refresh Token` (Falha `B11`).
   - Externalizar `userCache`, `namesCacheByScope`, `idempotencyStore` e `rate-limit` para **Redis** caso a API passe a escalar em 2+ containers no Render (Falha `A5`).
