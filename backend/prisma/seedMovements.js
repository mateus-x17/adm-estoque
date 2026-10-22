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

  function createDate(year, month, day, hour = 10, min = 0) {
    return new Date(year, month, day, hour, min, Math.floor(Math.random() * 60));
  }

  let orderCounter = 2001;

  // 3️⃣ Criar novas movimentações mensais coerentes para cada produto (Jan a Out/2026)
  for (let prodIdx = 0; prodIdx < produtos.length; prodIdx++) {
    const prod = produtos[prodIdx];
    const initialBaseStock = Math.floor(Math.random() * 21) + 95; // 95 a 115 de base
    let totalRep = 0;
    let totalVen = 0;

    const movimentosOps = [];

    // Meses de 2026: 0 = Janeiro até 9 = Outubro
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
            usuarioId: randomUser().id,
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
            usuarioId: randomUser().id,
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
            usuarioId: randomUser().id,
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
              usuarioId: randomUser().id,
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
              usuarioId: randomUser().id,
              data: dataV3,
              observacao: `Venda corporativa #${orderCounter++}`,
            },
          })
        );
      }
    }

    // Calcula estoque final
    const finalStock = initialBaseStock + totalRep - totalVen;

    // Atualiza o estoque final do produto
    movimentosOps.push(
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: finalStock },
      })
    );

    await prisma.$transaction(movimentosOps);
    console.log(`✅ Movimentações geradas para "${prod.nome}": Reposições +${totalRep}, Vendas -${totalVen} (Saldo: +${totalVen - totalRep}, Estoque: ${finalStock})`);
  }

  console.log("✅ Seed de movimentações concluído com saldo positivo!");
}

seedMovements()
  .catch((e) => {
    console.error("❌ Erro durante seedMovements:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
