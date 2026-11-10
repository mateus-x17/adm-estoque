// arquivo responsável por regenerar movimentações históricas respeitando o isolamento multi-tenant de cada loja
import { prisma } from "../src/config/prismaClient.js";

// função auxiliar para gerar datas retroativas dentro dos últimos 12 meses até o instante atual
function buildRelativeDate(monthsAgo, dayOfMonth, hour = 10) {
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    dayOfMonth,
    hour,
    Math.floor(Math.random() * 50),
    0
  );
  if (target > now) {
    return new Date(now.getTime() - (Math.floor(Math.random() * 48) + 1) * 60 * 60 * 1000);
  }
  return target;
}

// função principal para recriar movimentações coerentes separadas estritamente por empresaId
// 1 - Remove todas as movimentações anteriores
// 2 - Carrega estabelecimentos e processa separadamente os produtos e colaboradores ativos de cada loja
// 3 - Gera histórico dos últimos 12 meses mantendo integridade multi-tenant e saldo final positivo
async function seedMovements() {
  console.log("🔄 Atualizando movimentações por estabelecimento...");

  await prisma.movimento.deleteMany();
  console.log("🗑️  Movimentações antigas removidas");

  const empresas = await prisma.empresa.findMany({ where: { ativo: true } });
  if (empresas.length === 0) {
    console.log("❌ Nenhuma empresa encontrada. Execute o seed principal primeiro.");
    return;
  }

  let orderCounter = 5001;

  for (const empresa of empresas) {
    const produtos = await prisma.produto.findMany({
      where: { empresaId: empresa.id, ativo: true },
    });
    const usuarios = await prisma.usuario.findMany({
      where: { empresaId: empresa.id, ativo: true },
    });

    if (produtos.length === 0 || usuarios.length === 0) {
      console.log(`⚠️  Loja "${empresa.nome}" sem produtos ou usuários ativos. Pulando...`);
      continue;
    }

    const pickUser = () => usuarios[Math.floor(Math.random() * usuarios.length)];

    for (const prod of produtos) {
      const baseStock = 90;
      let totalRep = 0;
      let totalVen = 0;
      const ops = [];

      for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
        const repQty = Math.floor(Math.random() * 6) + 6;
        const venQty = Math.floor(Math.random() * 6) + 7;

        totalRep += repQty;
        totalVen += venQty;

        ops.push(
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              empresaId: empresa.id,
              quantidade: repQty,
              tipo: "REPOSICAO",
              usuarioId: pickUser().id,
              data: buildRelativeDate(monthsAgo, 5, 9),
              observacao: `Reposição mensal #${orderCounter++}`,
            },
          }),
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              empresaId: empresa.id,
              quantidade: venQty,
              tipo: "VENDA",
              usuarioId: pickUser().id,
              data: buildRelativeDate(monthsAgo, 16, 15),
              observacao: `Venda registrada #${orderCounter++}`,
            },
          })
        );
      }

      const finalStock = Math.max(5, baseStock + totalRep - totalVen);
      ops.push(
        prisma.produto.update({
          where: { id: prod.id },
          data: { quantidade: finalStock },
        })
      );

      await prisma.$transaction(ops);
      console.log(`✅ [${empresa.slug}] "${prod.nome}": estoque ajustado para ${finalStock}`);
    }
  }

  console.log("✅ Seed de movimentações multi-tenant concluído!");
}

seedMovements()
  .catch((e) => {
    console.error("❌ Erro durante seedMovements:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
