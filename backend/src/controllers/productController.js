import { childLogger } from "../config/logger.js";
import * as productService from "../services/productService.js";
import * as spreadsheetService from "../services/productSpreadsheetService.js";
import { uploadToCloudinary, getTenantFolder } from "../config/cloudinaryConfig.js";
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
import { prisma } from "../config/prismaClient.js";
const log = childLogger("productController");

// arquivo responsável por controlar requisições HTTP de produtos, ajustes rápidos e planilhas

// função para listar produtos no escopo selecionado (rede inteira ou loja específica)
export async function listProducts(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const result = await productService.listProductsPaginated(req.query, scope);
    res.json(result);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar produtos");
    next(err);
  }
}

// função para contar produtos ativos no escopo selecionado
export async function countProducts(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const count = await productService.countProducts(scope);
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar produtos");
    next(err);
  }
}

// função para consultar estatísticas de patrimônio e baixo estoque
export async function getProductStats(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const stats = await productService.getProductStats(scope);
    res.json(stats);
  } catch (err) {
    log.error({ err }, "Erro ao obter estatísticas de produtos");
    next(err);
  }
}

// função para obter detalhes de um produto dentro do escopo do usuário
export async function getProduct(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const product = await productService.getProductById(req.params.id, scope);
    res.json(product);
  } catch (err) {
    log.error({ err }, "Erro ao buscar produto");
    next(err);
  }
}

// função para cadastrar produto na loja alvo com upload isolado em pasta da Organização/Loja no Cloudinary
export async function createProduct(req, res, next) {
  try {
    const storeScope = await resolveWriteStore(req);
    const orgSlug = req.user.organizacaoSlug || storeScope.organizacaoId;

    let imagem = null;
    if (req.file) {
      const folder = getTenantFolder(orgSlug, storeScope.lojaSlug, "produtos");
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    const product = await productService.createProduct(req.body, imagem, storeScope);
    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_PRODUCT",
        targetId: product.id,
      },
      "Produto criado"
    );
    res.status(201).json(product);
  } catch (err) {
    log.warn({ err }, "Erro ao criar produto");
    next(err);
  }
}

// função para atualizar produto garantindo upload na subpasta da própria loja do produto
export async function updateProduct(req, res, next) {
  try {
    const orgSlug = req.user.organizacaoSlug || req.user.organizacaoId;
    let storeSlugForMedia = req.user.lojaSlug || "geral";

    if (req.file && req.user.role === "ADMIN") {
      const targetProd = await prisma.produto.findFirst({
        where: { id: Number(req.params.id), organizacaoId: Number(req.user.organizacaoId) },
        include: { loja: { select: { slug: true } } },
      });
      if (targetProd?.loja?.slug) {
        storeSlugForMedia = targetProd.loja.slug;
      }
    }

    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(orgSlug, storeSlugForMedia, "produtos");
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }

    const removeImage = req.body.removerImagem === "true";
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      newImagePath,
      removeImage,
      {
        organizacaoId: req.user.organizacaoId,
        lojaId: req.user.lojaId,
        restrictToUserStore: req.user.role !== "ADMIN",
      }
    );

    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "UPDATE_PRODUCT",
        targetId: product.id,
      },
      "Produto atualizado"
    );
    res.json(product);
  } catch (err) {
    log.warn({ err }, "Erro ao atualizar produto");
    next(err);
  }
}

// função para inativar ou reativar logicamente um produto (Soft Delete)
export async function toggleProductStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const product = await productService.toggleProductStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    res.json(product);
  } catch (err) {
    log.error({ err }, "Erro ao alterar status do produto");
    next(err);
  }
}

// função exclusiva de ADMIN para excluir ou aplicar Soft Delete automático em um produto
export async function deleteProduct(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.organizacaoId);
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "DELETE_PRODUCT",
        targetId: req.params.id,
        result,
      },
      "Resultado exclusão/inativação de produto"
    );
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao excluir produto");
    next(err);
  }
}

// função para ajuste unitário rápido de estoque (gera registro no livro-razão com snapshot de vendedor)
export async function adjustQuantity(req, res, next) {
  try {
    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body.idempotencyKey;

    const result = await productService.adjustProductQuantity(
      req.params.id,
      req.body.quantidade,
      req.body.tipo,
      req.user,
      req.body.observacao,
      idempotencyKey
    );

    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao ajustar quantidade");
    next(err);
  }
}

// função para exportar catálogo do escopo atual em .xlsx ou .csv
export async function exportProducts(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const { format = "xlsx", status = "ativos" } = req.query;
    const { buffer, filename, contentType } = await spreadsheetService.exportProductsSpreadsheet(
      scope,
      req.user.organizacaoSlug,
      format,
      status
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err }, "Erro ao exportar planilha de produtos");
    next(err);
  }
}

// função para gerar e baixar a planilha modelo oficial (.xlsx ou .csv)
export async function downloadImportTemplate(req, res, next) {
  try {
    const { format = "xlsx" } = req.query;
    const { buffer, filename, contentType } = await spreadsheetService.generateImportTemplate(format);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err }, "Erro ao gerar planilha modelo");
    next(err);
  }
}

// função para validar (preview) ou importar atomicamente (commit) planilhas de produtos na loja alvo
export async function importProducts(req, res, next) {
  try {
    const storeScope = await resolveWriteStore(req);
    const mode = req.query.mode || req.body?.mode || "commit";
    const result = await spreadsheetService.importProductsSpreadsheet(
      req.file?.buffer,
      req.file?.originalname,
      storeScope,
      mode
    );

    if (result.mode === "commit" && result.hasErrors) {
      return res.status(400).json({ error: result.message, ...result });
    }

    res.status(result.mode === "commit" ? 201 : 200).json(result);
  } catch (err) {
    log.error({ err }, "Erro ao importar planilha de produtos");
    next(err);
  }
}
