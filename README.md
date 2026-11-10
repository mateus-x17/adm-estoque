# Sistema de Gerenciamento de Estoque (Estoque.OS)

## 1. Visão Geral

### 1.1 O que é o sistema
O **Estoque.OS** é uma aplicação web fullstack **Multi-Tenant** desenvolvida para o controle de mercadorias, categorias, fornecedores, movimentações e equipes por estabelecimento. Cada loja opera em um ambiente lógico e de mídia totalmente isolado (`Empresa` / `empresaId`), mantendo histórico imutável de movimentações, inativação lógica (Soft Delete), onboarding em lote por planilhas (`.xlsx`/`.csv`) e relatórios executivos em PDF.

### 1.2 Funcionalidades
- **Arquitetura Multi-Tenant por Estabelecimento (`Empresa`):** Abertura pública de novas lojas com criação automática do usuário fundador `ADMIN`, suporte a e-mail único por loja (seletor automático de loja no login para usuários em múltiplas unidades) e subpastas isoladas no Cloudinary (`estoque-os/lojas/<slug>/...`).
- **Controle de Acesso e Isolamento RBAC (`ADMIN`, `GERENTE`, `OPERADOR`):**
  - `ADMIN`: Acesso irrestrito à loja (inclui colaboradores, cargos e exclusão/inativação definitiva).
  - `GERENTE`: Visão gerencial completa da loja, catálogo, importação/exportação em lote e métricas de vendedores (sem acesso à gestão de contas ou deleções).
  - `OPERADOR`: Acesso operacional restrito ao próprio trabalho — visualiza catálogo ativo e movimenta estoque (`REPOSICAO`/`VENDA`), mas visualiza **exclusivamente suas próprias vendas e movimentações** (sem acesso a métricas ou histórico de colegas).
- **Inativação Lógica (Soft Delete `ativo: Boolean`):** Colaboradores, produtos, categorias e fornecedores com histórico preservado podem ser inativados/reativados sem quebrar auditoria nem integridade referencial, bloqueando login e novas vendas em registros inativos.
- **Importação & Exportação Nativa de Planilhas (`.xlsx` / `.csv`):** Motor em Node.js via `exceljs` com download de planilha modelo, pré-validação detalhada linha a linha (`preview`), criação automática de categorias/fornecedores ausentes e gravação transacional atômica por estabelecimento (`commit`).
- **Gestão de Produtos, Categorias e Fornecedores:** CRUD completo com upload de fotos para CDN, filtro por status (`Ativos`, `Inativos`, `Todos`) e busca paginada.
- **Movimentações Transacionais de Estoque:** Entradas (`REPOSICAO`) e saídas (`VENDA`) com lock pessimista `FOR UPDATE` no PostgreSQL, `Idempotency-Key`, trava anti-duplo clique e livro-razão rastreável.
- **Dashboard e Relatórios Executivos em PDF:** Gráficos interativos (`Recharts`), métricas patrimoniais em `Decimal(10, 2)` e exportação nativa em PDF A4 (`1m`, `6m`, `1y`) respeitando o escopo da loja (`ADMIN`/`GERENTE`) ou individual (`OPERADOR`).
- **Customização Visual & Mobile:** Tema Claro/Escuro e interface Glassmorphism adaptada para celulares e desktops.

### 1.3 Valor entregue
O sistema elimina planilhas soltas e erros manuais de inventário, previne rupturas com alertas de baixo estoque, acelera o cadastro inicial de centenas de itens via `.xlsx`/`.csv` e garante sigilo operacional entre vendedores e isolamento estrito entre lojas distintas na mesma infraestrutura em nuvem.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais
1. O sistema deve permitir o cadastro público de novos estabelecimentos (criando `Empresa` + usuário `ADMIN`) e login via e-mail/senha com suporte a seletor multi-loja quando o mesmo e-mail existir em mais de um estabelecimento.
2. O sistema deve isolar 100% das consultas, gravações, exclusões, planilhas e pastas no Cloudinary (`estoque-os/lojas/<slug>/...`) pelo `empresaId` do estabelecimento autenticado.
3. O sistema deve permitir a criação, leitura, atualização, inativação lógica (`ativo: Boolean`) e exclusão de produtos, categorias, fornecedores e colaboradores.
4. O sistema deve permitir importação em lote de produtos via `.xlsx`/`.csv` com modo de pré-visualização (`preview`) e gravação transacional atômica (`commit`), além da exportação do catálogo nos mesmos formatos e download de planilha modelo.
5. O sistema deve registrar movimentações de estoque (`REPOSICAO` ou `VENDA`, aceitando aliases `ENTRADA`/`SAIDA`), atualizando saldo com lock `FOR UPDATE` e bloqueando movimentações de saldo negativo ou em itens inativos.
6. O sistema deve restringir o perfil `OPERADOR` para visualizar exclusivamente suas próprias movimentações e seu próprio relatório de vendas, vedando acesso a métricas e dropdowns de outros vendedores.
7. O sistema deve exibir estatísticas consolidadas da loja (ou individuais para operadores) e permitir exportar relatórios de vendas em PDF (`1m`, `6m`, `1y`).
8. O sistema deve permitir ao usuário autenticado consultar e atualizar seu próprio perfil em `/configuracoes`, vedando auto-escalação de privilégio.

### 2.2 Requisitos Não Funcionais
- **Segurança:** Autenticação via JWT (`expiresIn: '8h'`), hash BcryptJS (custo 10), Helmet, CORS configurável, Rate Limit no login (15 req/15min) e cadastro (10 req/h), e bloqueio imediato via invalidação de cache quando usuário ou loja são inativados.
- **Performance:** Cache em memória por usuário (TTL 60s) e dropdown por loja (TTL 30s), consultas SQL agregadas sem N+1 e índices compostos indexados por `empresaId`.
- **Integridade Financeira:** Preços tipados como `Decimal(10, 2)` (`numeric(10,2)` no PostgreSQL) sem imprecisão de ponto flutuante binário.
- **Usabilidade:** SPA em React 19 + Vite + Tailwind CSS com tema escuro/claro e responsividade mobile aprimorada.

---

## 3. Regras de Negócio
- **Isolamento de Tenant:** Todas as operações autenticadas validam pertencimento ao `empresaId` extraído do JWT verificado no banco. Cross-tenant resulta em `404 Not Found`.
- **RBAC por Nível:**
  - Apenas `ADMIN` cria, edita, lista, inativa ou exclui colaboradores (`/users`) e aciona rotas `DELETE` de produtos, categorias e fornecedores.
  - `ADMIN` e `GERENTE` gerenciam catálogo, categorias, fornecedores, planilhas (`.xlsx`/`.csv`), inativam/reativam itens (`PATCH /:id/status`) e consultam métricas de vendedores (`/movements/user-stats` e `/users/names`).
  - `OPERADOR` movimenta estoque (`POST /products/:id/adjust`) e consulta apenas suas próprias vendas/movimentações.
- **Unicidade Escopada por Loja:** O e-mail do usuário e o nome da categoria devem ser únicos **dentro do mesmo estabelecimento** (`@@unique([empresaId, email])` e `@@unique([empresaId, nome])`), permitindo que a mesma pessoa trabalhe em lojas distintas.
- **Soft Delete Automático & Reversível:** Caso usuário, produto, categoria ou fornecedor possua histórico/vínculo no banco, `DELETE /:id` aplica automaticamente `ativo = false` preservando o histórico; contas/lojas inativas recebem `403` na autenticação e produtos inativos não podem ser movimentados (`400`).
- **Integridade & Governança:** Saldo não pode ficar negativo; um usuário não pode excluir/inativar a própria conta nem rebaixar/excluir o último `ADMIN` ativo da loja; não-administradores não podem alterar o próprio cargo em `/users/me`.

---

## 4. Arquitetura de Software

### 4.1 Visão Geral
O projeto segue arquitetura desacoplada Cliente-Servidor RESTful Multi-Tenant:
- **Backend:** Node.js (ESM) com Express 5 em camadas (`Routes -> Middlewares -> Controllers -> Services -> Prisma ORM -> PostgreSQL / Cloudinary`), incluindo motor nativo de planilhas com `ExcelJS`.
- **Frontend:** Single Page Application (SPA) em React 19 + Vite, Tailwind CSS e Zustand (`useAuthStore`, `useUserStore`, `useThemeStore`).

### 4.2 Stack Tecnológica
- **Frontend:** React 19, Vite 7, Tailwind CSS 3, Zustand, React Router DOM 7, Lucide React, React Icons, Framer Motion, Recharts.
- **Backend:** Node.js (ES Modules), Express.js 5, Prisma ORM 6 (`v6.16.2`), ExcelJS (`^4.4.0`), Cloudinary SDK (`^2.10.0`), Multer 2, Pino Logger, BcryptJS, JsonWebToken, Helmet, Express Rate Limit.
- **Banco de Dados:** PostgreSQL (Neon Database com Pooler PgBouncer).
- **Armazenamento de Mídias:** Cloudinary CDN em estrutura hierárquica por estabelecimento (`estoque-os/lojas/<slug>/produtos` e `.../usuarios`).

---

## 5. Design da API

### 5.1 Inventário Completo de Rotas da Aplicação (42 Rotas HTTP + Estáticos)

#### Sistema e Diagnóstico (2 rotas públicas)
- `GET /` - Healthcheck básico de disponibilidade da API.
- `GET /test-db` - Diagnóstico de conectividade direta com o banco PostgreSQL Neon.

#### Autenticação & Onboarding de Lojas (`/auth` - 2 rotas públicas)
- `POST /auth/login` - Autenticação multi-tenant (Rate Limit: 15 req/15min por IP). Aceita `lojaSlug` opcional; se o par e-mail/senha corresponder a múltiplas lojas ativas, retorna `{ requiresStoreSelection: true, stores }`. Bloqueia conta ou loja inativa com `403`.
- `POST /auth/register` - Cadastro público de novo estabelecimento (`Empresa`) e criação automática do fundador como `ADMIN` (Rate Limit: 10 req/h por IP).

#### Usuários & Governança (`/users` - 9 rotas protegidas)
- `GET /users/me` - Consulta aos dados e estabelecimento do perfil autenticado (`Todos`).
- `PUT /users/me` - Atualização de nome, e-mail e avatar na pasta do tenant (`Todos`; alteração de `role` bloqueada para não-ADMIN).
- `GET /users/names` - Lista em cache por loja (TTL 30s) de colaboradores ativos para filtros (`ADMIN`, `GERENTE` — bloqueado para `OPERADOR`).
- `GET /users` - Listagem paginada por loja com filtros `search`, `role` e `status` (`ativos`/`inativos`/`todos`) (`ADMIN`).
- `POST /users` - Criação administrativa de colaborador vinculado à loja com foto no Cloudinary (`ADMIN`).
- `GET /users/:id` - Consulta aos detalhes de colaborador da mesma loja (`ADMIN`).
- `PUT /users/:id` - Atualização cadastral/cargo com proteção contra rebaixamento do último `ADMIN` ativo (`ADMIN`).
- `PATCH /users/:id/status` - Inativação lógica (`ativo: false`) ou reativação (`ADMIN`; invalida cache imediatamente e bloqueia auto-inativação ou último `ADMIN`).
- `DELETE /users/:id` - Exclusão definitiva se não houver histórico ou fallback automático para Soft Delete se houver movimentações (`ADMIN`).

#### Produtos, Estoque & Planilhas (`/products` - 12 rotas protegidas)
- `GET /products` - Listagem paginada por loja com filtros `search`, `sortPrice`, `categoriaId` e `status` (`ativos`, `inativos`, `todos`) (`Todos`).
- `GET /products/count` - Contagem total de produtos ativos da loja (`Todos`).
- `GET /products/stats` - KPIs agregados de estoque ativo (contagem, baixo estoque `< 10` e patrimônio `SUM(preco * quantidade)` em `Decimal`) (`Todos`).
- `GET /products/export` - Exportação do catálogo da loja em `.xlsx` ou `.csv` com UTF-8 BOM (`ADMIN`, `GERENTE`).
- `GET /products/import/template` - Download da planilha modelo oficial `.xlsx` ou `.csv` (`ADMIN`, `GERENTE`).
- `POST /products/import` - Upload via Multer em memória (até 2MB, até 5.000 linhas) para importação em lote nos modos `?mode=preview` ou `?mode=commit` atômico (`ADMIN`, `GERENTE`).
- `GET /products/:id` - Detalhes de um produto da loja (`Todos`).
- `POST /products` - Cadastro de produto na loja com upload em `estoque-os/lojas/<slug>/produtos` (`ADMIN`, `GERENTE`).
- `PUT /products/:id` - Atualização cadastral e substituição/remoção de foto na loja (`ADMIN`, `GERENTE`).
- `PATCH /products/:id/status` - Inativação lógica ou reativação (`ADMIN`, `GERENTE`).
- `DELETE /products/:id` - Exclusão física se sem histórico ou Soft Delete automático se houver movimentações (`ADMIN`).
- `POST /products/:id/adjust` - Movimentação transacional (`REPOSICAO`/`VENDA`, aliases `ENTRADA`/`SAIDA`) com `SELECT ... FOR UPDATE`, bloqueio de produto inativo, `Idempotency-Key` e debounce (`Todos` na loja).

#### Categorias (`/categories` - 6 rotas protegidas)
- `GET /categories/count` - Contagem de categorias ativas da loja (`Todos`).
- `GET /categories` - Listagem de categorias da loja com filtro `status` (`ativos`/`inativos`/`todos`) (`Todos`).
- `POST /categories` - Criação de categoria única por estabelecimento (`ADMIN`, `GERENTE`).
- `PUT /categories/:id` - Atualização de nome validando unicidade dentro da loja (`ADMIN`, `GERENTE`).
- `PATCH /categories/:id/status` - Inativação/reativação lógica (`ADMIN`, `GERENTE`).
- `DELETE /categories/:id` - Exclusão física ou Soft Delete automático se possuir produtos vinculados (`ADMIN`).

#### Fornecedores (`/suppliers` - 8 rotas protegidas)
- `GET /suppliers/stats` - Métricas agregadas de reposições e vendas por fornecedor ativo da loja via SQL `LEFT JOIN` (`Todos`).
- `GET /suppliers` - Listagem por loja com filtro `status` (`Todos`).
- `GET /suppliers/count` - Contagem de fornecedores ativos da loja (`Todos`).
- `GET /suppliers/:id` - Detalhes de um fornecedor da loja (`Todos`).
- `POST /suppliers` - Cadastro de fornecedor na loja (`ADMIN`, `GERENTE`).
- `PUT /suppliers/:id` - Atualização de fornecedor da loja (`ADMIN`, `GERENTE`).
- `PATCH /suppliers/:id/status` - Inativação/reativação lógica (`ADMIN`, `GERENTE`).
- `DELETE /suppliers/:id` - Exclusão física ou Soft Delete automático se possuir produtos vinculados (`ADMIN`).

#### Movimentações & Relatórios (`/movements` - 3 rotas protegidas)
- `GET /movements/sales-report` - Relatório consolidado de vendas nos períodos `1m`, `6m` e `1y` para exportação PDF A4 (`ADMIN`/`GERENTE` = escopo `store`; `OPERADOR` = escopo `user` restrito às próprias vendas).
- `GET /movements/user-stats` - Estatísticas de faturamento e volume por vendedor via query SQL única (`ADMIN`, `GERENTE` — bloqueado para `OPERADOR`).
- `GET /movements` - Livro-razão paginado da loja (`OPERADOR` recebe estritamente seus próprios registros, ignorando `?usuarioId` forjado).

#### Arquivos Estáticos
- `USE /uploads` - Exposição de fallbacks locais caso o envio para o Cloudinary não esteja configurado.

### 5.2 Padrões Utilizados
- Comunicação via JSON (e `multipart/form-data` / binários `application/vnd.openxmlformats...` / `text/csv`).
- Status HTTP padronizados (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500`).
- Autenticação via cabeçalho `Authorization: Bearer <token>`.

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
│   │   └── 20261110_multitenant_softdelete/
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
│   │   ├── productController.js
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
│   │   ├── productRoutes.js
│   │   ├── supplierRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── categoryService.js
│   │   ├── movementService.js
│   │   ├── productService.js
│   │   ├── productSpreadsheetService.js
│   │   ├── supplierService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── sanitizers.js
│   └── index.js
├── tests/
│   └── multitenant_audit.test.mjs
└── uploads/
    ├── produtos/
    └── usuarios/
```

### 6.2 Padrões Adotados
- **Separação de Responsabilidades:** Rotas -> Middlewares (`auth`, `permit`, `validateRequest`, `multer`) -> Controllers -> Services -> Prisma ORM.
- **Tratamento Centralizado de Erros:** Classe `AppError` e `errorHandler` com logging estruturado em JSON via Pino e `X-Request-Id`.
- **Mídias Flexíveis:** Utilitário `getTenantFolder` garantindo subpastas por loja no Cloudinary e helper `formatImageUrl` no frontend.

---

## 7. Instalação e Execução Local

Siga os passos abaixo para clonar, instalar e rodar o projeto na sua máquina.

1. Clone o repositório:
   ```bash
   git clone https://github.com/mateus-x17/adm-estoque/
   cd Estoque.OS
   ```

2. Configure as variáveis de ambiente do Backend (`backend/.env`):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
   JWT_SECRET="seu_jwt_secret_com_pelo_menos_16_caracteres"
   FRONTEND_URL="http://localhost:5173"

   # Cloudinary configuration (opcional em dev; se configurado, envia para estoque-os/lojas/<slug>/...)
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   ```

3. Instale dependências, aplique as migrações e popule as 2 lojas de demonstração:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run reset:seed
   ```

   **Credenciais geradas pelo Seed Multi-Tenant (Senha padrão: `Password123!`):**
   - **Loja 1 (`techstock-matriz` — TechStock Matriz):**
     - Admin: `lucas.admin@techstock.com`
     - Gerente: `gestao@estoqueos.com` *(compartilhado com a Loja 2 para testar seleção de loja)*
     - Operadores: `joao.op@techstock.com`, `ana.op@techstock.com`
     - Inativo (Soft Delete demo): `pedro.ex@techstock.com` *(bloqueado com 403)*
   - **Loja 2 (`megamoda-express` — MegaModa Express):**
     - Admin: `camila.admin@megamoda.com`
     - Gerente: `gestao@estoqueos.com`
     - Operadores: `rafael.op@megamoda.com`, `juliana.op@megamoda.com`

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
  - Adicionado model `Empresa` (`nome`, `slug` único, `cnpj`, `telefone`, `ativo`) e chave estrangeira obrigatória `empresaId` com índices compostos em `Usuario`, `Produto`, `Categoria`, `Fornecedor` e `Movimento` (migração `20261110_multitenant_softdelete`).
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





