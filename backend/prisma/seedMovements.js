// arquivo responsável por regenerar movimentações de exemplo respeitando a hierarquia Organização -> Loja
import { prisma } from "../src/config/prismaClient.js";

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

async function seedMovements() {
  console.log("🔄 Atualizando movimentações unitárias por loja...");
  await prisma.movimento.deleteMany();

  const lojas = await prisma.loja.findMany({ where: { ativo: true } });
  if (lojas.length === 0) {
    console.log("❌ Nenhuma loja encontrada. Execute npm run seed primeiro.");
    return;
  }

  let seq = 5001;
  for (const loja of lojas) {
    const produtos = await prisma.produto.findMany({ where: { lojaId: loja.id, ativo: true } });
    const usuarios = await prisma.usuario.findMany({
      where: {
        organizacaoId: loja.organizacaoId,
        OR: [{ lojaId: loja.id }, { role: "ADMIN" }],
      },
    });
    if (produtos.length === 0 || usuarios.length === 0) continue;

    const pickUser = () => usuarios[Math.floor(Math.random() * usuarios.length)];

    for (const prod of produtos) {
      const baseStock = 80;
      let totalRep = 0;
      let totalVen = 0;
      const ops = [];

      for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
        const repQty = Math.floor(Math.random() * 5) + 5;
        const venQty = Math.floor(Math.random() * 5) + 4;
        totalRep += repQty;
        totalVen += venQty;

        const uRep = pickUser();
        const uVen = pickUser();
        const unit = Number(prod.preco || 0);

        ops.push(
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              organizacaoId: loja.organizacaoId,
              lojaId: loja.id,
              quantidade: repQty,
              tipo: "REPOSICAO",
              precoUnitario: unit,
              valorTotal: Number((unit * repQty).toFixed(2)),
              estorno: false,
              usuarioId: uRep.id,
              vendedorRefId: uRep.id,
              vendedorNomeSnapshot: uRep.nome,
              vendedorEmailSnapshot: uRep.email,
              data: buildRelativeDate(monthsAgo, 5, 9),
              observacao: `Reposição avulsa #${seq++}`,
            },
          }),
          prisma.movimento.create({
            data: {
              produtoId: prod.id,
              organizacaoId: loja.organizacaoId,
              lojaId: loja.id,
              quantidade: venQty,
              tipo: "VENDA",
              precoUnitario: unit,
              valorTotal: Number((unit * venQty).toFixed(2)),
              estorno: false,
              usuarioId: uVen.id,
              vendedorRefId: uVen.id,
              vendedorNomeSnapshot: uVen.nome,
              vendedorEmailSnapshot: uVen.email,
              data: buildRelativeDate(monthsAgo, 16, 15),
              observacao: `Venda avulsa #${seq++}`,
            },
          })
        );
      }

      const finalStock = Math.max(5, baseStock + totalRep - totalVen);
      ops.push(prisma.produto.update({ where: { id: prod.id }, data: { quantidade: finalStock } }));
      await prisma.$transaction(ops);
    }
    console.log(`✅ Movimentações geradas para ${loja.nome}`);
  }
}

seedMovements()
  .catch((e) => {
    console.error("❌ Erro durante seedMovements:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
