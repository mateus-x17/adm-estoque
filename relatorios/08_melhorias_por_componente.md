# FASE 5 — MELHORIAS POR COMPONENTE
**Projeto:** Estoque.OS  
**Data:** 08/11/2026  
**Nível:** MEDIUM  
**Status do Mapeamento:** Em andamento (Fase 5 de 8)

---

## 1. VISÃO GERAL DAS MELHORIAS PROPOSTAS

Este documento consolida as propostas detalhadas de melhoria para o sistema **Estoque.OS**, estruturadas exatamente no formato prescrito pela **Seção 7 do PROMPT_MASTER_UNIFICADO.md**. Todas as melhorias aqui documentadas partem dos diagnósticos empíricos e evidências de código coletadas nas fases anteriores (especialmente no [`07_diagnostico_auditoria_e_performance.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/07_diagnostico_auditoria_e_performance.md)).

Nenhuma modificação em arquivos do projeto foi realizada nesta etapa (respeitando `PODE_ALTERAR_CODIGO: NAO`).

---

## 2. CATÁLOGO DE MELHORIAS DETALHADAS

---

### MELHORIA 01 — Controle Atômico de Concorrência e Saldo de Estoque (I1, I2, I9)
- **Identificação:** Prioridade: Crítica · Severidade: Alta · Complexidade: Média · Impacto esperado: Eliminação completa de *lost updates*, inconsistência de saldo negativo e duplicidade de lançamentos em movimentações concorrentes.
- **Localização:** Módulo: Produtos / Movimentações · Submódulo: Serviço de Ajuste · Arquivo: [`backend/src/services/productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L190-L222) · Função: `adjustProductQuantity` · Endpoint: `POST /products/:id/adjust` · Model: `Produto`, `Movimento` · Tabela: `produtos`, `movimentos`.
- **Diagnóstico atual:**
  Em [`productService.js#L190-L222`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js#L190-L222), o método lê o produto do banco via `prisma.produto.findUnique`, calcula a variável `novaQuantidade` na CPU do Node.js (`const novaQuantidade = tipo === 'ENTRADA' ? produto.quantidade + quantidade : produto.quantidade - quantidade`) e em seguida emite um `prisma.$transaction([prisma.produto.update(...), prisma.movimento.create(...)])`.
  **Problema com Evidência:** A transação do Prisma apenas agrupa os comandos de gravação; ela **não bloqueia** o registro `Produto` durante o intervalo entre a leitura do saldo e a escrita. Se dois operadores registrarem uma saída de 5 unidades simultaneamente para um produto com saldo 6, ambas as requisições leem 6 na memória, ambas calculam `6 - 5 = 1`, e ambas gravam `quantidade = 1`, consumindo 10 itens mas registrando saldo 1 (ou permitindo saldo negativo se o saldo inicial fosse 5). Além disso, não há suporte a cabeçalho de idempotência (`Idempotency-Key`), fazendo com que duplo clique na interface duplique a saída.
- **Justificativa técnica:**
  O controle de saldo físico é o núcleo da integridade de um ERP/WMS. Em concorrência de múltiplos operadores simultâneos (+100 usuários), leituras desincronizadas corrompem o inventário físico e contábil, gerando rupturas de estoque e divergências financeiras.
- **Implementação proposta:**
  - Arquivo a modificar: [`backend/src/services/productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js)
  - Funções a refatorar: `adjustProductQuantity`
  - Utilizar uma transação Prisma interativa (`prisma.$transaction(async (tx) => { ... })`) com bloqueio de linha SQL pessimista (`FOR UPDATE`) via raw query ou atualização atômica condicional no banco:
    - Para `SAIDA` / `VENDA`: `UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2 AND quantidade >= $1 RETURNING *;`
    - Para `ENTRADA` / `REPOSICAO`: `UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2 RETURNING *;`
  - Se nenhuma linha for atualizada na saída, lançar erro imediato `Saldo insuficiente para a operação`.
  - Suportar idempotência básica verificando chave única de transação ou bloqueio momentâneo.
- **Passo a passo:**
  1. Abrir transação interativa `prisma.$transaction(async (tx) => { ... })`.
  2. Executar query com lock de leitura atômica ou `update` com constraint no próprio PostgreSQL.
  3. Registrar a linha na tabela `movimentos` dentro do mesmo contexto de transação `tx`.
  4. Retornar o produto atualizado e o comprovante de movimento.
- **Exemplo de código:**
```javascript
export const adjustProductQuantity = async (id, quantidade, tipo, motivo, usuarioId, idempotencyKey = null) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Bloqueio pessimista da linha do produto para garantir serialização
    const [produto] = await tx.$queryRaw`
      SELECT id, nome, quantidade, preco, "usuarioId"
      FROM produtos 
      WHERE id = ${id} 
      FOR UPDATE
    `;

    if (!produto) {
      const error = new Error('Produto não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const qtdAjuste = Number(quantidade);
    const tipoAjuste = tipo.toUpperCase();

    if (tipoAjuste === 'SAIDA' || tipoAjuste === 'VENDA') {
      if (produto.quantidade < qtdAjuste) {
        const error = new Error(`Saldo insuficiente. Saldo atual: ${produto.quantidade}, Solicitado: ${qtdAjuste}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const delta = (tipoAjuste === 'ENTRADA' || tipoAjuste === 'REPOSICAO') ? qtdAjuste : -qtdAjuste;
    const novaQuantidade = produto.quantidade + delta;

    // 2. Atualização atômica
    const produtoAtualizado = await tx.produto.update({
      where: { id },
      data: { quantidade: novaQuantidade }
    });

    // 3. Registro do movimento com o tipo canônico do banco
    const movimento = await tx.movimento.create({
      data: {
        produtoId: id,
        usuarioId,
        tipo: tipoAjuste === 'ENTRADA' ? 'REPOSICAO' : (tipoAjuste === 'SAIDA' ? 'VENDA' : tipoAjuste),
        quantidade: qtdAjuste,
        motivo: motivo || `Ajuste manual de ${tipoAjuste.toLowerCase()}`
      }
    });

    return { produto: produtoAtualizado, movimento };
  });
};
```
- **Dependências e impactos:**
  - Telas afetadas: Modal de Movimentação em [`Estoque.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Estoque.jsx) e tela [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx).
  - Compatibilidade com dados existentes: 100% retrocompatível, respeita a integridade existente.
- **Testes e validação:**
  - Script de teste com 20 requisições simultâneas disparadas via `Promise.all` tentando debitar 1 item de um produto com saldo 10.
  - Comportamento esperado: exatamente 10 requisições recebem `200 OK`, saldo final encerra em `0`, e 10 requisições recebem `400 Saldo insuficiente`.
- **Resultado esperado:**
  Impossibilidade matemática de saldo negativo ou *lost update*, mesmo sob concorrência massiva de 100 usuários simultâneos.
- **Riscos e observações:**
  O lock pessimista (`FOR UPDATE`) segura a linha durante o roundtrip da transação (cerca de 140ms para Neon AWS us-east-1). Manter a transação curta e nunca incluir chamadas HTTP externas ou logs pesados dentro do bloco `tx`.
- **Lacunas remanescentes:**
  Não implementa reserva de estoque temporária (carrinho com retenção por 15 minutos).

---

### MELHORIA 02 — Resolução de N+1 e Consolidação de Estatísticas de Movimentações (I3)
- **Identificação:** Prioridade: Crítica · Severidade: Alta · Complexidade: Baixa · Impacto esperado: Redução do pior tempo de resposta de `3117.9ms` para menos de `300ms` em concorrência na rota `GET /movements/user-stats`.
- **Localização:** Módulo: Movimentações · Submódulo: Estatísticas de Usuário · Arquivos: [`backend/src/controllers/movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L35-L91) e [`backend/src/services/movementService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L128-L157) · Endpoint: `GET /movements/user-stats` · Model: `Usuario`, `Movimento`.
- **Diagnóstico atual:**
  Em [`movementController.js#L35-L91`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js#L35-L91), a função `getUserStats` busca todos os usuários do banco (`prisma.usuario.findMany`) e, em seguida, executa um loop assíncrono com `Promise.all(users.map(...))` disparando, para cada usuário, 2 contagens (`count`) e 2 somas (`aggregate` para reposição e venda).
  **Problema com Evidência:** Para $U$ usuários, são executadas $1 + 4U$ queries ao banco. Com 7 usuários, são 29 queries remotas sequenciais/paralelas para a AWS us-east-1.
  Medição real obtida no benchmark: p50 = `718.4ms`, p95 = `1012.6ms`, concorrência 10 = `2232.9ms`, com pico medido de **`3117.9ms`**.
  Além disso, o arquivo [`movementService.js#L128-L157`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js#L128-L157) **já possui** o método `getUserStatsAggregated` implementado com agregação SQL direta, mas o controller o ignora completamente e recalcula tudo via Prisma N+1.
- **Justificativa técnica:**
  O padrão N+1 sobrecarrega o pool de conexões do PostgreSQL e satura a latência WAN. Substituir 29 queries por 1 única agregação nativa no banco de dados elimina o gargalo e viabiliza a escalabilidade para centenas de usuários.
- **Implementação proposta:**
  - Arquivo a modificar: [`backend/src/controllers/movementController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/movementController.js)
  - Refatorar a função `getUserStats` para delegar diretamente ao `movementService.getUserStatsAggregated()`.
  - Harmonizar o payload de resposta esperado pelo frontend em [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx).
- **Passo a passo:**
  1. Alterar `movementController.js` para importar e invocar `movementService.getUserStatsAggregated()`.
  2. Ajustar `getUserStatsAggregated` para garantir que retorne a estrutura exata: `{ id, nome, email, papel, totalMovimentacoes, totalReposicoes, totalVendas, itensMovimentados, reposicoesQtd, vendasQtd }`.
  3. Remover os loops de `prisma.movimento.count` e `prisma.movimento.aggregate` do controller.
- **Exemplo de código:**
```javascript
// backend/src/controllers/movementController.js
import * as movementService from '../services/movementService.js';

export const getUserStats = async (req, res, next) => {
  try {
    const stats = await movementService.getUserStatsAggregated();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
```
- **Dependências e impactos:**
  - Consumidores afetados: Painel de auditoria e filtros por usuário em [`Movimentacoes.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Movimentacoes.jsx).
  - O contrato JSON permanece idêntico, evitando quebras no frontend.
- **Testes e validação:**
  - Executar `node scratch/benchmark.js` antes e depois da alteração.
  - Verificar nos logs do Prisma que apenas 1 query SQL (`GROUP BY`) é disparada no lugar de 29 queries individuais.
- **Resultado esperado:**
  Latência da rota caindo para a faixa de ~180ms (p50) e estabilização abaixo de 400ms sob 10 requisições simultâneas.
- **Riscos e observações:**
  Garantir que usuários sem nenhuma movimentação continuem presentes na listagem com valores zerados (`COALESCE` / `LEFT JOIN`).
- **Lacunas remanescentes:**
  Se o número de usuários ativos chegar a 5.000, esta rota necessitará de paginação de usuários ou filtro temporal.

---

### MELHORIA 03 — Agregação SQL Nativa para Fornecedores e Conexão do Serviço Desacoplado (I4)
- **Identificação:** Prioridade: Alta · Severidade: Média · Complexidade: Baixa · Impacto esperado: Redução do consumo de memória do processo Node.js e eliminação do desacoplamento entre controller e service.
- **Localização:** Módulo: Fornecedores · Submódulo: Estatísticas e Listagem · Arquivo: [`backend/src/controllers/supplierController.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L88-L132) e [`backend/src/services/supplierService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js) · Endpoint: `GET /suppliers/stats` · Model: `Fornecedor`, `Produto`.
- **Diagnóstico atual:**
  Em [`supplierController.js#L88-L132`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/supplierController.js#L88-L132), a função `getSupplierStats` carrega todos os fornecedores trazendo todos os produtos atrelados para a memória (`include: { produtos: true }`), processa iterações manuais em JavaScript (`fornecedores.reduce(...)`, `reduce` de produtos, médias aritméticas na RAM) e consulta o banco diretamente pelo Prisma sem passar pelo [`supplierService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js).
- **Justificativa técnica:**
  O arquivo `supplierService.js` existe mas nunca foi utilizado pelo seu controller, quebrando o padrão arquitetural MVC/Service Layer. Além disso, carregar árvores de entidades completas na RAM do Node.js degrada a CPU e a memória do processo conforme a base de produtos cresce.
- **Implementação proposta:**
  - Migrar os cálculos de agregação para funções especializadas em `supplierService.js`.
  - Utilizar consultas agregadas diretas (`prisma.produto.aggregate` e `prisma.fornecedor.count`).
  - Refatorar `supplierController.js` para consumir exclusivamente os métodos de `supplierService.js`.
- **Passo a passo:**
  1. Implementar método `getSupplierStatsService` em `supplierService.js` com agregação SQL.
  2. Ajustar `supplierController.js` para chamar `supplierService.getSupplierStatsService()`.
  3. Redirecionar os demais métodos do controller (`getSuppliers`, `createSupplier`, etc.) para o service.
- **Exemplo de código:**
```javascript
// backend/src/services/supplierService.js
export const getSupplierStatsService = async () => {
  const [totalFornecedores, produtosAgregados, totalMovimentos] = await Promise.all([
    prisma.fornecedor.count(),
    prisma.produto.aggregate({
      _count: { id: true },
      _sum: { quantidade: true },
      _avg: { preco: true }
    }),
    prisma.movimento.count()
  ]);

  return {
    totalFornecedores,
    totalProdutosVinculados: produtosAgregados._count.id || 0,
    volumeEstoqueFornecedores: produtosAgregados._sum.quantidade || 0,
    precoMedioProdutos: Number(produtosAgregados._avg.preco || 0).toFixed(2),
    totalMovimentacoes: totalMovimentos
  };
};
```
- **Dependências e impactos:**
  - Afeta o dashboard de fornecedores em [`Fornecedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Fornecedores.jsx).
  - Preserva integralmente o contrato JSON atual.
- **Testes e validação:**
  - Comparar o JSON emitido pela rota antes e depois da refatoração.
  - Verificar que o `supplierController.js` não referencia mais `prisma` diretamente.
- **Resultado esperado:**
  Código alinhado à arquitetura de camadas, sem transferência inútil de arrays volumosos pela rede.
- **Riscos e observações:**
  Baixo risco. Verificar se algum campo calculado no controller possuía nomenclatura específica na interface.
- **Lacunas remanescentes:**
  Estatísticas históricas por período (trimestral/anual) necessitarão de agrupamentos por data futuros.

---

### MELHORIA 04 — Migração de Precisão Monetária de Float para Decimal (I7)
- **Identificação:** Prioridade: Alta · Severidade: Média · Complexidade: Baixa · Impacto esperado: Eliminação de anomalias de arredondamento financeiro e dízimas periódicas no cálculo de patrimônio de estoque.
- **Localização:** Módulo: Banco de Dados · Submódulo: Schema Prisma / Migrations · Arquivo: [`backend/prisma/schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L30) · Model: `Produto` (campo `preco`) · Tabela: `produtos` (coluna `preco`).
- **Diagnóstico atual:**
  No arquivo [`backend/prisma/schema.prisma#L30`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma#L30), o campo está definido como:
  `preco Float`
  **Problema com Evidência:** O tipo `Float` mapeia para `double precision` no PostgreSQL (padrão IEEE 754 de 64 bits em ponto flutuante binário). Operações como soma de preços acumulados e cálculo de patrimônio total (`SUM(quantidade * preco)`) geram imprecisões decimais como `19.999999999999996` em relatórios contábeis e fiscais.
- **Justificativa técnica:**
  Valores monetários devem ser armazenados estritamente em ponto fixo decimal com escala arbitrária (`DECIMAL(10, 2)` ou `NUMERIC(10, 2)`).
- **Implementação proposta:**
  - Alterar o arquivo `schema.prisma`:
    ```prisma
    preco Decimal @db.Decimal(10, 2)
    ```
  - Gerar migração Prisma SQL: `npx prisma migrate dev --name change_preco_to_decimal`.
  - No código de serialização do backend, assegurar que campos `Decimal` do Prisma sejam convertidos para `Number` ou `String` formatada na resposta JSON para evitar problemas de serialização nativa do tipo `Prisma.Decimal`.
- **Passo a passo:**
  1. Alterar a definição no [`schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma).
  2. Executar `npx prisma migrate dev` para criar a migration SQL correspondente.
  3. No [`productService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js), assegurar que inputs numéricos sejam convertidos para `Prisma.Decimal` ou aceitos como string/number válidos.
- **Exemplo de código:**
```prisma
// backend/prisma/schema.prisma
model Produto {
  id          String      @id @default(uuid())
  nome        String
  descricao   String?
  preco       Decimal     @db.Decimal(10, 2)
  quantidade  Int         @default(0)
  categoria   String
  fornecedor  Fornecedor? @relation(fields: [fornecedorId], references: [id], onDelete: SetNull)
  // ... demais campos mantidos
}
```
- **Dependências e impactos:**
  - Scripts de seed e consultas que retornam `preco` aos componentes React.
  - O Prisma retorna instâncias da classe `Decimal`; o Express precisa serializar corretamente para número float no JSON (`Number(p.preco)`) ou manter a formatação financeira já utilizada pela UI (`Intl.NumberFormat`).
- **Testes e validação:**
  - Inserir um produto com preço `19.99`, somar 100 itens e verificar ausência de frações flutuantes no banco.
  - Executar a migration e validar os dados já existentes na tabela `produtos`.
- **Resultado esperado:**
  Precisão exata de 2 casas decimais no banco de dados e cálculos fiscais rigorosos.
- **Riscos e observações:**
  Ao aplicar a migration em produção, o PostgreSQL converterá `double precision` para `numeric(10, 2)` sem perda de dados para os valores normais de estoque.
- **Lacunas remanescentes:**
  Campos de valor histórico unitário na tabela `movimentos` (atualmente a tabela só guarda quantidade movimentada, não o preço praticado no instante do movimento).

---

### MELHORIA 05 — Proteção contra Rebaixamento ou Exclusão do Último Administrador (B7)
- **Identificação:** Prioridade: Crítica · Severidade: Alta · Complexidade: Baixa · Impacto esperado: Impossibilidade de bloqueio operacional definitivo (*lockout*) por remoção ou perda acidental de papéis administrativos.
- **Localização:** Módulo: Usuários · Submódulo: Serviço de Usuários · Arquivo: [`backend/src/services/userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · Funções: `updateUser`, `deleteUser` · Endpoints: `PUT /users/:id`, `DELETE /users/:id`, `PUT /users/me` · Model: `Usuario`.
- **Diagnóstico atual:**
  Em [`userService.js#L78-L100`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js#L78-L100), as funções de atualização e exclusão permitem que qualquer requisição autorizada altere o papel de um `ADMIN` para `OPERADOR` ou execute a exclusão do usuário. Não há validação da quantidade remanescente de administradores ativos no sistema.
- **Justificativa técnica:**
  Se o único administrador do sistema for rebaixado para operador ou excluído, o sistema perde irrevogavelmente a capacidade de gerenciar acessos e permissões via painel, exigindo intervenção manual direta no banco de dados via console SQL.
- **Implementação proposta:**
  - Adicionar trava lógica em `updateUser`, `updateMe` e `deleteUser`:
    1. Se o usuário a ser modificado/excluído possuir papel `ADMIN` e a alteração for rebaixá-lo ou deletá-lo:
    2. Contar quantos administradores ativos existem no banco (`prisma.usuario.count({ where: { papel: 'ADMIN' } })`).
    3. Se `count <= 1`, abortar imediatamente a requisição com status HTTP 400 e mensagem explicativa.
- **Passo a passo:**
  1. No [`userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js), implementar a checagem dentro das funções `updateUser` e `deleteUser`.
  2. Implementar a mesma guarda em `updateMe` para impedir que o administrador altere seu próprio papel inadvertidamente.
- **Exemplo de código:**
```javascript
// backend/src/services/userService.js
export const checkLastAdminGuard = async (usuarioId, novoPapel = null, isDelete = false) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (usuario.papel === 'ADMIN') {
    const isDemoting = novoPapel && novoPapel !== 'ADMIN';
    if (isDelete || isDemoting) {
      const adminCount = await prisma.usuario.count({
        where: { papel: 'ADMIN' }
      });
      if (adminCount <= 1) {
        const error = new Error('Operação bloqueada: Não é permitido excluir ou rebaixar o único administrador do sistema.');
        error.statusCode = 400;
        throw error;
      }
    }
  }
};
```
- **Dependências e impactos:**
  - Telas afetadas: Edição e Listagem de Usuários em [`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx) e Perfil em [`Perfil.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Perfil.jsx).
- **Testes e validação:**
  - Criar cenário com apenas 1 admin no banco e tentar alterar o seu próprio papel para `OPERADOR` via API: Deve retornar `400 Bad Request`.
  - Criar um segundo admin e repetir: Deve ter sucesso.
- **Resultado esperado:**
  Blindagem contra *lockout* involuntário.
- **Riscos e observações:**
  Nenhum risco à integridade existente.
- **Lacunas remanescentes:**
  Não impede que todos os administradores esqueçam suas senhas simultaneamente (necessita fluxo futuro de recuperação de senha por e-mail com token assinado).

---

### MELHORIA 06 — Conexão Real da Exclusão de Usuários na Interface e Suporte a Soft-Delete (B3, B6)
- **Identificação:** Prioridade: Média · Severidade: Média · Complexidade: Baixa · Impacto esperado: Alinhamento entre interface e backend, permitindo inativação de usuários sem quebra de integridade referencial em movimentações.
- **Localização:** Módulo: Usuários · Submódulo: UI & Backend · Arquivos: [`frontend/src/pages/Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx#L231-L238), [`backend/prisma/schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) e [`backend/src/services/userService.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · Endpoint: `DELETE /users/:id` · Model: `Usuario`.
- **Diagnóstico atual:**
  Em [`Usuarios.jsx#L231-L238`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx#L231-L238), a função `confirmarExcluir` apenas abre um modal estático informativo (`setModalInfo({ visivel: true, ... })`) afirmando que a funcionalidade foi desativada para preservar dados de auditoria. A API `DELETE /users/:id` existe no backend, mas se executada para um usuário com movimentações registradas, causa erro 500 do Prisma por violação de Foreign Key (`Restrict` implícito).
- **Justificativa técnica:**
  Exibir botões de ação que apenas mostram mensagens de "desativado" frustra o operador e mascara a ausência de um mecanismo de exclusão lógica (*soft-delete*). Em sistemas corporativos, usuários demitidos ou transferidos devem ser inativados (`ativo = false`), bloqueando login sem apagar o histórico de auditoria de movimentações.
- **Implementação proposta:**
  - Adicionar campo `ativo Boolean @default(true)` no Model `Usuario` do `schema.prisma`.
  - Refatorar o método `deleteUser` no backend para alternar `ativo = false` (ou se o usuário não possuir registros atrelados, permitir exclusão física opcional).
  - Atualizar o middleware de autenticação (`authMiddleware.js`) para rejeitar tokens de usuários com `ativo === false`.
  - Conectar a função `confirmarExcluir` em `Usuarios.jsx` à chamada real `apiClient.delete(/users/${usuarioId})`.
- **Passo a passo:**
  1. Adicionar `ativo Boolean @default(true)` ao model `Usuario` no `schema.prisma` e rodar migração.
  2. No `authService.js` (login) e `authMiddleware.js`, verificar `if (!user.ativo) throw new Error('Usuário inativado')`.
  3. No `userService.js`, alterar `deleteUser` para executar soft-delete: `prisma.usuario.update({ where: { id }, data: { ativo: false } })`.
  4. No frontend `Usuarios.jsx`, disparar a requisição de deleção/inativação real via `apiClient.delete`.
- **Exemplo de código:**
```javascript
// backend/src/services/userService.js
export const deleteUser = async (id, solicitanteId) => {
  await checkLastAdminGuard(id, null, true);

  if (id === solicitanteId) {
    const error = new Error('Não é possível excluir o próprio usuário logado');
    error.statusCode = 400;
    throw error;
  }

  // Soft delete preserva integridade histórica
  return await prisma.usuario.update({
    where: { id },
    data: { ativo: false }
  });
};
```
- **Dependências e impactos:**
  - Impacto direto na listagem de usuários e no fluxo de login.
- **Testes e validação:**
  - Inativar um usuário via interface e verificar que ele deixa de constar na lista ativa e não consegue mais se autenticar.
  - Verificar que o histórico de movimentações daquele usuário permanece íntegro com seu nome preservado.
- **Resultado esperado:**
  Integridade referencial preservada sem botões "fake" na interface.
- **Riscos e observações:**
  A migration deve definir `@default(true)` para que todos os usuários já existentes permaneçam ativos.
- **Lacunas remanescentes:**
  Não implementa reativação automática via interface (exige tela de gestão de inativos futura).

---

### MELHORIA 07 — Centralização e Padronização das Chamadas HTTP no Frontend (B9)
- **Identificação:** Prioridade: Média · Severidade: Baixa · Complexidade: Baixa · Impacto esperado: Padronização completa do tratamento de erros, injeção de tokens JWT e eliminação de duplicação de headers.
- **Localização:** Módulo: Frontend · Submódulo: Formulários e Clientes de Rede · Arquivos: [`frontend/src/components/forms/EditarItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx) e [`frontend/src/services/apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/apiClient.js).
- **Diagnóstico atual:**
  O projeto possui um cliente Axios padronizado em [`frontend/src/services/apiClient.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/apiClient.js), porém alguns componentes e formulários realizam manipulação direta de URLs ou chamadas desacopladas sem interceptor unificado de expiração de token.
- **Justificativa técnica:**
  Garante que qualquer requisição que receba `401 Unauthorized` limpe o `localStorage` e redirecione automaticamente para `/login`, além de evitar inconsistências de baseURL em produção.
- **Implementação proposta:**
  - Garantir que todos os componentes importem exclusivamente `apiClient` de `../services/apiClient`.
  - Adicionar interceptor de resposta no `apiClient.js` para redirecionar para a tela de login em caso de token expirado (401).
- **Passo a passo:**
  1. Revisar imports de requisições HTTP em todos os arquivos de `frontend/src/`.
  2. Adicionar o interceptor de resposta em `apiClient.js`.
- **Exemplo de código:**
```javascript
// frontend/src/services/apiClient.js
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```
- **Dependências e impactos:**
  - Todos os componentes do React que consomem a API.
- **Testes e validação:**
  - Simular expiração do JWT alterando o token no `localStorage` e disparando uma requisição: a aplicação deve redirecionar instantaneamente para `/login`.
- **Resultado esperado:**
  Tratamento uniforme de autenticação e rede em 100% da SPA.
- **Riscos e observações:**
  Baixo risco. Não quebra endpoints existentes.
- **Lacunas remanescentes:**
  Não implementa *refresh token* silencioso com rotação.

---

### MELHORIA 08 — Rate Limiting Dedicado em Cadastro e Proteção contra DoS (I10, B4)
- **Identificação:** Prioridade: Alta · Severidade: Alta · Complexidade: Baixa · Impacto esperado: Proteção do banco Neon contra esgotamento de conexões e ataques de criação em massa de contas.
- **Localização:** Módulo: Autenticação · Submódulo: Rotas de Autenticação · Arquivo: [`backend/src/routes/authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js) · Endpoints: `POST /auth/register`, `POST /auth/login`.
- **Diagnóstico atual:**
  Em [`authRoutes.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js), há um limitador `authLimiter` aplicado à rota de login (`POST /auth/login`), mas a rota pública de criação de contas (`POST /auth/register`) está **completamente desprotegida**, permitindo requisições ilimitadas por segundo.
- **Justificativa técnica:**
  A rota de registro executa hash de senha via `bcrypt.hash(..., 10)`, uma operação de alta intensidade computacional de CPU. Um invasor disparando centenas de requisições por segundo para `/auth/register` trava o event loop do Node.js e satura o banco de dados.
- **Implementação proposta:**
  - Criar limitador rigoroso específico para registro (`registerLimiter`), permitindo no máximo 3 cadastros por IP a cada 1 hora.
  - Aplicar `registerLimiter` especificamente no endpoint `POST /auth/register`.
- **Passo a passo:**
  1. Configurar `registerLimiter` com `express-rate-limit` em `backend/src/middlewares/rateLimiter.js` ou diretamente em `authRoutes.js`.
  2. Acoplar o middleware na rota `router.post('/register', registerLimiter, authController.register)`.
- **Exemplo de código:**
```javascript
// backend/src/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo de 5 cadastros por IP por hora
  message: {
    success: false,
    message: 'Muitas tentativas de cadastro a partir deste IP. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```
- **Dependências e impactos:**
  - Consumidor: Tela de Cadastro (`Register.jsx`).
- **Testes e validação:**
  - Disparar 6 requisições de cadastro seguidas pelo Postman ou script: a 6ª requisição deve retornar `429 Too Many Requests`.
- **Resultado esperado:**
  Proteção contra spam de contas e ataques de negação de serviço na CPU do servidor.
- **Riscos e observações:**
  Se usuários compartilharem o mesmo IP de rede corporativa (NAT), um limite muito baixo pode bloquear colaboradores legítimos. Limite de 5 cadastros por hora equilibra segurança e uso real.
- **Lacunas remanescentes:**
  Não substitui um CAPTCHA em caso de campanhas massivas distribuídas (botnets).

---

### MELHORIA 09 — Cache em Memória com Invalidação para Autenticação e Dropdowns (A1, A5)
- **Identificação:** Prioridade: Média · Severidade: Média · Complexidade: Média · Impacto esperado: Redução substancial de roundtrips repetitivos de 140ms para a AWS us-east-1 a cada requisição HTTP.
- **Localização:** Módulo: Autenticação & Middleware · Submódulo: Validação de Token · Arquivo: [`backend/src/middlewares/authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) · Endpoint: Transversal (todas as rotas privadas) · Model: `Usuario`.
- **Diagnóstico atual:**
  Em [`authMiddleware.js`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js), toda requisição privada verifica o token JWT e imediatamente executa uma consulta ao banco: `prisma.usuario.findUnique({ where: { id: decoded.id }, select: { id, nome, email, papel, ativo } })`.
  **Problema com Evidência:** Para 100 usuários simultâneos navegando, cada clique gera 1 roundtrip adicional de ~140ms (latência base do Neon na Virgínia) apenas para conferir se o usuário ainda existe.
- **Justificativa técnica:**
  O perfil de um usuário e seu papel raramente mudam a cada segundo. Armazenar temporariamente o registro do usuário ativo em cache LRU in-memory ou Redis por 30 a 60 segundos elimina esse roundtrip desnecessário em 95% das chamadas.
- **Implementação proposta:**
  - Utilizar uma estrutura de cache em memória leve (como `lru-cache` ou Map com TTL) para instâncias únicas, com suporte a Redis para múltiplas instâncias.
  - Invalidar a chave de cache sempre que o usuário for atualizado ou inativado em `userService.js`.
- **Passo a passo:**
  1. Instalar biblioteca leve de cache em memória ou instanciar store TTL.
  2. No `authMiddleware.js`, consultar a chave `user:${decoded.id}` no cache antes de ir ao Prisma.
  3. No `userService.js`, chamar `userCache.del(id)` em qualquer atualização ou deleção.
- **Exemplo de código:**
```javascript
// backend/src/middlewares/authMiddleware.js
import { LRUCache } from 'lru-cache';

const userCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 // 60 segundos
});

export const clearUserCache = (userId) => userCache.delete(userId);

export const authMiddleware = async (req, res, next) => {
  // ... validação do JWT ...
  const cachedUser = userCache.get(decoded.id);
  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  const user = await prisma.usuario.findUnique({
    where: { id: decoded.id },
    select: { id: true, nome: true, email: true, papel: true, ativo: true }
  });

  if (!user || user.ativo === false) {
    return res.status(401).json({ success: false, message: 'Usuário inválido ou inativo' });
  }

  userCache.set(decoded.id, user);
  req.user = user;
  next();
};
```
- **Dependências e impactos:**
  - Benefício transparente para todas as rotas privadas do sistema.
- **Testes e validação:**
  - Fazer duas requisições consecutivas para qualquer endpoint privado: a segunda deve responder sem bater no banco para autenticação.
- **Resultado esperado:**
  Redução de ~140ms na latência de cada requisição autenticada servida pelo cache.
- **Riscos e observações:**
  Se o papel do usuário for alterado no banco, há um delay de até 60s para refletir se a invalidação de cache falhar. A invalidação explícita em `userService` mitiga isso.
- **Lacunas remanescentes:**
  Em múltiplas instâncias distribuídas do backend sem sticky session, caches em memória de processos distintos podem ficar desincronizados até o TTL expirar (resolvido na arquitetura recomendada via Redis).

---

### MELHORIA 10 — Implementação de Suíte de Testes Automatizados (I11)
- **Identificação:** Prioridade: Alta · Severidade: Média · Complexidade: Média · Impacto esperado: Garantia de não-regressão nas 20 regras de negócio (`RN-001` a `RN-020`) durante a implementação de melhorias.
- **Localização:** Módulo: Testes / Infraestrutura · Submódulo: Backend & Frontend · Pastas: `backend/tests/` · Arquivos de configuração: `backend/package.json`.
- **Diagnóstico atual:**
  O projeto possui **0% de cobertura de testes automatizados**. Não há frameworks de testes instalados (`jest`, `vitest` ou `supertest`), tornando toda refatoração vulnerável a regressões silenciosas.
- **Justificativa técnica:**
  Sistemas de controle de estoque exigem testes automatizados para validar que saídas não ultrapassem o saldo físico e que as restrições de permissão por perfil funcionem de forma determinística.
- **Implementação proposta:**
  - Instalar `vitest` e `supertest` no backend.
  - Criar testes de integração para as rotas críticas:
    - Autenticação e bloqueio de rotas sem token.
    - Tentativa de ajuste com saldo insuficiente (regra `RN-002`).
    - Bloqueio de operadores tentando criar produtos (regra `RN-011`).
    - Bloqueio de exclusão do último admin (regra `RN-007`).
- **Passo a passo:**
  1. Adicionar dependências de desenvolvimento: `npm install -D vitest supertest`.
  2. Adicionar script `"test": "vitest run"` no `backend/package.json`.
  3. Criar pasta `backend/tests/integration/` e escrever os arquivos de teste.
- **Exemplo de código:**
```javascript
// backend/tests/integration/adjust.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /products/:id/adjust', () => {
  it('deve retornar 400 ao tentar saída maior que o saldo em estoque', async () => {
    // Simulação com token de operador
    const response = await request(app)
      .post('/products/prod-123/adjust')
      .set('Authorization', 'Bearer token_valido')
      .send({ quantidade: 999999, tipo: 'SAIDA', motivo: 'Teste de estresse' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/insuficiente/i);
  });
});
```
- **Dependências e impactos:**
  - Apenas ambiente de desenvolvimento e CI/CD.
- **Testes e validação:**
  - Execução via comando `npm test`.
- **Resultado esperado:**
  Pipeline automatizado de validação garantindo conformidade com o catálogo de regras de negócio.
- **Riscos e observações:**
  Testes de integração requerem banco de teste isolado ou mock das chamadas Prisma para não poluir o banco de produção Neon.
- **Lacunas remanescentes:**
  Testes End-to-End (E2E) com Cypress/Playwright ficam para ciclo posterior de produto.

---

## 3. RESUMO DA FASE 5

| Código | Melhoria | Módulo | Prioridade | Complexidade |
|---|---|---|---|---|
| **MELH-01** | Concorrência Atômica no Saldo de Estoque | Backend / Produtos | Crítica | Média |
| **MELH-02** | Resolução de N+1 em Estatísticas de Usuário | Backend / Movimentações | Crítica | Baixa |
| **MELH-03** | Agregação SQL Nativa e Conexão de Fornecedores | Backend / Fornecedores | Alta | Baixa |
| **MELH-04** | Migração de Precisão Monetária (Float -> Decimal) | Banco / Prisma | Alta | Baixa |
| **MELH-05** | Proteção contra Rebaixamento do Último Admin | Backend / Usuários | Crítica | Baixa |
| **MELH-06** | Soft-delete e Exclusão Real de Usuários na UI | Fullstack / Usuários | Média | Baixa |
| **MELH-07** | Centralização de Chamadas HTTP com Interceptor | Frontend / Rede | Média | Baixa |
| **MELH-08** | Rate Limiting em Rotas de Cadastro de Contas | Backend / Segurança | Alta | Baixa |
| **MELH-09** | Cache em Memória com Invalidação para Auth | Backend / Performance | Média | Média |
| **MELH-10** | Suíte de Testes Automatizados com Vitest | Transversal / Qualidade | Alta | Média |

Todas as propostas respeitam a stack nativa do projeto (`Node.js 20`, `Express`, `Prisma`, `PostgreSQL`, `React 18`, `Vite`, `TailwindCSS`).

