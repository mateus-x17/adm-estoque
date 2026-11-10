import { childLogger } from "../config/logger.js";
import {
  listMovementsPaginated,
  getUserStatsAggregated,
  getSalesReportData,
  getSellerPerformanceRanking,
  getSellerPerformanceDetail,
} from "../services/movementService.js";
import { resolveReadScope } from "../utils/tenantScope.js";
const log = childLogger("movementController");

// arquivo responsável por controlar requisições HTTP de extrato unitário, estatísticas, relatórios e desempenho de vendedores

// função para listar movimentações do livro-razão (OPERADOR recebe apenas as suas; filtro aceita antigo ID)
export async function listMovements(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const result = await listMovementsPaginated(req.query, scope, req.user);
    res.json(result);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar movimentações");
    next(err);
  }
}

// função para estatísticas consolidadas de vendas por vendedor no Dashboard (ADMIN e GERENTE)
export async function getUserStats(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const { from, to } = req.query;
    const results = await getUserStatsAggregated({ from, to }, scope);
    res.json(results);
  } catch (err) {
    log.error({ err }, "Erro ao obter estatísticas por usuário");
    next(err);
  }
}

// função para gerar relatório executivo consolidado de vendas (1m, 6m, 1y) com suporte a rede ou loja
export async function getSalesReport(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const { period = "1m" } = req.query;
    const report = await getSalesReportData(period, scope, req.user);
    log.info(
      {
        user: req.user?.id,
        organizacaoId: scope.organizacaoId,
        lojaId: scope.lojaId,
        action: "GET_SALES_REPORT",
        period,
        scope: report.scope,
      },
      "Relatório de vendas consultado"
    );
    res.json(report);
  } catch (err) {
    log.error({ err, period: req.query.period }, "Erro ao gerar relatório de vendas");
    next(err);
  }
}

// função para obter o ranking completo de vendedores do melhor ao pior (ativos e excluídos via vendedorRefId)
export async function getPerformanceRanking(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const { period = "1m", from, to, search = "", includeDeleted = "true" } = req.query;
    const result = await getSellerPerformanceRanking(
      { period, from, to, search, includeDeleted },
      scope
    );
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao consultar ranking de desempenho de vendedores");
    next(err);
  }
}

// função para obter o raio-X detalhado (1m, 6m, 1y, gráfico e pedidos) de um colaborador ativo ou excluído pelo ID
export async function getPerformanceDetail(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const result = await getSellerPerformanceDetail(req.params.refId, scope);
    res.json(result);
  } catch (err) {
    log.warn({ err, refId: req.params.refId }, "Erro ao consultar desempenho individual");
    next(err);
  }
}
