# 📑 RELATÓRIO 05 — JORNADAS DE USO (COMO AS PESSOAS USAM O SISTEMA)

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(fluxos verificados no código atual da branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 06 — Regras de Negócio](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/06_regras_de_negocio.md)

---

## Resumo para quem não é técnico

Este relatório descreve, passo a passo, **como cada perfil de pessoa usa o Estoque.OS no dia a dia** — desde o dono da rede abrindo sua empresa e criando filiais, passando pelo caixa registrando vendas e estornos, até a suspensão ou demissão de um vendedor sem perder o histórico de faturamento.

O sistema separa a entrada em **dois portais** ligados na página inicial ([Home.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Home.jsx)):
- **Portal do Administrador (`/admin/login` — [AdminLogin.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/AdminLogin.jsx)):** exclusivo para donos/administradores criarem sua empresa e gerenciarem todas as lojas.
- **Portal da Loja (`/login` e `/auth` — [Auth.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Auth.jsx)):** feito para **Gerentes** e **Operadores** entrarem direto na sua filial (se um administrador tentar entrar aqui, o sistema bloqueia e orienta ir para `/admin/login`).

---

## 1. Jornada 1 — Abrir uma empresa, criar lojas e transferir um gerente (`ADMIN`)

1. O empresário acessa `/admin/login?mode=register` e envia seu cadastro (`POST /auth/register`).
2. O servidor cria tudo junto numa única **transação** (ou cria tudo, ou não cria nada): a `Organizacao`, a primeira `Loja` (Matriz) e a conta do fundador `ADMIN` com visão global (`lojaId: null`).
3. No painel (`/dashboard`), o menu lateral ([Sidebar.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/common/Sidebar.jsx)) mostra um seletor onde o administrador escolhe entre **"Todas as Lojas"** ou uma filial específica (guardado em `useTenantStore` e enviado automaticamente no cabeçalho `X-Loja-Id`).
4. Em `/dashboard/lojas` ([Lojas.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Lojas.jsx)), ele cria novas filiais (`POST /stores`).
5. Em `/dashboard/usuarios` ([Usuarios.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Usuarios.jsx)), ele cadastra gerentes e operadores com foto de perfil salva em pasta isolada no Cloudinary (`estoque-os/organizacoes/<org>/lojas/<loja>/usuarios`) e pode **transferir um gerente de uma loja para outra** (`PATCH /users/:id/store`), limpando o cache na hora (`invalidateUserCache`) para o acesso mudar imediatamente.

---

## 2. Jornada 2 — Registrar venda/reposição com vários itens, comprovante e estorno (`OPERADOR` / `GERENTE` / `ADMIN`)

1. O colaborador abre `/dashboard/pedidos` ([Pedidos.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/Pedidos.jsx)) e clica para criar um pedido ([ModalPedidoMultiItem.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/ModalPedidoMultiItem.jsx)).
2. Escolhe se é **Venda** (`VENDA`) ou **Reposição** (`REPOSICAO`, podendo ligar a um fornecedor), coloca 2 ou mais produtos no carrinho, preenche os dados de comprovação (forma de pagamento, status, código PIX/NSU/recibo, quem recebeu e foto opcional de comprovante) e confirma — enviando uma chave única (`Idempotency-Key`) que impede duplicar o pedido em caso de clique duplo.
3. No servidor, o banco ordena os itens por código, trava as linhas durante a atualização (`SELECT ... FOR UPDATE` para impedir erro em vendas simultâneas), confere o saldo, **congela o preço unitário** no `ItemPedido`, gera o código do `Pedido` (`PED-...`) e grava os registros de `Movimento`. Também é possível anexar ou atualizar comprovantes depois (`PATCH /orders/:id/proof`) e imprimir o recibo.
4. Se o cliente desistir ou houver erro de lançamento, um `GERENTE` ou `ADMIN` pode clicar em **Estornar / Cancelar** (`POST /orders/:id/cancel`) — se um `OPERADOR` tentar, o servidor nega com `403`. Os produtos voltam ao estoque na mesma transação, o pedido muda para `CANCELADO` e os movimentos de estorno (`estorno = true`) ficam registrados sem inflar o faturamento dos relatórios.

---

## 3. Jornada 3 — Gestão da equipe: matrícula, suspensão, férias, demissão e auditoria (`/dashboard/usuarios` e `/dashboard/desempenho`)

1. Todo funcionário cadastrado recebe automaticamente uma **Matrícula única** baseada no seu código (`MAT-00001`), além de telefone, situação funcional (`Atuando`, `Suspenso` ou `Em Férias`) e data de admissão.
2. Em `/dashboard/usuarios`, os cartões da equipe exibem um botão discreto `Info` ([ModalInfoUsuario.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalInfoUsuario.jsx)), filtro por **Situação** (incluindo **Desligado (Matrícula Cancelada)** e **Todas**) e busca por Matrícula, Nome, E-mail ou ID.
3. Dentro do popup `Info`, o administrador pode **Suspender** ou colocar **Em Férias** (`PATCH /users/:id/situation`, bloqueando acesso na hora com `403`), **Reativar** ou **Demitir / Cancelar Matrícula** (`DELETE /users/:id`), informando a **Data de Demissão** e um motivo opcional.
4. Na demissão, o cadastro ativo e a foto são removidos fisicamente do sistema, mas todas as vendas antigas ficam intactas com **retratos congelados (*snapshots*)** e a demissão é gravada em `RegistroDesligamento`. Na hora, abre o **Relatório Final de Desligamento** ([ModalRelatorioDesligamento.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/users/ModalRelatorioDesligamento.jsx)) pronto para PDF A4 com nome, e-mail, `Matrícula (CANCELADA)`, admissão, demissão e vendas mês a mês.
5. Depois, filtrando por **Desligado** em `/dashboard/usuarios`, o gestor consulta a data de demissão no `Info`, reabre o relatório quando quiser (`GET /users/:refId/dismissal-report`) e acompanha o histórico em `/dashboard/desempenho` ([DesempenhoVendedores.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/pages/DesempenhoVendedores.jsx)).

---

## 4. Jornada 4 — Relatórios executivos em PDF A4 e planilhas Excel/CSV em lote

1. No painel principal, o `ADMIN` escolhe gerar o relatório da rede inteira (`"Todas as Lojas"`) ou de 1 filial em [ModalExportarRelatorio.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/dashboard/ModalExportarRelatorio.jsx); o `GERENTE` gera da própria loja; o `OPERADOR` gera apenas o seu próprio resumo individual (`scope: 'user'`).
2. Para `ADMIN` e `GERENTE`, o PDF inclui também **Ranking de Vendedores (Melhor → Pior)** e **Giro por Fornecedor**, já descontando estornos e vendas canceladas.
3. Na tela `/dashboard/produtos`, `ADMIN` e `GERENTE` baixam a planilha modelo `.xlsx`/`.csv`, fazem uma prévia de validação em tela (`mode=preview`), importam até `5.000` produtos de uma vez com segurança (`mode=commit`) e exportam o catálogo filtrado protegido contra fórmulas maliciosas.
