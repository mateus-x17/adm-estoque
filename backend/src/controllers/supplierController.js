import * as supplierService from '../services/supplierService.js';
import { childLogger } from '../config/logger.js';
const log = childLogger('supplierController');

// arquivo responsável por controlar as requisições HTTP de fornecedores vinculados ao tenant

// função para criar um novo fornecedor na loja atual
export async function criarFornecedor(req, res, next) {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const fornecedor = await supplierService.createSupplier(req.body, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'CREATE_SUPPLIER', targetId: fornecedor.id }, 'Fornecedor criado');
    res.status(201).json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Erro ao criar fornecedor');
    next(err);
  }
}

// função para listar os fornecedores da loja com filtro opcional de status ('ativos', 'inativos', 'todos')
export async function listarFornecedores(req, res, next) {
  try {
    const status = req.query.status || 'ativos';
    const fornecedores = await supplierService.listSuppliers(req.user.empresaId, status);
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, 'Erro ao listar fornecedores');
    next(err);
  }
}

// função para contar fornecedores ativos da loja
export async function countFornecedores(req, res, next) {
  try {
    const count = await supplierService.countSuppliers(req.user.empresaId);
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Erro ao contar fornecedores');
    next(err);
  }
}

// função para atualizar um fornecedor da loja
export async function atualizarFornecedor(req, res, next) {
  try {
    const fornecedor = await supplierService.updateSupplier(req.params.id, req.body, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'UPDATE_SUPPLIER', targetId: fornecedor.id }, 'Fornecedor atualizado');
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Erro ao atualizar fornecedor');
    next(err);
  }
}

// função para inativar ou reativar um fornecedor (Soft Delete)
export async function toggleFornecedorStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const fornecedor = await supplierService.toggleSupplierStatus(req.params.id, ativo, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'TOGGLE_SUPPLIER_STATUS', targetId: fornecedor.id, ativo }, 'Status de fornecedor alterado');
    res.json({ fornecedor });
  } catch (err) {
    next(err);
  }
}

// função para deletar ou inativar logicamente um fornecedor
export async function deletarFornecedor(req, res, next) {
  try {
    const result = await supplierService.deleteSupplier(req.params.id, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'DELETE_SUPPLIER', targetId: req.params.id, result }, 'Resultado exclusão fornecedor');
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Erro ao deletar fornecedor');
    next(err);
  }
}

// função para gerar estatísticas agregadas por fornecedor da loja
export async function getSupplierStats(req, res, next) {
  try {
    const stats = await supplierService.getSupplierStats(req.user.empresaId);
    res.json(stats);
  } catch (err) {
    log.error({ err }, 'Erro ao gerar estatísticas de fornecedores');
    next(err);
  }
}

// função para recuperar detalhes de um fornecedor da loja
export async function obterFornecedor(req, res, next) {
  try {
    const fornecedor = await supplierService.getSupplierById(req.params.id, req.user.empresaId);
    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
