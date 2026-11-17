# 📑 RELATÓRIO 08 — MELHORIAS ENTREGUES E PENDÊNCIAS POR COMPONENTE DO SISTEMA

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(base técnica verificada em 2026-11-11 e atualizada com o estado atual da branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 11 — Catálogo Completo de Problemas](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)

---

## Resumo para quem não é técnico

Enquanto o Relatório 11 lista o sistema por **problemas**, este relatório olha o mesmo trabalho sob o ponto de vista das **peças internas do código** (banco de dados, servidor e telas do site).

Ele responde a duas perguntas simples:
1. **O que já foi melhorado em cada peça do sistema** (e para que essa mudança serviu na prática).
2. **Quais peças ainda têm ajustes pendentes** para deixar o site mais rápido, mais limpo e pronto para crescer para vários servidores no futuro.

---

## Mapa deste relatório

1. **Parte 1 — Melhorias já entregues por peça do sistema** *(verificadas no código)*
2. **Parte 2 — Melhorias futuras recomendadas por peça do sistema** *(ligadas diretamente aos problemas em aberto ou parciais)*

---

## Parte 1 — Melhorias já entregues por peça do sistema `[VERIFICADO]`

| Peça / Arquivos principais | Etapas envolvidas | O que melhorou na prática (e detalhe técnico) |
|---|---|---|
| **Estrutura do Banco de Dados**<br>[schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) e 9 migrações | Etapas 3, 7, 8 e 9 | Passou a suportar **uma empresa com várias lojas** (`Organizacao → Loja`), **pedidos com vários itens e comprovantes** (`Pedido`, `ItemPedido`), **gestão de funcionários** (`matricula`, `telefone`, `dataAdmissao`, `SituacaoFuncionario`), **histórico permanente de demissões** (`RegistroDesligamento`), **precisão em centavos** (`Decimal(10, 2)`) e **9 migrações ordenadas cronologicamente** (`20261110010000_` a `20261110050000_`). |
| **Separação de Lojas e Regras de Matrícula**<br>[tenantScope.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) · [matriculaHelper.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/matriculaHelper.js) | Etapa 8 | Garante que cada empresa e loja veja apenas os próprios dados (`resolveReadScope` / `resolveWriteStore` via `X-Loja-Id`), gera matrículas padronizadas (`MAT-00001` e `MAT-00001 (CANCELADA)`), interpreta buscas por matrícula e monta a linha do tempo de meses trabalhados no relatório de desligamento. |
| **Limpeza de Entradas e Tratamento de Erros**<br>[sanitizers.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js) · [errorHandler.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js) | Etapa 9 | Bloqueia links maliciosos (`sanitizeSafeUrl`), impede apagar arquivos fora da pasta de uploads (`removeLocalUploadIfSafe`), neutraliza fórmulas perigosas em planilhas (`sanitizeSpreadsheetCell`), esconde detalhes internos em erros `500` e traduz erros de upload (`MulterError`) e banco (`P2002`, `P2025`, `P2003`) em respostas claras. |
| **Recebimento de Uploads (Fotos e Planilhas)**<br>[multerConfig.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/multerConfig.js) · [productRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js) | Etapa 9 | Aceita apenas formatos autorizados checando **extensão exata e tipo real do arquivo (MIME)**, renomeia cada arquivo com sufixo aleatório (`crypto.randomBytes`) e valida também planilhas `.xlsx`/`.csv`. |
| **Módulo de Pedidos e Estornos**<br>[orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) | Etapas 8 e 9 | Fecha pedidos com vários itens numa única transação segura contra vendas simultâneas (`ORDER BY id ASC FOR UPDATE`) e cliques duplos (`Idempotency-Key`), congela preços, registra comprovantes (`PIX`/NSU/anexo com `sanitizeSafeUrl`), busca por matrícula e permite estorno completo (`cancelOrder`). |
| **Relatórios e Desempenho de Vendedores**<br>[movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) | Etapas 2, 5 e 8 | Substituiu consultas repetidas por SQL nativo no banco já ignorando estornos (`estorno = false`), mantém a posição real do vendedor no ranking mesmo quando alguém filtra por nome/matrícula, consulta ex-funcionários (`RegistroDesligamento`) e calcula `mesesTrabalhados`. |
| **Usuários, Autenticação e RH**<br>[userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [authService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) | Etapas 1, 4, 8 e 9 | Exige senha mínima de 6 caracteres, protege o último administrador, gera matrícula automática, filtra desligados (`situacao=DESLIGADO|todos`), alterna situação funcional (`PATCH /:id/situation`), transfere loja (`PATCH /:id/store`), executa demissão com limpeza de foto e relatório mensal (`deleteUser` / `getDismissalReportByRef`). |
| **Gestão de Lojas / Filiais**<br>[storeService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js) | Etapa 8 | Cadastro completo de filiais com desativação lógica (*soft delete*) preservando vendas antigas e trava impedindo desativar a última loja ativa da empresa. |
| **Planilhas Excel e CSV**<br>[productSpreadsheetService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) | Etapas 7, 8 e 9 | Importação com pré-visualização (`preview`) e gravação segura (`commit`) em transação única por filial usando `ExcelJS`, além de exportação protegida contra injeção de fórmulas (`sanitizeSpreadsheetCell`). |
| **Armazenamento de Fotos na Nuvem**<br>[cloudinaryConfig.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) | Etapas 4, 7 e 8 | Limite máximo de espera de `10 segundos`, exclusão garantida de arquivos temporários locais (`finally`), limpeza segura (`cleanupStoredMedia`) e pastas separadas `estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>`. |
| **Verificador de Login e Sessão**<br>[authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) | Etapas 4, 7, 8 e 9 | Valida `Bearer` e assinatura `HS256`, mantém memória rápida (`userCache`, `60s`) com limpeza imediata (`invalidateUserCache`), bloqueia contas suspensas/férias (`403`) e evita deslogar o usuário se o banco oscilar momentaneamente. |
| **Entrada Principal do Servidor**<br>[index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) | Etapas 6, 8 e 9 | Ativa `trust proxy = 1`, exige `JWT_SECRET` em produção, aplica `Helmet`, `CORS` multi-origem, teto de `1 MB` em JSON, limite global `apiLimiter` (`400/15 min`), logs `Pino` + `X-Request-Id`, desligamento seguro (`10s`) e `/test-db` sem vazar detalhes internos. |
| **Interface Web, Portais e PDFs A4**<br>[AdminLogin.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx) · [Auth.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx) · [apiClient.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) · [serverToast.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/serverToast.js) · [validators.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/validators.js) · [imageHelper.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/imageHelper.js) | Etapas 5, 7, 8 e 9 | Portais separados para Dono e Loja, espera inteligente de `1000 ms` com aviso visual quando o servidor acorda no Render, proteção anti-XSS (`escapeHtml`) nos 4 relatórios PDF A4, validação de URLs de imagem (`formatImageUrl`) e `rel="noopener noreferrer"`. |

---

## Parte 2 — Melhorias futuras recomendadas por peça `[RECOMENDAÇÃO]`

Cada item abaixo resolve uma pendência já mapeada no [Relatório 11](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md):

### 1. Site (Frontend) — Dividir o arquivo principal em partes menores (*code-splitting*)
- **Resolve o problema:** [`DESEMPENHO-08`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-08) — *O arquivo principal do site ficou pesado para carregar de uma vez*.
- **Benefício para quem usa:** a tela inicial e o login abrem muito mais rápido no celular porque o navegador só baixa telas pesadas (`DesempenhoVendedores`, `Lojas`, `Usuarios`, `Pedidos`) quando o usuário realmente clica nelas.
- **Onde mexer:** aplicar `React.lazy(() => import(...))` + `<Suspense>` em [routes.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) (hoje o arquivo único tem `1.020,48 kB`).

### 2. Site (Frontend) — Migrar as 2 últimas chamadas `fetch()` diretas em `EditarItem.jsx`
- **Resolve o problema:** [`TELA-02`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#tela-02) — *Algumas telas chamavam o servidor fora do canal padrão*.
- **Benefício para quem usa:** editar registros passa a ter o mesmo aviso de servidor acordando, o envio automático da loja selecionada (`X-Loja-Id`) e o redirecionamento limpo quando a sessão expira (`401`).
- **Onde mexer:** substituir as 2 chamadas `fetch()` nas linhas `365` e `417` de [EditarItem.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L365-L417) por chamadas ao [apiClient.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js).

### 3. Servidor + Painel — Calcular o gráfico de fluxo direto no banco (eliminar `limit=all`)
- **Resolve os problemas:** [`DESEMPENHO-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-01) (*telas puxando todos os registros de uma vez*) e [`DESEMPENHO-03`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-03) (*somas feitas fora do banco*).
- **Benefício para quem usa:** o painel principal continua rápido mesmo depois de anos de vendas acumuladas, sem precisar baixar o histórico inteiro no navegador.
- **Onde mexer:** criar a rota `GET /movements/flow-summary` em [movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) e atualizar [useDashboardData.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js).

### 4. Servidor + Banco — Enxugar resposta de produtos e adicionar datas de auditoria
- **Resolve o problema:** [`DESEMPENHO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-04) — *Consultas trazendo dados extras e falta de datas em duas tabelas*.
- **Benefício para quem usa:** respostas mais leves na listagem de produtos e registro de quando cada categoria ou fornecedor foi criado/alterado.
- **Onde mexer:** trocar `include` por `select` enxuto em `listProducts` ([productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js)) e adicionar `createdAt`/`updatedAt` em `Categoria` e `Fornecedor` no [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma).

### 5. Segurança avançada e preparação para vários servidores (escala futura)
- **Resolve os problemas:** [`OPERACAO-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-01) (*rotação preventiva de senhas externas*), [`ACESSO-04`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#acesso-04) (*cookie `HttpOnly`*), [`ENTRADA-01`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#entrada-01) (*limites `@db.VarChar`*), [`DESEMPENHO-07`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#desempenho-07) (*upload assíncrono*) e [`OPERACAO-06`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md#operacao-06) (*Redis para múltiplos servidores*).
- **Benefício para quem usa:** maior proteção contra roubo de sessão, envio instantâneo de fotos e capacidade de ligar 2 ou mais servidores em paralelo sem conflito de memória.

### 6. Padronização gradual dos comentários internos no Frontend
- **Situação atual verificada:** no **backend**, todos os 38 arquivos já foram padronizados em 12/11/2026 (commit `c5f4466`, seguindo [`promptFuncExplic2.md`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/ordem%20de%20prompts/promptFuncExplic2.md)). No **frontend**, as funções antigas (`8/75` estritamente conformes na auditoria de 11/11/2026) podem ser alinhadas aos poucos conforme cada tela receber manutenção.
