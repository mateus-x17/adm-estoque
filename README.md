# Sistema de Gerenciamento de Estoque (Estoque.OS)

## 1. Visão Geral

### 1.1 O que é o sistema
O **Estoque.OS** é uma aplicação web fullstack **SaaS B2B Multi-Organização e Multi-Filial** desenvolvida para o controle de mercadorias, categorias, fornecedores, pedidos multi-item, livro-razão de movimentações e equipes por unidade. Cada cliente corporativo opera sob uma **Organização (`Organizacao`)** com múltiplas **Lojas/Filiais (`Loja`)** isoladas lógica e midiaticamente no Cloudinary, com portais separados de autenticação, exclusão real de colaboradores preservando histórico via `vendedorRefId`, importação/exportação nativa de planilhas (`.xlsx`/`.csv`) e auditoria executiva de desempenho.

### 1.2 Funcionalidades
- **Arquitetura `Organizacao → Lojas` (Rede & Múltiplas Filiais):** Abertura pública pelo Portal Admin (`/admin/login?mode=register`) criando Organização + 1ª Loja + usuário fundador `ADMIN`. O Administrador alterna dinamicamente na barra lateral entre visão consolidada da rede (`"Todas as Lojas"`, enviada via `X-Loja-Id`) ou uma filial específica, além de criar filiais em `/dashboard/lojas` e transferir gerentes/operadores entre unidades (`PATCH /users/:id/store`).
- **Portais Dedicados de Autenticação & RBAC (`ADMIN`, `GERENTE`, `OPERADOR`):**
  - **Portal Administrador (`/admin/login`):** Exclusivo para `ADMIN`, com acesso consolidado às filiais da sua Organização, gestão de lojas, equipe, transferência de gerentes, relatórios comparativos e deleções definitivas.
  - **Portal da Loja (`/login` e `/auth`):** Exclusivo para `GERENTE` e `OPERADOR` vinculados à sua filial (`ADMIN` é redirecionado ao `/admin/login`).
  - `GERENTE`: Visão gerencial da sua filial (estoque, fornecedores, planilhas `.xlsx`/`.csv`, cancelamento/estorno de pedidos, PDF e desempenho dos vendedores da loja), sem acesso a `/users`, `/stores` escrita ou rotas `DELETE`.
  - `OPERADOR`: Acesso operacional restrito — registra pedidos/movimentos na loja, mas visualiza **exclusivamente suas próprias vendas e pedidos** (bloqueado com `403` em métricas e listas de terceiros).
- **Exclusão Física Real de Usuários, Matrícula Única (`MAT-00001`), Data de Demissão & Gestão RH:** Diferente de produtos/categorias/fornecedores/lojas (que possuem Soft Delete `ativo: Boolean`), colaboradores possuem **`matricula` única derivada do ID (`MAT-00001`)**, `telefone`, `dataAdmissao` e `situacao` (`ATIVO` | `SUSPENSO` | `FERIAS` | `DESLIGADO` no histórico). Contas suspensas ou em férias têm login/acesso bloqueados com `403`, podendo ser reativadas ou demitidas no popup singelo **`Info`** de `/dashboard/usuarios` informando a **Data de Demissão** (padrão hoje) e motivo opcional. Ao demitir (`DELETE /users/:id`), `Usuario` e avatar são apagados mantendo o arquivamento permanente em **`RegistroDesligamento`** + snapshots marcados como **`MAT-XXXXX (CANCELADA)`** — permitindo filtrar por **Desligados** dentro da própria página `/dashboard/usuarios`, visualizar **Data de Admissão** e **Data de Demissão** no popup `Info` e gerar/reabrir o **Relatório Final de Desligamento (PDF A4)** filtrado pelos meses trabalhados.
- **Multipedidos Atômicos (`/orders`) & Estorno Transacional:** Criação de pedidos multi-item (`VENDA` ou `REPOSICAO`) com carrinhos dinâmicos, lock ordenado `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, preço unitário congelado em `ItemPedido`, campos comprobatórios (`formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl`, `recebidoPor`) e cancelamento/estorno supervisionado (`POST /orders/:id/cancel` para `ADMIN`/`GERENTE`) gerando contrapartidas `estorno = true`.
- **Auditoria & Desempenho de Vendedores (`/dashboard/desempenho`):** Ranking completo do melhor ao pior vendedor (`1m`, `6m`, `1y`), filtro universal por **Matrícula**, antigo ID, nome ou e-mail (inclusive ex-colaboradores com matrícula cancelada), identificação enxuta nos relatórios (`Nome`, `E-mail`, `Matrícula`), comparativo simultâneo mês/semestre/ano, meses trabalhados e ficha individual PDF A4.
- **Importação & Exportação Nativa de Planilhas (`.xlsx` / `.csv`):** Motor em Node.js via `exceljs` com planilha modelo, pré-validação linha a linha (`preview`) e gravação transacional atômica na filial escolhida (`commit`).
- **Dashboard & Relatórios Executivos em PDF A4:** Gráficos interativos (`Recharts`), métricas patrimoniais em `Decimal(10, 2)` e exportação PDF (`1m`, `6m`, `1y`) por rede ou filial contendo faturamento livre de estornos, ranking de vendedores e giro de fornecedores.
- **Customização Visual & Mobile:** Tema Claro/Escuro, modais via `createPortal` e interface Glassmorphism adaptada para celulares e desktops.

### 1.3 Valor entregue
O sistema elimina planilhas soltas, erros de saldo sob concorrência e quebras históricas por desligamento de vendedores, acelera o cadastro de catálogos por filial em minutos via `.xlsx`/`.csv` e entrega sigilo comercial entre operadores com governança consolidada para donos de redes multi-loja.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais
1. O sistema deve oferecer portais distintos (`/admin/login` e `/login`) com criação pública de nova `Organizacao` + 1ª `Loja` + `ADMIN` e suporte a seletor multi-organização caso credenciais válidas coexistam em múltiplas redes.
2. O sistema deve isolar 100% das consultas, gravações, planilhas e pastas Cloudinary (`estoque-os/organizacoes/<orgSlug>/lojas/<lojaSlug>/...`) por `organizacaoId` e `lojaId` (respeitando header `X-Loja-Id` apenas para `ADMIN`).
3. O sistema deve permitir ao `ADMIN` criar/editar/inativar lojas (`/dashboard/lojas`), gerir colaboradores (`/dashboard/usuarios`) com geração automática de Matrícula (`MAT-00001`), telefone, data de admissão e situação funcional (`ATIVO` | `SUSPENSO` | `FERIAS`), transferir gerentes/operadores de filial e executar demissão com exclusão física mantendo `vendedorRefId`, snapshots (`MAT-XXXXX (CANCELADA)`) e Relatório Final mensal do período trabalhado.
4. O sistema deve oferecer Soft Delete (`ativo: Boolean`) em Lojas, Produtos, Categorias e Fornecedores com fallback automático em `DELETE` caso haja histórico, bloqueando novos pedidos/movimentações em itens inativos (`400`) e confirmando ações via popup estilizado.
5. O sistema deve registrar **Multipedidos** (`Pedido` + `ItemPedido`) com lock ordenado `FOR UPDATE`, congelamento de preço unitário no ato, comprovação formal (`formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl`, `recebidoPor`) e cancelamento com estorno (`CANCELADO` + movimentos `estorno = true`) exclusivo para `ADMIN` e `GERENTE`.
6. O sistema deve fornecer página dedicada (`/dashboard/desempenho`) e endpoints `/movements/performance*` para ranquear vendedores do melhor ao pior (preservando a posição real em buscas) e pesquisar vendas de ativos, suspensos ou ex-funcionários pela **Matrícula** ou antigo ID em `1m`, `6m`, `1y` e por meses trabalhados.
7. O sistema deve permitir importação/exportação em lote via `.xlsx`/`.csv` por filial (`preview` e `commit`) e exportação executiva de relatórios PDF A4 livre de estornos/cancelados.
8. O sistema deve garantir sigilo absoluto do perfil `OPERADOR` em pedidos, movimentações e relatórios (`scope: 'user'`).

### 2.2 Requisitos Não Funcionais
- **Segurança:** Autenticação via JWT (`HS256` estrito, `expiresIn: '8h'`), hash BcryptJS (custo 10) com senha mínima de 6 caracteres, `JWT_SECRET` validado no startup em produção, `Helmet`, `CORS` com múltiplas origens normalizadas, `trust proxy` para Render, Rate Limit global (`400 req/15min`) + estrito no login (`25 req/15min`) e cadastro (`15 req/h`), supressão de erros internos de banco em respostas HTTP 500, validação ancorada + MIME em uploads (`.jpg`, `.png`, `.webp`, `.pdf`, `.xlsx`, `.csv`), proteção contra Path Traversal (`removeLocalUploadIfSafe`), Formula Injection em planilhas, XSS armazenado (`escapeHtml` em todos os PDFs A4 e validação de URLs em `sanitizeSafeUrl`/`formatImageUrl`), e invalidação imediata de cache (`invalidateUserCache`).
- **Performance:** Cache em memória por usuário (TTL 60s) e dropdown por escopo (TTL 30s), consultas SQL nativas sem N+1 e índices compostos indexados por `(organizacaoId, lojaId, ...)` e `(organizacaoId, vendedorRefId, ...)`.
- **Integridade Financeira:** Preços e totais congelados tipados como `Decimal(10, 2)` (`numeric(10,2)` no PostgreSQL).
- **Usabilidade:** SPA em React 19 + Vite + Tailwind CSS com tema escuro/claro e responsividade mobile aprimorada.

---

## 3. Regras de Negócio
- **Isolamento Multi-Organização e Multi-Filial:** Cross-organização retorna `404 Not Found`. `GERENTE` e `OPERADOR` ficam travados em sua `lojaId` mesmo tentando forjar `X-Loja-Id`.
- **RBAC por Portal e Cargo:**
  - Apenas `ADMIN` gerencia `/stores` (escrita), `/users*` (criação, transferência e exclusão real) e rotas destrutivas `DELETE /products|categories|suppliers/:id`.
  - `ADMIN` e `GERENTE` gerenciam catálogo da filial, planilhas `.xlsx`/`.csv`, cancelamento/estorno de pedidos (`/orders/:id/cancel`), ranking `/dashboard/desempenho` e métricas `/movements/user-stats`.
  - `OPERADOR` lança pedidos/ajustes e consulta exclusivamente seus próprios registros.
- **Exclusão Real de Usuários & Situação Funcional vs Soft Delete de Catálogo:** `Usuario` não possui softban permanente `ativo: false`; possui situação temporária `ATIVO` | `SUSPENSO` | `FERIAS` (contas suspensas ou em férias têm login e rotas bloqueados com `403`). Na demissão (`DELETE /users/:id`), a conta é excluída fisicamente enquanto `vendedorRefId`, snapshots (`MAT-XXXXX (CANCELADA)`, admissão e término) e vendas ficam preservados via `ON DELETE SET NULL`. `Loja`, `Produto`, `Categoria` e `Fornecedor` usam Soft Delete quando há histórico vinculado.
- **Estornos Fora do Faturamento:** Movimentações geradas por cancelamento recebem `estorno = true` e pedidos ficam `CANCELADO`; relatórios e rankings ignoram ambos automaticamente.
- **Governança:** Autoexclusão, auto-suspensão, remoção/rebaixamento/suspensão do último `ADMIN ATIVO` ou inativação da última `Loja` ativa da Organização são bloqueadas (`400`); não-administradores não alteram próprio cargo em `/users/me` (`403`).

---

## 4. Arquitetura de Software

### 4.1 Visão Geral
O projeto segue arquitetura desacoplada Cliente-Servidor RESTful Multi-Organização:
- **Backend:** Node.js (ESM) com Express 5 em camadas (`Routes -> Middlewares -> tenantScope -> Controllers -> Services -> Prisma ORM -> PostgreSQL / Cloudinary`), incluindo motor nativo de planilhas com `ExcelJS`.
- **Frontend:** Single Page Application (SPA) em React 19 + Vite, Tailwind CSS e Zustand (`useAuthStore`, `userStore`, `useTenantStore`, `useThemeStore`).

### 4.2 Stack Tecnológica
- **Frontend:** React 19, Vite 7 (`^7.3.8`), Tailwind CSS 3, Zustand 5, React Router DOM 7 (`^7.18.5`), Lucide React, React Icons, Framer Motion, Recharts 3.
- **Backend:** Node.js (ES Modules), Express.js 5 (`^5.2.1`), Prisma ORM 6 (`^6.16.2`), ExcelJS (`^4.4.0`), Cloudinary SDK (`^2.10.0`), Multer 2 (`^2.5.0`), Pino Logger, BcryptJS, JsonWebToken, Helmet, Express Rate Limit.
- **Banco de Dados:** PostgreSQL (Neon Database com Pooler PgBouncer).
- **Armazenamento de Mídias:** Cloudinary CDN em estrutura hierárquica por Organização e Loja (`estoque-os/organizacoes/<orgSlug>/lojas/<lojaSlug>/produtos` e `.../usuarios`).

---

## 5. Design da API

### 5.1 Inventário Completo de Rotas da Aplicação (57 Rotas HTTP + Estáticos)

#### Sistema e Diagnóstico (2 rotas públicas)
- `GET /` - Healthcheck básico de disponibilidade da API.
- `GET /test-db` - Diagnóstico de conectividade direta com o banco PostgreSQL Neon.

#### Autenticação & Portais (`/auth` - 2 rotas públicas)
- `POST /auth/login` - Autenticação em portal (`portal: 'admin' | 'loja'`, Rate Limit: 25 req/15min por IP). Aceita `organizacaoSlug` opcional; se o par e-mail/senha existir em 2+ organizações ativas, retorna `{ requiresOrgSelection: true, organizations }`. Bloqueia portal incorreto, organização ou loja inativa com `403`.
- `POST /auth/register` - Cadastro público de nova `Organizacao`, criação automática da 1ª `Loja` e do usuário fundador `ADMIN` (Rate Limit: 15 req/h por IP).

#### Lojas / Filiais da Organização (`/stores` - 6 rotas protegidas)
- `GET /stores` - Lista todas as lojas da Organização (`ADMIN`) ou apenas a loja vinculada (`GERENTE`/`OPERADOR`).
- `GET /stores/:id` - Consulta detalhes e contadores da filial dentro da Organização.
- `POST /stores` - Criação de nova filial com slug único (`ADMIN`).
- `PUT /stores/:id` - Atualização cadastral da loja (`ADMIN`).
- `PATCH /stores/:id/status` - Inativação lógica/reativação da loja protegendo última unidade ativa e invalidando cache (`ADMIN`).
- `DELETE /stores/:id` - Exclusão física se vazia ou Soft Delete automático se possuir vínculos históricos (`ADMIN`).

#### Usuários, Situação RH, Desligamentos, Transferência & Exclusão Auditável (`/users` - 11 rotas protegidas)
- `GET /users/me` - Dados cadastrais (`matricula`, `telefone`, `situacao`, `dataAdmissao`) e Organização/Loja do perfil autenticado (`Todos`).
- `PUT /users/me` - Atualização de nome, e-mail, telefone e avatar na subpasta da Organização/Loja (`Todos`; `role` bloqueada para não-ADMIN).
- `GET /users/names` - Lista em cache por escopo (TTL 30s) de vendedores ativos para filtros (`ADMIN`, `GERENTE` — `403` para `OPERADOR`).
- `GET /users` - Listagem paginada por rede ou loja (`X-Loja-Id`) com filtros `search` (Matrícula/nome/e-mail/ID), `role` e `situacao` (incl. `DESLIGADO` ou `todos` via `RegistroDesligamento`) (`ADMIN`).
- `GET /users/:refId/dismissal-report` - Reemite o Relatório Final de Desligamento mês a mês de um colaborador desligado pela Matrícula cancelada ou ID antigo (`ADMIN`).
- `POST /users` - Criação de `ADMIN`, `GERENTE` ou `OPERADOR` com geração automática de **`matricula` (`MAT-00001`)**, `telefone`, `situacao`, `dataAdmissao` e upload no Cloudinary (`ADMIN`).
- `GET /users/:id` - Consulta aos detalhes de colaborador da Organização (`ADMIN`).
- `PUT /users/:id` - Atualização cadastral/RH/cargo/loja com proteção contra rebaixamento ou inativação do último `ADMIN ATIVO` (`ADMIN`).
- `PATCH /users/:id/store` - Transferência rápida de `GERENTE` ou `OPERADOR` para outra filial ativa da rede com limpeza imediata de cache (`ADMIN`).
- `PATCH /users/:id/situation` - Alteração imediata de situação trabalhista (`ATIVO`, `SUSPENSO`, `FERIAS`), bloqueando suspensos/férias com `403` e limpando caches (`ADMIN`).
- `DELETE /users/:id` - Demissão aceitando `{ dataDemissao?, motivo? }` opcionais, gravando `RegistroDesligamento` e snapshots (`MAT-XXXXX (CANCELADA)`), apagando fisicamente `Usuario`/avatar e devolvendo **`relatorioDesligamento`** mês a mês (`ADMIN`).

#### Produtos, Estoque & Planilhas (`/products` - 12 rotas protegidas)
- `GET /products` - Listagem paginada por rede/loja com filtros `search`, `sortBy`, `categoriaId`, `fornecedorId` e `status` (`ativos`, `inativos`, `todos`) (`Todos`).
- `GET /products/count` - Contagem total de produtos ativos da rede/loja (`Todos`).
- `GET /products/stats` - KPIs agregados de estoque ativo em `Decimal(10, 2)` (`Todos`).
- `GET /products/export` - Exportação em `.xlsx` ou `.csv` com UTF-8 BOM (`ADMIN`, `GERENTE`).
- `GET /products/import/template` - Download da planilha modelo `.xlsx` ou `.csv` (`ADMIN`, `GERENTE`).
- `POST /products/import` - Upload via Multer em memória (`<= 2MB`, até `5.000` linhas) em `?mode=preview` ou `?mode=commit` atômico na filial selecionada (`ADMIN`, `GERENTE`).
- `GET /products/:id` - Detalhes de um produto da Organização (`Todos`).
- `POST /products` - Cadastro de produto na filial com upload em `estoque-os/organizacoes/<org>/lojas/<loja>/produtos` (`ADMIN`, `GERENTE`).
- `PUT /products/:id` - Atualização cadastral e substituição de mídia (`ADMIN`, `GERENTE`).
- `PATCH /products/:id/status` - Soft Delete / reativação (`ADMIN`, `GERENTE`).
- `DELETE /products/:id` - Exclusão física ou Soft Delete automático se possuir histórico em `ItemPedido`/`Movimento` (`ADMIN`).
- `POST /products/:id/adjust` - Ajuste unitário (`REPOSICAO`/`VENDA`) com `FOR UPDATE`, `Idempotency-Key` e snapshots (`Todos`).

#### Categorias (`/categories` - 6 rotas protegidas)
- `GET /categories/count` - Contagem de categorias ativas (`Todos`).
- `GET /categories` - Listagem por rede/loja e status (`Todos`).
- `POST /categories` - Criação única por loja (`@@unique([lojaId, nome])`) (`ADMIN`, `GERENTE`).
- `PUT /categories/:id` - Atualização de nome na filial (`ADMIN`, `GERENTE`).
- `PATCH /categories/:id/status` - Inativação/reativação lógica (`ADMIN`, `GERENTE`).
- `DELETE /categories/:id` - Exclusão ou Soft Delete automático (`ADMIN`).

#### Fornecedores (`/suppliers` - 8 rotas protegidas)
- `GET /suppliers/stats` - Métricas SQL agregadas por fornecedor ignorando `estorno = true` e pedidos cancelados (`Todos`).
- `GET /suppliers` - Listagem por rede/loja e status (`Todos`).
- `GET /suppliers/count` - Contagem de fornecedores ativos (`Todos`).
- `GET /suppliers/:id` - Detalhes de um fornecedor (`Todos`).
- `POST /suppliers` - Cadastro de fornecedor na loja (`ADMIN`, `GERENTE`).
- `PUT /suppliers/:id` - Atualização cadastral (`ADMIN`, `GERENTE`).
- `PATCH /suppliers/:id/status` - Soft Delete / reativação (`ADMIN`, `GERENTE`).
- `DELETE /suppliers/:id` - Exclusão ou Soft Delete automático (`ADMIN`).

#### Multipedidos, Comprovantes & Estorno (`/orders` - 5 rotas protegidas)
- `GET /orders` - Listagem paginada por rede/loja com busca por código, comprovante, recebedor, cliente, nome/e-mail ou **Matrícula / ID (`vendedorRefId`)** (`OPERADOR` enxerga apenas os próprios pedidos).
- `GET /orders/:id` - Detalhes do pedido, itens congelados, dados comprobatórios e histórico de movimentos espelho (`Todos`; com sigilo `OPERADOR`).
- `POST /orders` - Criação atômica de pedido multi-item (`VENDA`/`REPOSICAO`) com `ORDER BY id ASC FOR UPDATE`, `Idempotency-Key`, congelamento de `precoUnitario`, snapshot de matrícula e upload opcional de comprovante (`formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl`, `recebidoPor`) (`Todos`).
- `PATCH /orders/:id/proof` - Anexa foto/PDF ou confirma comprovação de pagamento/recebimento em pedidos existentes (`Todos` respeitando sigilo `OPERADOR`).
- `POST /orders/:id/cancel` - Cancelamento supervisionado com reversão atômica do saldo dos itens e geração de movimentos `estorno = true` (`ADMIN`, `GERENTE` — `403` para `OPERADOR`).

#### Movimentações, Relatórios Executivos & Desempenho (`/movements` - 5 rotas protegidas)
- `GET /movements/sales-report` - Relatório executivo (`1m`, `6m`, `1y`) em PDF A4 contendo série temporal, `scope` (`network`/`store`/`user`), ranking de vendedores (`Nome`, `E-mail`, `Matrícula`) e resumo de fornecedores livre de estornos (`Todos`).
- `GET /movements/performance` - Ranking completo do melhor ao pior vendedor (`ADMIN`, `GERENTE`), filtrável por período, busca por **Matrícula**, ID antigo, nome ou e-mail e flag `includeDeleted`.
- `GET /movements/performance/:refId` - Raio-X simultâneo de `1m`, `6m`, `1y`, meses trabalhados (`dataInicio` a `dataTermino`), top SKUs e pedidos de um colaborador ativo, suspenso ou desligado usando **Matrícula (`MAT-000XX`)** ou ID (`ADMIN`, `GERENTE`).
- `GET /movements/user-stats` - Estatísticas consolidadas por vendedor no Dashboard via SQL nativo (`ADMIN`, `GERENTE` — `403` para `OPERADOR`).
- `GET /movements` - Livro-razão unitário paginado com busca por **Matrícula / `vendedorRefId`** (`OPERADOR` restrito às próprias movimentações).

#### Arquivos Estáticos
- `USE /uploads` - Exposição de fallbacks locais caso o envio para o Cloudinary não esteja configurado.

### 5.2 Padrões Utilizados
- Comunicação via JSON (`multipart/form-data` para uploads e binários `.xlsx`/`.csv`).
- Status HTTP padronizados (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500`).
- Cabeçalhos padrão: `Authorization: Bearer <token>`, `X-Loja-Id: <lojaId | all>` e `Idempotency-Key: <uuid>`.

---

## 6. Estrutura do Projeto

### 6.1 Organização de Pastas (Backend & Testes)
```
backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20250918051748_init/
│   │   ├── 20251012223132_add_field_imagem_usuario/
│   │   ├── 20260601063115_upd_tabela_fornecedores/
│   │   ├── 20261022_alter_enum_reposicao_venda/
│   │   ├── 20261110010000_multitenant_softdelete/
│   │   ├── 20261110020000_organizacao_multipedidos/
│   │   ├── 20261110030000_pedido_comprovantes/
│   │   ├── 20261110040000_matricula_situacao_rh/
│   │   └── 20261110050000_registro_desligamento/
│   ├── reset.js
│   ├── schema.prisma
│   ├── seed.js
│   └── seedMovements.js
├── src/
│   ├── config/
│   │   ├── cloudinaryConfig.js
│   │   ├── logger.js
│   │   ├── multerConfig.js
│   │   └── prismaClient.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── movementController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   ├── storeController.js
│   │   ├── supplierController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── requestLogger.js
│   │   ├── roleMiddleware.js
│   │   └── validationMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── movementRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   ├── storeRoutes.js
│   │   ├── supplierRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── categoryService.js
│   │   ├── movementService.js
│   │   ├── orderService.js
│   │   ├── productService.js
│   │   ├── productSpreadsheetService.js
│   │   ├── storeService.js
│   │   ├── supplierService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   ├── matriculaHelper.js
│   │   ├── sanitizers.js
│   │   └── tenantScope.js
│   └── index.js
├── tests/
│   └── multitenant_audit.test.mjs
└── uploads/
    ├── produtos/
    └── usuarios/
```

### 6.2 Padrões Adotados
- **Separação de Responsabilidades:** Rotas -> Middlewares (`auth`, `permit`, `validateRequest`, `multer`) -> `tenantScope` -> Controllers -> Services -> Prisma ORM.
- **Tratamento Centralizado de Erros:** Classe `AppError` e `errorHandler` com logging estruturado em JSON via Pino e `X-Request-Id`.
- **Mídias Flexíveis:** Utilitário `getTenantFolder` garantindo subpastas hierárquicas por Organização/Loja no Cloudinary e helper `formatImageUrl` no frontend.

---

## 7. Instalação e Execução Local

Siga os passos abaixo para clonar, instalar e rodar o projeto na sua máquina.

1. Clone o repositório:
   ```bash
   git clone https://github.com/mateus-x17/adm-estoque/
   cd Estoque.OS
   ```

2. Configure as variáveis de ambiente do Backend (`backend/.env`, sem aspas duplas ao redor das URLs):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://usuario:senha@host:5432/banco?sslmode=require&connect_timeout=15
   JWT_SECRET=seu_jwt_secret_com_pelo_menos_16_caracteres
   FRONTEND_URL=http://localhost:5173

   # Cloudinary configuration (opcional em dev; se configurado, envia para estoque-os/organizacoes/<orgSlug>/lojas/<lojaSlug>/...)
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   ```

3. Instale dependências, aplique as migrações e popule as 2 Organizações (3 Lojas) de demonstração:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run reset:seed
   ```

   **Credenciais geradas pelo Seed Multi-Organização e Multi-Loja (Senha única padrão: `Password123!`):**
   - **Organização 1 (`grupo-techstock` — Grupo TechStock Varejo):**
     - **Portal Admin (`/admin/login`):** `admin@techstock.com` *(acessa `TechStock Centro` e `TechStock Shopping`)*
     - **Filial 1 (`techstock-centro` — TechStock Centro | Portal Loja `/login`):**
       - Gerente: `gerente1@techstock.com` (Fernanda Lima)
       - Operadores: `op1@techstock.com` (Rafael Mendes), `op2@techstock.com` (Beatriz Duarte)
       - **Colaborador Suspenso (Teste Reativação / Demissão):** `carlos.susp@techstock.com` (Carlos Henrique — `SUSPENSO`)
       - **Ex-Vendedor Desligado (Auditoria Matrícula CANCELADA):** `Marcos Antunes` *(excluído fisicamente ao final do seed mantendo vendas pesquisáveis por Matrícula/ID em `/dashboard/desempenho`)*
     - **Filial 2 (`techstock-shopping` — TechStock Shopping | Portal Loja `/login`):**
       - Gerente: `gerente2@techstock.com` (Thiago Azevedo)
       - Operadores: `op3@techstock.com` (Camila Rocha), `op4@techstock.com` (Diego Martins), `op5@techstock.com` (Juliana Costa — `FERIAS`)
   - **Organização 2 (`cyberforge-geek` — CyberForge Geek Store):**
     - **Portal Admin (`/admin/login`):** `admin@cyberforge.com` (Lucas Stark)
     - **Filial (`cyberforge-matriz` — CyberForge Matriz | Portal Loja `/login`):**
       - Gerente: `gerente1@cyberforge.com` (Marina Sato)
       - Operadores: `op1@cyberforge.com` (Bruno Wayne), `op2@cyberforge.com` (Sofia Banner), `peter.susp@cyberforge.com` (Peter Quill — `SUSPENSO`)

4. Inicie o servidor Backend e/ou execute a suíte de auditoria:
   ```bash
   npm run dev
   # Em outro terminal (para validar a API contra o banco configurado):
   npm test
   ```

5. Em outro terminal, configure e inicie o Frontend:
   ```bash
   cd frontend
   npm install
   # Certifique-se de que frontend/.env contenha: VITE_API_BASE_URL=http://localhost:5000
   npm run dev
   ```

6. Acesse no navegador: `http://localhost:5173`.

---

## 8. Evolução Arquitetural & Histórico de Maturidade

Esta seção documenta a trajetória de amadurecimento técnico do **Estoque.OS**, contrastando a sua concepção original com os ciclos de engenharia aplicados para elevar o sistema a um patamar corporativo estável, seguro e resiliente a alta concorrência.

### 8.1 Concepção Inicial do Sistema (Baseline)
O projeto nasceu como uma solução full-stack moderna para gestão de estoque e auditoria, estruturada com React 18, Node.js, Prisma ORM e PostgreSQL Neon. Em sua versão original, o sistema entregava:
- Arquitetura MVC com separação de rotas, middlewares, controllers e services.
- Controle de acesso granular baseado em papéis (`OPERADOR`, `GERENTE`, `ADMIN`).
- Persistência em nuvem com PostgreSQL Serverless e Cloudinary para mídia.
- Interface responsiva com dashboards e métricas agregadas.

*Diagnóstico de Crescimento:* Uma auditoria técnica aprofundada (executada conforme o protocolo unificado de engenharia) revelou que, sob cenários de concorrência massiva (+100 operadores simultâneos), o cálculo de saldo físico na memória da aplicação ficava vulnerável a *lost updates* e a rotas desprotegidas contra requisições repetitivas.

---

### 8.2 Ciclo de Amadurecimento: Fase A — Correções Críticas de Engenharia

Para mitigar riscos de integridade e segurança, o núcleo do sistema foi refatorado com as seguintes implementações de missão crítica:

#### 1. Concorrência Atômica com Bloqueio Pessimista (`FOR UPDATE`)
- **Problema Anterior:** A função de ajuste de estoque realizava a leitura do produto no Node.js via `findUnique`, calculava a soma/subtração na CPU e gravava o saldo com `update`. Sob concorrência de múltiplos operadores simultâneos, duas requisições liam o mesmo saldo na mesma fração de segundo, gerando perda de atualizações (*lost update*) ou saldo negativo.
- **Implementação:** A operação foi refatorada para utilizar bloqueio de linha pessimista no PostgreSQL (`SELECT ... FOR UPDATE`) dentro de uma transação interativa gerenciada (`prisma.$transaction`). A linha do produto é bloqueada a nível de banco durante a validação e escrita, serializando acessos simultâneos e impossibilitando matematicamente saldos negativos ou inconsistências contábeis.

#### 2. Idempotência Nativa e Debounce Anti-Duplo Clique
- **Problema Anterior:** Cliques múltiplos acidentais no botão de confirmação de saída geravam duplicidade de lançamentos no livro-razão e débitos repetidos no estoque.
- **Implementação:**
  - Suporte ao cabeçalho `Idempotency-Key` (ou `X-Idempotency-Key`) com cache em memória e expiração controlada (TTL de 10 minutos). Requisições repetidas com a mesma chave recebem imediatamente o resultado anterior sem novo débito no banco.
  - Implementação de trava de debounce automática de 1.2 segundos por operador e produto, bloqueando requisições gêmeas disparadas por duplo clique físico do mouse com resposta HTTP 429 amigável.

#### 3. Proteção contra Lockout do Administrador
- **Problema Anterior:** Não havia guarda impedindo que um administrador alterasse seu próprio papel para `OPERADOR` ou que o último administrador ativo fosse excluído ou rebaixado, gerando travamento permanente da governança do sistema.
- **Implementação:** O serviço de usuários (`userService.js`) passou a contar o número de administradores remanescentes antes de qualquer operação de rebaixamento ou deleção. Caso reste apenas 1 administrador ativo, a operação é rejeitada com status HTTP 400 e mensagem explicativa.

#### 4. Rate Limiting Rigoroso em Criação de Contas
- **Problema Anterior:** A rota de login possuía limitador de taxa, porém a rota pública de registro (`POST /auth/register`) estava desprotegida, expondo o servidor a ataques de negação de serviço (DoS) via processamento intensivo de hash bcrypt.
- **Implementação:** Acoplamento do `registerLimiter` via `express-rate-limit`, restringindo o volume a no máximo 10 cadastros por hora por endereço IP.

#### 5. Validação Automatizada de Não-Regressão
- Suíte de testes de integração implementada e validada com **100% de aprovação (5/5 cenários)**, certificando que saídas maiores que o saldo são rejeitadas, a idempotência preserva o estoque, a concorrência é serializada e o último administrador fica protegido.

---

### 8.3 Ciclo de Amadurecimento: Fase B — Refatoração Estrutural e Otimização de Consultas

Neste segundo ciclo de engenharia, o foco foi a eliminação de gargalos severos de banco de dados, alinhamento rigoroso à arquitetura de camadas e acabamento profissional da interface com o usuário:

#### 1. Eliminação do Gargalo de N+1 Queries em Estatísticas de Usuários
- **Problema Anterior:** A rota `GET /movements/user-stats` executava um agrupamento preliminar e disparava um loop com `Promise.all(users.map(...))`, executando $1 + 2N$ queries sequenciais no PostgreSQL. Em testes de carga sob concorrência, o endpoint registrou o pior tempo de resposta do sistema (**3.12 segundos**).
- **Implementação:** Toda a operação foi consolidada em uma única query SQL relacional nativa no PostgreSQL via `prisma.$queryRaw` com `JOIN` entre `Usuario`, `Movimento` e `Produto`. O banco de dados calcula contagens, totais de itens e o valor financeiro de vendas de uma só vez, devolvendo o resultado com ordenação por atividade.
- **Resultado:** Redução de dezenas de roundtrips WAN para exatamente **1 consulta única**, estabilizando o endpoint mesmo sob carga massiva de requisições concorrentes.

#### 2. Agregação SQL Nativa em Fornecedores e Desacoplamento da Camada de Serviço
- **Problema Anterior:** O controlador `supplierController.js` acessava diretamente a instância do Prisma sem utilizar o serviço dedicado `supplierService.js`, carregando a base inteira para a memória RAM do Node.js através de um triplo `include` (`fornecedores -> produtos -> movimentos`) e iterando arrays em múltiplos `forEach` aninhados.
- **Implementação:**
  - Migração de toda a persistência de dados para `supplierService.js`.
  - Agregação dos quantitativos de reposição e venda diretamente no PostgreSQL com `LEFT JOIN`, calculando os dados de todos os fornecedores em **~290ms**.
  - O controlador de fornecedores agora opera de forma 100% enxuta, apenas recebendo os parâmetros HTTP e delegando ao serviço de negócio.

#### 3. Conexão Real de Exclusão de Usuários na Interface e Preservação de Integridade
- **Problema Anterior:** A tela de Usuários (`Usuarios.jsx`) exibia um botão "Excluir" que apenas abria um modal informativo estático com mensagem de simulação, sem acionar a rota real de exclusão.
- **Implementação:**
  - Adicionado o método `deleteUser(id)` no cliente de API do frontend (`usersApi`).
  - O botão de exclusão agora solicita confirmação expressa do operador e dispara a chamada real `DELETE /users/:id`.
  - Proteção de integridade referencial: caso o usuário possua movimentações históricas atreladas, o backend rejeita com status HTTP 400 explicativo (*"Não é possível excluir o usuário X porque ele possui Y movimentações vinculadas"*), impedindo quebras de chave estrangeira no banco e garantindo a imutabilidade do livro-razão de auditoria.

#### 4. Resiliência do Cliente HTTP e Limpeza de Código Morto
- **Implementação:**
  - Interceptor de respostas adicionado ao `apiClient.js`: em caso de expiração de token (HTTP 401), o token corrompido é removido do `localStorage` e a aplicação redireciona automaticamente para a tela de autenticação, evitando travamento de estado inconsistente na SPA.
  - Exclusão com segurança do arquivo legado `frontend/src/dados.js` (código morto não importado).

#### 5. Validação Automatizada da Fase B
- Suíte de testes de integração executada via script autônomo validando agregação SQL em movimentações, agregação de fornecedores e bloqueio de violação de chave estrangeira com **100% de aprovação (4/4 testes)**.

---

### 8.4 Ciclo de Amadurecimento: Fase C — Banco de Dados, Precisão Decimal e Índices Compostos

Neste terceiro ciclo de engenharia, o foco recaiu sobre a solidez contábil e a otimização de baixo nível no banco de dados relacional:

#### 1. Migração de Ponto Flutuante para Ponto Fixo Decimal (`Decimal(10, 2)`)
- **Problema Anterior:** O campo `preco` na entidade `Produto` estava tipado como `Float` no Prisma (mapeado para `DoublePrecision` IEEE 754 de 64 bits no PostgreSQL). Em sistemas de controle patrimonial, operações aritméticas acumuladas com ponto flutuante binário geram anomalias clássicas de arredondamento (como `0.1 + 0.2 = 0.30000000000000004` ou dízimas em relatórios fiscais).
- **Implementação:** O schema Prisma foi atualizado para `Decimal @db.Decimal(10, 2)`. Foi executada a migração com conversão de tipos no PostgreSQL Neon, garantindo 10 dígitos com 2 casas decimais exatas para moedas.
- **Resultado:** Cálculos agregados de patrimônio total (`SUM(preco * quantidade)`) e valores de saída agora possuem determinismo contábil absoluto no banco de dados.

#### 2. Criação de Índices Compostos Estratégicos
- **Problema Anterior:** As consultas paginadas de movimentações com ordenação por data (`produtoId + data`) e filtros de catálogo por categoria e saldo em estoque executavam varreduras sequenciais (*Sequential Scan*) parciais, onerando a CPU com o aumento de linhas.
- **Implementação:**
  - Adicionado o índice composto `@@index([produtoId, data])` no model `Movimento`.
  - Adicionado o índice composto `@@index([categoriaId, quantidade])` no model `Produto`.
- **Resultado:** Consultas de histórico por produto e buscas de estoque baixo por categoria agora utilizam *Index Scan* direto no plano de execução do PostgreSQL, estabilizando os tempos de busca mesmo com milhares de registros.

#### 3. Validação Automatizada da Fase C
- Suíte de testes automatizados via `scratch/test_fase_c.js` aprovada com **100% de sucesso (4/4 testes)**, confirmando o tipo `numeric(10, 2)` no `information_schema`, a presença ativa dos índices compostos no `pg_indexes` e a integridade da macroagregação de patrimônio.

---

### 8.5 Ciclo de Amadurecimento: Fase D — Cache em Memória e Resiliência de Mídia

Neste quarto ciclo de engenharia, a prioridade foi a eliminação da latência repetitiva de rede WAN e a proteção contra bloqueios em integrações externas:

#### 1. Camada de Cache de Autenticação no Middleware (`authMiddleware.js`)
- **Problema Anterior:** O banco de dados do projeto está hospedado na AWS Virgínia (us-east-1). Toda e qualquer requisição privada disparava uma consulta `findUnique` para checar a existência do usuário, adicionando uma latência base de **~141ms** a cada clique de qualquer operador, mesmo para dados estáticos de sessão que não mudam a cada segundo.
- **Implementação:** Implementada camada de cache em memória local com TTL de 60 segundos e limpeza periódica. Ao validar o JWT, a aplicação consulta primeiramente o cache in-memory. Caso presente, atende a validação em **< 5ms**.
- **Invalidação Atômica:** Qualquer operação de atualização (`updateUser`, `updateMe`) ou exclusão (`deleteUser`) dispara imediatamente `invalidateUserCache(userId)`, expurgando o usuário do cache para refletir mudanças de permissão ou status sem delay.
- **Resultado:** Redução de ~140ms no tempo de resposta percebido de 100% das rotas privadas autenticadas do sistema.

#### 2. Cache em Memória para Dropdown de Usuários (`GET /users/names`)
- **Problema Anterior:** O seletor de usuários presente nos filtros de histórico de movimentações e painéis executava uma consulta remota a cada renderização de tela, consumindo ~280ms de latência WAN.
- **Implementação:** Cache em memória com TTL de 30 segundos acoplado ao controlador `getUserNames`.
- **Resultado:** O endpoint passa a responder em **0.16ms** a partir do cache, permitindo abertura instantânea de dropdowns na interface.

#### 3. Resiliência de Integração e Proteção de Timeout no Cloudinary
- **Problema Anterior:** O upload de fotos de produtos aguardava a resposta do Cloudinary (EUA) de forma síncrona sem timeout explícito. Em caso de oscilação na rede internacional, a requisição ficava travada por dezenas de segundos, prendendo sockets do Node.js.
- **Implementação:** O utilitário `uploadToCloudinary` foi refatorado com `Promise.race` estabelecendo um timeout rígido de 10 segundos com mensagem amigável, garantindo que o bloco `finally` sempre expurgue arquivos temporários do disco local (`fs.unlink`).

#### 4. Validação Automatizada da Fase D
- Suíte de testes automatizados via `scratch/test_fase_d.js` aprovada com **100% de sucesso (4/4 testes)**, comprovando a aceleração de autenticação de 1341ms para 3.22ms, a eficácia da invalidação atômica, o dropdown em 0.16ms e a interceptação de timeout.

---

### 8.6 Ciclo de Amadurecimento: Fase F — Confiabilidade, Observabilidade e Rastreabilidade Integral

Neste sexto ciclo de engenharia, a aplicação recebeu camadas de observabilidade estruturada corporativa, encerramento resiliente e alinhamento documental:

#### 1. Injeção de Correlation ID (`X-Request-Id`) de Ponta a Ponta
- **Problema Anterior:** Em cenários de concorrência com múltiplos operadores, os logs eram emitidos sem identificador de correlação único. Quando ocorria um erro ou lentidão, era impossível rastrear nos logs quais etapas pertenciam a uma requisição específica.
- **Implementação:** O middleware `requestLogger` agora extrai ou gera um UUID v4 via `crypto.randomUUID()`, anexando-o ao objeto `req.requestId`, injetando o cabeçalho `X-Request-Id` na resposta HTTP e incluindo-o em todos os logs JSON estruturados emitidos via Pino.
- **Resultado:** Rastreabilidade completa da requisição desde o cliente até a persistência no banco.

#### 2. Graceful Shutdown do Servidor e Banco de Dados
- **Problema Anterior:** Sinais de encerramento do sistema operacional (`SIGTERM` e `SIGINT` disparados por restarts ou deploys) derrubavam o processo Node.js abruptamente, interrompendo transações em andamento e deixando conexões órfãs no pool do PostgreSQL Neon.
- **Implementação:** Acoplamento de rotina de encerramento gracioso no `index.js`. O servidor para de receber novas requisições HTTP, aguarda a finalização das operações pendentes e fecha ordenadamente as conexões com o Prisma (`prisma.$disconnect()`), com timeout de contingência de 10s.

#### 3. Sincronização Integral do Catálogo de APIs e Correção Documental (Fase F)
- Na entrega da Fase F, o catálogo de endpoints foi sincronizado com os 35 endpoints existentes à época, corrigindo o enum canônico para `REPOSICAO`/`VENDA` e oficializando `POST /products/:id/adjust`. *(Expandido posteriormente na Fase G para 42 rotas HTTP reais).*

---

### 8.7 Ciclo de Amadurecimento: Fase G — SaaS Multi-Tenant, Soft Delete, Planilhas (.xlsx/.csv) & Isolamento RBAC

Neste sétimo ciclo estrutural, o **Estoque.OS** evoluiu de uma aplicação single-tenant para uma plataforma SaaS Multi-Tenant completa com preservação histórica, onboarding em lote e sigilo operacional:

#### 1. Arquitetura Multi-Tenant Nativa (`Empresa` + `empresaId`)
- **Problema Anterior:** Todas as lojas compartilhavam o mesmo namespace de banco e mídia sem chave de estabelecimento, impossibilitando operação SaaS segura.
- **Implementação:**
  - Adicionado model `Empresa` (`nome`, `slug` único, `cnpj`, `telefone`, `ativo`) e chave estrangeira obrigatória `empresaId` com índices compostos em `Usuario`, `Produto`, `Categoria`, `Fornecedor` e `Movimento` (migração `20261110010000_multitenant_softdelete`).
  - Unicidade de e-mail e nome de categoria escopada por loja (`@@unique([empresaId, email])` e `@@unique([empresaId, nome])`).
  - Login inteligente (`POST /auth/login`): aceita `lojaSlug` opcional ou detecta múltiplas lojas ativas devolvendo `requiresStoreSelection: true` para escolha na UI.
  - Cadastro público (`POST /auth/register`): cria estabelecimento (`Empresa`) e usuário fundador `ADMIN` em transação atômica.
  - Subpastas isoladas no Cloudinary via `getTenantFolder`: `estoque-os/lojas/<slug>/produtos` e `.../usuarios`.

#### 2. Inativação Lógica / Soft Delete (`ativo: Boolean`)
- **Problema Anterior:** Colaboradores desligados ou itens descontinuados com histórico de movimentações não podiam ser removidos, travando o fluxo operacional.
- **Implementação:** Campo `ativo` adicionado a `Usuario`, `Produto`, `Categoria` e `Fornecedor`, com rotas `PATCH /:id/status` e fallback automático para `ativo = false` nas rotas `DELETE /:id` quando houver vínculo histórico. Contas ou lojas inativadas têm o cache invalidado imediatamente e recebem `403`, e produtos inativos são bloqueados em `POST /products/:id/adjust`.

#### 3. Importação e Exportação Nativa de Planilhas (`.xlsx` / `.csv`)
- **Implementação:** Serviço nativo [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) baseado em `ExcelJS`, evitando worker externo e mantendo custo zero de hospedagem adicional:
  - Planilha modelo (`.xlsx` e `.csv` UTF-8 BOM) com cabeçalhos e linhas de exemplo (`GET /products/import/template`).
  - Exportação do catálogo por estabelecimento e status (`GET /products/export`).
  - Importação em duas etapas via Multer em memória (`<= 2MB`, limite 5.000 linhas): `mode=preview` (valida linhas, detecta novas categorias/fornecedores sem gravar) e `mode=commit` (aborta com HTTP `400` se houver qualquer erro ou grava atomicamente via `prisma.$transaction`).

#### 4. Sigilo de `OPERADOR`, `GERENTE` vs `ADMIN` & Polimento Mobile
- **Implementação:**
  - `OPERADOR`: recebe apenas suas próprias movimentações em `GET /movements` (mesmo se tentar forjar `?usuarioId=...`), vê escopo `scope: 'user'` no PDF de vendas e é bloqueado (`403`) em `/users/names`, `/movements/user-stats` e `/users`.
  - `GERENTE`: visão da loja inteira e gestão de catálogo/fornecedores/planilhas sem acesso a `/users` nem rotas `DELETE`.
  - `ADMIN`: governança total da loja, exclusões e equipe.
  - Landing Page atualizada com seção `#multitenant`, modais migrados para `createPortal` e responsividade/espaçamento aprimorados em telas móveis.

#### 5. Validação Automatizada Integral (Backend + Build/Lint Frontend)
- **Backend Integration Audit Suite:** `npm --prefix backend test` ([`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs)) executado contra API real + PostgreSQL Neon — **6/6 baterias aprovadas** (registro multi-loja, seleção de loja no login e bloqueio de inativo 403, isolamento cross-tenant 404, isolamento de `OPERADOR` e bloqueios de `GERENTE`, Soft Delete + invalidação de cache, importação `.xlsx`/`.csv` com rollback em erro e exportação).
- **Frontend Build & Lint:** `npm --prefix frontend run build` (`vite build`) e `npm --prefix frontend run lint` (`eslint .`) aprovados com **0 erros e 0 warnings**.

#### 6. Polimento Operacional Pós-Homologação (UX, Comprovantes & Precisão de Ranking)
- **Toasts e Diálogos Estilizados:** Corrigido estado inicial vazio de [`ModalMensagem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/ModalMensagem.jsx) com fade-out gradual (`400ms`), e substituídos 100% dos `window.confirm`, `window.alert` e `window.prompt` nativos por [`ModalConfirmacao.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/ModalConfirmacao.jsx) (`createPortal` com variantes e input opcional de justificativa).
- **Filtros Colapsáveis & Fornecedores Inativos:** Padronização de painéis retráteis em `Pedidos`, `DesempenhoVendedores`, `Lojas`, `Categorias`, `Fornecedores`, `Produtos`, `Movimentacoes` e `Usuarios`; inclusão de fornecedores inativos no `seed.js` e mensagens contextuais explícitas nos gráficos e tabela quando não houver inativos.
- **Preservação de Posição no Ranking (`/dashboard/desempenho`):** Cálculo de `posicao` sobre o conjunto completo do escopo/período antes da aplicação de filtros textuais/ID.
- **Dashboard Interativo:** Fluxo de mercadorias com seletor `Mês atual` / `6 Meses` / `Último ano`, valores absolutos + percentuais nos alertas e card de baixo estoque com modal clicável e redirecionamento para `/dashboard/produtos?focus=<id>`, além de abertura detalhada de movimentações recentes via [`ModalMovimentacao.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalMovimentacao.jsx).
- **Comprovação de Pagamento e Recebimento nos Pedidos (`20261110030000_pedido_comprovantes`):** Adicionados `formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl` (foto/PDF no Cloudinary) e `recebidoPor` em `Pedido`, rota `PATCH /orders/:id/proof`, modal de anexo posterior e recibo formal imprimível.

---

### 8.8 Ciclo de Amadurecimento: Fase H — `Organizacao → Múltiplas Lojas`, Portais Separados, Multipedidos & Exclusão Real c/ Antigo ID

Neste oitavo ciclo estrutural, o **Estoque.OS** evoluiu do modelo de loja isolada simples para uma arquitetura corporativa de **Organização (Rede) → Múltiplas Filiais** com auditoria completa de pedidos e vendedores:

#### 1. Hierarquia `Organizacao → Lojas` & Portais Separados
- **Problema Anterior:** Uma conta de proprietário só enxergava uma única `Empresa` sem poder gerenciar múltiplas filiais consolidadas, transferir gerentes entre unidades ou separar o login administrativo do login operacional.
- **Implementação:**
  - Schema migrado em `20261110020000_organizacao_multipedidos`: criada tabela `Organizacao` (raiz) → `Loja` (filiais), substituindo `Empresa` com backfill seguro preservando IDs.
  - Resolvedor [`tenantScope.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) (`resolveReadScope` e `resolveWriteStore`): lê cabeçalho `X-Loja-Id` apenas para `ADMIN` (`"all"` ou filial específica), travando `GERENTE` e `OPERADOR` estritamente em sua própria `lojaId`.
  - Novo módulo `/stores` ([`storeService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js)) com tela `/dashboard/lojas` e seletor global de filial na [`Sidebar.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx) via `useTenantStore`.
  - Portais segregados: [`AdminLogin.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx) (`/admin/login`, `portal: 'admin'`) e [`Auth.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx) (`/login`, `portal: 'loja'`).
  - Transferência instantânea de `GERENTE`/`OPERADOR` entre filiais via `PATCH /users/:id/store` invalidando cache de autenticação na hora.

#### 2. Gestão de RH, Matrícula Determinística, Data de Demissão & Exclusão Real c/ Relatório Mensal
- **Revisão de Regra de Negócio:** Diferente de produtos, categorias, fornecedores ou lojas (onde inativação lógica faz sentido para itens descontinuados), dar *softban* permanente em funcionários impedia desligamento real. Por outro lado, gestores precisavam controlar suspensões temporárias, férias, telefone, admissão, matrícula e consultar posteriormente colaboradores desligados com sua respectiva **Data de Demissão**.
- **Implementação (`20261110040000_matricula_situacao_rh` + `20261110050000_registro_desligamento`):**
  - Todo colaborador recebe **`matricula` única gerada do ID (`MAT-00001`)**, `telefone`, `dataAdmissao` e `situacao` (`ATIVO` | `SUSPENSO` | `FERIAS`). Contas suspensas ou em férias ficam bloqueadas (`403`) com efeito imediato até reativação em `/dashboard/usuarios` (`ModalInfoUsuario`) ou demissão definitiva.
  - Ao demitir (`DELETE /users/:id`, aceitando `{ dataDemissao, motivo }` opcionais), o registro de `Usuario` e seu avatar são **apagados definitivamente** (`ON DELETE SET NULL`), gravando o arquivamento **`RegistroDesligamento`** + snapshots imutáveis (`MAT-XXXXX (CANCELADA)`, admissão e demissão). Assim, ex-colaboradores continuam filtráveis na própria página `/dashboard/usuarios` (`situacao=DESLIGADO`), com **Data de Demissão** no popup `Info` e botão para reemitir o **Relatório Final de Desligamento** (`GET /users/:refId/dismissal-report`).

#### 3. Multipedidos Atômicos (`/orders`) & Estorno Contábil
- **Implementação:** Criados os models `Pedido` (`CONCLUIDO` | `CANCELADO`) e `ItemPedido` em [`orderService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js):
  - Agrupamento automático de itens duplicados no carrinho e lock pessimista determinístico `ORDER BY id ASC FOR UPDATE` prevenindo *deadlocks*.
  - Preço unitário congelado (`Decimal(10, 2)`) em `ItemPedido` e espelho contábil no livro-razão (`Movimento`).
  - Cancelamento supervisionado (`POST /orders/:id/cancel`) exclusivo de `ADMIN` e `GERENTE`, devolvendo ou ajustando saldos e registrando movimentações inversas marcadas com `estorno = true` (excluídas automaticamente dos cálculos de faturamento e fornecedores).

#### 4. Painel de Desempenho (`/dashboard/desempenho`) & Relatórios Executivos Aprimorados
- **Implementação:** Nova página [`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx) e endpoints `GET /movements/performance` e `GET /movements/performance/:refId` com ranking melhor→pior, switch `includeDeleted`, busca direta por antigo ID (`vendedorRefId`), comparativo simultâneo de `1m`, `6m`, `1y` e ficha PDF A4. O modal [`ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx) passou a incluir ranking de vendedores, giro por fornecedor e escolha de filial/rede pelo `ADMIN`.

#### 5. Validação Automatizada & Estado do Build
- **Seed & Migrações Neon:** 9 migrações em `backend/prisma/migrations/` (sequenciadas cronologicamente de `20261110010000_multitenant_softdelete` até `20261110050000_registro_desligamento`) e `seed.js` cobrindo `Grupo TechStock Varejo` + `CyberForge Geek Store` (com colaboradores ativos, suspenso, em férias e ex-vendedor com matrícula cancelada em `RegistroDesligamento`).
- **Backend E2E Suite:** [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) aprovada (`7/7` cenários) contra PostgreSQL Neon real (`ep-bold-poetry-adxi7rof-pooler`).
- **Frontend Build & Lint:** `eslint .` (`0` erros, `0` warnings) e `vite build` (**2.420 módulos** compilados, `1.020,48 kB`).

---

### 8.9 Auditoria Integral de Segurança, Estabilidade em Nuvem & Padrão Documental (11/11/2026)

Após a estabilização do deploy Render + NeonDB, todo o sistema passou por uma auditoria completa de **Segurança de Aplicação (AppSec)**, **Dependências (`npm audit`)** e **Conformidade Documental (`promptFuncExplic.md`)**:

#### 1. Hardening de Segurança Backend (`Express 5`, `Prisma`, `JWT`, `Multer` & `ExcelJS`)
- **Proxy Reverso & Rate Limit Global ([`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js)):** Ativado `app.set("trust proxy", 1)` para leitura real de IP atrás do Render, removido `loginLimiter` morto e acoplado `apiLimiter` global (`400 req / 15 min / IP`), `express.json({ limit: "1mb" })`, normalização multi-origem no `CORS`, `express.static(..., { dotfiles: "ignore" })`, validação estrita de `JWT_SECRET` no boot em produção e omissão de `details` de banco em `/test-db` quando `NODE_ENV=production`.
- **Sigilo de Erros Internos ([`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js)):** Erros não operacionais `>= 500` (falhas Prisma, conexão SQL ou FS) são logados apenas internamente via `Pino`, retornando mensagem genérica segura ao cliente HTTP; erros de upload `MulterError` e exceções Prisma (`P2002`, `P2025`, `P2003`) passaram a ser normalizados sem vazar detalhes de infraestrutura.
- **Autenticação & Senha ([`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js), [`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js), [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)):** Exigência estrita de prefixo `Bearer`, verificação `jwt.verify(..., { algorithms: ["HS256"] })`, checagem de `userId` inteiro positivo, isolamento do `try/catch` de JWT para não deslogar usuários em quedas momentâneas de DB e exigência de senha com mínimo de `6` caracteres no registro e criação/edição de colaboradores.
- **Uploads, Path Traversal, URLs & Formula Injection ([`multerConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/multerConfig.js), [`productRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js), [`sanitizers.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js), [`cloudinaryConfig.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js), [`productSpreadsheetService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js)):** Extensões ancoradas `^\.(...)$` + validação de MIME type em imagens, comprovantes (`.pdf`/imagem) e planilhas (`.xlsx`/`.csv`); nomes de arquivo sanitizados com `crypto.randomBytes`; `removeLocalUploadIfSafe` via `path.resolve` prevenindo *Path Traversal*; `sanitizeSafeUrl` bloqueando `javascript:`/`data:` em comprovantes de pedidos; e `sanitizeSpreadsheetCell` neutralizando *Formula Injection* (`=`, `+`, `-`, `@`) na exportação `.xlsx`/`.csv`.

#### 2. Hardening Frontend & Resiliência de Cold-Start
- **Prevenção de XSS em Relatórios PDF & Mídias ([`validators.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/validators.js), [`imageHelper.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/imageHelper.js)):** Criada `escapeHtml` aplicada em 100% dos 4 geradores HTML/PDF (`ModalExportarRelatorio`, `ModalRelatorioDesligamento`, `DesempenhoVendedores`, `Pedidos`), links externos protegidos com `rel="noopener noreferrer"` e `formatImageUrl` endurecida contra `javascript:`, `data:` e `//`.
- **Feedback de Inicialização do Servidor ([`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) + [`serverToast.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/serverToast.js)):** Espera controlada de `1000ms` com toast flutuante enquanto aguarda o despertar do servidor no Render.

#### 3. Correção de Dependências (`npm audit fix`) & Estado do Padrão Documental
- **Dependências:** `npm audit fix` executado nos dois pacotes (`frontend`: **`0` vulnerabilidades**, incluindo `react-router-dom` `7.18.5` e `vite` `7.3.8`; `backend`: redução de `14` para `5` alertas transitivos de CLI/dev em `deepmerge-ts` no `@prisma/config` e `uuid` no `exceljs`, atualizando `multer` para `2.5.0`, `express` para `5.2.1` e eliminando a falha crítica em `proxy-addr`).
- **Aderência a [`promptFuncExplic.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic.md):** `100%` das funções criadas/alteradas nesta auditoria seguem estritamente o cabeçalho, linha vazia e passos numerados exigidos. No restante do legado do repositório (onde a regra pede para não reescrever código não afetado), a adoção global medida é parcial/híbrida: `20/157` funções no backend estritas (`91/157` com passos numerados) e `8/75` no frontend (`19/75` com passos numerados).






