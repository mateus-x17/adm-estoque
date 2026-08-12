import { childLogger } from '../config/logger.js';
import * as categoryService from '../services/categoryService.js';
const log = childLogger('categoryController');

// função para listar todas as categorias
// 1 - Recebe req, res, next
// 2 - Chama o serviço categoryService.listCategories para obter a lista completa
// 3 - Retorna os dados em formato JSON
// 4 - Em caso de erro, usa o logger (childLogger) para registrar a falha e encaminha via next()
export async function listCategories(req, res, next) {
  try {
    const cats = await categoryService.listCategories();
    res.json(cats);
  } catch (err) {
    log.error({ err }, 'Error listing categories');
    next(err);
  }
}

// função para contar o total de categorias cadastradas
// 1 - Solicita a contagem ao serviço
// 2 - Retorna um objeto JSON com a propriedade "count"
export async function countCategories(req, res, next) {
  try {
    const count = await categoryService.countCategories();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting categories');
    next(err);
  }
}

// função para criar uma nova categoria
// 1 - Puxa o "nome" do corpo da requisição e envia ao serviço createCategory
// 2 - O serviço cria no banco e devolve o objeto criado
// 3 - Registra a ação (CREATE_CATEGORY) no log, incluindo o id do usuário que executou
// 4 - Retorna status 201 (Created) com os dados recém criados
export async function createCategory(req, res, next) {
  try {
    const c = await categoryService.createCategory(req.body.nome);
    log.info({ user: req.user?.id, action: 'CREATE_CATEGORY', targetId: c.id }, 'User created a category');
    res.status(201).json(c);
  } catch (err) {
    log.error({ err }, 'Error creating category');
    next(err);
  }
}

// função para atualizar uma categoria existente
// 1 - Obtém o ID da rota (req.params.id) e o novo nome do corpo (req.body.nome)
// 2 - Chama o serviço de atualização e aguarda a resposta
// 3 - Registra o log de sucesso (UPDATE_CATEGORY)
// 4 - Retorna os dados atualizados
export async function updateCategory(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body.nome);
    log.info({ user: req.user?.id, action: 'UPDATE_CATEGORY', targetId: updated.id }, 'User updated a category');
    res.json(updated);
  } catch (err) {
    log.error({ err }, 'Error updating category');
    next(err);
  }
}

// função para deletar uma categoria
// 1 - Extrai o ID da rota (req.params.id)
// 2 - Chama o serviço de deleção
// 3 - Registra a ação destrutiva no log
// 4 - Retorna sucesso simples { ok: true }
export async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    log.info({ user: req.user?.id, action: 'DELETE_CATEGORY', targetId: req.params.id }, 'User deleted a category');
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Error deleting category');
    next(err);
  }
}
