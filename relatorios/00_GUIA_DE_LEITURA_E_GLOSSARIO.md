# 🧭 GUIA DE LEITURA E GLOSSÁRIO — ESTOQUE.OS

**Última atualização:** 2026-11-17  
**Para quem é este arquivo:** para **qualquer pessoa** que abra a pasta `relatorios/` pela primeira vez — seja alguém de negócios, um recrutador, um gestor ou um desenvolvedor.

---

## Resumo para quem não é técnico

Os documentos desta pasta contam a história completa do sistema **Estoque.OS**: o que ele faz, como funciona por dentro, quais problemas existiam no início, como cada problema foi corrigido e o que ainda pode melhorar no futuro.

Este guia existe para que você **nunca fique perdido em siglas ou termos difíceis**. Aqui você encontra:
- a ordem mais fácil para ler os relatórios;
- o que foi feito em cada etapa da evolução do projeto (sem códigos misteriosos);
- a tabela que liga os códigos antigos (`B1`, `I3`, `A5`…) aos nomes claros de cada problema;
- um glossário com explicações simples e exemplos do dia a dia para cada palavra técnica usada nos textos.

---

## 1. Como ler estes relatórios (ordem recomendada)

Você não precisa ler todos os arquivos de uma vez. Escolha o caminho conforme o seu objetivo:

### Caminho rápido (entender o sistema e o que foi melhorado)
1. **Este guia** (`00_GUIA_DE_LEITURA_E_GLOSSARIO.md`) — para saber onde está cada assunto.
2. [**Relatório 01 — Visão Geral e Inventário**](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/01_visao_geral_e_inventario.md) — o que é o Estoque.OS, para quem serve e quais tecnologias usa.
3. [**Relatório 13 — Resumo Executivo de Mudanças e Melhorias**](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/13_relatorio_consolidado_de_mudancas_e_melhorias.md) — como o sistema era no início, o que mudou em cada etapa e como está hoje.
4. [**Relatório 11 — Catálogo de Problemas e Correções**](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md) — lista completa dos 30 problemas encontrados, explicando em linguagem simples qual era o erro, o risco, a causa e a solução.

### Mapa completo de todos os arquivos da pasta

| Arquivo | O que você encontra nele | Nível de leitura |
|---|---|---|
| [`00_GUIA_DE_LEITURA_E_GLOSSARIO.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) | Ordem de leitura, linha do tempo das etapas, índice dos problemas e glossário | Para todos |
| [`00_REGISTRO_DE_PROGRESSO.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_REGISTRO_DE_PROGRESSO.md) | Diário oficial de evolução do projeto, datas e entregas verificadas | Para todos |
| [`01_visao_geral_e_inventario.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/01_visao_geral_e_inventario.md) | Apresentação do sistema, tecnologias e mapa de pastas do código | Para todos / Técnico |
| [`02_mapeamento_de_modulos.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/02_mapeamento_de_modulos.md) | Como cada parte interna do sistema (produtos, pedidos, usuários, lojas) funciona | Técnico |
| [`03_mapeamento_de_apis.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/03_mapeamento_de_apis.md) | Lista de todos os 57 endereços de comunicação entre o site e o servidor | Técnico |
| [`04_models_e_banco_de_dados.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/04_models_e_banco_de_dados.md) | Como os dados ficam guardados nas tabelas do banco de dados | Técnico |
| [`05_jornadas_de_uso.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/05_jornadas_de_uso.md) | Passo a passo de como administradores, gerentes e operadores usam o sistema | Para todos |
| [`06_regras_de_negocio.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/06_regras_de_negocio.md) | Todas as 33 regras obrigatórias do funcionamento do negócio | Para todos / Técnico |
| [`07_diagnostico_auditoria_e_performance.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/07_diagnostico_auditoria_e_performance.md) | Diagnóstico dos 30 problemas por tema e medições de velocidade do sistema | Para todos / Técnico |
| [`08_melhorias_por_componente.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/08_melhorias_por_componente.md) | O que mudou em cada arquivo do código e o que ainda pode ser refinado | Técnico |
| [`09_arquitetura_e_system_design.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/09_arquitetura_e_system_design.md) | Desenho de como o sistema está estruturado hoje e como escalá-lo para centenas de usuários | Intermediário / Técnico |
| [`10_plano_consolidado_de_implementacao.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/10_plano_consolidado_de_implementacao.md) | O que já foi concluído e a fila de próximas melhorias por prioridade | Para todos / Técnico |
| [`11_matriz_consolidada_de_falhas.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md) | **Documento principal de problemas:** ficha completa de todos os 30 problemas e suas correções | Para todos / Técnico |
| [`12_analise_de_produto.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/12_analise_de_produto.md) | Posicionamento de mercado, diferenciais e lacunas comerciais do Estoque.OS | Negócios / Para todos |
| [`13_relatorio_consolidado_de_mudancas_e_melhorias.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/13_relatorio_consolidado_de_mudancas_e_melhorias.md) | Comparativo completo entre a primeira versão do sistema e a versão atual | Para todos |
| [`14_analise_minuciosa_de_valor_de_mercado.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/14_analise_minuciosa_de_valor_de_mercado.md) | Estimativa de custo de desenvolvimento, precificação e modelos de monetização | Negócios / Para todos |

---

## 2. Linha do tempo das etapas do projeto

Nos documentos originais, as etapas eram chamadas apenas de "Fase A", "Fase B", "Fase H" etc. Abaixo está o significado claro de cada uma, em ordem cronológica:

| Etapa | Nome descritivo | Nome antigo | Data | O que mudou na prática para quem usa o sistema |
|---|---|---|---|---|
| **Etapa 0** | Diagnóstico inicial do sistema | Baseline (Fases 1–9) | 08/11/2026 | Mapeamento inicial do código, medição da velocidade real das telas e descoberta dos 30 problemas. |
| **Etapa 1** | Blindagem de segurança e proteção do estoque | Fase A | 08/11/2026 | Impediu vendas simultâneas de estragarem o saldo, bloqueou cliques duplos, protegeu o último administrador e limitou tentativas abusivas de cadastro. |
| **Etapa 2** | Aceleração de relatórios e fim das consultas repetidas | Fase B | 08/11/2026 | Os cálculos de vendedores e fornecedores passaram a ser feitos direto no banco de dados, evitando dezenas de viagens desnecessárias ao servidor. |
| **Etapa 3** | Precisão financeira em centavos e índices no banco | Fase C | 08/11/2026 | Os preços deixaram de sofrer arredondamento incorreto nos centavos e o banco ganhou índices para encontrar dados mais rápido. |
| **Etapa 4** | Memória rápida (cache) e envio seguro de imagens | Fase D | 08/11/2026 | Dados consultados toda hora passaram a ficar guardados temporariamente na memória e o envio de fotos ganhou limite máximo de espera de 10 segundos. |
| **Etapa 5** | Relatórios executivos de vendas em PDF A4 | Fase E | 09/11/2026 | Criação de gráficos de vendas (1 mês, 6 meses e 1 ano) prontos para impressão limpa em folha A4. |
| **Etapa 6** | Rastreamento de logs e desligamento seguro do servidor | Fase F | 09/11/2026 | Cada pedido ao servidor ganhou um código único de rastreio nos registros e o servidor aprendeu a desligar sem derrubar quem está no meio de uma ação. |
| **Etapa 7** | Separação inicial por empresa e planilhas Excel/CSV | Fase G | 10/11/2026 | Empresas passaram a ficar separadas umas das outras, exclusões preservaram histórico, operadores ganharam sigilo e chegou a importação/exportação de planilhas. |
| **Etapa 8** | Uma empresa com várias lojas, pedidos com vários itens e gestão de funcionários | Fase H | 10/11/2026 | Evolução para redes com múltiplas lojas, portais separados para Dono e Loja, carrinho com vários itens, estorno de pedido, comprovante de pagamento, matrícula única (`MAT-00001`), férias/suspensão, demissão com histórico preservado e ranking de vendedores. |
| **Etapa 9** | Reforço final de segurança contra invasões e publicação em nuvem | Hardening & Deploy | 11/11/2026 | Proteção contra ataques em uploads, links, planilhas e PDFs; atualização de bibliotecas vulneráveis; aviso visual quando o servidor em nuvem está acordando; organização das migrações do banco e testes completos no ambiente real. |

---

## 3. Legenda das situações dos problemas

Em todos os relatórios, cada problema aparece com uma destas quatro etiquetas claras:

| Situação | O que significa na prática |
|---|---|
| ✅ **Resolvido** | A correção está pronta no código e foi confirmada por teste automatizado, execução real ou revisão direta. |
| 🟡 **Resolvido em parte** | O problema principal foi mitigado ou corrigido na maior parte do sistema, mas ainda sobrou alguma pendência — sempre explicada no item **"O que ainda falta"**. |
| 🔴 **Ainda em aberto** | O problema foi identificado, está registrado, mas ainda não foi corrigido no código. |
| ⚪ **Risco aceito** | Foi tomada uma decisão consciente de não mudar isso agora por causa de um motivo técnico ou de produto — sempre explicado junto. |

---

## 4. Tabela de equivalência dos 30 problemas

Os relatórios anteriores usavam códigos curtos vindos do catálogo de auditoria (`B` = Básico, `I` = Intermediário, `A` = Avançado). Para facilitar a leitura, cada problema agora tem um **ID amigável por tema** e um **título que explica o sintoma**.

### Os 7 temas usados
- **`ACESSO`** — Login, permissões e separação entre empresas e lojas.
- **`ENTRADA`** — Proteção contra dados inválidos ou maliciosos em formulários, arquivos, links e planilhas.
- **`DADOS`** — Estoque certo, dinheiro sem erro de centavos, pedidos completos e exclusões sem quebrar histórico.
- **`DESEMPENHO`** — Velocidade das telas, tamanho das listas e eficiência das buscas no banco.
- **`OPERACAO`** — Saúde do servidor em produção, proteção de segredos, registro de erros e capacidade de crescer.
- **`TELA`** — Estabilidade visual do site e padronização da comunicação com o servidor.
- **`QUALIDADE`** — Testes automatizados e checagens automáticas antes de publicar alterações.

### Índice completo (30 problemas)

| ID novo | Título do problema | Código original | Situação atual | Ficha completa |
|---|---|---:|---|---|
| `ACESSO-01` | Qualquer pessoa podia tentar virar administrador no cadastro ou editando o próprio perfil | `B2` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-01) |
| `ACESSO-02` | Um usuário podia ver ou alterar dados de outra empresa, de outra loja ou de áreas restritas | `B3` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-02) |
| `ACESSO-03` | Um administrador podia excluir a si mesmo ou deixar o sistema sem nenhum administrador (ou sem loja ativa) | `B7` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-03) |
| `ACESSO-04` | Brechas de segurança na autenticação, nos relatórios impressos (PDF) e em bibliotecas desatualizadas | `B11` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-04) |
| `ENTRADA-01` | Formulários, uploads de arquivos, links e planilhas aceitavam dados inválidos ou maliciosos | `B4` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#entrada-01) |
| `DADOS-01` | Excluir um registro com histórico (produto, loja ou funcionário) travava o sistema com erro genérico | `B6` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-01) |
| `DADOS-02` | Duas vendas ao mesmo tempo podiam deixar o estoque com número errado ou negativo | `I1` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-02) |
| `DADOS-03` | Operações com várias etapas podiam parar pela metade e deixar o banco incompleto | `I2` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-03) |
| `DADOS-04` | Preços e totais em dinheiro podiam ter erro de arredondamento nos centavos | `I7` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-04) |
| `DADOS-05` | Duas ações simultâneas podiam passar juntas pela mesma verificação de saldo ou cadastro | `I8` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-05) |
| `DADOS-06` | Clicar duas vezes em "Finalizar pedido" ou "Ajustar estoque" podia registrar a operação em dobro | `I9` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#dados-06) |
| `DESEMPENHO-01` | Algumas telas puxavam todos os registros do banco de uma só vez, sem divisão por páginas | `B10` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-01) |
| `DESEMPENHO-02` | Relatórios de vendedores e fornecedores faziam dezenas de consultas repetidas ao banco em vez de uma só | `I3` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-02) |
| `DESEMPENHO-03` | O servidor puxava listas inteiras para a memória só para somar totais que o banco podia calcular direto | `I4` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-03) |
| `DESEMPENHO-04` | Algumas consultas traziam dados extras que a tela não precisava (e faltavam datas de criação/edição em duas tabelas) | `I5` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-04) |
| `DESEMPENHO-05` | O banco precisava ler tabelas inteiras por falta de índices nas buscas por empresa e loja | `I6` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-05) |
| `DESEMPENHO-06` | O sistema consultava o banco repetidamente para buscar os mesmos dados de usuário e listas de nomes | `A1` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-06) |
| `DESEMPENHO-07` | O envio de fotos para a nuvem deixava o usuário esperando a imagem subir antes de receber resposta | `A2` | 🔴 Ainda em aberto | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-07) |
| `DESEMPENHO-08` | O arquivo principal do site ficou pesado para carregar de uma vez (e não há configuração Docker) | `A8` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-08) |
| `OPERACAO-01` | Senhas, chaves secretas ou detalhes do banco podiam aparecer em logs ou mensagens de erro | `B1` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-01) |
| `OPERACAO-02` | Erros do sistema podiam vazar detalhes técnicos internos e retornar formatos diferentes em cada rota | `B5` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-02) |
| `OPERACAO-03` | Faltava limite de tentativas contra ataques de força bruta ou excesso de acessos simultâneos | `I10` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-03) |
| `OPERACAO-04` | Se o serviço de imagens (Cloudinary) travasse, a requisição podia ficar presa sem fim e deixar lixo em disco | `A3` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-04) |
| `OPERACAO-05` | Muitas conexões simultâneas podiam esgotar o banco de dados na nuvem sem um gerenciador de conexões | `A4` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-05) |
| `OPERACAO-06` | Cache, proteção de clique duplo e limite de acessos ficam na memória de um único servidor (impedindo escalar para 2+ servidores) | `A5` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-06) |
| `OPERACAO-07` | Faltava rastreamento estruturado para acompanhar o caminho completo de um erro em produção | `A6` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-07) |
| `OPERACAO-08` | Faltavam checagens de saúde do servidor e um desligamento seguro sem derrubar ações em andamento | `A7` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-08) |
| `TELA-01` | Recarregar a página ou ficar sem login podia causar tela branca ou abrir páginas sem permissão | `B8` | ✅ Resolvido | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-01) |
| `TELA-02` | Algumas telas chamavam o servidor fora do canal padrão, perdendo avisos e controles automáticos | `B9` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-02) |
| `QUALIDADE-01` | Falta de testes automatizados e de verificação automática antes de publicar novas versões | `I11` | 🟡 Resolvido em parte | [Ver ficha](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#qualidade-01) |

---

## 5. Glossário (ordem alfabética)

Cada termo técnico usado nos relatórios está explicado abaixo em linguagem simples, com um exemplo do dia a dia.

- **Agregação (no banco vs. na memória):** somar, contar ou tirar médias de vários registros. Fazer isso *no banco* é como pedir ao almoxarife "quantas caixas temos no total?" e receber só o número; fazer *na memória* é trazer todas as caixas para o escritório só para contá-las na mão.
- **API / Endpoint / Rota:** o "balcão de atendimento" do servidor. Cada endereço (como `POST /orders` ou `GET /products`) corresponde a um pedido específico que o site faz ao servidor, como "criar um pedido" ou "listar os produtos".
- **Backend e Frontend:** *Frontend* é a parte visual que roda no navegador (botões, tabelas, gráficos). *Backend* é o "cérebro" que roda no servidor, valida permissões, faz contas e conversa com o banco de dados.
- **Benchmark / Linha de base (Baseline):** uma medição cronometrada tirada antes das melhorias, para poder comparar depois se o sistema realmente ficou mais rápido.
- **Bundle e Code-splitting (divisão de código):** *Bundle* é o "pacotão" de arquivos JavaScript que o navegador precisa baixar para abrir o site. *Code-splitting* é quebrar esse pacotão em pedaços menores, para a pessoa que abre a tela de login não precisar baixar também o código das telas de relatórios pesados.
- **Cache e TTL (tempo de vida):** uma "cola" temporária guardada na memória rápida do servidor para não precisar consultar o banco de dados toda hora pela mesma informação. *TTL* é o prazo de validade dessa cola (por exemplo, 60 segundos) antes de ela ser descartada e consultada de novo.
- **Chave estrangeira (FK — Foreign Key):** uma trava do banco de dados que garante que um registro aponte para algo que realmente existe (por exemplo, uma venda sempre aponta para um produto real). Se alguém tenta apagar o produto sem preparo, o banco bloqueia para não deixar vendas órfãs.
- **CI/CD (Integração Contínua):** uma esteira automática (como o GitHub Actions) que, toda vez que o desenvolvedor envia código novo, roda os testes e verificações sozinha para impedir que um código quebrado vá para o ar.
- **Cold-start (partida fria):** em planos gratuitos ou econômicos de servidores na nuvem (como o Render), o servidor "dorme" quando fica sem visitas. Na primeira requisição seguinte, ele demora alguns segundos extras para acordar.
- **Concorrência / Condição de corrida (*lost update*):** quando duas pessoas tentam alterar o mesmo dado no exato mesmo instante. Exemplo: há 5 unidades no estoque; dois vendedores vendem 3 unidades ao mesmo tempo e, sem proteção, ambos leem "5" e salvam "2" em vez de bloquear a segunda venda.
- **Cookie `HttpOnly` vs. `localStorage`:** dois lugares onde o navegador pode guardar o crachá de login (`JWT`). O `localStorage` é fácil de usar quando o site e o servidor ficam em domínios diferentes, mas um código malicioso injetado na página (XSS) conseguiria lê-lo. Um cookie `HttpOnly` fica escondido de scripts da página, mas exige configurações mais rígidas de domínio.
- **CORS (Compartilhamento de Recursos entre Origens):** uma lista de endereços confiáveis que o servidor aceita atender. Impede que um site desconhecido na internet faça pedidos ao seu servidor fingindo ser o seu aplicativo.
- **Correlation ID (`X-Request-Id`):** uma etiqueta numerada única colada em cada pedido que chega ao servidor. Se der erro, basta buscar esse número nos registros (logs) para ver cada passo daquele pedido específico.
- **Cross-domain (entre domínios diferentes):** quando o site fica em um endereço (ex.: Vercel) e o servidor fica em outro (ex.: Render).
- **Decimal (`Decimal(10, 2)`) vs. Ponto flutuante (`Float`):** formas de guardar números com vírgula no computador. *Float* faz aproximações binárias onde `0,1 + 0,2` pode virar `0,30000000000000004`. *Decimal* guarda centavos com exatidão matemática, como numa calculadora financeira.
- **Docker:** uma ferramenta que empacota o sistema junto com tudo o que ele precisa para rodar igual em qualquer computador ou servidor.
- **E2E (Teste de ponta a ponta / End-to-End):** um teste automatizado que simula um usuário real executando fluxos inteiros do começo ao fim (fazer login, criar loja, vender produto, cancelar pedido) contra o sistema e o banco de dados de verdade.
- **Escala horizontal vs. vertical:** *Vertical* é colocar mais memória e processador na mesma máquina. *Horizontal* é colocar duas ou mais máquinas trabalhando em paralelo dividindo o movimento.
- **Estorno:** cancelar uma venda já registrada, devolvendo os produtos ao estoque e desconsiderando aquele valor nos relatórios de faturamento, sem apagar o rastro do que aconteceu.
- **Formula Injection (injeção de fórmula em planilha):** ataque em que alguém cadastra um nome começando com `=`, `+`, `-` ou `@` (como `=HIPERLINK(...)`). Se a planilha exportada for aberta no Excel sem proteção, o Excel tenta executar aquilo como uma fórmula.
- **Graceful shutdown (desligamento gracioso):** quando o servidor recebe ordem para reiniciar ou atualizar, ele para de aceitar pedidos novos, espera os pedidos que já estavam no meio terminarem (até 10 segundos), fecha o banco com segurança e só então desliga.
- **Health check (checagem de saúde):** uma rota simples (como `/test-db`) que responde "estou vivo e conectado ao banco", permitindo que serviços de monitoramento saibam se o sistema está de pé.
- **Idempotência (`Idempotency-Key`):** a garantia de que repetir o mesmo pedido duas vezes produz o mesmo efeito de fazê-lo uma única vez. É o que impede que um clique duplo em "Finalizar venda" cobre o cliente ou baixe o estoque em dobro.
- **IDOR (Referência Direta Insegura a Objeto):** falha em que um usuário consegue ver ou alterar algo de outra pessoa apenas trocando um número no endereço da requisição (por exemplo, trocar `/pedidos/10` por `/pedidos/11`).
- **Índice (de banco de dados):** igual ao índice remissivo no final de um livro. Sem ele, o banco precisa folhear a tabela inteira linha por linha para achar os dados de uma loja; com ele, vai direto à página certa.
- **JWT (JSON Web Token) e `HS256`:** um "crachá digital" assinado pelo servidor depois que o usuário faz login. Em cada tela que a pessoa abre, o site mostra esse crachá para provar quem ela é. `HS256` é o método de assinatura exigido pelo servidor para não aceitar crachás falsificados com truques antigos.
- **Lock (`SELECT ... FOR UPDATE`):** uma "trava de fila" temporária no banco de dados. Enquanto um vendedor está baixando o estoque do produto X, o banco segura por milissegundos qualquer outra venda do mesmo produto X até a primeira terminar, evitando contas erradas.
- **Logs estruturados (Pino):** o diário de bordo do servidor gravado em formato organizado (JSON), fácil de pesquisar e filtrar quando algum problema acontece.
- **Mass assignment (atribuição em massa):** quando o servidor pega tudo o que veio no formulário do usuário e salva direto no banco sem filtrar. Um invasor pode enviar um campo oculto como `"role": "ADMIN"` e tentar ganhar poderes de administrador.
- **Migration (migração de banco de dados):** um arquivo numerado e em ordem cronológica que registra cada mudança na estrutura do banco (criar tabela, adicionar coluna), garantindo que o banco em produção fique igual ao de desenvolvimento.
- **MIME type e Whitelist:** *MIME type* é a etiqueta que identifica o tipo real de um arquivo (ex.: imagem PNG, planilha Excel). *Whitelist* (lista de permitidos) é aceitar **apenas** os formatos explicitamente autorizados e bloquear todo o resto.
- **Multi-tenant (multi-inquilino):** arquitetura em que várias empresas diferentes usam o mesmo sistema, mas cada uma vê apenas os seus próprios dados, como apartamentos separados no mesmo prédio.
- **N+1 consultas:** um desperdício comum de velocidade: o sistema faz 1 consulta para buscar uma lista de 50 vendedores e depois entra num laço fazendo mais 50 (ou 150) consultas individuais, uma para cada vendedor, em vez de pedir tudo em 1 única consulta.
- **p50 (mediana) e p95:** medidas de tempo de resposta. **p50** significa que metade das requisições respondeu até aquele tempo (experiência típica). **p95** significa que 95 em cada 100 requisições responderam até aquele tempo (mostra os casos mais lentos que incomodam o usuário).
- **Paginação:** dividir uma lista grande em páginas menores (por exemplo, de 20 ou 50 itens por vez), em vez de carregar milhares de registros de uma só vez.
- **Path traversal (travessia de caminho):** tentativa de enganar o servidor enviando nomes de arquivo com `../../` para tentar ler ou apagar arquivos fora da pasta permitida.
- **Pooler de conexões (PgBouncer / Neon Pooler):** um "recepcionista" na frente do banco de dados que reaproveita um grupo fixo de conexões abertas entre dezenas de usuários, evitando que o banco trave por excesso de conexões simultâneas.
- **Projeção (`select`):** pedir ao banco apenas as colunas necessárias para aquela tela (ex.: só nome e preço), em vez de trazer a ficha inteira com dezenas de campos que não serão exibidos.
- **Proxy reverso (`trust proxy`):** um intermediário que fica na frente do servidor (como a infraestrutura do Render). Configurar `trust proxy` ensina o servidor a enxergar o IP verdadeiro do usuário em vez de achar que todos os acessos vêm do mesmo intermediário.
- **Rate limiting (limite de taxa):** um limitador de velocidade que bloqueia quem faz pedidos demais em pouco tempo (por exemplo, um robô tentando adivinhar senhas 500 vezes por minuto).
- **Redis:** um banco de dados super rápido que fica na memória e pode ser compartilhado por vários servidores ao mesmo tempo (usado para cache, limite de acessos e chaves de clique duplo quando o sistema cresce para mais de uma máquina).
- **Snapshot (retrato congelado):** copiar na hora da venda informações como preço, nome e matrícula do vendedor para dentro do registro histórico. Assim, mesmo que o preço mude ou o vendedor seja demitido depois, o histórico antigo continua fiel ao dia da venda.
- **Soft delete (exclusão lógica):** em vez de apagar um registro permanentemente do banco, o sistema apenas marca como `inativo`. Ele some das telas do dia a dia, mas não quebra relatórios nem vendas antigas ligadas a ele.
- **SQL nativo (`$queryRaw`):** escrever a instrução de busca diretamente na língua do banco de dados (SQL) para fazer cálculos complexos de uma única vez com máxima velocidade.
- **Stack trace:** a lista técnica interna de arquivos e linhas de código onde um erro aconteceu. É útil para o desenvolvedor nos logs, mas nunca deve ser exibida para o usuário final por segurança.
- **Timeout:** um relógio de limite máximo de espera. Se um serviço externo demorar mais que o combinado (por exemplo, 10 segundos), o sistema desiste e avisa em vez de ficar travado para sempre.
- **TOCTOU (Checar e depois agir):** falha de tempo entre conferir uma regra ("ainda há 1 item no estoque?") e executar a ação ("então vende"). Se outra pessoa comprar nessa fração de segundo, a conferência fica velha e o resultado sai errado.
- **Transação (`prisma.$transaction`):** um pacote de operações no banco que funciona na regra do "tudo ou nada". Se um pedido tem 3 itens e o terceiro falha, os 2 primeiros são desfeitos automaticamente para o banco nunca ficar pela metade.
- **Upload síncrono vs. assíncrono:** *Síncrono* é quando o usuário clica em "Salvar" e fica olhando a rodinha girar até a foto subir toda para a nuvem. *Assíncrono* é quando o sistema salva logo ou sobe a foto direto para a nuvem em paralelo, liberando o usuário mais rápido.
- **XSS (Cross-Site Scripting) e `escapeHtml`:** ataque em que alguém escreve código malicioso (como `<script>...</script>`) dentro de um campo de texto (por exemplo, no nome de um produto) para que esse código rode quando outra pessoa abrir a tela ou gerar um PDF. `escapeHtml` transforma esses símbolos em texto comum inofensivo.

### 5.1 Termos de negócio, produto e arquitetura de software

- **ARR e MRR (Receita Recorrente Anual e Mensal):** *MRR* é quanto uma empresa de assinatura fatura por mês com clientes fixos; *ARR* é esse valor multiplicado por 12 meses.
- **B2B (*Business to Business*):** produto vendido para outras empresas (como lojas e redes varejistas), e não para consumidores pessoa física.
- **Due diligence (auditoria pré-compra):** revisão técnica e comercial que um comprador ou investidor faz no código e nos documentos antes de fechar negócio.
- **ERP e PDV:** *ERP* é o sistema central que integra gestão (estoque, financeiro, equipe, fornecedores); *PDV* (Ponto de Venda) é a frente de caixa usada no balcão para registrar vendas.
- **IP (*Intellectual Property* — Propriedade Intelectual):** a autoria legal e o valor do código-fonte e da documentação criados.
- **NFC-e / NF-e / SAT:** modelos oficiais de nota fiscal e cupom fiscal eletrônico exigidos pelo governo brasileiro para vendas no varejo.
- **ORM (Mapeador Objeto-Relacional — Prisma):** a ponte usada pelo servidor para conversar com o banco de dados escrevendo código legível em vez de montar tudo em SQL manual.
- **RBAC (Controle de Acesso Baseado em Papéis):** definir o que cada pessoa pode fazer pelo cargo dela (`ADMIN`, `GERENTE`, `OPERADOR`).
- **SaaS (*Software as a Service*):** software acessado pela internet mediante assinatura recorrente (sem o cliente precisar instalar servidores próprios).
- **SKU e EAN:** *SKU* é o código interno de controle de cada produto na loja; *EAN* é o número padrão do código de barras comercial impresso na embalagem.
- **Turnkey ("chave na mão"):** entrega do sistema pronto, instalado e configurado para o cliente já começar a usar.
- **Valuation:** estimativa de quanto uma empresa ou ativo de software vale no mercado.
- **White-Label ("marca branca"):** um sistema pronto vendido para outra empresa ou agência colocar o próprio logotipo, cores e domínio por cima.
