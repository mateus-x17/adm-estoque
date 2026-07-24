import { childLogger } from '../config/logger.js';
import * as productService from '../services/productService.js';
import { uploadToCloudinary } from '../config/cloudinaryConfig.js';
const log = childLogger('productController');

export async function listProducts(req, res, next) {
  try {
    const result = await productService.listProductsPaginated(req.query);
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Error listing products');
    next(err);
  }
}

export async function countProducts(req, res, next) {
  try {
    const count = await productService.countProducts();
    res.json({ count });
  } catch (err) {
    log.error({ err }, 'Error counting products');
    next(err);
  }
}

export async function getProductStats(req, res, next) {
  try {
    const stats = await productService.getProductStats();
    res.json(stats);
  } catch (err) {
    log.error({ err }, 'Error getting product stats');
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    log.error({ err }, 'Error getting product');
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    let imagem = null;
    if (req.file) {
      imagem = await uploadToCloudinary(req.file.path, "ADM-estoque/produtos");
    }
    const product = await productService.createProduct(req.body, imagem);
    res.status(201).json(product);
  } catch (err) {
    log.warn({ err }, 'Error creating product');
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    let newImagePath = null;
    if (req.file) {
      newImagePath = await uploadToCloudinary(req.file.path, "ADM-estoque/produtos");
    }
    const removeImage = req.body.removerImagem === "true";
    const product = await productService.updateProduct(req.params.id, req.body, newImagePath, removeImage);
    res.json(product);
  } catch (err) {
    log.warn({ err }, 'Error updating product');
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Error deleting product');
    next(err);
  }
}

export async function adjustQuantity(req, res, next) {
  try {
    const result = await productService.adjustProductQuantity(
      req.params.id,
      req.body.quantidade,
      req.body.tipo,
      req.user.id,
      req.body.observacao
    );
    res.json(result);
  } catch (err) {
    log.error({ err }, 'Error adjusting quantity');
    next(err);
  }
}
