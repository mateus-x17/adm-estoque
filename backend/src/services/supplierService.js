import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// serviço responsável por criar um novo fornecedor
// 1 - Desestrutura nome, email, telefone e endereco dos dados fornecidos
// 2 - Valida se o nome foi fornecido e é do tipo texto válido
// 3 - Retorna um erro 400 (Bad Request) caso a validação falhe
// 4 - Cria o fornecedor no banco de dados, aplicando trim() no nome
export async function createSupplier(data) {
  const { nome, email, telefone, endereco } = data;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de fornecedor é obrigatório', 400);
  }

  return prisma.fornecedor.create({
    data: { nome: nome.trim(), email, telefone, endereco }
  });
}

// serviço responsável por listar todos os fornecedores
// 1 - Executa a função findMany do Prisma na tabela fornecedor
// 2 - Retorna o array de fornecedores obtido
export async function listSuppliers() {
  return prisma.fornecedor.findMany();
}

// serviço responsável por atualizar os dados de um fornecedor
// 1 - Desestrutura os campos do fornecedor
// 2 - Busca o fornecedor pelo ID (convertido para inteiro) para checar a existência
// 3 - Se não encontrar, lança o erro 404
// 4 - Atualiza os campos fornecidos, garantindo que o nome, se vier, passe pelo trim()
export async function updateSupplier(id, data) {
  const { nome, email, telefone, endereco } = data;

  const supplier = await prisma.fornecedor.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: { nome: nome ? nome.trim() : undefined, email, telefone, endereco }
  });
}

// serviço responsável por deletar um fornecedor
// 1 - Busca o fornecedor no banco com base no ID passado
// 2 - Lança um erro 404 caso não o encontre
// 3 - Remove o registro do fornecedor do banco
export async function deleteSupplier(id) {
  const supplier = await prisma.fornecedor.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) throw new AppError('Fornecedor não encontrado', 404);

  return prisma.fornecedor.delete({ where: { id: parseInt(id) } });
}

// serviço responsável pela contagem de fornecedores
// 1 - Chama o método count() na entidade fornecedor
// 2 - Retorna a quantidade numérica exata de registros
export async function countSuppliers() {
  return prisma.fornecedor.count();
}

// serviço responsável por levantar a estatística de fluxo por fornecedor
// 1 - Busca todos os fornecedores e usa Include aninhado para trazer também os produtos e as movimentações atreladas a cada um
// 2 - Faz um map() para iterar cada fornecedor, inicializando acumuladores de entradas e saídas
// 3 - Percorre a lista de produtos daquele fornecedor e soma os dados de cada movimento
// 4 - Mantém um dicionário interno para armazenar o quantitativo movimentado por produto específico
// 5 - Identifica qual foi o produto mais movimentado usando a contagem no dicionário
// 6 - Retorna os objetos moldados prontos para os gráficos e tabelas do frontend
export async function getSupplierStats() {
  const suppliers = await prisma.fornecedor.findMany({
    include: { produtos: { include: { movimentos: true } } }
  });

  return suppliers.map((sup) => {
    let totalReposicoes = 0;
    let totalVendas = 0;
    const productMovements = {};

    sup.produtos.forEach((prod) => {
      prod.movimentos.forEach((mov) => {
        if (mov.tipo === 'REPOSICAO' || mov.tipo === 'ENTRADA') totalReposicoes += mov.quantidade;
        else totalVendas += mov.quantidade;

        if (!productMovements[prod.nome]) productMovements[prod.nome] = 0;
        productMovements[prod.nome] += mov.quantidade;
      });
    });

    let topProduct = null;
    let maxMov = 0;
    for (const [prodName, qtd] of Object.entries(productMovements)) {
      if (qtd > maxMov) {
        maxMov = qtd;
        topProduct = prodName;
      }
    }

    return {
      id: sup.id,
      nome: sup.nome,
      totalReposicoes,
      totalVendas,
      totalEntradas: totalReposicoes,
      totalSaidas: totalVendas,
      totalMovimentacoes: totalReposicoes + totalVendas,
      produtoMaisMovimentado: topProduct || 'Nenhum'
    };
  });
}
