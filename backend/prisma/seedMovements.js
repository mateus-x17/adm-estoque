// prisma/seedMovements.js
import { prisma } from "../src/config/prismaClient.js";

async function seedMovements() {
  console.log("🔄 Atualizando movimentações...");

  // 1️⃣ Apagar todas as movimentações existentes
  await prisma.movimento.deleteMany();
  console.log("🗑️ Movimentações antigas removidas");

  // 2️⃣ Buscar produtos e usuários existentes
  const produtos = await prisma.produto.findMany();
  const usuarios = await prisma.usuario.findMany();

  if (produtos.length === 0 || usuarios.length === 0) {
    console.log("❌ Nenhum produto ou usuário encontrado. Seed abortado.");
    return;
  }

  // Função para escolher usuário aleatório
  const randomUser = () => usuarios[Math.floor(Math.random() * usuarios.length)];

  // Função para gerar data aleatória nos últimos 30 dias
  const randomDate = () => {
    const today = new Date();
    const pastDays = Math.floor(Math.random() * 30); // 0 a 29 dias atrás
    const date = new Date(today);
    date.setDate(today.getDate() - pastDays);
    // adiciona horas aleatórias para evitar duplicação exata
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    date.setSeconds(Math.floor(Math.random() * 60));
    return date;
  };

  // 3️⃣ Criar novas movimentações para cada produto
  for (const prod of produtos) {
    // Quantidades simuladas
    const entradaInicial = Math.floor(Math.random() * 81) + 20; // 20-100
    const reposicao = Math.floor(Math.random() * 41) + 10; // 10-50
    const saidaVenda = Math.floor(Math.random() * 20) + 1; // 1-20
    const ajuste = (Math.random() > 0.5) ? (Math.floor(Math.random() * 6) + 1) : -(Math.floor(Math.random() * 3) + 1);

    const movimentosOps = [
      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: entradaInicial,
          tipo: "ENTRADA",
          usuarioId: randomUser().id,
          data: randomDate(),
          observacao: "Entrada inicial de estoque (cadastro)",
        },
      }),
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { increment: entradaInicial } },
      }),

      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: reposicao,
          tipo: "ENTRADA",
          usuarioId: randomUser().id,
          data: randomDate(),
          observacao: "Reposição vinda do fornecedor",
        },
      }),
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { increment: reposicao } },
      }),

      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: saidaVenda,
          tipo: "SAIDA",
          usuarioId: randomUser().id,
          data: randomDate(),
          observacao: "Saída para venda/pedido",
        },
      }),
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: { decrement: saidaVenda } },
      }),

      prisma.movimento.create({
        data: {
          produtoId: prod.id,
          quantidade: Math.abs(ajuste),
          tipo: ajuste >= 0 ? "ENTRADA" : "SAIDA",
          usuarioId: randomUser().id,
          data: randomDate(),
          observacao: ajuste >= 0 ? "Ajuste positivo de inventário" : "Ajuste negativo de inventário",
        },
      }),
      prisma.produto.update({
        where: { id: prod.id },
        data: ajuste >= 0 ? { quantidade: { increment: ajuste } } : { quantidade: { decrement: Math.abs(ajuste) } },
      }),
    ];

    await prisma.$transaction(movimentosOps);
    console.log(`✅ Movimentações geradas para o produto "${prod.nome}"`);
  }

  console.log("✅ Seed de movimentações concluído!");
}

seedMovements()
  .catch((e) => {
    console.error("❌ Erro durante seedMovements:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
