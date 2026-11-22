# 📘 DOCUMENTO CONSOLIDADO DO SISTEMA — ESTOQUE.OS
## Descrição Completa, Funcionalidades, Requisitos, Arquitetura e Base para Currículo

**Projeto:** Estoque.OS (Sistema de Gerenciamento de Estoque, Pedidos e Equipes Multi-Filial)  
**Data da consolidação:** 2026-11-22  
**Fontes varridas:** [`README.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/README.md) e todos os 16 documentos da pasta [`relatorios/`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios) (`00_GUIA_DE_LEITURA_E_GLOSSARIO.md`, `00_REGISTRO_DE_PROGRESSO.md` e relatórios `01` a `14`).  
**Finalidade:** Servir como fonte única e completa sobre o que o sistema faz, seus requisitos funcionais e não funcionais, arquitetura, números reais e conquistas técnicas — pronto para servir de base na elaboração de versões resumidas para **currículo, LinkedIn, portfólio e entrevistas técnicas**.

---

## 1. Visão Geral e Descrição do Sistema

### 1.1 O que é o Estoque.OS
O **Estoque.OS** é uma aplicação web **Full-Stack SaaS B2B Multi-Organização e Multi-Filial** (um ERP/PDV leve na nuvem) projetada para o controle completo de mercadorias, categorias, fornecedores, pedidos com múltiplos itens, livro-razão de movimentações, relatórios executivos e gestão de equipes para **redes varejistas e estabelecimentos comerciais com uma ou múltiplas lojas**.

O sistema opera sob a hierarquia **Organização (Rede/Empresa) → Múltiplas Lojas (Filiais)**, garantindo isolamento lógico total no banco de dados e isolamento físico de mídias no armazenamento em nuvem (Cloudinary). Cada empresa cliente pode cadastrar novas filiais, separar o login de administradores e colaboradores em portais distintos, controlar permissões por cargo (**RBAC**), fechar vendas com carrinho multi-item à prova de concorrência, anexar comprovantes de pagamento, realizar estornos supervisionados, importar/exportar planilhas `.xlsx`/`.csv` em lote e gerir todo o ciclo de vida de funcionários (matrícula única, férias, suspensão, transferência entre lojas e demissão definitiva preservando 100% do histórico de vendas).

### 1.2 Problema Real Resolvido e Valor Entregue
- **Elimina planilhas soltas e retrabalho:** permite migrar até `5.000` produtos de uma vez via `.xlsx`/`.csv` com pré-validação em tela.
- **Elimina furos de estoque sob concorrência:** impede que vendas simultâneas ou cliques duplos corrompam o saldo físico ou gerem vendas duplicadas.
- **Preserva a integridade financeira e histórica:** congela preços em `Decimal(10, 2)` no momento da venda e garante que a demissão de um vendedor ou a inativação de um produto/loja nunca quebre relatórios nem apague faturamento passado.
- **Entrega governança centralizada com sigilo operacional:** donos de redes acompanham todas as lojas consolidadas ou isoladas, enquanto gerentes administram apenas sua filial e operadores de balcão visualizam exclusivamente suas próprias vendas.

### 1.3 Números Reais e Métricas Comprovadas do Projeto
*(Dados medidos diretamente no repositório e ambiente em produção — úteis para quantificar impacto no currículo)*

| Dimensão | Métrica Verificada |
|---|---|
| **Tamanho do núcleo de código** | `134` arquivos / `23.426` linhas (`38` arq. / `7.333` linhas no backend; `81` arq. / `13.694` linhas no frontend; `14` arq. / `1.792` linhas no Prisma; `1` suíte E2E de `607` linhas) |
| **Superfície da API REST** | `57` rotas HTTP (`4` públicas + `53` protegidas por JWT `HS256` e RBAC) + entrega de `/uploads` |
| **Banco de Dados (PostgreSQL Neon)** | `10` models (tabelas principais), `4` enums e `9` migrações SQL ordenadas cronologicamente |
| **Regras de Negócio Catalogadas** | `33` regras verificadas no código (`RN-001` a `RN-033`) |
| **Auditoria de Engenharia & Segurança** | `30` problemas auditados (`19` resolvidos, `10` resolvidos em parte com pendências mapeadas, `1` em aberto) |
| **Testes Automatizados (E2E)** | `7/7` cenários completos aprovados contra API + PostgreSQL Neon reais (`multitenant_audit.test.mjs`) |
| **Qualidade & Segurança de Pacotes** | `0` erros e `0` avisos no `ESLint`; `0` vulnerabilidades no frontend (`npm audit fix`); backend reduzido de `14` (1 crítica) para `5` avisos indiretos de CLI/dev |
| **Build Frontend & Deploy Nuvem** | `2.420` módulos compilados via Vite (`1.020,48 kB` JS / `284,61 kB` gzip; `48,39 kB` CSS); deploy ativo na Vercel (frontend), Render (backend) e NeonDB (banco) |
| **Documentação Técnica** | `16` documentos em `relatorios/` + `38/38` arquivos do backend padronizados com documentação inline |

---

## 2. Perfis de Usuário, Portais e Controle de Acesso (RBAC)

O sistema segrega a autenticação em **dois portais independentes** e aplica controle de acesso estrito no servidor (nunca confiando apenas na interface):

### 2.1 Portais de Autenticação
1. **Portal do Administrador (`/admin/login`):** exclusivo para contas `ADMIN`. Permite abrir uma nova Organização (criando atomicamente a Organização + 1ª Loja Matriz + conta fundadora `ADMIN`) e entrar para administrar toda a rede. Rejeita contas `GERENTE` e `OPERADOR` com HTTP `403`.
2. **Portal da Loja (`/login` e `/auth`):** exclusivo para `GERENTE` e `OPERADOR` vinculados a uma filial específica. Se um `ADMIN` tentar entrar aqui, o servidor responde `403` orientando para `/admin/login`.
3. **Seletor Multi-Organização:** se o mesmo par e-mail/senha existir em 2 ou mais organizações ativas, `POST /auth/login` retorna `{ requiresOrgSelection: true, organizations }` para o usuário escolher em qual empresa deseja entrar.

### 2.2 Matriz de Permissões por Cargo

| Capacidade / Módulo | `ADMIN` (Rede Global) | `GERENTE` (Filial Única) | `OPERADOR` (Balcão / Filial Única) |
|---|---|---|---|
| **Escopo de visualização** | Rede inteira (`"Todas as Lojas"`) ou qualquer filial da Organização via `X-Loja-Id` | Travado estritamente na própria `lojaId` | Travado estritamente na própria `lojaId` e **apenas nos próprios registros** |
| **Gestão de Lojas (`/stores`, `/dashboard/lojas`)** | Criar, editar, inativar/reativar e excluir | Apenas leitura da própria loja (`403` em escrita) | Apenas leitura da própria loja (`403` em escrita) |
| **Gestão de Equipe e RH (`/users`, `/dashboard/usuarios`)** | Completo (criar, editar, transferir loja, suspender/férias, demitir, reemitir relatório) | Bloqueado (`403`); acessa apenas `GET /users/names` | Bloqueado (`403`), inclusive em `GET /users/names` |
| **Catálogo (Produtos, Categorias, Fornecedores)** | Criar, editar, inativar/reativar e `DELETE` | Criar, editar e inativar/reativar (`403` em `DELETE`) | Apenas leitura (e lançamentos de estoque/pedidos) |
| **Planilhas `.xlsx` / `.csv` (Importar e Exportar)** | Sim (na loja escolhida ou rede na exportação) | Sim (apenas na própria loja) | Bloqueado (`403`) |
| **Criar Pedidos Multi-Item e Anexar Comprovantes** | Sim | Sim | Sim |
| **Estornar / Cancelar Pedidos (`POST /orders/:id/cancel`)** | Sim | Sim | Bloqueado (`403`) |
| **Ranking e Desempenho de Vendedores (`/dashboard/desempenho`)** | Sim (rede ou filial, incluindo desligados) | Sim (vendedores da própria filial) | Bloqueado (`403`) |
| **Relatório Executivo PDF A4** | Rede inteira ou 1 filial (com ranking e fornecedores) | Própria filial (com ranking e fornecedores) | Apenas suas próprias vendas (`scope: 'user'`, sem ranking de terceiros) |
| **Editar Próprio Perfil (`/users/me`)** | Sim | Sim (`role` bloqueada com `403`) | Sim (`role` bloqueada com `403`) |

---

## 3. Catálogo Completo de Funcionalidades (Módulo por Módulo)

### 3.1 Multi-Organização e Gestão de Filiais (`/stores` · `/dashboard/lojas`)
- **Onboarding instantâneo de redes:** cadastro público cria `Organizacao` → `Loja` Matriz → fundador `ADMIN` em uma única transação atômica (`prisma.$transaction`).
- **Seletor global de filial:** na barra lateral (`Sidebar.jsx` + `useTenantStore.js`), o `ADMIN` alterna instantaneamente entre `"Todas as Lojas"` e uma unidade específica, injetando automaticamente o cabeçalho `X-Loja-Id` nas requisições via `apiClient.js`.
- **Governança de filiais:** criação com slug único por organização (`@@unique([organizacaoId, slug])`), edição cadastral, inativação/reativação lógica (`PATCH /stores/:id/status`) e exclusão inteligente (exclusão física se vazia ou Soft Delete automático se possuir histórico).
- **Trava anti-lockout:** impede desativar ou excluir a última loja ativa da Organização (`400`) e invalida o cache de autenticação na hora ao inativar uma loja (bloqueando imediatamente logins e rotas da equipe daquela filial com `403`).

### 3.2 Gestão de Equipe, RH, Matrícula e Demissão Auditável (`/users` · `/dashboard/usuarios`)
- **Matrícula única determinística:** todo colaborador cadastrado recebe automaticamente uma matrícula no padrão `MAT-00001` (derivada do ID), pesquisável em equipe, pedidos, movimentações e desempenho.
- **Campos de RH e Situação Funcional:** armazenamento de `telefone`, `dataAdmissao`, foto de perfil no Cloudinary e `situacao` (`ATIVO`, `SUSPENSO` ou `FERIAS`).
- **Bloqueio imediato de afastados:** alterar um colaborador para `SUSPENSO` ou `FERIAS` (`PATCH /users/:id/situation`) limpa o cache na hora e bloqueia imediatamente o login e qualquer requisição com token ativo (`403`).
- **Transferência rápida de filial:** `ADMIN` transfere `GERENTE` ou `OPERADOR` entre filiais ativas da mesma organização (`PATCH /users/:id/store`), refletindo imediatamente nos acessos e relatórios futuros.
- **Demissão real preservando 100% do histórico:** diferente do catálogo (que usa Soft Delete), o usuário demitido (`DELETE /users/:id`, aceitando `dataDemissao` e `motivo` opcionais) é **removido fisicamente** da tabela `Usuario` junto com seu avatar, desconectando com segurança as chaves estrangeiras (`ON DELETE SET NULL`), gravando arquivamento permanente em **`RegistroDesligamento`** (mesmo se tiver `0` vendas) e preservando **snapshots imutáveis** em pedidos e movimentos (`vendedorRefId`, nome, e-mail, `MAT-XXXXX (CANCELADA)`, data de admissão e data de demissão).
- **Filtro de desligados e Relatório Final de Desligamento (PDF A4):** na tela `/dashboard/usuarios`, gestores podem filtrar por `DESLIGADO` ou `todos`, consultar datas no popup `Info` (`ModalInfoUsuario.jsx`) e gerar ou reabrir a qualquer momento (`GET /users/:refId/dismissal-report`) o **Relatório Final de Desligamento em PDF A4** detalhando as vendas mês a mês entre admissão e demissão (`ModalRelatorioDesligamento.jsx`).
- **Proteções de governança:** bloqueia autoexclusão, autossuspensão e qualquer exclusão, rebaixamento ou suspensão do último `ADMIN ATIVO` da organização.

### 3.3 Catálogo de Produtos, Categorias, Fornecedores e Ajuste Unitário
- **Gestão completa por filial:** cadastro, edição, upload de imagem (isolada em `estoque-os/organizacoes/<org>/lojas/<loja>/produtos`), busca textual, ordenação, filtros por categoria, fornecedor e status (`ativos`, `inativos`, `todos`) e paginação com teto de `100` itens por página.
- **Soft Delete inteligente:** `Produto`, `Categoria` e `Fornecedor` possuem `ativo: Boolean` e `PATCH /:id/status`. Se um `ADMIN` acionar `DELETE` em um item com histórico vinculado, o sistema converte automaticamente em inativação lógica sem gerar erro `500` de chave estrangeira. Produtos inativos ficam bloqueados para novas vendas/ajustes (`400`).
- **Unicidade por filial:** nomes de categoria são únicos dentro de cada loja (`@@unique([lojaId, nome])`).
- **Estatísticas agregadas no banco:** KPIs de estoque (`/products/stats` — itens com estoque baixo `< 10`, patrimônio total em `Decimal(10, 2)` e distribuição por categoria) e métricas de giro por fornecedor (`/suppliers/stats` — SQL nativo ignorando estornos e pedidos cancelados, com exibição explícita de fornecedores inativos).
- **Ajuste unitário seguro (`POST /products/:id/adjust`):** suporta `VENDA` e `REPOSICAO` com lock pessimista `SELECT ... FOR UPDATE`, proteção contra clique duplo (`Idempotency-Key` + debounce de `1,2s`), preço unitário/total em `Decimal(10, 2)` e snapshots do vendedor.

### 3.4 Pedidos Multi-Item, Comprovação de Pagamento e Estorno (`/orders` · `/dashboard/pedidos`)
- **Carrinho multi-item atômico (`POST /orders`):** cria pedidos de `VENDA` ou `REPOSICAO` (vinculável a fornecedor) com múltiplos produtos numa única transação (`Pedido` + `ItemPedido` + espelho contábil em `Movimento` + atualização de saldos).
- **Prevenção de *race conditions* e *deadlocks*:** agrupa itens repetidos no carrinho, ordena os IDs de produtos de forma determinística (`ORDER BY id ASC FOR UPDATE`) e valida produto ativo e estoque suficiente **após** adquirir a trava no PostgreSQL.
- **Congelamento de preços e idempotência:** congela `precoUnitario` e `subtotal` em `ItemPedido` (`Decimal(10, 2)`) para que reajustes futuros nunca alterem o faturamento passado, e suporta `Idempotency-Key` (TTL `10 min`, isolada por `${orgId}:${lojaId}:${key}`) contra cliques duplos.
- **Comprovação formal de pagamento e recebimento:** armazena `formaPagamento`, `statusPagamento`, `comprovanteCodigo` (`PIX`, NSU, recibo), `recebidoPor` e anexo de comprovante (imagem ou PDF no Cloudinary). Permite anexar ou atualizar comprovação posteriormente (`PATCH /orders/:id/proof`) e imprimir recibo formal.
- **Cancelamento e estorno supervisionado (`POST /orders/:id/cancel`):** restrito a `ADMIN` e `GERENTE` (`OPERADOR` recebe `403`). Reverte o saldo de todos os itens atomicamente com `FOR UPDATE`, altera o pedido para `CANCELADO` / `ESTORNADO` e registra movimentos inversos marcados com `estorno = true` — que são excluídos automaticamente de todos os cálculos financeiros e rankings.
- **Busca avançada:** filtra pedidos por código (`PED-...`), comprovante, recebedor, cliente, nome, e-mail ou **Matrícula / ID (`vendedorRefId`)**, respeitando sigilo de `OPERADOR`.

### 3.5 Importação e Exportação Nativa de Planilhas (`.xlsx` / `.csv`)
- **Motor nativo em Node.js (`ExcelJS`):** sem microserviços externos nem custo extra de infraestrutura (`productSpreadsheetService.js`).
- **Planilha modelo (`GET /products/import/template`):** gera modelo `.xlsx` ou `.csv` (UTF-8 BOM) com cabeçalhos e exemplos prontos.
- **Importação em duas etapas (`POST /products/import`, até `2 MB` e `5.000` linhas):**
  - `mode=preview`: valida todas as linhas em memória e identifica novas categorias/fornecedores sem gravar nada no banco.
  - `mode=commit`: grava atomicamente na filial alvo via `prisma.$transaction` (ou aborta integralmente com `400` se houver qualquer linha inválida).
- **Exportação protegida (`GET /products/export`):** exporta o catálogo filtrado (rede ou loja) em `.xlsx` ou `.csv` com neutralização de **Formula Injection** (`sanitizeSpreadsheetCell` escapando `=`, `+`, `-`, `@`).

### 3.6 Dashboard, Livro-Razão, Desempenho de Vendedores e Relatórios PDF A4
- **Dashboard interativo (`/dashboard`):** indicadores patrimoniais em tempo real, gráfico de fluxo de mercadorias (`Recharts`) com seletor `1m` / `6m` / `1y`, alertas de estoque baixo com valores absolutos/percentuais e modal clicável que redireciona para `/dashboard/produtos?focus=<id>`, além de movimentações recentes clicáveis (`ModalMovimentacao.jsx`).
- **Livro-razão de movimentações (`/dashboard/movimentacoes` · `GET /movements`):** histórico unitário paginado com busca por produto, tipo, matrícula ou `vendedorRefId`, mantendo sigilo de `OPERADOR`.
- **Painel de Desempenho de Vendedores (`/dashboard/desempenho`):** exclusivo para `ADMIN` e `GERENTE`. Exibe ranking completo do melhor ao pior vendedor preservando a posição real mesmo durante buscas filtradas, busca universal por **Matrícula (`MAT-00063`)**, ID antigo, nome ou e-mail, opção `includeDeleted` para auditar ex-funcionários, raio-X simultâneo de `1m`/`6m`/`1y`, cálculo de `mesesTrabalhados`, gráfico dos últimos 12 meses, top produtos vendidos e pedidos recentes (`GET /movements/performance` e `GET /movements/performance/:refId`).
- **4 Geradores de Relatórios PDF A4 nativos:**
  1. Relatório executivo de vendas por rede, filial ou vendedor (`ModalExportarRelatorio.jsx` — gráficos SVG, faturamento livre de estornos, ranking de vendedores e giro de fornecedores);
  2. Ficha individual de desempenho de vendedor (`DesempenhoVendedores.jsx`);
  3. Relatório final de desligamento mês a mês (`ModalRelatorioDesligamento.jsx`);
  4. Recibo formal de pedido com comprovação (`Pedidos.jsx`).

### 3.7 Experiência do Usuário (UX) e Interface Web
- **Identidade visual moderna:** React 19 + Tailwind CSS + Framer Motion com tema Claro/Escuro persistido (`useThemeStore`), estilização Glassmorphism e responsividade mobile/desktop.
- **Modais e feedback padronizados:** 100% dos `window.alert`, `window.confirm` e `window.prompt` substituídos por `ModalConfirmacao.jsx` (via `createPortal` com variantes e campo opcional de justificativa/data), toasts com fade-out gradual (`ModalMensagem.jsx`) e painéis de filtro colapsáveis em todas as telas principais.
- **Resiliência de partida fria (*cold-start*):** `apiClient.js` integrado ao `serverToast.js` aguarda `1000 ms` e exibe aviso amigável enquanto o servidor em nuvem no Render acorda, além de interceptor `401` que limpa sessão expirada e redireciona ao login.

---

## 4. Requisitos Funcionais (RF)

| Código | Requisito Funcional | Regras de Negócio Associadas |
|---|---|---|
| **RF-01** | Oferecer portais separados de autenticação (`/admin/login` e `/login`), cadastro público transacional de nova `Organizacao` + 1ª `Loja` + `ADMIN` e seletor multi-organização para contas presentes em mais de uma rede ativa. | `RN-001`, `RN-002`, `RN-023`, `RN-027` |
| **RF-02** | Isolar 100% das consultas, escritas, planilhas e pastas de mídia no Cloudinary por `organizacaoId` e `lojaId`, devolvendo `404` em tentativas entre organizações e respeitando `X-Loja-Id` exclusivamente para `ADMIN`. | `RN-022`, `RN-024`, `RN-026` |
| **RF-03** | Permitir ao `ADMIN` criar, editar, inativar/reativar e remover lojas (`/dashboard/lojas`), impedindo a desativação da última filial ativa e aplicando Soft Delete automático quando houver histórico. | `RN-004`, `RN-030` |
| **RF-04** | Permitir ao `ADMIN` gerenciar colaboradores (`/dashboard/usuarios`) com geração automática de matrícula (`MAT-00001`), telefone, data de admissão, controle de situação (`ATIVO`/`SUSPENSO`/`FERIAS` com bloqueio imediato `403`), transferência entre filiais e proteção contra autoexclusão/autossuspensão e remoção do último `ADMIN ATIVO`. | `RN-004`, `RN-005`, `RN-006`, `RN-008`, `RN-009`, `RN-028`, `RN-032` |
| **RF-05** | Executar demissão de usuário com exclusão física da conta e avatar (`ON DELETE SET NULL`), gravando permanentemente `RegistroDesligamento` (com `dataDemissao` e `motivo`) e snapshots históricos (`MAT-XXXXX (CANCELADA)`), permitindo filtro de desligados e emissão/reemissão do Relatório Final Mensal PDF. | `RN-029` |
| **RF-06** | Gerenciar catálogo de Produtos, Categorias e Fornecedores por filial com unicidade de categoria por loja, Soft Delete automático em `DELETE` quando houver vínculos históricos e bloqueio de movimentação em itens inativos (`400`). | `RN-007`, `RN-010`, `RN-011`, `RN-012`, `RN-015`, `RN-016`, `RN-017`, `RN-020` |
| **RF-07** | Registrar pedidos multi-item (`VENDA` e `REPOSICAO`) e ajustes unitários de forma transacional com lock `FOR UPDATE`, `Idempotency-Key`, congelamento de preços em `Decimal(10, 2)` e registro/atualização de comprovantes (`PIX`, NSU, recebedor, anexo). | `RN-013`, `RN-014` |
| **RF-08** | Permitir a `ADMIN` e `GERENTE` cancelar/estornar pedidos (`POST /orders/:id/cancel`), revertendo saldos atomicamente, gravando movimentos `estorno = true` e excluindo estornos e cancelados de todos os relatórios financeiros e rankings. | `RN-031` |
| **RF-09** | Fornecer painel dedicado de desempenho de vendedores (`/dashboard/desempenho`) com ranking melhor→pior (posição real preservada), busca por Matrícula/ID (incluindo desligados), comparativo `1m`/`6m`/`1y` e linha do tempo de meses trabalhados. | `RN-018`, `RN-019`, `RN-021`, `RN-029`, `RN-031` |
| **RF-10** | Garantir sigilo total do perfil `OPERADOR`, restringindo listagens e PDFs às suas próprias vendas/pedidos (`scope: 'user'`) e bloqueando (`403`) rotas administrativas, estornos e estatísticas de colegas. | `RN-018`, `RN-019`, `RN-021`, `RN-026` |
| **RF-11** | Disponibilizar download de modelo, pré-validação (`preview`), importação transacional (`commit`, até `5.000` linhas / `2 MB`) e exportação de planilhas `.xlsx`/`.csv` por filial. | `RN-025`, `RN-033` |
| **RF-12** | Emitir relatórios executivos, fichas de desempenho, relatórios de desligamento e recibos de pedido em formato imprimível PDF A4, protegidos contra injeção de código (XSS). | `RN-031`, `RN-033` |

---

## 5. Requisitos Não Funcionais (RNF)

### 5.1 Segurança de Aplicação (AppSec)
- **Autenticação e Senhas:** senhas com mínimo de `6` caracteres armazenadas com hash `bcryptjs` (custo 10); JWT com expiração de `8h` assinado e verificado exclusivamente em **`HS256`**, exigindo cabeçalho estrito `^Bearer\s+(\S+)$` e `userId > 0`; fail-fast no boot em produção caso `JWT_SECRET` tenha menos de `16` caracteres.
- **Proteção HTTP e Limites de Tráfego:** `Helmet`, `CORS` multi-origem normalizado, `app.set("trust proxy", 1)` para leitura do IP real atrás do Render, limite de `1 MB` para corpos JSON/URL-encoded, `dotfiles: "ignore"` em `/uploads` e **Rate Limiting** em 3 níveis (`apiLimiter` global `400 req / 15 min / IP`, `loginLimiter` `25 req / 15 min / IP` e `registerLimiter` `15 req / 1 h / IP`).
- **Validação e Sanitização:** whitelist dupla em uploads (extensão ancorada `^\.(...)$` + tipo real MIME) com nomes aleatórios via `crypto.randomBytes`; prevenção de **Path Traversal** (`removeLocalUploadIfSafe` via `path.resolve`); validação de URLs (`sanitizeSafeUrl` e `formatImageUrl` bloqueando `javascript:` e `data:`); neutralização de **Formula Injection** em `.xlsx`/`.csv` (`sanitizeSpreadsheetCell`); prevenção de **XSS** com `escapeHtml` em todos os 4 geradores HTML/PDF e `rel="noopener noreferrer"` em links externos.
- **Sigilo de Erros:** `errorHandler.js` suprime stack traces e erros internos de banco/infraestrutura em respostas `>= 500` em produção (registrando apenas nos logs internos), além de omitir `details` em `/test-db`.

### 5.2 Integridade Contábil e Consistência de Dados
- **Precisão monetária:** todos os campos financeiros (`Produto.preco`, `Pedido.valorTotal`, `ItemPedido.*`, `Movimento.*`) usam `Decimal(10, 2)` (`numeric(10,2)` no PostgreSQL).
- **Atomicidade e concorrência:** uso sistemático de `prisma.$transaction`, travas pessimistas `SELECT ... FOR UPDATE` (ordenadas por `id ASC` em multipedidos para evitar deadlocks), `Idempotency-Key` + debounce de `1,2s`, restrições `UNIQUE` no PostgreSQL e `ON DELETE SET NULL` com snapshots imutáveis.

### 5.3 Performance e Eficiência
- **Eliminação de N+1 e agregações no banco:** consultas de desempenho, ranking e fornecedores rodam em **SQL nativo (`$queryRaw`)** diretamente no PostgreSQL (eliminando o gargalo inicial que chegava a `3.117,9 ms` na baseline de 08/11/2026).
- **Caching com invalidação atômica:** `userCache` (TTL `60s`, eliminando ~`140 ms` de latência WAN por requisição autenticada em cache hit) e `namesCacheByScope` (TTL `30s`), invalidados imediatamente em qualquer escrita de usuário ou loja.
- **Indexação e paginação:** índices compostos `[organizacaoId, lojaId, ...]` e `[organizacaoId, vendedorRefId, data]` no PostgreSQL; paginação com limite máximo de `100` itens em `/orders`, `/movements`, `/products` e `/users`.
- **Conexão em nuvem:** uso do pooler gerenciado Neon (`PgBouncer`, endpoint `-pooler`) com `&connect_timeout=15`.

### 5.4 Confiabilidade, Observabilidade e Manutenibilidade
- **Observabilidade:** logs estruturados em JSON com `Pino` (`logger.js`) e **Correlation ID** único (`X-Request-Id` UUID v4 em `requestLogger.js`) rastreando cada requisição e sua duração (`durationMs`).
- **Resiliência operacional:** `Graceful Shutdown` (`SIGTERM`/`SIGINT` com timeout de `10s` fechando HTTP e `prisma.$disconnect()`), healthchecks `/` e `/test-db`, isolamento de falhas transitórias de banco no `authMiddleware.js` e timeout rígido de `10s` (`Promise.race`) + limpeza garantida (`fs.unlink` no `finally`) no `uploadToCloudinary`.
- **Qualidade e Padrão Documental:** suíte E2E `7/7` (`npm test`), verificação unitária de sanitizadores, `ESLint` zerado, `9` migrações versionadas determinísticas, `seed.js` completo (2 organizações, 3 lojas, 12 meses de vendas e ex-vendedor desligado), `.editorconfig`/`.gitattributes` padronizados em `LF` e 100% dos 38 arquivos do backend documentados no padrão `promptFuncExplic2.md`.

---

## 6. Resumo Técnico: Stack, Arquitetura, Banco de Dados e APIs

### 6.1 Stack Tecnológica
- **Frontend:** React `19.1.1`, Vite `7.3.8`, React Router DOM `7.18.5`, Zustand `5.0.8`, Tailwind CSS `3.4.17`, Framer Motion `12.23.22`, Recharts `3.3.0`, Lucide React, React Icons, ESLint `9.35.0`.
- **Backend:** Node.js (ES Modules), Express `5.2.1`, Prisma ORM `6.16.2`, ExcelJS `4.4.0`, Cloudinary SDK `2.10.0`, Multer `2.5.0`, Pino `8.14.0`, BcryptJS `3.0.2`, JSON Web Token `9.0.2`, Helmet `7.2.0`, Express Rate Limit `6.8.0`, CORS `2.8.5`.
- **Banco de Dados e Infraestrutura:** PostgreSQL (Neon Cloud com Pooler PgBouncer), Cloudinary CDN (armazenamento de imagens/PDFs), Vercel (deploy Frontend) e Render (deploy Backend).

### 6.2 Arquitetura em Camadas
- **Backend (Monólito Modular RESTful):** `Routes` → `Middlewares (auth, permit, validateRequest, multer, rateLimit, requestLogger)` → `tenantScope` → `Controllers` → `Services` → `Prisma ORM` → `PostgreSQL Neon / Cloudinary`.
- **Frontend (SPA Desacoplada):** `Portais & Pages` → `Zustand Stores (auth, user, tenant, theme)` → `apiClient.js (Bearer + X-Loja-Id + serverToast 1000ms + interceptor 401)` → `API REST`.

### 6.3 Modelagem do Banco de Dados (`10` Models · `4` Enums · `9` Migrações)
- **Models principais:** `Organizacao`, `Loja`, `Usuario`, `Categoria`, `Fornecedor`, `Produto`, `Pedido`, `ItemPedido`, `Movimento`, `RegistroDesligamento`.
- **Enums:** `Role` (`ADMIN`, `GERENTE`, `OPERADOR`), `MovimentoTipo` (`VENDA`, `REPOSICAO`), `PedidoStatus` (`CONCLUIDO`, `CANCELADO`), `SituacaoFuncionario` (`ATIVO`, `SUSPENSO`, `FERIAS`).

### 6.4 Mapa Resumido das 57 Rotas HTTP
- **Diagnóstico (`2` + `/uploads`):** `GET /`, `GET /test-db`, `USE /uploads`.
- **Autenticação (`/auth` — `2`):** `POST /auth/login`, `POST /auth/register`.
- **Lojas (`/stores` — `6`):** `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`.
- **Usuários & RH (`/users` — `11`):** `GET /me`, `PUT /me`, `GET /names`, `GET /`, `GET /:id`, `GET /:refId/dismissal-report`, `POST /`, `PUT /:id`, `PATCH /:id/store`, `PATCH /:id/situation`, `DELETE /:id`.
- **Produtos & Planilhas (`/products` — `12`):** `GET /count`, `GET /stats`, `GET /export`, `GET /import/template`, `POST /import`, `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`, `POST /:id/adjust`.
- **Categorias (`/categories` — `6`):** `GET /count`, `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`.
- **Fornecedores (`/suppliers` — `8`):** `GET /stats`, `GET /count`, `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`.
- **Multipedidos & Estornos (`/orders` — `5`):** `GET /`, `GET /:id`, `POST /`, `PATCH /:id/proof`, `POST /:id/cancel`.
- **Movimentações & Desempenho (`/movements` — `5`):** `GET /sales-report`, `GET /performance`, `GET /performance/:refId`, `GET /user-stats`, `GET /`.

---

## 7. Principais Conquistas de Engenharia (Base Pronta para Currículo e Entrevistas)

Os blocos abaixo condensam os diferenciais técnicos mais fortes do projeto no formato **Desafio → Solução → Resultado/Evidência**:

1. **Arquitetura SaaS Multi-Organização e Multi-Filial:**
   - *Solução:* Evolução de sistema single-tenant para hierarquia `Organizacao → múltiplas Lojas`, com resolvedor central de escopo (`tenantScope.js` + cabeçalho `X-Loja-Id`), portais separados (`/admin/login` e `/login`), RBAC estrito em 3 níveis e pastas isoladas no Cloudinary.
   - *Evidência:* `7/7` cenários E2E automatizados contra PostgreSQL Neon validando isolamento cross-tenant (`404`) e bloqueios por cargo (`403`).
2. **Integridade Transacional e Controle de Concorrência em Pedidos Multi-Item:**
   - *Solução:* Implementação de carrinho multi-item e estornos em `prisma.$transaction` com bloqueio pessimista ordenado (`ORDER BY id ASC FOR UPDATE` prevenindo *lost updates* e *deadlocks*), idempotência (`Idempotency-Key` + debounce `1,2s`) e precisão financeira em `Decimal(10, 2)` com congelamento histórico de preços.
3. **Otimização de Performance de Banco e Latência WAN:**
   - *Solução:* Eliminação de consultas N+1 (que atingiam pico de `3,12s` sob concorrência na baseline) via agregações em SQL nativo (`$queryRaw`), criação de índices compostos multi-tenant e camada de cache em memória (`userCache` 60s / `namesCache` 30s) com invalidação imediata em escritas, economizando ~`140 ms` por requisição autenticada em cache hit.
4. **Gestão de RH e Exclusão Física Auditável Sem Quebra de Histórico:**
   - *Solução:* Modelagem de demissão real de `Usuario` (`ON DELETE SET NULL`) combinada com tabela permanente `RegistroDesligamento` e snapshots congelados em pedidos/movimentos (`vendedorRefId`, `MAT-XXXXX (CANCELADA)`), garantindo auditoria mensal em PDF e preservação contábil mesmo após exclusão da conta.
5. **Motor Nativo de Planilhas `.xlsx`/`.csv` Sem Serviços Extras:**
   - *Solução:* Importação/exportação com `ExcelJS` em duas fases (`preview` de validação em memória + `commit` atômico em transação até `5.000` linhas), com neutralização de Formula Injection.
6. **Hardening de Segurança (AppSec) e Confiabilidade em Produção:**
   - *Solução:* Blindagem contra XSS nos 4 geradores PDF A4 (`escapeHtml`), validação dupla extensão+MIME e proteção contra Path Traversal em uploads, JWT estrito `HS256`, rate limiting em 3 níveis atrás de proxy (`trust proxy`), logs estruturados (`Pino` + `X-Request-Id`), `Graceful Shutdown` e `npm audit fix` zerando vulnerabilidades no frontend (`0`).

---

## 8. Limitações Conhecidas e Evoluções Planejadas (Transparência Técnica)

*(Útil para demonstrar maturidade técnica em entrevistas ao falar de trade-offs e próximos passos)*

- **Performance / Frontend:** dividir o bundle JS único (`1.020,48 kB`) com `React.lazy()` + `<Suspense>` (`DESEMPENHO-08`), eliminar as últimas 2 chamadas `fetch()` diretas em `EditarItem.jsx` (`TELA-02`), criar endpoint agregado `GET /movements/flow-summary` removendo `limit=all` do gráfico mensal (`DESEMPENHO-01` / `DESEMPENHO-03`) e executar novo benchmark HTTP pós-otimizações (atualmente `NÃO MEDIDO`).
- **Escala Multi-Instância e Assincronismo:** externalizar caches, idempotência e rate limit para **Redis** antes de escalar para 2+ instâncias simultâneas (`OPERACAO-06`) e migrar o upload de imagens para envio assíncrono/direto ao Cloudinary (`DESEMPENHO-07`).
- **Segurança & DevOps Futuros:** migrar JWT de `localStorage` para cookies `HttpOnly` + `Refresh Token` sob domínio unificado (`ACESSO-04`), adicionar `@db.VarChar` no `schema.prisma` (`ENTRADA-01`), configurar pipeline CI/CD no GitHub Actions + testes E2E de browser com Playwright (`QUALIDADE-01`).
- **Produto Comercial:** integração fiscal nativa (NFC-e / NF-e / SAT), cobrança recorrente SaaS (Stripe / Asaas) e leitura de código de barras (SKU/EAN).
