import { childLogger } from '../config/logger.js';
import * as categoryService from '../services/categoryService.js';
const log = childLogger('categoryController');

// arquivo responsável por intermediar requisições HTTP para a gestão de categorias do tenant

// função para listar as categorias da loja com suporte a filtro de status
// 1 - Extrai status opcional da query (padrão 'ativos') e o empresaId do token
// 2 - Chama o serviço listCategories e retorna o JSON
export async function listCategories(req, res, next) {
  try {
    const status = req.query.status || 'ativos';
    const cats = await categoryService.listCategories(req.user.empresaId, status);
    res.json(cats);
  } catch (err) {
    log.error({ err }, 'Erro ao listar categorias');
    next(err);
  }
}

// função para contar as categorias ativas da loja
export async function countCategories(req, res, next) {
  try {
    const count = await categoryService.countCategories(req.user.empresaId);
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Erro ao contar categorias');
    next(err);
  }
}

// função para criar uma nova categoria vinculada ao estabelecimento
export async function createCategory(req, res, next) {
  try {
    const c = await categoryService.createCategory(req.body.nome, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'CREATE_CATEGORY', targetId: c.id }, 'Categoria criada');
    res.status(201).json(c);
  } catch (err) {
    log.error({ err }, 'Erro ao criar categoria');
    next(err);
  }
}

// função para atualizar uma categoria da loja
export async function updateCategory(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body.nome, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'UPDATE_CATEGORY', targetId: updated.id }, 'Categoria atualizada');
    res.json(updated);
  } catch (err) {
    log.error({ err }, 'Erro ao atualizar categoria');
    next(err);
  }
}

// função para inativar ou reativar uma categoria (Soft Delete)
export async function toggleCategoryStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const updated = await categoryService.toggleCategoryStatus(req.params.id, ativo, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'TOGGLE_CATEGORY_STATUS', targetId: updated.id, ativo }, 'Status de categoria alterado');
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// função para deletar categoria (ou inativação lógica se possuir produtos vinculados)
export async function deleteCategory(req, res, next) {
  try {
    const result = await categoryService.deleteCategory(req.params.id, req.user.empresaId);
    log.info({ user: req.user?.id, empresaId: req.user.empresaId, action: 'DELETE_CATEGORY', targetId: req.params.id, result }, 'Resultado da exclusão de categoria');
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Erro ao deletar categoria');
    next(err);
  }
}
