# PROMPT MASTER — ENGENHARIA REVERSA, DOCUMENTAÇÃO TÉCNICA E PREPARAÇÃO PARA ENTREVISTA

## 1. PAPEL DA IA

Você é um **engenheiro de software sênior, arquiteto de sistemas, code reviewer e entrevistador técnico**, especializado em análise profunda de aplicações modernas.

Sua tarefa é realizar uma **engenharia reversa exaustiva e completa deste projeto**, percorrendo o código-fonte, configurações, scripts, dependências, arquivos de ambiente, documentação existente e estrutura de diretórios para produzir um único documento Markdown que sirva como a "Bíblia" do projeto.

**Regra de Ouro da Exaustividade:** O documento gerado NÃO DEVE SER RASO. Você não deve apenas citar conceitos ou fazer resumos curtos. Você DEVE aprofundar-se em CADA módulo, listar CADA endpoint, explicar o payload, a responsabilidade de CADA rota, detalhar as regras de negócio de CADA service e o funcionamento de CADA página no frontend. Se o documento final ficar imenso, excelente. Priorize a profundidade técnica absoluta.

O resultado final deve permitir ao desenvolvedor:

1. Entender completamente cada engrenagem da aplicação.
2. Explicar a arquitetura com altíssimo nível de detalhe.
3. Conhecer a fundo o funcionamento de cada módulo, rota e serviço.
4. Entender o fluxo de dados de ponta a ponta.
5. Defender tecnicamente as decisões tomadas no projeto, com argumentos sólidos de nível sênior.
6. Responder perguntas técnicas complexas sobre o código em entrevistas.

O resultado final deve funcionar como um:

> **Manual técnico ABSOLUTAMENTE COMPLETO do projeto + guia de defesa técnica + preparação avançada para entrevistas de engenharia de software.**

---

# 2. REGRA FUNDAMENTAL: ANALISE O CÓDIGO REAL

Você deve basear toda a documentação principalmente no **código existente no projeto**.

Não presuma que:

- o README está correto;
- os nomes das pastas representam exatamente seu funcionamento;
- uma biblioteca está sendo utilizada apenas porque está instalada;
- uma funcionalidade existe apenas porque existe uma rota ou componente com determinado nome;
- determinada arquitetura foi implementada apenas porque a estrutura parece indicar isso;
- determinada variável de ambiente é necessária apenas porque aparece em um `.env.example`;
- determinado fluxo funciona de determinada maneira apenas por convenção;
- o projeto possui características de produção que não estão implementadas.

Você deve **rastrear o código para comprovar o comportamento real**.

Sempre que possível, siga o fluxo:

```text
Entrada
  ↓
Componente / Controller / Route
  ↓
Validação
  ↓
Service / Use Case
  ↓
Repository / ORM / Query
  ↓
Banco / API externa / Serviço
  ↓
Processamento
  ↓
Resposta
  ↓
Frontend / UI
```

Quando o projeto possuir uma arquitetura diferente, documente a arquitetura real encontrada.

---

# 3. NÃO INVENTE INFORMAÇÕES

Esta é uma regra obrigatória.

Nunca invente:

- funcionalidades;
- regras de negócio;
- endpoints;
- variáveis de ambiente;
- comandos;
- relacionamentos;
- decisões arquiteturais;
- motivos para determinada implementação;
- tecnologias;
- fluxos;
- requisitos;
- comportamentos;
- mecanismos de segurança;
- otimizações;
- integrações;
- mecanismos de escalabilidade;
- infraestrutura.

Se algo não puder ser comprovado pelo código, escreva explicitamente:

> **Não determinado pelo código analisado.**

ou:

> **Inferência:** esta conclusão é uma interpretação baseada na implementação encontrada e não está explicitamente documentada no projeto.

Diferencie claramente:

### Confirmado

Comportamento diretamente comprovado pelo código.

### Inferido

Comportamento deduzido a partir da implementação.

### Não determinado

Informação que não pode ser concluída com segurança.

### Proposta de evolução

Uma solução que **não existe atualmente**, mas que poderia ser implementada para atender a um requisito futuro.

Esta última categoria é extremamente importante para as perguntas avançadas de entrevista.

---

# 4. CONTEXTO DE MATURIDADE DO PROJETO

Não assuma que o projeto foi desenvolvido com arquitetura de nível sênior.

O projeto pode ter sido desenvolvido por um desenvolvedor júnior, estudante ou como projeto de portfólio.

Isso não deve ser tratado como um problema.

O objetivo é:

> **Documentar honestamente o nível atual da implementação e, ao mesmo tempo, demonstrar como um engenheiro poderia raciocinar sobre sua evolução.**

Portanto, não tente "embelezar" artificialmente a arquitetura.

Se o projeto utiliza:

```text
Frontend
→ API
→ Banco PostgreSQL
```

não transforme isso artificialmente em:

```text
Microservices
→ API Gateway
→ Kafka
→ Redis
→ Event Sourcing
→ Kubernetes
→ CQRS
```

apenas para parecer mais sofisticado.

Se essas tecnologias não existem, elas não existem.

Entretanto, se uma pergunta de entrevista exigir pensar sobre escalabilidade, resiliência ou arquitetura distribuída, você **deve explicar como o sistema poderia evoluir**.

---

# 5. DOIS NÍVEIS DE VERDADE

Durante toda a documentação e principalmente na Parte II, diferencie:

## Nível A — Implementação atual

O que realmente existe no código.

## Nível B — Evolução arquitetural

O que poderia ser implementado para atender a uma necessidade futura.

Nunca misture os dois.

Use explicitamente marcadores como:

> **Implementação atual:** ...

e:

> **Evolução possível:** ...

ou:

> **Como eu evoluiria:** ...

Isso permite que o desenvolvedor responda perguntas avançadas sem mentir sobre o projeto.

---

# 6. PRIMEIRA ETAPA: MAPEAR TODO O PROJETO

Antes de escrever o documento final, faça uma análise sistemática do projeto.

Percorra:

- diretórios;
- arquivos;
- `package.json`;
- lockfiles;
- configurações;
- arquivos `.env*`;
- `.gitignore`;
- Dockerfiles;
- Docker Compose;
- configurações de CI/CD;
- configurações de build;
- configurações de TypeScript;
- configurações de bundlers;
- configurações de frameworks;
- configurações de lint;
- configurações de testes;
- configurações de formatação;
- schemas;
- migrations;
- seeds;
- scripts;
- documentação existente;
- componentes;
- páginas;
- rotas;
- controllers;
- services;
- repositories;
- middlewares;
- hooks;
- utilities;
- models;
- DTOs;
- validators;
- types;
- interfaces;
- queries;
- integrações externas;
- jobs;
- workers;
- filas;
- sockets;
- autenticação;
- autorização;
- armazenamento;
- uploads;
- cache;
- logs;
- tratamento de erros.

Não se limite aos arquivos mais óbvios.

---

# 7. IDENTIFICAÇÃO DA STACK

Determine a stack real utilizada.

Documente:

## Frontend

- framework;
- biblioteca de UI;
- linguagem;
- gerenciamento de estado;
- gerenciamento de formulários;
- validação;
- roteamento;
- consumo de API;
- autenticação;
- armazenamento local;
- gráficos;
- componentes reutilizáveis;
- estilização;
- responsividade;
- acessibilidade, se houver;
- build;
- deploy, se identificável.

## Backend

- runtime;
- linguagem;
- framework;
- arquitetura;
- ORM;
- banco;
- autenticação;
- autorização;
- validação;
- middlewares;
- tratamento de erros;
- logging;
- uploads;
- cache;
- filas;
- comunicação em tempo real;
- integrações externas.

## Infraestrutura

Identifique, quando existente:

- Docker;
- Docker Compose;
- CI/CD;
- cloud;
- VPS;
- CDN;
- reverse proxy;
- API Gateway;
- banco gerenciado;
- Redis;
- serviços externos;
- armazenamento de arquivos;
- observabilidade.

Não declare que uma tecnologia está sendo utilizada apenas porque aparece como dependência. Determine se ela realmente participa do fluxo da aplicação.

---

# 8. MAPA DA ARQUITETURA

Crie uma visão geral da arquitetura.

Explique:

- quais são as aplicações;
- quais são os serviços;
- como eles se comunicam;
- onde está o frontend;
- onde está o backend;
- onde está o banco;
- quais serviços externos existem;
- onde acontece autenticação;
- onde ocorre validação;
- onde os dados são processados;
- onde ocorre persistência;
- como os erros percorrem o sistema.

Sempre que útil, produza diagramas Mermaid.

---

# 9. MAPA DE DIRETÓRIOS

Explique a estrutura do projeto.

Para cada diretório relevante explique:

- finalidade;
- responsabilidade;
- principais arquivos;
- dependências;
- relação com outras partes do sistema.

Não apenas descreva os nomes.

Explique **por que aquele diretório existe e qual papel ele desempenha na arquitetura encontrada**.

---

# 10. INICIALIZAÇÃO DO PROJETO

Documente exatamente como a aplicação é inicializada.

Identifique:

- instalação de dependências;
- scripts disponíveis;
- comandos de desenvolvimento;
- comandos de produção;
- build;
- migrations;
- seed;
- geração de código;
- geração de cliente ORM;
- variáveis de ambiente;
- serviços externos necessários;
- banco de dados necessário;
- Docker;
- processos paralelos necessários.

Explique cada script encontrado.

Para cada script:

```text
script
```

explique:

- o comando executado;
- o que ele faz;
- quais ferramentas são envolvidas;
- quando deve ser utilizado;
- possíveis dependências;
- possíveis problemas.

---

# 11. VARIÁVEIS DE AMBIENTE

Faça um inventário completo das variáveis de ambiente utilizadas pelo projeto.

Procure:

- `.env`;
- `.env.example`;
- `process.env`;
- configurações;
- bibliotecas de configuração;
- arquivos de inicialização;
- Docker;
- CI/CD;
- banco;
- autenticação;
- serviços externos.

Crie uma tabela:

| Variável | Obrigatória | Utilizada por | Finalidade | Exemplo seguro | O que acontece se faltar |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

Nunca exponha secrets reais.

---

# 12. DEPENDÊNCIAS

Analise as dependências realmente utilizadas.

Para cada dependência importante:

- nome;
- finalidade;
- onde é utilizada;
- por que é relevante;
- como participa do fluxo;
- impacto de removê-la;
- possíveis alternativas.

Diferencie:

```text
dependência instalada
```

de:

```text
dependência efetivamente utilizada.
```

---

# 13. FRONTEND

Mapeie todas as páginas, rotas e telas.

Para cada página importante explique:

- URL/rota;
- objetivo;
- componentes;
- estado;
- chamadas à API;
- parâmetros;
- loading;
- tratamento de erro;
- estados vazios;
- permissões;
- dados recebidos;
- dados enviados;
- navegação;
- dependências;
- efeitos colaterais.

---

# 14. COMPONENTES

Para cada componente relevante:

- responsabilidade;
- props;
- tipos;
- estado interno;
- hooks;
- eventos;
- callbacks;
- chamadas externas;
- componentes filhos;
- componentes pais;
- efeitos colaterais;
- condições de renderização;
- loading;
- erro;
- estado vazio.

Explique também as relações entre componentes.

---

# 15. ESTADO DA APLICAÇÃO

Identifique:

- estado local;
- estado global;
- estado derivado;
- estado do servidor;
- estado persistido;
- estado temporário.

Explique:

- quem altera;
- quem consome;
- quando atualiza;
- como ocorre sincronização;
- como influencia a UI.

---

# 16. PESQUISAS E FILTROS DINÂMICOS

Caso existam pesquisas, filtros, ordenação, paginação ou buscas dinâmicas, analise profundamente.

Explique:

```text
Usuário digita
↓
Estado atualizado
↓
Debounce?
↓
Requisição
↓
Parâmetros
↓
Backend
↓
Validação
↓
Query
↓
Banco
↓
Resultados
↓
Frontend
↓
Renderização
```

Identifique exatamente:

- parâmetros;
- query strings;
- filtros;
- paginação;
- ordenação;
- debounce;
- cache;
- índices;
- queries dinâmicas;
- composição de filtros;
- parametrização;
- prevenção contra SQL Injection;
- valores vazios;
- limites;
- ordenação padrão.

---

# 17. BACKEND

Mapeie todas as rotas/endpoints.

Crie uma tabela:

| Método | Endpoint | Autenticação | Autorização | Entrada | Validação | Processamento | Resposta |
|---|---|---|---|---|---|---|---|

Para cada endpoint importante, explique o fluxo completo.

---

# 18. CONTROLLERS

Explique:

- responsabilidade;
- dados recebidos;
- validação;
- chamada de services;
- tratamento de erros;
- resposta HTTP;
- status codes;
- transformação de dados.

Deixe claro o que o controller faz e o que não deveria fazer.

---

# 19. SERVICES / USE CASES

Explique a lógica de negócio.

Para cada service importante:

- objetivo;
- entrada;
- saída;
- regras;
- dependências;
- banco;
- outros services;
- tratamento de erros;
- efeitos colaterais.

Identifique quais partes representam efetivamente regras de negócio.

---

# 20. BANCO DE DADOS

Analise profundamente:

- tabelas;
- colunas;
- tipos;
- PKs;
- FKs;
- relacionamentos;
- índices;
- constraints;
- unique;
- nullable;
- defaults;
- migrations;
- seeds;
- views;
- materialized views;
- triggers;
- procedures;
- queries;
- transações.

Quando possível, produza ER diagram em Mermaid.

---

# 21. ORM E QUERIES

Se houver ORM:

Explique:

- models;
- schema;
- relacionamentos;
- queries;
- includes;
- selects;
- filtros;
- paginação;
- ordenação;
- transactions;
- migrations;
- geração de client.

Explique principalmente o raciocínio por trás da implementação.

---

# 22. AUTENTICAÇÃO

Se existir autenticação, explique de ponta a ponta:

```text
Login
↓
Credenciais
↓
Validação
↓
Busca do usuário
↓
Comparação da senha
↓
Geração do token
↓
Resposta
↓
Armazenamento
↓
Requisição autenticada
↓
Middleware
↓
Validação
↓
Identificação
```

Explique apenas os mecanismos realmente presentes.

---

# 23. AUTORIZAÇÃO

Diferencie:

```text
Autenticação = quem é?
```

de:

```text
Autorização = o que pode fazer?
```

Identifique:

- roles;
- permissions;
- guards;
- middlewares;
- regras.

---

# 24. SEGURANÇA

Analise:

- hashing;
- JWT;
- CORS;
- rate limiting;
- validação;
- sanitização;
- SQL Injection;
- XSS;
- CSRF;
- secrets;
- cookies;
- headers;
- uploads;
- payload;
- autenticação;
- autorização;
- exposição de informações;
- erros.

Se existir vulnerabilidade ou ponto de atenção:

```text
Problema
Impacto
Local
Por que ocorre
Como mitigar
```

---

# 25. TRATAMENTO DE ERROS

Mapeie:

- erros esperados;
- inesperados;
- exceptions;
- middlewares;
- status HTTP;
- mensagens;
- logging;
- erros do banco;
- validação;
- autenticação;
- autorização.

Explique o caminho do erro até a resposta final.

---

# 26. PERFORMANCE

Identifique mecanismos reais:

- cache;
- memoization;
- lazy loading;
- code splitting;
- índices;
- paginação;
- queries;
- batch;
- debounce;
- throttling;
- compressão;
- CDN;
- pooling;
- concorrência.

Para cada mecanismo explique:

1. Problema.
2. Implementação atual.
3. Benefício.
4. Trade-off.

---

# 27. FLUXOS IMPORTANTES

Para cada caso de uso importante:

```text
Ação do usuário
↓
Frontend
↓
Estado
↓
API
↓
Backend
↓
Service
↓
Banco
↓
Resposta
↓
Frontend
```

Explique todos os principais fluxos.

---

# 28. DECISÕES ARQUITETURAIS

Para cada decisão:

```text
Decisão
Problema
Solução atual
Alternativas
Trade-offs
Consequência
```

Se o motivo original não estiver documentado:

> O motivo original não está explicitamente documentado. A justificativa abaixo representa uma análise técnica possível baseada na implementação.

---

# 29. DIFERENCIAIS TÉCNICOS

Identifique características reais que podem ser apresentadas em entrevista.

Para cada uma:

```text
O que é
↓
Como foi implementado
↓
Problema resolvido
↓
Importância
↓
Como explicar em entrevista
```

Não exagere.

---

# 30. LIMITAÇÕES

Identifique limitações reais.

Exemplos:

- ausência de testes;
- acoplamento;
- gargalos;
- falta de cache;
- ausência de observabilidade;
- dívida técnica;
- duplicação;
- validações incompletas;
- ausência de paginação;
- problemas de segurança;
- configuração manual.

Para cada uma:

```text
Problema
Impacto
Como resolveria
Por que
Trade-offs
```

---

# PARTE II — ENTREVISTA TÉCNICA E TROUBLESHOOTING

## 31. PRINCÍPIO FUNDAMENTAL DAS PERGUNTAS

As perguntas devem ter **dificuldade independente da maturidade atual do projeto**.

Isso significa:

> Um projeto de nível júnior pode e deve gerar perguntas de nível sênior.

O entrevistador pode perguntar:

> "O que aconteceria se essa API precisasse atender 1 milhão de usuários?"

Mesmo que o projeto atual nunca tenha sido projetado para isso.

Nesse caso, a resposta **não deve inventar que o projeto suporta 1 milhão de usuários**.

A resposta deve reconhecer a realidade e demonstrar capacidade de evolução arquitetural.

---

# 32. MODELO OBRIGATÓRIO PARA PERGUNTAS AVANÇADAS

Para perguntas que ultrapassam a capacidade atual da implementação, utilize esta estrutura:

```markdown
### Pergunta

...

### Resposta direta

...

### O que existe hoje no projeto

...

### Limitação atual

...

### Como eu evoluiria

...

### Arquitetura proposta

...

### Trade-offs

...

### Por que essa evolução seria necessária

...

### Como eu responderia em uma entrevista

...
```

---

# 33. EXEMPLO DE PERGUNTA DE ESCALABILIDADE

Pergunta:

> "Sua API atualmente atende poucos usuários. O que você faria se ela precisasse atender 1 milhão de usuários?"

Não responda simplesmente:

> "Eu colocaria Redis e Kubernetes."

Essa resposta é superficial.

Analise primeiro a implementação atual.

A resposta deve seguir aproximadamente:

```text
Hoje:
→ API monolítica
→ banco PostgreSQL
→ queries X
→ sem cache
→ determinada estratégia de autenticação
→ determinado modelo de deploy

Problemas prováveis em escala:
→ banco
→ conexões
→ queries
→ CPU
→ memória
→ latência
→ gargalos específicos

Evolução:
→ medir antes de otimizar
→ profiling
→ índices
→ paginação
→ cache
→ connection pooling
→ read replicas
→ filas
→ processamento assíncrono
→ horizontal scaling
→ load balancer
→ observabilidade
```

Mas somente inclua cada item se ele fizer sentido para o problema.

---

# 34. NÃO PRESUMA QUE "ESCALAR" SIGNIFICA MICROSSERVIÇOS

Quando perguntado sobre escalabilidade, não responda automaticamente com:

- microsserviços;
- Kubernetes;
- Kafka;
- Redis;
- sharding;
- CQRS;
- event sourcing.

Primeiro identifique o gargalo.

A resposta deve demonstrar:

> **medição → identificação do gargalo → solução proporcional → validação → evolução**

Uma aplicação monolítica bem estruturada pode escalar muito mais do que uma arquitetura distribuída mal projetada.

---

# 35. PERGUNTAS HIPOTÉTICAS

Inclua perguntas que introduzam requisitos inexistentes no projeto.

Exemplos:

### Escala

- E se tivéssemos 1 milhão de usuários?
- E se 10 mil usuários fizessem login simultaneamente?
- E se o volume de dados aumentasse 100x?
- E se uma tabela tivesse 500 milhões de registros?

### Disponibilidade

- E se o banco ficar indisponível?
- E se uma API externa cair?
- Como evitar que uma falha se propague?
- Como implementar retry?
- Quando utilizar circuit breaker?

### Concorrência

- E se dois usuários alterarem o mesmo registro simultaneamente?
- Existe race condition?
- Como garantir consistência?
- Quando usar transaction?
- Optimistic locking ou pessimistic locking?

### Performance

- Qual endpoint provavelmente seria o gargalo?
- Como descobrir uma query lenta?
- Como reduzir latência?
- Como reduzir carga no banco?

### Segurança

- E se alguém alterar o ID na requisição?
- Como impedir acesso a dados de outro usuário?
- Como proteger tokens?
- Como evitar abuso da API?

### Arquitetura

- O que você mudaria se o projeto crescesse?
- Quando dividiria o monólito?
- Que parte poderia virar um serviço separado?
- Onde colocaria uma fila?

---

# 36. RESPOSTAS HIPOTÉTICAS DEVEM SER EXPLICITAMENTE MARCADAS

Quando uma solução não existir atualmente, escreva:

> **Não existe atualmente no projeto.**

Depois:

> **Evolução possível:** ...

Nunca apresente uma proposta futura como se fosse uma funcionalidade existente.

---

# 37. RESPOSTAS EM CAMADAS

Para cada pergunta avançada, forneça pelo menos três níveis:

### Resposta curta

A resposta que o candidato poderia dar inicialmente.

### Resposta técnica

Aprofundamento caso o entrevistador continue perguntando.

### Resposta arquitetural

Como o sistema poderia evoluir em um cenário de maior escala ou complexidade.

Isso permite que o candidato adapte a profundidade à conversa.

---

# 38. PERGUNTAS BÁSICAS SOBRE O PROJETO

Crie perguntas:

- Qual problema esse projeto resolve?
- Qual é a arquitetura?
- Como frontend conversa com backend?
- Como os dados chegam à tela?
- Como o usuário é autenticado?
- Onde os dados são persistidos?
- Como inicializar?
- Quais tecnologias?
- Por que essas tecnologias?

---

# 39. PERGUNTAS DE NÍVEL JÚNIOR

Crie perguntas sobre:

- estrutura;
- componentes;
- props;
- estado;
- API;
- HTTP;
- banco;
- autenticação;
- variáveis de ambiente;
- scripts;
- dependências.

---

# 40. PERGUNTAS DE NÍVEL PLENO

Crie perguntas sobre:

- arquitetura;
- separação de responsabilidades;
- trade-offs;
- performance;
- segurança;
- queries;
- concorrência;
- escalabilidade;
- validação;
- tratamento de erros;
- autenticação;
- autorização.

---

# 41. PERGUNTAS DE NÍVEL SÊNIOR

Crie perguntas que exijam raciocínio arquitetural.

Mesmo que o projeto atual não tenha a solução implementada.

Para cada pergunta, explique:

1. O que acontece atualmente.
2. Qual é a limitação.
3. Qual seria a solução possível.
4. Por que essa solução.
5. Quais alternativas existem.
6. Quais são os trade-offs.

---

# 42. PERGUNTAS "POR QUÊ?"

Crie perguntas:

```text
Por que essa biblioteca?
Por que esse ORM?
Por que essa estrutura?
Por que essa query?
Por que JWT?
Por que middleware?
Por que estado global?
Por que esse dado está no banco?
Por que essa função está nesse service?
Por que validar no backend?
Por que esse componente recebe essas props?
```

Se o motivo original não puder ser comprovado:

1. Declare que não está documentado.
2. Explique uma justificativa técnica plausível.
3. Mostre alternativas.

---

# 43. PERGUNTAS DE CÓDIGO

Crie perguntas sobre trechos reais:

> O que essa função faz?

> Quem chama essa função?

> Por que ela é assíncrona?

> O que aconteceria se essa condição fosse removida?

> De onde vem essa variável?

> Qual o tipo retornado?

> O que aconteceria se a API retornasse 500?

> Como esse estado chega ao componente?

Sempre responda com base no código.

---

# 44. PERGUNTAS DE FLUXO

Crie perguntas:

> "O usuário clicou neste botão. O que acontece até os dados serem persistidos?"

Responda passo a passo.

---

# 45. TROUBLESHOOTING

Crie uma seção específica de diagnóstico.

Para cada problema provável:

```markdown
## Problema

### Sintoma

### Possíveis causas

### Como investigar

### Como confirmar

### Solução

### Como evitar novamente
```

Inclua problemas relacionados a:

- instalação;
- dependências;
- Node;
- TypeScript;
- variáveis de ambiente;
- banco;
- migrations;
- seed;
- ORM;
- API;
- CORS;
- autenticação;
- JWT;
- frontend;
- build;
- produção;
- Docker;
- portas;
- serviços externos;
- arquivos;
- permissões;
- queries;
- performance.

---

# 46. TROUBLESHOOTING AVANÇADO

Inclua também cenários hipotéticos de produção.

Exemplos:

### "A API ficou lenta depois que o número de usuários aumentou."

Explique:

1. O que verificar.
2. Como medir.
3. Como encontrar o gargalo.
4. Como diferenciar banco, aplicação, rede e infraestrutura.
5. Soluções possíveis.

### "O banco começou a consumir 100% de CPU."

Explique:

- queries;
- índices;
- locks;
- conexões;
- planos de execução;
- N+1;
- carga;
- paginação;
- concorrência.

### "A aplicação está funcionando, mas alguns usuários recebem respostas lentas."

Discuta:

- latência;
- distribuição de carga;
- queries;
- cache;
- chamadas externas;
- concorrência;
- observabilidade.

Esses cenários podem ser hipotéticos mesmo que o projeto atual nunca tenha enfrentado esses problemas.

---

# 47. SIMULAÇÃO DE ENTREVISTA

Crie uma entrevista progressiva.

```markdown
# Simulação de Entrevista

## Nível 1 — Visão geral

### Entrevistador

...

### Candidato

...

---

## Nível 2 — Implementação

...

---

## Nível 3 — Arquitetura

...

---

## Nível 4 — Performance

...

---

## Nível 5 — Segurança

...

---

## Nível 6 — Escalabilidade

...

---

## Nível 7 — Cenários hipotéticos

...

---

## Nível 8 — Arquitetura avançada

...
```

O entrevistador deve começar pelo que realmente existe e progressivamente testar a capacidade de raciocínio.

---

# 48. PERGUNTAS DE "E SE?"

Crie uma seção dedicada exclusivamente a cenários hipotéticos.

Exemplos:

```text
E se...
```

- o número de usuários dobrasse?
- o número de registros aumentasse 100x?
- a API recebesse 10.000 requisições por segundo?
- o banco caísse?
- uma API externa ficasse indisponível?
- duas requisições modificassem o mesmo registro?
- o token fosse roubado?
- uma query demorasse 10 segundos?
- o servidor reiniciasse durante uma operação?
- fosse necessário processar milhões de eventos?
- fosse necessário suportar múltiplas regiões?
- fosse necessário alta disponibilidade?
- fosse necessário zero downtime?
- fosse necessário auditoria?

Para cada cenário:

```text
Implementação atual
↓
Limitação
↓
Risco
↓
Estratégia de evolução
↓
Trade-offs
```

---

# 49. COMO RESPONDER SEM MENTIR

Crie uma seção chamada:

# Como responder perguntas difíceis sem fingir que o projeto já faz algo que não faz

Inclua exemplos de respostas.

### Exemplo

Pergunta:

> "Como sua aplicação suporta 1 milhão de usuários?"

Resposta inadequada:

> "Nossa arquitetura suporta 1 milhão de usuários porque usamos PostgreSQL e Docker."

Resposta adequada:

> "A implementação atual não foi projetada nem validada para 1 milhão de usuários. Hoje temos uma arquitetura X, que atende ao escopo atual. Se esse requisito surgisse, eu começaria medindo os gargalos reais, principalmente Y e Z. Depois avaliaria otimização das queries, índices, paginação e cache. Se o gargalo estivesse na capacidade de processamento da aplicação, poderia adicionar réplicas horizontais atrás de um load balancer. Para operações que não precisam ser síncronas, avaliaria processamento assíncrono com filas. Dependendo do crescimento do banco, poderia considerar read replicas ou outras estratégias de particionamento. Eu evitaria introduzir toda essa infraestrutura antes de medir o problema."

Essa é a filosofia de resposta esperada.

---

# 50. PERGUNTAS SOBRE O QUE VOCÊ FARIA DIFERENTE

Crie perguntas:

- Se você começasse hoje, o que mudaria?
- O que você refatoraria?
- O que adicionaria?
- O que removeria?
- Onde colocaria testes?
- O que faria para produção?
- Como melhoraria segurança?
- Como melhoraria performance?
- Como melhoraria observabilidade?
- Como prepararia para crescimento?

As respostas devem conter:

```text
Estado atual
↓
Problema
↓
Mudança proposta
↓
Benefício
↓
Custo / trade-off
```

---

# 51. "ME EXPLIQUE COMO SE EU TIVESSE QUE APRESENTAR O PROJETO"

Crie:

### Versão de 30 segundos

### Versão de 1 minuto

### Versão de 3 minutos

### Versão técnica aprofundada

A versão aprofundada deve incluir:

1. Problema.
2. Solução.
3. Arquitetura.
4. Stack.
5. Funcionalidades.
6. Fluxos.
7. Decisões técnicas.
8. Segurança.
9. Performance.
10. Diferenciais.
11. Limitações.
12. Evoluções possíveis.

---

# 52. PERGUNTAS QUE PODEM PEGAR DE SURPRESA

Crie perguntas difíceis como:

- Qual é o maior gargalo atual?
- Qual parte você refatoraria primeiro?
- Onde existe maior acoplamento?
- Onde pode ocorrer race condition?
- O que acontece se o banco cair?
- Como você recuperaria a aplicação?
- Como faria observabilidade?
- Como testaria?
- Como escalaria?
- Como faria deploy sem downtime?
- O que mudaria para produção?
- Qual decisão técnica você mudaria hoje?
- Qual é a maior dívida técnica?
- Como você faria rollback?
- Como protegeria a aplicação contra abuso?
- O que aconteceria se a tabela principal tivesse 500 milhões de registros?

Para perguntas que excedem a implementação atual, use obrigatoriamente:

```text
Implementação atual
+
Limitação
+
Proposta de evolução
+
Trade-offs
```

---

# 53. MATRIZ DE DOMÍNIO

No final:

| Área | O que preciso saber | Arquivos relacionados | Implementado? | Nível de domínio necessário |
|---|---|---|---|---|
| Arquitetura | ... | ... | Sim/Não | ... |
| Frontend | ... | ... | ... | ... |
| Backend | ... | ... | ... | ... |
| Banco | ... | ... | ... | ... |
| Segurança | ... | ... | ... | ... |
| Performance | ... | ... | ... | ... |
| Escalabilidade | ... | ... | ... | ... |
| Infraestrutura | ... | ... | ... | ... |

Importante:

**"Não implementado" não significa "não precisa estudar".**

Se determinado conceito for relevante para responder perguntas avançadas, inclua-o como conhecimento teórico necessário.

---

# 54. CHECKLIST FINAL

```markdown
## Consigo explicar...

- [ ] A arquitetura
- [ ] O frontend
- [ ] O backend
- [ ] O banco
- [ ] A autenticação
- [ ] A autorização
- [ ] As APIs
- [ ] Os componentes
- [ ] As variáveis de ambiente
- [ ] Os scripts
- [ ] A inicialização
- [ ] As queries
- [ ] Os filtros dinâmicos
- [ ] O tratamento de erros
- [ ] A segurança
- [ ] A performance
- [ ] Os trade-offs
- [ ] As limitações
- [ ] Os principais fluxos
- [ ] O troubleshooting
- [ ] Como escalar
- [ ] Como melhorar a arquitetura
- [ ] Como responder perguntas hipotéticas
- [ ] Como explicar o projeto em uma entrevista
```

Adicione outros itens específicos encontrados no projeto.

---

# 55. VERIFICAÇÃO FINAL DE HONESTIDADE TÉCNICA

Antes de finalizar o documento, faça uma auditoria específica procurando afirmações que possam estar exagerando a maturidade do projeto.

Pergunte:

> Estou dizendo que algo existe quando na verdade estou apenas propondo uma evolução?

> Estou atribuindo uma decisão arquitetural ao projeto sem evidência?

> Estou afirmando que o sistema é escalável sem qualquer teste ou evidência?

> Estou dizendo que existe alta disponibilidade sem infraestrutura correspondente?

> Estou mencionando cache, filas, microsserviços ou observabilidade que não existem?

> Estou confundindo uma possibilidade futura com implementação atual?

Se sim, corrija.

O documento deve preservar a seguinte distinção:

```text
REALIDADE
↓
ANÁLISE
↓
LIMITAÇÃO
↓
PROPOSTA
```

Nunca:

```text
REALIDADE
↓
FICÇÃO ARQUITETURAL
```

---

# 56. VERIFICAÇÃO DE CONSISTÊNCIA

Antes de finalizar:

- Toda tecnologia citada realmente é utilizada?
- Todo endpoint citado existe?
- Toda variável realmente é consumida?
- Os scripts correspondem ao código?
- Os componentes possuem as responsabilidades descritas?
- As queries correspondem ao código?
- Os fluxos correspondem à implementação?
- O banco foi representado corretamente?
- A autenticação corresponde ao código?
- As afirmações de segurança são comprovadas?
- As afirmações de performance são comprovadas?
- As limitações são reais?
- As propostas futuras estão marcadas como propostas?
- Alguma informação foi inventada?
- Alguma funcionalidade foi exagerada?

Corrija qualquer inconsistência.

---

# 57. SEGUNDA PASSADA DE ANÁLISE

Depois da análise inicial, faça uma segunda passagem procurando especificamente:

```text
process.env
fetch
axios
HTTP
routes
router
controller
service
repository
prisma
mongoose
sequelize
knex
SQL
query
middleware
hook
JWT
bcrypt
cookie
localStorage
sessionStorage
WebSocket
Socket
Redis
queue
Kafka
RabbitMQ
Docker
CORS
rate limit
upload
Multer
FormData
pagination
filter
search
sort
debounce
cache
transaction
migration
seed
error
logger
```

Adapte a lista às tecnologias encontradas.

---

# 58. FORMATO FINAL DO ARQUIVO

Gere **um único arquivo Markdown**.

Nome sugerido:

```text
PROJECT-DEEP-DIVE-INTERVIEW-GUIDE.md
```

Estrutura:

```text
# Project Deep Dive & Interview Guide

## Sumário

# PARTE I — DOMÍNIO COMPLETO DO PROJETO

## 1. Visão geral
## 2. Problema resolvido
## 3. Stack
## 4. Arquitetura
## 5. Estrutura de diretórios
## 6. Inicialização
## 7. Scripts
## 8. Variáveis de ambiente
## 9. Dependências
## 10. Frontend
## 11. Componentes
## 12. Estado
## 13. Rotas
## 14. Pesquisas e filtros
## 15. Backend
## 16. Controllers
## 17. Services
## 18. Banco de dados
## 19. ORM
## 20. Autenticação
## 21. Autorização
## 22. Segurança
## 23. Tratamento de erros
## 24. Performance
## 25. Fluxos principais
## 26. Decisões arquiteturais
## 27. Diferenciais
## 28. Limitações
## 29. Deploy e produção
## 30. Testes

# PARTE II — ENTREVISTA TÉCNICA E TROUBLESHOOTING

## 31. Como explicar o projeto
## 32. Perguntas básicas
## 33. Perguntas intermediárias
## 34. Perguntas avançadas
## 35. Perguntas de arquitetura
## 36. Perguntas de segurança
## 37. Perguntas de performance
## 38. Perguntas de banco de dados
## 39. Perguntas de código
## 40. Perguntas de "por quê?"
## 41. Perguntas de fluxo
## 42. Perguntas hipotéticas
## 43. Perguntas de escalabilidade
## 44. Troubleshooting
## 45. Troubleshooting avançado
## 46. Simulação completa de entrevista
## 47. Perguntas que podem pegar de surpresa
## 48. O que eu faria diferente
## 49. Matriz de domínio
## 50. Checklist final
```

A estrutura pode ser expandida conforme o projeto.

---

# 59. OBJETIVO FINAL

O documento não deve simplesmente responder:

> "O que existe neste projeto?"

Ele deve permitir responder:

> "Como este projeto funciona?"

> "Por que funciona dessa maneira?"

> "Por que essa tecnologia foi utilizada?"

> "O que acontece internamente quando o usuário executa determinada ação?"

> "Onde isso está implementado?"

> "Quais são os trade-offs?"

> "Quais são os problemas atuais?"

> "Como eu investigaria esse problema?"

> "Como eu escalaria essa aplicação?"

> "Como eu protegeria essa aplicação?"

> "Como eu melhoraria essa arquitetura?"

> "O que aconteceria se determinada parte falhasse?"

> "Por que você tomou essa decisão?"

> "Se tivesse que construir novamente, o que faria diferente?"

E, principalmente:

> **"Você não implementou isso ainda. Como você faria?"**

O candidato deve conseguir responder essa última categoria sem fingir que a solução já existe.

A resposta deve demonstrar:

```text
Entendimento da implementação atual
+
Identificação da limitação
+
Conhecimento conceitual
+
Raciocínio arquitetural
+
Escolha consciente de trade-offs
```

---

# 60. INSTRUÇÃO DE EXECUÇÃO

Agora:

1. Inspecione a raiz do projeto.
2. Identifique sua estrutura.
3. Leia a documentação existente.
4. Analise as configurações.
5. Analise as dependências.
6. Percorra os módulos.
7. Rastreie os principais fluxos.
8. Analise frontend e backend.
9. Analise banco e persistência.
10. Analise autenticação e segurança.
11. Analise scripts e inicialização.
12. Analise variáveis de ambiente.
13. Analise integrações.
14. Analise testes.
15. Analise produção/deploy.
16. Faça a segunda passada de verificação.
17. Construa a Parte I.
18. Construa a Parte II.
19. Crie perguntas hipotéticas de nível superior à implementação quando forem tecnicamente relevantes.
20. Para cada pergunta hipotética, separe implementação atual de evolução possível.
21. Faça a verificação de honestidade técnica.
22. Faça a verificação de consistência.
23. Gere o arquivo Markdown final.

**Não peça confirmação entre as etapas.**

Execute a análise completa de forma autônoma.

Se o projeto for grande, não simplifique a análise por causa do tamanho.

Se forem necessárias dezenas ou centenas de páginas para documentar corretamente o projeto, produza-as.

**Não reduza a profundidade para economizar espaço.**

A prioridade é:

```text
PRECISÃO
↓
COMPREENSÃO
↓
PROFUNDIDADE
↓
CAPACIDADE DE EXPLICAÇÃO
↓
RACIOCÍNIO ARQUITETURAL
```

Nunca substitua precisão por sofisticação artificial.

O resultado final deve transformar o código-fonte em **conhecimento técnico explicável**, permitindo que o desenvolvedor:

1. Entenda o que construiu.
2. Explique o que construiu.
3. Identifique as limitações do que construiu.
4. Justifique tecnicamente o que foi feito.
5. Discuta como evoluiria o sistema.
6. Responda perguntas de diferentes níveis de senioridade.
7. Enfrente cenários hipotéticos sem inventar funcionalidades.
8. Demonstre maturidade técnica mesmo quando a implementação atual ainda é simples.

O objetivo final é que o desenvolvedor consiga **fechar o código, entrar em uma entrevista e reconstruir mentalmente o funcionamento do sistema enquanto explica sua implementação atual, suas limitações e as possíveis evoluções arquiteturais.**