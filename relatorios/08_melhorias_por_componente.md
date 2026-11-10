# 📑 RELATÓRIO TÉCNICO 08 — MELHORIAS IMPLEMENTADAS E PENDÊNCIAS POR COMPONENTE
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  

---

## 1. Melhorias Já Entregues por Componente (Fases A → H) `[IMPLEMENTADO (verificado)]`

| Componente / Arquivo | Ciclo | Melhoria Efetivada no Código Atual |
|---|---|---|
| [`schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) | C / G / H | Hierarquia `Organizacao → Loja`, remoção do softban em `Usuario`, criação de `Pedido`/`ItemPedido`/`PedidoStatus`, `Decimal(10, 2)` e `vendedorRefId` + snapshots para auditoria pós-exclusão. |
| [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) | H | Funções `resolveReadScope` e `resolveWriteStore` isolando `GERENTE`/`OPERADOR` e dando seleção `"all"` ou filial `X-Loja-Id` ao `ADMIN`. |
| [`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) | H | Criação multi-item atômica com lock determinístico `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, preço congelado e estorno transacional (`cancelOrder`). |
| [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) | B / E / H | SQL nativo livre de N+1 e livre de estornos (`estorno = false`), `getSalesReportData` (`network`/`store`/`user`), ranking de vendedores e raio-X individual `1m/6m/1y` por antigo ID. |
| [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) | A / D / H | Exclusão física real limpando Cloudinary/cache e mantendo snapshots, transferência `PATCH /:id/store`, proteção ao último `ADMIN` e proibição de autoexclusão. |
| [`storeService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js) | H | CRUD de filiais + Soft Delete automático + trava da última loja ativa da Organização. |
| [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) | G / H | Engine nativo `ExcelJS` (`.xlsx` / `.csv` BOM) com `preview` e `commit` em transação única escopada por filial. |
| [`cloudinaryConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) | D / G / H | Timeout de 10s + `unlink` local garantido + subpastas `estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>`. |
| [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) | D / G / H | `userCache` (TTL 60s) com `invalidateUserCache` + verificação de conta viva, Organização ativa e Loja ativa. |
| [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) | F / H | `Helmet`, `CORS`, Logger `Pino` + `X-Request-Id`, `Graceful Shutdown` (10s) e 8 prefixos de rota. |
| **Frontend Portais & Operação** | E / G / H | [`AdminLogin.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx), [`Auth.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx), [`Sidebar.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx), [`Lojas.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx), [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx), [`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx), [`ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx). |

---

## 2. Melhorias Residuais Recomendadas por Componente `[RECOMENDAÇÃO]`

1. **Frontend — Code-Splitting em [`routes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx):**
   - *Motivo:* O bundle principal atingiu `978,01 kB` no `vite build`. Adotar `React.lazy(() => import(...))` + `<Suspense>` para páginas administrativas (`DesempenhoVendedores`, `Lojas`, `Usuarios`, `Pedidos`) reduzirá o JS inicial carregado na Landing/Login.
2. **Frontend — Eliminar `fetch()` Direto em [`EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L308-L360):**
   - *Motivo:* Último componente com `fetch()` fora de [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) (Falha `B9`). Migrar para `apiClient` garante envio automático de `X-Loja-Id` e interceptor `401`.
3. **Backend — Limpeza de Código Morto em [`index.js#L62`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L62):**
   - *Motivo:* Remover `const loginLimiter` não utilizado em `index.js` (mantendo apenas os limitadores acoplados de `authRoutes.js`).
4. **Backend — Agregação Server-Side para `StockFlowChart` (remover `limit=all`):**
   - *Motivo:* Criar `GET /movements/flow-summary` agrupando entradas vs saídas por mês no PostgreSQL (eliminando `limit=all` no Dashboard — Falha `B10`).
5. **Segurança Avançada & Escala Multi-Instância:**
   - Migrar tokens JWT de `localStorage` para cookies `HttpOnly; SameSite=Strict; Secure` com `Refresh Token` (Falha `B11`).
   - Externalizar `userCache`, `namesCacheByScope`, `idempotencyStore` e `rate-limit` para **Redis** caso a API passe a escalar em 2+ containers no Render (Falha `A5`).
