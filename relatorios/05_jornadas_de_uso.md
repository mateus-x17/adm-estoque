# 📑 RELATÓRIO TÉCNICO 05 — JORNADAS DE USO E FLUXOS REAIS
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  

---

## 1. Visão das Jornadas por Persona e Portal `[IMPLEMENTADO (verificado)]`

O **Estoque.OS** separa a experiência de acesso em dois portais dedicados conectados na Landing Page ([`Home.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Home.jsx)):
- **Portal do Administrador (`/admin/login` — [`AdminLogin.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx)):** exclusivo para proprietários/administradores da Organização abrirem uma nova rede + 1ª loja ou acessarem múltiplas lojas.
- **Portal da Loja (`/login` e `/auth` — [`Auth.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx)):** focado em `GERENTE` e `OPERADOR` de unidade específica (`portal: "loja"` rejeita `ADMIN` orientando para `/admin/login`).

---

## 2. Principais Jornadas End-to-End Implementadas

### Jornada 1 — Abertura de Organização, Criação de Filiais e Transferência de Gerente (`ADMIN`)
1. Novo empresário acessa `/admin/login?mode=register` e envia `POST /auth/register`.
2. Backend cria atomicamente `Organizacao` → `Loja` Matriz → `Usuario` (`ADMIN`, `lojaId: null`).
3. No painel (`/dashboard`), a [`Sidebar.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx) exibe seletor global **`"Todas as Lojas"`** ou filiais individuais (persistido via `useTenantStore` e enviado em `X-Loja-Id`).
4. Em `/dashboard/lojas` ([`Lojas.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx)), cria filiais adicionais (`POST /stores`).
5. Em `/dashboard/usuarios` ([`Usuarios.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx)), cria `GERENTE` e `OPERADOR` com upload de avatar no Cloudinary (`estoque-os/organizacoes/<org>/lojas/<loja>/usuarios`) e pode **transferir um gerente de uma filial para outra** via `PATCH /users/:id/store` com efeito imediato nos relatórios daquele gerente (`invalidateUserCache`).

### Jornada 2 — Multipedidos Atômicos com Congelamento de Preço & Estorno (`OPERADOR` / `GERENTE` / `ADMIN`)
1. Colaborador acessa `/dashboard/pedidos` ([`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx)) e abre [`ModalPedidoMultiItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalPedidoMultiItem.jsx).
2. Seleciona `VENDA` ou `REPOSICAO` (vinculável a fornecedor), adiciona 2+ produtos diferentes ao carrinho e confirma envio com `Idempotency-Key`.
3. Backend ordena os itens por `produtoId ASC`, bloqueia linhas com `SELECT ... FOR UPDATE`, verifica saldo, congela `precoUnitario` em `ItemPedido`, cria o `Pedido` (`PED-...`) e registra espelhos em `Movimento`.
4. Caso cliente desista ou haja erro operacional, `GERENTE` ou `ADMIN` aciona **Estornar / Cancelar** (`POST /orders/:id/cancel`) — `OPERADOR` recebe `403`. Estoque é revertido atomicamente, pedido muda para `CANCELADO` e movimentos inversos (`estorno = true`) ficam registrados sem inflar faturamento futuro.

### Jornada 3 — Exclusão Física de Funcionário & Auditoria por Antigo ID (`/dashboard/desempenho`)
1. Um vendedor deixa a empresa. O `ADMIN` acessa `/dashboard/usuarios` e clica em excluir (`DELETE /users/:id`).
2. A conta é **removida fisicamente** da tabela `Usuario` (inclusive seu avatar no Cloudinary); tentativas antigas de acesso recebem `401`.
3. O antigo ID permanece imutável no campo `vendedorRefId` (e `vendedorNomeSnapshot` / `vendedorEmailSnapshot`) de todos os `Pedido`s e `Movimento`s anteriores.
4. `ADMIN` ou `GERENTE` abre `/dashboard/desempenho` ([`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx)):
   - Visualiza o **ranking completo do melhor ao pior vendedor** no período (`1m`, `6m`, `1y`).
   - Pode **pesquisar pelo antigo ID numérico** (`#63` no seed, por exemplo) ou nome/e-mail mesmo com a conta excluída.
   - Abre o raio-X simultâneo de **Último Mês (`1m`), Semestre (`6m`), Ano (`1y`) e Total Histórico**, gráfico de 12 meses, Top SKUs, histórico de pedidos (incluindo cancelados) e imprime ficha PDF individual.

### Jornada 4 — Relatório Executivo PDF A4 & Planilhas em Lote
1. No Dashboard, `ADMIN` escolhe a rede inteira (`"Todas as Lojas"`) ou 1 filial no [`ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx); `GERENTE` gera da sua loja; `OPERADOR` gera apenas suas próprias vendas (`scope: 'user'`).
2. `ADMIN` e `GERENTE` visualizam adicionalmente dentro do PDF **Ranking de Vendedores (Melhor→Pior)** e **Resumo de Giro por Fornecedor** (livre de estornos).
3. Na tela `/dashboard/produtos`, `ADMIN` e `GERENTE` baixam modelo `.xlsx`/`.csv`, pré-validam lote (`mode=preview`), importam até `5.000` SKUs atomicamente (`mode=commit`) e exportam o catálogo filtrado.
