// arquivo responsável por executar testes automatizados de auditoria multi-tenant, RBAC, soft delete, planilhas e relatórios contra a API real
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import { prisma } from '../src/config/prismaClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// função auxiliar para aguardar o servidor HTTP subir e responder no endpoint /test-db
// 1 - Faz polling curto de 400ms até o Express e o Neon PostgreSQL responderem (timeout 35s considerando cold start)
// 2 - Registra o último erro/status observado e lança falha detalhada caso o servidor não inicialize a tempo
async function waitForServer(getLogs, timeoutMs = 35000) {
  const start = Date.now();
  let lastError = 'Nenhuma resposta obtida';
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
  throw new Error(`Servidor de teste não iniciou dentro do tempo limite (${lastError}). Logs:\n${getLogs()}`);
}

// função auxiliar para realizar requisições JSON autenticadas ou públicas
async function apiFetch(endpoint, { method = 'GET', token = null, body = null } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== null && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
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

// função auxiliar para gerar buffer de planilha XLSX em memória nos testes de importação
async function buildXlsxBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Produtos');
  sheet.columns = [
    { header: 'nome', key: 'nome' },
    { header: 'descricao', key: 'descricao' },
    { header: 'preco', key: 'preco' },
    { header: 'quantidade', key: 'quantidade' },
    { header: 'categoria', key: 'categoria' },
    { header: 'fornecedor', key: 'fornecedor' },
    { header: 'ativo', key: 'ativo' },
  ];
  for (const r of rows) sheet.addRow(r);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// função auxiliar para remover completamente os estabelecimentos temporários criados durante o teste
async function cleanupTempStores(empresaIds) {
  if (!empresaIds || empresaIds.length === 0) return;
  await prisma.movimento.deleteMany({ where: { empresaId: { in: empresaIds } } });
  await prisma.produto.deleteMany({ where: { empresaId: { in: empresaIds } } });
  await prisma.categoria.deleteMany({ where: { empresaId: { in: empresaIds } } });
  await prisma.fornecedor.deleteMany({ where: { empresaId: { in: empresaIds } } });
  await prisma.usuario.deleteMany({ where: { empresaId: { in: empresaIds } } });
  await prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } });
}

// função principal que orquestra todos os cenários de auditoria de ponta a ponta
async function runAuditSuite() {
  const serverProc = spawn('node', ['src/index.js'], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logs = [];
  serverProc.stdout.on('data', (chunk) => logs.push(`[stdout] ${chunk.toString()}`));
  serverProc.stderr.on('data', (chunk) => logs.push(`[stderr] ${chunk.toString()}`));
  const getLogs = () => logs.join('');

  const tempEmpresaIds = [];
  let passed = 0;
  const check = (name, fn) => async () => {
    await fn();
    passed += 1;
    console.log(`✅ [PASS] ${name}`);
  };

  try {
    await waitForServer(getLogs);
    console.log(`🚀 Servidor de auditoria iniciado na porta ${TEST_PORT}\n`);

    // =========================================================================
    // TESTE 1: Registro de 2 lojas temporárias com MESMO e-mail (unicidade por loja)
    // =========================================================================
    let tokenTemp1, empresaTemp1Id;
    await check('POST /auth/register cria loja + ADMIN e permite mesmo e-mail em lojas diferentes', async () => {
      const uniqueSuffix = Date.now();
      const sharedEmail = `audit.shared.${uniqueSuffix}@teste.com`;

      const reg1 = await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          nomeLoja: `Audit Loja A ${uniqueSuffix}`,
          slug: `audit-loja-a-${uniqueSuffix}`,
          cnpj: '11.111.111/0001-11',
          telefone: '(11) 99999-0001',
          nome: 'Admin Audit A',
          email: sharedEmail,
          senha: 'Password123!',
        },
      });
      assert.equal(reg1.status, 201, `Esperado 201, recebeu ${reg1.status}: ${JSON.stringify(reg1.data)}`);
      assert.ok(reg1.data.token);
      assert.equal(reg1.data.user.role, 'ADMIN');
      tokenTemp1 = reg1.data.token;
      empresaTemp1Id = reg1.data.empresa.id;
      tempEmpresaIds.push(empresaTemp1Id);

      const reg2 = await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          nomeLoja: `Audit Loja B ${uniqueSuffix}`,
          slug: `audit-loja-b-${uniqueSuffix}`,
          nome: 'Admin Audit B',
          email: sharedEmail,
          senha: 'Password123!',
        },
      });
      assert.equal(reg2.status, 201, `Mesmo e-mail em outra loja deve retornar 201: ${JSON.stringify(reg2.data)}`);
      tempEmpresaIds.push(reg2.data.empresa.id);

      // Duplicidade dentro da MESMA loja deve falhar com 400
      const dupUser = await apiFetch('/users', {
        method: 'POST',
        token: tokenTemp1,
        body: {
          nome: 'Duplicado',
          email: sharedEmail,
          senha: 'Password123!',
          role: 'OPERADOR',
        },
      });
      assert.equal(dupUser.status, 400);
    })();

    // =========================================================================
    // TESTE 2: Login multi-loja (seleção de estabelecimento + bloqueio usuário inativo)
    // =========================================================================
    let tokenLoja1Admin, tokenLoja1Gerente, tokenLoja1Operador, operador1Id, tokenLoja2Admin;
    await check('POST /auth/login retorna requiresStoreSelection para email em 2 lojas e bloqueia inativo (403)', async () => {
      const multi = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'gestao@estoqueos.com', senha: 'Password123!' },
      });
      assert.equal(multi.status, 200);
      assert.equal(multi.data.requiresStoreSelection, true);
      assert.ok(multi.data.stores.length >= 2);

      const l1Gerente = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'gestao@estoqueos.com', senha: 'Password123!', lojaSlug: 'techstock-matriz' },
      });
      assert.equal(l1Gerente.status, 200);
      assert.equal(l1Gerente.data.user.empresa.slug, 'techstock-matriz');
      tokenLoja1Gerente = l1Gerente.data.token;

      const l1Admin = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'lucas.admin@techstock.com', senha: 'Password123!', lojaSlug: 'techstock-matriz' },
      });
      assert.equal(l1Admin.status, 200);
      tokenLoja1Admin = l1Admin.data.token;

      const l1Op = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'joao.op@techstock.com', senha: 'Password123!', lojaSlug: 'techstock-matriz' },
      });
      assert.equal(l1Op.status, 200);
      tokenLoja1Operador = l1Op.data.token;
      operador1Id = l1Op.data.user.id;

      const l2Admin = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'camila.admin@megamoda.com', senha: 'Password123!', lojaSlug: 'megamoda-express' },
      });
      assert.equal(l2Admin.status, 200);
      tokenLoja2Admin = l2Admin.data.token;

      // Usuário inativo do seed (Pedro Desligado) deve receber 403
      const inactive = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'pedro.ex@techstock.com', senha: 'Password123!', lojaSlug: 'techstock-matriz' },
      });
      assert.equal(inactive.status, 403);
    })();

    // =========================================================================
    // TESTE 3: Isolamento Multi-Tenant estrito (Loja 2 não vê/edita dados da Loja 1)
    // =========================================================================
    await check('Isolamento Multi-Tenant bloqueia leitura/edição/exclusão/movimentação entre lojas', async () => {
      const prods1 = await apiFetch('/products?limit=20', { token: tokenLoja1Admin });
      const prods2 = await apiFetch('/products?limit=20', { token: tokenLoja2Admin });
      assert.equal(prods1.status, 200);
      assert.equal(prods2.status, 200);
      assert.ok(prods1.data.data.length > 0);
      assert.ok(prods2.data.data.length > 0);

      const ids1 = new Set(prods1.data.data.map((p) => p.id));
      for (const p2 of prods2.data.data) {
        assert.equal(ids1.has(p2.id), false, 'Produto da Loja 2 vazou para Loja 1');
      }

      const targetProd1Id = prods1.data.data[0].id;
      const crossGet = await apiFetch(`/products/${targetProd1Id}`, { token: tokenLoja2Admin });
      assert.equal(crossGet.status, 404);

      const crossAdjust = await apiFetch(`/products/${targetProd1Id}/adjust`, {
        method: 'POST',
        token: tokenLoja2Admin,
        body: { quantidade: 1, tipo: 'VENDA' },
      });
      assert.equal(crossAdjust.status, 404);

      const crossDelete = await apiFetch(`/products/${targetProd1Id}`, {
        method: 'DELETE',
        token: tokenLoja2Admin,
      });
      assert.equal(crossDelete.status, 404);
    })();

    // =========================================================================
    // TESTE 4: RBAC (OPERADOR não vê vendas de outros; GERENTE vê mas não deleta; ADMIN irrestrito)
    // =========================================================================
    await check('RBAC impede OPERADOR de consultar outros vendedores e impede GERENTE de excluir registros', async () => {
      // OPERADOR bloqueado em /users/names, /movements/user-stats e /users
      const opNames = await apiFetch('/users/names', { token: tokenLoja1Operador });
      assert.equal(opNames.status, 403);

      const opStats = await apiFetch('/movements/user-stats', { token: tokenLoja1Operador });
      assert.equal(opStats.status, 403);

      const opUsers = await apiFetch('/users', { token: tokenLoja1Operador });
      assert.equal(opUsers.status, 403);

      // Mesmo forçando ?usuarioId=1 na query, backend devolve só registros do próprio operador
      const opMovs = await apiFetch('/movements?limit=50&usuarioId=1', { token: tokenLoja1Operador });
      assert.equal(opMovs.status, 200);
      for (const m of opMovs.data.data) {
        assert.equal(m.usuarioId, operador1Id, 'OPERADOR recebeu movimentação de outro vendedor!');
      }

      // Sales report funciona em 1m, 6m, 1y (escopo user para OPERADOR, store para GERENTE)
      const opReport = await apiFetch('/movements/sales-report?period=1m', { token: tokenLoja1Operador });
      assert.equal(opReport.status, 200);
      assert.equal(opReport.data.scope, 'user');

      for (const p of ['1m', '6m', '1y']) {
        const mgrReport = await apiFetch(`/movements/sales-report?period=${p}`, { token: tokenLoja1Gerente });
        assert.equal(mgrReport.status, 200);
        assert.equal(mgrReport.data.scope, 'store');
        assert.ok(mgrReport.data.summary.totalTransacoes > 0, `Relatório ${p} deve ter transações no seed`);
      }

      // GERENTE pode listar nomes e estatísticas de vendedores, mas NÃO pode acessar gestão de usuários nem deletar
      const mgrStats = await apiFetch('/movements/user-stats', { token: tokenLoja1Gerente });
      assert.equal(mgrStats.status, 200);
      assert.ok(mgrStats.data.length > 0);

      const mgrUsers = await apiFetch('/users', { token: tokenLoja1Gerente });
      assert.equal(mgrUsers.status, 403);

      const prods1 = await apiFetch('/products?limit=5', { token: tokenLoja1Gerente });
      const mgrDelProd = await apiFetch(`/products/${prods1.data.data[0].id}`, {
        method: 'DELETE',
        token: tokenLoja1Gerente,
      });
      assert.equal(mgrDelProd.status, 403);
    })();

    // =========================================================================
    // TESTE 5: Soft Delete + Invalidação de cache de sessão + Bloqueio de venda em inativo
    // =========================================================================
    await check('Soft Delete inativa usuário com cache invalidado (403) e preserva histórico de produto vendido', async () => {
      // Criar operador na Loja Audit A e autenticar
      const opEmail = `op.soft.${Date.now()}@teste.com`;
      const createdOp = await apiFetch('/users', {
        method: 'POST',
        token: tokenTemp1,
        body: { nome: 'Op Temporario', email: opEmail, senha: 'Password123!', role: 'OPERADOR' },
      });
      assert.equal(createdOp.status, 201);
      const opTempId = createdOp.data.id;

      const opLogin = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: opEmail, senha: 'Password123!' },
      });
      assert.equal(opLogin.status, 200);
      const opTempToken = opLogin.data.token;

      // Popula cache de authMiddleware
      const meBefore = await apiFetch('/users/me', { token: opTempToken });
      assert.equal(meBefore.status, 200);

      // Inativa usuário via Soft Delete -> invalida cache imediatamente
      const toggled = await apiFetch(`/users/${opTempId}/status`, {
        method: 'PATCH',
        token: tokenTemp1,
        body: { ativo: false },
      });
      assert.equal(toggled.status, 200);
      assert.equal(toggled.data.ativo, false);

      const meAfter = await apiFetch('/users/me', { token: opTempToken });
      assert.equal(meAfter.status, 403, 'Usuário inativado deve ser bloqueado imediatamente no authMiddleware');

      // Criar categoria + produto na Loja Audit A, movimentar e testar Soft Delete automático no DELETE
      const cat = await apiFetch('/categories', {
        method: 'POST',
        token: tokenTemp1,
        body: { nome: 'Cat Audit' },
      });
      assert.equal(cat.status, 201);

      const prod = await apiFetch('/products', {
        method: 'POST',
        token: tokenTemp1,
        body: { nome: 'Produto Audit Histórico', preco: 120, quantidade: 20, categoriaId: cat.data.id },
      });
      assert.equal(prod.status, 201);

      const sale = await apiFetch(`/products/${prod.data.id}/adjust`, {
        method: 'POST',
        token: tokenTemp1,
        body: { quantidade: 3, tipo: 'VENDA', observacao: 'Venda para testar soft delete' },
      });
      assert.equal(sale.status, 200);
      assert.equal(sale.data.novaQuantidade, 17);

      const delProd = await apiFetch(`/products/${prod.data.id}`, {
        method: 'DELETE',
        token: tokenTemp1,
      });
      assert.equal(delProd.status, 200);
      assert.equal(delProd.data.softDeleted, true);
      assert.equal(delProd.data.produto.ativo, false);

      // Movimentar produto inativo deve falhar com 400
      const adjustInactive = await apiFetch(`/products/${prod.data.id}/adjust`, {
        method: 'POST',
        token: tokenTemp1,
        body: { quantidade: 1, tipo: 'VENDA' },
      });
      assert.equal(adjustInactive.status, 400);
    })();

    // =========================================================================
    // TESTE 6: Planilhas (.xlsx / .csv) - Template, Preview, Rollback em erro, Commit e Export
    // =========================================================================
    await check('Importação e Exportação de planilhas (.xlsx/.csv) validam linhas e isolam por estabelecimento', async () => {
      const tplRes = await fetch(`${BASE_URL}/products/import/template?format=xlsx`, {
        headers: { Authorization: `Bearer ${tokenTemp1}` },
      });
      assert.equal(tplRes.status, 200);
      const tplBuf = Buffer.from(await tplRes.arrayBuffer());
      assert.ok(tplBuf.length > 500);

      // Teste Preview válido com nova categoria e fornecedor
      const validBuf = await buildXlsxBuffer([
        { nome: 'Item Planilha 1', descricao: 'Desc 1', preco: 45.5, quantidade: 10, categoria: 'Nova Cat Planilha', fornecedor: 'Novo Forn Planilha', ativo: 'Sim' },
        { nome: 'Item Planilha 2', descricao: 'Desc 2', preco: '89,90', quantidade: 5, categoria: 'Nova Cat Planilha', fornecedor: 'Novo Forn Planilha', ativo: 'Sim' },
      ]);

      const fdPreview = new FormData();
      fdPreview.append('file', new Blob([validBuf]), 'produtos.xlsx');
      const preview = await apiFetch('/products/import?mode=preview', {
        method: 'POST',
        token: tokenTemp1,
        body: fdPreview,
      });
      assert.equal(preview.status, 200);
      assert.equal(preview.data.validCount, 2);
      assert.equal(preview.data.invalidCount, 0);
      assert.deepEqual(preview.data.newCategories, ['Nova Cat Planilha']);
      assert.deepEqual(preview.data.newSuppliers, ['Novo Forn Planilha']);

      // Teste Commit inválido (rollback atômico)
      const invalidBuf = await buildXlsxBuffer([
        { nome: 'Item Bom', descricao: 'OK', preco: 10, quantidade: 2 },
        { nome: 'Item Ruim', descricao: 'Negativo', preco: -5, quantidade: 2 },
      ]);
      const fdInvalid = new FormData();
      fdInvalid.append('file', new Blob([invalidBuf]), 'invalido.xlsx');
      const invalidCommit = await apiFetch('/products/import?mode=commit', {
        method: 'POST',
        token: tokenTemp1,
        body: fdInvalid,
      });
      assert.equal(invalidCommit.status, 400);
      assert.equal(invalidCommit.data.hasErrors, true);
      assert.equal(invalidCommit.data.errors.length, 1);

      // Teste Commit válido
      const fdCommit = new FormData();
      fdCommit.append('file', new Blob([validBuf]), 'produtos.xlsx');
      const commit = await apiFetch('/products/import?mode=commit', {
        method: 'POST',
        token: tokenTemp1,
        body: fdCommit,
      });
      assert.equal(commit.status, 201);
      assert.equal(commit.data.createdCount, 2);
      assert.equal(commit.data.createdCategoriesCount, 1);
      assert.equal(commit.data.createdSuppliersCount, 1);

      // Teste Exportação CSV e XLSX
      for (const fmt of ['xlsx', 'csv']) {
        const exp = await fetch(`${BASE_URL}/products/export?format=${fmt}&status=todos`, {
          headers: { Authorization: `Bearer ${tokenTemp1}` },
        });
        assert.equal(exp.status, 200);
        const expBuf = Buffer.from(await exp.arrayBuffer());
        assert.ok(expBuf.length > 50, `Exportação ${fmt} retornou vazia`);
      }
    })();

    console.log(`\n🎉 Auditoria concluída: ${passed}/6 baterias de teste aprovadas com 100% de sucesso!`);
  } finally {
    await cleanupTempStores(tempEmpresaIds).catch((e) =>
      console.error('⚠️ Erro ao limpar tenants temporários:', e)
    );
    await prisma.$disconnect();
    serverProc.kill('SIGTERM');
  }
}

runAuditSuite().catch((err) => {
  console.error('❌ Falha na suíte de auditoria:', err);
  process.exit(1);
});
