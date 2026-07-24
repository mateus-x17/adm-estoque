// prisma/reset.js
// Limpa todas as tabelas na ordem correta (respeitando chaves estrangeiras)
import { prisma } from "../src/config/prismaClient.js";

async function reset() {
  console.log("🗑️  Iniciando reset do banco de dados...");

  await prisma.movimento.deleteMany();
  console.log("✅ Movimentos deletados");

  await prisma.produto.deleteMany();
  console.log("✅ Produtos deletados");

  await prisma.categoria.deleteMany();
  console.log("✅ Categorias deletadas");

  await prisma.fornecedor.deleteMany();
  console.log("✅ Fornecedores deletados");

  await prisma.usuario.deleteMany();
  console.log("✅ Usuários deletados");

  console.log("\n🎉 Reset concluído! Banco de dados limpo.");
}

reset()
  .catch((e) => {
    console.error("❌ Erro durante o reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
