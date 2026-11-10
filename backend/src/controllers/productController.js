import { childLogger } from '../config/logger.js';
import * as productService from '../services/productService.js';
import * as spreadsheetService from '../services/productSpreadsheetService.js';
import { uploadToCloudinary, getTenantFolder } from '../config/cloudinaryConfig.js';
const log = childLogger('productController');

// arquivo responsável por controlar as requisições HTTP de produtos, movimentações e planilhas isoladas por loja

// função para listar produtos do estabelecimento com filtros, paginação e filtro de status
// 1 - Extrai os query params (page, limit, search, sortPrice, categoriaId, status)
// 2 - Chama productService.listProductsPaginated garantindo isolamento pelo empresaId do token
// 3 - Retorna os produtos encontrados com metadados de paginação
export async function listProducts(req, res, next) {
  try {
    const result = await productService.listProductsPaginated(req.query, req.user.empresaId);
    res.json(result);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao listar produtos');
    next(err);
  }
}

// função para contar o total de produtos ativos cadastrados na loja
// 1 - Invoca productService.countProducts passando req.user.empresaId
// 2 - Retorna objeto JSON com o campo count
export async function countProducts(req, res, next) {
  try {
    const count = await productService.countProducts(req.user.empresaId);
    res.json({ count });
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao contar produtos');
    next(err);
  }
}

// função para obter macroestatísticas de estoque e patrimônio da loja ativa
// 1 - Invoca productService.getProductStats filtrando pelo empresaId da sessão
// 2 - Devolve totais, itens em estoque crítico e patrimônio total calculado no PostgreSQL
export async function getProductStats(req, res, next) {
  try {
    const stats = await productService.getProductStats(req.user.empresaId);
    res.json(stats);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao obter estatísticas de produtos');
    next(err);
  }
}

// função para buscar um produto específico pelo ID dentro da loja atual
// 1 - Repassa req.params.id e req.user.empresaId ao serviço
// 2 - Devolve JSON do produto ou erro 404 caso não pertença ao tenant
export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id, req.user.empresaId);
    res.json(product);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao buscar produto');
    next(err);
  }
}

// função para criar um novo produto com upload isolado na pasta dedicada da loja no Cloudinary
// 1 - Monta a pasta dedicada do tenant ('estoque-os/lojas/<slug>/produtos') via getTenantFolder
// 2 - Realiza upload da imagem se houver req.file
// 3 - Cria o produto vinculado ao empresaId do usuário autenticado e retorna status 201
export async function createProduct(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const tenantSlug = req.user.empresaSlug || empresaId;

    let imagem = null;
    if (req.file) {
      const folder = getTenantFolder(tenantSlug, 'produtos');
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    const product = await productService.createProduct(req.body, imagem, empresaId);
    log.info(
      { user: req.user?.id, empresaId, action: 'CREATE_PRODUCT', targetId: product.id },
      'Produto criado no estabelecimento'
    );
    res.status(201).json(product);
  } catch (err) {
    log.warn({ err, empresaId: req.user?.empresaId }, 'Erro ao criar produto');
    next(err);
  }
}

// função para atualizar um produto existente dentro do estabelecimento
// 1 - Faz upload de eventual nova imagem na subpasta dedicada da loja no Cloudinary
// 2 - Repassa dados, flag removerImagem e empresaId para o serviço
// 3 - Retorna o produto atualizado
export async function updateProduct(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const tenantSlug = req.user.empresaSlug || empresaId;

    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(tenantSlug, 'produtos');
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }

    const removeImage = req.body.removerImagem === 'true';
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      newImagePath,
      removeImage,
      empresaId
    );
    log.info(
      { user: req.user?.id, empresaId, action: 'UPDATE_PRODUCT', targetId: product.id },
      'Produto atualizado'
    );
    res.json(product);
  } catch (err) {
    log.warn({ err, empresaId: req.user?.empresaId }, 'Erro ao atualizar produto');
    next(err);
  }
}

// função para inativar ou reativar logicamente um produto da loja (Soft Delete)
// 1 - Extrai a flag ativo do corpo da requisição e o empresaId do token
// 2 - Chama productService.toggleProductStatus e registra log de auditoria
export async function toggleProductStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    const product = await productService.toggleProductStatus(
      req.params.id,
      ativo,
      req.user.empresaId
    );
    log.info(
      { user: req.user?.id, empresaId: req.user.empresaId, action: 'TOGGLE_PRODUCT_STATUS', targetId: product.id, ativo },
      'Status do produto alterado'
    );
    res.json(product);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao alterar status do produto');
    next(err);
  }
}

// função para excluir um produto (ou aplicar Soft Delete automático caso haja movimentações)
// 1 - Repassa req.params.id e req.user.empresaId ao serviço deleteProduct
// 2 - Retorna payload indicando se foi exclusão definitiva ou inativação lógica
export async function deleteProduct(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.empresaId);
    log.info(
      { user: req.user?.id, empresaId: req.user.empresaId, action: 'DELETE_PRODUCT', targetId: req.params.id, result },
      'Resultado exclusão/inativação de produto'
    );
    res.json(result);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao excluir produto');
    next(err);
  }
}

// função para realizar movimentação de estoque (reposição ou venda) com controle transacional por loja
// 1 - Extrai chave de idempotência opcional dos cabeçalhos ou corpo
// 2 - Aciona adjustProductQuantity com id, quantidade, tipo, usuarioId, observacao, idempotencyKey e empresaId
// 3 - Registra auditoria e retorna o novo saldo e movimentação gerada
export async function adjustQuantity(req, res, next) {
  try {
    const idempotencyKey =
      req.headers['idempotency-key'] ||
      req.headers['x-idempotency-key'] ||
      req.body.idempotencyKey;

    const result = await productService.adjustProductQuantity(
      req.params.id,
      req.body.quantidade,
      req.body.tipo,
      req.user.id,
      req.body.observacao,
      idempotencyKey,
      req.user.empresaId
    );
    log.info(
      {
        user: req.user?.id,
        empresaId: req.user.empresaId,
        action: 'ADJUST_PRODUCT_QUANTITY',
        targetId: req.params.id,
        quantity: req.body.quantidade,
        type: req.body.tipo,
      },
      'Movimentação de estoque registrada'
    );
    res.json(result);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao ajustar quantidade');
    next(err);
  }
}

// função para exportar o catálogo de produtos do estabelecimento em formato .xlsx ou .csv
// 1 - Lê format ('xlsx' | 'csv') e status ('ativos' | 'inativos' | 'todos') da query string
// 2 - Gera o buffer da planilha isolada para o empresaId da sessão
// 3 - Configura headers de Content-Type e Content-Disposition e envia o arquivo binário
export async function exportProducts(req, res, next) {
  try {
    const { format = 'xlsx', status = 'ativos' } = req.query;
    const { buffer, filename, contentType, totalExported } =
      await spreadsheetService.exportProductsSpreadsheet(
        req.user.empresaId,
        req.user.empresaSlug,
        format,
        status
      );

    log.info(
      { user: req.user?.id, empresaId: req.user.empresaId, action: 'EXPORT_PRODUCTS', format, totalExported },
      'Catálogo exportado em planilha'
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao exportar planilha de produtos');
    next(err);
  }
}

// função para gerar e baixar a planilha modelo de importação (.xlsx ou .csv)
// 1 - Lê format opcional da query string ('xlsx' padrão ou 'csv')
// 2 - Gera arquivo exemplo pronto para preenchimento e devolve para download HTTP
export async function downloadImportTemplate(req, res, next) {
  try {
    const { format = 'xlsx' } = req.query;
    const { buffer, filename, contentType } = await spreadsheetService.generateImportTemplate(format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err }, 'Erro ao gerar planilha modelo');
    next(err);
  }
}

// função para processar importação de produtos em lote via planilha (.xlsx ou .csv)
// 1 - Recebe o arquivo carregado em memória pelo Multer (req.file) e o modo ('preview' | 'commit')
// 2 - Valida e processa os dados isoladamente dentro do empresaId do usuário autenticado
// 3 - Devolve status 400 com lista detalhada de linhas inválidas caso o commit detecte erros
// 4 - Em caso de sucesso no preview ou commit, devolve o resumo JSON da operação
export async function importProducts(req, res, next) {
  try {
    const mode = req.query.mode || req.body?.mode || 'commit';
    const result = await spreadsheetService.importProductsSpreadsheet(
      req.file?.buffer,
      req.file?.originalname,
      req.user.empresaId,
      mode
    );

    if (result.mode === 'commit' && result.hasErrors) {
      return res.status(400).json({
        error: result.message,
        ...result,
      });
    }

    log.info(
      {
        user: req.user?.id,
        empresaId: req.user.empresaId,
        action: result.mode === 'preview' ? 'PREVIEW_IMPORT_PRODUCTS' : 'IMPORT_PRODUCTS',
        totalRows: result.totalRows,
        createdCount: result.createdCount || 0,
      },
      'Processamento de importação de planilha concluído'
    );

    res.status(result.mode === 'commit' ? 201 : 200).json(result);
  } catch (err) {
    log.error({ err, empresaId: req.user?.empresaId }, 'Erro ao importar planilha de produtos');
    next(err);
  }
}
