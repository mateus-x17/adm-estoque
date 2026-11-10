import { childLogger } from "../config/logger.js";
import * as storeService from "../services/storeService.js";
const log = childLogger("storeController");

// arquivo responsável por controlar requisições HTTP do módulo de Lojas/Filiais da Organização

// função para listar lojas acessíveis ao usuário autenticado
// 1 - Extrai filtro opcional de status e consulta serviço com isolamento de Organização/Loja
export async function listStores(req, res, next) {
  try {
    const status = req.query.status || "todos";
    const stores = await storeService.listStores(req.user, status);
    res.json(stores);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar lojas");
    next(err);
  }
}

// função para obter detalhes de uma loja específica
// 1 - Valida pertencimento da filial à Organização e retorna contadores consolidados
export async function getStore(req, res, next) {
  try {
    const store = await storeService.getStoreById(req.params.id, req.user);
    res.json(store);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao buscar loja");
    next(err);
  }
}

// função para criar nova loja na Organização (exclusivo ADMIN)
// 1 - Delega validação de slug único e persistência retornando 201 Created com log de auditoria
export async function createStore(req, res, next) {
  try {
    const store = await storeService.createStore(req.body, req.user.organizacaoId);
    log.info(
      { user: req.user?.id, organizacaoId: req.user.organizacaoId, action: "CREATE_STORE", targetId: store.id },
      "Nova loja criada na organização"
    );
    res.status(201).json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao criar loja");
    next(err);
  }
}

// função para atualizar dados cadastrais de uma loja (exclusivo ADMIN)
// 1 - Atualiza endereço, CNPJ, telefone e slug garantindo unicidade na Organização
export async function updateStore(req, res, next) {
  try {
    const store = await storeService.updateStore(req.params.id, req.body, req.user.organizacaoId);
    log.info(
      { user: req.user?.id, organizacaoId: req.user.organizacaoId, action: "UPDATE_STORE", targetId: store.id },
      "Loja atualizada"
    );
    res.json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao atualizar loja");
    next(err);
  }
}

// função para inativar ou reativar uma loja (Soft Delete — exclusivo ADMIN)
// 1 - Impede desativar a última filial ativa e invalida cache dos colaboradores vinculados
export async function toggleStoreStatus(req, res, next) {
  try {
    const store = await storeService.toggleStoreStatus(
      req.params.id,
      req.body.ativo,
      req.user.organizacaoId
    );
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
    res.json(store);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao alterar status da loja");
    next(err);
  }
}

// função para excluir ou inativar logicamente uma loja (exclusivo ADMIN)
// 1 - Remove fisicamente apenas se vazia; caso possua histórico, converte em Soft Delete
export async function deleteStore(req, res, next) {
  try {
    const result = await storeService.deleteStore(req.params.id, req.user.organizacaoId);
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
    res.json(result);
  } catch (err) {
    log.warn({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao excluir loja");
    next(err);
  }
}
