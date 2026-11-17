# 📘 PROMPT 3 — REESCRITA DIDÁTICA DOS RELATÓRIOS
## Transforma os relatórios técnicos existentes em documentos que qualquer pessoa consegue ler: problema → causa → correção → prova

**Quando usar:** depois que os prompts `1-PROMPT_MASTER_UNIFICADO.md` e `2-OUTPUTS_UNIFICADO_FORMATOS_E_CATALOGO.md` já geraram a pasta `relatorios/`.
**O que ele faz:** **não refaz a auditoria do zero.** Ele reaproveita tudo o que já foi apurado (relatórios, catálogo de falhas, histórico do Git e código atual) e **reescreve** em linguagem clara, progressiva e autoexplicativa.

> Cole este documento inteiro no agente que tem acesso ao repositório. Preencha os parâmetros antes de enviar.

```
RELATORIOS_ALVO:        TODOS            (ou lista: 07, 08, 10, 11, 13)
PILOTO_PRIMEIRO:        SIM              (SIM = reescreve primeiro o 07 e o 11, para e aguarda aprovação do formato)
MODO_DE_AVANCO:         POR_RELATORIO    (para ao fim de cada relatório e aguarda "pode avançar")
PODE_ALTERAR_CODIGO:    NAO              (este prompt só mexe em documentação)
ATUALIZAR_TEMPLATES:    SIM              (SIM = no final, grava as regras de redação no prompt 2 para que relatórios futuros já nasçam didáticos)
IDIOMA:                 pt-BR
```

---

## 1. POR QUE ESTE PROMPT EXISTE (o problema que ele corrige)

Os relatórios atuais estão tecnicamente corretos, mas são difíceis de entender porque:

1. **Usam códigos que não são explicados no próprio relatório.** `B1–B11`, `I1–I11` e `A1–A8` vêm do *catálogo* da Parte 3 do arquivo `2-OUTPUTS_UNIFICADO_FORMATOS_E_CATALOGO.md` (B = Básico, I = Intermediário, A = Avançado). Quem lê só o relatório não tem como saber que `B3` significa "um usuário conseguia acessar dados de outra empresa".
2. **Usam nomes de etapas internas como se fossem conhecidos.** "Pós-Fase H", "Fase G", "Fases A–F" não dizem *o que* foi feito em cada etapa.
3. **Resumem demais.** Um único parágrafo junta 5 ou 6 problemas diferentes, cheio de nomes de função, e não diz qual era o problema, nem o que podia acontecer, nem como ficou.
4. **Não mostram o "antes".** Falam só do estado atual (`RESOLVIDO`), sem descrever o problema que existia.
5. **Usam rótulos de status codificados** (`HARDENED / PARCIAL`, `CONTROLADO / ATENÇÃO INFRA`) sem explicar o que significam na prática.

**Objetivo:** cada relatório precisa ser entendido de ponta a ponta por alguém **não técnico que se esforce para ler**, e ainda assim conter **todo o detalhe técnico** que um desenvolvedor precisa. **Relatório grande não é problema; relatório incompreensível é.**

---

## 2. FONTES QUE VOCÊ DEVE REAPROVEITAR (nesta ordem)

| Fonte | Para que serve |
|---|---|
| `relatorios/*.md` (todos) | Conteúdo a ser reescrito. Nada que esteja lá pode ser perdido. |
| `ordem de prompts/2-OUTPUTS_UNIFICADO_FORMATOS_E_CATALOGO.md` — **Parte 3** | Significado de cada código (`B1`…`A8`, `H1`…`H6`): sintoma, por que acontece, risco. É daqui que sai a descrição do **problema original**. |
| `relatorios/00_REGISTRO_DE_PROGRESSO.md` | O que foi feito em cada fase (A, B, … G, H), datas e entregas. |
| `relatorios/11_matriz_consolidada_de_falhas.md` | Status atual e evidência de cada problema. |
| `git log` / `git show <commit>` | O "antes × depois" real do código, quando o relatório não deixa claro como era antes. |
| Código atual (`backend/`, `frontend/`) | Confirmar que a correção descrita **existe de fato** antes de afirmar que foi resolvida. |

**Regras sobre as fontes:**
- **Não invente.** Se não for possível descobrir como era antes, escreva: *"Não foi possível confirmar como o código funcionava antes desta correção; a descrição abaixo é baseada no catálogo de falhas."*
- **Não rebaixe nem promova status** sem verificar no código. Se o relatório diz "resolvido" e o código não confirma, registre a divergência.
- **Preserve todos os links** de arquivo (`file:///...`), números medidos, datas e evidências.

---

## 3. AS REGRAS DE REDAÇÃO (obrigatórias)

### 3.1 Códigos e identificadores
1. **Proibido usar código sozinho.** Nunca escreva só `B3` ou `I1`. Todo problema é chamado pelo **nome descritivo**, e o ID aparece só como etiqueta de apoio.
   - ❌ `B3 / B6 / B7 (RESOLVIDO): isolamento em dois níveis...`
   - ✅ **"Um usuário podia ver dados de outra empresa"** `(ID: ACESSO-01)`
2. **Novo ID amigável, por tema**, no formato `TEMA-NN`. Use estes temas:

   | Tema | Significado |
   |---|---|
   | `ACESSO` | Quem pode ver/fazer o quê (login, permissões, separação entre empresas e lojas) |
   | `DADOS` | Dados corretos e consistentes (estoque, valores em dinheiro, pedidos, exclusões) |
   | `ENTRADA` | Proteção contra dados maliciosos ou malformados (formulários, uploads, planilhas, links) |
   | `DESEMPENHO` | Velocidade e consumo (consultas lentas, listas enormes, cache) |
   | `OPERACAO` | Funcionamento do servidor em produção (logs, erros, desligamento, limites de acesso) |
   | `TELA` | Interface (telas quebrando, chamadas fora do padrão) |
   | `QUALIDADE` | Testes, automação e manutenção do código |

3. **O título do problema descreve o sintoma, em linguagem do dia a dia**, não a solução e não o jargão.
   - ❌ "Falta de idempotência" → ✅ "Clicar duas vezes em 'Finalizar pedido' podia registrar a venda em dobro"
   - ❌ "Condição de corrida / lost update" → ✅ "Duas vendas ao mesmo tempo podiam deixar o estoque com número errado"
4. **Rastreabilidade com o código antigo:** o código original (`B3`, `I1`…) aparece **apenas** em uma linha discreta dentro do cartão (`Código no catálogo original: B3`) e na tabela de equivalência do Guia de Leitura (seção 4.1).

### 3.2 Etapas / fases
- **Nunca** escreva "Fase H" sozinho. Escreva o que a fase fez:
  - ✅ "Etapa 8 — Uma empresa com várias lojas, pedidos com vários itens e gestão de funcionários *(antes chamada de Fase H)*"
- "Pós-Fase H" vira "**situação atual do sistema (após a etapa 8)**".

### 3.3 Termos técnicos
- Todo termo técnico é **explicado na primeira vez em que aparece** no relatório, entre parênteses ou em uma frase curta, e também entra no **Glossário** (seção 4.1).
  - ✅ "o sistema agora usa uma **transação** (um pacote de operações no banco que ou acontece inteiro, ou não acontece nada)"
- Nomes de função, arquivo e tabela **podem e devem** aparecer — mas na parte "Detalhe técnico", nunca substituindo a explicação.

### 3.4 Status
Substitua rótulos codificados por estas quatro situações, sempre com uma frase explicando:

| Situação | Quando usar |
|---|---|
| ✅ **Resolvido** | Correção existe no código **e** há evidência (teste, execução ou revisão). |
| 🟡 **Resolvido em parte** | Melhorou, mas sobrou algo. **Obrigatório dizer o que sobrou.** |
| 🔴 **Ainda em aberto** | Problema identificado e ainda não corrigido. |
| ⚪ **Risco aceito** | Decidiu-se não corrigir agora. **Obrigatório dizer por quê.** |

### 3.5 Tamanho e granularidade
- **Um problema = um cartão.** Proibido agrupar vários problemas num mesmo parágrafo.
- Não economize texto na explicação do problema e da correção. Economize em adjetivos e repetições.
- Listas longas de itens técnicos (ex.: 8 medidas de segurança num parágrafo) viram **lista numerada**, um item por linha, cada um com "o que é" + "o que protege".

### 3.6 Leitura em camadas
Todo relatório começa simples e vai aprofundando:
1. **Resumo para quem não é técnico** (5 a 10 linhas, sem nenhum termo técnico).
2. **Mapa do relatório** (o que vem em cada seção).
3. **Conteúdo detalhado** (cartões, tabelas, explicações).
4. **Detalhe técnico** dentro de cada cartão, sempre **depois** da explicação simples.

---

## 4. ESTRUTURA DE SAÍDA

### 4.1 Arquivo novo: `relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md`
Criar **antes** de reescrever os demais. Conteúdo:
1. **Como ler estes relatórios** — ordem recomendada de leitura (do mais simples ao mais técnico) e para que serve cada arquivo, em uma frase.
2. **Linha do tempo das etapas** — tabela `Etapa | Nome descritivo | Nome antigo (Fase X) | Data | O que mudou para o usuário`.
3. **Tabela de equivalência dos problemas** — `ID novo | Título do problema | Código no catálogo original | Situação atual | Onde está detalhado`.
4. **Legenda de situações** (seção 3.4).
5. **Glossário** — ordem alfabética, cada termo com: explicação simples + exemplo do dia a dia (+ termo técnico em inglês, se houver). Ex.: *Transação, Idempotência, IDOR, XSS, JWT, Soft delete, Índice, N+1, Cache, Rate limit, CORS, Migration, Tenant/Multi-tenant, Endpoint, Lock…* (inclua todos os que aparecerem nos relatórios).

### 4.2 Modelo obrigatório do CARTÃO DE PROBLEMA
Usado nos relatórios 07, 08, 11 e 13 (e onde mais houver problema/correção).

```markdown
### 🔒 ACESSO-01 — Um usuário podia ver dados de outra empresa

**Situação atual:** ✅ Resolvido
**Gravidade original:** Crítica — *o que isso significa:* qualquer cliente do sistema poderia ler informações sigilosas de outro cliente.
**Código no catálogo original:** B3

#### 1. Em uma frase
Antes, o sistema confiava que a própria tela esconderia o que o usuário não podia ver; agora é o servidor que bloqueia.

#### 2. Qual era o problema
<Descrição em linguagem simples do que acontecia. Inclua um CENÁRIO CONCRETO:>
> **Exemplo:** a funcionária Ana, da Loja Centro da Empresa X, troca o número na barra de endereço
> de `/produtos/10` para `/produtos/11` e passa a ver um produto que pertence à Empresa Y.
*(Se o cenário for ilustrativo e não reproduzido, diga: "exemplo ilustrativo".)*

#### 3. Por que isso era um risco
<Quem era afetado e o que poderia acontecer na prática: vazamento, prejuízo, dado errado, sistema fora do ar…>

#### 4. Por que acontecia (a causa)
<Explicação simples da causa raiz, seguida da explicação técnica com termos definidos.>

#### 5. Como foi resolvido
<Em linguagem simples: o que mudou no comportamento do sistema.>
1. <Medida 1 — o que é e o que protege>
2. <Medida 2 — o que é e o que protege>

#### 6. Como era × como ficou
| | Antes | Depois |
|---|---|---|
| Ana tenta abrir produto de outra empresa | Via o produto | Recebe "não encontrado" |

#### 7. Como sabemos que funciona
<Evidência: teste executado, resultado, data. Se não houver evidência, dizer claramente.>

#### 8. O que ainda falta
<Lacunas remanescentes. Se nada, escrever "Nada pendente identificado.">

#### 9. Detalhe técnico (para desenvolvedores)
- Arquivos: [tenantScope.js](file:///...) · [authMiddleware.js](file:///...)
- Funções: `...`
- Endpoints afetados: `...`
- Commit(s): `abc1234`
```

### 4.3 Como reescrever cada relatório

| Relatório | O que fazer |
|---|---|
| `00_REGISTRO_DE_PROGRESSO` | Trocar "Fase X" pelo nome descritivo da etapa; status geral em uma frase compreensível; manter histórico. |
| `01` a `06` (descritivos) | Adicionar o **Resumo para quem não é técnico** no topo; explicar termos na primeira ocorrência; trocar códigos e fases pelos nomes descritivos. Não precisam de cartões. |
| `07_diagnostico_auditoria_e_performance` | **Reescrever por completo.** Uma seção por tema (`ACESSO`, `DADOS`…), com **um cartão por problema**. Na parte de performance: explicar o que cada endpoint faz para o usuário ("a tela de produtos demorava X para abrir"), o que é p50/p95, o que causava a lentidão e o que foi feito. |
| `08_melhorias_por_componente` | Cada melhoria aponta para o problema que resolve **pelo nome** e ID novo; explicar o benefício para o usuário antes do detalhe técnico. |
| `09_arquitetura` | Explicar cada caixa do diagrama em uma frase; separar claramente "como é hoje" de "como deveria ser". |
| `10_plano_consolidado` | Cada etapa com nome descritivo, objetivo em uma frase e lista de problemas resolvidos (por nome). |
| `11_matriz_consolidada_de_falhas` | Vira **"Catálogo de problemas e correções"**: primeiro uma tabela-índice simples (`ID | Problema | Situação | Link para o cartão`), depois **todos os cartões completos**. É o documento principal; os outros relatórios apontam para ele. |
| `12`, `14` (produto e mercado) | Trocar jargão de fases por nomes descritivos; explicar siglas de negócio (SaaS, B2B, PDV, ERP…). |
| `13_relatorio_consolidado_de_mudancas` | Narrativa progressiva: **"Como o sistema era no início" → "o que foi mudando em cada etapa e por quê" → "como está hoje" → "o que ainda falta"**, citando os problemas pelo nome. |

---

## 5. PROCESSO DE EXECUÇÃO

1. **Levantamento (sem escrever relatório ainda):**
   - Listar todos os códigos citados nos relatórios (`B*`, `I*`, `A*`, `H*`, `MEL-*`, `RN-*`, `Fase *`).
   - Para cada um, buscar o significado no catálogo (Parte 3 do prompt 2), o status no Relatório 11 e a evidência no código.
   - Montar a tabela de equivalência `código antigo → ID novo + título descritivo`.
   - Apresentar essa tabela ao usuário e **aguardar confirmação dos títulos** (são eles que guiam a leitura de tudo).
2. **Criar `00_GUIA_DE_LEITURA_E_GLOSSARIO.md`.**
3. **Piloto** (se `PILOTO_PRIMEIRO = SIM`): reescrever **11** e **07**; parar e pedir aprovação do formato.
4. **Demais relatórios**, um por vez, conforme `MODO_DE_AVANCO`.
5. **Verificação final** (seção 6).
6. **Se `ATUALIZAR_TEMPLATES = SIM`:** adicionar ao `2-OUTPUTS_UNIFICADO_FORMATOS_E_CATALOGO.md` uma seção **"Regras de redação didática"** contendo as seções 3 e 4.2 deste prompt, e ajustar o template da Parte 4 (matriz) para exigir título descritivo, para que relatórios futuros já nasçam neste formato.

**Regras de segurança:**
- Reescrever **no lugar** (mesmos nomes de arquivo), para não quebrar links existentes no README e entre relatórios.
- Antes de começar, confirmar que o Git está limpo (`git status`) para que o usuário consiga comparar o antes e o depois com `git diff`.
- **Não alterar código-fonte.**

---

## 6. CHECKLIST DE VERIFICAÇÃO (rodar antes de entregar cada relatório)

- [ ] Nenhum código (`B1`, `I3`, `A5`…) aparece sozinho fora da linha "Código no catálogo original" e da tabela de equivalência.
- [ ] Nenhuma ocorrência de "Fase X" sem o nome descritivo da etapa.
- [ ] Todo problema tem: título descritivo, "qual era o problema", "por que era um risco", "causa", "como foi resolvido", "como sabemos", "o que falta".
- [ ] Todo termo técnico foi explicado na primeira ocorrência e está no glossário.
- [ ] Nenhum parágrafo trata de mais de um problema.
- [ ] O relatório começa com um resumo sem termos técnicos.
- [ ] Todos os links, números medidos, datas e evidências do relatório original foram preservados.
- [ ] Nenhuma informação nova foi inventada; o que não pôde ser confirmado está sinalizado.
- [ ] **Teste de leitura:** releia o resumo e um cartão aleatório como se você não soubesse programar. Se alguma frase exigir conhecimento prévio, reescreva.

Para auxiliar, rode ao final:
```powershell
Select-String -Path relatorios\*.md -Pattern '\b[BIAH]\d{1,2}\b|Fase [A-H]\b' | Select-Object Filename, LineNumber, Line
```
Toda ocorrência retornada deve estar em uma linha de rastreabilidade permitida.

---

## 7. ENTREGA AO USUÁRIO (ao fim de cada relatório)

Responda em pt-BR com:
1. Qual relatório foi reescrito.
2. Quantos problemas foram transformados em cartões.
3. Divergências encontradas entre o relatório antigo e o código (se houver).
4. Termos adicionados ao glossário.
5. Pergunta: *"Pode avançar para o próximo relatório?"*
