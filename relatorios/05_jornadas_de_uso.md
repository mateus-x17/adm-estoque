# 📑 RELATÓRIO TÉCNICO 05 — JORNADAS DE USO E FLUXOS REAIS
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `main` (sincronizada com `feature/multitenant`)  

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

### Jornada 2 — Multipedidos Atômicos com Comprovação, Congelamento & Estorno (`OPERADOR` / `GERENTE` / `ADMIN`)
1. Colaborador acessa `/dashboard/pedidos` ([`Pedidos.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx)) e abre [`ModalPedidoMultiItem.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalPedidoMultiItem.jsx).
2. Seleciona `VENDA` ou `REPOSICAO` (vinculável a fornecedor), adiciona 2+ produtos diferentes ao carrinho, informa comprovação (`formaPagamento`, `statusPagamento`, `comprovanteCodigo` PIX/NSU/recibo, `recebidoPor` e anexo opcional no Cloudinary) e confirma envio com `Idempotency-Key`.
3. Backend ordena os itens por `produtoId ASC`, bloqueia linhas com `SELECT ... FOR UPDATE`, verifica saldo, congela `precoUnitario` em `ItemPedido`, cria o `Pedido` (`PED-...`) e registra espelhos em `Movimento`. É possível anexar/atualizar comprovantes depois (`PATCH /orders/:id/proof`) e imprimir recibo formal.
4. Caso cliente desista ou haja erro operacional, `GERENTE` ou `ADMIN` aciona **Estornar / Cancelar** (`POST /orders/:id/cancel`) via diálogo estilizado — `OPERADOR` recebe `403`. Estoque é revertido atomicamente, pedido muda para `CANCELADO`/`ESTORNADO` e movimentos inversos (`estorno = true`) ficam registrados sem inflar faturamento futuro.

### Jornada 3 — Matrícula Única, Suspensão/Férias, Reativação & Demissão c/ Data de Demissão e Filtro na Equipe (`/dashboard/usuarios` & `/dashboard/desempenho`)
1. Cada colaborador criado recebe automaticamente uma **Matrícula única** derivada do seu ID (`MAT-00001`), além de **Telefone**, **Situação Funcional** (`Atuando`, `Suspenso` ou `Em Férias`) e **Data de Admissão**.
2. Na tela `/dashboard/usuarios`, os cards mantêm visual limpo e exibem um **botão singelo de `Info`** ([`ModalInfoUsuario.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalInfoUsuario.jsx)), além de filtro colapsável por **Situação** (incluindo **`Desligado (Matrícula Cancelada)`** e **`Todas`**) e busca por Matrícula/Nome/E-mail/ID.
3. No popup `Info`, o `ADMIN` pode **Suspender**, colocar **Em Férias** (`PATCH /users/:id/situation`, bloqueando login e rotas com `403` na hora) e, se o colaborador não for reativado, acionar **Reativar Colaborador** ou **Demitir / Cancelar Matrícula** (`DELETE /users/:id`), podendo confirmar a **Data de Demissão** e motivo opcional no diálogo estilizado.
4. Ao demitir, `Usuario` e avatar são removidos fisicamente mantendo snapshots imutáveis e gravando [`RegistroDesligamento`], e o sistema exibe imediatamente o **Relatório Final de Desligamento** ([`ModalRelatorioDesligamento.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalRelatorioDesligamento.jsx)) em PDF A4 com **Nome, E-mail e `Matrícula (CANCELADA)`**, **Data de Início (Admissão)**, **Data de Demissão (Término)** e todas as vendas filtradas mês a mês.
5. Posteriormente, filtrando por **`Desligado`** (ou pesquisando a matrícula/nome) em `/dashboard/usuarios`, o gestor consulta a **Data de Demissão** no popup `Info` e reabre o Relatório Final (`GET /users/:refId/dismissal-report`), além de auditar o desempenho em `/dashboard/desempenho` ([`DesempenhoVendedores.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx)).

### Jornada 4 — Relatório Executivo PDF A4 & Planilhas em Lote
1. No Dashboard, `ADMIN` escolhe a rede inteira (`"Todas as Lojas"`) ou 1 filial no [`ModalExportarRelatorio.jsx`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx); `GERENTE` gera da sua loja; `OPERADOR` gera apenas suas próprias vendas (`scope: 'user'`).
2. `ADMIN` e `GERENTE` visualizam adicionalmente dentro do PDF **Ranking de Vendedores (Melhor→Pior)** e **Resumo de Giro por Fornecedor** (livre de estornos).
3. Na tela `/dashboard/produtos`, `ADMIN` e `GERENTE` baixam modelo `.xlsx`/`.csv`, pré-validam lote (`mode=preview`), importam até `5.000` SKUs atomicamente (`mode=commit`) e exportam o catálogo filtrado.
