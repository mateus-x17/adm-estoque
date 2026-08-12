import { prisma } from "../config/prismaClient.js";
import { childLogger } from '../config/logger.js';
const log = childLogger('supplierController');

// função para criar um novo fornecedor
// 1 - Extrai nome, email, telefone e endereco do corpo da requisição
// 2 - Valida se o nome foi fornecido (retorna 400 se não)
// 3 - Usa o Prisma para criar o registro de fornecedor no banco
// 4 - Grava no log de sistema a ação e retorna os dados
export async function criarFornecedor(req, res, next) {
  try {
    const { nome, email, telefone, endereco } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const fornecedor = await prisma.fornecedor.create({ data: { nome, email, telefone, endereco  } });
    log.info({ user: req.user?.id, action: 'CREATE_SUPPLIER', targetId: fornecedor.id }, 'User created a supplier');
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error creating supplier');
    next(err);
  }
}

// função para listar todos os fornecedores
// 1 - Faz a busca via prisma.fornecedor.findMany
// 2 - Retorna a lista encapsulada em um objeto JSON
export async function listarFornecedores(req, res, next) {
  try {
    const fornecedores = await prisma.fornecedor.findMany();
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, 'Error listing suppliers');
    next(err);
  }
}

// função para contar a quantidade total de fornecedores
// 1 - Pede ao Prisma a contagem e retorna
export async function countFornecedores(req, res, next) {
  try {
    const count = await prisma.fornecedor.count();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting suppliers');
    next(err);
  }
}

// função para atualizar dados de um fornecedor
// 1 - Obtém o ID via params e os dados via body
// 2 - Pede ao Prisma para atualizar o registro baseando-se no ID (convertido para inteiro)
// 3 - Registra ação no log e retorna o objeto novo
export async function atualizarFornecedor(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, endereco } = req.body;

    const fornecedor = await prisma.fornecedor.update({ where: { id: parseInt(id) }, data: { nome, email, telefone, endereco } });
    log.info({ user: req.user?.id, action: 'UPDATE_SUPPLIER', targetId: fornecedor.id }, 'User updated a supplier');
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error updating supplier');
    next(err);
  }
}

// função para deletar um fornecedor
// 1 - Obtém o ID via params e manda o Prisma deletar o registro correspondente
// 2 - Retorna uma mensagem de sucesso
export async function deletarFornecedor(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.fornecedor.delete({ where: { id: parseInt(id) } });
    log.info({ user: req.user?.id, action: 'DELETE_SUPPLIER', targetId: id }, 'User deleted a supplier');
    res.json({ message: "Fornecedor deletado com sucesso" });
  } catch (err) {
    log.error({ err }, 'Error deleting supplier');
    next(err);
  }
}

// função para gerar estatísticas agregadas por fornecedor
// 1 - Busca no Prisma todos os fornecedores, trazendo junto a eles (include) seus produtos e os respectivos movimentos de estoque (include triplo)
// 2 - Mapeia (map) cada fornecedor processando seus movimentos
// 3 - Soma manualmente as variáveis "totalEntradas" e "totalSaidas" de acordo com o tipo do movimento iterado
// 4 - Adiciona as quantidades ao "productMovements" (um dicionário) para encontrar qual produto gerou maior movimentação global
// 5 - Retorna o array processado contendo os totais de cada fornecedor e o nome do seu produto campeão
export async function getSupplierStats(req, res, next) {
  try {
    // carrega árvore de dependências aninhadas: fornecedores -> seus produtos -> movimentos desses produtos (Join automático gerado pelo ORM)
    const suppliers = await prisma.fornecedor.findMany({ include: { produtos: { include: { movimentos: true } } } });

    const stats = suppliers.map((sup) => {
      let totalEntradas = 0;
      let totalSaidas = 0;
      const productMovements = {};

      sup.produtos.forEach((prod) => {
        prod.movimentos.forEach((mov) => {
          if (mov.tipo === "ENTRADA") totalEntradas += mov.quantidade;
          else totalSaidas += mov.quantidade;

          if (!productMovements[prod.nome]) productMovements[prod.nome] = 0;
          productMovements[prod.nome] += mov.quantidade; // acumula quantitativo para o produto atual
        });
      });

      // calcula qual foi o produto mais movimentado iterando sobre o objeto dictionary gerado no passo acima
      let topProduct = null;
      let maxMov = 0;
      for (const [prodName, qtd] of Object.entries(productMovements)) {
        if (qtd > maxMov) { maxMov = qtd; topProduct = prodName; }
      }

      return {
        id: sup.id,
        nome: sup.nome,
        totalEntradas,
        totalSaidas,
        totalMovimentacoes: totalEntradas + totalSaidas,
        produtoMaisMovimentado: topProduct || "Nenhum",
      };
    });

    res.json(stats);
  } catch (err) {
    log.error({ err }, 'Error getting supplier stats');
    next(err);
  }
}

// função para recuperar dados singulares de um fornecedor
// 1 - Obtém o id dos params
// 2 - Busca no prisma pelo id único; se for nulo lança 404
// 3 - Retorna objeto fornecedor
export async function obterFornecedor(req, res, next) {
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if (!fornecedor) {
      return res.status(404).json({
        error: "Fornecedor não encontrado"
      });
    }

    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
