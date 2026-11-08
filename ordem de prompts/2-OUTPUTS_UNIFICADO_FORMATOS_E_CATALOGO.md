# 📦 OUTPUTS UNIFICADO
## Formatos de entrega + Catálogo de falhas e correções (do básico ao avançado)

**Versão 1.0** · Documento companheiro do `PROMPT_MASTER_UNIFICADO.md`.

**Para que serve:**
1. **Parte 1 a 2:** define exatamente *como* cada relatório deve ser escrito (templates), para que a saída seja sempre igual, completa e comparável entre projetos.
2. **Parte 3:** catálogo didático de falhas reais de software, ordenado do básico ao avançado. Cada item traz: sintoma, por que acontece, como detectar, antes/depois, como prevenir, **e as lacunas que a correção típica costuma deixar**.
3. **Parte 4 a 6:** matriz de status, regras de prevenção e checklist.

> **Como ler os exemplos de código:** usam JavaScript/Node com um ORM estilo Prisma e SQL (PostgreSQL) por serem legíveis. **O conceito vale para qualquer linguagem e banco**; o agente deve adaptar à stack real do projeto auditado e nunca copiar o exemplo às cegas.

---

# PARTE 1 — ESTRUTURA DA ENTREGA

| # | Arquivo | Conteúdo | Template |
|---|---|---|---|
| 00 | `00_REGISTRO_DE_PROGRESSO.md` | Estado do trabalho | 2.10 |
| 01 | `01_visao_geral_e_inventario.md` | Identificação, nível, stack, árvore | 2.2 |
| 02 | `02_mapeamento_de_modulos.md` | Módulo → arquivo → função | 2.3 e 2.4 |
| 03 | `03_mapeamento_de_apis.md` | Endpoints e cadeias de execução | 2.5 |
| 04 | `04_models_e_banco_de_dados.md` | Entidades, relações, porquês, consultas | 2.6 e 2.7 |
| 05 | `05_jornadas_de_uso.md` | Sistema funcionando, por perfil | 2.8 |
| 06 | `06_regras_de_negocio.md` | Catálogo `RN-xxx` | 2.9 |
| 07 | `07_diagnostico_auditoria_e_performance.md` | Problemas, evidências, performance | 2.11 |
| 08 | `08_melhorias_por_componente.md` | Melhorias detalhadas | 2.1 |
| 09 | `09_arquitetura_e_system_design.md` | Atual × recomendada | 2.12 |
| 10 | `10_plano_consolidado_de_implementacao.md` | Fases A–F | 2.13 |
| 11 | `11_matriz_consolidada_de_falhas.md` | Status de cada falha | Parte 4 |
| 12 | `12_analise_de_produto.md` | Opcional (Modo Produto) | 2.14 |

**Convenções de rótulo (usar em todo o texto):**
- Afirmações: `[VERIFICADO]` · `[INFERIDO]` · `[PROBLEMA]` · `[RECOMENDAÇÃO]` · `[INEXISTENTE]` · `[NÃO VERIFICÁVEL]`
- Números: `[MEDIDO]` · `[INFERIDO DO CÓDIGO]` · `[REF. EXTERNA: fonte, ano]` · `[NÃO MEDIDO: motivo]`
- Severidade: `Crítica` (exploração, perda de dados, indisponibilidade) · `Alta` · `Média` · `Baixa`
- Prioridade: `P0` (agora) · `P1` (próxima entrega) · `P2` (planejado) · `P3` (oportunidade)
- Complexidade: `Baixa` (horas) · `Média` (dias) · `Alta` (semanas) — *estimativa de esforço relativa, não promessa de prazo*

---

# PARTE 2 — TEMPLATES

## 2.1 Melhoria (obrigatório para toda recomendação)

```markdown
### MELHORIA — <Nome claro e específico>
**ID:** MEL-### · **Falha relacionada:** <ID da matriz, ex.: I1>
**Identificação:** Prioridade P_ · Severidade _ · Complexidade _ · Impacto esperado: <qualitativo>
**Localização:** Módulo: _ · Submódulo: _ · Arquivo: `caminho/real.ext` · Função: `nome()` ·
                 Endpoint: `VERBO /rota` · Model: _ · Tabela: _

**Diagnóstico atual** — como funciona hoje + evidência (trecho de código, linha).
**Justificativa técnica** — por que mudar; efeito percebido pelo usuário.
**Implementação proposta**
1. Arquivos a criar: …
2. Arquivos a modificar: …
3. Funções a criar / completar / refatorar / remover: …
4. Imports e dependências: …
5. Migrations/banco: …
6. Alterações de endpoint (contrato antes × depois): …
7. Infraestrutura: …
**Passo a passo** — 1) … 2) … (ordem exata)
**Exemplo de código** — compatível com a stack/versões do projeto.
**Dependências e impactos** — módulos, telas e consumidores afetados; dados existentes.
**Testes e validação** — casos de teste; como medir (EXPLAIN ANALYZE, carga, métricas).
**Resultado esperado** — sem prometer ganho não medido.
**Riscos e observações** — efeitos colaterais, rollback, deploy.
**Lacunas remanescentes** — o que esta melhoria NÃO resolve.
```

**Exemplo preenchido (resumido):**

```markdown
### MELHORIA — Baixa de estoque atômica no banco
ID: MEL-014 · Falha relacionada: I1
Identificação: P0 · Severidade Crítica · Complexidade Baixa · Impacto: elimina saldo corrompido sob concorrência
Localização: Módulo Produtos · Arquivo `src/services/productService.js` · Função `adjustProductQuantity()` ·
             Endpoint `POST /products/:id/adjust` · Tabela `Produto`
Diagnóstico: a função lê `quantidade`, calcula `novo = atual - qtd` em memória e grava o valor absoluto.
             Duas requisições simultâneas leem o mesmo valor e uma sobrescreve a outra. [VERIFICADO, linhas 40-58]
Passo a passo: 1) trocar update absoluto por update condicional atômico; 2) tratar 0 linhas afetadas como
               "estoque insuficiente"; 3) adicionar CHECK (quantidade >= 0); 4) teste de concorrência (20 vendas paralelas).
Lacunas remanescentes: não cobre idempotência (cliente que repete a mesma venda gera 2 baixas) — ver I9.
```

## 2.2 Visão geral e inventário (`01_…`)
Seções: **Identificação** (nome, objetivo, problema, público) · **Funcionalidades principais** · **Tecnologias e versões** · **Nível adotado** (justificativa, evidências, incertezas) · **Arquitetura identificada** (diagrama Mermaid do sistema *existente*) · **Pontos de entrada** · **Árvore real de diretórios** com tabela `caminho | finalidade | relevância | analisado?` · **Exclusões justificadas** · **Inventário de módulos**.

## 2.3 Módulo (`02_…`)

```markdown
## Módulo: <nome> — `caminho/`
**Responsabilidade:** …  **Regra de negócio que implementa:** …  **Problema que resolve:** …
**Depende de:** … · **É usado por:** …
**Submódulos:** controllers | services | repositories | models | rotas | validators | utils | middlewares | jobs | UI…
**Arquivos:** (um bloco 2.4 por arquivo)
**Chamadas para outros módulos:** `esteModulo#função → outroModulo#função` (lista)
**Diagrama de dependências:** (Mermaid)
```

## 2.4 Arquivo e função

```markdown
### Arquivo: `caminho/arquivo.ext`
Finalidade: … · Exporta: … · Importa (interno/externo): …

#### Função: `nomeDaFuncao(param1, param2, opcoes?)`
- **O que faz:** …
- **Parâmetros:** `param1` (tipo, obrigatório, origem: body|query|params|header|outra função) · …
- **Validações:** …
- **Chama (mesmo módulo):** `outraFuncao()` …
- **Chama (outros módulos):** → `modulo/arquivo#funcao` (para quê)
- **É chamada por:** …
- **Banco/integrações:** tabela, operação (leitura/escrita), serviço externo
- **Efeitos colaterais:** logs, arquivos, eventos, e-mails, cache
- **Retorno:** estrutura · **Erros possíveis:** código HTTP / exceção
```
*Funções auxiliares (utils, validators, helpers) também entram quando influenciam o comportamento.*

## 2.5 Endpoint (`03_…`)

```markdown
### `VERBO /rota` — <o que faz em uma frase>
Arquivo da rota: … · Handler: `controller#funcao`
Acesso: público | autenticado | papéis: … · Middlewares (em ordem): …
Entrada: path … · query … · headers … · body (campo: tipo, obrigatório, validação)
Cadeia real: rota → middleware → controller → service → (repository) → tabela/integração
Banco: tabelas e operações · Integrações/eventos/jobs: …
Saída: status e estrutura · Erros possíveis: 400/401/403/404/409/422/500 — quando cada um ocorre
Observações [PROBLEMA]: N+1? paginação? payload? validação? exposição de dados? idempotência?
Consumido por: telas/serviços que chamam esta rota
```

## 2.6 Entidade (`04_…`)

```markdown
### Entidade: `Nome` — tabela `nome`
O que representa: … · Por que existe / por que está separada (ou mesclada): …
| Campo | Tipo | Obrig. | Default | Constraint/Índice | Por que existe |
Relacionamentos: 1:N …, ON DELETE: …
Usada por: módulos/funções
Avaliação: normalização · redundância · integridade · crescimento · leitura × escrita
**Decisão:** MANTER | MODIFICAR — justificativa técnica
```

## 2.7 Consulta problemática

```markdown
### Consulta — `arquivo#função` (endpoint: …)
Tabelas: … · Consulta atual: (trecho) · Problema: [N+1 | scan | sem projeção | memória | …]
Estratégia: … · Proposta: (SQL/ORM) · Índices (com o custo nas escritas): …
Uso de View/Materialized View: sim/não, por quê (frequência de leitura, tolerância a atraso, custo de refresh)
Como medir: `EXPLAIN (ANALYZE, BUFFERS)` antes e depois; contagem de queries por requisição; p95 da rota
```

## 2.8 Jornada de uso (`05_…`)

```markdown
## Jornada: <nome> — Perfil: <ADMIN | gerente | operador | visitante…>
Objetivo do usuário: …
| # | Ação do usuário | Tela/componente | Endpoint | Função(ões) | Tabelas | O que o usuário vê / estado que muda |
Caminhos alternativos e de erro: (senha errada, sem permissão, item inexistente, conexão lenta…)
Diferenças entre perfis: …
Diagrama: (Mermaid sequenceDiagram)
```
*Exemplo de forma:* usuário informa login e senha → é direcionado à tela inicial → vê suas tarefas, com as pendentes sinalizadas → entra no workspace da tarefa → analisa e resolve ou adiciona observação.

## 2.9 Regra de negócio (`06_…`)

```markdown
### RN-001 — <título>
Regra (linguagem natural): "Somente o administrador e o dono da tarefa podem modificá-la."
Perfis: … · Onde é aplicada: `arquivo#função` · Camada: UI | API | Banco
Exceções: … · Teste que cobre: sim (arquivo) | não
Lacunas: aplicada só na interface? brecha por concorrência? conflito com outra regra? documentada mas inexistente?
```

## 2.10 Registro de progresso (`00_…`)

```markdown
| Etapa | Status | Entrega | Data |
Módulos analisados: … · Arquivos: X analisados / Y excluídos / Z pendentes
Endpoints documentados: X/Y · Models: X/Y
Melhorias identificadas: lista de IDs · Lacunas e dúvidas: …
Próxima ação: …
```

## 2.11 Diagnóstico e performance (`07_…`)
Seções: **Problemas por módulo** (descrição, evidência, arquivo/função, causa, impacto, severidade) · **Verificação do Catálogo (Prompt, seção 6)** com `B1…A8` marcados · **Performance por inferência** (hipóteses rotuladas, "o que o usuário sente → por quê → como melhorar") · **Medição** (se executada: ambiente, ferramenta, volume de dados; tabela `rota | p50 | p95 | pior | erro | classe`; frio × quente; concorrência; limitações) · **Dados a coletar em produção**.

Classes de resposta sugeridas (confirmar fonte antes de citar): `instantâneo (~0,1 s)` · `fluido (~1 s)` · `atenção` · `risco de abandono (~3 s)` · `crítico (~10 s)`; referência: Nielsen Norman Group, *Response Times: The 3 Important Limits*; Google Web Vitals. `[REF. EXTERNA — conferir números na fonte]`

## 2.12 Arquitetura e system design (`09_…`)

```markdown
## Arquitetura atual (diagrama Mermaid — só o que existe)
## Arquitetura recomendada (diagrama — separado do atual)
## Decisões, por nível. Para cada tecnologia/padrão:
| Item | Veredito (Necessário agora / Prematuro / Inadequado) | Problema concreto que o justifica | Evidência | Custo/risco |
Itens por nível: LOW (camadas, padronização) · MEDIUM (cache, filas, pooling, rate limit, observabilidade) ·
HARD (DNS, CDN, proxy, load balancer, escala vertical × horizontal, réplicas, sharding, mensageria, DR, tracing)
## Vertical × Horizontal: quando cada uma serve (ver H4)
## Dados a coletar antes de decidir (se não houver métricas)
```

## 2.13 Plano consolidado (`10_…`)

```markdown
Fase A (críticas) → B (estrutura) → C (banco/performance) → D (cache/processamento) → E (escala/infra) → F (confiabilidade)
| Ordem | MEL-ID | Depende de | Arquivos/funções | Migrations | Testes | Risco | Critério de conclusão | Rollback |
```

## 2.14 Análise de produto (`12_…`, opcional)
Siga o Anexo A do Prompt. Estrutura: Identidade · Funcionalidades (com estado) · Endpoints em linguagem simples · Desempenho (rotulado) · Maturidade · Valor · Mercado e concorrentes (com fonte e data) · Pontos fortes e oportunidades · Síntese executiva.

---

# PARTE 3 — CATÁLOGO DE FALHAS E CORREÇÕES (do básico ao avançado)

Cada item: **Sintoma → Por que acontece → Como detectar → Antes → Depois → Como prevenir → Lacunas típicas da correção → Teste.**
Os IDs (B/I/A) são os mesmos do Catálogo de Verificação do Prompt.

---

## NÍVEL 1 — BÁSICO (LOW): correções que todo projeto precisa

### B1 · Segredos em logs, código ou respostas
- **Sintoma:** `JWT_SECRET`, senha/URL de banco ou chaves de API aparecem em logs, no repositório ou em mensagens de erro.
- **Por que acontece:** `console.log` de depuração esquecido; `.env` versionado; erros que devolvem a configuração.
- **Como detectar:** buscar `log(process.env`, `print(os.environ`, `.env` no histórico do git, chaves em arquivos de exemplo, strings de conexão em código.
- **Antes:**
```javascript
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
```
- **Depois:**
```javascript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.warn('JWT_SECRET ausente ou curto');           // nunca o valor
}
logger.info({ dbConfigured: Boolean(process.env.DATABASE_URL) });
```
- **Prevenir:** logs estruturados com *redaction* de campos sensíveis; `.env` no `.gitignore`; segredos em cofre do provedor; *secret scanning* no CI.
- **⚠ Lacunas típicas:** **remover o log não invalida o segredo já exposto.** É obrigatório **rotacionar** o segredo (trocar a senha do banco; trocar o `JWT_SECRET`, o que invalida os tokens emitidos) e **purgar/restringir o acesso aos logs antigos**. Verificar também o histórico do git e os logs já enviados a ferramentas externas.
- **Teste:** subir a aplicação com valores sentinela e confirmar que nenhum aparece na saída; rodar scanner de segredos.

### B2 · Escalada de privilégio por *mass assignment*
- **Sintoma:** qualquer visitante cria conta com papel de administrador enviando `{"role":"ADMIN"}` em uma rota pública.
- **Por que acontece:** o código usa diretamente o corpo da requisição (`...req.body`) ou desestrutura campos de autorização vindos do cliente.
- **Como detectar:** em cada rota de criação/atualização, listar quais campos são aceitos; procurar `role`, `isAdmin`, `permissions`, `status`, `ownerId`, `saldo`, `preco` vindos de `req.body`.
- **Antes:**
```javascript
async function register({ nome, email, senha, role }) {
  return db.user.create({ data: { nome, email, senha: hash(senha), role: role || 'OPERADOR' } });
}
```
- **Depois:**
```javascript
async function register({ nome, email, senha }) {          // role NÃO é aceito
  const emailNorm = email.trim().toLowerCase();
  return db.user.create({ data: { nome: nome.trim(), email: emailNorm, senha: await hash(senha), role: 'OPERADOR' } });
}
```
- **Prevenir:** *allowlist* explícita de campos por rota (schema de validação que rejeita campos extras); papéis privilegiados só por rota administrativa protegida.
- **⚠ Lacunas típicas:** (1) a rota **autenticada** de edição de perfil também pode aceitar `role` — verificar; (2) se o papel está **dentro do token**, mudar o papel de alguém só vale após o token expirar — definir expiração curta/revogação; (3) e-mail normalizado no cadastro precisa ser normalizado **também no login** e a unicidade deve ser garantida no banco (índice único, idealmente case-insensitive), senão contas antigas com maiúsculas deixam de logar e dois cadastros simultâneos passam pela checagem (ver I8); (4) falta *rate limit* no cadastro (I10).
- **Teste:** `POST` público com `role:"ADMIN"` → conta criada com o papel padrão; `PUT /perfil` com `role` → ignorado ou 400.

### B3 · Autorização ausente, só no frontend ou inconsistente com a interface
- **Sintoma:** (a) usuário comum acessa rota administrativa digitando a URL; (b) usuário acessa dados de **outro** usuário trocando um ID (IDOR); (c) tela quebra com **403** porque a interface chama uma rota que o perfil não pode usar.
- **Por que acontece:** esconder o botão não protege a API; permissões do frontend e do backend evoluem separadas.
- **Como detectar:** montar a **matriz perfil × endpoint** a partir do código das rotas e cruzar com o que cada tela chama; testar cada rota sem token e com token de perfil menor; para toda rota com `:id`, verificar se confere dono/escopo.
- **Antes:** tela de histórico chamava `GET /users` (somente ADMIN) para montar um filtro → **403** para os demais perfis.
- **Depois:** criar/usar rota enxuta `GET /users/names` (todos os perfis autenticados) devolvendo **só** `id` e `nome`; frontend passa a usá-la.
- **Prevenir:** autorização como *middleware* por rota + verificação de propriedade no service; matriz de permissões versionada e testada.
- **⚠ Lacunas típicas:** **ampliar a permissão de uma rota exige revisar o que ela expõe** (a rota nova não pode devolver e-mail, papel ou dados pessoais sem necessidade). Ainda checar IDOR em todas as rotas com ID.
- **Teste:** testes automatizados da matriz (cada perfil × cada rota → esperado 200/403); tentativa de ler/alterar recurso de outro usuário → 403/404.

### B4 · Validação e sanitização de entrada
- **Sintoma:** campos vazios, e-mail malformado, quantidade ou preço negativo, texto gigante, tipos errados chegam ao banco.
- **Por que acontece:** o código só confere se o campo "existe".
- **Como detectar:** para cada endpoint, comparar campos aceitos × validação aplicada; testar com `null`, `""`, número negativo, `NaN`, array no lugar de string, string de 1 MB.
- **Antes:** `if (!req.body.preco) ...`
- **Depois:** validação por schema no limite da API (tipo, formato, mínimo/máximo, tamanho, campos extras proibidos):
```javascript
const schema = z.object({
  nome: z.string().trim().min(1).max(120),
  preco: z.number().nonnegative().max(1e9),
  quantidade: z.number().int().nonnegative(),
}).strict();
```
- **Prevenir:** schema único por rota; mesma regra no frontend **para UX** e no backend **para segurança**.
- **⚠ Lacunas típicas:** validar formato ≠ validar regra (ex.: "quantidade ≥ 0" no middleware genérico mas "> 0" na operação específica — manter coerência); validação genérica por **nome de campo** (`preco`, `email`) em todo o sistema é frágil, prefira schema por rota; validar **upload** (tipo real, tamanho, nome); validar também o que vem de `query` e `params`; regex de e-mail só filtra o grosseiro, a confirmação real é por e-mail de verificação.
- **Teste:** tabela de entradas inválidas por endpoint → todas 400 com mensagem clara, nenhuma 500.

### B5 · Tratamento de erros fora do padrão central
- **Sintoma:** algumas rotas respondem `res.status(...).json(...)` diretamente; erros diferentes têm formatos diferentes; métricas e logs perdem falhas; stack trace vaza ao cliente.
- **Como detectar:** buscar respostas de erro diretas em middlewares/controllers; verificar se existe *handler* global e se é o único ponto que formata erros.
- **Antes:** middleware de papel faz `return res.status(403).json({ message: 'Acesso negado' })`.
- **Depois:** `next(new AppError('Acesso negado', 403))` e um único *error handler* que loga (com ID da requisição), mapeia códigos conhecidos e responde mensagem segura; erro inesperado → 500 genérico.
- **Prevenir:** hierarquia de erros de domínio; nenhum `res.status` de erro fora do handler.
- **⚠ Lacunas típicas:** em frameworks que não capturam erros de funções `async` automaticamente, é preciso um *wrapper* (ou versão do framework que o faça), senão a requisição pendura; padronize o **contrato de erro** (`{ code, message, details }`) e documente.
- **Teste:** forçar cada tipo de erro e conferir formato, status, log e ausência de stack no corpo.

### B6 · Exclusão/atualização que viola integridade e retorna 500
- **Sintoma:** excluir categoria, fornecedor ou produto que tem registros vinculados dá "Erro interno" (violação de chave estrangeira); cadastrar nome duplicado também dá 500 (violação de unicidade).
- **Por que acontece:** o banco protege, mas o código não traduz a falha em resposta de negócio.
- **Como detectar:** para cada `DELETE`, listar as FKs que apontam para a tabela e o `ON DELETE` de cada; para cada campo único, ver se a criação trata a duplicidade.
- **Antes:** `return db.categoria.delete({ where: { id } })` direto.
- **Depois (verificação prévia amigável):**
```javascript
const cat = await db.categoria.findUnique({ where: { id }, include: { _count: { select: { produtos: true } } } });
if (!cat) throw new AppError('Categoria não encontrada', 404);
if (cat._count.produtos > 0)
  throw new AppError(`Não é possível excluir "${cat.nome}": há ${cat._count.produtos} produto(s) vinculado(s).`, 409);
return db.categoria.delete({ where: { id } });
```
- **Prevenir:** decidir por entidade a política (bloquear, *soft delete*, cascata) e documentá-la como regra de negócio.
- **⚠ Lacunas típicas:** **a verificação prévia sozinha é uma corrida** (entre o `count` e o `delete` alguém pode vincular um produto) — **mantenha o tratamento do erro do banco** como rede de proteção (capturar o código de violação de FK/unicidade e converter em 409). Para histórico/auditoria prefira **soft delete** (`deletedAt`/`ativo=false`) a bloquear para sempre. Use 409 (conflito) em vez de 400 quando a ação é válida mas conflita com o estado.
- **Teste:** excluir com e sem filhos; criar duplicado; duas operações simultâneas (vincular e excluir).

### B7 · Autoexclusão e remoção do último administrador
- **Sintoma:** o sistema pode ficar sem nenhum administrador (conta apagada, rebaixada ou desativada).
- **Depois:**
```javascript
if (requestingUserId === targetId) throw new AppError('Você não pode excluir a própria conta', 409);
if (user.role === 'ADMIN' && (await db.user.count({ where: { role: 'ADMIN' } })) <= 1)
  throw new AppError('Não é permitido remover o único administrador', 409);
```
- **⚠ Lacunas típicas:** a mesma proteção vale para **rebaixar** o papel e **desativar** a conta, não só excluir; a checagem "contar e depois excluir" tem corrida (dois admins se excluindo ao mesmo tempo) — faça dentro de uma transação com bloqueio ou como operação condicional; definir procedimento de **recuperação** (acesso de emergência) para o caso de perda de acesso.
- **Teste:** excluir/rebaixar/desativar o único admin → bloqueado; dois admins excluindo-se simultaneamente → ao menos um permanece.

### B8 · Frontend que quebra com estado nulo (tela branca)
- **Sintoma:** ao recarregar a página ou após logout, a aplicação inteira some com `Cannot read properties of null`.
- **Por que acontece:** o componente lê `user.nome` antes de o estado de autenticação ser carregado/hidratado.
- **Como detectar:** buscar acesso a propriedades de objetos que começam `null` (`user.`, `data.`); testar recarregar cada página e deslogar em cada tela.
- **Depois (curativo):** `{user?.nome ?? 'Usuário'}`.
- **Depois (correção de causa):** **estado explícito de autenticação** (`carregando | autenticado | anônimo`), *guarda de rota* que só renderiza telas privadas quando autenticado, e **Error Boundary** para que uma falha de componente não derrube a tela inteira.
- **⚠ Lacunas típicas:** *optional chaining* espalhado esconde o sintoma e produz telas com dados falsos ("Usuário", "OPERADOR" como padrão pode **exibir um papel que a pessoa não tem**); trate também loading, erro e estado vazio; token expirado deve redirecionar ao login.
- **Teste:** recarregar com e sem sessão; limpar o armazenamento; simular API fora do ar.

### B9 · Cliente HTTP único
- **Sintoma:** telas montam `fetch` manualmente; cabeçalho de autenticação, tratamento de 401 e mensagens de erro divergem.
- **Depois:** um módulo de API com `get/post/put/patch/delete` e variantes de *multipart* (upload), que injeta o token, trata 401 (logout/refresh), normaliza erros e aplica *timeout*.
- **Prevenir:** regra de lint que proíbe `fetch` direto fora do módulo de API.
- **⚠ Lacunas típicas:** em upload (`FormData`) **não** defina `Content-Type` manualmente (o navegador precisa gerar o *boundary*); o método novo não ajuda se os componentes antigos não forem migrados — faça a varredura; definir *timeout* e cancelamento.
- **Teste:** buscar `fetch(` fora do cliente → zero ocorrências; 401 simulado → logout correto.

### B10 · Listagens sem paginação
- **Sintoma:** a resposta cresce com a tabela; tela e servidor ficam lentos com o tempo.
- **Depois:** paginação obrigatória com limite máximo imposto no servidor; ordenação estável; para tabelas grandes ou muito alteradas, paginação por **cursor** em vez de `OFFSET`.
- **⚠ Lacunas típicas:** `OFFSET` alto fica lento; sem ordenação determinística há itens repetidos/perdidos entre páginas; contagem total (`COUNT(*)`) em tabela grande também custa.
- **Teste:** `limit` absurdo é truncado; páginas não repetem itens.

### B11 · Higiene de autenticação
- Hash de senha com algoritmo adequado e custo configurável (bcrypt/argon2/scrypt); tokens com **expiração**; mensagens de login que **não revelam** se o e-mail existe; CORS restrito às origens reais; cabeçalhos de segurança; cookies `HttpOnly/Secure/SameSite` se aplicável.
- **⚠ Lacunas típicas:** `bcrypt` com custo 10 pode estar defasado conforme o hardware; token em `localStorage` fica exposto a XSS; não há revogação de sessão sem uma lista/versão de token; sem *rate limit* e bloqueio progressivo (I10) o login sofre força bruta.

---

## NÍVEL 2 — INTERMEDIÁRIO (LOW → MEDIUM): consistência e eficiência dos dados

### I1 · Condição de corrida (*lost update*) em saldos, estoques e contadores
- **Sintoma:** dois usuários vendem o mesmo item ao mesmo tempo e o saldo final está errado ou negativo.
- **Por que acontece:** padrão **ler → calcular na aplicação → gravar o valor absoluto**. Ambos leem 5, ambos calculam 5−3=2, ambos gravam 2 (deveria ser −1 ou bloqueio).
- **Como detectar:** buscar qualquer `findX` seguido de `update` com valor calculado em memória (`quantidade`, `saldo`, `contador`, `estoque`, `likes`).
- **Antes:**
```javascript
const p = await db.produto.findUnique({ where: { id } });
await db.produto.update({ where: { id }, data: { quantidade: p.quantidade - qtd } });   // absoluto
```
- **Depois (recomendada) — atualização condicional atômica, decidida pelo banco:**
```javascript
await db.$transaction(async (tx) => {
  const r = await tx.produto.updateMany({
    where: { id, quantidade: { gte: qtd } },          // só baixa se houver saldo
    data:  { quantidade: { decrement: qtd } },        // UPDATE ... SET quantidade = quantidade - $1
  });
  if (r.count === 0) throw new AppError('Estoque insuficiente ou produto inexistente', 409);
  await tx.movimento.create({ data: { produtoId: id, quantidade: qtd, tipo: 'VENDA', usuarioId } });
});
```
```sql
-- Rede de proteção no banco (migration):
ALTER TABLE "Produto" ADD CONSTRAINT quantidade_nao_negativa CHECK (quantidade >= 0);
```
- **Alternativas:** `SELECT ... FOR UPDATE` dentro da transação; isolamento `SERIALIZABLE` com *retry*; bloqueio otimista com coluna `versao`.
- **Prevenir:** nunca gravar valor derivado de uma leitura anterior; usar operadores atômicos (`increment/decrement`) e constraints.
- **⚠ Lacunas típicas:** **uma transação interativa que faz "ler → checar → gravar absoluto" NÃO elimina a corrida** no nível de isolamento padrão (`READ COMMITTED` no PostgreSQL): as leituras não se bloqueiam. A transação garante atomicidade entre as escritas, não exclusão entre as leituras. Também faltam: **idempotência** (I9), tratamento de *deadlock/serialization failure* com *retry*, e **teste de concorrência real**.
- **Teste:** 20–50 requisições paralelas contra saldo 10 → exatamente 10 sucessos e saldo final 0; nunca negativo. (Script com `Promise.all`/`k6`.)

### I2 · Operação multi-passo sem transação
- **Sintoma:** cria o movimento mas falha ao atualizar o saldo (ou o inverso); dados ficam inconsistentes.
- **Depois:** todas as escritas que precisam "ou todas ou nenhuma" dentro de **uma** transação; chamadas externas (e-mail, pagamento) **fora** da transação ou via *outbox* (A2).
- **⚠ Lacunas típicas:** a forma de transação **em lote** (`$transaction([a, b])`) não permite usar o resultado de `a` em `b` nem lógica condicional; transação longa segura conexões e bloqueios — mantenha-a curta.

### I3 · N+1 consultas
- **Sintoma:** para 50 itens, a rota faz 1 + 50 (ou 1 + 3×50 = 151) consultas ao banco.
- **Como detectar:** `await` dentro de `map/for` que consulta o banco; log de consultas por requisição; APM.
- **Antes:**
```javascript
const stats = await db.movimento.groupBy({ by: ['usuarioId'], _count: true });
const out = await Promise.all(stats.map(async s => ({
  usuario: await db.usuario.findUnique({ where: { id: s.usuarioId } }),   // +1
  venda:   await db.movimento.aggregate({ /* ... */ }),                   // +1
  repos:   await db.movimento.aggregate({ /* ... */ }),                   // +1
})));
```
- **Depois (uma consulta agregada):**
```sql
SELECT u.id, u.nome, u.email,
       COUNT(m.id)::int AS total,
       COALESCE(SUM(CASE WHEN m.tipo='VENDA'     THEN m.quantidade END),0)::int AS vendas,
       COALESCE(SUM(CASE WHEN m.tipo='REPOSICAO' THEN m.quantidade END),0)::int AS reposicoes
FROM "Usuario" u
JOIN "Movimento" m ON m."usuarioId" = u.id
GROUP BY u.id, u.nome, u.email
ORDER BY total DESC;
```
- **Alternativas:** `include`/`JOIN` com projeção; carregar IDs em lote (`WHERE id IN (...)`) e montar em memória (*DataLoader*).
- **⚠ Lacunas típicas:** o `JOIN` (interno) **omite usuários sem movimentos** — confirmar se a regra de negócio os quer na lista (usar `LEFT JOIN`); SQL cru exige conferir nomes reais de tabela/coluna e **nunca concatenar entrada do usuário** (use parâmetros/*tagged template*); sem índice em `Movimento(usuarioId)` o ganho pode ser menor; medir `EXPLAIN` antes e depois, e **não afirmar ganho sem medição**.
- **Teste:** contar consultas por requisição antes/depois (deve ser constante, não proporcional ao nº de itens).

### I4 · Agregação feita em memória
- **Antes:** `findMany` de todos os produtos e `reduce` para somar `preco × quantidade`.
- **Depois:** `SELECT COALESCE(SUM(preco * quantidade), 0) FROM "Produto"` (ou `aggregate`/`groupBy` do ORM).
- **⚠ Lacunas típicas:** o ganho só aparece com volume; com milhões de linhas até a soma no banco pode precisar de **coluna pré-calculada, Materialized View ou cache** (A1); atenção aos **tipos numéricos**: `SUM` sobre inteiros pode exceder o intervalo (usar `bigint`/`numeric`) e o driver devolve `bigint/numeric` como *string* — converter com cuidado (ver I7).
- **Teste:** comparar resultado novo × antigo num conjunto de dados de teste; medir tempo.

### I5 · Consulta sem projeção
- **Sintoma:** a rota carrega tabelas inteiras com todas as colunas e relações aninhadas (até campos sensíveis) para usar três campos.
- **Depois:** `select` apenas do necessário em todos os níveis; remover `include` profundo; criar DTO/serializador de resposta.
- **⚠ Lacunas típicas:** projeção reduz tráfego, **não elimina** a necessidade de agregar no banco quando a soma pode ser feita lá (I4); sem DTO, uma mudança futura no model volta a vazar campos; **nunca** devolver hash de senha (conferir `sanitizeUser`).
- **Teste:** inspecionar o corpo da resposta e o tamanho do payload.

### I6 · Índices
- **Regra:** crie índice **somente** quando houver padrão de acesso que o justifique: colunas em `WHERE`, `JOIN`, `ORDER BY` de consultas frequentes (inclusive FKs, que muitos bancos não indexam automaticamente).
- **Como decidir:** `EXPLAIN (ANALYZE, BUFFERS)` mostrando *Seq Scan* em tabela grande; consulta lenta registrada; ordem das colunas em índices compostos seguindo o filtro mais seletivo/ordenação.
- **⚠ Lacunas típicas:** todo índice **encarece escritas** e ocupa espaço; índices redundantes (`(a)` e `(a,b)`); índice em coluna de baixa seletividade raramente ajuda; em tabela grande, criar com `CREATE INDEX CONCURRENTLY` para não travar escritas; índices **parciais** e **de expressão** (`lower(email)`) resolvem casos específicos.
- **Teste:** plano antes/depois; tempo da consulta e da escrita.

### I7 · Dinheiro e quantidade em ponto flutuante
- **Sintoma:** somas com centavos errados (`0.1 + 0.2`), totais divergentes entre telas.
- **Depois:** armazenar em **inteiros (centavos)** ou `NUMERIC/DECIMAL` com escala definida; moeda explícita; arredondamento definido como regra de negócio.
- **⚠ Lacunas típicas:** migrar o tipo de uma coluna com dados existentes exige migração planejada; `Decimal` no ORM vira objeto/string no JSON — padronizar a serialização; o frontend não deve recalcular totais em `float`.

### I8 · "Checar e depois agir" (TOCTOU) sem proteção do banco
- **Sintoma:** duas requisições passam pela mesma verificação (e-mail disponível, vaga livre, último admin) e ambas executam.
- **Depois:** **constraints no banco** (único, `CHECK`, FK) como fonte da verdade; tratar o erro de violação e convertê-lo em resposta de negócio; para regras de contagem, operação condicional ou bloqueio.
- **Regra:** verificação na aplicação serve para a **mensagem amigável**; a **garantia** vem do banco.

### I9 · Idempotência
- **Sintoma:** clique duplo, *retry* automático do cliente ou do balanceador cria duas vendas/pagamentos/e-mails.
- **Depois:** o cliente envia uma **chave de idempotência** (`Idempotency-Key`); o servidor grava a chave com o resultado numa tabela com índice único e devolve o resultado salvo se repetida; alternativamente, chaves naturais únicas (nº do pedido).
- **⚠ Lacunas típicas:** definir validade da chave; a chave deve cobrir o **corpo** (mesma chave com corpo diferente = erro); operações *PUT/DELETE* já são idempotentes por natureza se bem projetadas; no frontend, desabilitar o botão durante o envio.

### I10 · Rate limiting em rotas sensíveis
- Login, cadastro, recuperação de senha, envio de e-mail, busca cara. Limite por IP **e** por conta; resposta `429` com `Retry-After`; bloqueio progressivo.
- **⚠ Lacunas típicas:** contador **em memória** não funciona com várias instâncias (precisa de armazenamento compartilhado, A5); atrás de proxy, configure corretamente o IP real do cliente (`X-Forwarded-For` confiável), senão todos parecem o mesmo IP.

### I11 · Testes das regras críticas
- Mínimo por módulo: testes de regra de negócio (RN-xxx), matriz de permissões, validação, erros esperados e **concorrência** nas operações de saldo. Testes de integração com banco real de teste. Cobrir primeiro o que causa dano (dinheiro, estoque, acesso).

---

## NÍVEL 3 — AVANÇADO (MEDIUM): escala e resiliência de aplicação

### A1 · Cache (somente com problema concreto)
- **Quando:** dado muito lido, pouco alterado e caro de calcular, com tolerância a pequena defasagem (ex.: lista de categorias, totais de dashboard).
- **Padrão cache-aside:** ler do cache → se faltar, ler do banco e gravar no cache com **TTL** → ao alterar o dado, **invalidar**.
```javascript
async function getDashboard() {
  const key = 'dashboard:v1';
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit);
  const data = await computeDashboard();
  await cache.set(key, JSON.stringify(data), { EX: 60 });   // TTL curto
  return data;
}
// ao registrar movimento: await cache.del('dashboard:v1')
```
- **Documentar para cada uso:** dado e chave · TTL · estratégia de invalidação · quem atualiza · risco de dado desatualizado · arquivos afetados.
- **⚠ Lacunas típicas:** **cache de dado por usuário/perfil precisa incluir isso na chave** (senão vaza dados entre usuários); *cache stampede* (muitas requisições recalculando ao expirar — usar trava ou *stale-while-revalidate*); invalidação esquecida em algum caminho de escrita; falha do cache não deve derrubar a rota (degradar para o banco); não cachear o que exige consistência forte (saldo para decidir venda).
- **Alternativas mais simples antes do Redis:** cache em memória do processo (se houver 1 instância), cabeçalhos HTTP (`Cache-Control`, `ETag`), coluna pré-calculada, Materialized View.
- **Teste:** acerto/erro de cache (*hit ratio*); alteração do dado reflete na leitura; comportamento com cache fora do ar.

### A1b · Materialized View
- **Quando:** agregação pesada, lida com muita frequência, que tolera defasagem.
```sql
CREATE MATERIALIZED VIEW mv_resumo_movimentos AS
SELECT date_trunc('day', criado_em) AS dia, tipo, SUM(quantidade) AS total
FROM "Movimento" GROUP BY 1, 2;
CREATE UNIQUE INDEX ON mv_resumo_movimentos (dia, tipo);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resumo_movimentos;   -- por job agendado
```
- **⚠ Lacunas típicas:** o dado fica **defasado** até o próximo *refresh* (aceitável? definir); `REFRESH` sem `CONCURRENTLY` bloqueia leituras; exige índice único para o modo concorrente; custo do *refresh* em tabelas grandes; precisa de um agendador.

### A2 · Trabalho pesado fora da requisição (jobs, workers, filas)
- **Quando:** relatórios longos, e-mails, processamento de arquivo, integrações lentas, tarefas que o usuário não precisa esperar.
- **Padrão:** a rota **enfileira** e responde `202 Accepted` com um identificador; um *worker* processa; a tela consulta o status ou recebe notificação.
- **Especificar:** produtor · evento/mensagem · broker · consumidor · payload · persistência · falhas · retentativas com *backoff* · **DLQ** (fila de mensagens mortas) · idempotência do consumidor.
- **⚠ Lacunas típicas:** a mensagem pode ser entregue **mais de uma vez** — o consumidor deve ser idempotente; "gravar no banco e publicar na fila" são duas operações: use o padrão **Outbox** para não perder/duplicar eventos; defina monitoramento do tamanho da fila e da idade da mensagem mais antiga; não crie fila onde um `await` simples resolve.

### A3 · Integrações externas resilientes
- **Obrigatório:** *timeout* (nunca esperar para sempre); *retry* com *backoff* exponencial e *jitter* **apenas para operações seguras de repetir**; **idempotência** em chamadas que alteram estado; *circuit breaker* quando a dependência falha em série; tratamento de erro e log com correlação; respeito a *rate limits*; segredos fora do código.
- **⚠ Lacunas típicas:** *retry* de pagamento/envio sem idempotência duplica a ação; *retry* em todas as camadas multiplica a carga (tempestade de retentativas); o *timeout* total da requisição deve ser menor que o do cliente/proxy.

### A4 · Pool de conexões e consultas lentas
- Defina tamanho máximo do pool coerente com o limite de conexões do banco **× número de instâncias**; em ambientes *serverless* ou com muitas instâncias use um *pooler* externo. Ative registro de consultas lentas e monitore.
- **⚠ Lacunas típicas:** aumentar o pool sem olhar o limite do banco piora; transações longas esgotam o pool; ausência de *timeout* de consulta deixa requisições presas.

### A5 · Estado no processo × escalar horizontalmente
- **Sintoma:** com 2+ instâncias, sessões "somem", *rate limit* e cache ficam inconsistentes, uploads em disco local não aparecem em outra instância.
- **Depois:** aplicação **stateless** — sessão em token assinado ou armazenamento compartilhado; arquivos em armazenamento de objetos; cache/contadores/filas em serviço compartilhado; tarefas agendadas rodando **uma vez** (trava distribuída ou processo dedicado).
- **⚠ Lacunas típicas:** *cron* dentro da aplicação roda N vezes com N instâncias; *websockets* exigem tratamento próprio ao balancear.

### A6 · Observabilidade
- **Logs estruturados** (JSON) com `requestId`/`traceId`, nível, rota, usuário (ID, nunca dados sensíveis), duração; **métricas**: taxa de requisições, taxa de erro, latência p50/p95/p99 por rota, saturação (CPU, memória, conexões, fila); **alertas** baseados em sintoma (erro/latência), não só em recurso; **tracing** quando houver mais de um serviço.
- **⚠ Lacunas típicas:** logar corpo de requisição vaza senhas/tokens (*redaction*); métrica sem alerta não acorda ninguém; sem **linha de base** não há como dizer que algo piorou — meça antes de otimizar.

### A7 · Operação segura
- **Health checks** (vivo × pronto); *graceful shutdown* (parar de aceitar, terminar o que está em andamento); **backups com restauração testada** (um backup nunca restaurado é uma hipótese); migrations versionadas, reversíveis e compatíveis com a versão anterior do código durante o deploy (*expand/contract*); *feature flags* para mudanças arriscadas.

---

## NÍVEL 4 — EMPRESARIAL (HARD): infraestrutura e sistemas distribuídos

> **Regra:** estes itens só entram no plano quando há **requisito ou métrica** que os justifique. Para cada um, o relatório deve dizer: **Necessário agora / Prematuro / Inadequado** e o porquê.

### H1 · DNS e entrada de tráfego (como a requisição chega)
Fluxo: **usuário → resolução de DNS → (CDN) → (proxy/gateway) → (balanceador) → instâncias → banco/cache/filas**.
- **DNS:** registros `A/AAAA` (IP), `CNAME` (apelido de outro nome), subdomínios por função (`app.`, `api.`, `cdn.`), **TTL** (baixo facilita trocar/failover, alto reduz consultas), DNS com *health check*/*failover* quando há mais de uma região.
- **CDN:** para estáticos (JS/CSS/imagens) e, se couber, respostas públicas cacheáveis; reduz latência e carga da origem.
- **TLS:** certificados, renovação automática, versão mínima do protocolo, HSTS.
- **⚠ Lacunas típicas:** TTL alto atrapalha o *failover*; cache de CDN em rotas autenticadas vaza dados; certificado expirado derruba tudo — automatizar e alertar.

### H2 · Reverse proxy / API gateway
- **Funções:** terminação TLS, roteamento por caminho/host, compressão, limites de tamanho e de taxa, cabeçalhos de segurança, cache de respostas públicas, autenticação centralizada (gateway).
- **Quando faz sentido:** múltiplas aplicações/serviços sob um domínio, necessidade de TLS e limites na borda, desacoplar a aplicação da internet. **Inadequado** quando há uma única aplicação e a plataforma de hospedagem já oferece isso.
- **⚠ Lacunas típicas:** a aplicação deve confiar no IP real repassado pelo proxy só quando vem dele; limites do proxy (tamanho de corpo, *timeouts*) precisam ser coerentes com os da aplicação (upload grande, rotas lentas).

### H3 · Load balancer
- **L4** (TCP, rápido, sem conhecer HTTP) × **L7** (HTTP, roteia por caminho/cabeçalho, mais recursos).
- **Algoritmos:** *round-robin*, menos conexões, *hash* por IP/cabeçalho. **Health checks** retiram instâncias doentes. *Sticky sessions* só se a aplicação **não** for stateless (preferir eliminar a necessidade, A5).
- **⚠ Lacunas típicas:** balancear sem *health check* envia tráfego a instâncias mortas; o próprio balanceador é ponto único de falha (usar o serviço gerenciado/redundante); *retry* do balanceador sem idempotência duplica operações (I9); *deploy* sem *connection draining* derruba requisições em andamento.

### H4 · Escalabilidade vertical × horizontal

| Aspecto | **Vertical** (mais CPU/RAM na mesma máquina) | **Horizontal** (mais instâncias) |
|---|---|---|
| Complexidade | Baixa — nada muda na aplicação | Maior — exige aplicação stateless e balanceador |
| Limite | Teto de hardware; custo cresce mais que linear | Praticamente maior, limitado por banco e dependências |
| Disponibilidade | Ponto único de falha | Tolera perda de instâncias |
| Indisponibilidade ao escalar | Geralmente há reinício | Sem parada (com *rolling deploy*) |
| Quando escolher | Primeiro passo barato; gargalo claro de CPU/memória; **o banco** costuma escalar assim primeiro | Tráfego crescente, necessidade de alta disponibilidade, picos |
| Armadilhas | Esconde gargalos de código/consulta | Escalar a aplicação **sem olhar o banco** só move o gargalo |

**Orientação:** meça primeiro (qual recurso satura?). Corrija consultas e N+1 antes de adicionar máquinas. Escale a aplicação horizontalmente quando ela for *stateless*; o banco costuma escalar verticalmente + réplicas de leitura antes de *sharding*.

### H5 · Banco de dados em escala
- **Réplicas de leitura:** aliviam consultas pesadas; ⚠ **atraso de replicação** (o usuário grava e não vê o dado na réplica) — ler do primário logo após escrita quando necessário.
- **Particionamento/Sharding:** só quando uma tabela/instância não cabe mais ou há requisito de isolamento; ⚠ complica transações, junções e relatórios; geralmente **prematuro**.
- **CQRS / Event Sourcing / Database-per-service:** justificar por requisito; ⚠ introduz consistência eventual e complexidade operacional.

### H6 · Confiabilidade distribuída
*Circuit breaker, bulkhead (isolar recursos por dependência), timeouts em cascata coerentes, retry com backoff, DLQ, outbox, saga (transações distribuídas com compensação), failover, DR (RPO/RTO definidos e testados).*
- **⚠ Lacunas típicas:** meta de disponibilidade sem **SLO medido** é só desejo; DR nunca testado não existe; mais componentes = mais pontos de falha — cada peça nova precisa de dono, monitoramento e plano de falha.

---

# PARTE 4 — MATRIZ CONSOLIDADA DE FALHAS (template e regras)

```markdown
| ID | Classe (B/I/A) | Área | Arquivo/Função | Falha | Severidade | Impacto | Status | Evidência da verificação |
```

**Status permitidos e regra de uso:**
- `ABERTO` — identificado, sem correção.
- `PARCIAL` — corrigido o sintoma, **mas há lacuna remanescente** listada na própria linha (ex.: log removido, segredo não rotacionado).
- `CORRIGIDO` — **só** com evidência: teste automatizado, execução reproduzível ou revisão de código com a lacuna típica checada. *Sem evidência, o status máximo é `PARCIAL`.*
- `ACEITO` — risco aceito, com justificativa e responsável.
- `NÃO VERIFICÁVEL` — faltou acesso; descrever como verificar.

**Quadro de lacunas recorrentes (revisar em toda correção declarada como "feita")**

| Correção declarada | Lacuna que costuma ficar |
|---|---|
| Removeu `console.log` de segredo | Segredo não rotacionado; logs antigos retidos; histórico do git |
| Fixou papel no cadastro público | Rota de edição de perfil ainda aceita papel; papel em token longo; e-mail sem normalizar no login; sem índice único; sem rate limit |
| Transação interativa em saldo | Corrida persiste em `READ COMMITTED`; falta update atômico/CHECK/idempotência/teste de concorrência |
| `_count` antes de excluir | Corrida entre checar e excluir; falta tratar erro de FK; falta soft delete para histórico |
| Bloqueou exclusão do último admin | Rebaixar/desativar ainda possível; corrida entre dois admins |
| `select` em vez de `include` | Continua somando em memória; falta DTO; sem paginação |
| Agregação no SQL | `JOIN` interno omite registros sem dados; tipos `bigint/numeric`; sem índice de apoio; sem medição |
| `user?.prop` no React | Papel/nome falso exibido por padrão; sem guarda de rota; sem Error Boundary |
| Rota nova para perfis menores | Rota expõe campos além do necessário; IDOR em rotas com ID |
| Validação genérica por nome de campo | Regras divergentes entre rotas; ausência de schema por rota; `query/params` e uploads sem validação |
| Handler de erro central | `async` sem captura; contrato de erro não padronizado |
| `putFormData`/cliente único | Componentes antigos não migrados; `Content-Type` manual em upload |
| Cache adicionado | Chave sem escopo de usuário; sem invalidação em todos os caminhos de escrita; *stampede* |
| Fila adicionada | Consumidor não idempotente; sem DLQ; sem outbox |
| Balanceador adicionado | Aplicação não é stateless; sem health check; *retry* sem idempotência |

---

# PARTE 5 — REGRAS DE PREVENÇÃO (para qualquer funcionalidade nova)

Checklist por rota, tela ou módulo novo:

**Segurança**
- [ ] Nenhum segredo em log, código, resposta ou repositório; segredos rotacionados após exposição.
- [ ] Campos aceitos por *allowlist*; nenhum papel/permissão/saldo/preço vindo do cliente sem autorização explícita.
- [ ] Autorização no backend (papel **e** propriedade do recurso); matriz perfil × rota testada.
- [ ] Rotas sensíveis com *rate limit*.

**Dados e consistência**
- [ ] Entrada validada por schema (tipo, formato, limites, campos extras).
- [ ] Alteração de saldo/contador usa operação **atômica** + constraint; teste de concorrência.
- [ ] Operações multi-passo em transação; efeitos externos fora da transação (ou *outbox*).
- [ ] Toda exclusão define política (bloquear/soft delete/cascata), trata violações do banco e responde 409 amigável.
- [ ] Unicidade e regras críticas garantidas por **constraint**, não só por checagem.
- [ ] Dinheiro em inteiro/decimal, nunca em *float*.
- [ ] Operações repetíveis pelo cliente são idempotentes.

**Performance**
- [ ] Listagens paginadas com limite máximo; ordenação estável.
- [ ] `select` com campos necessários; resposta via DTO.
- [ ] Sem consulta dentro de laço; agregações no banco.
- [ ] Índices só com padrão de acesso comprovado (e custo de escrita avaliado).
- [ ] Cache só com problema concreto, chave com escopo, TTL e invalidação definidos.
- [ ] Trabalho lento fora da requisição, com feedback de status ao usuário.

**Frontend**
- [ ] Estado de autenticação explícito; guarda de rota; Error Boundary.
- [ ] Loading, erro e estado vazio tratados; botões desabilitados durante envio.
- [ ] Toda chamada HTTP pelo cliente único; nenhuma permissão aplicada só na interface.

**Operação**
- [ ] Erros pelo handler central, com `requestId`; logs estruturados sem dados sensíveis.
- [ ] Métricas e alertas da rota; health check; backup restaurável; migration reversível.
- [ ] Teste automatizado da regra de negócio correspondente (`RN-xxx`).

---

# PARTE 6 — COMO ESCOLHER O NÍVEL (referência rápida)

| Sinal observado | Nível sugerido |
|---|---|
| Poucos usuários, validação de produto, equipe pequena, sem requisito de escala | **LOW** |
| Uso crescente, consultas pesadas medidas, relatórios lentos, integrações externas, picos previsíveis | **MEDIUM** |
| Múltiplas instâncias/regiões, alta disponibilidade exigida, volume alto, vários serviços, conformidade rígida | **HARD** |

*Esses são sinais de apoio; a decisão exige evidência do repositório e, quando existirem, requisitos informados. Sem dados suficientes, a recomendação é **provisória** e deve listar o que medir.*
