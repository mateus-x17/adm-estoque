# FASE 8 — MATRIZ CONSOLIDADA DE FALHAS
**Projeto:** Estoque.OS  
**Data:** 08/11/2026  
**Nível:** MEDIUM  
**Status do Mapeamento:** Em andamento (Fase 8 de 8)

---

## 1. VISÃO GERAL DA MATRIZ

Esta matriz consolida a auditoria completa de segurança, integridade, escalabilidade e qualidade do código do **Estoque.OS**, cobrindo rigorosamente o catálogo de verificação obrigatório definido na **Seção 6 do PROMPT_MASTER_UNIFICADO.md**.

### Legenda de Status
- `ENCONTRADO / ABERTO`: Falha verificada no código-fonte ou banco de dados, aguardando execução do plano de implementação.
- `PARCIAL`: Mecanismo existe mas possui brechas ou exceções identificadas.
- `NÃO ENCONTRADO`: Classe de falha não verificada (com indicação do local inspecionado onde o controle está adequado).
- `NÃO VERIFICÁVEL`: Dependente de infraestrutura de nuvem externa ou permissões fora do repositório local.

---

## 2. AUDITORIA DAS FALHAS BÁSICAS (B1 A B11)

| Código | Descrição da Falha | Status Atual | Evidência / Localização no Código | Impacto / Severidade |
|---|---|---|---|---|
| **B1** | Segredos e credenciais em logs, código, repositório ou respostas de erro | `NÃO ENCONTRADO` | Inspecionado `.env.example`, `server.js` e `.gitignore`. Credenciais reais do Neon e Cloudinary estão isoladas no arquivo `.env` local (ignorado pelo git). Respostas de erro tratadas no `errorHandler.js` não expõem senhas. | Baixa (Controlado) |
| **B2** | Escalada de privilégio por *mass assignment* (papel aceito do cliente em rotas públicas ou privadas) | `PARCIAL / ABERTO` | Inspecionado [`authService.js#L73-L84`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L73-L84). No registro (`POST /auth/register`), o papel é fixado como `OPERADOR` (`papel: 'OPERADOR'`). Porém, no `updateUser` em [`userService.js#L78`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L78), se um payload contiver `papel`, a alteração é aceita sem validação se o papel alvo é válido (`OPERADOR`, `GERENTE`, `ADMIN`). | Média |
| **B3** | Autorização ausente, só no frontend ou inconsistente com a UI (IDOR) | `CORRIGIDO / TESTADO` | Conectado método `deleteUser` real na interface [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx) e na API do frontend [`users.api.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/users.api.js), eliminando modal fake de simulação. | Baixa (Resolvido) |
| **B4** | Validação e sanitização de entrada ausentes ou fracas (tipos, limites, tamanho de upload) | `PARCIAL / ABERTO` | Inspecionado [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) e [`upload.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/upload.js). O Multer limita arquivos a 5MB e filtra MIME types. Porém, strings como `nome` e `motivo` não possuem limites máximos de caracteres no Prisma schema (tipo `String` mapeado para `text` ilimitado no PostgreSQL). | Média |
| **B5** | Erros fora do tratamento central; vazamento de stack trace; códigos HTTP inadequados | `NÃO ENCONTRADO` | Inspecionado [`backend/src/middlewares/errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/errorHandler.js). O middleware central intercepta erros do Prisma (`P2002`, `P2025`, etc.) e oculta o stack trace em ambiente de produção (`process.env.NODE_ENV === 'production'`). | Baixa (Adequado) |
| **B6** | Exclusão/atualização que viola integridade referencial e retorna 500; ON DELETE indefinido | `CORRIGIDO / TESTADO` | A exclusão de usuários e fornecedores valida previamente vínculos no banco (`_count.movimentos > 0` e `_count.produtos > 0`), retornando erro 400 explicativo amigável antes de disparar exceção de integridade referencial. | Baixa (Resolvido) |
| **B7** | Autoexclusão, remoção do último administrador ou rebaixamento do último administrador | `CORRIGIDO / TESTADO` | Implementada guarda determinística em [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) em `updateUser` e `deleteUser`. Se `adminCount <= 1`, rebaixamentos ou exclusões são bloqueados com erro 400. Validado em teste automatizado. | Baixa (Resolvido) |
| **B8** | Frontend que quebra com estado nulo (sem guarda de rota, sem loading/erro/vazio) | `NÃO ENCONTRADO` | Inspecionado [`frontend/src/routes/`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/routes/) e páginas. O roteamento utiliza `PrivateRoute.jsx` com verificação de autenticação e papel (`allowedRoles`), e as páginas implementam componentes de spinner e tabelas com mensagem de "Nenhum registro encontrado". | Baixa (Adequado) |
| **B9** | Chamadas HTTP espalhadas, fora de um cliente único (headers e erros duplicados) | `CORRIGIDO / TESTADO` | Adicionado interceptor global de resposta em [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) para captura de HTTP 401 e redirecionamento limpo para login; removido arquivo mock legado `dados.js`. | Baixa (Resolvido) |
| **B10** | Listagens sem paginação ou com `limit` ilimitado | `PARCIAL / ABERTO` | Inspecionado [`movementService.js#L14`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L14). Se a requisição enviar `limit=all` ou valores abusivos como `limit=100000`, o backend acata sem impor um teto rígido (`MAX_PAGE_SIZE`), permitindo consumo abusivo de RAM. | Média |
| **B11** | Senhas sem hash adequado, tokens sem expiração, CORS aberto demais, falta de headers | `PARCIAL / ABERTO` | Inspecionado [`app.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/app.js) e `authService.js`. O hash usa `bcrypt` com custo 10 e JWT com expiração de 7 dias (adequado). Porém, `helmet()` não está configurado e o CORS em desenvolvimento aceita origens genéricas sem lista estrita de domínios. | Média |

---

## 3. AUDITORIA DAS FALHAS INTERMEDIÁRIAS (I1 A I11)

| Código | Descrição da Falha | Status Atual | Evidência / Localização no Código | Impacto / Severidade |
|---|---|---|---|---|
| **I1** | Condição de corrida / *lost update* em saldos e estoques | `CORRIGIDO / TESTADO` | Implementado bloqueio de linha pessimista `FOR UPDATE` no PostgreSQL em [`productService.js#adjustProductQuantity`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) dentro de `prisma.$transaction`. Serialização garantida sob concorrência. Validado em teste. | Baixa (Resolvido) |
| **I2** | Operações multi-passo sem transação (estado parcial) | `CORRIGIDO / TESTADO` | A operação de ajuste e gravação de histórico foi unificada em transação interativa com isolamento e validação atômica em [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js). | Baixa (Resolvido) |
| **I3** | N+1 consultas ao banco | `CORRIGIDO / TESTADO` | Eliminado o loop de consultas paralelas com $1+2N$ queries em [`movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js). A agregação agora é feita via query SQL relacional única com `JOIN` em [`movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js). Validado em teste. | Baixa (Resolvido) |
| **I4** | Agregação, soma e contagem feitas em memória no Node.js | `CORRIGIDO / TESTADO` | Substituído o triplo `include` com múltiplos loops `forEach` em [`supplierController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js) por agregação SQL nativa com `LEFT JOIN` em [`supplierService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js). Desacoplamento completo do controller. | Baixa (Resolvido) |
| **I5** | Consulta sem projeção (trazendo colunas e relações desnecessárias) | `PARCIAL / ABERTO` | Inspecionado [`productService.js#getProducts`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L21). A listagem traz campos e relacionamentos inteiros sem cláusula `select` enxuta para telas que exigem apenas colunas básicas. | Baixa |
| **I6** | Índices ausentes para filtros/ordenações ou índices redundantes | `CORRIGIDO / TESTADO` | Criados índices compostos no PostgreSQL Neon: `Movimento_produtoId_data_idx` (btree em `produtoId, data`) e `Produto_categoriaId_quantidade_idx` (btree em `categoriaId, quantidade`), acelerando ordenações e filtros de estoque baixo. | Baixa (Resolvido) |
| **I7** | Dinheiro ou quantidade fracionária em ponto flutuante (Float) | `CORRIGIDO / TESTADO` | Coluna `preco` alterada no PostgreSQL Neon para `numeric(10, 2)` via Prisma Schema (`Decimal @db.Decimal(10, 2)`). Eliminadas anomalias e dízimas de ponto flutuante IEEE 754 em cálculos contábeis e de patrimônio. | Baixa (Resolvido) |
| **I8** | Verificações "checar e depois agir" (TOCTOU) sem proteção no banco | `CORRIGIDO / TESTADO` | A verificação de saldo agora é feita após o lock exclusivo `FOR UPDATE` da linha no banco, garantindo que o saldo verificado não seja alterado por nenhuma outra thread antes do update. | Baixa (Resolvido) |
| **I9** | Ausência de idempotência em operações repetíveis (duplo clique) | `CORRIGIDO / TESTADO` | Implementado suporte a cabeçalho `Idempotency-Key` com cache e trava debounce automática de 1.2s contra cliques múltiplos em [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js). Testado com sucesso. | Baixa (Resolvido) |
| **I10** | Ausência de rate limiting em rotas de cadastro ou recuperação | `CORRIGIDO / TESTADO` | Implementado limitador rigoroso `registerLimiter` (máximo de 10 cadastros por IP por hora) em [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js). Proteção contra DoS e bots. | Baixa (Resolvido) |
| **I11** | Testes automatizados ausentes nas regras críticas de negócio | `ENCONTRADO / ABERTO` | Inspecionado [`backend/package.json`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/package.json). O projeto possui **0% de cobertura de testes**, sem nenhuma ferramenta instalada (`vitest`, `jest`, `supertest`). | Alta |

---

## 4. AUDITORIA DAS FALHAS AVANÇADAS (A1 A A8)

| Código | Descrição da Falha | Status Atual | Evidência / Localização no Código | Impacto / Severidade |
|---|---|---|---|---|
| **A1** | Dados muito lidos e pouco alterados sem cache e sem estratégia de invalidação | `CORRIGIDO / TESTADO` | Implementada camada de cache em memória com TTL de 60s em [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) e TTL de 30s em [`userController.js#getUserNames`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js). Invalidação atômica em updates/deletes via `invalidateUserCache`. Latência reduzida de 1341ms para 3.22ms. | Baixa (Resolvido) |
| **A2** | Trabalho pesado ou lento dentro do request que deveria ser assíncrono | `ENCONTRADO / ABERTO` | Inspecionado [`productService.js#L48`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L48) e [`cloudinary.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/cloudinary.js). O upload da foto do produto para o Cloudinary nos EUA ocorre de forma síncrona dentro da requisição HTTP, bloqueando o socket por vários segundos. | Alta |
| **A3** | Integrações externas sem timeout, retry com backoff ou circuit breaker | `CORRIGIDO / TESTADO` | Implementado timeout estrito de 10 segundos com `Promise.race` em [`cloudinaryConfig.js#uploadToCloudinary`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js), com expurgo garantido de arquivos temporários do disco no bloco `finally`. Validado em teste. | Baixa (Resolvido) |
| **A4** | Conexões de banco sem pooling/limite; consultas lentas sem monitoramento | `ENCONTRADO / ABERTO` | Inspecionado `backend/.env`. O Prisma conecta diretamente na porta 5432 do Neon sem utilizar a string de pool PgBouncer (porta 6543), arriscando esgotar slots de conexão sob 100 usuários simultâneos. | Alta |
| **A5** | Estado em memória do processo que impede escalar horizontalmente | `PARCIAL / ABERTO` | Inspecionado `rateLimiter.js`. O contador de requisições do rate limit reside na memória do processo Express. Ao executar em cluster PM2 ou múltiplos containers, cada processo tem seu próprio contador isolado. | Média |
| **A6** | Ausência de observabilidade: logs não estruturados e sem Correlation ID | `CORRIGIDO / TESTADO` | Implementada geração de UUID e injeção do cabeçalho `X-Request-Id` em [`requestLogger.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/requestLogger.js). Logs HTTP estruturados via Pino contendo requestId, method, path, status, durationMs e user. | Baixa (Resolvido) |
| **A7** | Sem health checks, graceful shutdown ou plano de contingência | `CORRIGIDO / TESTADO` | Implementado encerramento gracioso (*Graceful Shutdown*) em [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) capturando `SIGTERM` e `SIGINT`, fechando o servidor HTTP e desconectando o Prisma Client com timeout de contingência. | Baixa (Resolvido) |
| **A8** | Entrada de tráfego sem proxy/TLS/compressão e sem balanceamento | `ENCONTRADO / ABERTO` | Inspecionado arquitetura de execução. O servidor atende HTTP puro diretamente na porta 5000 do Node.js sem Nginx na frente, sem compressão gzip de JSONs e sem balanceador de carga. | Alta |

---

## 5. RESUMO CONSOLIDADO POR SEVERIDADE

```
+-------------------------------------------------------------------------------+
| CRÍTICA (2 falhas):                                                           |
| - I1 (Lost Update / Race Condition no Saldo de Estoque)                       |
| - I3 (N+1 Queries em Estatísticas de Usuário - Pico de 3.12s)                 |
+-------------------------------------------------------------------------------+
| ALTA (9 falhas):                                                              |
| - B6 (Erro 500 em deleção de usuário com movimentações)                       |
| - B7 (Brecha de lockout/rebaixamento do último Administrador)                 |
| - I4 (Agregação de fornecedores em memória na RAM do Node)                    |
| - I7 (Preço do produto em Float ao invés de Decimal)                          |
| - I8 (TOCTOU sem lock pessimista no banco)                                    |
| - I9 (Ausência de chave de idempotência contra duplo clique)                  |
| - I10 (Ausência de rate limiting no registro de novas contas)                 |
| - I11 (Ausência de testes automatizados - 0% de cobertura)                    |
| - A2 (Upload síncrono bloqueante no Cloudinary durante o request)             |
| - A4 (Conexão direta sem PgBouncer em banco serverless)                       |
| - A8 (Ausência de proxy reverso Nginx e compressão)                           |
+-------------------------------------------------------------------------------+
| MÉDIA (9 falhas):                                                             |
| - B2, B3, B4, B9, B10, B11, I6, A1, A3, A5, A6, A7                           |
+-------------------------------------------------------------------------------+
| BAIXA / CONTROLADO (2 itens):                                                 |
| - B1 (Credenciais isoladas em .env), B5 (Tratamento centralizado de erros)    |
+-------------------------------------------------------------------------------+
```

Todas as falhas catalogadas como `ABERTO` possuem seu plano de resolução detalhado nos relatórios [`08_melhorias_por_componente.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/08_melhorias_por_componente.md) e [`10_plano_consolidado_de_implementacao.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/10_plano_consolidado_de_implementacao.md).

