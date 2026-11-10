import * as supplierService from "../services/supplierService.js";
import { childLogger } from "../config/logger.js";
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
const log = childLogger("supplierController");

// arquivo responsável por controlar requisições HTTP de fornecedores isolados por Organização e Loja

// função para cadastrar novo fornecedor na loja selecionada
export async function criarFornecedor(req, res, next) {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    const storeScope = await resolveWriteStore(req);
    const fornecedor = await supplierService.createSupplier(req.body, storeScope);
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
    res.status(201).json({ fornecedor });
  } catch (err) {
    log.error({ err }, "Erro ao criar fornecedor");
    next(err);
  }
}

// função para listar fornecedores no escopo selecionado (rede ou loja)
export async function listarFornecedores(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const status = req.query.status || "ativos";
    const fornecedores = await supplierService.listSuppliers(scope, status);
    res.json({ fornecedores });
  } catch (err) {
    log.error({ err }, "Erro ao listar fornecedores");
    next(err);
  }
}

// função para contar fornecedores ativos no escopo atual
export async function countFornecedores(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const count = await supplierService.countSuppliers(scope);
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar fornecedores");
    next(err);
  }
}

// função para atualizar fornecedor dentro da Organização/Loja
export async function atualizarFornecedor(req, res, next) {
  try {
    const fornecedor = await supplierService.updateSupplier(req.params.id, req.body, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "UPDATE_SUPPLIER",
        targetId: fornecedor.id,
      },
      "Fornecedor atualizado"
    );
    res.json({ fornecedor });
  } catch (err) {
    log.error({ err }, "Erro ao atualizar fornecedor");
    next(err);
  }
}

// função para inativar ou reativar logicamente um fornecedor (Soft Delete)
export async function toggleFornecedorStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const fornecedor = await supplierService.toggleSupplierStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    res.json({ fornecedor });
  } catch (err) {
    next(err);
  }
}

// função exclusiva de ADMIN para excluir ou inativar logicamente um fornecedor
export async function deletarFornecedor(req, res, next) {
  try {
    const result = await supplierService.deleteSupplier(req.params.id, req.user.organizacaoId);
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
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao deletar fornecedor");
    next(err);
  }
}

// função para consultar estatísticas agregadas por fornecedor
export async function getSupplierStats(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const stats = await supplierService.getSupplierStats(scope);
    res.json(stats);
  } catch (err) {
    log.error({ err }, "Erro ao gerar estatísticas de fornecedores");
    next(err);
  }
}

// função para obter detalhes de um fornecedor do escopo atual
export async function obterFornecedor(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const fornecedor = await supplierService.getSupplierById(req.params.id, scope);
    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
}
