import { childLogger } from '../config/logger.js';
import * as productService from '../services/productService.js';
import { uploadToCloudinary } from '../config/cloudinaryConfig.js';
const log = childLogger('productController');

// função para listar produtos com filtros e paginação
// 1 - Recebe req, res, next
// 2 - Chama o serviço passando os query params (busca, categoria, paginação)
// 3 - Retorna os dados ao cliente
export async function listProducts(req, res, next) {
  try {
    const result = await productService.listProductsPaginated(req.query);
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Error listing products');
    next(err);
  }
}

// função para contar o total de produtos cadastrados
// 1 - Chama o serviço respectivo
// 2 - Retorna um objeto JSON contendo o campo "count"
export async function countProducts(req, res, next) {
  try {
    const count = await productService.countProducts();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting products');
    next(err);
  }
}

// função para obter estatísticas do estoque (valor total, contagem de ativos, etc)
// 1 - Invoca o serviço que calcula as estatísticas de produto
// 2 - Retorna os dados sumarizados
export async function getProductStats(req, res, next) {
  try {
    const stats = await productService.getProductStats();
    res.json(stats);
  } catch (err) {
    log.error({ err }, 'Error getting product stats');
    next(err);
  }
}

// função para buscar um produto específico pelo ID
// 1 - Extrai o ID dos parâmetros da rota (req.params.id)
// 2 - Solicita ao serviço os dados daquele produto
// 3 - Retorna os dados em formato JSON
export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    log.error({ err }, 'Error getting product');
    next(err);
  }
}

// função para criar um novo produto
// 1 - Verifica se foi enviado um arquivo (imagem) através do req.file (gerado pelo Multer)
// 2 - Se houver imagem, faz o upload para o Cloudinary na pasta específica
// 3 - Chama o serviço passando os dados do corpo (req.body) e a URL da imagem (se houver)
// 4 - Registra a ação bem-sucedida e retorna status 201
export async function createProduct(req, res, next) {
  try {
    let imagem = null;
    if (req.file) { // arquivo processado pelo multer
      imagem = await uploadToCloudinary(req.file.path, "ADM-estoque/produtos");
    }
    const product = await productService.createProduct(req.body, imagem);
    log.info({ user: req.user?.id, action: 'CREATE_PRODUCT', targetId: product.id }, 'User created a product');
    res.status(201).json(product);
  } catch (err) {
    log.warn({ err }, 'Error creating product');
    next(err);
  }
}

// função para atualizar os dados de um produto existente
// 1 - Verifica se uma nova imagem foi enviada; se sim, faz upload para o Cloudinary
// 2 - Verifica se há flag "removerImagem" vinda do frontend (quando o usuário clica para apagar a foto)
// 3 - Chama o serviço passando os dados e as informações sobre as imagens
// 4 - Retorna o produto atualizado
export async function updateProduct(req, res, next) {
  try {
    let newImagePath = null;
    if (req.file) {
      newImagePath = await uploadToCloudinary(req.file.path, "ADM-estoque/produtos");
    }
    const removeImage = req.body.removerImagem === "true";
    const product = await productService.updateProduct(req.params.id, req.body, newImagePath, removeImage);
    log.info({ user: req.user?.id, action: 'UPDATE_PRODUCT', targetId: product.id }, 'User updated a product');
    res.json(product);
  } catch (err) {
    log.warn({ err }, 'Error updating product');
    next(err);
  }
}

// função para excluir um produto do banco de dados
// 1 - Obtém o ID da rota
// 2 - Solicita exclusão ao serviço (que possivelmente cuidará de checar se pode excluir e de apagar a imagem da nuvem)
// 3 - Retorna { ok: true }
export async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    log.info({ user: req.user?.id, action: 'DELETE_PRODUCT', targetId: req.params.id }, 'User deleted a product');
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Error deleting product');
    next(err);
  }
}

// função para realizar uma movimentação manual (ajuste) de estoque
// 1 - Recebe ID do produto via rota
// 2 - Recebe quantidade, tipo (ENTRADA/SAIDA) e observação via corpo da requisição
// 3 - Usa o req.user.id injetado pelo middleware de autenticação para vincular a quem fez a ação
// 4 - Chama o serviço responsável por descontar/adicionar no estoque do produto e registrar o log de movimentação simultaneamente
// 5 - Retorna o resultado
export async function adjustQuantity(req, res, next) {
  try {
    const result = await productService.adjustProductQuantity(
      req.params.id,
      req.body.quantidade,
      req.body.tipo,
      req.user.id,
      req.body.observacao
    );
    log.info({ user: req.user?.id, action: 'ADJUST_PRODUCT_QUANTITY', targetId: req.params.id, quantity: req.body.quantidade, type: req.body.tipo }, 'User adjusted product quantity');
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Error adjusting quantity');
    next(err);
  }
}
