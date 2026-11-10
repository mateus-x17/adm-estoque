// arquivo responsável pelo seed realista multi-organização e multi-loja (Grupo TechStock Varejo + CyberForge Geek Store),
// incluindo pedidos multi-item em 12 meses, estorno, Soft Delete de catálogo e demonstração real de usuário excluído preservando antigo ID
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/config/prismaClient.js";
import cloudinary, { getTenantFolder } from "../src/config/cloudinaryConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.resolve(__dirname, "../uploads");
const SALT_ROUNDS = 10;

// função auxiliar para localizar arquivo local na pasta uploads pelo prefixo
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

// função auxiliar para enviar mídias do seed para a pasta dedicada da Organização/Loja no Cloudinary
async function resolveSeedImage(subfolder, filePrefix, orgSlug, lojaSlug, publicId) {
  const asset = findLocalUploadAsset(subfolder, filePrefix);
  if (!asset) return null;

  const hasCloudinary =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!hasCloudinary) return asset.relativeUrl;

  try {
    const folder = getTenantFolder(orgSlug, lojaSlug, subfolder);
    const result = await cloudinary.uploader.upload(asset.fullPath, {
      folder,
      public_id: publicId,
      overwrite: true,
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`⚠️ Falha no upload Cloudinary (${publicId}), usando local:`, err.message);
    return asset.relativeUrl;
  }
}

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
    return new Date(now.getTime() - (Math.floor(Math.random() * 48) + 2) * 60 * 60 * 1000);
  }
  return target;
}

const CLIENT_NAMES = [
  "Cliente Balcão",
  "Mariana Costa",
  "TechEdu Escola",
  "Gabriel Henrique",
  "Studio Criativo Alpha",
  "Fernanda Nunes",
  "Pedro Henrique Silva",
  "Escritório Paulista",
];

// função auxiliar para criar pedido multi-item completo com ItemPedido e espelho em Movimento
async function createSeedOrder({
  codigo,
  tipo,
  status = "CONCLUIDO",
  organizacaoId,
  lojaId,
  vendedor,
  fornecedorId = null,
  clienteNome = null,
  formaPagamento = "PIX",
  statusPagamento = "PAGO",
  comprovanteCodigo = null,
  recebidoPor = null,
  observacao = null,
  createdAt,
  items,
  canceladoPor = null,
}) {
  let valorTotal = 0;
  const itemRows = items.map((i) => {
    const unit = Number(i.preco);
    const sub = Number((unit * i.quantidade).toFixed(2));
    valorTotal += sub;
    return {
      produtoId: i.id,
      produtoNomeSnapshot: i.nome,
      quantidade: i.quantidade,
      precoUnitario: unit,
      subtotal: sub,
    };
  });
  valorTotal = Number(valorTotal.toFixed(2));

  const pedido = await prisma.pedido.create({
    data: {
      codigo,
      tipo,
      status,
      valorTotal,
      formaPagamento,
      statusPagamento: status === "CANCELADO" ? "ESTORNADO" : statusPagamento,
      comprovanteCodigo: comprovanteCodigo || `COMP-${codigo}`,
      recebidoPor: recebidoPor || clienteNome || vendedor.nome,
      observacao,
      clienteNome,
      fornecedorId,
      organizacaoId,
      lojaId,
      usuarioId: vendedor.id,
      vendedorRefId: vendedor.id,
      vendedorNomeSnapshot: vendedor.nome,
      vendedorEmailSnapshot: vendedor.email,
      canceladoPorRefId: status === "CANCELADO" ? canceladoPor?.id || vendedor.id : null,
      canceladoPorNome: status === "CANCELADO" ? canceladoPor?.nome || vendedor.nome : null,
      canceladoEm: status === "CANCELADO" ? new Date(createdAt.getTime() + 3600 * 1000) : null,
      motivoCancelamento:
        status === "CANCELADO" ? "Desistência do cliente no balcão (estorno automático)" : null,
      createdAt,
      updatedAt: createdAt,
      itens: {
        create: itemRows,
      },
    },
  });

  // Registra os movimentos originais no livro-razão
  const movData = items.map((i) => ({
    produtoId: i.id,
    quantidade: i.quantidade,
    tipo,
    precoUnitario: Number(i.preco),
    valorTotal: Number((Number(i.preco) * i.quantidade).toFixed(2)),
    estorno: false,
    pedidoId: pedido.id,
    usuarioId: vendedor.id,
    vendedorRefId: vendedor.id,
    vendedorNomeSnapshot: vendedor.nome,
    vendedorEmailSnapshot: vendedor.email,
    organizacaoId,
    lojaId,
    data: createdAt,
    observacao: `${tipo === "VENDA" ? "Venda" : "Reposição"} ${codigo}`,
  }));

  // Se o pedido foi cancelado, registra também os movimentos inversos de estorno
  if (status === "CANCELADO") {
    const reverseTipo = tipo === "VENDA" ? "REPOSICAO" : "VENDA";
    for (const i of items) {
      movData.push({
        produtoId: i.id,
        quantidade: i.quantidade,
        tipo: reverseTipo,
        precoUnitario: Number(i.preco),
        valorTotal: Number((Number(i.preco) * i.quantidade).toFixed(2)),
        estorno: true,
        pedidoId: pedido.id,
        usuarioId: canceladoPor?.id || vendedor.id,
        vendedorRefId: canceladoPor?.id || vendedor.id,
        vendedorNomeSnapshot: canceladoPor?.nome || vendedor.nome,
        vendedorEmailSnapshot: canceladoPor?.email || vendedor.email,
        organizacaoId,
        lojaId,
        data: new Date(createdAt.getTime() + 3600 * 1000),
        observacao: `Estorno por cancelamento do ${codigo}`,
      });
    }
  }

  await prisma.movimento.createMany({ data: movData });
  return pedido;
}

// função para popular uma Organização completa com suas Lojas, Equipes, Catálogo e 12 meses de Pedidos
async function seedOrganization(orgConfig, passwordHash) {
  console.log(`\n🏢 Criando Organização: ${orgConfig.nome} (${orgConfig.slug})...`);

  const organizacao = await prisma.organizacao.create({
    data: {
      nome: orgConfig.nome,
      slug: orgConfig.slug,
      cnpj: orgConfig.cnpj,
      telefone: orgConfig.telefone,
      ativo: true,
    },
  });

  // 1) Administrador global da Organização
  const adminAvatar = await resolveSeedImage(
    "usuarios",
    orgConfig.admin.avatarPrefix,
    orgConfig.slug,
    "corporativo",
    `avatar-${orgConfig.admin.slugId}`
  );
  const adminUser = await prisma.usuario.create({
    data: {
      nome: orgConfig.admin.nome,
      email: orgConfig.admin.email.toLowerCase(),
      senha: passwordHash,
      role: "ADMIN",
      imagem: adminAvatar,
      organizacaoId: organizacao.id,
      lojaId: null,
    },
  });
  console.log(`   👑 [ADMIN] ${adminUser.nome} (${adminUser.email}) — acesso a todas as lojas`);

  let orderSequence = organizacao.id * 1000;

  // 2) Lojas / Filiais da Organização
  for (const lojaCfg of orgConfig.lojas) {
    console.log(`   🏪 Loja: ${lojaCfg.nome} (${lojaCfg.slug})...`);
    const loja = await prisma.loja.create({
      data: {
        nome: lojaCfg.nome,
        slug: lojaCfg.slug,
        cnpj: lojaCfg.cnpj,
        telefone: lojaCfg.telefone,
        endereco: lojaCfg.endereco,
        ativo: true,
        organizacaoId: organizacao.id,
      },
    });

    // Equipe da loja (Gerente, Operadores e eventual ex-funcionário temporário para histórico)
    const weightedSellers = [];
    const temporaryUsersToDelete = [];
    let storeManager = adminUser;

    for (const u of lojaCfg.usuarios) {
      const avatar = await resolveSeedImage(
        "usuarios",
        u.avatarPrefix,
        orgConfig.slug,
        lojaCfg.slug,
        `avatar-${u.slugId}`
      );
      const createdUser = await prisma.usuario.create({
        data: {
          nome: u.nome,
          email: u.email.toLowerCase(),
          senha: passwordHash,
          role: u.role,
          imagem: avatar,
          organizacaoId: organizacao.id,
          lojaId: loja.id,
        },
      });

      if (u.role === "GERENTE") storeManager = createdUser;

      const weight = u.salesWeight || 1;
      for (let w = 0; w < weight; w++) {
        weightedSellers.push({ user: createdUser, isEx: Boolean(u.deleteAfterSeed) });
      }

      if (u.deleteAfterSeed) {
        temporaryUsersToDelete.push(createdUser);
      } else {
        console.log(`      👤 [${createdUser.role}] ${createdUser.nome} (${createdUser.email})`);
      }
    }

    // Categorias da loja
    const categoryMap = new Map();
    for (const catName of lojaCfg.categorias) {
      const cat = await prisma.categoria.create({
        data: {
          nome: catName,
          ativo: true,
          organizacaoId: organizacao.id,
          lojaId: loja.id,
        },
      });
      categoryMap.set(catName, cat.id);
    }

    // Fornecedores da loja
    const supplierList = [];
    const supplierMap = new Map();
    for (const sup of lojaCfg.fornecedores) {
      const createdSup = await prisma.fornecedor.create({
        data: {
          nome: sup.nome,
          email: sup.email,
          telefone: sup.telefone,
          endereco: sup.endereco,
          ativo: sup.ativo !== undefined ? sup.ativo : true,
          organizacaoId: organizacao.id,
          lojaId: loja.id,
        },
      });
      supplierMap.set(sup.nome, createdSup.id);
      if (createdSup.ativo) supplierList.push(createdSup);
    }

    // Produtos da loja com upload isolado
    const activeProducts = [];
    const inactiveProducts = [];

    const imageEntries = await Promise.all(
      lojaCfg.produtos.map((p) =>
        resolveSeedImage("produtos", p.imagePrefix, orgConfig.slug, lojaCfg.slug, p.slugId)
      )
    );

    for (let i = 0; i < lojaCfg.produtos.length; i++) {
      const prodCfg = lojaCfg.produtos[i];
      const createdProd = await prisma.produto.create({
        data: {
          nome: prodCfg.nome,
          descricao: prodCfg.descricao,
          preco: prodCfg.preco,
          quantidade: prodCfg.stockFinal,
          imagem: imageEntries[i],
          ativo: prodCfg.ativo !== undefined ? prodCfg.ativo : true,
          organizacaoId: organizacao.id,
          lojaId: loja.id,
          categoriaId: categoryMap.get(prodCfg.categoria) || null,
          fornecedorId: supplierMap.get(prodCfg.fornecedor) || null,
        },
      });
      if (createdProd.ativo) activeProducts.push(createdProd);
      else inactiveProducts.push(createdProd);
    }

    // Pedido histórico para produto inativo (comprovando preservação de catálogo/Soft Delete)
    for (const inact of inactiveProducts) {
      orderSequence += 1;
      await createSeedOrder({
        codigo: `PED-${String(orderSequence).padStart(4, "0")}`,
        tipo: "VENDA",
        status: "CONCLUIDO",
        organizacaoId: organizacao.id,
        lojaId: loja.id,
        vendedor: storeManager,
        clienteNome: "Queima de Estoque Legado",
        observacao: "Liquidação antes da descontinuação do SKU",
        createdAt: buildRelativeDate(4, 15, 14),
        items: [{ id: inact.id, nome: inact.nome, preco: inact.preco, quantidade: 6 }],
      });
    }

    // Gera histórico realista de Pedidos Multi-Item ao longo dos últimos 12 meses
    const activeNonDeletedSellers = weightedSellers.filter((w) => !w.isEx);
    let sellerCursor = 0;

    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      // 1 compra de reposição multi-item com fornecedor no mês
      orderSequence += 1;
      const sup = supplierList[monthsAgo % supplierList.length];
      const repItems = activeProducts.slice(0, Math.min(3, activeProducts.length)).map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: p.preco,
        quantidade: 6 + ((monthsAgo + p.id) % 6),
      }));

      await createSeedOrder({
        codigo: `PED-${String(orderSequence).padStart(4, "0")}`,
        tipo: "REPOSICAO",
        status: "CONCLUIDO",
        organizacaoId: organizacao.id,
        lojaId: loja.id,
        vendedor: storeManager,
        fornecedorId: sup?.id || null,
        observacao: `Reposição mensal ${sup?.nome || ""}`.trim(),
        createdAt: buildRelativeDate(monthsAgo, 4, 9),
        items: repItems,
      });

      // 3 a 4 pedidos de venda multi-item por mês (garantindo densidade no mês atual '0' e semestre '0..5')
      const salesInMonth = monthsAgo === 0 ? 5 : monthsAgo <= 5 ? 4 : 3;
      for (let s = 0; s < salesInMonth; s++) {
        orderSequence += 1;
        const picked = activeNonDeletedSellers[sellerCursor % activeNonDeletedSellers.length];
        sellerCursor += 1;

        const itemCount = 2 + ((s + monthsAgo) % 2); // 2 ou 3 itens por pedido
        const startIdx = (s + monthsAgo) % activeProducts.length;
        const chosenItems = [];
        for (let k = 0; k < Math.min(itemCount, activeProducts.length); k++) {
          const p = activeProducts[(startIdx + k) % activeProducts.length];
          chosenItems.push({
            id: p.id,
            nome: p.nome,
            preco: p.preco,
            quantidade: 1 + ((s + k) % 3),
          });
        }

        const isCancelDemo = monthsAgo === 0 && s === 1;
        const paymentMethods = ["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "DINHEIRO", "TRANSFERENCIA"];
        const chosenMethod = paymentMethods[(orderSequence + s) % paymentMethods.length];
        await createSeedOrder({
          codigo: `PED-${String(orderSequence).padStart(4, "0")}`,
          tipo: "VENDA",
          status: isCancelDemo ? "CANCELADO" : "CONCLUIDO",
          organizacaoId: organizacao.id,
          lojaId: loja.id,
          vendedor: picked.user,
          clienteNome: CLIENT_NAMES[(orderSequence + s) % CLIENT_NAMES.length],
          formaPagamento: chosenMethod,
          statusPagamento: isCancelDemo ? "ESTORNADO" : "PAGO",
          comprovanteCodigo:
            chosenMethod === "PIX"
              ? `E2E-${orderSequence}99BR`
              : chosenMethod.startsWith("CARTAO")
              ? `NSU-${10000 + orderSequence}`
              : `REC-${orderSequence}`,
          recebidoPor: CLIENT_NAMES[(orderSequence + s) % CLIENT_NAMES.length],
          observacao: s % 2 === 0 ? "Venda presencial balcão" : "Pedido loja digital",
          createdAt: buildRelativeDate(monthsAgo, Math.min(27, 6 + s * 5), 11 + s),
          items: chosenItems,
          canceladoPor: storeManager,
        });
      }
    }

    // Gera pedidos históricos para o ex-funcionário e depois o EXCLUI fisicamente mantendo vendedorRefId
    for (const deletedCandidate of temporaryUsersToDelete) {
      for (const mAgo of [5, 3, 2, 0]) {
        orderSequence += 1;
        const p1 = activeProducts[0];
        const p2 = activeProducts[1 % activeProducts.length];
        await createSeedOrder({
          codigo: `PED-${String(orderSequence).padStart(4, "0")}`,
          tipo: "VENDA",
          status: "CONCLUIDO",
          organizacaoId: organizacao.id,
          lojaId: loja.id,
          vendedor: deletedCandidate,
          clienteNome: "Atendimento Ex-Colaborador",
          observacao: "Venda histórica antes do desligamento",
          createdAt: buildRelativeDate(mAgo, 10, 15),
          items: [
            { id: p1.id, nome: p1.nome, preco: p1.preco, quantidade: 2 },
            { id: p2.id, nome: p2.nome, preco: p2.preco, quantidade: 1 },
          ],
        });
      }

      // Exclusão física real na tabela Usuario (FK SetNull desvincula mantendo vendedorRefId e snapshots!)
      await prisma.usuario.delete({ where: { id: deletedCandidate.id } });
      console.log(
        `      🧾 [AUDITORIA] Ex-funcionário "${deletedCandidate.nome}" (ID antigo #${deletedCandidate.id}) teve conta excluída fisicamente preservando vendas.`
      );
    }
  }
}

async function main() {
  console.log("🔄 Iniciando seed Multi-Organização, Multi-Loja e Multipedidos...");

  const passwordHash = await bcrypt.hash("Password123!", SALT_ROUNDS);

  const organizations = [
    {
      nome: "Grupo TechStock Varejo",
      slug: "grupo-techstock",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 3000-1000",
      admin: {
        nome: "Lucas Silva",
        email: "admin@techstock.com",
        avatarPrefix: "1780345070847",
        slugId: "lucas-admin",
      },
      lojas: [
        {
          nome: "TechStock Centro",
          slug: "techstock-centro",
          cnpj: "12.345.678/0002-71",
          telefone: "(11) 3000-1001",
          endereco: "Av. Paulista, 1450 - Centro, São Paulo/SP",
          usuarios: [
            { nome: "Fernanda Lima", email: "gerente1@techstock.com", role: "GERENTE", avatarPrefix: "1760766985751", slugId: "fernanda-ger1", salesWeight: 1 },
            { nome: "Rafael Mendes", email: "op1@techstock.com", role: "OPERADOR", avatarPrefix: "1782851574852", slugId: "rafael-op1", salesWeight: 5 },
            { nome: "Beatriz Duarte", email: "op2@techstock.com", role: "OPERADOR", avatarPrefix: "1760766985751", slugId: "beatriz-op2", salesWeight: 2 },
            { nome: "Marcos Antunes", email: "marcos.ex@techstock.com", role: "OPERADOR", avatarPrefix: "1780345070847", slugId: "marcos-ex", deleteAfterSeed: true },
          ],
          categorias: ["Periféricos", "Monitores", "Mobiliário Gamer", "Áudio"],
          fornecedores: [
            { nome: "LogiSupply Distribuidora", email: "pedidos@logisupply.com", telefone: "(11) 3333-1111", endereco: "Av. Industrial, 800" },
            { nome: "MegaHardware Atacado", email: "comercial@megahw.com", telefone: "(11) 3333-2222", endereco: "Rua Santa Ifigênia, 420" },
            { nome: "ErgoTech Brasil", email: "suporte@ergotech.com", telefone: "(11) 3333-3333", endereco: "Av. Conforto, 55" },
            { nome: "Alpha Importações Legado", email: "contato@alphalegado.com", telefone: "(11) 3111-9090", endereco: "Galpão Antigo 04 - Brás", ativo: false },
          ],
          produtos: [
            { nome: "Mouse Gamer Logitech G502", descricao: "Sensor Hero 25K DPI com pesos ajustáveis", preco: 289.9, categoria: "Periféricos", fornecedor: "LogiSupply Distribuidora", imagePrefix: "1760764515263", slugId: "mouse-g502", stockFinal: 64 },
            { nome: "Teclado Mecânico Redragon K552", descricao: "Switch Outemu Blue layout ABNT2 LED RGB", preco: 219.9, categoria: "Periféricos", fornecedor: "MegaHardware Atacado", imagePrefix: "1760764570683", slugId: "teclado-k552", stockFinal: 48 },
            { nome: "Monitor 24\" Full HD IPS 144Hz", descricao: "Painel IPS borda ultrafina 1ms FreeSync", preco: 899.0, categoria: "Monitores", fornecedor: "MegaHardware Atacado", imagePrefix: "1769021129540", slugId: "monitor-24", stockFinal: 26 },
            { nome: "Cadeira Ergonômica Comfort Mesh", descricao: "Apoio lombar dinâmico e pistão classe 4", preco: 849.0, categoria: "Mobiliário Gamer", fornecedor: "ErgoTech Brasil", imagePrefix: "1760765007228", slugId: "cadeira-mesh", stockFinal: 19 },
            { nome: "Mousepad XL Speed Control", descricao: "Base emborrachada 90x40cm costura reforçada", preco: 89.9, categoria: "Periféricos", fornecedor: "LogiSupply Distribuidora", imagePrefix: "1760766700112", slugId: "mousepad-xl", stockFinal: 95 },
            { nome: "Headset Gamer Surround 7.1", descricao: "Drivers 50mm e microfone removível noise-cancel", preco: 349.9, categoria: "Áudio", fornecedor: "LogiSupply Distribuidora", imagePrefix: "1768960856511", slugId: "headset-71", stockFinal: 7 },
            { nome: "Cabo VGA Analógico Legado", descricao: "Item descontinuado mantido para auditoria fiscal", preco: 24.9, categoria: "Periféricos", fornecedor: "MegaHardware Atacado", imagePrefix: "1768960856511", slugId: "cabo-vga-inativo", ativo: false, stockFinal: 2 },
          ],
        },
        {
          nome: "TechStock Shopping",
          slug: "techstock-shopping",
          cnpj: "12.345.678/0003-52",
          telefone: "(11) 3000-1002",
          endereco: "Shopping Eldorado, Piso 2 - Pinheiros, São Paulo/SP",
          usuarios: [
            { nome: "Thiago Azevedo", email: "gerente2@techstock.com", role: "GERENTE", avatarPrefix: "1782851574852", slugId: "thiago-ger2", salesWeight: 1 },
            { nome: "Camila Rocha", email: "op3@techstock.com", role: "OPERADOR", avatarPrefix: "1760766985751", slugId: "camila-op3", salesWeight: 4 },
            { nome: "Diego Martins", email: "op4@techstock.com", role: "OPERADOR", avatarPrefix: "1780345070847", slugId: "diego-op4", salesWeight: 2 },
          ],
          categorias: ["Monitores & Displays", "Periféricos Wireless", "Acessórios Pro"],
          fornecedores: [
            { nome: "InfoSul Importadora", email: "vendas@infosul.com", telefone: "(41) 3200-4400", endereco: "Curitiba/PR" },
            { nome: "PowerCharge Tech", email: "atendimento@powercharge.com", telefone: "(11) 3500-8800", endereco: "Barueri/SP" },
            { nome: "Nexus Cabo & Cia (Desativada)", email: "arquivo@nexuscabo.com", telefone: "(11) 3200-0099", endereco: "Santo Amaro, SP", ativo: false },
          ],
          produtos: [
            { nome: "Monitor 27\" QHD Dell UltraSharp", descricao: "Resolução 2K IPS 99% sRGB USB-C Hub", preco: 1849.0, categoria: "Monitores & Displays", fornecedor: "InfoSul Importadora", imagePrefix: "1769021129540", slugId: "monitor-27-qhd", stockFinal: 16 },
            { nome: "Teclado Wireless Slim Keychron", descricao: "Conexão Bluetooth multi-dispositivo alumínio", preco: 459.9, categoria: "Periféricos Wireless", fornecedor: "InfoSul Importadora", imagePrefix: "1760764570683", slugId: "teclado-slim", stockFinal: 34 },
            { nome: "Mouse Vertical Ergonômico Pro", descricao: "Design vertical anti-LER bateria recarregável", preco: 179.9, categoria: "Periféricos Wireless", fornecedor: "PowerCharge Tech", imagePrefix: "1760764515263", slugId: "mouse-vertical", stockFinal: 42 },
            { nome: "Suporte Articulado Pistão a Gás", descricao: "Para monitores de 17 a 32 polegadas VESA", preco: 269.0, categoria: "Acessórios Pro", fornecedor: "PowerCharge Tech", imagePrefix: "1760765007228", slugId: "suporte-gas", stockFinal: 8 },
            { nome: "Desk Mat Couro Sintético Premium", descricao: "Tapete executivo impermeável dupla face", preco: 119.9, categoria: "Acessórios Pro", fornecedor: "PowerCharge Tech", imagePrefix: "1760766700112", slugId: "deskmat-pro", stockFinal: 55 },
            { nome: "Hub USB 2.0 Antigo", descricao: "Modelo obsoleto substituído por linha USB-C", preco: 39.9, categoria: "Acessórios Pro", fornecedor: "PowerCharge Tech", imagePrefix: "1768960856511", slugId: "hub-legado", ativo: false, stockFinal: 3 },
          ],
        },
      ],
    },
    {
      nome: "CyberForge Geek Store",
      slug: "cyberforge-geek",
      cnpj: "98.765.432/0001-10",
      telefone: "(21) 4000-4242",
      admin: {
        nome: "Lucas Stark",
        email: "admin@cyberforge.com",
        avatarPrefix: "1780345070847",
        slugId: "stark-admin",
      },
      lojas: [
        {
          nome: "CyberForge Matriz",
          slug: "cyberforge-matriz",
          cnpj: "98.765.432/0002-01",
          telefone: "(21) 4000-4243",
          endereco: "Av. Rio Branco, 310 - Centro, Rio de Janeiro/RJ",
          usuarios: [
            { nome: "Marina Sato", email: "gerente1@cyberforge.com", role: "GERENTE", avatarPrefix: "1760766985751", slugId: "marina-ger1", salesWeight: 1 },
            { nome: "Bruno Wayne", email: "op1@cyberforge.com", role: "OPERADOR", avatarPrefix: "1782851574852", slugId: "bruno-op1", salesWeight: 4 },
            { nome: "Sofia Banner", email: "op2@cyberforge.com", role: "OPERADOR", avatarPrefix: "1760766985751", slugId: "sofia-op2", salesWeight: 2 },
          ],
          categorias: ["Setup Geek", "Colecionáveis", "Iluminação & Decoração", "Vestuário Nerd"],
          fornecedores: [
            { nome: "Akihabara Imports", email: "contato@akihabara.com", telefone: "(11) 3900-1122", endereco: "Liberdade, São Paulo/SP" },
            { nome: "Multiverso Colecionáveis", email: "atacado@multiverso.com", telefone: "(21) 3100-7788", endereco: "Botafogo, Rio de Janeiro/RJ" },
            { nome: "PixelBox Encerrada", email: "legado@pixelbox.com", telefone: "(21) 3999-0011", endereco: "São Cristóvão, RJ", ativo: false },
          ],
          produtos: [
            { nome: "Teclado Custom Mech 75% Neon", descricao: "Hot-swappable com keycaps PBT tema Cyberpunk", preco: 429.9, categoria: "Setup Geek", fornecedor: "Akihabara Imports", imagePrefix: "1760764570683", slugId: "teclado-cyber", stockFinal: 31 },
            { nome: "Mouse Wireless Samurai Edition", descricao: "Ultra-leve 54g sensor PAW3395 edição especial", preco: 349.9, categoria: "Setup Geek", fornecedor: "Akihabara Imports", imagePrefix: "1760764515263", slugId: "mouse-samurai", stockFinal: 27 },
            { nome: "Action Figure Mecha Knight 22cm", descricao: "Estátua colecionável articulada em PVC/ABS", preco: 549.0, categoria: "Colecionáveis", fornecedor: "Multiverso Colecionáveis", imagePrefix: "1760765007228", slugId: "figure-mecha", stockFinal: 14 },
            { nome: "Luminária LED Matrix Pixel Art", descricao: "Painel programável via app para setup gamer", preco: 279.0, categoria: "Iluminação & Decoração", fornecedor: "Akihabara Imports", imagePrefix: "1769021129540", slugId: "luminaria-pixel", stockFinal: 22 },
            { nome: "Deskmat XXL Constellation Retro", descricao: "Tapete temático de galáxia retro 900x400mm", preco: 129.9, categoria: "Setup Geek", fornecedor: "Multiverso Colecionáveis", imagePrefix: "1760766700112", slugId: "deskmat-retro", stockFinal: 48 },
            { nome: "Headset Cosplay CyberCat RGB", descricao: "Áudio Hi-Fi Bluetooth com orelhas removíveis", preco: 319.0, categoria: "Setup Geek", fornecedor: "Akihabara Imports", imagePrefix: "1768960856511", slugId: "headset-cyber", stockFinal: 6 },
            { nome: "Box Edição Limitada Convenção 2024", descricao: "Tiragem encerrada pós-evento", preco: 299.0, categoria: "Colecionáveis", fornecedor: "Multiverso Colecionáveis", imagePrefix: "1768960856511", slugId: "box-encerrado", ativo: false, stockFinal: 1 },
          ],
        },
      ],
    },
  ];

  for (const org of organizations) {
    await seedOrganization(org, passwordHash);
  }

  console.log("\n✅ Seed Multi-Organização, Multi-Loja e Multipedidos concluído com sucesso!");
  console.log("🔑 Senha única padrão: Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
