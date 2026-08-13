# PROMPT MASTER --- Reformulação Visual Completa de Projeto (UI/UX)

> **Objetivo:** reformular **inteiramente o design** de um projeto
> existente utilizando **uma imagem de inspiração** como referência
> visual, **sem alterar qualquer funcionalidade, regra de negócio,
> lógica, componentes funcionais, gráficos, filtros, APIs, estados,
> rotas ou comportamento da aplicação**.

## REGRA ABSOLUTA

Você **não está autorizado** a modificar a arquitetura funcional do
projeto.

A reformulação deve ser **100% visual**.

### O que DEVE permanecer exatamente igual

-   Todas as funcionalidades.
-   Lógica de negócio.
-   Estrutura de dados.
-   APIs e chamadas HTTP.
-   Hooks e gerenciamento de estado.
-   Rotas.
-   Autenticação.
-   CRUDs.
-   Dashboards.
-   Gráficos.
-   Filtros dos gráficos.
-   Paginação.
-   Busca.
-   Ordenação.
-   Modais e formulários.
-   Validações.
-   Responsividade funcional.
-   Eventos e interações existentes.

### O que PODE ser alterado

-   Layout.
-   Estilo visual.
-   Cores.
-   Tipografia.
-   Espaçamentos.
-   Bordas.
-   Ícones.
-   Componentes visuais.
-   Sombras.
-   Glassmorphism.
-   Gradientes.
-   Animações sutis.
-   Organização visual dos elementos (desde que a funcionalidade
    permaneça idêntica).

## REFERÊNCIA VISUAL

A imagem fornecida representa uma interface **SaaS Premium**, com
identidade **Dark + Glassmorphism + FinTech Futurista**.

Ela deve servir como inspiração para o **Design System completo**, e
**não como um layout para ser copiado literalmente**.

O objetivo é reproduzir a linguagem visual, materiais, iluminação,
hierarquia e acabamento.

------------------------------------------------------------------------

# 1. DIREÇÃO DE ARTE

**Estilo predominante**

  Característica           Intensidade
  ---------------------- -------------
  Dark Theme                     10/10
  Glassmorphism                   9/10
  Futurista                       9/10
  Premium SaaS                   10/10
  FinTech                        10/10
  Minimalismo Elegante            8/10

**Sensação visual desejada**

Uma aplicação premium semelhante a produtos como Linear, Stripe
Dashboard, Raycast e plataformas financeiras modernas: superfícies
escuras, vidro fosco, iluminação magenta/lilás e profundidade criada por
transparência e brilho suave.

------------------------------------------------------------------------

# 2. ESTRUTURA DO LAYOUT

A aplicação deve utilizar um **container principal centralizado**,
flutuando sobre um fundo escuro.

## Grid

-   Sidebar fixa à esquerda
-   Conteúdo principal à direita
-   Grid baseado em 12 colunas
-   Espaçamento consistente
-   Hierarquia bem definida através de cards

### Proporções

``` text
┌──────────────────────────────────────────────┐
│                                              │
│  Sidebar   │                                │
│            │          Header                │
│            │─────────────────────────────── │
│            │  Cards / Métricas             │
│            │─────────────────────────────── │
│            │  Tabelas / Watchlist          │
│            │─────────────────────────────── │
│            │      Gráfico Principal        │
│            │                              │
└──────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. BACKGROUND

## Camada base

``` css
background: #07070B;
```

## Gradientes

Utilizar gradientes radiais extremamente suaves.

``` css
radial-gradient(circle at top,
rgba(180,120,255,.10),
transparent 45%);

radial-gradient(circle at right,
rgba(255,90,180,.08),
transparent 35%);
```

## Noise

Adicionar uma textura muito discreta (2% de opacidade) apenas para
evitar superfícies completamente lisas.

------------------------------------------------------------------------

# 4. CONTAINER PRINCIPAL

Características obrigatórias:

``` css
border-radius: 28px;
padding: 24px;
backdrop-filter: blur(22px);

background:
rgba(18,18,24,.82);

border:
1px solid rgba(255,255,255,.08);
```

O painel deve parecer um vidro fumê flutuando sobre o fundo.

------------------------------------------------------------------------

# 5. SIDEBAR

## Estrutura

Topo:

-   Logo
-   Nome da aplicação

Centro:

-   Navegação vertical
-   Ícone + texto

Rodapé:

-   Configurações
-   Suporte

## Item ativo

Formato cápsula.

``` css
background:
linear-gradient(
135deg,
#F1A7FF,
#B86EFF,
#7C46FF
);

border-radius: 14px;
```

## Item inativo

``` css
color: #A3A3AE;
background: transparent;
```

Hover extremamente sutil.

------------------------------------------------------------------------

# 6. HEADER

Organização horizontal.

Esquerda:

-   Saudação / título
-   Subtítulo

Direita:

-   Botões circulares
-   Avatar
-   Campo de pesquisa / IA em formato pill

Os elementos devem permanecer funcionais exatamente como já são.

------------------------------------------------------------------------

# 7. DESIGN SYSTEM DOS CARDS

Todos os cards devem compartilhar o mesmo padrão visual.

``` css
background:
rgba(12,12,18,.92);

border:
1px solid rgba(255,255,255,.06);

border-radius: 22px;

backdrop-filter:
blur(18px);
```

## Glow

``` css
box-shadow:
0 0 28px rgba(214,132,255,.10),
inset 0 1px 0 rgba(255,255,255,.04);
```

Evitar sombras pretas pesadas.

------------------------------------------------------------------------

# 8. BORDAS

  Elemento       Radius
  ------------ --------
  Botões          999px
  Inputs          999px
  Chips           999px
  Cards            22px
  Container        28px
  Mini Cards       18px

Toda a interface deve utilizar cantos amplamente arredondados.

------------------------------------------------------------------------

# 9. BOTÕES

## Primário

``` css
background:
linear-gradient(
135deg,
#F3A8FF,
#D98CFF,
#C46CFF
);

color: white;

border-radius: 999px;
```

Adicionar glow suave.

## Secundário

``` css
background: rgba(255,255,255,.03);

border:
1px solid rgba(255,255,255,.08);
```

------------------------------------------------------------------------

# 10. CHIPS E TABS

Exemplo:

-   Mercado
-   Carteira
-   Ferramentas

Formato:

``` css
height: 36px;
padding: 0 18px;

border-radius: 999px;
```

Estado ativo recebe gradiente lilás.

------------------------------------------------------------------------

# 11. TIPOGRAFIA

Fontes recomendadas:

-   Inter
-   Manrope
-   Plus Jakarta Sans

## Hierarquia

  Uso             Tamanho
  ------------ ----------
  H1             30--34px
  H2                 22px
  Card Value     20--24px
  Texto              14px
  Auxiliar           12px

Pesos predominantes:

-   400
-   500
-   600

------------------------------------------------------------------------

# 12. PALETA

## Base

  Cor          Hex
  ------------ -------------------------
  Background   `#07070B`
  Surface      `#101018`
  Card         `#14141C`
  Borda        `rgba(255,255,255,.08)`
  Texto        `#F5F5F7`
  Secundário   `#A3A3AE`

## Accent

  Uso     Hex
  ------- -----------
  Rosa    `#F1A7FF`
  Lilás   `#D28BFF`
  Roxo    `#9D5CFF`
  Verde   `#35D07F`

------------------------------------------------------------------------

# 13. GRÁFICOS (REGRA CRÍTICA)

## NÃO ALTERAR

Os gráficos existentes **devem permanecer exatamente iguais em
comportamento**.

Isso inclui:

-   Biblioteca utilizada.
-   Dados.
-   Escalas.
-   Séries.
-   Tooltips.
-   Filtros.
-   Zoom.
-   Hover.
-   Seletores de período.
-   Interações.
-   Performance.

## ALTERAR APENAS

-   Cores.
-   Gradientes.
-   Espessura das linhas.
-   Fundo.
-   Grid.
-   Tooltip visual.
-   Marcadores.
-   Bordas do card.

A aparência deve ser premium, mas a lógica deve permanecer intacta.

------------------------------------------------------------------------

# 14. TABELAS E LISTAS

Transformar listas em cards elegantes.

Cada item deve possuir:

-   Radius 16px
-   Padding 14--16px
-   Hover suave
-   Indicadores positivos em verde
-   Hierarquia tipográfica clara

Nenhuma informação deve ser removida.

------------------------------------------------------------------------

# 15. FORMULÁRIOS

Inputs em formato cápsula ou rounded.

``` css
background:
rgba(255,255,255,.04);

border:
1px solid rgba(255,255,255,.08);

height: 48px;

border-radius: 999px;
```

Placeholders discretos.

------------------------------------------------------------------------

# 16. ÍCONES

Estilo:

-   Outline
-   Traço fino
-   18--20px
-   Branco ou cinza claro

Bibliotecas recomendadas:

-   Lucide
-   Heroicons
-   Phosphor

------------------------------------------------------------------------

# 17. ESPAÇAMENTO

Sistema baseado em múltiplos de 8.

  Valor   Uso
  ------- ------------------
  8       Ícones
  12      Conteúdo interno
  16      Cards pequenos
  20      Blocos
  24      Seções
  32      Margens grandes

Evitar elementos colados.

------------------------------------------------------------------------

# 18. ANIMAÇÕES

Utilizar apenas microinterações.

## Hover Card

``` css
transform: translateY(-2px);

transition: .25s ease;
```

## Botão

``` css
transform: scale(1.02);
```

Glow aumenta levemente.

Jamais utilizar animações exageradas.

------------------------------------------------------------------------

# 19. RESPONSIVIDADE

## Desktop

-   Sidebar fixa
-   Grid completo
-   Gráfico em largura máxima

## Tablet

-   Sidebar recolhível
-   Grid 2 colunas

## Mobile

-   Cards empilhados
-   Navegação adaptada
-   Gráficos ocupando largura total
-   Mesmas funcionalidades

------------------------------------------------------------------------

# 20. CHECKLIST FINAL (OBRIGATÓRIO)

Antes de concluir a reformulação, valide que:

-   [ ] Nenhuma funcionalidade foi removida.
-   [ ] Nenhuma regra de negócio foi alterada.
-   [ ] Todos os gráficos continuam funcionando exatamente igual.
-   [ ] Todos os filtros continuam operando normalmente.
-   [ ] APIs permanecem idênticas.
-   [ ] CRUDs permanecem idênticos.
-   [ ] Estados e hooks permanecem iguais.
-   [ ] Apenas HTML, estrutura visual, classes CSS, Tailwind e
    componentes de apresentação foram reformulados.
-   [ ] O resultado transmite a identidade visual premium da imagem de
    inspiração.

------------------------------------------------------------------------

# RESULTADO ESPERADO

Entregue uma aplicação visualmente equivalente ao nível de acabamento da
referência, mantendo **100% da compatibilidade funcional** do projeto
original.

A mudança deve ser exclusivamente estética: um novo Design System, nova
identidade visual e nova experiência de interface, preservando
integralmente o comportamento da aplicação.
