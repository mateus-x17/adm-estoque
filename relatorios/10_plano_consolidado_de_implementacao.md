# 📑 RELATÓRIO 10 — PLANO CONSOLIDADO DE IMPLEMENTAÇÃO (CONCLUÍDO + PRÓXIMOS PASSOS)

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(base técnica verificada em 2026-11-11 e atualizada na branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 11 — Catálogo Completo de Problemas](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)

---

## Resumo para quem não é técnico

Este relatório funciona como o "checklist de obras" do **Estoque.OS**: primeiro mostra tudo o que **já foi construído e entregue** nas 9 etapas principais do projeto, e depois organiza em fila de prioridade o que **vale a pena fazer a seguir**.

A fila futura está dividida em três níveis fáceis de entender:
- **Urgente (`P0`):** cuidados operacionais rápidos que eliminam riscos imediatos (como trocar senhas externas usadas em testes).
- **Próxima entrega (`P1`):** melhorias de alto impacto que deixam o site mais leve, eliminam a última rota sem limite e colocam testes rodando automaticamente no GitHub.
- **Quando o sistema crescer (`P2`):** investimentos para quando a plataforma tiver muitas empresas simultâneas ou precisar de mais de um servidor em paralelo.

---

## 1. Etapas já concluídas e verificadas no código `[VERIFICADO]`

### Etapas 1 a 6 — Estabilidade, velocidade, centavos exatos, PDFs e logs
- **Objetivo:** corrigir os problemas mais graves de estoque, lentidão e operação antes de expandir o sistema.
- **Principais problemas resolvidos:**
  - *Duas vendas ao mesmo tempo estragando o estoque* ([`DADOS-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-02)) e *cliques duplos* ([`DADOS-06`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-06));
  - *Consultas repetidas nos relatórios* ([`DESEMPENHO-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-02)), *erro de arredondamento nos centavos* ([`DADOS-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-04)) e *cache de login/nomes* ([`DESEMPENHO-06`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-06));
  - *Travamento no envio de fotos* ([`OPERACAO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-04)), *rastreamento de logs* ([`OPERACAO-07`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-07)) e *desligamento seguro* ([`OPERACAO-08`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-08)).
- **Entrega adicional:** relatórios executivos de vendas (`1m`, `6m`, `1y`) em gráficos SVG prontos para impressão A4.

### Etapa 7 — Separação inicial por empresa e planilhas Excel/CSV
- **Objetivo:** permitir que diferentes empresas usassem o mesmo sistema sem misturar dados e facilitar o cadastro em massa.
- **Entregas:** isolamento inicial por empresa, desativação lógica (*soft delete*) de produtos/categorias/fornecedores, motor de planilhas `.xlsx`/`.csv` (`ExcelJS`), sigilo de operadores e modais compatíveis com celular.

### Etapa 8 — Uma empresa com várias lojas, pedidos com vários itens e gestão de funcionários
- **Objetivo:** transformar o sistema em uma plataforma completa para redes de lojas com controle de equipe e auditoria.
- **Entregas principais:**
  - 4 migrações ordenadas (`20261110020000_` a `20261110050000_`) criando `Organizacao → Lojas`, comprovantes de pagamento (`PIX`, `NSU`, anexo), matrícula única (`MAT-00001`), situação funcional (`ATIVO`/`SUSPENSO`/`FERIAS`) e `RegistroDesligamento`.
  - Portais separados (`/admin/login` e `/login`), seletor global de filial (`X-Loja-Id`), transferência de gerentes e bloqueio imediato (`403`) para funcionários suspensos ou de férias ([`ACESSO-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-02)).
  - Demissão real de funcionário com data de demissão, filtro de desligados, preservação total das vendas antigas (`MAT-XXXXX (CANCELADA)`) e reemissão do relatório mensal ([`DADOS-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-01)).
  - Pedidos com vários itens e estorno atômico ([`DADOS-03`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-03)), painel interativo e tela de desempenho de vendedores ([DesempenhoVendedores.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx)).

### Etapa 9 — Reforço final de segurança contra invasões e publicação em nuvem (11/11/2026)
- **Objetivo:** blindar todas as portas de entrada contra ataques comuns e confirmar tudo funcionando em produção.
- **Problemas resolvidos ou mitigados:**
  - *Proteção de segredos e erros internos* ([`OPERACAO-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-01), [`OPERACAO-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-02)), *limite de acessos* ([`OPERACAO-03`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-03)), *validação rígida de uploads, links e planilhas* ([`ENTRADA-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#entrada-01)) e *proteção anti-XSS nos 4 PDFs + `npm audit fix`* ([`ACESSO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-04)).
  - Aviso visual de `1000 ms` quando o servidor gratuito acorda no Render ([serverToast.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/serverToast.js)) e validação completa dos **7/7 testes E2E** no banco Neon ativo.

---

## 2. Fila de próximas melhorias priorizadas `[RECOMENDAÇÃO]`

| Prioridade | O que fazer | Problema que resolve | Onde mexer | Benefício direto para quem usa |
|---|---|---|---|---|
| **P0 (Agora)** | Trocar preventivamente as senhas do banco Neon e do Cloudinary caso tenham sido exibidas fora de canal privado durante testes | [`OPERACAO-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-01) — *Vazamento de segredos* | Painel Neon / Render `.env` | Elimina qualquer risco residual de credencial exposta |
| **P1 (Próxima entrega)** | Dividir o carregamento das páginas do site com `React.lazy()` + `<Suspense>` | [`DESEMPENHO-08`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-08) — *Site pesado para abrir de uma vez* | [routes.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) | Reduz o arquivo inicial de `1.020,48 kB` para menos de `300 kB`, deixando a abertura no celular bem mais rápida |
| **P1 (Próxima entrega)** | Migrar as 2 últimas chamadas diretas `fetch()` em `EditarItem.jsx` para o `apiClient` | [`TELA-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-02) — *Chamadas fora do canal padrão* | [EditarItem.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L365-L417) | Garante envio automático da loja (`X-Loja-Id`), aviso de servidor acordando e deslogue em sessão expirada |
| **P1 (Próxima entrega)** | Criar rota resumida `GET /movements/flow-summary` no banco para o gráfico mensal do Dashboard e remover `?limit=all` | [`DESEMPENHO-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-01) e [`DESEMPENHO-03`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-03) | [movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) · [useDashboardData.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js) | Impede que o painel principal fique lento quando a empresa acumular milhares de vendas |
| **P1 (Próxima entrega)** | Criar esteira automática no GitHub Actions rodando testes, lint e build a cada alteração | [`QUALIDADE-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#qualidade-01) — *Falta de checagem automática* | `.github/workflows/` *(ainda não criado)* | Impede que uma mudança nova quebre o sistema antes de ir para o ar |
| **P1 (Próxima entrega)** | Executar nova medição cronometrada de carga HTTP (p50/p95) comparando com a medição de 08/11/2026 | [`DESEMPENHO-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-02) — *Benchmark atual não medido* | Script de carga na API | Comprova em números reais o ganho de velocidade das otimizações feitas |
| **P2 (Quando crescer)** | Migrar o crachá de login (`JWT`) para cookie `HttpOnly` + `Refresh Token` e colocar teto `@db.VarChar` nas colunas de texto | [`ACESSO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-04) e [`ENTRADA-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#entrada-01) | Autenticação + [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) | Camada extra de segurança contra roubo de sessão e limites rígidos no banco |
| **P2 (Quando crescer)** | Mover cache, proteção de clique duplo e limite de acessos para **Redis** + adotar upload assíncrono/direto para o Cloudinary | [`OPERACAO-06`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-06) e [`DESEMPENHO-07`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-07) | Infraestrutura / Mídia | Libera o envio de fotos sem espera e permite rodar 2 ou mais servidores em paralelo |
| **P2 (Manutenção)** | Enxugar resposta de `listProducts`, adicionar `createdAt`/`updatedAt` em Categorias/Fornecedores e alinhar gradualmente os comentários legados do Frontend | [`DESEMPENHO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-04) e documentação inline | [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · Frontend (`75` funções) | Código mais limpo, auditável e fácil de manter *(backend já 100% padronizado em `c5f4466`)* |
