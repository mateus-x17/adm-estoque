# 📑 RELATÓRIO TÉCNICO 06 — CATÁLOGO DE REGRAS DE NEGÓCIO
## Projeto: Estoque.OS — Regras Verificadas e Cobertura E2E (`RN-001` a `RN-031`)
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  

---

## 1. Visão Geral `[IMPLEMENTADO (verificado)]`

Todas as regras abaixo foram auditadas diretamente nos middlewares, serviços, schema Prisma e UI React, indicando cobertura na suíte automatizada [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (`7/7` cenários).

---

## 2. Catálogo Completo de Regras (`RN-001` a `RN-031`)

### 2.1 Autenticação, Portais e Multi-Organização
- **[RN-001] Criptografia Bcrypt & JWT:** Senhas hashed via `bcryptjs` (custo 10); JWT válido por `8h` com `{ id, role, organizacaoId, organizacaoSlug, organizacaoNome, lojaId, lojaSlug, lojaNome }`. *Cobertura: Cenário 1.*
- **[RN-002] Cadastro Público Corporativo (`POST /auth/register`):** Cria atomicamente `Organizacao`, 1ª `Loja` e fundador `ADMIN` (`lojaId: null`). *Cobertura: Cenário 1.*
- **[RN-003] Rate Limiting de Segurança:** `POST /auth/login` limitado a **25 tentativas / 15 min / IP** (`loginLimiter`) e `POST /auth/register` a **15 tentativas / 1h / IP** (`registerLimiter`) em [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js).
- **[RN-022] Isolamento Estrito Cross-Organização (`404`):** Toda consulta exige `organizacaoId` do JWT; tentativas cruzadas retornam `404`. Subpastas Cloudinary isoladas por `estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>`. *Cobertura: Cenário 2.*
- **[RN-023] Unicidade de E-mail por Organização & Seletor Multi-Org:** `@@unique([organizacaoId, email])`; credenciais válidas presentes em 2+ organizações ativas retornam `{ requiresOrgSelection: true, organizations }`. *Cobertura: Cenário 1.*
- **[RN-027] Portais Segregados (`portal: 'admin' | 'loja'`):** `/admin/login` bloqueia `GERENTE`/`OPERADOR` (`403`); `/login` orienta `ADMIN` a entrar pelo Portal Admin (`403`). *Cobertura: Cenário 1.*

### 2.2 Gestão de Filiais (`Loja`), Equipe & Exclusão Real com Preservação Histórica
- **[RN-004] Governança Exclusiva de `ADMIN` (`/users` & `/stores` escrita):** Criação/edição/exclusão de colaboradores e filiais retorna `403` para `GERENTE` e `OPERADOR`. *Cobertura: Cenários 1–2.*
- **[RN-005] Proibição de Autoexclusão:** Usuário autenticado não pode excluir a própria conta (`400`).
- **[RN-006] e [RN-009] Proteção do Último `ADMIN` da Organização:** Exclusão e rebaixamento via `PUT /users/:id` são bloqueados quando houver apenas 1 `ADMIN` na rede (`400`).
- **[RN-008] Bloqueio de Auto-Escalação em `/users/me`:** Usuário não-`ADMIN` enviando campo `role` recebe `403`.
- **[RN-024] Bloqueio Imediato de `Organizacao` / `Loja` Inativa:** `authMiddleware` e `authenticateUser` bloqueiam logins/rotas com `403` quando `Organizacao.ativo = false` ou `Loja.ativo = false` (para não-`ADMIN`). Alterações limpam `userCache`.
- **[RN-026] Separação Estrita entre `GERENTE` e `ADMIN`:** `GERENTE` tem acesso integral apenas à sua `lojaId` (incluindo cancelamento/estorno, importação e desempenho de seus vendedores), mas recebe `403` em `/users*`, `/stores*` escrita, `/dashboard/lojas` e rotas destrutivas `DELETE /products|categories|suppliers/:id`.
- **[RN-028] Transferência Instantânea de Colaborador entre Filiais (`PATCH /users/:id/store`):** Apenas `ADMIN` move `GERENTE`/`OPERADOR` para outra loja ativa da mesma Organização; cache invalidado na hora e relatórios futuros refletem imediatamente a nova loja. *Cobertura: Cenário 5.*
- **[RN-029] Exclusão Física Real de Colaborador Preservando Matrícula Cancelada & Antigo ID (`vendedorRefId`):** Não existe softban permanente em `Usuario`. `DELETE /users/:id` remove fisicamente o registro, limpa foto/caches, seta `usuarioId = NULL` nas tabelas históricas (`ON DELETE SET NULL`), grava `vendedorMatriculaSnapshot`, `vendedorDataAdmissaoSnapshot` e `vendedorDataDesligamentoSnapshot`, exibe visualmente `MAT-XXXXX (CANCELADA)` no histórico/relatórios e devolve `relatorioDesligamento` mês a mês do período trabalhado. *Cobertura: Cenário 4.*
- **[RN-030] Proteção da Última Filial Ativa (`/stores`):** `ADMIN` não pode desativar ou excluir a única loja ativa restante da Organização (`400`). Lojas com histórico submetidas a `DELETE` sofrem Soft Delete automático.
- **[RN-032] Matrícula Determinística & Bloqueio de Colaboradores Suspensos / Em Férias (`PATCH /users/:id/situation`):** Todo usuário recebe `matricula` única gerada do ID (`MAT-00001`), pesquisável em equipes, pedidos, movimentações e desempenho. Contas com `situacao = SUSPENSO` ou `FERIAS` têm login e requisições bloqueados com HTTP `403` imediatamente (com proteção contra auto-suspensão e suspensão do último `ADMIN ATIVO`). *Cobertura: Cenário 4.*

### 2.3 Multipedidos, Catálogo, Estoque & Auditoria de Desempenho
- **[RN-007], [RN-012], [RN-016], [RN-017], [RN-020] Soft Delete em Catálogo e Lojas:** `Produto`, `Categoria`, `Fornecedor` e `Loja` usam `ativo: Boolean` e fallback automático em `DELETE` quando há vínculo em `ItemPedido`, `Movimento`, `Pedido` ou `Produto`. Produtos inativos são bloqueados em `POST /products/:id/adjust` e `POST /orders` (`400`). *Cobertura: Cenário 6.*
- **[RN-010], [RN-011], [RN-015] Catálogo e Categorias por Filial:** `@@unique([lojaId, nome])` em `Categoria`; somente `ADMIN`/`GERENTE` alteram catálogo.
- **[RN-013] e [RN-014] Concorrência Atômica em Multipedidos e Ajustes (`FOR UPDATE` + Idempotência):** Lock ordenado `ORDER BY id ASC FOR UPDATE` previne deadlocks e *lost updates*; `Idempotency-Key` com TTL 10 min evita duplicação por rede/clique duplo; `precoUnitario` e `valorTotal` são congelados no ato em `Decimal(10, 2)`. *Cobertura: Cenário 3.*
- **[RN-018], [RN-019], [RN-021] Sigilo de `OPERADOR` & Ranking Transparente (`GERENTE`/`ADMIN`):** `OPERADOR` só vê suas próprias linhas em `/orders` e `/movements` (forjando `usuarioId`/`vendedorRefId` continua restrito a `req.user.id`), recebe `403` em `/users/names`, `/movements/user-stats` e `/movements/performance*`, e gera apenas seu relatório individual (`scope: 'user'`). *Cobertura: Cenário 4.*
- **[RN-025] Planilhas Nativas `.xlsx`/`.csv` por Filial:** Validação em `preview` e gravação atômica `commit` (`<= 2MB`, `5.000` linhas) na filial resolvida via `resolveWriteStore` (ou exportação de rede/loja via `resolveReadScope`). *Cobertura: Cenário 7.*
- **[RN-031] Estorno de Pedido & Exclusão de Cancelados nos Cálculos Financeiros:** `POST /orders/:id/cancel` (exclusivo `ADMIN`/`GERENTE`) cria contrapartidas com `estorno = true` e muda o pedido para `CANCELADO`. Todos os relatórios (`sales-report`, `performance`, `user-stats` e `suppliers/stats`) excluem `estorno = true` e `Pedido.status = 'CANCELADO'` dos totais faturados. *Cobertura: Cenários 3 e 4.*
