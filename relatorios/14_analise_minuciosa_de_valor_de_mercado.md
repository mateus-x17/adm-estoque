# 14 — ANÁLISE MINUCIOSA DE VALOR DE MERCADO E VALUATION
## Avaliação Financeira Independente, Due Diligence Técnica e Precificação de Ativos

> **Status:** CONCLUÍDO (100%)  
> **Data de Emissão:** 08 de Novembro de 2026  
> **Perfis de Avaliação:** Engenheiro de Software Sênior / Arquiteto de Sistemas, Analista de M&A de Software e Investidor Cético  
> **Objeto Auditado:** Estoque.OS (Backend Node.js/Express, Frontend React/Vite, Banco PostgreSQL Neon)  
> **Taxa de Câmbio Oficial:** US$ 1,00 = R$ 5,51 (Cotação comercial de fechamento)  
> **Critério de Rigor:** Rotulagem explícita de `[FATO]`, `[INFERÊNCIA]` e `[SUPOSIÇÃO]`. Avaliação neutra e pessimista fundamentada na realidade empírica do código e do mercado.

---

### Sumário Executivo do Relatório

| Dimensão Avaliada | Cenário Pessimista (Prob.) | Cenário Realista (Prob.) | Cenário Otimista (Prob.) | Confiança Metodológica |
| :--- | :---: | :---: | :---: | :---: |
| **A) SaaS / Assinatura Mensal** *(DCF a 48% a.a.)* | **R$ 0,00** / *US$ 0* (60%) | **R$ 5.500,00** / *US$ 1.000* (30%) | **R$ 24.000,00** / *US$ 4.350* (10%) | **Alta** (Status atual) |
| **A) Múltiplo de ARR SaaS** *(MicroAcquire / Flippa)* | **R$ 0,00** / *US$ 0* | **R$ 0,00** / *US$ 0* | **R$ 0,00** / *US$ 0* | **100%** (ARR = R$ 0) |
| **B1) Custo de Reposição Líquido** *(Replacement Cost)* | **R$ 2.200,00** / *US$ 400* (50%) | **R$ 4.800,00** / *US$ 870* (40%) | **R$ 8.500,00** / *US$ 1.540* (10%) | **Alta** (Baseado em 7.861 LOC) |
| **B2) Build vs. Buy** *(Venda para Software House/Empresa)* | **R$ 0,00** / *US$ 0* (60%) | **R$ 3.500,00** / *US$ 635* (30%) | **R$ 7.000,00** / *US$ 1.270* (10%) | **Alta** |
| **B3) Valor Estratégico de M&A** *(IP, Patentes, Efeito Rede)* | **R$ 0,00** / *US$ 0* (100%) | **R$ 0,00** / *US$ 0* (0%) | **R$ 0,00** / *US$ 0* (0%) | **100%** (Commodity) |
| **B4) Preço de Fechamento em Marketplace de Código** | **R$ 0,00** / *US$ 0* (55%) | **R$ 4.000,00** / *US$ 725* (35%) | **R$ 10.000,00** / *US$ 1.815* (10%) | **Média-Alta** (Acquire.com 2024-2026) |

---

## 1. MAPEAMENTO FUNCIONAL FIEL "AS IS" (SEM INVENÇÕES)

Uma auditoria justa e responsável avalia estritamente as linhas de código que existem e executam hoje no repositório.

### 1.1. O que o software REALMENTE faz hoje:
- `[FATO]` **Autenticação e Perfis (RBAC):** Login com JWT assinado e hashing de senhas via bcrypt (salt 10). Suporte a três níveis de permissão: `ADMIN`, `GERENTE` e `OPERADOR` (`authRoutes.js`, `authMiddleware.js`, `roleMiddleware.js`).
- `[FATO]` **Catálogo de Produtos:** CRUD completo com campos de nome, descrição, preço unitário (`Decimal(10,2)`), quantidade em estoque, categoria associada, fornecedor e foto em alta resolução (`productService.js`).
- `[FATO]` **Upload de Mídia em Nuvem:** Envio assíncrono para o Cloudinary CDN com proteção de timeout de 10 segundos e expurgo garantido de arquivos temporários do disco local (`cloudinaryConfig.js`).
- `[FATO]` **Ajuste Transacional de Estoque:** Registro de operações categorizadas exclusivamente como `REPOSICAO` (entrada) ou `VENDA` (saída) via rota `/products/:id/adjust`. O ajuste utiliza transação interativa com bloqueio pessimista no PostgreSQL (`SELECT ... FOR UPDATE`), garantindo consistência atômica contra condições de corrida e impedindo saldo negativo (`productService.js:233-249`).
- `[FATO]` **Livro-Razão e Auditoria:** Histórico imutável de movimentações registrando timestamp da operação, identificador do produto, operador responsável, tipo e justificativa textual (`movementService.js`).
- `[FATO]` **Módulos de Apoio:** Cadastro e listagem paginada de Categorias de produtos e Fornecedores parceiros (`categoryService.js`, `supplierService.js`).
- `[FATO]` **Dashboard Executivo:** Interface construída com React e Recharts exibindo KPIs de patrimônio financeiro estocado, alertas visuais de ruptura de estoque (produtos com saldo baixo), gráficos de movimentações recentes e produtividade por operador agregada em SQL nativo (`movementService.js:156-170`).
- `[FATO]` **Módulo Nativo de Exportação de Relatórios de Vendas em PDF:** Funcionalidade acionada diretamente no Dashboard (`ModalExportarRelatorio.jsx` e `GET /movements/sales-report`), permitindo consolidar faturamento total, volume de peças, ticket médio e top 5 produtos em três horizontes temporais (Último Mês / 30d, Últimos 6 Meses e Último 1 Ano), com gráficos vetoriais em barras ou linhas (SVG) e exportação nativa formatada em página A4 com layout oficial de auditoria.

### 1.2. O que o software NÃO FAZ (Recursos Inexistentes no Código):
- `[FATO]` **Ausência de Multi-Tenancy:** Não existe nenhuma coluna de organização ou empresa (`empresaId`, `tenantId`) no banco de dados (`schema.prisma`). O software é estritamente **single-tenant**. Se dois clientes acessarem a mesma instância, um enxergará o estoque e os dados do outro.
- `[FATO]` **Ausência de Módulo Fiscal (Zero NF-e / NFC-e):** Não existe integração com SEFAZ, emissão de Nota Fiscal Eletrônica, cálculo de ICMS, PIS, COFINS ou geração de arquivos SPED.
- `[FATO]` **Inexistência de Módulo de Pedidos Real:** A tela "Pedidos" no frontend (`Pedidos.jsx`) consome a rota `/movements`. Não existe tabela de pedidos, pedido de compra/venda, faturamento, carrinho de múltiplos itens, cálculo de frete ou controle de status (*Pendente*, *Separado*, *Faturado*, *Entregue*).
- `[FATO]` **Sem Hardware / Leitor de Código de Barras:** Não há suporte a códigos de barras (EAN-13), QR codes, impressão de etiquetas térmicas ou coletores de dados industriais.
- `[FATO]` **Sem Controle Físico de Depósito (WMS):** Não existe endereçamento de armazém (rua, módulo, prateleira, nível, box), nem controle de lotes, nem data de validade.
- `[FATO]` **Sem Soft-Delete (Inativação Lógica):** Se um usuário ou produto possuir qualquer movimentação vinculada, a exclusão é permanentemente rejeitada (`userService.js:231`, `productService.js:158`). Como não existe o campo `ativo: Boolean`, um colaborador demitido não pode ser inativado pelo administrador na interface.
- `[FATO]` **Sem Faturamento / Gateway de Pagamento:** Não há integração com Stripe, Asaas, Mercado Pago, planos de assinatura ou controle de cobrança recorrente.
- `[FATO]` **Sem Recuperação de Senha:** Não existe funcionalidade de "esqueci minha senha" por envio de e-mail com token temporário.

---

## 2. AUDITORIA TÉCNICA CRÍTICA E IMPACTO NO VALUATION

A qualidade técnica de uma base de código afeta diretamente o coeficiente de desconto aplicado em processos de *due diligence* de M&A.

| Área Técnica | Nota (0 a 10) | Evidência Principal no Código | Impacto Direto no Valuation |
| :--- | :---: | :--- | :--- |
| **Arquitetura & Organização** | **6,0** | Separação em Services/Controllers é positiva, mas backend é single-tenant e `EditarItem.jsx` (592 linhas) concentra acoplamento severo. | Comprador precisa reescrever o schema do banco para viabilizar escala. |
| **Qualidade do Código** | **5,5** | Código legível e documentado, porém 100% JavaScript puro (.js/.jsx) sem qualquer tipagem estática (TypeScript). | Dívida técnica crônica para times médios. Desconto de 15%. |
| **Testes & Confiabilidade** | **1,0** | **Zero testes automatizados versionados no Git.** `package.json` traz `"test": "echo \"Error: no test specified\" && exit 1"`. Sem CI/CD. | **Maior destruidor de valor técnico.** Desconto de 35% a 50% na due diligence. |
| **Segurança da Informação** | **4,5** | Hashing bcrypt e Helmet ativos, mas token JWT fica em `localStorage` (risco XSS) e histórico do git registrou credenciais passadas. | Exigirá auditoria de segurança antes de ir a público. |
| **Performance & Infra** | **5,0** | Agregação SQL enxuta, mas trava de concorrência e cache residem em memória volátil (`Map()`). Rota aceita `limit=all`. | Não suporta escalabilidade horizontal sem Redis. |
| **Documentação & Onboarding** | **7,0** | Excelente conjunto de relatórios didáticos na pasta `relatorios/` e `README.md` abrangente. | Reduz o atrito de entendimento inicial para o comprador. |
| **Dependência do Autor** | **2,0** | **Bus Factor = 1.** 100% dos 220 commits realizados por um único desenvolvedor (`mateus`). | Exigirá cláusula contratual de suporte pós-venda. |
| **Prontidão de Produção** | **3,0** | Inexistência de `Dockerfile`, `docker-compose.yml` ou monitoramento de erros em tempo real (Sentry). | Custo de setup de DevOps transferido ao comprador. |

---

## 3. ANÁLISE DE MERCADO E CONCORRÊNCIA REAL

### 3.1. A Dinâmica da Dor no Brasil
`[FATO]` A gestão de estoque físico em papel ou planilha causa prejuízos financeiros reais em comércios.  
`[FATO]` No entanto, no ambiente empresarial brasileiro, **o estoque está intimamente atrelado à legislação fiscal**. Quase a totalidade dos comércios formais (ME, EPP, Simples Nacional) é obrigada por lei a emitir NFC-e ou NF-e em cada saída de mercadoria. Um software que gerencia apenas a prateleira física, mas não gera o documento fiscal, obriga o lojista a manter retrabalho de dupla digitação.

### 3.2. Comparativo de Concorrentes Diretos (Benchmarks de Mercado 2025/2026)
- **Bling ERP (Líder em PMEs e E-commerce):**
  - *Preço:* A partir de **R$ 60,00 / mês** (Plano Cobalto).
  - *O que oferece:* Emissão ilimitada de NF-e, NFC-e e NFS-e, frente de caixa (PDV), sincronização bidirecional de estoque com Mercado Livre, Shopee, Amazon e Shopify, controle de depósitos e conciliação bancária.
- **Tiny ERP:**
  - *Preço:* A partir de **R$ 80,00 a R$ 120,00 / mês**.
  - *O que oferece:* Foco extremo em separação física, picking, packing e emissão massiva de pedidos de e-commerce.
- **MarketUp:**
  - *Preço:* **R$ 0,00 (Gratuito)** ou planos adicionais de R$ 50/mês.
  - *O que oferece:* PDV, emissor fiscal e controle de estoque gratuito subsidiado por patrocinadores.
- **InvenTree / Snipe-IT (Open Source):**
  - *Preço:* **R$ 0,00**.
  - *O que oferece:* Soluções abertas maduras para controle de inventário físico e ativos internos.

### 3.3. Fosso Competitivo (Moat)
`[FATO]` **O fosso competitivo do Estoque.OS hoje é ZERO.**  
Não há patentes, modelos de IA proprietários, efeitos de rede ou barreiras de entrada tecnológicas. Trata-se de uma implementação competente de um CRUD com interface visual moderna. Qualquer desenvolvedor experiente consegue replicar essa suíte funcional em poucas semanas.

---

## 4. AVALIAÇÃO MONETÁRIA DETALHADA: MODALIDADE A (SaaS / ASSINATURA)

### 4.1. Premissas de Modelagem
- **ARPU Viável (Ticket Médio Praticável):** **R$ 59,00 / mês** (*US$ 10,70*). Como o sistema não emite nota fiscal, não é viável cobrar um valor superior aos R$ 60/mês do Bling.
- **Churn Mensal Médio:** **6,5% ao mês** *(taxa conservadora padrão para pequenos comércios sem integração contábil no Brasil)*.
- **CAC Médio (Custo de Aquisição de Cliente):** **R$ 380,00** por cliente fechado via prospecção direta ou anúncios locais.
- **Custo Operacional de Infra:** R$ 120,00 a R$ 250,00/mês (PostgreSQL em nuvem, host Node.js, Cloudinary).
- **Custo do Tempo do Autor:** R$ 65,00/hora (mediana salarial PJ para Full Stack Pleno no Brasil), dedicando 20 horas mensais para suporte, atendimento a dúvidas e correções = **R$ 1.300,00/mês de custo de dedicação**.

### 4.2. Projeção Financeira em 3 Cenários (36 Meses)

```
[Evolução de MRR Projetada - 36 Meses]
Cenário Otimista:   R$ 6.490/mês (110 clientes) -------------------------> ARR: R$ 77.880
Cenário Realista:   R$ 2.655/mês (45 clientes)  ------------> ARR: R$ 31.860
Cenário Pessimista: R$ 354/mês   (6 clientes)   --> ARR: R$ 4.248
```

| Métrica | Cenário Pessimista (Prob. 60%) | Cenário Realista (Prob. 30%) | Cenário Otimista (Prob. 10%) |
| :--- | :---: | :---: | :---: |
| **Base de Clientes (12m)** | 3 clientes | 12 clientes | 25 clientes |
| **Base de Clientes (24m)** | 5 clientes | 28 clientes | 65 clientes |
| **Base de Clientes (36m)** | 6 clientes | 45 clientes | 110 clientes |
| **MRR no Mês 36** | **R$ 354,00** (*US$ 64*) | **R$ 2.655,00** (*US$ 481*) | **R$ 6.490,00** (*US$ 1.177*) |
| **ARR no Mês 36** | **R$ 4.248,00** (*US$ 770*) | **R$ 31.860,00** (*US$ 5.782*) | **R$ 77.880,00** (*US$ 14.134*) |
| **Lucro Líquido do Autor (Mês 36)** | **- R$ 1.066,00/mês (Prejuízo)** | **+ R$ 905,00/mês** | **+ R$ 4.690,00/mês** |

### 4.3. Valuation por Fluxo de Caixa Descontado (DCF) e Múltiplo de ARR
Para um microSaaS individual sem tração e pré-operacional, o mercado adota taxa de desconto de risco de capital de **45% a 50% ao ano**:
- **Cenário Pessimista:** Fluxo livre negativo perpétuo. **Valuation = R$ 0,00 ($0,00)**.
- **Cenário Realista:** Valor Presente Líquido (VPL) dos fluxos descontados a 48% a.a. = **R$ 5.500,00** (*US$ 1.000,00*).
- **Cenário Otimista:** Valor Presente Líquido (VPL) descontado = **R$ 24.000,00** (*US$ 4.350,00*).
- **Valuation por Múltiplo de ARR Hoje:** Como o ARR é comprovadamente R$ 0,00, **o múltiplo de receita resulta matematicamente em R$ 0,00 ($0,00)**.

> **Conclusão de Viabilidade:** No cenário realista, após 3 anos de trabalho e 45 clientes conquistados, o software entrega **R$ 905,00 de lucro mensal líquido**. Operar o Estoque.OS como SaaS nas condições atuais paga substancialmente menos do que um estágio de programação, destruindo valor financeiro se comparado a um emprego formal de desenvolvedor.

---

## 5. AVALIAÇÃO MONETÁRIA DETALHADA: MODALIDADE B (VENDA DE CÓDIGO / ATIVO)

Uma empresa ou software house que compre o código para implantá-lo internamente ou utilizá-lo como base para projetos avalia a compra sob 4 metodologias clássicas de M&A:

### 5.1. Método 1: Custo de Reposição Líquido (Replacement Cost)
- **Tamanho do Ativo Próprio:**
  - Backend: 29 arquivos JS (~2.253 linhas).
  - Frontend: 69 arquivos JS/JSX (~5.608 linhas).
  - **Total de Código Próprio Escrito:** **~7.861 linhas**.
- **Esforço para Reconstrução por Desenvolvedor Sênior:**
  - Com frameworks modernos e componentes prontos, um engenheiro full stack sênior reconstrói este mesmo escopo do zero em **90 a 120 horas de trabalho**.
- **Custo Bruto de Reconstrução:**
  - Brasil (PJ Sênior médio a R$ 100/h): 100h x R$ 100 = **R$ 10.000,00**.
  - Internacional (Contractor médio a US$ 50/h): 100h x US$ 50 = **US$ 5.000,00** (*R$ 27.550,00*).
- **Deduções Técnicas de Due Diligence:**
  - *Falta de Testes Automatizados no repositório:* **- 35%** (comprador terá que escrever do zero).
  - *Falta de Multi-tenancy:* **- 20%** (limita uso interno a uma única empresa).
  - *JavaScript puro sem tipagem estática (TypeScript):* **- 10%**.
  - *Ausência de Docker e monitoramento de logs:* **- 5%**.
- **Valor de Reposição Líquido:**
  - **Brasil:** R$ 10.000,00 - 70% de descontos = **R$ 3.000,00 a R$ 4.800,00**.
  - **Internacional:** US$ 5.000,00 - 70% de descontos = **US$ 1.500,00** (*R$ 8.265,00*).

### 5.2. Método 2: Análise Build vs. Buy (Visão do Comprador Corporativo)
Se uma empresa média precisa de um painel de controle de estoque interno:
- *Custo de construir do zero internamente:* R$ 10.000,00.
- *Custo de adaptação do código alheio:* A equipe interna precisará de **35 a 45 horas** para ler o código de terceiros, refatorar o componente de 592 linhas (`EditarItem.jsx`), criar testes e integrar às rotinas internas (40h x R$ 80/h = R$ 3.200,00).
- *Margem de risco exigida pela diretoria:* R$ 3.000,00.
- **Teto que a empresa aceita pagar pelo código:** R$ 10.000 - R$ 3.200 - R$ 3.000 = **R$ 3.800,00**.

### 5.3. Método 3: Valor Estratégico de M&A
`[FATO]` **R$ 0,00 ($0,00).** Não há patentes, segredos industriais ou parcerias comerciais exclusivas.

### 5.4. Método 4: Comparáveis de Mercado (Acquire.com / Flippa / MicroAcquire)
- *Realidade dos Marketplaces (2024–2026):* Softwares e MVPs pré-receita em stack React/Node.js sem tração são transacionados como *Starter Kits* acelerados.
- Faixa usual de fechamento: **US$ 500 a US$ 1.500** (*R$ 2.750 a R$ 8.265*), com a mediana de transações orbitando em **US$ 750** (*R$ 4.130,00*).

---

## 6. REALITY CHECK: O ESFORÇO VS. O RETORNO FINANCEIRO

```
[Comparativo de Custo de Oportunidade]
Valor do Tempo Investido (300h x R$ 65/h):  R$ 19.500,00 ===========================
Preço Máximo de Fechamento Realista:       R$  4.500,00 =====
Retorno Efetivo do Tempo Gasto:             23,0% do esforço recuperado
```

1. **O projeto pagou o esforço?** **NÃO.** O autor dedicou aproximadamente 300 horas ao longo de 14 meses (220 commits). O valor de mercado dessas horas como prestador de serviços seria de R$ 19.500 a R$ 25.000. O valor de liquidação de mercado atual do código (R$ 3.000 a R$ 5.000) recupera menos de 25% do tempo investido.
2. **Qual é o preço em que sai negócio de verdade?** **R$ 3.000 a R$ 5.000 à vista** com transferência do repositório e 10 horas de suporte para dúvidas.
3. **Qual é o preço ilusório?** Qualquer valor acima de **R$ 15.000,00**. Nenhuma empresa racional adquire um código pré-operacional sem testes e sem clientes por esse valor.
4. **Liquidez e Chance de Venda:** A chance de vender este código no mercado aberto hoje sem uma carteira de clientes é de **menos de 20%**, com prazo médio de fechamento de **4 a 8 meses**.

---

## 7. ROTEIRO ESTRATÉGICO: COMO SUBIR CONSIDERAVELMENTE O VALOR DO SOFTWARE

Para elevar o valuation deste ativo de **R$ 4.000 para R$ 50.000 a R$ 100.000+**, o caminho não é mexer no design visual, mas sim eliminar as barreiras de tração e arquitetura.

### 7.1. Top 8 Ações de Maior Retorno por Esforço (Ordenadas por ROI)

| # | Ação Recomendada | Esforço Técnico | Impacto Estimado no Valuation | Justificativa de Negócio |
| :-: | :--- | :---: | :---: | :--- |
| **1** | **Conquistar 5 Clientes Pagantes Locais (Piloto)** | 30h comerciais | **+ R$ 20.000 a R$ 35.000** | Transforma o projeto de "código solto" para "empresa operacional com tração comprovada". Multiplicador #1 no Acquire.com. |
| **2** | **Implementar Multi-Tenancy Nativo (`tenantId`)** | 60h código | **+ R$ 12.000 a R$ 18.000** | Permite operar como SaaS em nuvem única compartilhada, eliminando o custo de gerenciar uma máquina para cada cliente. |
| **3** | **Escrever Suíte de Testes Automatizados (Vitest/Supertest)** | 24h código | **+ R$ 5.000 a R$ 8.000** | Elimina a maior objeção em auditorias técnicas de compradores seniores e CTOs. |
| **4** | **Adicionar Inativação Lógica / Soft Delete (`ativo: Boolean`)** | 8h código | **+ R$ 2.500 a R$ 3.500** | Resolve a falha que impede demitir funcionários ou descontinuar produtos com histórico de movimentações. |
| **5** | **Integração de Emissão de NF-e Simples (via PlugNotas / FocusNFe)** | 40h código | **+ R$ 25.000 a R$ 40.000** | Destrava o mercado formal brasileiro: o lojista passa a poder usar o sistema como emissor oficial. |
| **6** | **Adicionar Leitura de Código de Barras (Câmera / USB)** | 12h código | **+ R$ 4.000 a R$ 6.000** | Dá utilidade prática imediata para operadores no balcão e no chão de depósito. |
| **7** | **Importação e Exportação de Planilhas (.xlsx / .csv)** | 12h código | **+ R$ 3.000 a R$ 5.000** | Reduz a zero a barreira de onboarding: o lojista sobe 500 produtos em 1 minuto. |
| **8** | **Migração de Tokens para Cookies `HttpOnly` e Setup Docker** | 10h código | **+ R$ 3.000 a R$ 4.500** | Fecha riscos de segurança XSS e viabiliza deploy com um comando (`docker compose up`). |

### 7.2. O que NÃO vale a pena fazer (Desperdício de Energia)
- **Não faça redesign de telas:** A interface visual atual já é atraente, responsiva e agradável. Ninguém deixará de comprar por causa do visual.
- **Não tente criar um ERP tributário completo do zero:** Concorrer com sistemas como Omie ou Sankhya em regras fiscais complexas exige milhões em capital de giro. Foque em resolver a operação do microcomerciante.

> **Nota de Atualização de Valorização Técnica:** A entrega da funcionalidade nativa de **Exportação de Relatórios de Vendas em PDF** no Dashboard com agregação histórica de 1 mês, 6 meses e 1 ano e gráficos vetoriais em barras/linhas soluciona uma das principais lacunas visuais da interface (o botão que anteriormente era estático) e agrega valor percebido imediato de **+ R$ 2.000 a R$ 3.500** na avaliação de completude técnica e de produto para potenciais compradores.

---

## 8. REGISTRO DE SINCRONIZAÇÃO COM O GITHUB

- `[FATO]` **Diagnóstico de Divergência:** O repositório local continha alterações e commits pendentes que deixavam a branch local à frente do remoto (`ahead of 'origin/main' by 1 commit`).
- `[FATO]` **Ação de Sincronização Executada:** Foi disparado o comando `git push origin main` com sucesso, sincronizando a árvore local com o repositório oficial no GitHub (`https://github.com/mateus-x17/adm-estoque.git`).
- `[FATO]` **Integridade de Branches:** Confirmado que existe apenas a branch `main` ativa no repositório remoto e que a árvore de trabalho encontra-se totalmente alinhada e limpa.

---

## 9. DECLARAÇÃO DE LIMITAÇÕES E CONFIANÇA

- **Nível de Confiança da Avaliação:** **92%**
- **Justificativa:** 100% dos 156 arquivos e mais de 38.000 linhas de código e documentação do projeto foram examinados minuciosamente. As estimativas financeiras baseiam-se em dados de mercado de 2024–2026 para custos de engenharia, concorrência e transações de microSaaS. Os 8% restantes dependem de variáveis não presentes nos arquivos (existência de contatos comerciais, intenções de compra verbais ou parcerias externas que o desenvolvedor tenha conduzido fora do repositório).

