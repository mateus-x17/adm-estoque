# 📑 RELATÓRIO 07 — DIAGNÓSTICO DE PROBLEMAS, CORREÇÕES E VELOCIDADE DO SISTEMA

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(auditoria técnica base de 2026-11-11, verificada contra o código atual da branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 11 — Catálogo Completo (com tabelas Antes × Depois e arquivos)](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)

---

## Resumo para quem não é técnico

Este relatório mostra o "exame médico" completo do **Estoque.OS**: quais problemas existiam na segurança, nas contas do estoque e na velocidade das telas, o que causava cada um deles, o que já foi consertado e o que ainda precisa de atenção.

Em resumo:
- **Segurança e dados:** dos **30 problemas** encontrados no diagnóstico inicial, **19 estão 100% resolvidos**, **10 estão resolvidos em grande parte** (com pequenas pendências anotadas abaixo) e **apenas 1 segue aberto** (o envio de fotos ainda faz o usuário esperar a imagem terminar de subir).
- **Velocidade:** na medição inicial (08/11/2026), algumas telas de relatório chegavam a demorar **mais de 3 segundos** quando 10 pessoas acessavam juntas. As causas principais já foram corrigidas no código, mas ainda falta rodar uma nova medição cronometrada para registrar os tempos novos.
- **Tamanho do site:** o arquivo principal do site atingiu pouco mais de `1 MB` — funciona normalmente, mas dividi-lo em partes menores vai deixar a primeira abertura mais rápida no celular.

---

## Mapa deste relatório

1. **Parte 1 — Diagnóstico dos 30 problemas encontrados e como foram resolvidos** *(organizados em 7 temas, um cartão por problema)*
2. **Parte 2 — Diagnóstico de velocidade (Performance)** *(explicação das métricas, medições reais do início, melhorias aplicadas e tamanho do site)*
3. **Parte 3 — Padronização dos comentários internos do código** *(estado em 11/11/2026 e atualização do backend em 12/11/2026)*

---

## Parte 1 — Diagnóstico dos 30 problemas e como foram resolvidos

Cada bloco abaixo trata **um único problema**, na mesma ordem de leitura: qual era o problema → por que era um risco → causa → como foi resolvido → como sabemos que funciona → o que ainda falta. Para ver a tabela **Antes × Depois**, os arquivos exatos e os commits de cada item, clique no link da ficha no Relatório 11.

### 1.1 Acesso, login e permissões (`ACESSO`)

#### 🔒 ACESSO-01 — Qualquer pessoa podia tentar virar administrador no cadastro ou editando o próprio perfil
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B2 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-01)
- **Qual era o problema:** Um usuário comum podia tentar enviar um campo oculto de cargo (`"role": "ADMIN"`) no cadastro público ou ao editar seu próprio perfil para tentar ganhar poderes de administrador.
- **Por que era um risco:** Qualquer operador de caixa poderia se autopromover a dono da conta e apagar dados ou demitir colegas.
- **Causa:** Aceitar campos do corpo da requisição sem filtrar quais o usuário realmente tinha direito de alterar (*mass assignment*).
- **Como foi resolvido:** O cadastro público cria sempre uma nova empresa isolada apenas para quem se cadastrou; a rota de editar o próprio perfil (`PUT /users/me`) bloqueia qualquer envio de cargo com erro `403`; e a criação/edição de equipe só aceita cargos válidos de quem tem permissão.
- **Como sabemos que funciona:** Confirmado no código (`authService.js`, `userService.js`) e nos **7/7 testes automatizados** (`multitenant_audit.test.mjs`) em 11/11/2026.
- **O que ainda falta:** Nada pendente identificado.

#### 🔒 ACESSO-02 — Um usuário podia ver ou alterar dados de outra empresa, de outra loja ou de áreas restritas
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B3 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-02)
- **Qual era o problema:** Esconder botões no site não impedia alguém de trocar um número no endereço (por exemplo, `/orders/11`) para tentar ver dados de outra empresa, nem impedia um operador de chamar rotas restritas ou um funcionário suspenso de continuar usando o sistema.
- **Por que era um risco:** Vazamento de dados entre empresas concorrentes, cancelamentos indevidos por quem não tem cargo e acesso de funcionários afastados.
- **Causa:** Controle de acesso concentrado demais na tela e falta de filtro obrigatório por empresa e loja em todas as consultas do servidor.
- **Como foi resolvido:**
  1. Criado isolamento estrito em dois níveis (`organizacaoId` + `lojaId`) em `tenantScope.js`, respondendo `404` para qualquer tentativa entre empresas diferentes.
  2. Gerentes e operadores ficam presos à própria filial; operadores recebem `403` em desempenho, gestão de usuários e cancelamento de pedidos.
  3. Criada rota enxuta `GET /users/names` para filtros da interface sem expor dados pessoais.
  4. Usuários em situação `SUSPENSO` ou `FERIAS` são bloqueados na hora (`403`) no `authMiddleware.js`.
  5. Limpeza de arquivos locais protegida contra caminhos maliciosos (`removeLocalUploadIfSafe`).
- **Como sabemos que funciona:** Testado automaticamente em cenários reais na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** no Neon em 11/11/2026).
- **O que ainda falta:** Nada pendente identificado.

#### 🔒 ACESSO-03 — Um administrador podia excluir a si mesmo ou deixar o sistema sem nenhum administrador (ou sem loja ativa)
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B7 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-03)
- **Qual era o problema:** O último administrador ativo podia se apagar, se rebaixar para gerente ou se suspender por engano — e a última loja ativa da rede podia ser desativada.
- **Por que era um risco:** A empresa ficaria totalmente trancada para fora da própria administração ou sem nenhuma loja para vender.
- **Causa:** As funções de edição e exclusão não conferiam antes quantos administradores ativos ou lojas ativas sobrariam.
- **Como foi resolvido:** `userService.js` bloqueia autoexclusão, autossuspensão e qualquer remoção/rebaixamento/suspensão do último `ADMIN ATIVO`; `storeService.js` impede desativar a última loja ativa da organização.
- **Como sabemos que funciona:** Validado no código e na suíte E2E (`7/7` cenários aprovados em 11/11/2026).
- **O que ainda falta:** Nada pendente identificado.

#### 🔒 ACESSO-04 — Brechas de segurança na autenticação, nos relatórios impressos (PDF) e em bibliotecas desatualizadas
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** B11 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-04)
- **Qual era o problema:** Faltava restringir o algoritmo do token de login, blindar os 4 relatórios PDF contra textos maliciosos (ataque **XSS**, onde um texto cadastrado vira código executável no navegador) e atualizar bibliotecas com vulnerabilidades conhecidas.
- **Por que era um risco:** Roubo de sessão no navegador ao abrir um relatório PDF, falsificação de token ou exploração de falhas públicas em pacotes antigos.
- **Causa:** Recursos foram entregues antes da rodada dedicada de endurecimento de segurança (Etapa 9).
- **Como foi resolvido:**
  1. Verificação JWT travada em `HS256`, formato estrito `Bearer`, `userId > 0` e separação entre erro de token e falha temporária do banco (`authMiddleware.js`).
  2. Chave `JWT_SECRET` obrigatória (`>= 16` caracteres) em produção, `Helmet`, `CORS` multi-origem normalizado, limite de `1 MB` em JSON e `dotfiles: "ignore"` em `/uploads` (`index.js`).
  3. Proteção `escapeHtml` aplicada em todos os 4 geradores de PDF A4 + `formatImageUrl` + `rel="noopener noreferrer"`.
  4. `npm audit fix` zerou vulnerabilidades no frontend (`0`, atualizando `react-router-dom ^7.18.5` e `vite ^7.3.8`) e reduziu o backend de `14` para `5` avisos indiretos de ferramentas (`express ^5.2.1`, `multer ^2.5.0`).
- **Como sabemos que funciona:** Validado em 11/11/2026 com `npm audit`, `verify_security.mjs`, `eslint .` (`0` erros), `vite build` e E2E `7/7`.
- **O que ainda falta:** O crachá de login (`JWT`) continua no `localStorage` (risco arquitetural aceito para funcionar entre os domínios Vercel e Render, mitigado pela proteção contra XSS); futuramente recomenda-se migrar para cookies `HttpOnly` com `Refresh Token`. Os 5 avisos indiretos do backend aguardam atualização dos pacotes `@prisma/config` e `exceljs`.

---

### 1.2 Validação de entradas, arquivos e planilhas (`ENTRADA`)

#### 🛡️ ENTRADA-01 — Formulários, uploads de arquivos, links e planilhas aceitavam dados inválidos ou maliciosos
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** B4 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#entrada-01)
- **Qual era o problema:** Uploads podiam tentar burlar a extensão do arquivo, links de comprovante podiam trazer código (`javascript:...`), células exportadas para Excel podiam conter fórmulas maliciosas (`=...`) e senhas curtas demais podiam ser cadastradas.
- **Por que era um risco:** Envio de arquivos maliciosos ao servidor, execução de comandos indesejados no navegador ou no Excel do financeiro e contas com senhas muito fracas.
- **Causa:** Validações iniciais conferiam apenas presença básica de campos, sem lista rígida de formatos permitidos (*whitelist*) nem higienização de links e células de planilha.
- **Como foi resolvido:**
  1. Uploads de imagens e planilhas (`.xlsx`/`.csv`) agora exigem extensão ancorada **e** tipo real (`MIME type`) autorizados, com nome aleatório via `crypto.randomBytes`.
  2. Links de comprovante e imagem são filtrados por `sanitizeSafeUrl` e `formatImageUrl` (bloqueando `javascript:` e `data:`).
  3. Células exportadas para planilhas passam por `sanitizeSpreadsheetCell`, neutralizando fórmulas maliciosas.
  4. Senha mínima obrigatória de `6` caracteres em `authService.js` e `userService.js`.
  5. Limite de `1 MB` por corpo de requisição e `removeLocalUploadIfSafe` contra travessia de pastas.
- **Como sabemos que funciona:** Validado por testes unitários (`verify_security.mjs`) e E2E `7/7` em 11/11/2026.
- **O que ainda falta:** No `schema.prisma`, as colunas de texto ainda não têm limite fixo por coluna (`@db.VarChar`), e a senha ainda não exige combinação obrigatória de letras, números e símbolos (melhorias futuras não bloqueantes).

---

### 1.3 Consistência de estoque, dinheiro, pedidos e exclusões (`DADOS`)

#### 📦 DADOS-01 — Excluir um registro com histórico (produto, loja ou funcionário) travava o sistema com erro genérico
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B6 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-01)
- **Qual era o problema:** Apagar um produto, loja, categoria, fornecedor ou funcionário que já tinha vendas gerava erro interno `500` por causa dos vínculos no banco de dados (chaves estrangeiras).
- **Por que era um risco:** Impedia limpar cadastros antigos ou arriscava destruir o histórico financeiro se a exclusão fosse forçada.
- **Causa:** O código executava exclusão física direta sem política diferenciada para itens de catálogo e para demissão de equipe.
- **Como foi resolvido:** `Loja`, `Produto`, `Categoria` e `Fornecedor` usam desativação lógica (*soft delete*), preservando todo o histórico. Já `Usuario` usa exclusão física real (`ON DELETE SET NULL`), gravando permanentemente a demissão na tabela `RegistroDesligamento` (mesmo com `0` vendas), exibindo `MAT-XXXXX (CANCELADA)`, permitindo filtro de desligados e gerando relatório mensal de desligamento.
- **Como sabemos que funciona:** Testado na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).
- **O que ainda falta:** Nada pendente identificado.

#### 📦 DADOS-02 — Duas vendas ao mesmo tempo podiam deixar o estoque com número errado ou negativo
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I1 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-02)
- **Qual era o problema:** Se dois vendedores vendessem o mesmo produto no mesmo instante, ambos liam o mesmo saldo antigo e uma gravação sobrescrevia a outra (condição de corrida).
- **Por que era um risco:** Vender mercadoria que não existe, furo de estoque e prejuízo real no caixa.
- **Causa:** Calcular o novo saldo na memória do servidor e gravar o valor pronto sem travar a linha no banco.
- **Como foi resolvido:** Aplicada trava de fila ordenada no banco (`ORDER BY id ASC FOR UPDATE`) em `orderService.js` (criação e estorno de pedidos) e `FOR UPDATE` em `productService.js` (`adjustProductQuantity`).
- **Como sabemos que funciona:** Verificado diretamente nos serviços e validado na suíte E2E (`7/7` aprovados em 11/11/2026).
- **O que ainda falta:** Nada bloqueante (como camada extra futura, pode-se incluir `CHECK (quantidade >= 0)` no PostgreSQL e teste automatizado de carga concorrente).

#### 📦 DADOS-03 — Operações com várias etapas podiam parar pela metade e deixar o banco incompleto
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I2 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-03)
- **Qual era o problema:** Ações que gravam várias tabelas juntas (como fechar um pedido com vários itens, fazer estorno, criar organização+loja+admin ou importar planilhas) podiam falhar no meio e deixar metade salva.
- **Por que era um risco:** Estoque baixado sem pedido registrado, estorno sem devolução de mercadoria ou empresas criadas sem administrador.
- **Causa:** Gravações executadas separadamente em vez de agrupadas num único bloco indivisível.
- **Como foi resolvido:** Todos os fluxos multi-etapa foram colocados dentro de `prisma.$transaction` (regra do "ou acontece tudo, ou nada muda").
- **Como sabemos que funciona:** Verificado no código e na suíte E2E (`7/7` aprovados em 11/11/2026).
- **O que ainda falta:** Nada pendente identificado.

#### 📦 DADOS-04 — Preços e totais em dinheiro podiam ter erro de arredondamento nos centavos
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I7 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-04)
- **Qual era o problema:** Valores monetários guardados como ponto flutuante (`Float`) podem gerar imprecisões nos centavos, e alterar o preço de um produto podia afetar cálculos antigos sem preço congelado.
- **Por que era um risco:** Diferenças de centavos no fechamento do caixa e relatórios antigos distorcidos após reajustes de preço.
- **Causa:** Uso inicial de `Float` em vez de tipo decimal exato e ausência de cópia congelada do preço na venda.
- **Como foi resolvido:** `Produto.preco`, `Pedido.valorTotal`, `ItemPedido` e `Movimento` passaram a usar `Decimal(10, 2)` (`numeric(10,2)`) com congelamento do preço praticado no ato da operação.
- **Como sabemos que funciona:** Confirmado no `schema.prisma`, nas migrações aplicadas no Neon (`up to date`) e nos testes E2E `7/7`.
- **O que ainda falta:** Nada pendente identificado.

#### 📦 DADOS-05 — Duas ações simultâneas podiam passar juntas pela mesma verificação de saldo ou cadastro
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I8 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-05)
- **Qual era o problema:** Conferir "tem saldo e o produto está ativo?" antes de travar o registro permitia que outra ação passasse no meio dessa fração de segundo (falha **TOCTOU**).
- **Por que era um risco:** Venda de produto recém-desativado, saldo estourado ou cadastros duplicados sob acessos simultâneos.
- **Causa:** Validação executada fora de trava exclusiva no banco.
- **Como foi resolvido:** A conferência de produto ativo e saldo disponível agora acontece **dentro da transação, depois da trava `FOR UPDATE`**, somada às travas `UNIQUE` nativas do PostgreSQL para e-mails, slugs e matrículas.
- **Como sabemos que funciona:** Confirmado no código de `orderService.js`, `productService.js` e `schema.prisma` + E2E `7/7`.
- **O que ainda falta:** Nada pendente identificado.

#### 📦 DADOS-06 — Clicar duas vezes em "Finalizar pedido" ou "Ajustar estoque" podia registrar a operação em dobro
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I9 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-06)
- **Qual era o problema:** Um clique duplo do operador ou um reenvio automático por internet lenta podia criar duas vendas iguais e baixar o estoque em dobro.
- **Por que era um risco:** Cobrança e baixa duplicada de mercadorias, exigindo estornos manuais constantes.
- **Causa:** Ausência de uma chave única de operação (**idempotência**) para reconhecer envios repetidos.
- **Como foi resolvido:** Implementado suporte a `Idempotency-Key` com namespace isolado `${orgId}:${lojaId}:${key}` nas rotas de criação de pedido (`/orders`) e ajuste de estoque (`/products/:id/adjust`), devolvendo a resposta já processada se a chave repetir.
- **Como sabemos que funciona:** Verificado no código e na suíte E2E (`7/7` aprovados em 11/11/2026).
- **O que ainda falta:** Migrar o armazenamento das chaves da memória local para **Redis** caso o sistema passe a rodar em 2+ servidores (ver `OPERACAO-06`).

---

### 1.4 Velocidade e volume de dados (`DESEMPENHO`)

#### ⚡ DESEMPENHO-01 — Algumas telas puxavam todos os registros do banco de uma só vez, sem divisão por páginas
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** B10 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-01)
- **Qual era o problema:** Buscar tabelas inteiras de uma só vez deixa o sistema cada vez mais lento conforme o número de vendas cresce (na medição de 08/11/2026, `GET /movements?limit=all` levou `862,4 ms` de mediana e `1.783,7 ms` com 10 acessos juntos).
- **Por que era um risco:** Travamento do navegador e alto consumo de servidor em lojas com meses de histórico.
- **Causa:** Falta de limite máximo por página e dependência dos gráficos do painel em receber todos os movimentos brutos.
- **Como foi resolvido:** `/orders`, `/movements`, `/products` e `/users` agora paginam com limite máximo de `100` itens por página.
- **Como sabemos que funciona:** Confirmado nas rotas e serviços atuais.
- **O que ainda falta:** `GET /movements?limit=all` ainda é usado pelo gráfico de fluxo no painel (`useDashboardData.js`), e `/categories` e `/suppliers` retornam listas completas. Recomenda-se criar `GET /movements/flow-summary` no banco e remover `limit=all`.

#### ⚡ DESEMPENHO-02 — Relatórios de vendedores e fornecedores faziam dezenas de consultas repetidas ao banco em vez de uma só
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I3 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-02)
- **Qual era o problema:** Para calcular vendas por vendedor, o servidor fazia 1 consulta inicial e depois dezenas de consultas separadas dentro de um laço (**N+1 consultas**), fazendo a rota chegar a **`3.117,9 ms`** em 08/11/2026.
- **Por que era um risco:** Relatórios gerenciais travando por vários segundos por causa das múltiplas idas e vindas até o banco nos EUA.
- **Causa:** Consultas individuais disparadas dentro de um `map` em JavaScript.
- **Como foi resolvido:** `getUserStatsAggregated`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail` e `getSupplierStats` passaram a executar **1 única consulta SQL nativa (`$queryRaw`)** diretamente no PostgreSQL.
- **Como sabemos que funciona:** Verificado no código (`movementService.js`, `supplierService.js`) e testado na suíte E2E `7/7`.
- **O que ainda falta:** Apenas rodar uma nova medição cronometrada de carga HTTP para registrar o ganho exato em milissegundos (hoje marcado como `NÃO MEDIDO`).

#### ⚡ DESEMPENHO-03 — O servidor puxava listas inteiras para a memória só para somar totais que o banco podia calcular direto
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** I4 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-03)
- **Qual era o problema:** Somar faturamento e quantidades na memória do Node.js obrigava a baixar muitos registros desnecessários (`GET /suppliers/stats` levava `537,2 ms` de mediana em 08/11/2026).
- **Por que era um risco:** Alto uso de memória RAM e queda de velocidade com o crescimento do histórico.
- **Causa:** Uso de `.reduce()` em memória em vez de `SUM`/`COUNT`/`GROUP BY` no banco.
- **Como foi resolvido:** Os principais indicadores (rankings, desempenho e fornecedores) agora são somados direto no PostgreSQL.
- **Como sabemos que funciona:** Confirmado em `movementService.js` e `supplierService.js`.
- **O que ainda falta:** Os gráficos mensais de fluxo no painel principal ainda somam movimentos no navegador via `limit=all` (resolvido ao criar `/movements/flow-summary`).

#### ⚡ DESEMPENHO-04 — Algumas consultas traziam dados extras que a tela não precisava (e faltavam datas de criação/edição em duas tabelas)
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** I5 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-04)
- **Qual era o problema:** A listagem de produtos traz objetos inteiros de `categoria` e `fornecedor` em vez de apenas nome e código, e essas duas tabelas não têm `createdAt`/`updatedAt`.
- **Por que era um risco:** Respostas um pouco maiores que o necessário e menor rastreabilidade de quando categorias ou fornecedores foram editados.
- **Causa:** Uso de `include` completo em `listProducts` e omissão dos campos de data no modelo inicial.
- **Como foi resolvido:** Campos sensíveis de usuários já são sempre filtrados, mas a projeção enxuta em `listProducts` e as datas em `Categoria`/`Fornecedor` seguem pendentes.
- **Como sabemos que funciona:** Verificado em `productService.js` e `schema.prisma`.
- **O que ainda falta:** Trocar `include` por `select` enxuto em `listProducts` e adicionar `createdAt`/`updatedAt` em `Categoria` e `Fornecedor`.

#### ⚡ DESEMPENHO-05 — O banco precisava ler tabelas inteiras por falta de índices nas buscas por empresa e loja
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I6 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-05)
- **Qual era o problema:** Sem índices compostos por empresa, loja e vendedor, o PostgreSQL precisava varrer muito mais linhas para responder filtros rotineiros (`GET /products` levava `546,8 ms` em 08/11/2026).
- **Por que era um risco:** Queda forte de velocidade conforme novas empresas e lojas entrassem no banco.
- **Causa:** Índices antigos não contemplavam a arquitetura multi-organização e o histórico por `vendedorRefId`.
- **Como foi resolvido:** Criados índices compostos `[organizacaoId, lojaId, ...]` e `[organizacaoId, vendedorRefId, data]` na migração `20261110020000_organizacao_multipedidos`.
- **Como sabemos que funciona:** Confirmado em `schema.prisma` e via `npx prisma migrate status` (`up to date`) no NeonDB em 11/11/2026.
- **O que ainda falta:** Nada bloqueante.

#### ⚡ DESEMPENHO-06 — O sistema consultava o banco repetidamente para buscar os mesmos dados de usuário e listas de nomes
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** A1 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-06)
- **Qual era o problema:** Toda requisição autenticada ia ao banco conferir o usuário (~140 ms de viagem na rede até os EUA) e filtros de nomes faziam 2 idas ao banco (`GET /users/names` levava `282,9 ms` em 08/11/2026).
- **Por que era um risco:** Latência acumulada em cada clique e carga repetitiva desnecessária no banco.
- **Causa:** Falta de memória temporária (**cache**) com limpeza automática ao editar dados.
- **Como foi resolvido:** Criados `userCache` (validade `60s`) no `authMiddleware.js` e `namesCacheByScope` (validade `30s`) no `userService.js`, ambos invalidados na hora sempre que um usuário é criado, editado, suspenso, transferido ou demitido, ou quando uma loja é desativada.
- **Como sabemos que funciona:** Confirmado no código e na suíte E2E (`7/7` aprovados, testando invalidação imediata ao suspender usuário).
- **O que ainda falta:** Migrar para **Redis** apenas quando o sistema passar a rodar em 2+ servidores (ver `OPERACAO-06`).

#### ⚡ DESEMPENHO-07 — O envio de fotos para a nuvem deixava o usuário esperando a imagem subir antes de receber resposta
- **Situação atual:** 🔴 Ainda em aberto · **Código no catálogo original:** A2 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-07)
- **Qual era o problema:** Ao cadastrar ou editar um produto ou usuário com foto, a requisição fica aguardando a imagem terminar de subir para o Cloudinary antes de responder ao navegador.
- **Por que era um risco:** Lentidão sentida pelo usuário durante envios de fotos e ocupação desnecessária da requisição no servidor.
- **Causa:** Fluxo de upload totalmente síncrono dentro da requisição HTTP.
- **Como foi resolvido:** Ainda não convertido para assíncrono; está apenas protegido contra travamentos infinitos pelo timeout de `10s` (`OPERACAO-04`).
- **Como sabemos que funciona:** Confirmado por inspeção direta em `cloudinaryConfig.js`, `productService.js` e `userService.js`.
- **O que ainda falta:** Migrar para upload direto assinado do navegador para o Cloudinary (*Signed Uploads*) ou fila assíncrona.

#### ⚡ DESEMPENHO-08 — O arquivo principal do site ficou pesado para carregar de uma vez (e não há configuração Docker)
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** A8 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-08)
- **Qual era o problema:** Todo o código JavaScript do site vai num único arquivo de **`1.020,48 kB`** (`284,61 kB` gzip), fazendo até quem abre só a tela de login baixar o código de telas pesadas. Além disso, não há `Dockerfile` e faltava configurar `trust proxy` para o Render.
- **Por que era um risco:** Carregamento inicial mais lento em conexões móveis fracas e maior esforço se o projeto precisar migrar para contêineres.
- **Causa:** Todas as páginas do React são importadas diretamente em `routes.jsx` sem divisão de código (*code-splitting*).
- **Como foi resolvido:** Configurado `trust proxy = 1` em `index.js` para a hospedagem no Render.
- **Como sabemos que funciona:** Medido via `vite build` em 11/11/2026 (`2.420` módulos, `index-HtmucMcS.js` com `1.020,48 kB`) e confirmado em `index.js`.
- **O que ainda falta:** Aplicar `React.lazy()` + `<Suspense>` em `routes.jsx` para dividir o bundle em partes menores e criar `Dockerfile` caso mude de hospedagem.

---

### 1.5 Operação do servidor, segredos e escala (`OPERACAO`)

#### ⚙️ OPERACAO-01 — Senhas, chaves secretas ou detalhes do banco podiam aparecer em logs ou mensagens de erro
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** B1 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-01)
- **Qual era o problema:** Mensagens de erro em `/test-db` ou falhas internas podiam mostrar detalhes do banco na resposta da API, e o servidor podia subir em produção sem uma chave `JWT_SECRET` forte.
- **Por que era um risco:** Vazamento de credenciais de banco ou da chave de assinatura de login.
- **Causa:** Respostas de depuração ainda ativas sem filtro de ambiente de produção.
- **Como foi resolvido:** `.env` mantido fora do Git; `index.js` aborta o startup em produção se `JWT_SECRET` tiver menos de 16 caracteres; `/test-db` e `errorHandler.js` ocultam detalhes técnicos em produção.
- **Como sabemos que funciona:** Confirmado em `index.js`, `errorHandler.js` e no teste ao vivo de produção (`https://adm-estoque.onrender.com/test-db` → `200 OK`).
- **O que ainda falta:** Ação preventiva fora do código: rotacionar (trocar) as senhas externas do Neon/Cloudinary caso tenham sido exibidas fora de canal privado durante testes.

#### ⚙️ OPERACAO-02 — Erros do sistema podiam vazar detalhes técnicos internos e retornar formatos diferentes em cada rota
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B5 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-02)
- **Qual era o problema:** Erros de upload, banco ou validações podiam responder em formatos inconsistentes ou expor a trilha interna de código (*stack trace*).
- **Por que era um risco:** Telas de erro confusas para o usuário e pistas técnicas expostas para invasores.
- **Causa:** Falta de tradução centralizada de erros do Prisma e do Multer.
- **Como foi resolvido:** `errorHandler.js` centraliza todas as falhas, esconde detalhes internos em erros `>= 500` e traduz `MulterError` (`400`) e códigos Prisma `P2002`/`P2025`/`P2003` (`409`/`404`).
- **Como sabemos que funciona:** Validado por teste unitário (`verify_security.mjs`) e inspeção direta em 11/11/2026.
- **O que ainda falta:** Nada pendente identificado.

#### ⚙️ OPERACAO-03 — Faltava limite de tentativas contra ataques de força bruta ou excesso de acessos simultâneos
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** I10 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-03)
- **Qual era o problema:** Sem limite de requisições (*rate limit*) e sem `trust proxy`, robôs podiam tentar senhas sem parar ou derrubar o servidor.
- **Por que era um risco:** Invasão de contas por força bruta, spam de cadastros e queda do serviço.
- **Causa:** Ausência de limitador global e de configuração do proxy do Render.
- **Como foi resolvido:** Ativado `trust proxy = 1`, limite global `apiLimiter` (`400 req / 15 min / IP`) em `index.js`, além de `loginLimiter` (`25 / 15 min`) e `registerLimiter` (`15 / 1 h`) em `authRoutes.js`.
- **Como sabemos que funciona:** Confirmado diretamente em `index.js` e `authRoutes.js`.
- **O que ainda falta:** Mover os contadores para **Redis** apenas quando o sistema escalar para 2+ servidores (ver `OPERACAO-06`).

#### ⚙️ OPERACAO-04 — Se o serviço de imagens (Cloudinary) travasse, a requisição podia ficar presa sem fim e deixar lixo em disco
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** A3 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-04)
- **Qual era o problema:** O envio de foto para o Cloudinary não tinha tempo máximo de espera (*timeout*) nem garantia de apagar o arquivo temporário se o envio falhasse.
- **Por que era um risco:** Requisições penduradas indefinidamente e disco do servidor acumulando sobras temporárias.
- **Causa:** Chamada externa sem cronômetro nem bloco `finally` de limpeza.
- **Como foi resolvido:** `uploadToCloudinary` agora aplica `Promise.race` com limite rígido de **10 segundos** e garante `fs.unlink` no `finally`, salvando imagens em pastas isoladas por organização e loja.
- **Como sabemos que funciona:** Confirmado em `cloudinaryConfig.js` e `sanitizers.js`.
- **O que ainda falta:** Nada pendente para o limite de tempo (a conversão para upload assíncrono está em `DESEMPENHO-07`).

#### ⚙️ OPERACAO-05 — Muitas conexões simultâneas podiam esgotar o banco de dados na nuvem sem um gerenciador de conexões
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** A4 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-05)
- **Qual era o problema:** Conectar diretamente ao PostgreSQL na nuvem sem um gerenciador (*pooler*) pode estourar o limite de conexões sob picos de acesso.
- **Por que era um risco:** Recusa de conexões e quedas momentâneas em horários de maior movimento.
- **Causa:** Necessidade de apontar a produção para o endpoint gerenciado `-pooler` do NeonDB.
- **Como foi resolvido:** Produção no Render conectada ao pooler oficial do Neon (`ep-bold-poetry-adxi7rof-pooler`) com `&connect_timeout=15` documentado e isolamento de erros transitórios de banco no `authMiddleware.js`.
- **Como sabemos que funciona:** Validado ao vivo em 11/11/2026 via `/test-db` (`200 OK`) e E2E `7/7` no Neon.
- **O que ainda falta:** Nada bloqueante para a operação atual.

#### ⚙️ OPERACAO-06 — Cache, proteção de clique duplo e limite de acessos ficam na memória de um único servidor (impedindo escalar para 2+ servidores)
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** A5 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-06)
- **Qual era o problema:** As estruturas `userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rate-limit` ficam na memória RAM local do Node.js, e havia um `loginLimiter` morto sobrando em `index.js`.
- **Por que era um risco:** Se o sistema ligar 2 ou mais servidores em paralelo no futuro, um servidor não enxergará o cache nem os bloqueios do outro.
- **Causa:** Escolha pragmática de usar memória local enquanto o sistema roda em 1 instância única no Render.
- **Como foi resolvido:** Removido o código morto (`loginLimiter` em `index.js`) e padronizadas as chaves isoladas por empresa/loja.
- **Como sabemos que funciona:** Verificado no código dos serviços e em `index.js`.
- **O que ainda falta:** Migrar essas 5 estruturas para **Redis** antes de ativar escala horizontal (2+ instâncias no Render).

#### ⚙️ OPERACAO-07 — Faltava rastreamento estruturado para acompanhar o caminho completo de um erro em produção
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** A6 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-07)
- **Qual era o problema:** Sem logs estruturados nem etiqueta única por requisição, ficava difícil investigar erros quando vários usuários acessavam ao mesmo tempo.
- **Por que era um risco:** Lentidão para descobrir e corrigir problemas relatados por clientes em produção.
- **Causa:** Falta de biblioteca de log estruturado e identificador de correlação.
- **Como foi resolvido:** Implantado `Pino` (logs em JSON) em `logger.js` + cabeçalho único `X-Request-Id` (UUID) gerado em `requestLogger.js`.
- **Como sabemos que funciona:** Confirmado diretamente em `logger.js` e `requestLogger.js`.
- **O que ainda falta:** Nada bloqueante para a etapa atual.

#### ⚙️ OPERACAO-08 — Faltavam checagens de saúde do servidor e um desligamento seguro sem derrubar ações em andamento
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** A7 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-08)
- **Qual era o problema:** Reiniciar o servidor durante atualizações podia cortar vendas pela metade e deixar conexões penduradas no banco.
- **Por que era um risco:** Falhas durante deploys e conexões presas no PostgreSQL.
- **Causa:** Falta de tratamento dos sinais `SIGTERM`/`SIGINT` de encerramento.
- **Como foi resolvido:** Rotas `/` e `/test-db` operacionais + rotina de desligamento seguro (`shutdown`) em `index.js` encerrando o servidor HTTP e chamando `prisma.$disconnect()` com limite de 10 segundos.
- **Como sabemos que funciona:** Confirmado em `index.js` e verificado em produção (`200 OK` em `/test-db`).
- **O que ainda falta:** Nada pendente identificado.

---

### 1.6 Interface e comunicação com o servidor (`TELA`)

#### 🖥️ TELA-01 — Recarregar a página ou ficar sem login podia causar tela branca ou abrir páginas sem permissão
- **Situação atual:** ✅ Resolvido · **Código no catálogo original:** B8 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-01)
- **Qual era o problema:** Recarregar a tela antes de carregar os dados do usuário podia gerar erro de objeto nulo (tela branca), e faltava feedback visual quando o servidor gratuito no Render demorava a acordar.
- **Por que era um risco:** Tela quebrada para o usuário e impressão de sistema travado durante a partida fria (*cold-start*).
- **Causa:** Leitura direta de `user` sem checagem de estado e ausência de aviso de espera na conexão.
- **Como foi resolvido:** `ProtectedRoute.jsx` agora suporta listas de cargos (`requiredRole={["ADMIN", "GERENTE"]}`), componentes protegem contra nulo e `apiClient.js` + `serverToast.js` aguardam `1000 ms` exibindo aviso amigável quando o servidor está acordando.
- **Como sabemos que funciona:** Confirmado no código, `eslint .` (`0` erros) e `vite build` em 11/11/2026.
- **O que ainda falta:** Nada bloqueante identificado.

#### 🖥️ TELA-02 — Algumas telas chamavam o servidor fora do canal padrão, perdendo avisos e controles automáticos
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** B9 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-02)
- **Qual era o problema:** Telas que usam `fetch()` direto em vez de `apiClient.js` não recebem automaticamente o cabeçalho de filial (`X-Loja-Id`), o aviso de servidor acordando nem o deslogue automático quando a sessão expira (`401`).
- **Por que era um risco:** Comportamento inconsistente ao editar registros em comparação com o resto do site.
- **Causa:** Componente legado não migrado junto com as páginas novas.
- **Como foi resolvido:** `LoginForm.jsx` e todas as telas recentes foram migrados para `apiClient.js`.
- **Como sabemos que funciona:** Verificado no código atual em 17/11/2026: restam apenas **2 chamadas diretas `fetch()`** em [EditarItem.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L365-L417) (linhas `365` e `417`).
- **O que ainda falta:** Migrar essas 2 chamadas restantes de `EditarItem.jsx` para `apiClient.js`.

---

### 1.7 Testes e automação (`QUALIDADE`)

#### 🧪 QUALIDADE-01 — Falta de testes automatizados e de verificação automática antes de publicar novas versões
- **Situação atual:** 🟡 Resolvido em parte · **Código no catálogo original:** I11 · [Ficha técnica completa](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#qualidade-01)
- **Qual era o problema:** No início, o sistema não possuía testes automáticos para confirmar que mudanças novas não quebraram regras antigas de estoque ou permissão.
- **Por que era um risco:** Bugs voltarem sem ninguém perceber antes de publicar em produção.
- **Causa:** Suíte de testes e esteira de CI ainda não construídas na versão inicial.
- **Como foi resolvido:** Criada a suíte oficial E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) (`7/7` cenários reais aprovados no Neon), mais verificação unitária de segurança (`verify_security.mjs`), `npm --prefix frontend run lint` (`0` erros/avisos) e `vite build` (`2.420` módulos).
- **Como sabemos que funciona:** Todos os testes e validações acima foram executados e aprovados após as mudanças de 11/11/2026.
- **O que ainda falta:** Criar testes automatizados de navegador (**Playwright**), testes unitários isolados e configurar uma esteira automática **CI/CD** no GitHub Actions.

---

## Parte 2 — Diagnóstico de velocidade (Performance)

### 2.1 Como ler a tabela de tempos abaixo (guia rápido)
Antes de olhar os números, entenda o que cada coluna mede (todos os tempos estão em **milissegundos** — lembre-se que `1.000 ms = 1 segundo`):

- **1ª abertura (Fria / Warmup):** o tempo da primeira chamada logo após o servidor acordar ou aquecer.
- **Tempo típico (p50 / mediana):** o tempo que a **metade mais rápida** das pessoas experimenta no uso normal.
- **Casos mais lentos (p95):** o tempo máximo que **95 em cada 100 pessoas** esperaram (mostra os picos que mais incomodam).
- **10 pessoas juntas (Concorrência 10):** o tempo típico quando 10 usuários abrem aquela mesma tela no exato mesmo segundo.

### 2.2 Como era a velocidade no início *(Medição real feita em 08/11/2026 — Etapa 0, antes das otimizações)*

Os números abaixo foram medidos **antes** de criar o cache de usuário, antes de eliminar as consultas repetidas (`N+1`), antes dos novos índices no banco e antes do módulo de pedidos com vários itens:

| O que o usuário está fazendo (e rota técnica) | 1ª abertura | Tempo típico (p50) | Casos lentos (p95) | 10 pessoas juntas | Por que demorava na época |
|---|---:|---:|---:|---:|---|
| Conferir se o servidor está no ar (`GET /`) | `21,0 ms` | `5,2 ms` | `7,8 ms` | `46,1 ms` | Resposta imediata na memória (não vai ao banco) |
| Testar conexão com o banco (`GET /test-db`) | `141,7 ms` | `141,2 ms` | `154,0 ms` | `893,0 ms` | Tempo de viagem pela internet do Brasil até o banco Neon nos EUA (`us-east-1`) |
| Carregar nomes no filtro (`GET /users/names`) | `559,4 ms` | `282,9 ms` | `290,8 ms` | `647,4 ms` | Fazia 2 viagens ao banco toda vez (ainda sem cache) |
| Abrir estatísticas de fornecedores (`GET /suppliers/stats`) | `1.045,7 ms` | `537,2 ms` | `661,6 ms` | `1.531,2 ms` | Trazia os dados para somar na memória do servidor em vez de somar no banco |
| Abrir a tela de Produtos (`GET /products`) | `944,6 ms` | `546,8 ms` | `612,0 ms` | `1.529,7 ms` | Viagem extra para conferir login + índices antigos no banco |
| Abrir relatório por vendedor (`GET /movements/user-stats`) | `1.440,7 ms` | `718,4 ms` | `1.012,6 ms` | `2.232,9 ms` *(pico `3.117,9 ms`)* | Fazia dezenas de consultas repetidas em sequência (**N+1**) |
| Carregar gráfico com todo o histórico (`GET /movements?limit=all`) | `1.020,3 ms` | `862,4 ms` | `1.190,0 ms` | `1.783,7 ms` | Puxava todos os registros de uma vez sem limite |

### 2.3 Como está hoje *(o que já melhorou no código × o que ainda NÃO foi medido)*

- **Melhorias de velocidade já ativas no código atual (`[VERIFICADO]`):**
  1. **Cache de login (`userCache`, validade de 60s):** evita 1 viagem inteira ao banco nos EUA (~`140 ms` da medição inicial) em cada clique seguinte dentro do minuto.
  2. **Cache de nomes (`namesCacheByScope`, validade de 30s):** evita repetir consultas ao abrir menus de filtro.
  3. **Cálculos direto no PostgreSQL (`$queryRaw`) + novos índices:** `/movements/user-stats`, `/movements/performance`, `/movements/performance/:refId` e `/suppliers/stats` agora rodam em uma única consulta SQL apoiada por índices `[organizacaoId, lojaId, data]` e `[organizacaoId, vendedorRefId, data]`.

- **Nova medição cronometrada sob carga HTTP (situação atual pós-Etapa 8): `NÃO MEDIDO`.**
  - Ainda não foi executada uma nova bateria de cronômetro HTTP comparando p50/p95 depois de todas as otimizações. Por honestidade técnica, não inventamos percentuais de ganho sem medir.
  - O que **foi verificado na prática em 11/11/2026**: a suíte E2E [`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs) passou **7/7 cenários** no banco Neon ativo (`ep-bold-poetry-adxi7rof-pooler`), as 9 migrações estão aplicadas e o servidor em produção (`https://adm-estoque.onrender.com/test-db`) respondeu `200 OK` com `CORS` liberado para a Vercel.

### 2.4 Peso do site ao abrir no navegador *(Medição real via `vite build` em 11/11/2026)*
- **Total de módulos empacotados:** `2.420` módulos compilados em `1m 42s`.
- **Arquivo de estilos (CSS):** `48,39 kB` (`9,39 kB` compactado) — excelente, muito leve.
- **Arquivo principal de código (JavaScript — `index-HtmucMcS.js`):** **`1.020,48 kB`** (`284,61 kB` compactado em gzip).
- **O que isso significa na prática:** o próprio empacotador (Vite/Rollup) emitiu alerta porque arquivos acima de `500 kB` demoram um pouco mais para abrir na primeira visita em celulares. A solução já planejada (`DESEMPENHO-08`) é dividir as páginas administrativas com carregamento sob demanda (*code-splitting*).

---

## Parte 3 — Padronização dos comentários internos do código

Para facilitar a manutenção do código por qualquer desenvolvedor, o projeto adota regras de documentação inline em todas as funções:

1. **Auditoria registrada em 11/11/2026 (Etapa 9 — padrão [`promptFuncExplic.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic.md)):**
   - **100%** das funções criadas ou alteradas na rodada de segurança seguiram o cabeçalho e a numeração por passos.
   - No código legado anterior (preservado sem reescrita naquela rodada):
     - **Backend (`backend/src`):** `38` arquivos / `157` funções nomeadas (`10/38` com cabeçalho antes dos imports, `20/157` estritamente conformes e `91/157` com passos numerados).
     - **Frontend (`frontend/src`):** `79` arquivos escaneados de `81` totais / `75` funções nomeadas de topo (`9/79` com cabeçalho antes dos imports, `8/75` estritamente conformes, `19/75` com passos numerados e `54/75` sem comentário).
2. **Atualização verificada no Git em 12/11/2026 (commit `c5f4466`):**
   - Após o relatório de 11/11/2026, todos os **38 arquivos de módulos, controllers, rotas, middlewares, utilitários e serviços do backend** foram padronizados conforme o guia mais recente [`promptFuncExplic2.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic2.md).
   - No **frontend**, a padronização gradual das funções legadas continua planejada para ser feita conforme cada tela evoluir.
