import { childLogger } from '../config/logger.js';
import * as categoryService from '../services/categoryService.js';
const log = childLogger('categoryController');

export async function listCategories(req, res, next) {
  try {
    const cats = await categoryService.listCategories();
    res.json(cats);
  } catch (err) {
    log.error({ err }, 'Error listing categories');
    next(err);
  }
}

export async function countCategories(req, res, next) {
  try {
    const count = await categoryService.countCategories();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting categories');
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const c = await categoryService.createCategory(req.body.nome);
    res.status(201).json(c);
  } catch (err) {
    log.error({ err }, 'Error creating category');
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body.nome);
    res.json(updated);
  } catch (err) {
    log.error({ err }, 'Error updating category');
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Error deleting category');
    next(err);
  }
}
