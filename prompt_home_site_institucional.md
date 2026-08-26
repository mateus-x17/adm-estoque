# Prompt Master — Criação e Redesign de Home Page / Site Institucional

## 1. OBJETIVO

Você está trabalhando em um projeto **já existente, funcional e estruturado**.

Sua tarefa é analisar profundamente esse projeto e, a partir dessa análise, **criar, reconstruir ou aprimorar a Home Page existente**. Quando o escopo real do produto justificar, você também deverá criar um **conjunto de páginas institucionais públicas**, integrando essas páginas ao roteamento existente.

O resultado deve apresentar o sistema como um **produto digital real, maduro e comercialmente apresentável**, com uma identidade visual consistente e uma experiência de alto nível.

Existe uma ou mais **imagens de inspiração visual fornecidas junto a este prompt**. Essas imagens devem ser utilizadas como **referência de direção visual**, composição, hierarquia, ritmo, estética, tratamento de mídia, animações e linguagem de interface.

### REGRA FUNDAMENTAL

A imagem de inspiração é **referência visual, não especificação funcional**.

Não copie literalmente:
- textos;
- marcas;
- logos;
- identidade de outra empresa;
- conteúdo;
- nomes;
- estrutura quando ela não fizer sentido para o produto;
- componentes que não tenham função no contexto deste projeto.

Extraia da referência seus **princípios visuais** e adapte-os ao produto real encontrado no código e no README.

O produto existente é a fonte de verdade para:
- funcionalidades;
- módulos;
- fluxos;
- recursos;
- tecnologias relevantes;
- regras de apresentação;
- conteúdo;
- nomenclaturas;
- diferenciais;
- proposta de valor.

---

# 2. PRINCÍPIO CENTRAL

Antes de escrever ou alterar qualquer código, você deve **entender o projeto**.

Não comece pela imagem.

Primeiro descubra:

> "O que este produto realmente é, o que ele faz, para quem serve, quais problemas resolve, quais são suas funcionalidades e como está estruturado?"

Depois responda:

> "Como apresentar esse produto da forma mais clara, moderna, elegante e visualmente convincente possível usando a imagem fornecida como direção estética?"

A ordem obrigatória de raciocínio é:

```text
PROJETO EXISTENTE
        ↓
README
        ↓
ESTRUTURA DE PASTAS
        ↓
ROTAS
        ↓
PÁGINAS
        ↓
COMPONENTES
        ↓
FUNCIONALIDADES
        ↓
FLUXOS
        ↓
IDENTIDADE VISUAL ATUAL
        ↓
IMAGEM DE INSPIRAÇÃO
        ↓
ANÁLISE COMPARATIVA
        ↓
DEFINIÇÃO DO ESCOPO
        ↓
ARQUITETURA DA NOVA EXPERIÊNCIA
        ↓
IMPLEMENTAÇÃO
        ↓
VALIDAÇÃO
```

---

# 3. LEITURA OBRIGATÓRIA DO PROJETO

Antes de implementar qualquer alteração:

## 3.1 Leia o README

Localize o README existente na raiz do projeto.

Leia-o integralmente.

Não trate o README apenas como documentação técnica.

Extraia dele o máximo possível de informações sobre:

- nome do produto;
- propósito;
- problema resolvido;
- público-alvo;
- proposta de valor;
- funcionalidades;
- módulos;
- fluxos;
- recursos;
- tecnologias;
- integrações;
- autenticação;
- permissões;
- dashboards;
- relatórios;
- métricas;
- automações;
- notificações;
- entidades importantes;
- conceitos próprios do domínio;
- diferenciais;
- arquitetura;
- exemplos de uso;
- screenshots;
- instruções de funcionamento;
- informações que possam ser transformadas em conteúdo da Home;
- qualquer outra informação relevante.

Não invente funcionalidades que não estejam sustentadas pelo README ou pelo código.

Se o README possuir informações que não aparecem claramente na interface atual, considere essas informações ao planejar a apresentação institucional.

---

# 4. DESTRINCHAMENTO DO README

O README deve ser interpretado como uma fonte de conteúdo.

Converta mentalmente suas informações em categorias como:

```text
PRODUTO
├── O que é?
├── Qual problema resolve?
├── Para quem?
├── Qual proposta de valor?
└── Quais diferenciais?

FUNCIONALIDADES
├── Funcionalidade A
├── Funcionalidade B
├── Funcionalidade C
└── ...

EXPERIÊNCIA
├── Dashboard
├── Fluxos
├── Gerenciamento
├── Relatórios
├── Notificações
└── ...

TECNOLOGIA
├── Frontend
├── Backend
├── Banco
├── Infraestrutura
└── Integrações

DOMÍNIO
├── Entidades
├── Regras
├── Processos
└── Conceitos

ARQUITETURA
├── Aplicação
├── Serviços
├── APIs
├── Módulos
└── Integrações
```

Utilize esse conhecimento para decidir quais informações merecem aparecer na Home e quais devem permanecer dentro da aplicação.

---

# 5. MAPEAMENTO COMPLETO DO CÓDIGO

Depois do README, percorra a estrutura real do projeto.

Analise, quando existirem:

- `app/`;
- `pages/`;
- `src/`;
- `routes/`;
- `components/`;
- `layouts/`;
- `features/`;
- `modules/`;
- `services/`;
- `hooks/`;
- `lib/`;
- `utils/`;
- `public/`;
- arquivos de configuração;
- arquivos de estilos;
- componentes compartilhados;
- sistemas de design;
- temas;
- arquivos de autenticação;
- arquivos relacionados ao roteamento.

Não assuma a estrutura do projeto.

Descubra a estrutura real.

---

# 6. MAPEAMENTO DAS ROTAS

Faça um inventário das rotas existentes.

Identifique:

- rotas públicas;
- rotas privadas;
- rotas autenticadas;
- rotas de dashboard;
- rotas administrativas;
- rotas de configuração;
- rotas de funcionalidades;
- layouts associados;
- middleware;
- guards;
- grupos de rotas;
- parâmetros dinâmicos;
- rotas relacionadas entre si.

Antes de criar novas páginas, entenda como o roteamento atual funciona.

## REGRA

Não quebre rotas existentes.

Não renomeie rotas funcionais sem necessidade.

Não mova páginas internas sem uma razão arquitetural real.

O site institucional deve coexistir com o sistema existente.

---

# 7. DIFERENCIAR SITE INSTITUCIONAL E APLICAÇÃO

Se o projeto possuir uma aplicação autenticada, mantenha uma separação clara entre:

```text
SITE PÚBLICO
/
├── Home
├── Funcionalidades
├── Soluções
├── Sobre
└── Contato
```

e:

```text
APLICAÇÃO
/dashboard
/products
/orders
/settings
...
```

Essas páginas não precisam existir exatamente dessa forma.

A estrutura deve ser definida pelo projeto.

O princípio é:

> O visitante deve conseguir conhecer o produto antes de entrar na aplicação.

E o usuário autenticado deve continuar tendo acesso ao sistema normalmente.

---

# 8. DECISÃO AUTOMÁTICA DE ESCOPO

Você NÃO deve criar páginas adicionais apenas para aumentar a quantidade de páginas.

Primeiro determine se elas são realmente justificadas.

## Cenário A — Apenas Home

Utilize apenas uma Home quando:

- o produto for relativamente simples;
- o conteúdo puder ser explicado de maneira completa em uma única página;
- não existirem grupos de funcionalidades suficientemente distintos;
- páginas adicionais produziriam conteúdo artificial;
- o README não possuir material suficiente para sustentar páginas independentes.

Nesse caso, faça uma Home rica e completa.

---

## Cenário B — Home + páginas institucionais

Crie páginas adicionais quando:

- existirem módulos claramente distintos;
- existirem funcionalidades suficientemente relevantes para receber uma página própria;
- houver conteúdo suficiente no README;
- determinadas informações ficarem excessivamente longas em uma única Home;
- houver uma separação natural entre diferentes soluções;
- uma página adicional melhorar significativamente a compreensão do produto.

Exemplos possíveis:

```text
/
 /features
 /solutions
 /product
 /about
 /contact
```

Mas esses nomes são apenas exemplos.

**Você deve decidir a estrutura com base no produto real.**

---

# 9. CRITÉRIO PARA CRIAÇÃO DE NOVAS PÁGINAS

Para cada página adicional que considerar criar, responda internamente:

1. Qual informação exclusiva essa página apresenta?
2. Essa informação existe no README ou no código?
3. Existe conteúdo suficiente?
4. Essa informação ficaria ruim dentro da Home?
5. A página melhora a compreensão do produto?
6. Ela possui uma finalidade clara para o visitante?
7. Ela pode ser construída sem inventar funcionalidades?

Se a resposta for negativa para a maioria dessas perguntas:

**não crie a página.**

Menos páginas bem construídas são melhores que um site institucional artificialmente inflado.

---

# 10. ANÁLISE DA IMAGEM DE INSPIRAÇÃO

Somente depois de compreender o projeto, analise profundamente a imagem ou imagens fornecidas.

Observe:

## Composição

- posição dos elementos;
- proporções;
- densidade visual;
- espaços negativos;
- alinhamento;
- hierarquia;
- composição assimétrica ou simétrica;
- elementos sobrepostos;
- cards;
- blocos;
- grids.

## Tipografia

Observe:

- escala dos títulos;
- peso;
- contraste;
- comprimento das linhas;
- hierarquia;
- relação entre títulos, subtítulos e textos;
- utilização de textos grandes;
- tratamento de palavras destacadas.

Não copie necessariamente a fonte.

Adapte a linguagem tipográfica à identidade do projeto.

## Cores

Observe:

- cor dominante;
- cor de fundo;
- cores de destaque;
- contraste;
- gradientes;
- áreas claras e escuras;
- utilização de transparência.

Preserve a identidade do projeto sempre que ela já estiver definida.

## Espaçamento

Observe:

- padding;
- margin;
- distância entre seções;
- ritmo vertical;
- densidade dos componentes.

## Elementos visuais

Identifique:

- mockups;
- screenshots;
- vídeos;
- imagens;
- cards;
- gráficos;
- elementos flutuantes;
- elementos decorativos;
- linhas;
- grids;
- blur;
- glassmorphism;
- sombras;
- bordas;
- máscaras;
- formas geométricas.

## Movimento

Se a referência sugerir movimento, interprete:

- entrada de elementos;
- scroll reveal;
- parallax;
- deslocamentos;
- transformações;
- hover;
- expansão;
- transições;
- elementos flutuantes.

---

# 11. NÃO COPIAR A REFERÊNCIA

A referência deve responder:

> "Como este produto poderia ser apresentado visualmente?"

Não:

> "Como reproduzir exatamente este site?"

A implementação deve possuir identidade própria.

Se a referência tiver:

```text
Hero
↓
Cards flutuantes
↓
Dashboard
↓
Feature sections
↓
CTA
```

isso não significa que a Home deste projeto precise possuir exatamente essas seções.

A estrutura deve nascer do produto.

---

# 12. CONSISTÊNCIA VISUAL COM O PROJETO

A nova Home deve parecer parte natural do mesmo produto.

Analise a interface existente e identifique:

- cores;
- tokens;
- variáveis CSS;
- Tailwind configuration;
- tema;
- dark mode;
- light mode;
- fontes;
- border radius;
- sombras;
- botões;
- inputs;
- cards;
- iconografia;
- estilos de gráficos;
- componentes reutilizáveis;
- padrões de espaçamento.

A nova experiência deve reutilizar esses padrões quando fizer sentido.

## REGRA DE CONSISTÊNCIA

Não crie uma Home visualmente desconectada da aplicação.

O visitante deve conseguir pensar:

> "Esta é a apresentação pública deste mesmo produto."

e não:

> "Este é outro site completamente diferente."

---

# 13. HOME COMO EXPERIÊNCIA DE PRODUTO

A Home deve explicar o produto.

Ela não deve ser apenas uma composição estética.

A estrutura deve responder progressivamente:

```text
O que é?
↓
Por que existe?
↓
O que resolve?
↓
Como funciona?
↓
Quais recursos possui?
↓
Como é a experiência?
↓
Quais são os principais diferenciais?
↓
Como começar?
```

Não é obrigatório utilizar essas perguntas como seções literais.

Elas representam a lógica narrativa.

---

# 14. USO DE FUNCIONALIDADES REAIS

As funcionalidades encontradas no projeto devem ser utilizadas como matéria-prima visual e textual.

Exemplos:

Se o projeto possuir:

- dashboard;
- analytics;
- gerenciamento de usuários;
- pedidos;
- estoque;
- automações;
- notificações;
- relatórios;

não diga simplesmente:

> "Tenha uma plataforma poderosa."

Mostre concretamente o que a plataforma faz.

Utilize:

- screenshots reais;
- recortes da interface;
- mockups;
- cards;
- gráficos;
- números;
- animações;
- elementos da própria aplicação.

A Home deve fazer o visitante **entender o produto visualmente**.

---

# 15. USO DE VÍDEOS

Quando houver possibilidade de utilizar um vídeo demonstrando o sistema, considere-o como elemento de composição.

O vídeo NÃO deve ser simplesmente colocado sozinho em uma seção.

Prefira composições como:

```text
┌────────────────────────────────────┐
│ título                             │
│ descrição          ┌────────────┐  │
│                    │            │  │
│ botão              │   VÍDEO    │  │
│                    │            │  │
│                    └────────────┘  │
└────────────────────────────────────┘
```

Ou:

- vídeo dentro de mockup;
- vídeo atrás de conteúdo;
- vídeo parcialmente sobreposto;
- vídeo em card;
- vídeo com métricas flutuantes;
- vídeo combinado com screenshots;
- vídeo como background controlado;
- vídeo integrado à narrativa da seção.

O vídeo deve reforçar a compreensão do produto.

Se nenhum vídeo estiver disponível, não invente um arquivo.

Crie a estrutura de mídia de forma que um vídeo real possa ser inserido posteriormente.

---

# 16. ANIMAÇÕES

A Home deve possuir movimento suficiente para transmitir uma sensação premium, mas sem transformar a interface em uma demonstração técnica de animações.

Utilize animações quando elas tiverem propósito.

Exemplos:

- fade;
- slide;
- scale;
- reveal;
- stagger;
- parallax moderado;
- hover;
- cards flutuantes;
- entrada de screenshots;
- transições entre estados;
- números animados quando fizer sentido;
- elementos que respondem ao scroll.

## EVITAR

Não utilize:

- animações excessivas;
- elementos pulando sem propósito;
- efeitos chamativos incompatíveis com o produto;
- transições lentas;
- excesso de parallax;
- efeitos que prejudicam performance;
- animações que dificultam leitura.

A sensação desejada é:

**sofisticada, dinâmica e intencional.**

Não:

**"olhe quantas animações eu consigo colocar".**

---

# 17. RESPONSIVIDADE

A experiência deve funcionar em:

- desktop;
- notebook;
- tablet;
- mobile.

Não faça apenas uma redução proporcional do desktop.

Reorganize a composição quando necessário.

Verifique:

- hero;
- navegação;
- grids;
- cards;
- vídeos;
- screenshots;
- tipografia;
- botões;
- espaçamentos;
- animações;
- elementos sobrepostos.

Elementos que funcionam lado a lado no desktop podem precisar ser empilhados no mobile.

---

# 18. ACESSIBILIDADE

Preserve boas práticas de acessibilidade:

- contraste adequado;
- textos legíveis;
- navegação por teclado;
- `alt` em imagens;
- semântica HTML;
- foco visível;
- botões identificáveis;
- links compreensíveis;
- respeito a `prefers-reduced-motion` quando aplicável.

As animações não devem ser uma barreira de acesso.

---

# 19. SEO E METADADOS

Como o objetivo é apresentar o produto publicamente, configure quando o framework permitir:

- title;
- description;
- Open Graph;
- favicon;
- metadata;
- headings semânticos;
- URLs compreensíveis.

O conteúdo deve refletir o produto real.

Não invente palavras-chave artificiais.

---

# 20. CONTEÚDO E COPY

O texto da Home deve ser derivado do:

1. README;
2. funcionalidades reais;
3. estrutura do projeto;
4. nomenclaturas reais;
5. comportamento da aplicação.

Não utilize frases genéricas de SaaS que poderiam servir para qualquer produto.

Evite textos como:

> "A solução definitiva para transformar seu negócio."

Prefira explicar concretamente o que o produto faz.

## REGRA IMPORTANTE

Não utilize expressões que apresentem o produto como:

- projeto de portfólio;
- projeto pessoal;
- exercício;
- projeto de estudo;
- demonstração acadêmica;
- projeto para currículo;
- projeto fictício;
- case de portfólio.

A comunicação deve apresentar o sistema como um **produto real**.

Mesmo que o sistema posteriormente seja exibido em um site de portfólio, isso não deve fazer parte da comunicação do produto.

---

# 21. NÃO INVENTAR

Nunca invente:

- clientes;
- números;
- usuários;
- faturamento;
- depoimentos;
- empresas;
- certificações;
- integrações;
- funcionalidades;
- estatísticas;
- prêmios;
- resultados;
- garantias;
- informações comerciais.

Se uma informação não existir:

- omita;
- ou construa a seção sem essa informação.

Não preencha lacunas com ficção.

---

# 22. PRIORIZAÇÃO DO CONTEÚDO

Nem tudo que existe no código precisa aparecer na Home.

Classifique as informações:

### Nível 1 — Essenciais

Informações que explicam o produto imediatamente.

### Nível 2 — Relevantes

Funcionalidades importantes para demonstrar valor.

### Nível 3 — Complementares

Informações que podem enriquecer a experiência.

### Nível 4 — Internas

Detalhes técnicos ou operacionais que não precisam aparecer na apresentação pública.

A Home deve priorizar Níveis 1 e 2.

---

# 23. ARQUITETURA VISUAL DA HOME

Antes de implementar, defina mentalmente uma estrutura semelhante a:

```text
HEADER
↓
HERO
↓
PROVA VISUAL DO PRODUTO
↓
PROBLEMA / PROPOSTA DE VALOR
↓
PRINCIPAIS FUNCIONALIDADES
↓
DEMONSTRAÇÃO DO SISTEMA
↓
FUNCIONALIDADES DETALHADAS
↓
DIFERENCIAIS
↓
OUTRAS INFORMAÇÕES RELEVANTES
↓
CTA
↓
FOOTER
```

Isso é apenas uma referência.

A estrutura final deve ser adaptada ao projeto e à imagem.

Não force seções que não possuam conteúdo.

---

# 24. NAVEGAÇÃO

Caso exista apenas uma Home, utilize navegação por âncoras quando fizer sentido.

Caso existam páginas institucionais, construa uma navegação coerente.

Exemplo:

```text
Logo
Produto
Funcionalidades
Soluções
Sobre
Contato
              Entrar
              Começar
```

Mas utilize somente itens que tenham conteúdo real.

Não crie links mortos.

---

# 25. CTA

Os CTAs devem refletir o comportamento real do sistema.

Exemplos possíveis:

- Entrar;
- Acessar plataforma;
- Conhecer funcionalidades;
- Explorar produto;
- Começar agora.

Não crie fluxo de cadastro se o projeto não possuir cadastro.

Não crie botão "Teste grátis" se isso não existir.

---

# 26. PRESERVAÇÃO DO SISTEMA EXISTENTE

Esta é uma regra crítica.

A implementação da Home/site institucional NÃO deve quebrar:

- autenticação;
- autorização;
- APIs;
- banco;
- serviços;
- páginas internas;
- dashboards;
- componentes funcionais;
- formulários;
- integrações;
- estado global;
- gerenciamento de sessão;
- rotas existentes.

Antes de modificar qualquer arquivo compartilhado, entenda onde ele é utilizado.

Prefira:

- reutilizar;
- estender;
- compor;
- criar novos componentes;
- criar novos layouts;

em vez de modificar comportamentos existentes sem necessidade.

---

# 27. REUTILIZAÇÃO DE COMPONENTES

Antes de criar um novo componente visual, verifique se já existe um componente reutilizável.

Procure por:

- Button;
- Card;
- Container;
- Modal;
- Header;
- Footer;
- Typography;
- Badge;
- Avatar;
- Icons;
- Layout;
- Theme;
- componentes de UI.

Quando fizer sentido, reutilize-os.

Se o componente existente for inadequado para a nova apresentação, crie uma variação sem quebrar os usos existentes.

---

# 28. IMAGENS E ASSETS

Utilize os assets reais do projeto quando apropriado.

Verifique:

- `public`;
- imagens;
- SVGs;
- logos;
- ícones;
- screenshots;
- vídeos;
- fontes.

Não substitua automaticamente assets existentes.

Se a imagem de inspiração sugerir uma composição visual com imagem, tente utilizar:

1. screenshot real do produto;
2. asset real;
3. vídeo real;
4. mockup da própria interface;
5. placeholder somente quando absolutamente necessário.

---

# 29. DESIGN SYSTEM

Se o projeto já possuir um Design System, respeite-o.

Caso não possua, derive um pequeno sistema visual a partir da interface existente.

Defina consistentemente:

- escala tipográfica;
- cores;
- espaçamentos;
- radius;
- sombras;
- bordas;
- estados;
- botões;
- containers;
- breakpoints.

Não crie valores aleatórios para cada seção.

A página deve parecer uma única experiência.

---

# 30. DARK MODE E LIGHT MODE

Se o projeto já possuir suporte a dark/light mode:

- preserve-o;
- adapte a Home aos dois temas;
- não crie um terceiro sistema visual;
- verifique contraste;
- verifique imagens;
- verifique vídeos;
- verifique gradientes;
- verifique elementos decorativos.

A referência visual pode possuir apenas um tema.

Nesse caso, extraia sua estética sem obrigatoriamente abandonar o sistema de temas existente.

---

# 31. ESTRUTURA DE IMPLEMENTAÇÃO

Antes de codificar, determine:

```text
NOVAS ROTAS
NOVOS COMPONENTES
NOVOS LAYOUTS
NOVOS ASSETS
NOVOS ESTILOS
NOVOS METADADOS
```

Evite alterações desnecessárias.

A implementação deve ser incremental.

---

# 32. SE O PROJETO JÁ POSSUI UMA HOME

Não substitua automaticamente.

Primeiro analise:

- o que já existe;
- o que funciona;
- o que pode ser preservado;
- o que está desalinhado com a nova direção;
- quais componentes podem ser reutilizados;
- quais partes precisam ser reconstruídas.

A decisão pode ser:

```text
HOME ATUAL
   ↓
pequenos ajustes
```

ou:

```text
HOME ATUAL
   ↓
refatoração visual profunda
```

ou:

```text
HOME ATUAL
   ↓
reconstrução
```

Escolha com base na qualidade e na necessidade.

---

# 33. QUALIDADE VISUAL

O resultado deve transmitir:

- produto real;
- maturidade;
- confiança;
- clareza;
- sofisticação;
- consistência;
- precisão;
- boa hierarquia;
- excelente composição.

Evite a estética genérica de:

> "Landing page criada automaticamente por IA."

Não utilize indiscriminadamente:

- gradientes exagerados;
- glassmorphism em tudo;
- cards em excesso;
- blobs decorativos;
- textos genéricos;
- sombras exageradas;
- elementos aleatórios;
- ícones sem função;
- animações excessivas.

Cada elemento precisa possuir uma razão visual ou funcional.

---

# 34. REGRA DE AUTENTICIDADE

A página deve parecer que foi construída especificamente para **este produto**.

Para isso:

- utilize as funcionalidades reais;
- utilize a terminologia real;
- utilize screenshots reais;
- utilize dados visuais reais quando disponíveis;
- reflita a arquitetura do produto;
- reflita seus módulos;
- reflita sua proposta;
- utilize os padrões visuais da aplicação.

Quanto mais a Home poderia ser aplicada a qualquer outro SaaS, pior o resultado.

---

# 35. PROCESSO OBRIGATÓRIO DE IMPLEMENTAÇÃO

Siga esta sequência:

## FASE 1 — Descoberta

- Leia o README.
- Mapeie as pastas.
- Mapeie as rotas.
- Mapeie as páginas.
- Mapeie os componentes.
- Mapeie as funcionalidades.
- Identifique a arquitetura.
- Identifique o Design System.

## FASE 2 — Produto

Determine:

- o que o produto é;
- o que resolve;
- para quem;
- principais funcionalidades;
- principais diferenciais;
- principais fluxos.

## FASE 3 — Referência

Analise:

- composição;
- tipografia;
- cores;
- espaçamento;
- movimento;
- mídia;
- hierarquia;
- estética.

## FASE 4 — Estratégia

Decida:

- apenas Home;
- Home + páginas institucionais;
- rotas necessárias;
- conteúdo de cada página;
- componentes necessários;
- mídia;
- animações.

## FASE 5 — Planejamento

Estruture:

```text
rota
→ objetivo
→ conteúdo
→ componentes
→ mídia
→ animações
→ CTA
```

## FASE 6 — Implementação

Implemente sem quebrar o sistema existente.

## FASE 7 — Validação

Verifique:

- funcionamento;
- rotas;
- responsividade;
- acessibilidade;
- consistência visual;
- animações;
- performance;
- conteúdo;
- metadata.

---

# 36. VALIDAÇÃO FINAL

Antes de considerar o trabalho concluído, faça uma revisão completa.

## Produto

- A Home explica claramente o produto?
- O visitante entende o que o sistema faz?
- As funcionalidades apresentadas realmente existem?
- O conteúdo foi baseado no README e no código?

## Design

- A referência visual foi incorporada sem ser copiada?
- A página mantém identidade própria?
- Existe consistência com a aplicação?
- Tipografia, cores e espaçamentos são coerentes?

## UX

- A navegação é clara?
- Os CTAs fazem sentido?
- A hierarquia visual funciona?
- O conteúdo está organizado?

## Animações

- As animações são úteis?
- Não existem efeitos excessivos?
- A experiência continua boa em dispositivos menores?

## Mídia

- Screenshots reais foram aproveitados?
- Vídeo foi utilizado quando apropriado?
- A mídia faz parte da composição?

## Arquitetura

- As rotas existentes continuam funcionando?
- As novas rotas estão corretamente integradas?
- Nenhuma funcionalidade foi quebrada?
- Componentes existentes foram preservados quando possível?

## Conteúdo

- Não existem funcionalidades inventadas?
- Não existem números inventados?
- Não existem clientes fictícios?
- Não existem depoimentos fictícios?
- Não há linguagem de "projeto de portfólio"?

---

# 37. RESULTADO ESPERADO

O resultado final deve ser uma apresentação pública do sistema que:

1. explique claramente o produto;
2. apresente suas funcionalidades reais;
3. utilize o README como fonte de conteúdo;
4. utilize o código como fonte de verdade funcional;
5. utilize a imagem como direção visual;
6. mantenha consistência com a aplicação;
7. possua animações sofisticadas;
8. utilize screenshots e/ou vídeo quando disponíveis;
9. seja responsiva;
10. possua boa acessibilidade;
11. possua boa estrutura de SEO;
12. preserve todas as funcionalidades existentes;
13. crie novas páginas somente quando justificadas;
14. mantenha uma arquitetura de rotas limpa;
15. pareça um produto real e pronto para ser apresentado ao público.

---

# 38. REGRA FINAL DE DECISÃO

Quando houver dúvida entre:

> "Adicionar mais coisas"

e

> "Manter mais simples"

escolha a alternativa que produzir a **melhor experiência para compreender o produto**.

Não aumente o escopo apenas para tornar o site visualmente maior.

Não reduza o escopo quando houver conteúdo real suficiente para construir uma experiência melhor.

O objetivo não é criar muitas páginas.

O objetivo é criar a **melhor apresentação possível para o produto que realmente existe**.

---

# 39. INSTRUÇÃO FINAL PARA A IA

Agora execute o processo completo.

Não comece implementando imediatamente.

Primeiro:

1. encontre e leia o README;
2. percorra a estrutura do projeto;
3. mapeie as rotas;
4. analise as páginas existentes;
5. identifique as funcionalidades;
6. identifique o Design System;
7. analise os assets;
8. analise a imagem de inspiração fornecida;
9. determine o escopo ideal;
10. defina a arquitetura da experiência;
11. implemente;
12. teste;
13. revise visualmente;
14. corrija inconsistências;
15. valide que o sistema existente continua funcionando.

Se informações suficientes estiverem disponíveis no README e no código, use-as.

Não peça ao usuário informações que já possam ser descobertas analisando o projeto.

Se uma decisão puder ser tomada com segurança a partir do código, README e referência visual, tome a decisão.

Se não houver informação suficiente para inventar algo com segurança, **não invente**.

A implementação final deve parecer uma evolução natural do produto existente, com uma apresentação pública sofisticada, coerente e específica para esse sistema.
