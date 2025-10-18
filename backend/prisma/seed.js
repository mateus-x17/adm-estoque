// prisma/seed.js
// const { PrismaClient } = require("@prisma/client");
// const bcrypt = require("bcrypt");
import bcrypt from "bcryptjs";
import {prisma} from "../src/config/prismaClient.js";

// const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log("🔄 Iniciando seed...");

  // 1) Usuários
  const plainPassword = "Password123!";
  const hashedAdmin = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const hashedGerente = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const hashedOperador = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  const usuarioAdmin = await prisma.usuario.create({
    data: {
      nome: "Lucas Silva",
      email: "lucas.admin@example.com",
      senha: hashedAdmin,
      role: "ADMIN",
      imagem: null,
    },
  });
  console.log(`✅ Usuário ADMIN criado: ${usuarioAdmin.nome} (id ${usuarioAdmin.id})`);

  const usuarioGerente = await prisma.usuario.create({
    data: {
      nome: "Maria Oliveira",
      email: "maria.gerente@example.com",
      senha: hashedGerente,
      role: "GERENTE",
      imagem: null,
    },
  });
  console.log(`✅ Usuário GERENTE criado: ${usuarioGerente.nome} (id ${usuarioGerente.id})`);

  // 3 operadores
  const operadores = [];
  const operadoresData = [
    { nome: "João Pereira", email: "joao.op1@example.com" },
    { nome: "Ana Costa", email: "ana.op2@example.com" },
    { nome: "Pedro Santos", email: "pedro.op3@example.com" },
  ];
  for (const op of operadoresData) {
    const u = await prisma.usuario.create({
      data: {
        nome: op.nome,
        email: op.email,
        senha: hashedOperador,
        role: "OPERADOR",
        imagem: null,
      },
    });
    operadores.push(u);
    console.log(`✅ Usuário OPERADOR criado: ${u.nome} (id ${u.id})`);
  }

  // 2) Categorias
  const categorias = [];
  const categoriesData = ["Periféricos", "Monitores", "Cadeiras"];
  for (const nome of categoriesData) {
    const c = await prisma.categoria.create({ data: { nome } });
    categorias.push(c);
    console.log(`📂 Categoria criada: ${c.nome} (id ${c.id})`);
  }

  // 3) Fornecedores
  const fornecedoresData = [
    { nome: "TechDistribuidora Ltda", contato: "contato@techdist.com", endereco: "Av. Tecnológica, 1000" },
    { nome: "Mundo dos Periféricos", contato: "vendas@mperifericos.com", endereco: "Rua Central, 200" },
    { nome: "ErgoMóveis SA", contato: "suporte@ergomoveis.com", endereco: "Av. Conforto, 55" },
  ];
  const fornecedores = [];
  for (const f of fornecedoresData) {
    const created = await prisma.fornecedor.create({ data: f });
    fornecedores.push(created);
    console.log(`🏷️ Fornecedor criado: ${created.nome} (id ${created.id})`);
  }

  // 4) Produtos (10 produtos com nomes reais) - inicialmente quantidade 0
  const produtosData = [
    { nome: "Mouse Gamer Logitech G502", descricao: "Mouse com sensor de alta precisão", preco: 279.90, categoria: "Periféricos", fornecedor: "TechDistribuidora Ltda" },
    { nome: "Teclado Mecânico Redragon K552", descricao: "Teclado compacto mecânico", preco: 199.90, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos" },
    { nome: "Monitor 24\" Full HD Samsung", descricao: "Monitor 24 polegadas 1080p", preco: 899.00, categoria: "Monitores", fornecedor: "TechDistribuidora Ltda" },
    { nome: "Monitor 27\" QHD Dell", descricao: "Monitor 27 polegadas QHD", preco: 1799.00, categoria: "Monitores", fornecedor: "TechDistribuidora Ltda" },
    { nome: "Cadeira Gamer AlphaSeries", descricao: "Cadeira ergonômica com reclínio", preco: 1299.00, categoria: "Cadeiras", fornecedor: "ErgoMóveis SA" },
    { nome: "Mousepad XL HyperX", descricao: "Mousepad grande para jogos", preco: 89.90, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos" },
    { nome: "Suporte VESA 75/100", descricao: "Suporte para monitor VESA", preco: 149.90, categoria: "Monitores", fornecedor: "Mundo dos Periféricos" },
    { nome: "Teclado Wireless Logitech K380", descricao: "Teclado compacto wireless", preco: 259.90, categoria: "Periféricos", fornecedor: "TechDistribuidora Ltda" },
    { nome: "Cadeira Office Comfort", descricao: "Cadeira escritório com ajuste lombar", preco: 799.00, categoria: "Cadeiras", fornecedor: "ErgoMóveis SA" },
    { nome: "Headset Gamer HyperSound", descricao: "Headset com microfone e som 7.1", preco: 349.90, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos" },
  ];

  const createdProducts = [];
  for (const p of produtosData) {
    // acha categoria e fornecedor por nome
    const categoria = categorias.find(c => c.nome === p.categoria);
    const fornecedor = fornecedores.find(f => f.nome === p.fornecedor);

    const created = await prisma.produto.create({
      data: {
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        quantidade: 0, // inicial 0, iremos ajustar via movimentos
        imagem: null,
        categoriaId: categoria ? categoria.id : null,
        fornecedorId: fornecedor ? fornecedor.id : null,
      },
    });
    createdProducts.push(created);
    console.log(`📦 Produto criado: "${created.nome}" (id ${created.id}) com estoque inicial ${created.quantidade}`);
  }

  // 5) Movimentações e atualizações de estoque (por produto)
  // Distribuição de usuários: admin, gerente, operadores (rota de uso)
  const usersForActions = [usuarioAdmin, usuarioGerente, ...operadores];

  // Função utilitária para escolher usuário (roda entre os disponíveis)
  let userIndex = 0;
  function nextUser() {
    const u = usersForActions[userIndex % usersForActions.length];
    userIndex += 1;
    return u;
  }

  // Para cada produto vamos criar:
  // - ENTRADA inicial (cadastro de estoque)
  // - ENTRADA reposição
  // - SAIDA venda
  // - Ajuste (pode ser entrada ou saída)
  for (const prod of createdProducts) {
    // valores coerentes por produto (pode ajustar ranges)
    const entradaInicial = Math.floor(Math.random() * 81) + 20; // 20-100
    const reposicao = Math.floor(Math.random() * 41) + 10; // 10-50
    const saidaVenda = Math.floor(Math.random() * 20) + 1; // 1-20
    const ajuste = (Math.random() > 0.5) ? (Math.floor(Math.random() * 6) + 1) : -(Math.floor(Math.random() * 3) + 1); // +1..+6 ou -1..-3

    const movimentosOps = [
      // 1) entrada inicial
      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: entradaInicial,
          tipo: "ENTRADA",
          usuarioId: nextUser().id,
          observacao: "Entrada inicial de estoque (cadastro)",
        },
      }),
      // 2) atualizar quantidade +entradaInicial
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { increment: entradaInicial } },
      }),

      // 3) reposição (entrada)
      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: reposicao,
          tipo: "ENTRADA",
          usuarioId: nextUser().id,
          observacao: "Reposição vinda do fornecedor",
        },
      }),
      // 4) atualizar quantidade +reposicao
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { increment: reposicao } },
      }),

      // 5) saída simulando venda
      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: saidaVenda,
          tipo: "SAIDA",
          usuarioId: nextUser().id,
          observacao: "Saída para venda/pedido",
        },
      }),
      // 6) atualizar quantidade -saidaVenda
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { decrement: saidaVenda } },
      }),

      // 7) ajuste manual (pode ser ENTRADA ou SAIDA)
      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: Math.abs(ajuste),
          tipo: ajuste >= 0 ? "ENTRADA" : "SAIDA",
          usuarioId: nextUser().id,
          observacao: ajuste >= 0 ? "Ajuste positivo de inventário" : "Ajuste negativo de inventário",
        },
      }),
      // 8) atualizar quantidade conforme ajuste
      prisma.produto.update({
        where: { id: prod.id },
        data: ajuste >= 0 ? { quantidade: { increment: ajuste } } : { quantidade: { decrement: Math.abs(ajuste) } },
      }),
    ];

    // Executa as operações do produto em uma transação (garante atomicidade)
    const results = await prisma.$transaction(movimentosOps);

    // results contém 8 elementos: movimento, update, movimento, update, movimento, update, movimento, update
    const [mov1, up1, mov2, up2, mov3, up3, mov4, up4] = results;

    // Exibir logs legíveis
    console.log("");
    console.log(`📦 Produto: "${prod.nome}" (id ${prod.id})`);
    console.log(`   ➕ Entrada inicial: +${entradaInicial} (mov id ${mov1.id}) → estoque agora: ${up1.quantidade}`);
    console.log(`   ➕ Reposição: +${reposicao} (mov id ${mov2.id}) → estoque agora: ${up2.quantidade}`);
    console.log(`   ➖ Saída (venda): -${saidaVenda} (mov id ${mov3.id}) → estoque agora: ${up3.quantidade}`);
    const ajusteSign = ajuste >= 0 ? "+" : "-";
    console.log(`   🔧 Ajuste: ${ajusteSign}${Math.abs(ajuste)} (mov id ${mov4.id}) → estoque agora: ${up4.quantidade}`);
  }

  console.log("\n✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
