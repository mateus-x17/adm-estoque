// arquivo responsável pelo povoamento inicial (seed) multi-tenant com 2 estabelecimentos completos,
// fotos isoladas por pasta de loja no Cloudinary, categorias, fornecedores, produtos e histórico de 12 meses
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/config/prismaClient.js";
import cloudinary, { getTenantFolder } from "../src/config/cloudinaryConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.resolve(__dirname, "../uploads");
const SALT_ROUNDS = 10;

// função auxiliar para localizar arquivo local pelo prefixo do nome sem sofrer com diferenças de acentuação no sistema de arquivos
// 1 - Lista os arquivos da subpasta informada ('usuarios' ou 'produtos')
// 2 - Procura o primeiro arquivo cujo nome inicia com o prefixo informado
// 3 - Retorna objeto com caminho absoluto e URL relativa de fallback
function findLocalUploadAsset(subfolder, filePrefix) {
  const dir = path.join(UPLOADS_ROOT, subfolder);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const match = files.find((f) => f.startsWith(filePrefix));
  if (!match) return null;
  return {
    fullPath: path.join(dir, match),
    relativeUrl: `/uploads/${subfolder}/${match}`,
  };
}

// função auxiliar para enviar imagem de seed para a pasta dedicada da loja no Cloudinary sem remover o arquivo local
// 1 - Verifica se as credenciais do Cloudinary estão disponíveis no ambiente
// 2 - Envia para 'estoque-os/lojas/<slug>/<subfolder>' usando public_id determinístico para evitar duplicatas ao re-executar o seed
// 3 - Caso falhe ou não esteja configurado, retorna o fallback relativo local '/uploads/...'
async function resolveSeedImage(subfolder, filePrefix, tenantSlug, publicId) {
  const asset = findLocalUploadAsset(subfolder, filePrefix);
  if (!asset) return null;

  const hasCloudinary =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!hasCloudinary) {
    return asset.relativeUrl;
  }

  try {
    const folder = getTenantFolder(tenantSlug, subfolder);
    const result = await cloudinary.uploader.upload(asset.fullPath, {
      folder,
      public_id: publicId,
      overwrite: true,
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`⚠️ Falha no upload Cloudinary para ${publicId}, usando caminho local:`, err.message);
    return asset.relativeUrl;
  }
}

// função auxiliar para construir datas retroativas relativas ao dia atual cobrindo os últimos 12 meses
// 1 - Recebe quantos meses atrás (0 = mês atual, 11 = 11 meses atrás) e dia/hora desejados
// 2 - Garante que nenhuma data ultrapasse o instante atual ('now') para aparecer corretamente nos relatórios 1m/6m/1y
function buildRelativeDate(monthsAgo, dayOfMonth, hour = 10) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth, hour, Math.floor(Math.random() * 50), 0);
  if (target > now) {
    return new Date(now.getTime() - (Math.floor(Math.random() * 48) + 1) * 60 * 60 * 1000);
  }
  return target;
}

// função para criar completamente um estabelecimento (tenant) com equipe, fotos, catálogo e histórico
// 1 - Cria o registro Empresa com slug único
// 2 - Cria Admin, Gerente, Operadores (e opcionalmente colaborador inativo para demonstração de Soft Delete) com fotos no Cloudinary
// 3 - Cria Categorias, Fornecedores e Produtos vinculados exclusivamente à empresa
// 4 - Gera histórico coerente de reposições e vendas nos últimos 12 meses ajustando o saldo final em transação
async function seedStore(storeConfig, passwordHash) {
  console.log(`\n🏪 Criando estabelecimento: ${storeConfig.nome} (${storeConfig.slug})...`);

  const empresa = await prisma.empresa.create({
    data: {
      nome: storeConfig.nome,
      slug: storeConfig.slug,
      cnpj: storeConfig.cnpj,
      telefone: storeConfig.telefone,
      ativo: true,
    },
  });

  // 1) Usuários com fotos enviadas para subpasta isolada no Cloudinary
  const activeUsers = [];
  for (const u of storeConfig.usuarios) {
    const imagem = await resolveSeedImage(
      "usuarios",
      u.avatarPrefix,
      storeConfig.slug,
      `avatar-${u.slugId}`
    );

    const createdUser = await prisma.usuario.create({
      data: {
        nome: u.nome,
        email: u.email.toLowerCase(),
        senha: passwordHash,
        role: u.role,
        ativo: u.ativo !== undefined ? u.ativo : true,
        imagem,
        empresaId: empresa.id,
      },
    });

    if (createdUser.ativo) {
      activeUsers.push(createdUser);
    }
    console.log(
      `   👤 [${createdUser.role}] ${createdUser.nome} (${createdUser.email}) | ativo=${createdUser.ativo} | foto=${imagem ? "OK" : "null"}`
    );
  }

  // 2) Categorias da loja
  const catMap = new Map();
  for (const catName of storeConfig.categorias) {
    const cat = await prisma.categoria.create({
      data: {
        nome: catName,
        ativo: true,
        empresaId: empresa.id,
      },
    });
    catMap.set(catName, cat);
  }

  // 3) Fornecedores da loja
  const supMap = new Map();
  for (const sup of storeConfig.fornecedores) {
    const createdSup = await prisma.fornecedor.create({
      data: {
        nome: sup.nome,
        email: sup.email,
        telefone: sup.telefone,
        endereco: sup.endereco,
        ativo: true,
        empresaId: empresa.id,
      },
    });
    supMap.set(sup.nome, createdSup);
  }

  // 4) Produtos da loja com imagens isoladas no Cloudinary
  const createdProducts = [];
  for (const p of storeConfig.produtos) {
    const imagem = p.imagePrefix
      ? await resolveSeedImage("produtos", p.imagePrefix, storeConfig.slug, `prod-${p.slugId}`)
      : null;

    const categoria = p.categoria ? catMap.get(p.categoria) : null;
    const fornecedor = p.fornecedor ? supMap.get(p.fornecedor) : null;
    const baseStock = p.baseStock ?? 100;

    const prod = await prisma.produto.create({
      data: {
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        quantidade: baseStock,
        ativo: p.ativo !== undefined ? p.ativo : true,
        imagem,
        empresaId: empresa.id,
        categoriaId: categoria ? categoria.id : null,
        fornecedorId: fornecedor ? fornecedor.id : null,
      },
    });
    createdProducts.push({ ...prod, baseStock });
  }
  console.log(`   📦 ${createdProducts.length} produtos criados para ${storeConfig.nome}`);

  // 5) Movimentações dos últimos 12 meses até o dia atual (garante relatórios 1m, 6m e 1y preenchidos)
  let userCursor = 0;
  function pickUser() {
    const u = activeUsers[userCursor % activeUsers.length];
    userCursor += 1;
    return u;
  }

  let orderCounter = empresa.id * 10000 + 1;

  for (let prodIdx = 0; prodIdx < createdProducts.length; prodIdx++) {
    const prod = createdProducts[prodIdx];
    let currentStock = prod.baseStock;
    let totalRep = 0;
    let totalVen = 0;
    const ops = [];

    // Produto inativo de demonstração recebe apenas 2 movimentações históricas antigas para provar Soft Delete
    if (!prod.ativo) {
      ops.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            empresaId: empresa.id,
            quantidade: 15,
            tipo: "REPOSICAO",
            usuarioId: pickUser().id,
            data: buildRelativeDate(4, 10, 9),
            observacao: "Lote inicial antes de descontinuação",
          },
        }),
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            empresaId: empresa.id,
            quantidade: 12,
            tipo: "VENDA",
            usuarioId: pickUser().id,
            data: buildRelativeDate(3, 18, 15),
            observacao: `Queima de estoque #${orderCounter++}`,
          },
        }),
        prisma.produto.update({
          where: { id: prod.id },
          data: { quantidade: Math.max(0, currentStock + 15 - 12) },
        })
      );
      await prisma.$transaction(ops);
      continue;
    }

    // Produtos ativos: movimentações ao longo dos últimos 12 meses (11 meses atrás até mês corrente 0)
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const repQty = Math.floor(Math.random() * 5) + 6; // 6 a 10
      const venQty1 = Math.floor(Math.random() * 4) + 4; // 4 a 7
      const venQty2 = Math.floor(Math.random() * 4) + 3; // 3 a 6

      totalRep += repQty;
      totalVen += venQty1 + venQty2;

      ops.push(
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            empresaId: empresa.id,
            quantidade: repQty,
            tipo: "REPOSICAO",
            usuarioId: pickUser().id,
            data: buildRelativeDate(monthsAgo, 4, 9),
            observacao: `Reposição mensal #${orderCounter++}`,
          },
        }),
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            empresaId: empresa.id,
            quantidade: venQty1,
            tipo: "VENDA",
            usuarioId: pickUser().id,
            data: buildRelativeDate(monthsAgo, 12, 14),
            observacao: `Venda balcão #${orderCounter++}`,
          },
        }),
        prisma.movimento.create({
          data: {
            produtoId: prod.id,
            empresaId: empresa.id,
            quantidade: venQty2,
            tipo: "VENDA",
            usuarioId: pickUser().id,
            data: buildRelativeDate(monthsAgo, 22, 16),
            observacao: `Venda online #${orderCounter++}`,
          },
        })
      );
    }

    const finalStock = Math.max(5, currentStock + totalRep - totalVen);
    ops.push(
      prisma.produto.update({
        where: { id: prod.id },
        data: { quantidade: finalStock },
      })
    );

    await prisma.$transaction(ops);
  }

  console.log(`   📊 Movimentações dos últimos 12 meses geradas com sucesso para ${storeConfig.nome}`);
}

// função principal que orquestra o seed de 2 estabelecimentos independentes (com e-mail compartilhado para demonstrar unicidade por loja)
async function main() {
  console.log("🔄 Iniciando seed multi-tenant (2 lojas com fotos e histórico)...");

  const passwordHash = await bcrypt.hash("Password123!", SALT_ROUNDS);

  const lojas = [
    {
      nome: "TechStock Matriz",
      slug: "techstock-matriz",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 3000-1001",
      usuarios: [
        { nome: "Lucas Silva", email: "lucas.admin@techstock.com", role: "ADMIN", avatarPrefix: "1780345070847", slugId: "lucas-admin" },
        { nome: "Maria Oliveira", email: "gestao@estoqueos.com", role: "GERENTE", avatarPrefix: "1760766985751", slugId: "maria-gerente" },
        { nome: "João Pereira", email: "joao.op@techstock.com", role: "OPERADOR", avatarPrefix: "1782851574852", slugId: "joao-op" },
        { nome: "Ana Costa", email: "ana.op@techstock.com", role: "OPERADOR", avatarPrefix: "1760766985751", slugId: "ana-op" },
        { nome: "Pedro Desligado", email: "pedro.ex@techstock.com", role: "OPERADOR", ativo: false, avatarPrefix: "1780345070847", slugId: "pedro-inativo" },
      ],
      categorias: ["Periféricos", "Monitores", "Cadeiras"],
      fornecedores: [
        { nome: "TechDistribuidora Ltda", email: "contato@techdist.com", telefone: "(11) 3333-1111", endereco: "Av. Tecnológica, 1000" },
        { nome: "Mundo dos Periféricos", email: "vendas@mperifericos.com", telefone: "(11) 3333-2222", endereco: "Rua Central, 200" },
        { nome: "ErgoMóveis SA", email: "suporte@ergomoveis.com", telefone: "(11) 3333-3333", endereco: "Av. Conforto, 55" },
      ],
      produtos: [
        { nome: "Mouse Gamer Logitech G502", descricao: "Mouse com sensor Hero 25K de alta precisão", preco: 279.9, categoria: "Periféricos", fornecedor: "TechDistribuidora Ltda", imagePrefix: "1760764515263", slugId: "mouse-g502", baseStock: 85 },
        { nome: "Teclado Mecânico Redragon K552", descricao: "Teclado compacto mecânico switch Outemu Blue", preco: 199.9, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos", imagePrefix: "1760764570683", slugId: "teclado-k552", baseStock: 72 },
        { nome: "Monitor 24\" Full HD Samsung", descricao: "Monitor IPS 24 polegadas 75Hz", preco: 899.0, categoria: "Monitores", fornecedor: "TechDistribuidora Ltda", imagePrefix: "1769021129540", slugId: "monitor-24", baseStock: 45 },
        { nome: "Cadeira Office Comfort", descricao: "Cadeira ergonômica com ajuste lombar e tela mesh", preco: 799.0, categoria: "Cadeiras", fornecedor: "ErgoMóveis SA", imagePrefix: "1760765007228", slugId: "cadeira-comfort", baseStock: 34 },
        { nome: "Mousepad XL HyperX Fury", descricao: "Mousepad estendido speed para setups gamers", preco: 89.9, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos", imagePrefix: "1760766700112", slugId: "mousepad-xl", baseStock: 120 },
        { nome: "Monitor 27\" QHD Dell UltraSharp", descricao: "Monitor profissional 27 polegadas QHD 99% sRGB", preco: 1799.0, categoria: "Monitores", fornecedor: "TechDistribuidora Ltda", imagePrefix: "1769021129540", slugId: "monitor-27", baseStock: 28 },
        { nome: "Adaptador Serial PS/2 Legado", descricao: "Item descontinuado mantido apenas para auditoria", preco: 29.9, categoria: "Periféricos", fornecedor: "Mundo dos Periféricos", imagePrefix: "1768960856511", slugId: "adaptador-legado", ativo: false, baseStock: 4 },
      ],
    },
    {
      nome: "MegaModa Express",
      slug: "megamoda-express",
      cnpj: "98.765.432/0001-10",
      telefone: "(21) 4000-2002",
      usuarios: [
        { nome: "Camila Ferreira", email: "camila.admin@megamoda.com", role: "ADMIN", avatarPrefix: "1780345070847", slugId: "camila-admin" },
        { nome: "Bruno Almeida", email: "gestao@estoqueos.com", role: "GERENTE", avatarPrefix: "1782851574852", slugId: "bruno-gerente" },
        { nome: "Rafael Souza", email: "rafael.op@megamoda.com", role: "OPERADOR", avatarPrefix: "1760766985751", slugId: "rafael-op" },
        { nome: "Juliana Lima", email: "juliana.op@megamoda.com", role: "OPERADOR", avatarPrefix: "1782851574852", slugId: "juliana-op" },
      ],
      categorias: ["Vestuário", "Calçados", "Acessórios"],
      fornecedores: [
        { nome: "Têxtil Sul Atacado", email: "pedidos@textilsul.com", telefone: "(47) 3200-4400", endereco: "Rod. BR-470, Km 12" },
        { nome: "Passo Forte Calçados", email: "comercial@passoforte.com", telefone: "(51) 3500-8800", endereco: "Av. das Indústrias, 890" },
      ],
      produtos: [
        { nome: "Jaqueta Corta-Vento Urban", descricao: "Tecido impermeável leve com capuz ajustável", preco: 229.9, categoria: "Vestuário", fornecedor: "Têxtil Sul Atacado", imagePrefix: "1769021129540", slugId: "jaqueta-urban", baseStock: 60 },
        { nome: "Tênis Running Pro Air", descricao: "Amortecimento EVA de alta densidade para corrida", preco: 389.9, categoria: "Calçados", fornecedor: "Passo Forte Calçados", imagePrefix: "1760766700112", slugId: "tenis-running", baseStock: 54 },
        { nome: "Camiseta Básica Algodão Pima", descricao: "Malha peruana penteada fio 40.1", preco: 99.9, categoria: "Vestuário", fornecedor: "Têxtil Sul Atacado", imagePrefix: "1760764570683", slugId: "camiseta-pima", baseStock: 140 },
        { nome: "Mochila Executiva Anti-Furto", descricao: "Compartimento acolchoado para notebook 15.6", preco: 189.0, categoria: "Acessórios", fornecedor: "Passo Forte Calçados", imagePrefix: "1760765007228", slugId: "mochila-exec", baseStock: 35 },
        { nome: "Bota Couro Adventure", descricao: "Solado tratorado em borracha vulcanizada", preco: 459.0, categoria: "Calçados", fornecedor: "Passo Forte Calçados", imagePrefix: "1760764515263", slugId: "bota-adventure", baseStock: 8 },
        { nome: "Coleção Inverno 2024 (Encerrada)", descricao: "SKU sazonal inativado após fim de temporada", preco: 159.0, categoria: "Vestuário", fornecedor: "Têxtil Sul Atacado", imagePrefix: "1768960856511", slugId: "colecao-inativa", ativo: false, baseStock: 2 },
      ],
    },
  ];

  for (const loja of lojas) {
    await seedStore(loja, passwordHash);
  }

  console.log("\n✅ Seed multi-tenant finalizado com sucesso!");
  console.log("🔑 Senha padrão de demonstração para todos os usuários: Password123!");
  console.log("💡 Teste e-mail único por loja usando: gestao@estoqueos.com (presente nas 2 lojas).");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
