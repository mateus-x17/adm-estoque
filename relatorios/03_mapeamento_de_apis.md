# 📑 RELATÓRIO TÉCNICO 03 — MAPEAMENTO DE APIS, CONTRATOS E CADEIAS DE EXECUÇÃO
## Projeto: Estoque.OS — Catálogo Completo de Endpoints (Sincronizado Fase H)
**Data da Atualização:** 2026-11-11  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

---

## 1. Visão Geral da Superfície da API `[IMPLEMENTADO (verificado)]`

A API do **Estoque.OS** expõe **57 rotas HTTP registradas no Express** (`55` em `src/routes/*.js` + `2` na raiz `index.js`, além de estáticos em `USE /uploads`):
- **Camada Global (`index.js`):** `trust proxy = 1` (Render), `Helmet`, `CORS` com múltiplas origens normalizadas (`FRONTEND_URL`), parser JSON/urlencoded limitado a `1MB`, logger Pino + `X-Request-Id` e `apiLimiter` global (**400 req / 15 min / IP**).
- **Rotas Públicas (`4`):** `GET /`, `GET /test-db`, `POST /auth/login`, `POST /auth/register`.
- **Rotas Protegidas (`53`):** Exigem Bearer JWT válido em algoritmo `HS256` (`authMiddleware`), Organização ativa (`Organizacao.ativo = true`), situação funcional `ATIVO` (contas `SUSPENSO`/`FERIAS` recebem `403`) e, para não-`ADMIN`, Loja ativa (`Loja.ativo = true`). O isolamento segue a regra:
  - Cross-organização → HTTP **`404 Not Found`**.
  - Cross-loja para `GERENTE`/`OPERADOR` → ignorado (`req.user.lojaId` forçado no backend) ou **`403 Forbidden`**.
  - Contexto do `ADMIN` → header `X-Loja-Id` ou query `?lojaId=` (`"all"` para rede consolidada, ou ID numérico de uma filial da própria Organização).

---

## 2. Inventário Completo das 57 Rotas por Módulo

### 2.1 Raiz & Diagnóstico (`/`) — 2 rotas (+ `USE /uploads`)
1. **`GET /`** ([`index.js#L65`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L65)) — Healthcheck básico de subida do servidor Express (`200 text/html`).
2. **`GET /test-db`** ([`index.js#L68-L75`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L68-L75)) — Executa `SELECT NOW()` via Prisma contra o Neon PostgreSQL (`200 JSON` ou `500`).
- **Estático:** `USE /uploads` ([`index.js#L59`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L59)) — Fallback local para mídias quando Cloudinary não está ativo.

### 2.2 Autenticação & Portais (`/auth`) — 2 rotas
*Arquivo: [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js) → [`authController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js)*
3. **`POST /auth/login`** — Middlewares: `loginLimiter` (25 req/15m), `validateRequest({ required: ['email', 'senha'] })`.
   - **Entrada:** `{ email, senha, organizacaoSlug?, lojaSlug?, portal? ('admin'|'loja') }`.
   - **Saída:** `200 { token, user, lojas? }` ou `{ requiresOrgSelection: true, organizations }`. Erros: `400`, `401`, `403` (portal errado ou org/loja inativa), `429`.
4. **`POST /auth/register`** — Middlewares: `registerLimiter` (15 req/1h), `validateRequest({ required: ['nome', 'email', 'senha'] })`.
   - **Entrada:** `{ nomeOrganizacao, nomeLoja, slug?, cnpj?, telefone?, endereco?, nome, email, senha }`.
   - **Saída:** `201 { message, token, user, usuario, organizacao, lojas }` (criação transacional da Organização + 1ª Loja + `ADMIN`).

### 2.3 Lojas / Filiais da Organização (`/stores`) — 6 rotas
*Arquivo: [`storeRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/storeRoutes.js) → [`storeController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/storeController.js)*
5. **`GET /stores`** — Todos autenticados (`ADMIN` vê todas da rede c/ filtro `?status=`; equipe vê apenas a própria loja vinculada).
6. **`GET /stores/:id`** — Todos autenticados (`ADMIN` ou colaborador pertencente à loja).
7. **`POST /stores`** — `ADMIN` + `validateRequest({ required: ['nome'] })`. Cria nova filial (`201`) com slug único na Organização.
8. **`PUT /stores/:id`** — `ADMIN` + `validateRequest({ required: ['nome'] })`. Atualiza dados cadastrais da filial.
9. **`PATCH /stores/:id/status`** — `ADMIN` + `validateRequest({ required: ['ativo'] })`. Alterna `ativo`, bloqueia desativar a última filial ativa e invalida cache global.
10. **`DELETE /stores/:id`** — `ADMIN`. Remove fisicamente se sem usuários/produtos/movimentos/pedidos; caso contrário aplica Soft Delete (`softDeleted: true`).

### 2.4 Colaboradores, Situação Funcional, Desligados & Transferência (`/users`) — 11 rotas
*Arquivo: [`userRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js) → [`userController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js)*
11. **`GET /users/me`** — Autenticado. Perfil sanitizado (`matricula`, `telefone`, `situacao`, `dataAdmissao`) + objeto `organizacao` + `loja`.
12. **`PUT /users/me`** — Autenticado + `upload.single('imagem')` + `validateRequest(['nome', 'email'])`. Atualiza dados (incluindo `telefone`) e bloqueia alteração de `role` por não-`ADMIN` (`403`).
13. **`GET /users/names`** — `permit('ADMIN', 'GERENTE')` (`OPERADOR` bloqueado com `403`). Cache `30s` por `orgId:lojaId`.
14. **`POST /users`** — `permit('ADMIN')` + `upload.single('imagem')` + `validateRequest(['nome', 'email', 'senha', 'role'])`. Cria colaborador gerando **`matricula` (`MAT-00001`)**, aceitando `telefone`, `situacao` e `dataAdmissao`.
15. **`GET /users`** — `permit('ADMIN')`. Paginação, busca por Matrícula/nome/e-mail/ID, filtros por `role`, `situacao` (`ATIVO`, `SUSPENSO`, `FERIAS`, **`DESLIGADO`** ou `todos` via `RegistroDesligamento`) e `lojaId` (`X-Loja-Id`).
16. **`GET /users/:refId/dismissal-report`** — `permit('ADMIN')`. Reemite o Relatório Final de Desligamento (vendas mês a mês entre `dataInicio` e `dataDemissao`) pela Matrícula cancelada ou ID antigo.
17. **`GET /users/:id`** — `permit('ADMIN')`. Consulta detalhe dentro da Organização (`404` se cruzar org).
18. **`PUT /users/:id`** — `permit('ADMIN')` + `upload.single('imagem')` + `validateRequest(['nome', 'email', 'role'])`. Atualiza cadastro completo (`telefone`, `situacao`, `dataAdmissao`) e protege o último `ADMIN ATIVO`.
19. **`PATCH /users/:id/store`** — `permit('ADMIN')` + `validateRequest(['lojaId'])`. Transfere `GERENTE` ou `OPERADOR` entre filiais ativas e limpa `userCache`/`namesCache`.
20. **`PATCH /users/:id/situation`** — `permit('ADMIN')` + `validateRequest(['situacao'])`. Altera status (`ATIVO`, `SUSPENSO`, `FERIAS`), bloqueia suspensos/férias com `403` e limpa caches na hora.
21. **`DELETE /users/:id`** — `permit('ADMIN')`. Aceita `{ dataDemissao?, motivo? }` opcionais, grava `RegistroDesligamento` e snapshots, executa exclusão física definitiva (`prisma.usuario.delete`), apaga avatar Cloudinary e devolve `relatorioDesligamento` mês a mês (`MAT-XXXXX (CANCELADA)`).

### 2.5 Produtos, Planilhas & Ajuste Unitário (`/products`) — 12 rotas
*Arquivo: [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js) → [`productController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js)*
22. **`GET /products/count`** — Contagem de SKUs ativos na rede/loja (`resolveReadScope`).
23. **`GET /products/stats`** — KPIs agregados no PostgreSQL (estoque baixo `< 10`, valor total em `Decimal`, por categoria).
24. **`GET /products/export`** — `permit('ADMIN', 'GERENTE')`. Gera `.xlsx` ou `.csv` (UTF-8 BOM) via `ExcelJS`.
25. **`GET /products/import/template`** — `permit('ADMIN', 'GERENTE')`. Planilha modelo `.xlsx`/`.csv`.
26. **`POST /products/import`** — `permit('ADMIN', 'GERENTE')` + Multer memória (`<= 2MB`, `.xlsx`/`.csv`, até `5.000` linhas). Modos `preview` e `commit` atômico na loja (`resolveWriteStore`).
27. **`GET /products`** — Listagem paginada (`page`, `limit <= 100`, `search`, `categoriaId`, `fornecedorId`, `status`, `sortBy`).
28. **`GET /products/:id`** — Detalhe do SKU na Organização.
29. **`POST /products`** — `permit('ADMIN', 'GERENTE')` + `upload.single('imagem')` + `validateRequest(['nome', 'preco', 'quantidade'])`.
30. **`PUT /products/:id`** — `permit('ADMIN', 'GERENTE')` + `upload.single('imagem')` + `validateRequest(['nome', 'preco', 'quantidade'])`.
31. **`PATCH /products/:id/status`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['ativo'])` (Soft Delete/Reativação).
32. **`DELETE /products/:id`** — `permit('ADMIN')`. Remoção física ou Soft Delete automático se houver `ItemPedido` ou `Movimento`.
33. **`POST /products/:id/adjust`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')` + `validateRequest(['quantidade', 'tipo'])`. Ajuste unitário c/ lock `FOR UPDATE`, `Idempotency-Key` e snapshot de preço/vendedor/matrícula.

### 2.6 Categorias (`/categories`) — 6 rotas
*Arquivo: [`categoryRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/categoryRoutes.js) → [`categoryController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js)*
34. **`GET /categories/count`** — Contagem de categorias ativas por escopo.
35. **`GET /categories`** — Listagem filtrável por status/loja.
36. **`POST /categories`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['nome'])`.
37. **`PUT /categories/:id`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['nome'])`.
38. **`PATCH /categories/:id/status`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['ativo'])`.
39. **`DELETE /categories/:id`** — `permit('ADMIN')` (exclusão física ou Soft Delete se vinculada a produto).

### 2.7 Fornecedores (`/suppliers`) — 8 rotas
*Arquivo: [`supplierRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/supplierRoutes.js) → [`supplierController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js)*
40. **`GET /suppliers/stats`** — Estatísticas SQL nativas por fornecedor ignorando estornos e pedidos cancelados.
41. **`GET /suppliers`** — Listagem por Organização/Loja.
42. **`GET /suppliers/count`** — Contagem de fornecedores ativos.
43. **`GET /suppliers/:id`** — Detalhe do fornecedor.
44. **`POST /suppliers`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['nome'])`.
45. **`PUT /suppliers/:id`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['nome'])`.
46. **`PATCH /suppliers/:id/status`** — `permit('ADMIN', 'GERENTE')` + `validateRequest(['ativo'])`.
47. **`DELETE /suppliers/:id`** — `permit('ADMIN')` (exclusão ou Soft Delete automático).

### 2.8 Multipedidos, Comprovantes & Estorno (`/orders`) — 5 rotas
*Arquivo: [`orderRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/orderRoutes.js) → [`orderController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/orderController.js)*
48. **`GET /orders`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')`. Paginado (`<= 100`), filtra por código, comprovante, recebedor, cliente, nome/e-mail ou **Matrícula / ID (`vendedorRefId`)**, impondo sigilo a `OPERADOR`.
49. **`GET /orders/:id`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')`. Retorna itens congelados + dados de comprovante + movimentos espelho.
50. **`POST /orders`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')` + `uploadComprovante.single('comprovante')` + `validateRequest(['tipo', 'itens'])`. Cria pedido multi-item atômico com `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, congelamento de `precoUnitario` e gravação de comprovação (`formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl`, `recebidoPor`).
51. **`PATCH /orders/:id/proof`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')` + `uploadComprovante.single('comprovante')`. Atualiza ou anexa comprovante/confirmação de pagamento de um pedido `CONCLUIDO`.
52. **`POST /orders/:id/cancel`** — `permit('ADMIN', 'GERENTE')` (`OPERADOR` bloqueado com `403`). Estorna saldo de todos os itens e grava `Movimento` inverso com `estorno = true`.

### 2.9 Movimentações, Relatórios Executivos & Desempenho (`/movements`) — 5 rotas
*Arquivo: [`movementRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js) → [`movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js)*
53. **`GET /movements/sales-report`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')`. Retorna série temporal (`1m`/`6m`/`1y`), `scope` (`network`/`store`/`user`), `rankingVendedores` (com `nome`, `email`, `matriculaDisplay`) e `resumoFornecedores`.
54. **`GET /movements/performance`** — `permit('ADMIN', 'GERENTE')`. Ranking completo melhor→pior por período preservando posição real mesmo em buscas (`search` por **Matrícula**, ID, nome ou e-mail) e flag `includeDeleted`.
55. **`GET /movements/performance/:refId`** — `permit('ADMIN', 'GERENTE')`. Aceita **Matrícula (`MAT-000XX`)** ou ID antigo; retorna `1m`, `6m`, `1y`, total histórico, `mesesTrabalhados` (`dataInicio` a `dataTermino` / `dataDemissao`), gráfico 12 meses, top SKUs e pedidos recentes.
56. **`GET /movements/user-stats`** — `permit('ADMIN', 'GERENTE')`. Agregação SQL nativa por `vendedorRefId` para o Dashboard (ignora estornos/cancelados).
57. **`GET /movements`** — `permit('ADMIN', 'GERENTE', 'OPERADOR')`. Livro-razão unitário com sigilo `OPERADOR` e busca por **Matrícula / `vendedorRefId`**.
