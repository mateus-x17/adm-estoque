# 📑 RELATÓRIO 04 — BANCO DE DADOS, TABELAS E RELAÇÕES
**Projeto:** Estoque.OS — Modelagem Multi-Organização, Pedidos Multi-Item e Preservação Histórica  
**Data da atualização:** 2026-11-17 *(estrutura verificada no `schema.prisma` e nas 9 migrações da branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 11 — Catálogo Completo de Problemas](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)

---

## Resumo para quem não é técnico

O **banco de dados** é o grande arquivo digital onde tudo fica guardado de forma permanente — empresas, lojas, funcionários, produtos, vendas, comprovantes e desligamentos. Cada "gaveta" desse arquivo é chamada de **tabela** (ou *model*), e cada mudança planejada na estrutura das gavetas fica registrada numa **migração** (*migration*) numerada em ordem de data.

Duas decisões importantes deixam esse banco muito seguro para o dia a dia:
1. **Os preços das vendas ficam congelados:** mudar o preço de um produto hoje nunca altera quanto a loja faturou no mês passado.
2. **Demitir um funcionário nunca apaga as vendas dele:** o acesso da pessoa é removido de verdade, mas um "retrato congelado" (*snapshot*) do nome, e-mail, matrícula e datas continua intacto nos relatórios e na tabela `RegistroDesligamento`.

---

## 1. Topologia do Banco de Dados e Histórico de Migrações `[VERIFICADO]`

- **SGBD Primário:** PostgreSQL (Neon Cloud Database).
- **ORM:** Prisma ORM (`@prisma/client` `^6.16.2`, client gerado em v6.19.2).
- **Schema Oficial:** [`backend/prisma/schema.prisma`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma).
- **9 Migrações Versionadas em `backend/prisma/migrations/` (ordenadas cronologicamente para execução determinística em `prisma migrate deploy`):**
  1. `20250918051748_init` — Esquema base inicial.
  2. `20251012223132_add_field_imagem_usuario` — Avatar em usuários.
  3. `20260601063115_upd_tabela_fornecedores` — Expansão de fornecedores.
  4. `20261022_alter_enum_reposicao_venda` — Enum canônico `REPOSICAO` / `VENDA`.
  5. `20261110010000_multitenant_softdelete` — Introdução de `Empresa` + `ativo`.
  6. `20261110020000_organizacao_multipedidos` — Evolução de `Empresa` → `Organizacao` + `Loja` (com backfill seguro preservando IDs), criação de `PedidoStatus`, `Pedido` e `ItemPedido`, remoção de `Usuario.ativo`, e inclusão de `vendedorRefId`, `vendedorNomeSnapshot`, `vendedorEmailSnapshot`, `precoUnitario`, `valorTotal`, `estorno` e `pedidoId` em `Movimento`.
  7. `20261110030000_pedido_comprovantes` — Inclusão de `formaPagamento`, `statusPagamento`, `comprovanteCodigo`, `comprovanteUrl` e `recebidoPor` em `Pedido`.
  8. `20261110040000_matricula_situacao_rh` — Inclusão do enum `SituacaoFuncionario` (`ATIVO` | `SUSPENSO` | `FERIAS`), `matricula` única (`MAT-00001`), `telefone`, `situacao`, `dataAdmissao` em `Usuario` e snapshots `vendedorMatriculaSnapshot`, `vendedorDataAdmissaoSnapshot` e `vendedorDataDesligamentoSnapshot` em `Pedido` e `Movimento`.
  9. `20261110050000_registro_desligamento` — Criação da tabela **`RegistroDesligamento`** (`vendedorRefId`, `matricula`, `dataAdmissao`, `dataDemissao`, `motivo`, `lojaNome`, com backfill dos históricos existentes) para listar/filtrar ex-funcionários em `/dashboard/usuarios` mantendo a exclusão física em `Usuario`.

---

## 2. Diagrama Entidade-Relacionamento Real (`schema.prisma`)

```mermaid
erDiagram
    Organizacao ||--o{ Loja : "possui filiais (Cascade)"
    Organizacao ||--o{ Usuario : "possui equipe (Cascade)"
    Organizacao ||--o{ Categoria : "possui"
    Organizacao ||--o{ Fornecedor : "possui"
    Organizacao ||--o{ Produto : "possui"
    Organizacao ||--o{ Pedido : "possui"
    Organizacao ||--o{ Movimento : "possui"
    Organizacao ||--o{ RegistroDesligamento : "arquiva desligamentos (Cascade)"

    Loja ||--o{ Usuario : "vincula GERENTE/OPERADOR (SetNull)"
    Loja ||--o{ Categoria : "escopa catálogo (Cascade)"
    Loja ||--o{ Fornecedor : "escopa parceiros (Cascade)"
    Loja ||--o{ Produto : "detém saldo (Cascade)"
    Loja ||--o{ Pedido : "registra pedidos (Cascade)"
    Loja ||--o{ Movimento : "registra livro-razão (Cascade)"

    Usuario ||--o{ Pedido : "emite (SetNull ao excluir usuário)"
    Usuario ||--o{ Movimento : "registra (SetNull ao excluir usuário)"
    Fornecedor ||--o{ Produto : "fornece (1:N)"
    Fornecedor ||--o{ Pedido : "abastece reposições (SetNull)"
    Categoria ||--o{ Produto : "classifica (1:N)"

    Pedido ||--o{ ItemPedido : "contém itens (Cascade)"
    Pedido ||--o{ Movimento : "gera espelho contábil (SetNull)"
    Produto ||--o{ ItemPedido : "compõe (Restrict)"
    Produto ||--o{ Movimento : "movimenta (Restrict)"

    Organizacao {
        int id PK
        string nome
        string slug UK
        boolean ativo "Soft Delete na rede"
    }
    Loja {
        int id PK
        int organizacaoId FK
        string nome
        string slug "Unique(organizacaoId, slug)"
        string endereco "NULL"
        boolean ativo "Soft Delete na filial"
    }
    Usuario {
        int id PK "Preservado em vendedorRefId após DELETE"
        int organizacaoId FK
        int lojaId FK "NULL para ADMIN; FK ativa para equipe"
        string email "Unique(organizacaoId, email)"
        string matricula "Unique MAT-00001"
        string telefone "NULL"
        SituacaoFuncionario situacao "ATIVO | SUSPENSO | FERIAS"
        datetime dataAdmissao
        Role role "ADMIN | GERENTE | OPERADOR"
    }
    Pedido {
        int id PK
        string codigo "Unique(organizacaoId, codigo)"
        MovimentoTipo tipo "VENDA | REPOSICAO"
        PedidoStatus status "CONCLUIDO | CANCELADO"
        decimal valorTotal "Decimal(10,2)"
        int usuarioId FK "NULL se conta for excluída"
        int vendedorRefId "ID imutável do autor"
        string vendedorNomeSnapshot
        string vendedorEmailSnapshot
        string vendedorMatriculaSnapshot
        datetime vendedorDataAdmissaoSnapshot
        datetime vendedorDataDesligamentoSnapshot
        int canceladoPorRefId "NULL"
    }
    ItemPedido {
        int id PK
        int pedidoId FK
        int produtoId FK
        string produtoNomeSnapshot
        int quantidade
        decimal precoUnitario "Decimal(10,2) congelado"
        decimal subtotal "Decimal(10,2)"
    }
    Movimento {
        int id PK
        int produtoId FK
        int pedidoId FK "NULL se ajuste avulso"
        int usuarioId FK "NULL se conta for excluída"
        int vendedorRefId "ID imutável para busca histórica"
        string vendedorNomeSnapshot
        decimal precoUnitario "Decimal(10,2)"
        decimal valorTotal "Decimal(10,2)"
        boolean estorno "DEFAULT false"
    }
    RegistroDesligamento {
        int id PK
        int vendedorRefId "Unique(organizacaoId, vendedorRefId)"
        string nome
        string email
        string matricula "Exibida com (CANCELADA)"
        Role role
        datetime dataAdmissao
        datetime dataDemissao
        string motivo "NULL"
    }
```

---

## 3. Decisões Críticas de Integridade & Índices `[IMPLEMENTADO (verificado)]`

1. **Exclusão Física de `Usuario` Sem Quebrar Histórico:**
   - Diferente de `Produto`, `Categoria`, `Fornecedor` e `Loja` (que usam `ativo: Boolean` pois itens podem ser descontinuados), `Usuario` foi projetado **sem `ativo`**.
   - Quando um `Usuario` é excluído (`DELETE /users/:id`), as chaves estrangeiras `Pedido.usuarioId` e `Movimento.usuarioId` possuem `onDelete: SetNull`, tornando-se `NULL`, enquanto `vendedorRefId` (inteiro obrigatório), `vendedorNomeSnapshot` e `vendedorEmailSnapshot` permanecem intactos e indexados (`@@index([organizacaoId, vendedorRefId, createdAt])` em `Pedido` e `@@index([organizacaoId, vendedorRefId, data])` em `Movimento`).
2. **Precisão Monetária Congelada (`Decimal(10, 2)`):**
   - `Produto.preco`, `Pedido.valorTotal`, `ItemPedido.precoUnitario`, `ItemPedido.subtotal`, `Movimento.precoUnitario` e `Movimento.valorTotal` utilizam `@db.Decimal(10, 2)` (`numeric(10,2)`), garantindo que reajustes futuros no preço de um produto nunca alterem o faturamento histórico passado.
3. **Seed Realista Multi-Organização (`backend/prisma/seed.js`):**
   - **Organização 1 — `Grupo TechStock Varejo` (`grupo-techstock`):** Lojas `TechStock Centro` e `TechStock Shopping`, `ADMIN` (`admin@techstock.com`), 2 `GERENTE`s, `OPERADOR`es ativos (`op1`..`op4`), **1 colaborador `SUSPENSO` (`Carlos Henrique`)**, **1 colaboradora em `FERIAS` (`Juliana Costa`)** e **1 ex-funcionário fisicamente excluído (`Marcos Antunes`)** cuja matrícula permanece auditável como `(CANCELADA)`.
   - **Organização 2 — `CyberForge Geek Store` (`cyberforge-geek`):** Loja `CyberForge Matriz`, `admin@cyberforge.com`, `gerente1@cyberforge.com`, `op1/op2@cyberforge.com` e `peter.susp@cyberforge.com` (`SUSPENSO`). Senha unificada: `Password123!`.
   - Gera **12 meses** de multipedidos de compra e venda, cancelamento/estorno demonstrativo no mês atual e SKUs inativos com histórico (`Cabo VGA Analógico Legado`, `Hub USB 2.0 Antigo`, `Box Edição Limitada Convenção 2024`).
