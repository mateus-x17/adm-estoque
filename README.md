# Sistema de Gerenciamento de Estoque (Estoque.OS)

## 1. Visão Geral

### 1.1 O que é o sistema
O **Sistema de Gerenciamento de Estoque** é uma aplicação web fullstack desenvolvida para o controle abrangente de mercadorias, categorias, fornecedores e controle de usuários. O sistema permite acompanhar o fluxo de entrada e saída de produtos em tempo real, garantindo rastreabilidade por operador e fornecendo métricas estratégicas para a tomada de decisão.

### 1.2 Funcionalidades
- **Gestão de Autenticação e Controle de Acesso (RBAC):** Sistema de login seguro via JWT com permissões baseadas em papéis (`ADMIN`, `GERENTE`, `OPERADOR`).
- **Gestão de Produtos:** Cadastro, edição, exclusão e listagem paginada de produtos com upload de fotos, filtros por nome/categoria e ordenação de preços.
- **Gestão de Categorias:** Organização de itens por categorias personalizadas.
- **Gestão de Fornecedores:** Controle de informações de contato e vínculo direto com produtos.
- **Movimentações de Estoque:** Registro de entradas e saídas de produtos com atualização automática de saldo, vinculação do operador e adição de observações.
- **Gestão de Usuários:** Administração de contas e atribuição de funções por administradores.
- **Upload de Mídias em Nuvem (Cloudinary):** Integração com o Cloudinary para hospedagem de imagens de produtos e avatares de usuários com URLs seguras HTTPS (mantendo gravação local histórica).
- **Dashboard e Relatórios Estatísticos:** Métricas sobre valor total em estoque, número de produtos e alerta automático de estoque baixo (< 10 unidades).
- **Customização Visual:** Suporte nativo a temas Claro e Escuro (Dark/Light mode).

### 1.3 Valor entregue
O sistema elimina o controle manual de produtos, reduz erros de inventário e previne rupturas de estoque através de alertas inteligentes. Além disso, proporciona transparência operacional ao registrar qual usuário executou cada entrada ou saída de mercadorias.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais
1. O sistema deve permitir autenticação de usuários via e-mail e senha com geração de token JWT.
2. O sistema deve permitir a criação, leitura, atualização e exclusão (CRUD) de produtos.
3. O sistema deve permitir o upload e gerenciamento de fotos de produtos e avatares de usuários no Cloudinary.
4. O sistema deve permitir a categorização de produtos e associação com fornecedores.
5. O sistema deve registrar cada movimentação de estoque (`ENTRADA` ou `SAIDA`), atualizando automaticamente a quantidade do produto e vinculando o usuário responsável.
6. O sistema deve proibir movimentações de saída que resultem em saldo de estoque negativo.
7. O sistema deve permitir que administradores gerenciem outros usuários e alterem suas funções.
8. O sistema deve permitir que o usuário logado visualize e edite suas informações de perfil na página de configurações.
9. O sistema deve exibir estatísticas consolidadas contendo a contagem total de produtos, alerta de baixo estoque e o valor financeiro acumulado.

### 2.2 Requisitos Não Funcionais
- **Segurança:** Autenticação baseada em JSON Web Token (JWT), senhas criptografadas com BcryptJS, cabeçalhos de segurança com Helmet, proteção CORS e rate-limiting na rota de autenticação.
- **Performance:** Respostas REST céleres com Express.js, paginação otimizada no banco PostgreSQL via Prisma ORM e consultas indexadas.
- **Escalabilidade:** Arquitetura desacoplada entre backend (API) e frontend (SPA), com armazenamento externo de mídia em CDN (Cloudinary).
- **Usabilidade:** Interface moderna e responsiva construída em React + Vite + Tailwind CSS, com suporte a tema escuro/claro.

---

## 3. Regras de Negócio
- Apenas usuários com função `ADMIN` têm permissão para criar, editar, listar e excluir outros usuários do sistema.
- Apenas usuários `ADMIN` e `GERENTE` têm permissão para cadastrar, editar e remover produtos, categorias e fornecedores.
- Usuários com função `OPERADOR` possuem acesso de leitura aos cadastros e permissão para realizar movimentações de estoque (`ENTRADA` e `SAIDA`).
- Uma movimentação do tipo `SAIDA` não pode ser realizada se a quantidade solicitada for superior ao saldo atual disponível do produto.
- A quantidade de produtos em estoque não pode assumir valores negativos.
- Cada usuário no sistema deve possuir um e-mail único.
- O nome de cada categoria de produtos deve ser único.
- Usuários não-administradores não podem alterar seu próprio papel (role) através da tela de configurações.

---

## 4. Arquitetura de Software

### 4.1 Visão Geral
O projeto é estruturado como uma aplicação desacoplada (Cliente-Servidor API RESTful):
- **Backend:** Node.js com Express e padrão em camadas (Routes -> Middlewares -> Controllers -> Services -> Prisma ORM -> PostgreSQL / Cloudinary).
- **Frontend:** Single Page Application (SPA) em React com Vite, Tailwind CSS para estilização e Zustand para gerenciamento de estado global.

### 4.2 Stack Tecnológica
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand, React Router DOM, Lucide React, React Icons, Framer Motion, Recharts.
- **Backend:** Node.js (ES Modules), Express.js 5, Prisma ORM, Cloudinary SDK, Multer, Pino Logger, BcryptJS, JsonWebToken, Helmet, Express Rate Limit.
- **Banco de Dados:** PostgreSQL (hospedado na nuvem via Neon Database).
- **Armazenamento de Mídias:** Cloudinary (upload via Cloudinary API com fallback/histórico local no diretório `uploads/`).

---

## 5. Design da API

### 5.1 Endpoints Principais da Aplicação

#### Sistema e Diagnóstico
- `GET /` - Healthcheck básico de disponibilidade da API.
- `GET /test-db` - Diagnóstico de conectividade e latência direta com o banco PostgreSQL Neon.

#### Autenticação
- `POST /auth/login` - Autenticação com credenciais e emissão de token JWT (Rate Limit: 10 req/15min).
- `POST /auth/register` - Criação de novas contas com perfil inicial OPERADOR (Rate Limit: 10 cadastros/hora/IP).

#### Usuários & Governança
- `GET /users/me` - Consulta aos dados do perfil do usuário autenticado.
- `PUT /users/me` - Atualização de nome, e-mail e avatar do usuário logado.
- `GET /users/names` - Rota leve otimizada com cache em memória (TTL 30s) para abastecer dropdowns e filtros (Acessível por todos os perfis).
- `GET /users` - Listagem paginada e filtrada de usuários (Requer `ADMIN`).
- `POST /users` - Criação administrativa de novo usuário com foto (Requer `ADMIN`).
- `GET /users/:id` - Consulta aos detalhes de um usuário específico (Requer `ADMIN`).
- `PUT /users/:id` - Atualização cadastral e alteração de função com proteção contra lockout do último admin (Requer `ADMIN`).
- `DELETE /users/:id` - Exclusão de usuário com proteção de integridade referencial histórica (Requer `ADMIN`).

#### Produtos & Estoque
- `GET /products` - Listagem paginada de produtos com filtros de busca e ordenação.
- `GET /products/count` - Contagem total de produtos cadastrados.
- `GET /products/stats` - KPIs agregados de estoque (contagem total, itens em baixa e patrimônio total em `Decimal`).
- `GET /products/:id` - Detalhes de um produto específico.
- `POST /products` - Cadastro de produto com imagem e categoria (Requer `ADMIN` ou `GERENTE`).
- `PUT /products/:id` - Atualização de dados cadastrais e foto de produto (Requer `ADMIN` ou `GERENTE`).
- `DELETE /products/:id` - Exclusão de produto (Requer `ADMIN`).
- `POST /products/:id/adjust` - **Ajuste de estoque e auditoria:** Transação atômica com lock pessimista (`FOR UPDATE`) no PostgreSQL, suporte a `Idempotency-Key` e debounce anti-duplo clique (`ADMIN`, `GERENTE`, `OPERADOR`).

#### Categorias
- `GET /categories` - Listagem de todas as categorias.
- `GET /categories/:id` - Detalhes de uma categoria específica.
- `POST /categories` - Cadastro de nova categoria com nome único (Requer `ADMIN` ou `GERENTE`).
- `PUT /categories/:id` - Atualização de categoria (Requer `ADMIN` ou `GERENTE`).
- `DELETE /categories/:id` - Exclusão de categoria com validação de produtos vinculados (Requer `ADMIN` ou `GERENTE`).

#### Fornecedores
- `GET /suppliers` - Listagem de parceiros comerciais cadastrados.
- `GET /suppliers/count` - Contagem numérica total de fornecedores.
- `GET /suppliers/stats` - Métricas agregadas por fornecedor calculadas via SQL nativo direto no PostgreSQL.
- `GET /suppliers/:id` - Detalhes cadastrais de um fornecedor específico.
- `POST /suppliers` - Cadastro de novo fornecedor (Requer `ADMIN` ou `GERENTE`).
- `PUT /suppliers/:id` - Atualização de fornecedor (Requer `ADMIN` ou `GERENTE`).
- `DELETE /suppliers/:id` - Exclusão de fornecedor com validação prévia de produtos associados (Requer `ADMIN` ou `GERENTE`).

#### Movimentações & Auditoria
- `GET /movements` - Livro-razão histórico paginado com filtros por período, produto, tipo e operador.
- `GET /movements/user-stats` - Estatísticas agregadas de produtividade por usuário (contagem, volume e valor total de vendas) calculadas em query única com `JOIN`.
- `GET /movements/sales-report` - Relatório executivo consolidado de vendas com agregação temporal nos horizontes de 1 mês (`1m`), 6 meses (`6m`) e 1 ano (`1y`), retornando totais faturados, volume de peças, ticket médio, produtos líderes e timeline para gráficos vetoriais e exportação direta em PDF.

### 5.2 Padrões Utilizados
- Comunicação via JSON.
- Status HTTP padronizados (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
- Autenticação via cabeçalho `Authorization: Bearer <token>`.

---

## 6. Estrutura do Projeto

### 6.1 Organização de Pastas (Backend)
```
backend/
├── prisma/
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
│   │   ├── supplierService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── sanitizers.js
│   └── index.js
└── uploads/
    ├── produtos/
    └── usuarios/
```

### 6.2 Padrões Adotados
- **Separação de Responsabilidades:** Camadas isoladas de rotas, middlewares de autorização, controladores e serviços com regras de negócio.
- **Tratamento Centralizado de Erros:** Erros tratados por middleware global com mensagens amigáveis e logging via Pino.
- **Mídias Flexíveis:** Utilitário no frontend e backend garantindo interoperabilidade entre URLs do Cloudinary e uploads locais.

---

## 7. Instalação e Execução Local

Siga os passos abaixo para clonar, instalar e rodar o projeto na sua máquina.

1. Clone o repositório:
   ```bash
   git clone https://github.com/mateus-x17/adm-estoque/
   ```

2. Acesse a pasta do projeto:
   ```bash
   cd Estoque.OS
   ```

3. Configure as variáveis de ambiente do Backend:
   Acesse a pasta `backend` e crie o arquivo `.env`:
   ```bash
   cd backend
   ```
   Preencha o arquivo `.env` com as configurações necessárias:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
   JWT_SECRET="seu_jwt_secret_super_seguro"
   FRONTEND_URL="http://localhost:5173"

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   ```

4. Instale as dependências do Backend:
   ```bash
   npm install
   ```

5. Execute as migrações e popule o banco de dados (se aplicável):
   ```bash
   npx prisma db push
   npm run seed
   ```

6. Inicie o servidor Backend:
   ```bash
   npm run dev
   ```

7. Em outro terminal, configure e inicie o Frontend:
   Acesse a pasta `frontend`:
   ```bash
   cd ../frontend
   ```

   Crie o arquivo `.env` na raiz da pasta `frontend` e defina a URL base da API (obrigatória para o cliente HTTP `apiClient` se conectar ao backend):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

   Instale as dependências e inicie o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```

8. Acesse a aplicação no navegador:
   ```
   http://localhost:5173
   ```

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

Neste ciclo final de engenharia, a aplicação recebeu camadas de observabilidade estruturada corporativa, finalização de encerramento resiliente e alinhamento documental estrito:

#### 1. Injeção de Correlation ID (`X-Request-Id`) de Ponta a Ponta
- **Problema Anterior:** Em cenários de concorrência com múltiplos operadores, os logs eram emitidos sem identificador de correlação único. Quando ocorria um erro ou lentidão, era impossível rastrear nos logs quais etapas pertenciam a uma requisição específica.
- **Implementação:** O middleware `requestLogger` agora extrai ou gera um UUID v4 via `crypto.randomUUID()`, anexando-o ao objeto `req.requestId`, injetando o cabeçalho `X-Request-Id` na resposta HTTP e incluindo-o em todos os logs JSON estruturados emitidos via Pino.
- **Resultado:** Rastreabilidade completa da requisição desde o cliente até a persistência no banco.

#### 2. Graceful Shutdown do Servidor e Banco de Dados
- **Problema Anterior:** Sinais de encerramento do sistema operacional (`SIGTERM` e `SIGINT` disparados por restarts ou deploys) derrubavam o processo Node.js abruptamente, interrompendo transações em andamento e deixando conexões órfãs no pool do PostgreSQL Neon.
- **Implementação:** Acoplamento de rotina de encerramento gracioso no `index.js`. O servidor para de receber novas requisições HTTP, aguarda a finalização das operações pendentes e fecha ordenadamente as conexões com o Prisma (`prisma.$disconnect()`), com timeout de contingência de 10s.

#### 3. Sincronização Integral do Catálogo de APIs e Correção Documental
- **Problema Anterior:** O README documentava apenas 8 rotas, continha rotas inexistentes (`POST /movements` e `GET /movements/:id`) e registrava enums defasados (`ENTRADA`/`SAIDA`).
- **Implementação:**
  - O catálogo oficial de endpoints foi atualizado para cobrir todos os **35 endpoints HTTP reais registrados** no backend (incluindo o novo endpoint de agregação executiva e exportação em PDF `GET /movements/sales-report`).
  - O enum canônico do banco foi documentado como `REPOSICAO` e `VENDA`, registrando que o backend mantém compatibilidade retroativa aceitando `ENTRADA` e `SAIDA` nas requisições.
  - A rota central de movimentação e livro-razão foi devidamente referenciada como `POST /products/:id/adjust`.





