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

      // 1) Reposição no início do mês (dias 2 a 5)
      const diaRep = Math.floor(Math.random() * 4) + 2;
      const dataRep = createDate(2026, m, diaRep, 8 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 50));

      movimentosOps.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            quantidade: repMonth,
            tipo: "REPOSICAO",
            usuarioId: randomUser().id,
            data: dataRep,
            observacao: `Reposição de estoque - Fornecedor Lote ${m + 1}/2026`,
          },
        })
      );

      // 2) Vendas fracionadas ao longo do mês (2 a 3 vendas)
      const v1 = Math.floor(venMonth * 0.35);
      const v2 = Math.floor(venMonth * 0.35);
      const v3 = venMonth - v1 - v2;

      const diaV1 = Math.floor(Math.random() * 3) + 7;
      const diaV2 = Math.floor(Math.random() * 3) + 13;
      const diaV3 = (m === 9) ? (Math.floor(Math.random() * 3) + 18) : (Math.floor(Math.random() * 5) + 21);

      const dataV1 = createDate(2026, m, diaV1, 9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 50));
      const dataV2 = createDate(2026, m, diaV2, 9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 50));
      const dataV3 = createDate(2026, m, diaV3, 9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 50));

      const vendasDoMes = [
        { qtd: v1, data: dataV1, obs: `Venda balcão / Pedido #${orderCounter++}` },
        { qtd: v2, data: dataV2, obs: `Saída por venda online #${orderCounter++}` },
        { qtd: v3, data: dataV3, obs: `Venda corporativa #${orderCounter++}` },
      ];

      for (const v of vendasDoMes) {
        if (v.qtd > 0) {
          movimentosOps.push(
            prisma.movimento.create({
              data: {
                produtoId: prod.id,
                quantidade: v.qtd,
                tipo: "VENDA",
                usuarioId: randomUser().id,
                data: v.data,
                observacao: v.obs,
              },
            })
          );
        }
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
