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
    { nome: "TechDistribuidora Ltda", email: "contato@techdist.com", endereco: "Av. Tecnológica, 1000" },
    { nome: "Mundo dos Periféricos", email: "vendas@mperifericos.com", endereco: "Rua Central, 200" },
    { nome: "ErgoMóveis SA", email: "suporte@ergomoveis.com", endereco: "Av. Conforto, 55" },
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

    const initialBaseStock = Math.floor(Math.random() * 21) + 95; // 95 a 115 de base

    const created = await prisma.produto.create({
      data: {
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        quantidade: initialBaseStock,
        imagem: null,
        categoriaId: categoria ? categoria.id : null,
        fornecedorId: fornecedor ? fornecedor.id : null,
      },
    });
    createdProducts.push({ ...created, initialBaseStock });
    console.log(`📦 Produto criado: "${created.nome}" (id ${created.id}) com estoque base ${initialBaseStock}`);
  }

  // 5) Movimentações e atualizações de estoque (por produto ao longo dos meses de 2026)
  // Distribuição de usuários: admin, gerente, operadores (rota de uso)
  const usersForActions = [usuarioAdmin, usuarioGerente, ...operadores];
  let userIndex = 0;
  function nextUser() {
    const u = usersForActions[userIndex % usersForActions.length];
    userIndex += 1;
    return u;
  }

  function createDate(year, month, day, hour = 10, min = 0) {
    return new Date(year, month, day, hour, min, Math.floor(Math.random() * 60));
  }

  let orderCounter = 1001;

  for (let prodIdx = 0; prodIdx < createdProducts.length; prodIdx++) {
    const prod = createdProducts[prodIdx];
    let currentStock = prod.initialBaseStock;
    let totalRep = 0;
    let totalVen = 0;

    const movimentosOps = [];

    // Meses de 2026: 0 = Janeiro até 9 = Outubro (mês corrente)
    for (let m = 0; m <= 9; m++) {
      const isWorstMonth = (m === 1 || m === 6); // Fevereiro (mês 1) e Julho (mês 6)

      let repMonth = 0;
      let venMonth = 0;

      if (isWorstMonth) {
        // Piores meses: reposição se iguala ou é ligeiramente maior que vendas
        venMonth = Math.floor(Math.random() * 5) + 14; // 14 a 18
        const diff = (m === 1)
          ? (Math.floor(Math.random() * 2) + 1) // Fev: +1 ou +2 para reposição
          : (prodIdx % 2 === 0 ? 0 : 1);        // Jul: se iguala (diff = 0) ou +1
        repMonth = venMonth + diff;
      } else {
        // Meses normais: vendas sempre maiores que as reposições
        repMonth = Math.floor(Math.random() * 6) + 11; // 11 a 16
        venMonth = repMonth + Math.floor(Math.random() * 6) + 6; // rep + 6 a 11 (vendas sempre maiores)
      }

      totalRep += repMonth;
      totalVen += venMonth;

      // 1) Reposição 1 - início do mês (dias 2 a 4)
      const repPart1 = Math.max(1, Math.floor(repMonth * 0.55));
      const repPart2 = repMonth - repPart1;

      const diaRep1 = Math.floor(Math.random() * 3) + 2; // dias 2 a 4
      const dataRep1 = createDate(2026, m, diaRep1, 8 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 50));

      movimentosOps.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            quantidade: repPart1,
            tipo: "REPOSICAO",
            usuarioId: nextUser().id,
            data: dataRep1,
            observacao: `Reposição de estoque - Fornecedor Lote ${m + 1}A/2026`,
          },
        })
      );

      // 2) Venda 1 - primeira semana (dias 6 a 8)
      const v1 = Math.max(1, Math.floor(venMonth * 0.35));
      const v2 = Math.max(1, Math.floor(venMonth * 0.35));
      const v3 = venMonth - v1 - v2;

      const diaV1 = Math.floor(Math.random() * 3) + 6; // dias 6 a 8
      const dataV1 = createDate(2026, m, diaV1, 9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 50));
      movimentosOps.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            quantidade: v1,
            tipo: "VENDA",
            usuarioId: nextUser().id,
            data: dataV1,
            observacao: `Venda balcão / Pedido #${orderCounter++}`,
          },
        })
      );

      // 3) Venda 2 - meio do mês (dias 10 a 13)
      const diaV2 = Math.floor(Math.random() * 4) + 10; // dias 10 a 13
      const dataV2 = createDate(2026, m, diaV2, 9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 50));
      movimentosOps.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            quantidade: v2,
            tipo: "VENDA",
            usuarioId: nextUser().id,
            data: dataV2,
            observacao: `Saída por venda online #${orderCounter++}`,
          },
        })
      );

      // 4) Reposição 2 e Venda 3 intercaladas na segunda quinzena
      let diaRep2, diaV3;
      if (prodIdx % 2 === 0) {
        // Produtos pares: Reposição mais recente nos dias 19 a 21, Venda 3 nos dias 15 a 18
        diaV3 = Math.floor(Math.random() * 4) + 15; // dias 15 a 18
        diaRep2 = (m === 9) ? (Math.floor(Math.random() * 3) + 19) : (Math.floor(Math.random() * 4) + 20); // dias 19 a 21/23
      } else {
        // Produtos ímpares: Venda 3 mais recente nos dias 19 a 22, Reposição nos dias 15 a 18
        diaRep2 = Math.floor(Math.random() * 4) + 15; // dias 15 a 18
        diaV3 = (m === 9) ? (Math.floor(Math.random() * 3) + 19) : (Math.floor(Math.random() * 4) + 20); // dias 19 a 21/23
      }

      if (repPart2 > 0) {
        const dataRep2 = createDate(2026, m, diaRep2, 8 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 50));
        movimentosOps.push(
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              quantidade: repPart2,
              tipo: "REPOSICAO",
              usuarioId: nextUser().id,
              data: dataRep2,
              observacao: `Reposição complementar de estoque Lote ${m + 1}B/2026`,
            },
          })
        );
      }

      if (v3 > 0) {
        const dataV3 = createDate(2026, m, diaV3, 9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 50));
        movimentosOps.push(
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              quantidade: v3,
              tipo: "VENDA",
              usuarioId: nextUser().id,
              data: dataV3,
              observacao: `Venda corporativa #${orderCounter++}`,
            },
          })
        );
      }
    }

    // Calcula estoque final
    const finalStock = currentStock + totalRep - totalVen;

    // Atualiza o estoque final do produto
    movimentosOps.push(
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: finalStock },
      })
    );

    await prisma.$transaction(movimentosOps);

    console.log(`📦 Produto: "${prod.nome}" (id ${prod.id})`);
    console.log(`   ➕ Total Reposições: +${totalRep}`);
    console.log(`   ➖ Total Vendas:     -${totalVen} (Saldo positivo Vendas > Reposições: +${totalVen - totalRep})`);
    console.log(`   🏁 Estoque final:     ${finalStock} (base inicial: ${prod.initialBaseStock})`);
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
