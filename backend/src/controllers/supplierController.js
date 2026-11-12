// arquivo responsável por controlar requisições HTTP do módulo de Fornecedores isolados por Organização e Loja.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: supplierRoutes.js para responder aos endpoints de fornecedores (/suppliers).

// importações de serviços: supplierService implementa regras de negócio, CRUD e consultas SQL analíticas de fornecedores.
import * as supplierService from "../services/supplierService.js";
// importações de logging: childLogger instancia logger estruturado para o módulo supplierController.
import { childLogger } from "../config/logger.js";
// importações de escopo: resolveReadScope e resolveWriteStore garantem isolamento de filial e organização.
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";

// instância de logger especializada para auditoria de fornecedores
const log = childLogger("supplierController");

// função responsável por cadastrar um novo fornecedor vinculado à loja ativa do escopo.
//
// contexto: chamada pela rota POST /suppliers por usuários autorizados (ADMIN ou GERENTE).
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.body com nome, email, telefone, endereco e usuário autenticado.
//   - res (Response, obrigatório): resposta HTTP para envio do status 201 e dados do fornecedor criado.
//   - next (NextFunction, obrigatório): função de erro do Express.
//
// retorno: nenhum (responde HTTP 201 Created com o fornecedor criado).
// erros: repassa ao next(err) se faltar nome ou a loja de destino for inválida.
// efeitos colaterais: insere registro na tabela Fornecedor no PostgreSQL e grava log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - valida presença de req.body.nome; se ausente, responde HTTP 400 com mensagem de erro.
// 3 - resolve a loja de destino via resolveWriteStore(req).
// 4 - aciona supplierService.createSupplier passando os dados cadastrais e o escopo da filial.
// 5 - registra log de auditoria com os dados do fornecedor cadastrado.
// 6 - responde com status HTTP 201 Created entregando o objeto do fornecedor.
export async function criarFornecedor(req, res, next) {
  try {
    // 2 - validação primária de nome
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    // 3 - resolve loja de gravação
    const storeScope = await resolveWriteStore(req);
    // 4 - persiste fornecedor
    const fornecedor = await supplierService.createSupplier(req.body, storeScope);

    // 5 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_SUPPLIER",
        targetId: fornecedor.id,
      },
      "Fornecedor criado"
    );

    // 6 - responde 201
    res.status(201).json({ fornecedor });
  } catch (err) {
    log.error({ err }, "Erro ao criar fornecedor");
    next(err);
  }
}

// função responsável por listar fornecedores no escopo da organização ou filial com filtro de status.
//
// contexto: invocada pela rota GET /suppliers para exibir o catálogo de parceiros e fornecedores.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.query.status e usuário autenticado.
//   - res (Response, obrigatório): resposta HTTP com a lista de fornecedores em JSON.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com a lista de fornecedores).
// erros: repassa ao next(err) em caso de falha.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - extrai o filtro de status da query string (padrão 'ativos').
// 4 - consulta os fornecedores no serviço através de supplierService.listSuppliers(scope, status).
// 5 - responde com objeto JSON { fornecedores }.
export async function listarFornecedores(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - extrai status
    const status = req.query.status || "ativos";
    // 4 - consulta fornecedores
    const fornecedores = await supplierService.listSuppliers(scope, status);
    // 5 - responde
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, "Erro ao listar fornecedores");
    next(err);
  }
}

// função responsável por contar a quantidade de fornecedores ativos na organização ou filial.
//
// contexto: chamada pela rota GET /suppliers/count para indicadores do painel.
//
// parâmetros:
//   - req (Request, obrigatório): requisição com usuário autenticado e parâmetros de escopo.
//   - res (Response, obrigatório): resposta Express com objeto contendo a contagem.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com { count }).
// erros: repassa ao next(err).
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo multitenant com resolveReadScope(req).
// 3 - obtém a contagem de fornecedores ativos via supplierService.countSuppliers(scope).
// 4 - responde entregando o total em JSON.
export async function countFornecedores(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - obtém contagem
    const count = await supplierService.countSuppliers(scope);
    // 4 - responde
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar fornecedores");
    next(err);
  }
}

// função responsável por atualizar os dados cadastrais e de contato de um fornecedor.
//
// contexto: invocada pela rota PUT /suppliers/:id ao editar dados do fornecedor.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e os novos campos cadastrais no corpo.
//   - res (Response, obrigatório): resposta Express com o fornecedor atualizado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o fornecedor atualizado).
// erros: repassa 404 ao next(err) se o fornecedor não pertencer ao escopo autorizado.
// efeitos colaterais: atualiza registro na tabela Fornecedor e emite log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona supplierService.updateSupplier com o ID, dados e contexto de restrição do usuário.
// 3 - grava log de auditoria confirmando a modificação do fornecedor.
// 4 - responde com o modelo do fornecedor atualizado em formato JSON.
export async function atualizarFornecedor(req, res, next) {
  try {
    // 2 - executa atualização no serviço
    const fornecedor = await supplierService.updateSupplier(req.params.id, req.body, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });

    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "UPDATE_SUPPLIER",
        targetId: fornecedor.id,
      },
      "Fornecedor atualizado"
    );

    // 4 - responde
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, "Erro ao atualizar fornecedor");
    next(err);
  }
}

// função responsável por alterar a situação de ativação lógica de um fornecedor (Soft Delete reversível).
//
// contexto: chamada pela rota PATCH /suppliers/:id/status para inativação ou reativação de fornecedores.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.ativo.
//   - res (Response, obrigatório): resposta HTTP com o modelo modificado.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com o fornecedor e o novo status).
// erros: repassa ao next(err) se o fornecedor não for encontrado.
// efeitos colaterais: altera a coluna ativo na tabela Fornecedor no PostgreSQL.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai a flag ativo do corpo da requisição.
// 3 - executa supplierService.toggleSupplierStatus com o ID e o escopo de filial.
// 4 - entrega a resposta JSON com o fornecedor atualizado.
export async function toggleFornecedorStatus(req, res, next) {
  try {
    // 2 - extrai flag
    const { ativo } = req.body;
    // 3 - alterna status no serviço
    const fornecedor = await supplierService.toggleSupplierStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    // 4 - responde
    res.json({ fornecedor });
  } catch (err) {
    next(err);
  }
}

// função responsável por excluir fisicamente ou inativar logicamente um fornecedor (exclusivo para ADMIN).
//
// contexto: invocada pela rota DELETE /suppliers/:id na governança de parceiros da organização.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e organizacaoId do administrador.
//   - res (Response, obrigatório): resposta HTTP com o desfecho da exclusão.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON indicando se houve exclusão permanente ou Soft Delete).
// erros: repassa ao next(err) se o fornecedor não for encontrado.
// efeitos colaterais: deleta o registro físico OU altera ativo para false se houver produtos ou compras vinculadas.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - executa supplierService.deleteSupplier com o ID e a organização do ADMIN.
// 3 - grava log de auditoria com o resultado da exclusão.
// 4 - responde entregando o objeto com o resultado em formato JSON.
export async function deletarFornecedor(req, res, next) {
  try {
    // 2 - executa exclusão inteligente no service
    const result = await supplierService.deleteSupplier(req.params.id, req.user.organizacaoId);
    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "DELETE_SUPPLIER",
        targetId: req.params.id,
        result,
      },
      "Resultado exclusão fornecedor"
    );
    // 4 - responde
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao deletar fornecedor");
    next(err);
  }
}

// função responsável por consolidar estatísticas analíticas de movimentações (reposições e vendas) por fornecedor.
//
// contexto: chamada pela rota GET /suppliers/stats para gráficos e tabelas de faturamento por parceiro.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.query.status e escopo do usuário.
//   - res (Response, obrigatório): resposta HTTP com o array de métricas calculadas em SQL nativo.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com as métricas agregadas por fornecedor).
// erros: repassa ao next(err) em caso de erro na consulta analítica.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - extrai o filtro de status de req.query (padrão 'ativos').
// 4 - invoca supplierService.getSupplierStats executando a consulta SQL agregada.
// 5 - entrega a resposta JSON com as estatísticas consolidadas.
export async function getSupplierStats(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - extrai status
    const status = req.query.status || "ativos";
    // 4 - processa métricas SQL
    const stats = await supplierService.getSupplierStats(scope, status);
    // 5 - responde
    res.json(stats);
  } catch (err) {
    log.error({ err }, "Erro ao gerar estatísticas de fornecedores");
    next(err);
  }
}

// função responsável por consultar os detalhes cadastrais completos de um único fornecedor do escopo.
//
// contexto: invocada pela rota GET /suppliers/:id na consulta detalhada de parceiro.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e escopo do usuário.
//   - res (Response, obrigatório): resposta HTTP com o modelo do fornecedor.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com os dados do fornecedor e loja associada).
// erros: repassa 404 ao next(err) se o fornecedor não for localizado no escopo.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo multitenant com resolveReadScope(req).
// 3 - consulta o fornecedor no serviço através de supplierService.getSupplierById(req.params.id, scope).
// 4 - responde entregando o registro do fornecedor em formato JSON.
export async function obterFornecedor(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - busca fornecedor
    const fornecedor = await supplierService.getSupplierById(req.params.id, scope);
    // 4 - responde
    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
