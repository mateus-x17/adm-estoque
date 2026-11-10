// arquivo responsável por limpar todas as tabelas do banco de dados na ordem segura de chaves estrangeiras
import { prisma } from "../src/config/prismaClient.js";

// função principal de limpeza geral do banco multi-tenant
// 1 - Remove registros filhos dependentes (Movimento -> Produto -> Categoria/Fornecedor -> Usuario)
// 2 - Remove por fim os estabelecimentos (Empresa) preservando a integridade referencial
async function reset() {
  console.log("🗑️  Iniciando reset completo do banco de dados...");

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

  await prisma.empresa.deleteMany();
  console.log("✅ Estabelecimentos (Empresas) deletados");

  console.log("\n🎉 Reset concluído! Banco de dados pronto para novo seed.");
}

reset()
  .catch((e) => {
    console.error("❌ Erro durante o reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
