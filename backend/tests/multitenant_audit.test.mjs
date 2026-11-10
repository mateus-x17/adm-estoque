// arquivo responsável pela suíte automatizada E2E cobrindo Organização->Lojas, Portais, Transferência, Exclusão Real c/ ID, Multipedidos, Desempenho e Planilhas
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import dotenv from "dotenv";
import { prisma } from "../src/config/prismaClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(BACKEND_ROOT, ".env") });

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// função auxiliar para aguardar inicialização da API e conectividade Neon em /test-db
async function waitForServer(getLogs, timeoutMs = 40000) {
  const start = Date.now();
  let lastError = "Nenhuma resposta obtida";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/test-db`);
      if (res.ok) return;
      lastError = `HTTP ${res.status}: ${await res.text()}`;
    } catch (err) {
      lastError = err?.message || String(err);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Servidor de teste não iniciou (${lastError}). Logs:\n${getLogs()}`);
}

// função auxiliar para requisições HTTP JSON/FormData com suporte ao cabeçalho X-Loja-Id
async function apiFetch(endpoint, { method = "GET", token = null, lojaId = null, body = null } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (lojaId !== null && lojaId !== undefined) headers["X-Loja-Id"] = String(lojaId);
  if (body !== null && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== null && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function buildXlsxBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Produtos");
  sheet.columns = [
    { header: "nome", key: "nome" },
    { header: "descricao", key: "descricao" },
    { header: "preco", key: "preco" },
    { header: "quantidade", key: "quantidade" },
    { header: "categoria", key: "categoria" },
    { header: "fornecedor", key: "fornecedor" },
    { header: "ativo", key: "ativo" },
  ];
  for (const r of rows) sheet.addRow(r);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function cleanupTempOrganizations(orgIds) {
  if (!orgIds || orgIds.length === 0) return;
  await prisma.movimento.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.itemPedido.deleteMany({ where: { pedido: { organizacaoId: { in: orgIds } } } });
  await prisma.pedido.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.produto.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.categoria.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.fornecedor.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.usuario.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.loja.deleteMany({ where: { organizacaoId: { in: orgIds } } });
  await prisma.organizacao.deleteMany({ where: { id: { in: orgIds } } });
}

async function runAuditSuite() {
  const logs = [];
  const serverProc = spawn("node", ["src/index.js"], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "test" },
  });

  serverProc.stdout.on("data", (d) => logs.push(d.toString()));
  serverProc.stderr.on("data", (d) => logs.push(d.toString()));

  const createdOrgIds = [];

  try {
    console.log("🚀 Subindo API de auditoria na porta", TEST_PORT);
    await waitForServer(() => logs.join(""));

    const uid = Date.now();
    const sharedEmail = `gestor.${uid}@estoqueos.com`;
    const senha = "Password123!";

    // 1. Registro de 2 Organizações independentes, 2 Lojas na Org A e Portais /admin/login vs /login
    console.log("\n🧪 [1/7] Organizações isoladas, Lojas da rede e Portais Admin vs Loja...");
    const regA = await apiFetch("/auth/register", {
      method: "POST",
      body: {
        nomeOrganizacao: `Rede Alpha ${uid}`,
        nomeLoja: `Alpha Matriz ${uid}`,
        nome: "Admin Alpha",
        email: sharedEmail,
        senha,
      },
    });
    assert.equal(regA.status, 201, `Esperado 201 ao registrar Org A: ${JSON.stringify(regA.data)}`);
    createdOrgIds.push(regA.data.organizacao.id);
    const tokenAdminA = regA.data.token;
    const lojaA1 = regA.data.lojas[0];

    // Cria 2ª filial dentro da Rede Alpha
    const createLojaA2 = await apiFetch("/stores", {
      method: "POST",
      token: tokenAdminA,
      body: { nome: `Alpha Filial ${uid}`, endereco: "Av. Filial, 200" },
    });
    assert.equal(createLojaA2.status, 201);
    const lojaA2 = createLojaA2.data;

    // Registra Rede B com o mesmo e-mail para testar seletor de Organização
    const regB = await apiFetch("/auth/register", {
      method: "POST",
      body: {
        nomeOrganizacao: `Rede Beta ${uid}`,
        nomeLoja: `Beta Matriz ${uid}`,
        nome: "Admin Beta",
        email: sharedEmail,
        senha,
      },
    });
    assert.equal(regB.status, 201);
    createdOrgIds.push(regB.data.organizacao.id);
    const tokenAdminB = regB.data.token;
    const lojaB1 = regB.data.lojas[0];

    const multiLogin = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: sharedEmail, senha, portal: "admin" },
    });
    assert.equal(multiLogin.status, 200);
    assert.equal(multiLogin.data.requiresOrgSelection, true);
    assert.equal(multiLogin.data.organizations.length, 2);

    // Portal da Loja rejeita conta ADMIN com 403 orientando ao Portal Admin
    const adminInStorePortal = await apiFetch("/auth/login", {
      method: "POST",
      body: {
        email: sharedEmail,
        senha,
        organizacaoSlug: regA.data.organizacao.slug,
        portal: "loja",
      },
    });
    assert.equal(adminInStorePortal.status, 403);
    console.log("   ✅ Isolamento entre Organizações, multi-loja e portais Admin/Loja validados.");

    // 2. Criação de Gerente & Operadores + Transferência de Gerente entre lojas + Isolamento cruzado
    console.log("\n🧪 [2/7] Equipe, transferência de Gerente de Loja e bloqueio cross-org...");
    const gerenteRes = await apiFetch("/users", {
      method: "POST",
      token: tokenAdminA,
      body: {
        nome: "Gerente Alpha",
        email: `gerente.${uid}@alpha.com`,
        senha,
        role: "GERENTE",
        lojaId: lojaA1.id,
      },
    });
    assert.equal(gerenteRes.status, 201);
    const gerenteId = gerenteRes.data.id;

    const op1Res = await apiFetch("/users", {
      method: "POST",
      token: tokenAdminA,
      body: {
        nome: "Vendedor Top",
        email: `op1.${uid}@alpha.com`,
        senha,
        role: "OPERADOR",
        lojaId: lojaA1.id,
      },
    });
    assert.equal(op1Res.status, 201);
    const op1Id = op1Res.data.id;

    const op2Admission = new Date();
    op2Admission.setMonth(op2Admission.getMonth() - 2);
    const op2Res = await apiFetch("/users", {
      method: "POST",
      token: tokenAdminA,
      body: {
        nome: "Vendedor Excluir",
        email: `op2.${uid}@alpha.com`,
        telefone: "(11) 97777-8888",
        situacao: "ATIVO",
        dataAdmissao: op2Admission.toISOString(),
        senha,
        role: "OPERADOR",
        lojaId: lojaA1.id,
      },
    });
    assert.equal(op2Res.status, 201);
    const op2Id = op2Res.data.id;
    const op2Matricula = op2Res.data.matricula;
    assert.match(op2Matricula, /^MAT-\d{5}$/, "Matrícula gerada a partir do ID único");
    assert.equal(op2Res.data.telefone, "(11) 97777-8888");
    assert.equal(op2Res.data.situacao, "ATIVO");

    // Login no portal admin com GERENTE bloqueado com 403
    const gerInAdminPortal = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: `gerente.${uid}@alpha.com`, senha, portal: "admin" },
    });
    assert.equal(gerInAdminPortal.status, 403);

    const loginGer = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: `gerente.${uid}@alpha.com`, senha, portal: "loja" },
    });
    assert.equal(loginGer.status, 200);
    const tokenGer = loginGer.data.token;

    const loginOp1 = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: `op1.${uid}@alpha.com`, senha, portal: "loja" },
    });
    const tokenOp1 = loginOp1.data.token;

    const loginOp2 = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: `op2.${uid}@alpha.com`, senha, portal: "loja" },
    });
    const tokenOp2 = loginOp2.data.token;

    // Cross-organization: Admin Beta tenta ler loja da Rede Alpha via X-Loja-Id -> 404
    const crossOrg = await apiFetch(`/products`, { token: tokenAdminB, lojaId: lojaA1.id });
    assert.equal(crossOrg.status, 404);
    console.log("   ✅ Equipe criada e bloqueio cross-organização confirmado.");

    // 3. Catálogo, Fornecedores, Multipedidos atômico (congelamento de preço) e Estorno (ADMIN + GERENTE)
    console.log("\n🧪 [3/7] Multipedidos atômico, congelamento de preço e Cancelamento/Estorno...");
    const catRes = await apiFetch("/categories", {
      method: "POST",
      token: tokenAdminA,
      lojaId: lojaA1.id,
      body: { nome: "Hardware Audit" },
    });
    assert.equal(catRes.status, 201);

    const supRes = await apiFetch("/suppliers", {
      method: "POST",
      token: tokenAdminA,
      lojaId: lojaA1.id,
      body: { nome: "Fornecedor Alpha" },
    });
    assert.equal(supRes.status, 201);

    const p1Res = await apiFetch("/products", {
      method: "POST",
      token: tokenAdminA,
      lojaId: lojaA1.id,
      body: {
        nome: "Teclado Test",
        preco: 200.0,
        quantidade: 20,
        categoriaId: catRes.data.id,
        fornecedorId: supRes.data.fornecedor.id,
      },
    });
    assert.equal(p1Res.status, 201);

    const p2Res = await apiFetch("/products", {
      method: "POST",
      token: tokenAdminA,
      lojaId: lojaA1.id,
      body: {
        nome: "Mouse Test",
        preco: 100.0,
        quantidade: 15,
        categoriaId: catRes.data.id,
        fornecedorId: supRes.data.fornecedor.id,
      },
    });
    assert.equal(p2Res.status, 201);

    // Operador 1 fecha Multipedido #1: 2x Teclado (400) + 1x Mouse (100) = 500 com comprovante PIX
    const orderOp1 = await apiFetch("/orders", {
      method: "POST",
      token: tokenOp1,
      body: {
        tipo: "VENDA",
        clienteNome: "Cliente Vip",
        formaPagamento: "PIX",
        statusPagamento: "PAGO",
        comprovanteCodigo: "E2E-TEST-001",
        recebidoPor: "Cliente Vip",
        itens: [
          { produtoId: p1Res.data.id, quantidade: 2 },
          { produtoId: p2Res.data.id, quantidade: 1 },
        ],
      },
    });
    assert.equal(orderOp1.status, 201);
    assert.equal(Number(orderOp1.data.valorTotal), 500);
    assert.equal(orderOp1.data.formaPagamento, "PIX");
    assert.equal(orderOp1.data.comprovanteCodigo, "E2E-TEST-001");
    assert.equal(orderOp1.data.itens.length, 2);

    // Operador 2 fecha Multipedido #2: 1x Mouse (100) e depois Multipedido #3 para cancelar
    const orderOp2 = await apiFetch("/orders", {
      method: "POST",
      token: tokenOp2,
      body: { tipo: "VENDA", itens: [{ produtoId: p2Res.data.id, quantidade: 1 }] },
    });
    assert.equal(orderOp2.status, 201);

    const orderToCancel = await apiFetch("/orders", {
      method: "POST",
      token: tokenOp2,
      body: { tipo: "VENDA", itens: [{ produtoId: p1Res.data.id, quantidade: 3 }] },
    });
    assert.equal(orderToCancel.status, 201);

    // OPERADOR não pode cancelar pedido (403); GERENTE pode cancelar e estornar saldo!
    const opCancelAttempt = await apiFetch(`/orders/${orderToCancel.data.id}/cancel`, {
      method: "POST",
      token: tokenOp2,
    });
    assert.equal(opCancelAttempt.status, 403);

    const gerCancel = await apiFetch(`/orders/${orderToCancel.data.id}/cancel`, {
      method: "POST",
      token: tokenGer,
      body: { motivo: "Desistência" },
    });
    assert.equal(gerCancel.status, 200);
    assert.equal(gerCancel.data.status, "CANCELADO");

    // Verifica saldo restaurado de p1: 20 - 2 - 3 + 3 = 18
    const checkP1 = await apiFetch(`/products/${p1Res.data.id}`, { token: tokenGer });
    assert.equal(checkP1.data.quantidade, 18);

    // Altera preço de p2 para 999 e confere se o faturamento histórico congelado do orderOp1 continua 500!
    await apiFetch(`/products/${p2Res.data.id}`, {
      method: "PUT",
      token: tokenAdminA,
      body: { nome: "Mouse Test", preco: 999.0, quantidade: 13 },
    });
    console.log("   ✅ Multipedidos, lock de saldo, estorno pelo Gerente e congelamento de preço validados.");

    // 4. Sigilo OPERADOR, Suspensão/Reativação, Busca por Matrícula e Demissão c/ Cancelamento & Relatório Mensal
    console.log("\n🧪 [4/7] Sigilo OPERADOR, Suspensão/Reativação, Busca por Matrícula e Demissão...");
    // Op1 tenta forjar consulta para ver vendas do Op2 -> recebe apenas suas próprias
    const forgedOrders = await apiFetch(`/orders?vendedorRefId=${op2Id}`, { token: tokenOp1 });
    assert.equal(forgedOrders.status, 200);
    assert.ok(forgedOrders.data.data.every((o) => o.vendedorRefId === op1Id));

    const opBlockedPerf = await apiFetch("/movements/performance", { token: tokenOp1 });
    assert.equal(opBlockedPerf.status, 403);

    // Admin SUSPENDE o Operador 2: bloqueia /users/me e login com 403
    const suspendRes = await apiFetch(`/users/${op2Id}/situation`, {
      method: "PATCH",
      token: tokenAdminA,
      body: { situacao: "SUSPENSO" },
    });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.data.situacao, "SUSPENSO");

    const suspendedMe = await apiFetch("/users/me", { token: tokenOp2 });
    assert.equal(suspendedMe.status, 403);

    const suspendedLogin = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: `op2.${uid}@alpha.com`, senha, portal: "loja" },
    });
    assert.equal(suspendedLogin.status, 403);

    // Admin REATIVA Operador 2 -> volta a ATIVO e acessa normalmente
    const reactivateRes = await apiFetch(`/users/${op2Id}/situation`, {
      method: "PATCH",
      token: tokenAdminA,
      body: { situacao: "ATIVO" },
    });
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.data.situacao, "ATIVO");

    const reactivatedMe = await apiFetch("/users/me", { token: tokenOp2 });
    assert.equal(reactivatedMe.status, 200);

    // Busca por Matrícula em usuários, pedidos e movimentações
    const searchUserByMat = await apiFetch(`/users?search=${encodeURIComponent(op2Matricula)}`, { token: tokenAdminA });
    assert.equal(searchUserByMat.status, 200);
    assert.ok(searchUserByMat.data.data.some((u) => u.id === op2Id));

    const searchOrdersByMat = await apiFetch(`/orders?search=${encodeURIComponent(op2Matricula)}`, { token: tokenAdminA, lojaId: lojaA1.id });
    assert.equal(searchOrdersByMat.status, 200);
    assert.ok(searchOrdersByMat.data.data.some((o) => o.vendedorRefId === op2Id));

    const searchMovsByMat = await apiFetch(`/movements?search=${encodeURIComponent(op2Matricula)}`, { token: tokenAdminA, lojaId: lojaA1.id });
    assert.equal(searchMovsByMat.status, 200);
    assert.ok(searchMovsByMat.data.data.some((m) => m.vendedorRefId === op2Id));

    // Admin DEMITE (cancela matrícula e exclui fisicamente) o Operador 2 (que já tem R$ 100 concluído + 1 cancelado!)
    const delOp2 = await apiFetch(`/users/${op2Id}`, { method: "DELETE", token: tokenAdminA });
    assert.equal(delOp2.status, 200);
    assert.equal(delOp2.data.deletedId, op2Id);
    assert.equal(delOp2.data.matricula, op2Matricula);
    assert.equal(delOp2.data.matriculaCancelada, true);
    assert.ok(delOp2.data.matriculaDisplay.includes("(CANCELADA)"));
    assert.ok(delOp2.data.relatorioDesligamento?.vendedor?.dataInicio);
    assert.ok(delOp2.data.relatorioDesligamento?.vendedor?.dataTermino);
    assert.equal(delOp2.data.relatorioDesligamento?.resumo?.faturamentoTotal, 100);
    assert.ok(Array.isArray(delOp2.data.relatorioDesligamento?.vendasPorMes));
    assert.ok(delOp2.data.relatorioDesligamento.vendasPorMes.length >= 2);

    // Usuário demitido é barrado na hora (cache invalidado -> 401)
    const deletedOpCheck = await apiFetch("/users/me", { token: tokenOp2 });
    assert.equal(deletedOpCheck.status, 401);

    // Busca na página de Desempenho pela MATRÍCULA ou ANTIGO ID retorna matrícula CANCELADA + meses trabalhados!
    const deletedPerf = await apiFetch(`/movements/performance/${encodeURIComponent(op2Matricula)}`, { token: tokenGer });
    assert.equal(deletedPerf.status, 200);
    assert.equal(deletedPerf.data.vendedor.excluido, true);
    assert.equal(deletedPerf.data.vendedor.matriculaCancelada, true);
    assert.ok(deletedPerf.data.vendedor.matriculaDisplay.includes("(CANCELADA)"));
    assert.equal(deletedPerf.data.vendedor.vendedorRefId, op2Id);
    assert.equal(deletedPerf.data.periodos.mes.faturamento, 100);
    assert.equal(deletedPerf.data.periodos.semestre.faturamento, 100);
    assert.equal(deletedPerf.data.periodos.ano.faturamento, 100);
    assert.equal(deletedPerf.data.periodos.ano.pedidosCancelados, 1);
    assert.ok(Array.isArray(deletedPerf.data.mesesTrabalhados) && deletedPerf.data.mesesTrabalhados.length >= 2);

    // Ranking do melhor ao pior vendedor: Op1 (R$ 500) deve estar em 1º lugar antes de Op2 excluído (R$ 100)
    const rankingRes = await apiFetch(`/movements/performance?period=1m`, { token: tokenAdminA, lojaId: lojaA1.id });
    assert.equal(rankingRes.status, 200);
    const activeRanks = rankingRes.data.ranking.filter((r) => r.totalFaturado > 0);
    assert.equal(activeRanks[0].vendedorRefId, op1Id);
    assert.equal(activeRanks[0].posicao, 1);
    assert.equal(activeRanks[0].totalFaturado, 500);
    assert.equal(activeRanks[1].vendedorRefId, op2Id);
    assert.equal(activeRanks[1].posicao, 2);
    assert.equal(activeRanks[1].excluido, true);
    assert.equal(activeRanks[1].matriculaCancelada, true);
    assert.equal(activeRanks[1].totalFaturado, 100);

    // Ao buscar diretamente pela MATRÍCULA do 2º colocado, ele DEVE preservar sua posição real (2º, e nunca 1º)
    const filteredRankRes = await apiFetch(`/movements/performance?period=1m&search=${encodeURIComponent(op2Matricula)}`, {
      token: tokenAdminA,
      lojaId: lojaA1.id,
    });
    assert.equal(filteredRankRes.status, 200);
    assert.equal(filteredRankRes.data.ranking.length, 1);
    assert.equal(filteredRankRes.data.ranking[0].vendedorRefId, op2Id);
    assert.equal(filteredRankRes.data.ranking[0].posicao, 2);
    console.log("   ✅ Suspensão/Reativação, busca por Matrícula, demissão c/ relatório e ranking validados.");

    // 5. Transferência de Gerente da Loja 1 para Loja 2 e Relatórios Admin Multi-Loja vs Gerente
    console.log("\n🧪 [5/7] Transferência de Gerente entre filiais e escopo de relatórios...");
    // Primeiro o Gerente ainda vê o relatório da Loja 1 (R$ 600)
    const repGerAntes = await apiFetch("/movements/sales-report?period=1m", { token: tokenGer });
    assert.equal(repGerAntes.status, 200);
    assert.equal(repGerAntes.data.summary.totalVendasValor, 600);

    // Admin transfere o Gerente para a Loja 2 e invalida cache na hora
    const transferRes = await apiFetch(`/users/${gerenteId}/store`, {
      method: "PATCH",
      token: tokenAdminA,
      body: { lojaId: lojaA2.id },
    });
    assert.equal(transferRes.status, 200);
    assert.equal(transferRes.data.lojaId, lojaA2.id);

    // Na próxima requisição do Gerente, ele agora enxerga Loja 2 (R$ 0 em vendas ainda) e não vê mais produtos da Loja 1!
    const repGerDepois = await apiFetch("/movements/sales-report?period=1m", { token: tokenGer });
    assert.equal(repGerDepois.status, 200);
    assert.equal(repGerDepois.data.summary.totalVendasValor, 0);

    // Admin escolhe Todas as Lojas vs Loja 1 vs Loja 2 nos relatórios
    const repAdminAll = await apiFetch("/movements/sales-report?period=1y", { token: tokenAdminA, lojaId: "all" });
    assert.equal(repAdminAll.status, 200);
    assert.equal(repAdminAll.data.scope, "network");
    assert.equal(repAdminAll.data.summary.totalVendasValor, 600);

    const repAdminL2 = await apiFetch("/movements/sales-report?period=1y", { token: tokenAdminA, lojaId: lojaA2.id });
    assert.equal(repAdminL2.status, 200);
    assert.equal(repAdminL2.data.scope, "store");
    assert.equal(repAdminL2.data.summary.totalVendasValor, 0);
    console.log("   ✅ Transferência instantânea de gerente e relatórios por rede/loja validados.");

    // 6. Soft Delete em Produto com histórico + Bloqueio de venda/pedido
    console.log("\n🧪 [6/7] Soft Delete em Produto com vendas e bloqueio operacional...");
    const delProd = await apiFetch(`/products/${p1Res.data.id}`, {
      method: "DELETE",
      token: tokenAdminA,
    });
    assert.equal(delProd.status, 200);
    assert.equal(delProd.data.softDeleted, true);

    const orderInactiveProd = await apiFetch("/orders", {
      method: "POST",
      token: tokenOp1,
      body: { tipo: "VENDA", itens: [{ produtoId: p1Res.data.id, quantidade: 1 }] },
    });
    assert.equal(orderInactiveProd.status, 400);
    console.log("   ✅ Soft Delete de produto bloqueando novos pedidos confirmado.");

    // 7. Planilhas .xlsx e .csv na Filial 2 selecionada pelo ADMIN via header X-Loja-Id
    console.log("\n🧪 [7/7] Importação e Exportação .xlsx / .csv na loja selecionada...");
    const validBuf = await buildXlsxBuffer([
      {
        nome: "Monitor Loja 2 Import",
        descricao: "Importado na filial",
        preco: "1250,50",
        quantidade: 12,
        categoria: "Monitores Filial",
        fornecedor: "Distribuidor Filial",
        ativo: "Sim",
      },
    ]);
    const formCommit = new FormData();
    formCommit.append(
      "file",
      new Blob([validBuf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "filial2.xlsx"
    );
    const impRes = await apiFetch("/products/import?mode=commit", {
      method: "POST",
      token: tokenAdminA,
      lojaId: lojaA2.id,
      body: formCommit,
    });
    assert.equal(impRes.status, 201);
    assert.equal(impRes.data.createdCount, 1);

    // Gerente agora transferido para Loja 2 já visualiza o produto recém-importado!
    const gerProductsL2 = await apiFetch("/products", { token: tokenGer });
    assert.equal(gerProductsL2.status, 200);
    assert.ok(gerProductsL2.data.data.some((p) => p.nome === "Monitor Loja 2 Import"));

    const expCsv = await fetch(`${BASE_URL}/products/export?format=csv`, {
      headers: { Authorization: `Bearer ${tokenGer}` },
    });
    assert.equal(expCsv.status, 200);
    const csvText = await expCsv.text();
    assert.ok(csvText.includes("Monitor Loja 2 Import"));
    console.log("   ✅ Importação e exportação em planilha na filial validada.");

    console.log("\n🎉 TODOS OS 7 CENÁRIOS DE AUDITORIA E2E PASSARAM COM SUCESSO!");
  } finally {
    try {
      await cleanupTempOrganizations(createdOrgIds);
    } catch (cleanupErr) {
      console.error("⚠️ Erro ao limpar dados temporários de teste:", cleanupErr.message);
    }
    serverProc.kill("SIGTERM");
    await prisma.$disconnect();
  }
}

runAuditSuite().catch((err) => {
  console.error("\n❌ FALHA NA SUÍTE DE AUDITORIA:", err);
  process.exit(1);
});
