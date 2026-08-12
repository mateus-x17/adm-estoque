import { prisma } from '../config/prismaClient.js';
import { childLogger } from '../config/logger.js';
import { listMovementsPaginated } from '../services/movementService.js';
const log = childLogger('movementController');

// função para listar as movimentações com filtros e paginação
// 1 - Chama o serviço passando toda a string de busca (req.query)
// 2 - O serviço lida com datas, página, tipo e limites
// 3 - Retorna o JSON resultante direto para a resposta
export async function listMovements(req, res, next) {
  try {
    const result = await listMovementsPaginated(req.query);
    res.json(result);
  } catch (err) {
    log.error({ err, user: req.user?.id }, 'Error listing movements');
    next(err);
  }
}

// utilitário interno para converter strings 'YYYY-MM-DD' em instâncias de Date nativas do JavaScript
// O booleano endOfDay permite configurar a hora para o último milissegundo do dia útil (23:59:59.999) caso necessário
function dateFromYMD(ymd, endOfDay = false) {
  const [year, month, day] = ymd.split('-').map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

// função para obter o montante e volume de movimentações agrupado por usuário (stats)
// 1 - Recebe datas de limite inferior (from) e superior (to) na querystring
// 2 - Constrói um objeto "dateFilter" para o prisma com base em from/to
// 3 - Executa prisma.movimento.groupBy() agrupando por "usuarioId", contando o total e somando as quantidades
// 4 - Faz um map interando sobre o array retornado pelo groupBy e, de forma paralela via Promise.all, constrói os dados complexos (nome do usuário e gastos por saída)
// 5 - Retorna o array gerado em JSON
export async function getUserStats(req, res, next) {
  try {
    const { from, to } = req.query;

    // Build date filter if provided
    const dateFilter =
      from || to
        ? {
            data: {
              ...(from && from !== 'undefined' ? { gte: dateFromYMD(from, false) } : {}),
              ...(to && to !== 'undefined' ? { lte: dateFromYMD(to, true) } : {}),
            },
          }
        : {};

    const stats = await prisma.movimento.groupBy({
      by: ['usuarioId'],
      where: Object.keys(dateFilter).length ? dateFilter : undefined,
      _count: { _all: true },
      _sum: { quantidade: true },
    });

    const results = await Promise.all(stats.map(async (s) => {
      const usuario = await prisma.usuario.findUnique({
        where: { id: s.usuarioId },
        select: { nome: true },
      });

      // Essa query busca apenas as saídas (vendas/consumos) atreladas àquele usuário para poder somar o valor final financeiro das saídas
      const saidas = await prisma.movimento.findMany({
        where: {
          usuarioId: s.usuarioId,
          tipo: 'SAIDA',
          ...(Object.keys(dateFilter).length ? dateFilter : {}),
        },
        include: { produto: { select: { preco: true } } },
      });

      const totalValue = saidas.reduce((acc, mov) => acc + (mov.quantidade * mov.produto.preco), 0);

      log.info({ user: req.user?.id, action: 'GET_USER_STATS', from, to }, 'User fetched user stats');

      return {
        usuarioId: s.usuarioId,
        name: usuario?.nome || 'Desconhecido',
        count: s._count._all || 0,
        totalQuantity: s._sum.quantidade || 0,
        totalValue,
      };
    }));

    res.json(results);
  } catch (err) {
    log.error({ err }, 'Error getting user stats');
    next(err);
  }
}
