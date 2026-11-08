import { childLogger } from '../config/logger.js';
import { listMovementsPaginated, getUserStatsAggregated, getSalesReportData } from '../services/movementService.js';
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

// função para obter o montante e volume de movimentações agrupado por usuário (stats)
// Eliminação completa de N+1 (I3): delega para query única agregada SQL via movementService
export async function getUserStats(req, res, next) {
  try {
    const { from, to } = req.query;
    const results = await getUserStatsAggregated({ from, to });
    log.info({ user: req.user?.id, action: 'GET_USER_STATS', from, to }, 'User fetched user stats');
    res.json(results);
  } catch (err) {
    log.error({ err }, 'Error getting user stats');
    next(err);
  }
}

// função para entregar o relatório consolidado de vendas com agregação temporal
// 1 - Extrai o parâmetro de período (req.query.period: '1m', '6m', '1y')
// 2 - Chama o serviço getSalesReportData delegando a agregação cronológica e os cálculos
// 3 - Registra log de auditoria da consulta e devolve a resposta estruturada em JSON
export async function getSalesReport(req, res, next) {
  try {
    const { period = '1m' } = req.query;
    const report = await getSalesReportData(period);
    log.info({ user: req.user?.id, action: 'GET_SALES_REPORT', period }, 'User fetched sales report');
    res.json(report);
  } catch (err) {
    log.error({ err, period: req.query.period }, 'Error generating sales report');
    next(err);
  }
}
