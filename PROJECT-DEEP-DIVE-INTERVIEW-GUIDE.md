# Project Deep Dive & Interview Guide — Estoque.OS

## Sumário
- PARTE I — DOMÍNIO COMPLETO DO PROJETO
- PARTE II — ENTREVISTA TÉCNICA E TROUBLESHOOTING

---

# PARTE I — DOMÍNIO COMPLETO DO PROJETO

## 1. Visão geral
O **Estoque.OS** é uma aplicação web fullstack de Gerenciamento de Estoque. Ele resolve o problema do controle manual de inventário através de uma interface digital, permitindo acompanhar entradas e saídas de produtos, alertas de estoque baixo e estatísticas financeiras, além de contar com rastreabilidade de operadores.

## 2. Problema resolvido
Sistemas legados de estoque normalmente utilizam planilhas, dificultando o controle em tempo real, a segurança de acessos e o histórico de quem movimentou cada produto. O Estoque.OS digitaliza este processo aplicando RBAC (Controle de Acesso Baseado em Papéis), assegurando que apenas pessoas autorizadas façam determinadas operações e mantendo um histórico auditável das transações.

## 3. Stack
### Frontend
- **Framework/Biblioteca:** React 19 com Vite.
- **Linguagem:** JavaScript (ESModules).
- **Estilização:** Tailwind CSS, variáveis customizadas de CSS, suporte a modo Dark/Light.
- **Gerenciamento de Estado Global:** Zustand (com persistência via LocalStorage).
- **Roteamento:** React Router DOM (v7).
- **Consumo de API:** Fetch nativo encapsulado em um `apiClient.js` customizado.
- **Gráficos:** Recharts.

### Backend
- **Runtime e Linguagem:** Node.js, JavaScript (ESModules).
- **Framework:** Express.js 5.
- **ORM:** Prisma.
- **Banco de Dados:** PostgreSQL (hospedado no Neon Database).
- **Armazenamento de Arquivos/Imagens:** Upload via Multer e integração com a API do Cloudinary para CDN (com fallback local para `/uploads`).
- **Autenticação:** JSON Web Token (JWT).
- **Segurança e Utilitários:** BcryptJS (hash de senhas), Helmet (cabeçalhos de segurança), Express Rate Limit.
- **Logger:** Pino (estruturado).

## 4. Arquitetura
**Implementação atual:**
A arquitetura atual é um **Monólito Modular no Backend acoplado a uma SPA no Frontend**.
- **Cliente (SPA):** Roda no navegador e renderiza a interface, conversando via chamadas HTTP (REST) em JSON com o backend.
- **Backend (API REST):** Concentra as regras de negócio, persistência, controle de rotas, middlewares de segurança e comunicação direta com o banco.
- **Infra de Banco:** Um banco relacional externo na nuvem (PostgreSQL/Neon).

O fluxo principal (entrada): `UI (React)` → `API Client` → `Rota Express` → `Middleware de Validação/Auth/Role` → `Controller` → `Service` → `Prisma (DB)` → `Resposta JSON` → `Atualização de Estado UI`.

## 5. Estrutura de diretórios
### Frontend (`/frontend`)
- `src/components`: Componentes reutilizáveis (modais, tabelas, formulários, botões).
- `src/config`: Configurações de rotas (`routes.jsx`).
- `src/pages`: Vistas inteiras/telas montadas (Dashboard, Produtos, Movimentacoes).
- `src/services/api`: Encapsula a lógica do Fetch (`apiClient.js`) e divide as requisições por domínio (`products.api.js`, etc.).
- `src/store`: Estado global usando Zustand (`useAuthStore.js`, `useUserStore.js`, persistidos).
- `src/utils`: Funções utilitárias diversas.

### Backend (`/backend`)
- `prisma`: Contém `schema.prisma` que define as entidades (Usuario, Categoria, Fornecedor, Produto, Movimento) e scripts de `seed`.
- `src/config`: Instanciação de serviços externos (Prisma Client, Cloudinary, Pino Logger, Multer).
- `src/routes`: Define os endpoints e injeta middlewares (Auth, Validação, RBAC).
- `src/middlewares`: Interceptadores. Validação JWT (`authMiddleware`), restrição por perfil (`roleMiddleware`), logging de requisição.
- `src/controllers`: Recebem o "req/res", extraem o payload e chamam a camada de negócio.
- `src/services`: **Coração da regra de negócio**. Onde validações lógicas e transações complexas de banco ocorrem (ex: Impedir saída de estoque sem saldo).

## 6. Inicialização
A aplicação inicia de forma segregada:
- **Backend:** 
  1. Necessita popular o `.env` (DATABASE_URL, JWT_SECRET, chaves do Cloudinary).
  2. Executar migrações do banco com `npx prisma db push` ou `migrate`.
  3. Start pelo `npm run dev` que roda o `nodemon src/index.js`.
- **Frontend:** 
  1. Utiliza um `.env` com a URL da API (VITE_API_BASE_URL).
  2. Roda via `npm run dev` inicializando o servidor Vite (normalmente porta 5173).

## 7. Scripts
**Backend (`package.json`):**
- `dev`: Roda o servidor com nodemon (hot reload).
- `build`: Instala dependências e gera o Prisma Client.
- `seed` / `seedMovements`: Scripts para popular o banco com dados falsos.
- `reset`: Reseta e aplica seeds no banco.

**Frontend (`package.json`):**
- `dev`: Inicia o Vite.
- `build`: Compila o app para produção.

## 8. Variáveis de ambiente
| Variável | Obrigatória | Utilizada por | Finalidade | Exemplo seguro | O que acontece se faltar |
|---|---|---|---|---|---|
| `PORT` | Não | Backend | Porta do servidor | 5000 | Usa a porta 5000 padrão |
| `DATABASE_URL` | Sim | Backend / Prisma | Conexão com o banco (Postgres) | `postgresql://user:pass@host/db` | Falha ao ligar a API ou ler banco |
| `JWT_SECRET` | Sim | Backend | Chave criptográfica p/ assinar tokens | `segredo_ultra_seguro` | API avisa (warning) se for fraca ou quebra auth se nula |
| `FRONTEND_URL` | Não | Backend | Cors de origem permitida | `http://localhost:5173` | Cors bloqueia requisições do front |
| `CLOUDINARY_*` | Sim | Backend | Upload de imagens na CDN | `cloud_name...` | Uploads locais apenas, quebrando avatares em produção serverless |
| `VITE_API_BASE_URL` | Sim | Frontend | URL da API REST | `http://localhost:5000` | Requisições do frontend falham com erro de rede |

## 9. Dependências
As de maior impacto no fluxo:
- **Prisma:** Não apenas um ORM, mas gerencia transações de forma vitalícia no fluxo de ajuste de estoque.
- **Zustand:** Se removido, o app inteiro perde a capacidade de hidratação de sessão de forma simples.
- **BcryptJS:** Imprescindível para não salvar senhas limpas. Removê-lo comprometeria 100% da segurança do banco.
- **Helmet e Express-Rate-Limit:** Essenciais para mitigar força bruta e vulnerabilidades comuns de header no backend.

## 10. Frontend
O roteamento é protegido. Existe um `ProtectedRoute.jsx` em torno da hierarquia do `/dashboard`.
Se o usuário entra no `/dashboard/produtos`:
- É verificado o JWT no LocalStorage pelo Zustand.
- O componente de tabela realiza um fetch na montagem, enviando os parâmetros de paginação e pesquisa.
- A requisição passa pelo `apiClient` que anexa silenciosamente o header `Authorization: Bearer <token>`.

## 11. Componentes
Componentes importantes são os de Modais e Tabelas (ex: `ModalProduto.jsx`, `MovimentacaoRow.jsx`).
Geralmente, eles não mantêm grandes estados complexos de regras de negócios, focando apenas no estado local para lidar com abas, digitação em formulários de edição (controlados via useState) e emissão de callbacks (`onItemUpdated`) para as Páginas Pais re-fetcharem os dados.

## 12. Estado
**Estado Global (Zustand):**
- `useAuthStore`: Guarda o `token` JWT de forma persistente.
- `useUserStore`: Guarda as infos do usuário decodificadas para mostrar no avatar e aplicar condicional na UI (ex: esconder botão de "deletar usuário" se não for ADMIN).
- `useThemeStore`: Light/Dark mode.

**Sincronização com Servidor:**
O frontend usa "Polling manual" e "Fetch on Mount". Ao editar um produto, a UI faz a chamada PUT e ao receber 200 OK, ela substitui ativamente o registro na lista via estado local (`setProdutos(prev => prev.map...)`) para economizar requests, ou faz um novo fetch.

## 13. Rotas Principais
| Método | Endpoint | Autenticação | Autorização | Resumo |
|---|---|---|---|---|
| `POST` | `/auth/login` | Não | - | Troca email/senha por JWT. |
| `GET` | `/products` | Sim | Todas as roles | Lista paginada e filtrada de produtos. |
| `POST` | `/products/:id/adjust` | Sim | ADMIN, GERENTE, OPERADOR | Realiza entrada ou saída atômica no estoque. |
| `DELETE` | `/users/:id` | Sim | ADMIN | Exclui usuário fisicamente do banco. |

## 14. Pesquisas e filtros
Fluxo de Filtro em `/produtos`:
Usuário digita -> estado local atualizado -> `useEffect` escuta as mudanças (search, filter) -> Reseta `currentPage` para 1 -> `productsApi.getProducts({search})` -> API Client remove `undefined` strings -> envia Query Params -> Backend recebe e monta query prisma condicionalmente (`mode: 'insensitive'`).

## 15. Backend
O backend separa completamente as responsabilidades. Um detalhe importante é como ele faz o upload de arquivos via Multer na mesma rota do REST. Ele recebe requisições `multipart/form-data`, processa a imagem em memória ou salva local, envia pro Cloudinary, pega o link e salva no banco.

## 16. Controllers
Os controladores (ex: `productController.js`) são esguios.
Eles têm um bloco `try-catch` gigante e apenas repassam o `req.body` para o Service. O Controller tem responsabilidade apenas de lidar com o objeto da Web (req, res), retornando o status HTTP adequado e disparando erros para o `next()`.

## 17. Services
Aqui mora o coração da aplicação.
Exemplo: `adjustProductQuantity` em `productService.js`.
Regras: Valida se tipo é ENTRADA ou SAÍDA. Calcula o delta. Verifica se a nova quantidade é menor que zero. Se for, interrompe (throw AppError). Se for válido, utiliza `prisma.$transaction` para criar o registro histórico na tabela `Movimento` E dar o update em `Produto` na mesma ida ao banco.

## 18. Banco de dados
**Implementação atual:**
PostgreSQL relacional.
- Tabelas: Usuario, Categoria, Fornecedor, Produto, Movimento.
- Relações: Produto N-1 Categoria, Produto N-1 Fornecedor. Movimento N-1 Produto e Movimento N-1 Usuario.
- O histórico de Movimentação não deleta em cascata ou impede a exclusão facilmente se não configurado; um usuário que fez uma saída fica atrelado fisicamente ao movimento.

## 19. ORM
Prisma é utilizado de forma exaustiva (selects seletivos, includes).
Para lidar com paginação e busca no frontend, o backend usa `Promise.all` e faz o `findMany` com os filtros limitados + `count` com os mesmos filtros simultaneamente. O TTFB (Time to First Byte) cai pela metade em comparação com requisições seriais.

## 20. Autenticação
O `loginController` extrai email/senha. O `authService` compara hash via `bcrypt.compare`. Sendo válido, chama `jwt.sign` com um ID e envia o Bearer. A aplicação frontend armazena no LocalStorage e passa a injetar via Axios/Fetch no header. 

## 21. Autorização
Diferencia quem você é (Auth) do que você pode fazer (Roles).
Uma fábrica de Middlewares `permit("ADMIN", "GERENTE")` intercepta as rotas. Ele pega o `req.user.role` injetado pelo `authMiddleware` e checa num array `.includes()`. Se não passar, retorna 403 Forbidden antes sequer do controller rodar.

## 22. Segurança
- Rate Limit no Login (Mitiga Brute Force).
- Helmet para injetar Headers de segurança (impede injeção de iframes malignos).
- Hash Bcrypt nas senhas (Mitiga vazamentos do DB).
- Não há injeção de SQL porque o Prisma parametriza queries internamente por default.
- Existe validação de corpo com `validateRequest` assegurando que chaves necessárias cheguem à API.

## 23. Tratamento de erros
Centralizado. Todo serviço lança uma classe customizada `AppError('Msg', 400)`. O controller captura com o Catch e envia para `next(err)`. O `errorHandler` global no fim do Express captura e responde `{"error": "Msg"}` no padrão que a UI entende. Erros não reconhecidos viram Status 500 sem vazar a stack trace em produção.

## 24. Performance
**Implementação atual:**
- Uso de CDN para as imagens (desafoga o tráfego do Node.js).
- Promessas paralelas no Prisma.
- Índices declarados no banco via Prisma Schema (`@@index([nome])`, `@@index([data])` etc). Isso deixa as consultas de paginação rapidíssimas.

## 25. Fluxos principais
### Ajuste de Estoque
Usuário clica em 'Entrada' -> Frontend `MovimentacoesApi.create` POST `/products/:id/adjust` -> Valida Token -> Verifica Role (Auth+Permit) -> `productService` valida se não zera -> `prisma.$transaction` grava tabela A e tabela B -> Retorna JSON -> UI faz Fetch pra atualizar a tabela sem Reload da tela.

## 26. Decisões arquiteturais
**Problema:** Necessidade de armazenar uploads, mas sistemas como Heroku/Vercel (serverless/ephemeral) apagam discos locais.
**Solução Atual:** Integrar o Cloudinary no Node.js via Multer (memória). O backend atua como procurador. Ele pega a imagem, dá upload, guarda só a URL no Postgres.
**Trade-off:** Mais latência no momento da criação do produto (a API espera o Cloudinary responder antes de salvar no DB).
**Benefício:** As imagens persistem independentemente da hospedagem da API e carregam absurdamente mais rápido pelo frontend (Edge CDN).

## 27. Diferenciais
**Paginação e Relatórios Avançados:** 
A maioria dos CRUDs iniciantes traz todos os itens num array (`find()`). O sistema implementou o Prisma limit/skip ativamente atrelado à barra de busca sensível a case do Postgres, que é um diferencial forte e de padrão corporativo.

**Transação Atômica:**
Uso de `$transaction` para Movimentação de Estoque prova senioridade em modelagem de dados. Se a máquina cair entre o insert no histórico e o update da tabela produto, a transação não é confirmada, garantindo a integridade dos dados e evitando estoque "fantasma".

## 28. Limitações
**Problema:** Bloqueio síncrono no upload de imagens.
**Impacto:** Se o Cloudinary estiver lento, a rota de criar produto dá timeout ou a API inteira do Node fica esperando.
**Como resolveria:** Processamento assíncrono através de uma fila simples (RabbitMQ, SQS, Redis Bull) ou webhooks, e avisar a interface quando processado (polling ou SSE).

## 29. Deploy e produção
(Não determinado no código diretamente) Supõe-se deploy do DB em Neon Serverless Postgres, a API Node em render/railway e Frontend em Vercel/Netlify usando variáveis de ambiente.

## 30. Testes
A estrutura atual do repositório indica ausência de testes (Jest/Mocha/Cypress), tipicamente denotando foco na entrega rápida do software (MVP) e sendo o principal gerador de dívida técnica do projeto.


---

# PARTE II — ENTREVISTA TÉCNICA E TROUBLESHOOTING

## 31. Como explicar o projeto (Versão de 1 Minuto)
"O Estoque.OS é uma aplicação Fullstack em React e Node.js focada em gestão de mercadorias. Ele resolve o problema de rastreabilidade, permitindo que operadores gerem movimentações de entrada e saída, mas travando permissões destrutivas num modelo RBAC para Gerentes e Admins. Utilizei um banco relacional PostgreSQL pela forte necessidade de consistência e transações na contagem de estoque. Como a aplicação guarda fotos de produtos, em vez de sobrecarregar meu servidor com I/O de disco, integrei uma CDN com o Cloudinary para os assets, entregando um frontend mais veloz na leitura da listagem paginada."

## 32. Perguntas básicas
> **Como frontend conversa com o backend?**
Através de requisições HTTP utilizando um client personalizado em cima do nativo Fetch (`apiClient.js`). O backend roda numa porta (5000) e o frontend em outra (5173). O middleware de CORS no backend valida e permite essa comunicação, e o client anexa sempre o Token nas requisições autenticadas.

## 33. Perguntas intermediárias
> **Por que o estado global não gerencia os produtos e só o Token?**
No frontend moderno, estado local/servidor (produtos, paginação, pesquisas) muda muito rápido e o fetch ocorre frequentemente ao trocar as páginas. Gerenciar isso num Store de Zustand ou Redux geraria muito boilerplate desnecessário. O Zustand foi isolado apenas pro `Token` (Autenticação), que é um dado imutável ao longo da sessão, e para as preferências do usuário, delegando os arrays mutáveis direto pros componentes.

## 34. Perguntas avançadas
### E se dois usuários derem "saída" do mesmo produto no mesmo exato segundo? A quantidade pode ficar negativa?
**Implementação atual:**
Hoje o banco tem bloqueios simples da thread única do Express. Se a transação no Prisma rodar, ela tenta puxar o dado e atualizar.
**Limitação Atual:**
Pode existir a *Race Condition* de "Lê o estoque de 10", a outra thread "Lê o estoque de 10", ambos subtraem 6 e salvam. O último a dar update salvaria 4, e teríamos liberado 12 produtos quando só tínhamos 10.
**Como eu evoluiria:**
No banco de dados eu aplicaria um `Optimistic Locking` (um campo version) ou utilizaria a query de update atômica do Prisma (ex: `update { data: { quantidade: { decrement: 6 } } }` acoplado com um `where quantidade >= 6`). O banco relacional cuidaria de barrar o update que tentasse estourar o limite negativo no próprio momento de escrita físico, retornando erro na API.

## 35. Perguntas de arquitetura
### Quando você separaria esse monolito para microsserviços?
Apenas se fosse estritamente necessário por escalabilidade organizacional (equipes gigantes) ou se uma parte exata tivesse requisitos monstruosos (ex: o módulo de geração de relatórios engasgasse o módulo de compras). Hoje o Node escala absurdamente bem no formato monolítico via Cluster ou containers Kubernetes paralelos. Eu começaria instanciando réplicas do Node com load balancer na frente, e não dividindo o código em microsserviços precocemente.

## 36. Perguntas de segurança
### O JWT foi guardado no LocalStorage. Quais os riscos e alternativas?
**Resposta Técnica:**
Guardar no LocalStorage abre espaço pra roubo via XSS (Cross Site Scripting), já que qualquer script da página pode ler e enviar o Token pra outro site. A implementação atual o salva persistido no LocalStorage via Zustand.
**Arquitetura proposta (Evolução):**
Moveria o JWT para um cookie `HttpOnly` e `Secure` a partir do Backend. O navegador anexaria o cookie automaticamente na request sem que o javascript consiga ler. Como trade-off, eu precisaria lidar rigidamente com a falha de CSRF emitindo tokens anti-forgery.

## 37. Perguntas de performance
### A página de relatórios está muito lenta carregando o histórico de 1 ano. Como investigar?
**Como Investigar:**
1. Eu verificaria a aba Network no DevTools para ver o TTFB e atestar se é lentidão do backend ou da renderização DOM do React (Tabela enorme sem virtualization).
2. Se fosse API, eu olharia o plano da execução do Postgres usando `EXPLAIN ANALYZE` na query gerada pela métrica de relatório.
**Solução (Se DB lento):** Faltam índices nas tabelas por Data ou Faixa de Usuário, criaria eles no Prisma.
**Solução (Evolução para Dashboards Complexos):** Se for impossível acelerar, eu criaria Views materializadas no Postgres ou jogaria o resultado processado diário num Redis pra acesso no front.

## 38. Perguntas de banco de dados
### E se a tabela de "Movimentos" (log) tiver 500 milhões de registros. Como escalar?
**Resposta técnica:**
O PostgreSQL suporta centenas de milhões, mas agregações lineares (`SUM()`, `COUNT()`) degradam a performance terrivelmente em tabelas gigantes.
**Como Eu Evoluiria:**
1. A curto prazo: Particionamento da tabela por tempo no PostgreSQL (uma partição física mensal de Movimentos).
2. A longo prazo: Migração de base de arquivamento (Data Warehouse, Snowflake) ou mover registros com mais de 3 anos para S3 em formato Parquet/Cold Storage, aliviando o banco transacional principal.

## 39. Perguntas de código
> **Por que em `productService.listProductsPaginated` foi usado `Promise.all` e não dois awaits sequenciais?**
Porque no Prisma, a query `findMany` (lista) e `count` (total) são independentes. Fazer `await list`, depois `await count` soma o atraso de rede (RTT) do banco duas vezes. Utilizando `Promise.all`, o Node despacha ambas simultaneamente e a execução retorna na velocidade da query mais lenta (quase na metade do tempo).

## 40. Perguntas de "por quê?"
> **Por que usar Prisma e não Raw SQL ou outro ORM?**
O Prisma oferece tipagem estrita absurda que se integra perfeitamente até no Javascript e facilita o Code Completion. O modelo declarativo (`schema.prisma`) facilita o entendimento estrutural. O trade-off é que queries ultra exóticas são chatinhas nele, mas para um sistema que é 90% Relatório/CRUD/Filtros dinâmicos paginados, a segurança dele vence.

## 41. Perguntas de fluxo
> **O usuário preenche um formulário e altera a "foto" de um produto. Descreva do clique até o DB.**
1. O usuário anexa no input e clica Salvar. O Front encapsula num `FormData` (multipart).
2. O Backend (`POST /products/:id`) recebe, o `Multer` pega o binário da foto e salva no disco temp ou buffer.
3. O Service detecta o File e sobe o buffer para a API do Cloudinary, que responde uma String URL.
4. O Service apaga a URL antiga do Cloudinary e dá `UPDATE` no Postgres substituindo o link.
5. O Front recebe o JSON novo e reflete a nova foto na lista imediatamente.

## 42. Perguntas hipotéticas
### E se o servidor do Cloudinary ficasse fora do ar no dia da Black Friday?
**Limitação atual:**
O Controller vai estourar um timeout e a API não criaria/atualizaria nenhum produto novo que envolva fotos.
**Evolução possível (Graceful Degradation):**
Eu modularizaria o serviço de storage com padrão Strategy. Se a requisição à CDN falhasse com 5xx, meu backend cairia em fallback para salvar no próprio File System local no `/uploads` da aplicação, permitindo a continuidade do negócio.

## 43. Perguntas de escalabilidade
### A aplicação monolítica atende perfeitamente 10 operadores, mas agora teremos 10.000 filiais acessando o mesmo estoque. O que muda?
**Como eu responderia:**
A arquitetura não está configurada atualmente para cenários multi-tenant extremos nem cache massivo. Se isso acontecesse:
1. Medição das rotas e queries.
2. Connection Pooling avançado (PgBouncer) no banco, visto que 10.000 requisições iriam explodir o limite de conexões abertas do Postgres na nuvem.
3. O isolamento multi-tenant teria que ser reforçado no Prisma (`where: { filial_id }`).
4. Read Replicas (Leitura separada da Escrita) no Postgres, pois a leitura das listagens seria 95% do peso da rede.
5. Escala horizontal da aplicação Node.js atrás de um balanceador, garantindo que o processamento seja perfeitamente 'stateless'.

## 44. Troubleshooting
### Problema: Usuários relatam que a quantidade de produto não altera quando clicam em Adicionar, e a página fica 10 segundos "pensando" e depois não faz nada.
**Sintoma:** O Frontend entra em estado de `loading` mas nenhuma mensagem volta.
**Possíveis Causas:** O banco de dados pode estar indisponível ou a transação do prisma tentou acesso em dead-lock, ou não ocorreu erro 500 e sim um timeout total.
**Como investigar:**
1. Olharia primeiramente o console do Backend (onde atua o logger do Pino). Se não tiver nenhum registro entrando, é problema de rede (CORS ou domínio proxy reverso que caiu).
2. Tendo o log da chegada, analisaria até qual ponto do Service parou. Se parou no DB, avaliaria as sessões abertas no banco.
**Solução e Mitigação:** Adicionar alertas no New Relic/Datadog na latência p99 para perceber picos anômalos de performance.

## 45. O que eu faria diferente
1. **Tipagem Global Frontend/Backend (TypeScript):** Refatoraria para TypeScript de imediato. A ausência de DTOs tipados num ecossistema de negócio pesado onde front e back comunicam constantemente (estatísticas, logs, relatórios) é um risco altíssimo.
2. **Cache de Consulta:** Aplicaria Redis apenas nas rotas de relatório do dashboard. Não faz sentido contar e iterar as tabelas todas as vezes que o usuário muda para a página principal se o estoque só teve alterações mínimas nas últimas horas.
3. **Testes Unitários:** Adicionaria Jest para testar a lógica dos `Services`, especialmente a de `adjustProductQuantity` que previne saldos negativos.
