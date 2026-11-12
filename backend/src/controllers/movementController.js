// arquivo responsável por controlar requisições HTTP de extrato unitário, estatísticas, relatórios de vendas e desempenho de vendedores.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: movementRoutes.js para responder aos endpoints de listagem, rankings, dashboards e relatórios analíticos.

// importações de logging: childLogger instancia logger estruturado com módulo movementController.
import { childLogger } from "../config/logger.js";
// importações de serviços: métodos especializados de agregação e listagem do livro-razão e métricas de vendedores.
import {
  listMovementsPaginated,
  getUserStatsAggregated,
  getSalesReportData,
  getSellerPerformanceRanking,
  getSellerPerformanceDetail,
} from "../services/movementService.js";
// importações de escopo: resolveReadScope valida e isola o acesso entre filiais e a rede da organização.
import { resolveReadScope } from "../utils/tenantScope.js";

// instância de logger para auditoria de consultas de movimentações e faturamento
const log = childLogger("movementController");

// função responsável por listar movimentações unitárias de estoque com suporte a paginação e filtros de data e produto.
//
// contexto: chamada pela rota GET /movements; colaboradores comuns (OPERADOR) visualizam apenas suas próprias operações.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo query params (page, limit, tipo, search, startDate, endDate) e req.user.
//   - res (Response, obrigatório): resposta HTTP para envio do extrato paginado em JSON.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com a lista de movimentações e metadados de paginação).
// erros: repassa exceções ao next(err) em caso de falha de consulta ou escopo.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - aciona listMovementsPaginated passando req.query, o escopo multitenant e o usuário autenticado.
// 4 - responde com o resultado paginado em formato JSON.
export async function listMovements(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - consulta no service com isolamento de perfil
    const result = await listMovementsPaginated(req.query, scope, req.user);
    // 4 - devolve extrato
    res.json(result);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar movimentações");
    next(err);
  }
}

// função responsável por consolidar estatísticas agregadas de vendas por vendedor para os gráficos do Dashboard.
//
// contexto: invocada pela rota GET /movements/user-stats para perfis com permissão ADMIN ou GERENTE.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.query.from e req.query.to opcionais.
//   - res (Response, obrigatório): resposta HTTP com o array de métricas por vendedor.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com as métricas agregadas).
// erros: repassa ao next(err) se houver erro de data ou banco.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de filial ou rede através de resolveReadScope(req).
// 3 - extrai o intervalo de datas from e to de req.query.
// 4 - invoca getUserStatsAggregated no movementService para consolidar vendas e quantidades por vendedor.
// 5 - entrega a resposta JSON com os totais calculados.
export async function getUserStats(req, res, next) {
  try {
    // 2 - resolve escopo multitenant
    const scope = await resolveReadScope(req);
    // 3 - extrai período
    const { from, to } = req.query;
    // 4 - processa agregações
    const results = await getUserStatsAggregated({ from, to }, scope);
    // 5 - responde
    res.json(results);
  } catch (err) {
    log.error({ err }, "Erro ao obter estatísticas por usuário");
    next(err);
  }
}

// função responsável por gerar o relatório executivo de faturamento e vendas por período (1m, 6m, 1y).
//
// contexto: chamada pela rota GET /movements/sales-report para alimentar cards financeiros e exportações executivas.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.query.period e usuário autenticado.
//   - res (Response, obrigatório): resposta HTTP contendo o relatório estruturado em JSON.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com totais faturados, tickets médios e séries temporais).
// erros: repassa ao next(err) em caso de falha de agregação.
// efeitos colaterais: grava log de auditoria com o período e o escopo do relatório consultado.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário com resolveReadScope(req).
// 3 - extrai o período desejado de req.query.period (padrão '1m').
// 4 - gera o relatório através de getSalesReportData(period, scope, req.user).
// 5 - grava log informativo com o usuário solicitante, organização, filial e período.
// 6 - devolve o relatório executivo em formato JSON.
export async function getSalesReport(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - extrai período
    const { period = "1m" } = req.query;
    // 4 - gera relatório analítico
    const report = await getSalesReportData(period, scope, req.user);
    // 5 - auditoria
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
    // 6 - entrega resposta
    res.json(report);
  } catch (err) {
    log.error({ err, period: req.query.period }, "Erro ao gerar relatório de vendas");
    next(err);
  }
}

// função responsável por retornar o ranking comparativo completo de vendedores ordenado do melhor ao pior.
//
// contexto: invocada pela rota GET /movements/performance para visualização de faturamento e conversão da equipe.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo parâmetros de filtro (period, from, to, search, includeDeleted).
//   - res (Response, obrigatório): resposta HTTP com o array ordenado de vendedores e métricas.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com a listagem ordenada de desempenho).
// erros: repassa ao next(err) em caso de erro.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo multitenant com resolveReadScope(req).
// 3 - extrai filtros de período, datas personalizadas, termo de busca e flag de inclusão de desligados de req.query.
// 4 - executa getSellerPerformanceRanking consolidando vendas, metas e cancelamentos.
// 5 - entrega a resposta JSON com o ranking calculado.
export async function getPerformanceRanking(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - extrai parâmetros de consulta
    const { period = "1m", from, to, search = "", includeDeleted = "true" } = req.query;
    // 4 - calcula ranking
    const result = await getSellerPerformanceRanking(
      { period, from, to, search, includeDeleted },
      scope
    );
    // 5 - responde
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao consultar ranking de desempenho de vendedores");
    next(err);
  }
}

// função responsável por consultar o raio-X detalhado de desempenho de um vendedor individual (ativo ou desligado).
//
// contexto: chamada pela rota GET /movements/performance/:refId ao clicar no perfil detalhado de um colaborador.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.refId (ID ou matrícula do vendedor).
//   - res (Response, obrigatório): resposta HTTP contendo histórico de vendas, produtos mais vendidos e evolução mensal.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o raio-X completo do colaborador).
// erros: repassa ao next(err) se o vendedor não for encontrado no escopo.
// efeitos colaterais: nenhum (leitura de histórico).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário com resolveReadScope(req).
// 3 - invoca getSellerPerformanceDetail passando refId e o escopo da organização/loja.
// 4 - responde enviando o objeto de histórico detalhado em formato JSON.
export async function getPerformanceDetail(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - consulta histórico completo
    const result = await getSellerPerformanceDetail(req.params.refId, scope);
    // 4 - devolve raio-x
    res.json(result);
  } catch (err) {
    log.warn({ err, refId: req.params.refId }, "Erro ao consultar desempenho individual");
    next(err);
  }
}
