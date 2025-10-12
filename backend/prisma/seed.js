// 🔹 Seed inicial do banco de dados
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 🔹 Criar usuário ADMIN
  const passwordAdmin = await bcrypt.hash("senha123", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      nome: "Admin Inicial",
      email: "admin@empresa.com",
      senha: passwordAdmin,
      role: "ADMIN",
      imagem: null, // ✅ campo imagem vazio
    },
  });

  // 🔹 Criar usuário GERENTE
  const passwordGerente = await bcrypt.hash("senha123", 10);
  await prisma.usuario.upsert({
    where: { email: "gerente@empresa.com" },
    update: {},
    create: {
      nome: "Gerente",
      email: "gerente@empresa.com",
      senha: passwordGerente,
      role: "GERENTE",
      imagem: null, // ✅ campo imagem vazio
    },
  });

  // 🔹 Categorias
  const cat1 = await prisma.categoria.upsert({
    where: { nome: "Eletrônicos" },
    update: {},
    create: { nome: "Eletrônicos" },
  });
  const cat2 = await prisma.categoria.upsert({
    where: { nome: "Vestuário" },
    update: {},
    create: { nome: "Vestuário" },
  });

  // 🔹 Fornecedores
  const f1 = await prisma.fornecedor.create({
    data: {
      nome: "Fornecedor A",
      contato: "contato@a.com",
      endereco: "Rua A, 100",
    },
  });

  const f2 = await prisma.fornecedor.create({
    data: {
      nome: "Fornecedor B",
      contato: "contato@b.com",
      endereco: "Rua B, 200",
    },
  });

  // 🔹 Produtos exemplo
  await prisma.produto.create({
    data: {
      nome: "Notebook Dell",
      descricao: "Notebook de alto desempenho - SIMULAÇÃO",
      preco: 3500,
      quantidade: 10,
      imagem: "/uploads/notebook.png", // caminho de exemplo
      categoriaId: cat1.id,
      fornecedorId: f1.id,
    },
  });

  await prisma.produto.create({
    data: {
      nome: "Camiseta Azul",
      descricao: "Camiseta de algodão - SIMULAÇÃO",
      preco: 50,
      quantidade: 30,
      imagem: "/uploads/camiseta.png", // caminho de exemplo
      categoriaId: cat2.id,
      fornecedorId: f2.id,
    },
  });

  console.log("✅ Seed executado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
