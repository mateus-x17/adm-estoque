// arquivo responsável por controlar requisições HTTP do módulo de Lojas e Filiais da Organização.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: storeRoutes.js para responder aos endpoints de lojas (/stores).

// importações de logging: childLogger instancia logger estruturado com módulo storeController.
import { childLogger } from "../config/logger.js";
// importações de serviços: storeService encapsula regras de criação, unicidade de filial, inativação e exclusão.
import * as storeService from "../services/storeService.js";

// instância de logger para auditoria de operações de lojas
const log = childLogger("storeController");

// função responsável por listar as lojas acessíveis ao usuário autenticado com filtro de situação operacional.
//
// contexto: invocada pela rota GET /stores; administradores visualizam todas as lojas da rede e colaboradores veem apenas a sua filial.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo usuário autenticado em req.user e filtro em req.query.status.
//   - res (Response, obrigatório): resposta HTTP para envio do array de lojas em formato JSON.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com a lista de lojas e métricas resumidas).
// erros: repassa ao next(err) em caso de falha de consulta.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai o filtro de status de req.query (padrão 'todos').
// 3 - aciona storeService.listStores passando o usuário logado e o status.
// 4 - entrega a resposta JSON contendo as lojas localizadas.
export async function listStores(req, res, next) {
  try {
    // 2 - extrai status
    const status = req.query.status || "todos";
    // 3 - consulta lojas no serviço
    const stores = await storeService.listStores(req.user, status);
    // 4 - responde
    res.json(stores);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar lojas");
    next(err);
  }
}

// função responsável por obter detalhes completos de uma filial específica incluindo contadores de colaboradores e estoque.
//
// contexto: chamada pela rota GET /stores/:id na visualização ou edição da unidade.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e o usuário autenticado.
//   - res (Response, obrigatório): resposta HTTP para envio dos dados da loja.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com os dados da loja).
// erros: repassa 404 ao next(err) se a loja não pertencer à organização do usuário.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - busca a loja no serviço através de storeService.getStoreById(req.params.id, req.user).
// 3 - envia a resposta JSON com o registro detalhado da loja.
export async function getStore(req, res, next) {
  try {
    // 2 - busca loja no service
    const store = await storeService.getStoreById(req.params.id, req.user);
    // 3 - responde
    res.json(store);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao buscar loja");
    next(err);
  }
}

// função responsável por criar uma nova filial na rede da organização locatária (exclusivo para perfil ADMIN).
//
// contexto: invocada pela rota POST /stores ao cadastrar uma nova unidade física ou virtual da empresa.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo nome, slug opcional, cnpj, telefone, endereco e organizacaoId do ADMIN.
//   - res (Response, obrigatório): resposta HTTP com status 201 e dados da loja criada.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (responde HTTP 201 Created com a nova loja).
// erros: repassa ao next(err) se já existir filial com o mesmo nome ou slug na organização.
// efeitos colaterais: insere registro na tabela Loja no PostgreSQL e registra log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - invoca storeService.createStore persistindo a nova filial vinculada à organização.
// 3 - grava log de auditoria informando o ID da loja criada e o usuário administrador.
// 4 - responde com status HTTP 201 Created entregando a loja cadastrada.
export async function createStore(req, res, next) {
  try {
    // 2 - persiste filial
    const store = await storeService.createStore(req.body, req.user.organizacaoId);
    // 3 - auditoria
    log.info(
      { user: req.user?.id, organizacaoId: req.user.organizacaoId, action: "CREATE_STORE", targetId: store.id },
      "Nova loja criada na organização"
    );
    // 4 - responde 201
    res.status(201).json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao criar loja");
    next(err);
  }
}

// função responsável por atualizar os dados cadastrais e de contato de uma loja existente.
//
// contexto: chamada pela rota PUT /stores/:id ao salvar alterações de endereço, telefone ou nome da filial.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e os novos campos cadastrais no corpo.
//   - res (Response, obrigatório): resposta Express com a loja atualizada.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com a loja atualizada).
// erros: repassa 404 ao next(err) se a loja não pertencer à organização.
// efeitos colaterais: atualiza campos na tabela Loja e registra log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona storeService.updateStore com o ID da loja, novos dados e a organização do ADMIN.
// 3 - grava log informativo com a confirmação da atualização da loja.
// 4 - entrega a resposta JSON com os dados modificados.
export async function updateStore(req, res, next) {
  try {
    // 2 - executa atualização cadastral
    const store = await storeService.updateStore(req.params.id, req.body, req.user.organizacaoId);
    // 3 - auditoria
    log.info(
      { user: req.user?.id, organizacaoId: req.user.organizacaoId, action: "UPDATE_STORE", targetId: store.id },
      "Loja atualizada"
    );
    // 4 - responde
    res.json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao atualizar loja");
    next(err);
  }
}

// função responsável por ativar ou inativar logicamente uma filial com proteção contra desativação da última loja ativa.
//
// contexto: invocada pela rota PATCH /stores/:id/status para suspender temporariamente operações de uma filial.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.ativo.
//   - res (Response, obrigatório): resposta HTTP com o modelo atualizado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com a loja e sua nova situação).
// erros: repassa erro 400 ao next(err) caso tente inativar a única loja ativa da organização.
// efeitos colaterais: atualiza coluna ativo na tabela Loja e purga o cache de sessões dos colaboradores afetados.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona storeService.toggleStoreStatus passando o ID, o booleano ativo e a organização.
// 3 - registra log de auditoria com a nova situação da filial.
// 4 - devolve o modelo da loja atualizada em formato JSON.
export async function toggleStoreStatus(req, res, next) {
  try {
    // 2 - alterna status no serviço com validação de última loja
    const store = await storeService.toggleStoreStatus(
      req.params.id,
      req.body.ativo,
      req.user.organizacaoId
    );
    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "TOGGLE_STORE_STATUS",
        targetId: store.id,
        ativo: store.ativo,
      },
      "Status da loja alterado"
    );
    // 4 - responde
    res.json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao alterar status da loja");
    next(err);
  }
}

// função responsável por excluir fisicamente ou aplicar Soft Delete automático em uma filial conforme o histórico associado.
//
// contexto: chamada pela rota DELETE /stores/:id (exclusiva para perfil ADMIN).
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e a organização do administrador.
//   - res (Response, obrigatório): resposta HTTP com o resultado da exclusão.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON indicando se houve exclusão física ou Soft Delete).
// erros: repassa ao next(err) se a loja não existir ou for a única da organização.
// efeitos colaterais: deleta fisicamente a Loja OU inativa logicamente se houver produtos, pedidos ou colaboradores vinculados.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - executa storeService.deleteStore com o ID e a organização do solicitante.
// 3 - grava log de auditoria informando o tipo de deleção aplicada (softDeleted = true/false).
// 4 - responde entregando o objeto com o desfecho da exclusão.
export async function deleteStore(req, res, next) {
  try {
    // 2 - executa deleção inteligente no service
    const result = await storeService.deleteStore(req.params.id, req.user.organizacaoId);
    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "DELETE_STORE",
        targetId: req.params.id,
        softDeleted: result.softDeleted,
      },
      "Remoção de loja processada"
    );
    // 4 - responde
    res.json(result);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao excluir loja");
    next(err);
  }
}
