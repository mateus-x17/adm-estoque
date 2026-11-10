import { childLogger } from '../config/logger.js';
import {
  listMovementsPaginated,
  getUserStatsAggregated,
  getSalesReportData,
} from '../services/movementService.js';
const log = childLogger('movementController');

// arquivo responsável por controlar requisições de movimentações, métricas por vendedor e relatório de vendas por loja

// função para listar movimentações da loja (OPERADOR recebe automaticamente apenas suas próprias movimentações)
// 1 - Repassa req.query, req.user.empresaId e req.user ao serviço listMovementsPaginated
// 2 - Retorna a lista paginada respeitando isolamento por loja e por perfil RBAC
export async function listMovements(req, res, next) {
  try {
    const result = await listMovementsPaginated(
      req.query,
      req.user.empresaId,
      req.user
    );
    res.json(result);
  } catch (err) {
    log.error({ err, user: req.user?.id, empresaId: req.user?.empresaId }, 'Erro ao listar movimentações');
    next(err);
  }
}

// função para obter o montante e volume de movimentações por vendedor da loja (restrita a ADMIN e GERENTE)
// 1 - Extrai intervalo opcional from/to da query string e o empresaId do token
// 2 - Consulta query agregada SQL sem N+1 e devolve os resultados
export async function getUserStats(req, res, next) {
  try {
    const { from, to } = req.query;
    const results = await getUserStatsAggregated({ from, to }, req.user.empresaId);
    log.info(
      { user: req.user?.id, empresaId: req.user.empresaId, action: 'GET_USER_STATS', from, to },
      'Estatísticas por vendedor consultadas'
    );
    res.json(results);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao obter estatísticas por usuário');
    next(err);
  }
}

// função para entregar o relatório consolidado de vendas (escopo da loja para ADMIN/GERENTE, ou individual para OPERADOR)
// 1 - Extrai o período desejado ('1m', '6m' ou '1y')
// 2 - Invoca getSalesReportData passando empresaId e req.user para aplicar filtro de privacidade de operador
// 3 - Registra auditoria e devolve JSON estruturado para o gerador de PDF nativo
export async function getSalesReport(req, res, next) {
  try {
    const { period = '1m' } = req.query;
    const report = await getSalesReportData(period, req.user.empresaId, req.user);
    log.info(
      { user: req.user?.id, empresaId: req.user.empresaId, action: 'GET_SALES_REPORT', period, scope: report.scope },
      'Relatório de vendas consultado'
    );
    res.json(report);
  } catch (err) {
    log.error({ err, period: req.query.period, empresaId: req.user?.empresaId }, 'Erro ao gerar relatório de vendas');
    next(err);
  }
}
