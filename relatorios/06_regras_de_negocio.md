# 📑 RELATÓRIO TÉCNICO 06 — CATÁLOGO DE REGRAS DE NEGÓCIO (RN-xxx)
## Projeto: Estoque.OS — Mapeamento de Regras, Camadas de Aplicação e Lacunas (Fase 3)
**Data da Auditoria:** 2026-11-08  
**Classificação do Projeto:** Nível de Refinamento `MEDIUM`  
**Responsável Técnico:** Senior Software Architect / Lead Auditor  
**Documento de Origem:** `PROMPT_MASTER_UNIFICADO.md`  

---

## 1. Visão Geral das Regras de Negócio

Este catálogo mapeia todas as regras de negócio que o código-fonte do **Estoque.OS** efetivamente aplica ou tenta aplicar. Conforme as diretrizes invioláveis da auditoria:
> *Uma regra validada apenas na interface frontend é classificada como **PROBLEMA / LACUNA**, e não como proteção de negócio.*

---

## 2. Catálogo Estruturado de Regras de Negócio

### 2.1 Autenticação e Credenciais

#### [RN-001] Autenticação Obrigatória com Criptografia Irreversível
- **Descrição:** O acesso às funcionalidades operacionais exige e-mail e senha cadastrados. As senhas devem ser criptografadas com Bcrypt (salt cost 10) e nunca armazenadas em texto puro.
- **Perfis Envolvidos:** Todos (`ADMIN`, `GERENTE`, `OPERADOR`).
- **Onde é Aplicada:** [`backend/src/services/authService.js#authenticateUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L13) e [`registerUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L39).
- **Em que Camada:** API / Service (`bcrypt.compare` e `bcrypt.hash`).
- **Coberta por Testes:** `NÃO` (Ausência de suíte automatizada).
- **Lacunas Identificadas:** `Nenhuma`. O hash Bcrypt é implementado corretamente.

#### [RN-002] Auto-Cadastro Público Restrito ao Papel `OPERADOR`
- **Descrição:** Qualquer usuário não autenticado que se cadastre através do endpoint público `/auth/register` terá obrigatoriamente o papel `role` fixado como `OPERADOR`, ignorando qualquer parâmetro enviado pelo cliente.
- **Perfis Envolvidos:** Não autenticados (visitantes).
- **Onde é Aplicada:** [`backend/src/services/authService.js#registerUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L51) e [`authController.js#registerController`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/authController.js#L21).
- **Em que Camada:** API / Service (Hardcoded `role: 'OPERADOR'`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma`. Previne escalação horizontal por *mass assignment*.

#### [RN-003] Mitigação de Força Bruta por Limitação de Taxa (Rate Limit)
- **Descrição:** Requisições à rota de login devem ser limitadas a no máximo 10 tentativas por endereço IP a cada janela de 15 minutos.
- **Perfis Envolvidos:** Não autenticados.
- **Onde é Aplicada:** [`backend/src/routes/authRoutes.js#L12-L16`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L12-L16).
- **Em que Camada:** API / Middleware (`express-rate-limit`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas (`PROBLEMA - Catálogo I10`):** A rota de cadastro público (`POST /auth/register`) **não possui rate limit**, permitindo ataques de negação de serviço e inflação do banco com contas descartáveis.

---

### 2.2 Gestão de Usuários e Autorização (RBAC)

#### [RN-004] Administração de Contas de Terceiros Exclusiva de Administradores
- **Descrição:** Somente usuários com papel `ADMIN` têm permissão para criar, listar, detalhar, editar e excluir contas de outros usuários.
- **Perfis Envolvidos:** `ADMIN` (autorizado); `GERENTE` e `OPERADOR` (proibidos).
- **Onde é Aplicada:** [`backend/src/routes/userRoutes.js#L39`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/userRoutes.js#L39) (`router.use(permit("ADMIN"))`).
- **Em que Camada:** API / Middleware RBAC.
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma` no backend. No frontend, o link "Usuários" aparece indevidamente na Sidebar para operadores.

#### [RN-005] Proibição Estrita de Autoexclusão de Conta
- **Descrição:** Nenhum usuário autenticado pode excluir a sua própria conta, mesmo que possua permissão de `ADMIN`.
- **Perfis Envolvidos:** `ADMIN`.
- **Onde é Aplicada:** [`backend/src/services/userService.js#deleteUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L192-L194).
- **Em que Camada:** API / Service (`requestingUserId === targetId`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma`.

#### [RN-006] Proibição de Exclusão do Último Administrador do Sistema
- **Descrição:** É expressamente proibido excluir uma conta de `ADMIN` se ela for a única com privilégios administrativos no banco de dados.
- **Perfis Envolvidos:** `ADMIN`.
- **Onde é Aplicada:** [`backend/src/services/userService.js#deleteUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L202-L207).
- **Em que Camada:** API / Service (`adminCount <= 1`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma`.

#### [RN-007] Proibição de Exclusão de Usuário com Histórico de Movimentações
- **Descrição:** Um usuário que possua movimentações de estoque registradas em seu nome não pode ser excluído do sistema, preservando a integridade referencial e auditoria.
- **Perfis Envolvidos:** `ADMIN`.
- **Onde é Aplicada:** [`backend/src/services/userService.js#deleteUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L209-L214).
- **Em que Camada:** API / Service (`user._count.movimentos > 0`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma` no backend.

#### [RN-008] Bloqueio de Auto-Escalação de Cargo em Meu Perfil (`/users/me`)
- **Descrição:** Um usuário comum (`OPERADOR` ou `GERENTE`) não pode alterar sua própria função (role) na tela de configurações. Somente administradores logados podem alterar papéis.
- **Perfis Envolvidos:** `OPERADOR`, `GERENTE`, `ADMIN`.
- **Onde é Aplicada:** [`backend/src/controllers/userController.js#updateMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L156-L158).
- **Em que Camada:** API / Controller (`if (!isAdmin && role !== undefined) throw AppError(403)`).
- **Coberta por Testes:** `NÃO`.
- **Lacunas Identificadas:** `Nenhuma`.

#### [RN-009] Brecha de Rebaixamento (Demotion) do Último Administrador (`PROBLEMA B7`)
- **Descrição:** O sistema deve impedir que o último administrador seja rebaixado para `GERENTE` ou `OPERADOR`, garantindo que o sistema nunca fique sem administradores ativos.
- **Onde DEVERIA ser Aplicada:** [`backend/src/services/userService.js#updateUser`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L134) e [`userController.js#updateMe`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L165).
- **Em que Camada:** Inexistente.
- **Lacunas Identificadas (`PROBLEMA CRÍTICO - Catálogo B7`):** Enquanto `deleteUser` impede a **exclusão** do último admin, `updateUser` e `updateMe` permitem que um admin altere seu próprio papel ou de outro para `OPERADOR`, **rebaixando o último admin do sistema e bloqueando irremediavelmente as funções de gestão**.

---

### 2.3 Gestão de Estoque e Catálogo de Produtos

#### [RN-010] Criação e Edição de Produtos Restrita a Administradores e Gerentes
- **Descrição:** Operadores de nível `OPERADOR` possuem acesso apenas de leitura ao catálogo de produtos. Apenas `ADMIN` e `GERENTE` podem cadastrar novos produtos ou atualizar preços e dados cadastrais.
- **Perfis Envolvidos:** `ADMIN`, `GERENTE` (autorizados); `OPERADOR` (proibido).
- **Onde é Aplicada:** [`backend/src/routes/productRoutes.js#L37`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L37) e [`L44`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L44) (`permit("ADMIN", "GERENTE")`).
- **Em que Camada:** API / Middleware RBAC.
- **Coberta por Testes:** `NÃO`.

#### [RN-011] Exclusão de Produtos Restrita Exclusivamente a `ADMIN`
- **Descrição:** Nem mesmo gerentes podem excluir produtos do catálogo; a operação é exclusiva de administradores.
- **Perfis Envolvidos:** `ADMIN`.
- **Onde é Aplicada:** [`backend/src/routes/productRoutes.js#L50`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L50) (`permit("ADMIN")`).
- **Em que Camada:** API / Middleware RBAC.

#### [RN-012] Proibição de Exclusão de Produto com Movimentações Registradas
- **Descrição:** Um produto que possua movimentações históricas no banco não pode ser excluído fisicamente.
- **Perfis Envolvidos:** `ADMIN`.
- **Onde é Aplicada:** [`backend/src/services/productService.js#deleteProduct`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L156-L162).
- **Em que Camada:** API / Service (`prisma.movimento.count > 0`).

#### [RN-013] Proibição de Saldo Negativo em Movimentações de Saída (`VENDA`)
- **Descrição:** Uma saída de mercadoria (`VENDA`) não pode ser autorizada se a quantidade solicitada for superior ao saldo atualmente disponível no estoque. A quantidade restante jamais pode ser inferior a 0.
- **Perfis Envolvidos:** `ADMIN`, `GERENTE`, `OPERADOR`.
- **Onde é Aplicada:** [`backend/src/services/productService.js#adjustProductQuantity`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L194-L200).
- **Em que Camada:** API / Service dentro de `prisma.$transaction`.

#### [RN-014] Concorrência e Atomicidade no Ajuste de Estoque (`PROBLEMA I1`)
- **Descrição:** O cálculo e atualização de saldo físico sob múltiplos caixas simultâneos deve ser atômico, impedindo condições de corrida (*race conditions*) e vendas duplicadas com saldo insuficiente.
- **Onde DEVERIA ser Aplicada:** No banco de dados via atualização atômica (`UPDATE "Produto" SET quantidade = quantidade - delta WHERE quantidade >= delta`) ou lock pessimista (`SELECT ... FOR UPDATE`).
- **Como está Hoje:** Implementada lendo o saldo na memória do Node.js (`tx.produto.findUnique`), calculando `newQuantity` e executando `tx.produto.update`.
- **Lacunas Identificadas (`PROBLEMA CRÍTICO - Catálogo I1`):** Em nível de isolamento padrão `Read Committed` do PostgreSQL, duas requisições simultâneas leem o mesmo saldo (ex.: 10), ambas validam a venda de 8 unidades e ambas gravam `10 - 8 = 2`, causando **Lost Update** e saldo físico negativo no armazém.

---

### 2.4 Categorias e Fornecedores

#### [RN-015] Unicidade Absoluta de Nomes de Categoria
- **Descrição:** O nome de cada categoria cadastrada deve ser exclusivo no sistema (case-insensitive ou com trim).
- **Onde é Aplicada:** [`backend/prisma/schema.prisma#L27`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L27) (`@unique`) e [`categoryService.js#createCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js#L22-L25).
- **Em que Camada:** Banco de dados (Unique constraint) e API / Service.

#### [RN-016] Proibição de Exclusão de Categoria com Produtos Vinculados
- **Descrição:** Não é permitido deletar uma categoria se houver produtos atrelados a ela.
- **Onde é Aplicada:** [`backend/src/services/categoryService.js#deleteCategory`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js#L66-L71).
- **Em que Camada:** API / Service.

#### [RN-017] Proibição de Exclusão de Fornecedor com Produtos Vinculados
- **Descrição:** Um fornecedor que possua produtos cadastrados não pode ser removido do banco.
- **Onde é Aplicada:** [`backend/src/services/supplierService.js#deleteSupplier`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js#L56-L61).
- **Em que Camada:** API / Service.

---

### 2.5 Relatórios e Auditoria

#### [RN-018] Acesso ao Relatório Financeiro de Operadores Restrito a Cargos Gerenciais
- **Descrição:** Operadores de nível `OPERADOR` não têm permissão para acessar os dados consolidados de faturamento e volume por usuário (`GET /movements/user-stats`).
- **Perfis Envolvidos:** `ADMIN` e `GERENTE` (autorizados); `OPERADOR` (proibido).
- **Onde é Aplicada:** [`backend/src/routes/movementRoutes.js#L14`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/movementRoutes.js#L14) (`permit("ADMIN", "GERENTE")`).
- **Em que Camada:** API / Middleware RBAC.

#### [RN-019] Filtro por Operador em Movimentações Restrito no Frontend (`PROBLEMA B3`)
- **Descrição:** Na tela de movimentações, o filtro por operador só deve ser acessível para gerentes e administradores.
- **Onde é Aplicada:** [`frontend/src/pages/Movimentacoes.jsx#L55`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx#L55) (`canFilterByUser = currentUser?.role === "ADMIN" || currentUser?.role === "GERENTE"`).
- **Em que Camada:** **Apenas Interface Frontend.**
- **Lacunas Identificadas (`PROBLEMA - Catálogo B3`):** Se um `OPERADOR` fizer uma requisição direta para a API passando `GET /movements?usuarioId=1`, o backend **aceita o parâmetro e filtra normalmente** ([`movementService.js` L80-84](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L80-L84)), pois a rota `/movements` não valida se operadores podem filtrar por outros usuários. A regra existe apenas no cliente!

#### [RN-020] Botão de Exclusão de Usuário Apenas Simulado na Interface (`PROBLEMA B3`)
- **Descrição:** O sistema prevê a exclusão de usuários por administradores.
- **Onde é Aplicada:** [`frontend/src/pages/Usuarios.jsx#L231-L238`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx#L231-L238).
- **Em que Camada:** Interface.
- **Lacunas Identificadas (`PROBLEMA`):** A interface emite um modal informativo de "Exclusão simulada" sem acionar a rota existente `DELETE /users/:id`.

#### [RN-021] Relatório Executivo Consolidado de Vendas e Exportação PDF
- **Descrição:** O sistema permite a qualquer usuário autenticado com acesso à Visão Geral do Dashboard extrair relatórios executivos de vendas com métricas consolidadas (Faturamento total, peças vendidas, total de saídas, ticket médio, top 5 produtos) e timeline temporal estruturada nos intervalos de 30 dias (1m), 180 dias (6m) e 365 dias (1y).
- **Onde é Aplicada:** [`backend/src/services/movementService.js#getSalesReportData`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) e [`frontend/src/components/dashboard/ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx).
- **Em que Camada:** API / Service + Interface Frontend (renderização vetorial SVG e exportação nativa em A4).

---

## 3. Matriz de Rastreabilidade e Cobertura das Regras

| ID | Regra de Negócio | Camada Principal | Protegida no Banco? | Coberta por Teste? | Status / Risco |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **RN-001** | Senha com hash Bcrypt | API / Service | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-002** | Auto-cadastro fixado em OPERADOR | API / Service | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-003** | Rate limit no login (10 req/15m) | API / Middleware | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-004** | Gestão de usuários restrita a ADMIN | API / Middleware | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-005** | Proibição de autoexclusão de conta | API / Service | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-006** | Proibição de exclusão do último admin | API / Service | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-007** | Proibição de exclusão com movimentos | API / Service | Sim (FK Restrict)| Não | `IMPLEMENTADO (verificado)` |
| **RN-008** | Bloqueio de auto-escalação de cargo | API / Controller | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-009** | Bloqueio de rebaixamento do último admin | Ausente | Não | Não | `PROBLEMA B7 (Vulnerabilidade ativa)` |
| **RN-010** | Catálogo restrito a ADMIN/GERENTE | API / Middleware | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-011** | Exclusão de produto restrita a ADMIN | API / Middleware | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-012** | Proibição de exclusão com movimentos | API / Service | Sim (FK Restrict)| Não | `IMPLEMENTADO (verificado)` |
| **RN-013** | Saldo não-negativo em vendas | API / Service | Não (Sem Check) | Não | `IMPLEMENTADO (verificado)` |
| **RN-014** | Concorrência estrita no saldo | API / Transaction| Não (Falta lock) | Não | `PROBLEMA I1 (Race condition)` |
| **RN-015** | Unicidade de nome de categoria | Banco de Dados | Sim (Unique) | Não | `IMPLEMENTADO (verificado)` |
| **RN-016** | Proibição de exclusão de categoria com FK| API / Service | Sim (FK Restrict)| Não | `IMPLEMENTADO (verificado)` |
| **RN-017** | Proibição de exclusão de fornecedor com FK | API / Service | Sim (FK Restrict)| Não | `IMPLEMENTADO (verificado)` |
| **RN-018** | Relatório de operador restrito | API / Middleware | Não | Não | `IMPLEMENTADO (verificado)` |
| **RN-019** | Restrição de filtro de usuário | Frontend apenas | Não | Não | `PROBLEMA B3 (Bypassável via API)` |
| **RN-020** | Exclusão de usuário na interface | Frontend apenas | Sim (na API) | Não | `PROBLEMA (Botão simulado na UI)` |
| **RN-021** | Relatório de Vendas e Exportação PDF (1m, 6m, 1y) | API / Frontend | Não | Não | `IMPLEMENTADO (verificado)` |

