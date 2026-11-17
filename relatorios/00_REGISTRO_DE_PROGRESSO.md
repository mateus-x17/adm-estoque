# 📋 REGISTRO DE PROGRESSO — ESTOQUE.OS (HISTÓRICO DE EVOLUÇÃO)

**Última atualização:** 2026-11-17 *(base técnica verificada em 2026-11-11 e documentação do backend padronizada em 2026-11-12)*  
**Branch ativa:** `main`  
**Documento de apoio:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md)

**Situação atual do sistema:** O **Estoque.OS** já funciona como uma plataforma completa para redes de lojas (uma organização com várias filiais), com pedidos de múltiplos itens, gestão de funcionários com matrícula e histórico de desligamento, blindagem de segurança contra ataques comuns, publicação ativa em nuvem (Render + Vercel + Neon) e **7 de 7 testes automatizados aprovados**.

---

## Resumo para quem não é técnico

Este arquivo é o "diário de bordo" do projeto. Ele mostra, em ordem de data, cada etapa pela qual o **Estoque.OS** passou desde o primeiro exame até o estado atual em produção — e serve como índice central para todos os relatórios da pasta.

Em resumo: o sistema começou como um controle de estoque simples de uma única loja e evoluiu em **10 etapas** até virar uma plataforma pronta para múltiplas empresas com várias filiais, protegida contra erros de estoque, vazamento de dados e ataques comuns da internet.

---

## 1. Linha do tempo das etapas executadas

| Etapa | Nome descritivo | Referência anterior | Data | O que foi feito na prática | Situação |
|---|---|---|---|---|---|
| **Etapa 0** | Diagnóstico inicial do sistema | Baseline (Fases 1–9) | 08/11/2026 | Mapeamento inicial de 35 rotas e telas, primeira medição cronometrada de velocidade (`5,2 ms` a `3.117,9 ms`) e identificação dos **30 problemas** detalhados no [Relatório 11](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md). | ✅ Concluída |
| **Etapa 1** | Blindagem de segurança e proteção do estoque | Fase A | 08/11/2026 | Travas de banco contra vendas simultâneas (`FOR UPDATE`), proteção contra clique duplo (`Idempotency-Key`), proteção do último administrador, limite de cadastros abusivos e bloqueio de troca de cargo no próprio perfil. | ✅ Concluída |
| **Etapa 2** | Aceleração de relatórios e fim das consultas repetidas | Fase B | 08/11/2026 | Relatórios de vendedores e fornecedores passaram a calcular totais direto no banco PostgreSQL em 1 única consulta SQL, eliminando dezenas de viagens repetidas (**N+1**). | ✅ Concluída |
| **Etapa 3** | Precisão financeira em centavos e índices no banco | Fase C | 08/11/2026 | Preços migrados para tipo decimal exato (`Decimal(10, 2)`) e criação de índices compostos no banco para buscas mais rápidas. | ✅ Concluída |
| **Etapa 4** | Memória rápida (cache) e envio seguro de imagens | Fase D | 08/11/2026 | Memória temporária para login (`60s`) e listas de nomes (`30s`), além de tempo máximo de `10 segundos` e limpeza automática de arquivos temporários no envio de fotos ao Cloudinary. | ✅ Concluída |
| **Etapa 5** | Relatórios executivos de vendas em PDF A4 | Fase E | 09/11/2026 | Painel de vendas (`1 mês`, `6 meses` e `1 ano`) com gráficos vetoriais e impressão limpa em folha A4. | ✅ Concluída |
| **Etapa 6** | Rastreamento de logs e desligamento seguro do servidor | Fase F | 09/11/2026 | Logs estruturados (`Pino`) com código único por pedido (`X-Request-Id`), desligamento seguro sem cortar requisições (`SIGTERM`/`SIGINT`) e catálogo de APIs atualizado. | ✅ Concluída |
| **Etapa 7** | Separação inicial por empresa e planilhas Excel/CSV | Fase G | 10/11/2026 | Isolamento inicial por empresa, desativação lógica (*soft delete*) de cadastros, importação/exportação `.xlsx`/`.csv` (`ExcelJS`), sigilo de operadores e modais responsivos. | ✅ Evoluída para Etapa 8 |
| **Etapa 8** | Uma empresa com várias lojas, pedidos com vários itens e gestão de funcionários | Fase H | 10/11/2026 | Arquitetura **Organização → múltiplas Lojas**, portais separados (`/admin/login` e `/login`), transferência de gerentes, pedidos com vários itens + estorno + comprovantes, matrícula única (`MAT-00001`), situação funcional (`ATIVO`/`SUSPENSO`/`FERIAS`), demissão com histórico permanente (`RegistroDesligamento`), tela de desempenho (`/dashboard/desempenho`) e suíte E2E `7/7`. | ✅ Concluída e verificada |
| **Etapa 9** | Reforço final de segurança contra invasões e publicação em nuvem | Hardening & Deploy | 11/11/2026 | Ordenação cronológica das 9 migrações no banco Neon, aviso visual de servidor acordando (`1000 ms` + `serverToast.js`), `trust proxy`, limite global de requisições, sigilo em erros `500`, assinatura JWT restrita a `HS256`, senha mínima `>= 6`, whitelist em uploads, proteção de URLs/planilhas/PDFs contra XSS e Formula Injection, `npm audit fix` (`0` alertas no frontend) e validação em produção no Render. | ✅ Concluída e verificada |
| **Etapa 10** | Padronização documental do código e reescrita didática dos relatórios | Docs (`c5f4466` + Guia Didático) | 12–17/11/2026 | Padronização de comentários em todos os 38 arquivos do backend (`promptFuncExplic2.md`), padronização de finais de linha (`.gitattributes`/`.editorconfig`), criação do [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) e reescrita didática de todos os 14 relatórios + atualização dos templates. | ✅ Concluída |

---

## 2. Principais entregas verificadas no código atual (após Etapas 8 e 9)

1. **Banco de Dados (`9` migrações ordenadas em `backend/prisma/migrations/`, `10` tabelas principais, `4` listas fechadas de valores):**
   - **Organização e Lojas:** `Organizacao` representa a empresa/rede e `Loja` representa cada filial, com identificador único por rede (`@@unique([organizacaoId, slug])`).
   - **Equipe e Matrícula:** `Usuario` possui matrícula única (`MAT-00001` gerada a partir do ID), telefone, situação (`ATIVO`, `SUSPENSO` ou `FERIAS`) e data de admissão. Ao demitir, o usuário é removido da tabela ativa sem apagar o histórico (`ON DELETE SET NULL`).
   - **Histórico permanente de desligamentos (`RegistroDesligamento`):** guarda `vendedorRefId`, matrícula marcada como cancelada, data de admissão, **data de demissão** e motivo opcional — garantindo busca e filtro de desligados na tela de Usuários mesmo quando a pessoa teve `0` vendas.
   - **Pedidos e Movimentações:** `Pedido` (`CONCLUIDO` ou `CANCELADO`) guarda forma de pagamento, status, código/link de comprovante e quem recebeu; `ItemPedido` congela o preço unitário da venda; `Movimento` grava preço congelado, valor total, sinal de estorno e retrato (*snapshot*) completo do vendedor.

2. **Servidor / Backend (`57` rotas HTTP + entrega de `/uploads`):**
   - **Novos módulos principais:** gestão de filiais ([storeRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/storeRoutes.js)), pedidos com vários itens e comprovantes ([orderRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/orderRoutes.js)), isolamento de escopo por empresa/loja ([tenantScope.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js)), regras de matrícula/desligamento ([matriculaHelper.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/matriculaHelper.js)) e higienização de segurança ([sanitizers.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js)).
   - **Gestão de RH:** transferência de loja (`PATCH /users/:id/store`), troca de situação (`PATCH /users/:id/situation` com bloqueio imediato `403` para suspensos/férias), filtro `situacao=DESLIGADO|todos` em `GET /users`, reemissão do relatório de desligamento (`GET /users/:refId/dismissal-report`) e exclusão com relatório mensal (`DELETE /users/:id`).
   - **Imagens isoladas na nuvem:** arquivos enviados ao Cloudinary ficam separados em `estoque-os/organizacoes/<orgSlug>/lojas/<lojaSlug>/<subpasta>`.

3. **Interface / Frontend (`React 19` + `Vite 7` + `Zustand 5`):**
   - **Portais separados:** [AdminLogin.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx) (`/admin/login` para administradores da rede) e [Auth.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx) (`/login` e `/auth` para gerentes e operadores da loja).
   - **Seletor global de loja:** menu lateral ([Sidebar.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx)) conectado ao [useTenantStore.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/store/useTenantStore.js) permitindo ao administrador alternar entre "Todas as Lojas" e uma filial específica.
   - **Novas telas e modais:** gestão de RH e desligados em [Usuarios.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx), ficha detalhada ([ModalInfoUsuario.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalInfoUsuario.jsx)), reemissão do relatório PDF ([ModalRelatorioDesligamento.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalRelatorioDesligamento.jsx)), gestão de filiais ([Lojas.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx)), ranking de vendedores ([DesempenhoVendedores.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx)), pedidos ([Pedidos.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx)), ajuste rápido ([ModalMovimentacao.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalMovimentacao.jsx)) e confirmações estilizadas ([ModalConfirmacao.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/ModalConfirmacao.jsx)).

---

## 3. Mapa de todos os relatórios da pasta

| Arquivo | Título | Para que serve |
|---|---|---|
| [`00_GUIA_DE_LEITURA_E_GLOSSARIO.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) | Guia de Leitura e Glossário | Ordem de leitura, linha do tempo das etapas, equivalência dos códigos antigos e explicação de termos técnicos |
| [`01_visao_geral_e_inventario.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/01_visao_geral_e_inventario.md) | Visão Geral e Inventário | O que é o sistema, tecnologias usadas e mapa completo de pastas e arquivos |
| [`02_mapeamento_de_modulos.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/02_mapeamento_de_modulos.md) | Mapeamento de Módulos | Como cada bloco interno do sistema funciona, permissões e conexões entre partes |
| [`03_mapeamento_de_apis.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/03_mapeamento_de_apis.md) | Mapeamento de APIs | Catálogo completo das **57 rotas HTTP + `/uploads`** |
| [`04_models_e_banco_de_dados.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/04_models_e_banco_de_dados.md) | Models e Banco de Dados | Desenho das tabelas (`Organizacao → Lojas → Pedidos` + `RegistroDesligamento`), enums e 9 migrações |
| [`05_jornadas_de_uso.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/05_jornadas_de_uso.md) | Jornadas de Uso | Passo a passo real de uso por perfil (Admin, Gerente e Operador) |
| [`06_regras_de_negocio.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/06_regras_de_negocio.md) | Catálogo de Regras de Negócio | Regras verificadas `RN-001` a `RN-033` e cobertura de testes |
| [`07_diagnostico_auditoria_e_performance.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/07_diagnostico_auditoria_e_performance.md) | Diagnóstico de Problemas e Velocidade | Os 30 problemas explicados por tema + medições de velocidade e peso do site |
| [`08_melhorias_por_componente.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/08_melhorias_por_componente.md) | Melhorias por Componente | O que mudou em cada arquivo do código e refatorações futuras recomendadas |
| [`09_arquitetura_e_system_design.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/09_arquitetura_e_system_design.md) | Arquitetura e System Design | Desenho da arquitetura atual vs. desenho recomendado para escalar acima de 100 usuários simultâneos |
| [`10_plano_consolidado_de_implementacao.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/10_plano_consolidado_de_implementacao.md) | Plano Consolidado de Implementação | Resumo das etapas já concluídas + fila priorizada de próximas melhorias |
| [`11_matriz_consolidada_de_falhas.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md) | Catálogo Completo de Problemas e Correções | **Ficha detalhada dos 30 problemas** (problema, risco, causa, solução, Antes × Depois e evidência) |
| [`12_analise_de_produto.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/12_analise_de_produto.md) | Análise de Produto | Posicionamento comercial, diferenciais competitivos e lacunas de produto |
| [`13_relatorio_consolidado_de_mudancas_e_melhorias.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/13_relatorio_consolidado_de_mudancas_e_melhorias.md) | Resumo Executivo de Mudanças e Melhorias | Narrativa completa: como o sistema era no início, o que mudou e como está hoje |
| [`14_analise_minuciosa_de_valor_de_mercado.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/14_analise_minuciosa_de_valor_de_mercado.md) | Valor de Mercado e Monetização | Estimativa de custo de desenvolvimento, precificação SaaS e cenários financeiros |
