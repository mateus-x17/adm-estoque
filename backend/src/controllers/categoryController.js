import { childLogger } from "../config/logger.js";
import * as categoryService from "../services/categoryService.js";
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
const log = childLogger("categoryController");

// arquivo responsável por intermediar requisições HTTP de categorias isoladas por Organização e Loja

// função para listar categorias do escopo atual (rede ou loja selecionada)
export async function listCategories(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const status = req.query.status || "ativos";
    const cats = await categoryService.listCategories(scope, status);
    res.json(cats);
  } catch (err) {
    log.error({ err }, "Erro ao listar categorias");
    next(err);
  }
}

// função para contar categorias ativas do escopo selecionado
export async function countCategories(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const count = await categoryService.countCategories(scope);
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar categorias");
    next(err);
  }
}

// função para criar nova categoria vinculada à loja resolvida pelo escopo
export async function createCategory(req, res, next) {
  try {
    const storeScope = await resolveWriteStore(req);
    const c = await categoryService.createCategory(req.body.nome, storeScope);
    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_CATEGORY",
        targetId: c.id,
      },
      "Categoria criada"
    );
    res.status(201).json(c);
  } catch (err) {
    log.error({ err }, "Erro ao criar categoria");
    next(err);
  }
}

// função para atualizar uma categoria respeitando o escopo do usuário
export async function updateCategory(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body.nome, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "UPDATE_CATEGORY",
        targetId: updated.id,
      },
      "Categoria atualizada"
    );
    res.json(updated);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar categoria");
    next(err);
  }
}

// função para inativar ou reativar uma categoria (Soft Delete)
export async function toggleCategoryStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const updated = await categoryService.toggleCategoryStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// função exclusiva de ADMIN para excluir ou inativar categoria
export async function deleteCategory(req, res, next) {
  try {
    const result = await categoryService.deleteCategory(req.params.id, req.user.organizacaoId);
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "DELETE_CATEGORY",
        targetId: req.params.id,
        result,
      },
      "Resultado da exclusão de categoria"
    );
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao deletar categoria");
    next(err);
  }
}
