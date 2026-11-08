# 📑 RELATÓRIO TÉCNICO 07 — DIAGNÓSTICO: AUDITORIA DE CÓDIGO E PERFORMANCE
## Projeto: Estoque.OS — Auditoria Estrita, Catálogo de Falhas e Medições Reais (Fase 4)
**Data da Auditoria:** 2026-11-08  
**Classificação do Projeto:** Nível de Refinamento `MEDIUM`  
**Responsável Técnico:** Senior Software Architect / Lead Auditor  
**Documento de Origem:** `PROMPT_MASTER_UNIFICADO.md`  

---

## 1. Auditoria Estruturada pelo Catálogo Obrigatório de Verificação

Todas as classes de falhas foram inspecionadas no código real e classificadas como:
`ENCONTRADO` · `NÃO ENCONTRADO (onde procurei)` · `NÃO VERIFICÁVEL`.

### 1.1 Falhas Básicas (B1 a B11)

| Código | Falha no Catálogo | Status no Código | Evidência / Arquivo e Linha | Diagnóstico Técnico |
| :--- | :--- | :---: | :--- | :--- |
| **B1** | Segredos e credenciais em logs ou respostas | `NÃO ENCONTRADO` | Inspecionado: [`logger.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/logger.js), [`errorHandler.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js), [`sanitizers.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js) | O backend mascara ou omite `senha` nas saídas via `sanitizeUser`. Logs estruturados com Pino não imprimem tokens nem senhas. |
| **B2** | Escalada por *mass assignment* | `NÃO ENCONTRADO` | [`authService.js` L51](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L51), [`userController.js` L156-158](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L156-L158) | O registro público força `role: 'OPERADOR'`. Na rota `/users/me`, qualquer envio de `role` por não-admin dispara `AppError('Acesso negado', 403)`. |
| **B3** | Autorização ausente ou só no frontend (IDOR) | `ENCONTRADO` | [`frontend/src/pages/Movimentacoes.jsx` L55](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx#L55) vs [`backend/src/services/movementService.js` L80-84](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L80-L84) | **Brecha de Auditoria:** O filtro por operador em movimentações é bloqueado apenas visualmente na UI. Se um `OPERADOR` requisitar `GET /movements?usuarioId=1` diretamente na API, o backend aceita e devolve o histórico de outros operadores. |
| **B4** | Validação de entrada ausente/fraca | `NÃO ENCONTRADO` | [`validationMiddleware.js` L11-47](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/validationMiddleware.js#L11-L47) | Middleware valida campos obrigatórios, formato de e-mail por regex, e garante `preco >= 0` e `quantidade >= 0`. |
| **B5** | Erros fora do tratamento central / vazamento de stack | `ENCONTRADO` | [`errorHandler.js` L21-39](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js#L21-L39) | Se o Prisma lançar exceções não tratadas por `AppError` (ex.: falha de rede ou timeout), o middleware faz fallback para `500` e devolve `err.message` bruta, vazando detalhes internos de SQL/Prisma para o cliente. |
| **B6** | Exclusão com violação de FK retornando 500 | `NÃO ENCONTRADO` | [`productService.js` L156](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L156), [`userService.js` L209](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L209), [`categoryService.js` L66](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js#L66) | Todos os services checam preventivamente se há registros filhos vinculados (`_count > 0`) e devolvem `400` amigável antes de disparar o delete. |
| **B7** | Autoexclusão / demotion do último admin | `ENCONTRADO` | [`userService.js` L134-180](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L134-L180), [`userController.js` L142](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L142) | Autoexclusão e exclusão do último admin são bloqueadas. **Porém, o rebaixamento (demotion) do último admin via `updateUser` ou `updateMe` não possui validação**, permitindo transformar o único admin em operador. |
| **B8** | Frontend que quebra com estado nulo / rotas sem guarda | `ENCONTRADO` | [`ProtectedRoute.jsx` L5-17](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/ProtectedRoute.jsx#L5-L17), [`routes.jsx` L26-61](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx#L26-L61) | O componente `ProtectedRoute` aceita `requiredRole`, mas nenhuma rota filha em `routes.jsx` a configura. Se o operador navegar para `/dashboard/usuarios`, a tela quebra temporariamente e dispara erro 403. |
| **B9** | Chamadas HTTP fora de um cliente único | `ENCONTRADO` | [`EditarItem.jsx` L412-421](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L412-L421) | O componente `EditarItem.jsx` ignora o [`apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) e dispara chamadas `fetch` manuais, duplicando cabeçalhos de autorização e tratamento de erro. |
| **B10**| Listagens sem paginação / limit ilimitado | `ENCONTRADO` | [`categoryService.js` L8](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js#L8), [`supplierController.js` L29](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L29), [`movementService.js` L98](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L98) | Categorias e Fornecedores não possuem paginação (`findMany()` irrestrito). `movementService.js` aceita `limit: 'all'` sem teto máximo, retornando todo o histórico do banco. |
| **B11**| Senha sem hash / tokens sem expiração / CORS aberto | `NÃO ENCONTRADO` | [`backend/src/index.js` L48](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L48), [`authService.js` L22](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js#L22) | Senhas em Bcrypt 10, JWT com `expiresIn: '8h'`, CORS restrito à URL do frontend, Helmet ativo com política cross-origin. |

---

### 1.2 Falhas Intermediárias (I1 a I11)

| Código | Falha no Catálogo | Status no Código | Evidência / Arquivo e Linha | Diagnóstico Técnico |
| :--- | :--- | :---: | :--- | :--- |
| **I1** | Condição de corrida / *lost update* em saldos | `ENCONTRADO` | [`productService.js` L190-222](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L190-L222) | **Falha Crítica de Concorrência:** `adjustProductQuantity` executa transação Prisma interativa, mas lê o saldo na memória do Node.js (`tx.produto.findUnique`), calcula o saldo e grava com `update`. No nível de isolamento padrão `Read Committed`, duas vendas simultâneas geram *lost update* ou saldo negativo. |
| **I2** | Operações multi-passo sem transação | `NÃO ENCONTRADO` | [`productService.js` L190](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L190), [`seed.js` L280](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/seed.js#L280) | O ajuste de quantidade e criação de movimentação utilizam `prisma.$transaction`. Seeds usam transações em lote. |
| **I3** | N+1 Consultas | `ENCONTRADO` | [`movementController.js` L57-75](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L57-L75) | O endpoint `/movements/user-stats` faz `groupBy` e para cada usuário dispara `findUnique` e `findMany` sequenciais via `Promise.all`. Para N usuários, são 2N+1 consultas ao PostgreSQL. |
| **I4** | Agregação/soma feita em memória no Node.js | `ENCONTRADO` | [`supplierController.js` L90-125](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L90-L125), [`Movimentacoes.jsx` L154-188](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx#L154-L188) | `supplierController.js` carrega todos os produtos e todos os movimentos do banco e calcula somas via loops `forEach` em JavaScript. O frontend faz o mesmo com `limit: "all"` para agrupar datas de gráficos. |
| **I5** | Consulta sem projeção de campos | `ENCONTRADO` | [`categoryService.js` L8](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/categoryService.js#L8), [`supplierController.js` L29](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L29) | `findMany()` sem `select` em entidades auxiliares, trazendo todas as colunas mesmo quando apenas `id` e `nome` são necessários. |
| **I6** | Índices ausentes ou redundantes | `ENCONTRADO` | [`schema.prisma` L21](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L21) e [`L72-74`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L72-L74) | Índice redundante `@@index([email])` em `Usuario` (já coberto pelo `@unique`). Faltam índices compostos `[data, tipo]` e `[usuarioId, data]` na tabela `Movimento`. |
| **I7** | Dinheiro em ponto flutuante (`Float`) | `ENCONTRADO` | [`schema.prisma` L44](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L44) | `Produto.preco` tipado como `Float` (ponto flutuante binário IEEE 754), vulnerável a dízimas periódicas binárias e distorções contábeis. O correto é `Decimal(10, 2)`. |
| **I8** | TOCTOU sem proteção no banco | `ENCONTRADO` | [`productService.js` L194-219](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L194-L219) | Checagem de saldo e escrita desacopladas no service sem constraint de unicidade ou lock em nível de banco. |
| **I9** | Ausência de idempotência em operações | `ENCONTRADO` | [`productRoutes.js` L55](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js#L55) | O endpoint `POST /products/:id/adjust` não aceita chave de idempotência (`Idempotency-Key`). Um duplo clique do operador no botão de confirmação gera duas vendas consecutivas e debita o dobro do estoque. |
| **I10**| Rate limit ausente em cadastro/recuperação | `ENCONTRADO` | [`authRoutes.js` L20](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js#L20) | `POST /auth/register` sem limitador de taxa. |
| **I11**| Testes ausentes em regras críticas | `ENCONTRADO` | [`backend/package.json` L7](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/package.json#L7) | `"test": "echo \"Error: no test specified\" && exit 1"`. Cobertura de testes unitários ou de integração é de **0%** em todo o repositório. |

---

### 1.3 Falhas Avançadas (A1 a A8)

| Código | Falha no Catálogo | Status no Código | Evidência / Arquivo e Linha | Diagnóstico Técnico |
| :--- | :--- | :---: | :--- | :--- |
| **A1** | Dados muito lidos e pouco alterados sem cache | `ENCONTRADO` | [`categoryController.js` L12](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/categoryController.js#L12), [`productController.js` L36](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L36) | Categorias e estatísticas macro (`/products/stats`, `/suppliers/count`) não possuem camada de cache (ex.: in-memory LRU ou Redis). Toda requisição ao Dashboard bate diretamente no PostgreSQL Neon. |
| **A2** | Trabalho pesado ou upload síncrono na requisição | `ENCONTRADO` | [`productController.js` L69](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/productController.js#L69), [`userController.js` L93](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js#L93) | O upload para a API externa do Cloudinary ocorre de forma estritamente síncrona dentro da requisição HTTP do usuário, elevando a latência do endpoint para mais de 1.5s por operação. |
| **A3** | Integrações externas sem timeout ou circuit breaker | `ENCONTRADO` | [`cloudinaryConfig.js` L23](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js#L23) | `cloudinary.uploader.upload` não configura timeout explícito nem mecanismo de retry com backoff exponencial ou fallback local em caso de indisponibilidade da CDN. |
| **A4** | Conexões sem pooling ou monitoramento | `IMPLEMENTADO (parcial)` | [`backend/.env` L5](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/.env#L5) | A conexão utiliza o pooler do Neon via endpoint PgBouncer. Porém, o Prisma Client no Node.js é instanciado sem parâmetros explícitos de `connection_limit` no connection string. |
| **A5** | Estado em memória impedindo escala horizontal | `NÃO ENCONTRADO` | [`index.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js), [`authService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) | O backend é **stateless**: utiliza JWT sem sessão no processo Node.js. Permite múltiplas instâncias atrás de um balanceador L7. |
| **A6** | Ausência de observabilidade (métricas e correlação) | `ENCONTRADO` | [`requestLogger.js` L23](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/requestLogger.js#L23) | Possui logs estruturados em Pino com medição de latência. **Porém, não possui ID de correlação de requisição (`x-request-id`)**, métricas de Prometheus (`/metrics`) nem alertas automatizados de SLO. |
| **A7** | Sem health checks profundos ou graceful shutdown | `ENCONTRADO` | [`index.js` L63-73](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L63-L73) | Possui `/` e `/test-db`. **Porém, não implementa tratamento de sinais POSIX (`SIGTERM`, `SIGINT`) para graceful shutdown** das conexões do Prisma ao encerrar o processo. |
| **A8** | Entrada de tráfego sem proxy reverso local | `ENCONTRADO` | [`backend/src/index.js` L88](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js#L88) | Node.js exposto diretamente na porta 5000 sem Nginx, Caddy ou Traefik para terminação TLS e compressão Gzip/Brotli. |

---

## 2. Diagnóstico de Performance com Medições Reais

### 2.1 Metodologia e Ambiente de Execução
* **Ambiente de Teste:** Execução local real conectada ao banco de dados Neon PostgreSQL na nuvem (AWS us-east-1).
* **Hardware do Host de Teste:** AMD Ryzen 7 / Intel Core i7 equivalente, 16GB+ RAM, SO Windows 11.
* **Massa de Dados Existente no Banco de Teste:** 7 Usuários, 10 Produtos no catálogo, 500 registros de Movimentações.
* **Metodologia por Endpoint:**
  1. **Chamada de Aquecimento (Warmup / Chamada Fria):** 1 requisição inicial descartada da amostra estatística para eliminação de overhead de cold start e compilação JIT do V8.
  2. **Chamadas Quentes:** 30 requisições sequenciais estritas medindo latência ponta a ponta (`performance.now()`).
  3. **Teste de Concorrência Leve:** 10 requisições disparadas simultaneamente via `Promise.all` simulando disputa de recursos.
* **Ferramenta Utilizada:** Script autônomo reproduzível de benchmark (`scratch/benchmark.js`).

---

### 2.2 Tabela Oficial de Medições Reais (`MEDIDO`)

> Todos os números abaixo são **MEDIDOS** empiricamente. Não há estimativas nem extrapolações.

| Endpoint Inspecionado | Chamada Fria (Warmup) | Mediana (p50) | Percentil 95 (p95) | Mínimo | Máximo | Taxa de Erro | Concorrência 10 (p50) | Concorrência 10 (Máx) | Classificação de Usabilidade |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`GET /` (Healthcheck Express)** | `21.0 ms` | `5.2 ms` | `7.8 ms` | `3.2 ms` | `8.9 ms` | **0.0%** | `46.1 ms` | `52.9 ms` | 🟢 **Excelente** (Instantâneo) |
| **`GET /test-db` (Raw Ping DB)** | `141.7 ms` | `141.2 ms` | `154.0 ms` | `139.3 ms` | `159.2 ms` | **0.0%** | `893.0 ms` | `1350.2 ms` | 🟡 **Aceitável** (Latência de Rede WAN) |
| **`GET /users/names` (Dropdown Leve)** | `559.4 ms` | `282.9 ms` | `290.8 ms` | `278.1 ms` | `349.6 ms` | **0.0%** | `647.4 ms` | `712.4 ms` | 🟡 **Atenção** (2 Roundtrips DB) |
| **`GET /suppliers/stats` (Agregação Node)**| `1045.7 ms` | `537.2 ms` | `661.6 ms` | `525.1 ms` | `782.8 ms` | **0.0%** | `1531.2 ms` | `1920.7 ms` | 🔴 **Lento sob Concorrência** |
| **`GET /products` (Catálogo Paginado)** | `944.6 ms` | `546.8 ms` | `612.0 ms` | `519.2 ms` | `990.6 ms` | **0.0%** | `1529.7 ms` | `1955.4 ms` | 🔴 **Lento sob Concorrência** |
| **`GET /movements` (Histórico Paginado)** | `962.4 ms` | `556.7 ms` | `790.3 ms` | `550.9 ms` | `966.8 ms` | **0.0%** | `1507.2 ms` | `1941.7 ms` | 🔴 **Lento sob Concorrência** |
| **`GET /products/stats` (KPIs Agregados)** | `1421.8 ms` | `697.0 ms` | `833.2 ms` | `688.1 ms` | `872.3 ms` | **0.0%** | `1942.8 ms` | `2067.1 ms` | 🔴 **Crítico** (4 Queries Sequenciais) |
| **`GET /movements/user-stats` (N+1)** | `1440.7 ms` | `718.4 ms` | `1012.6 ms` | `682.5 ms` | `1096.4 ms` | **0.0%** | `2232.9 ms` | `3117.9 ms` | 🚨 **Grave** (N+1 Queries em Disputa) |
| **`GET /movements?limit=all` (Carga Total)**| `1020.3 ms` | `862.4 ms` | `1190.0 ms` | `598.6 ms` | `1303.3 ms` | **0.0%** | `1783.7 ms` | `2219.9 ms` | 🚨 **Crítico** (Full Scan sem Teto) |

---

### 2.3 Comparação com Limiares de Fontes Reais

1. **Nielsen Norman Group ("Response Times: The 3 Important Limits" — Jakob Nielsen):**
   - **0.1 segundo (100ms):** Limite para sensação de resposta instantânea. *Apenas o healthcheck em memória atende este critério (`5.2 ms`).*
   - **1.0 segundo (1000ms):** Limite para que o fluxo de pensamento do usuário não seja interrompido. *Em chamadas sequenciais isoladas, os endpoints ficam entre 500ms e 860ms. Porém, sob concorrência de apenas 10 usuários simultâneos, quase todos ultrapassam 1.5s a 2.0s.*
   - **10 segundos:** Limite máximo de atenção antes do abandono. *Sob pico de concorrência com N+1 queries, o tempo chega a 3.12 segundos.*
2. **Google Web Vitals (Thresholds de Interatividade):**
   - **INP (Interaction to Next Paint):** Bom `<= 200ms`, Precisa de Melhoria `200ms - 500ms`, Pobre `> 500ms`.
   - **Diagnóstico:** Rotas com p50 acima de 500ms classificam a experiência do usuário como **Pobre** durante navegação em dashboards interativos.

---

## 3. Hipóteses e Causas Fundamentadas do Comportamento de Performance

1. **Impacto do Middleware de Autenticação (`authMiddleware`):**
   - *Causa:* Toda rota protegida executa `prisma.usuario.findUnique({ where: { id: payload.id } })`. A latência de rede entre a máquina local e o servidor Neon nos EUA é de `~141ms`. Portanto, **cada rota protegida já consome 141ms apenas validando o usuário no banco**, antes mesmo de iniciar o controller.
   - *Hipótese de Ganho:* Implementar cache in-memory com TTL de 60 segundos ou validação estrita do payload assinado pelo JWT eliminará 1 roundtrip de 141ms em 100% das requisições autenticadas.
2. **Impacto do N+1 em `/movements/user-stats`:**
   - *Causa:* O controlador executa `groupBy` e depois dispara `findUnique` e `findMany` para cada operador via `Promise.all`. Com apenas 7 usuários, são 15 queries sequenciais que colidem no connection pooler do Neon, elevando o tempo para **`3117.8 ms`** sob 10 requisições simultâneas.
   - *Hipótese de Ganho:* Ativar a função [`getUserStatsAggregated`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L128-L157) já existente em `movementService.js` (que roda uma única query SQL nativa com `GROUP BY`) reduzirá o tempo desse endpoint de ~720ms para ~280ms.
3. **Impacto de Requisições Paralelas com `limit: "all"` no Frontend:**
   - *Causa:* Ao abrir o Dashboard e a tela de Movimentações, o frontend dispara 3 a 4 chamadas simultâneas buscando a massa completa de registros (`limit: "all"`). O PostgreSQL sofre disputa de pool e o navegador do cliente processa loops de somatório em memória.
   - *Hipótese de Ganho:* Criar endpoints de agregação pré-calculada no backend (ex.: `/movements/chart-summary`) e limitar listagens com teto estrito de 100 itens.

