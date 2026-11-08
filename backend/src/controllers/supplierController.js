import * as supplierService from '../services/supplierService.js';
import { childLogger } from '../config/logger.js';
const log = childLogger('supplierController');

// função para criar um novo fornecedor
// Delega validação e persistência para supplierService.createSupplier
export async function criarFornecedor(req, res, next) {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const fornecedor = await supplierService.createSupplier(req.body);
    log.info({ user: req.user?.id, action: 'CREATE_SUPPLIER', targetId: fornecedor.id }, 'User created a supplier');
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error creating supplier');
    next(err);
  }
}

// função para listar todos os fornecedores
export async function listarFornecedores(req, res, next) {
  try {
    const fornecedores = await supplierService.listSuppliers();
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, 'Error listing suppliers');
    next(err);
  }
}

// função para contar a quantidade total de fornecedores
export async function countFornecedores(req, res, next) {
  try {
    const count = await supplierService.countSuppliers();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting suppliers');
    next(err);
  }
}

// função para atualizar dados de um fornecedor
export async function atualizarFornecedor(req, res, next) {
  try {
    const fornecedor = await supplierService.updateSupplier(req.params.id, req.body);
    log.info({ user: req.user?.id, action: 'UPDATE_SUPPLIER', targetId: fornecedor.id }, 'User updated a supplier');
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, 'Error updating supplier');
    next(err);
  }
}

// função para deletar um fornecedor
// Protegida por verificação de vínculos em supplierService.deleteSupplier (B6)
export async function deletarFornecedor(req, res, next) {
  try {
    await supplierService.deleteSupplier(req.params.id);
    log.info({ user: req.user?.id, action: 'DELETE_SUPPLIER', targetId: req.params.id }, 'User deleted a supplier');
    res.json({ message: "Fornecedor deletado com sucesso" });
  } catch (err) {
    log.error({ err }, 'Error deleting supplier');
    next(err);
  }
}

// função para gerar estatísticas agregadas por fornecedor
// Agregação SQL nativa (I4) delegada ao supplierService.getSupplierStats
export async function getSupplierStats(req, res, next) {
  try {
    const stats = await supplierService.getSupplierStats();
    res.json(stats);
  } catch (err) {
    log.error({ err }, 'Error getting supplier stats');
    next(err);
  }
}

// função para recuperar dados singulares de um fornecedor
export async function obterFornecedor(req, res, next) {
  try {
    const fornecedor = await supplierService.getSupplierById(req.params.id);
    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
