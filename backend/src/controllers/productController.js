// arquivo responsável por controlar requisições HTTP de produtos, ajustes de estoque e operações de planilhas.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js, Pino Logger, Multer e Cloudinary SDK.
// usado por: productRoutes.js para responder aos endpoints do catálogo (/products).

// importações de logging: childLogger instancia o logger com o contexto productController.
import { childLogger } from "../config/logger.js";
// importações de serviços de catálogo: productService executa consultas, mutações, contagens e soft delete de produtos.
import * as productService from "../services/productService.js";
// importações de serviços de planilha: spreadsheetService gera planilhas Excel/CSV e importa dados em lote.
import * as spreadsheetService from "../services/productSpreadsheetService.js";
// importações de armazenamento: uploadToCloudinary e getTenantFolder gerenciam o upload de fotos de produtos em pastas isoladas.
import { uploadToCloudinary, getTenantFolder } from "../config/cloudinaryConfig.js";
// importações de escopo: resolveReadScope e resolveWriteStore validam as fronteiras de organização e filial.
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
// importações de banco de dados: prisma executa consultas diretas de conferência de filial.
import { prisma } from "../config/prismaClient.js";

// instância de logger para registro de operações de produtos
const log = childLogger("productController");

// função responsável por listar produtos de forma paginada com suporte a filtros de categoria, preço e busca textual.
//
// contexto: invocada pela rota GET /products para renderizar a tabela principal de estoque.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo parâmetros de busca, ordenação e paginação em req.query.
//   - res (Response, obrigatório): resposta HTTP para envio do JSON com os produtos e metadados.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com a lista de produtos paginada).
// erros: repassa exceções ao next(err).
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - aciona productService.listProductsPaginated com os filtros da query e o escopo da organização/loja.
// 4 - responde entregando o resultado paginado em formato JSON.
export async function listProducts(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - consulta paginada
    const result = await productService.listProductsPaginated(req.query, scope);
    // 4 - responde
    res.json(result);
  } catch (err) {
    log.error({ err, organizacaoId: req.user?.organizacaoId }, "Erro ao listar produtos");
    next(err);
  }
}

// função responsável por contar a quantidade de produtos ativos no escopo selecionado.
//
// contexto: chamada pela rota GET /products/count para exibir cartões de totais no Dashboard.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo usuário autenticado e parâmetros de escopo.
//   - res (Response, obrigatório): resposta Express com objeto contendo o total de produtos.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com { count }).
// erros: repassa ao next(err).
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - calcula a quantidade de produtos ativos via productService.countProducts(scope).
// 4 - entrega a resposta JSON com a contagem obtida.
export async function countProducts(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - obtém contagem
    const count = await productService.countProducts(scope);
    // 4 - responde
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar produtos");
    next(err);
  }
}

// função responsável por retornar indicadores consolidados de valor patrimonial em estoque e alertas de reposição.
//
// contexto: invocada pela rota GET /products/stats para alimentar gráficos e cards do Dashboard.
//
// parâmetros:
//   - req (Request, obrigatório): requisição com usuário autenticado e escopo de leitura.
//   - res (Response, obrigatório): resposta HTTP contendo métricas calculadas.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com totalEstoque, valorTotal, itensZerados e alertas).
// erros: repassa ao next(err) em caso de falha.
// efeitos colaterais: nenhum (leitura agregada).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo multitenant com resolveReadScope(req).
// 3 - processa métricas através de productService.getProductStats(scope).
// 4 - envia a resposta JSON com os indicadores patrimoniais.
export async function getProductStats(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - calcula métricas
    const stats = await productService.getProductStats(scope);
    // 4 - responde
    res.json(stats);
  } catch (err) {
    log.error({ err }, "Erro ao obter estatísticas de produtos");
    next(err);
  }
}

// função responsável por consultar os detalhes completos de um produto específico.
//
// contexto: chamada pela rota GET /products/:id ao abrir o modal de edição ou visualização de produto.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e escopo do usuário.
//   - res (Response, obrigatório): resposta HTTP com o objeto do produto.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com os dados do produto, loja, categoria e fornecedor).
// erros: repassa 404 ao next(err) se o produto não for encontrado no escopo.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura via resolveReadScope(req).
// 3 - busca o produto no banco através de productService.getProductById(req.params.id, scope).
// 4 - responde entregando o registro do produto em formato JSON.
export async function getProduct(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - busca produto
    const product = await productService.getProductById(req.params.id, scope);
    // 4 - responde
    res.json(product);
  } catch (err) {
    log.error({ err }, "Erro ao buscar produto");
    next(err);
  }
}

// função responsável por cadastrar um novo produto com upload opcional de imagem em pasta isolada no Cloudinary.
//
// contexto: invocada pela rota POST /products por usuários com permissão ADMIN ou GERENTE.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo dados do produto no corpo e arquivo de foto em req.file.
//   - res (Response, obrigatório): resposta HTTP com status 201 e dados do produto cadastrado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (responde HTTP 201 Created com o produto criado).
// erros: repassa ao next(err) se faltarem dados obrigatórios ou o upload falhar.
// efeitos colaterais: insere registro na tabela Produto no PostgreSQL, grava arquivo no Cloudinary e registra auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve a filial destino da gravação com resolveWriteStore(req).
// 3 - se houver arquivo em req.file, monta a pasta no Cloudinary via getTenantFolder e envia com uploadToCloudinary.
// 4 - aciona productService.createProduct persistindo o produto com vínculo de categoria e fornecedor.
// 5 - grava log informativo com o ID do produto criado e o usuário solicitante.
// 6 - responde com status HTTP 201 Created entregando o modelo cadastrado.
export async function createProduct(req, res, next) {
  try {
    // 2 - resolve loja de escrita
    const storeScope = await resolveWriteStore(req);
    const orgSlug = req.user.organizacaoSlug || storeScope.organizacaoId;

    // 3 - realiza upload da imagem se enviada
    let imagem = null;
    if (req.file) {
      const folder = getTenantFolder(orgSlug, storeScope.lojaSlug, "produtos");
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    // 4 - cria o produto no banco
    const product = await productService.createProduct(req.body, imagem, storeScope);

    // 5 - auditoria
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

    // 6 - responde 201
    res.status(201).json(product);
  } catch (err) {
    log.warn({ err }, "Erro ao criar produto");
    next(err);
  }
}

// função responsável por atualizar os dados de um produto existente e gerenciar a substituição de sua foto.
//
// contexto: chamada pela rota PUT /products/:id ao salvar alterações no formulário de edição de produtos.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id, corpo com novos valores e arquivo opcional em req.file.
//   - res (Response, obrigatório): resposta HTTP com o produto atualizado.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com o produto atualizado).
// erros: repassa 404 ao next(err) se o produto não for localizado.
// efeitos colaterais: atualiza campos na tabela Produto, envia nova foto ao Cloudinary e apaga foto antiga se substituída.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - determina os slugs da organização e da filial para upload no Cloudinary.
// 3 - se o usuário for ADMIN e enviou nova imagem, busca a loja real do produto alvo para manter a imagem na pasta correta.
// 4 - executa upload da nova imagem no Cloudinary se req.file estiver presente.
// 5 - invoca productService.updateProduct atualizando dados e removendo imagem antiga se solicitado.
// 6 - grava log de auditoria e responde entregando o produto modificado em JSON.
export async function updateProduct(req, res, next) {
  try {
    // 2 e 3 - resolve pasta correta do produto no storage
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

    // 4 - processa upload da nova mídia
    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(orgSlug, storeSlugForMedia, "produtos");
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }

    // 5 - executa atualização no serviço
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

    // 6 - auditoria e resposta
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

// função responsável por alterar a situação de ativação lógica de um produto (Soft Delete reversível).
//
// contexto: invocada pela rota PATCH /products/:id/status para inativação ou reativação de produtos no catálogo.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.ativo.
//   - res (Response, obrigatório): resposta HTTP com o modelo modificado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o produto e seu novo status).
// erros: repassa ao next(err) se o produto não pertencer à filial do usuário.
// efeitos colaterais: atualiza coluna ativo na tabela Produto no PostgreSQL.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai o booleano ativo de req.body.
// 3 - aciona productService.toggleProductStatus aplicando as restrições de tenant.
// 4 - entrega a resposta JSON com o produto atualizado.
export async function toggleProductStatus(req, res, next) {
  try {
    // 2 - extrai flag de ativação
    const { ativo } = req.body;
    // 3 - alterna status no serviço
    const product = await productService.toggleProductStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    // 4 - responde
    res.json(product);
  } catch (err) {
    log.error({ err }, "Erro ao alterar status do produto");
    next(err);
  }
}

// função responsável por excluir fisicamente ou aplicar Soft Delete automático em produto com histórico de vendas.
//
// contexto: chamada pela rota DELETE /products/:id (exclusiva para ADMIN do estabelecimento).
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e organizacaoId do administrador logado.
//   - res (Response, obrigatório): resposta HTTP com o resultado da operação.
//   - next (NextFunction, obrigatório): função de repasse de erro.
//
// retorno: nenhum (envia JSON indicando se houve soft delete ou exclusão definitiva).
// erros: repassa ao next(err) se o produto não for localizado.
// efeitos colaterais: inativa logicamente o produto OU deleta fisicamente o registro e apaga a foto do Cloudinary.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona productService.deleteProduct com o ID do produto e a organização do ADMIN.
// 3 - grava log de auditoria informando o desfecho da exclusão.
// 4 - entrega a resposta JSON com a mensagem e dados do produto.
export async function deleteProduct(req, res, next) {
  try {
    // 2 - executa exclusão inteligente no service
    const result = await productService.deleteProduct(req.params.id, req.user.organizacaoId);
    // 3 - auditoria
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
    // 4 - responde
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao excluir produto");
    next(err);
  }
}

// função responsável por realizar ajuste rápido de saldo em estoque gerando lançamento auditável no livro-razão.
//
// contexto: invocada pela rota POST /products/:id/adjust para reposição manual rápida ou descarte de avaria.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo quantidade, tipo (ENTRADA/SAIDA), observação e cabeçalho de idempotência.
//   - res (Response, obrigatório): resposta HTTP com o modelo atualizado e a movimentação criada.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com o produto e a movimentação associada).
// erros: repassa ao next(err) se o saldo for insuficiente em saídas ou quantidade for inválida.
// efeitos colaterais: atualiza quantidade do produto e insere linha na tabela Movimento com snapshot do operador.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai a chave de idempotência de headers ou corpo da requisição.
// 3 - executa o ajuste atômico via productService.adjustProductQuantity.
// 4 - responde entregando o registro atualizado em formato JSON.
export async function adjustQuantity(req, res, next) {
  try {
    // 2 - extrai chave de idempotência
    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body.idempotencyKey;

    // 3 - realiza ajuste atômico no service
    const result = await productService.adjustProductQuantity(
      req.params.id,
      req.body.quantidade,
      req.body.tipo,
      req.user,
      req.body.observacao,
      idempotencyKey
    );

    // 4 - responde
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao ajustar quantidade");
    next(err);
  }
}

// função responsável por exportar a listagem de produtos do catálogo nos formatos Excel (.xlsx) ou CSV (.csv).
//
// contexto: chamada pela rota GET /products/export para download de relatórios de estoque da organização ou filial.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo parâmetros de consulta (format, status) e escopo de leitura.
//   - res (Response, obrigatório): resposta HTTP configurada com cabeçalhos de download e buffer binário.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia stream de arquivo binário para download no navegador).
// erros: repassa ao next(err) em caso de erro na geração da planilha.
// efeitos colaterais: nenhum (leitura e geração de buffer em memória).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura multitenant com resolveReadScope(req).
// 3 - extrai o formato desejado (xlsx ou csv) e o filtro de status de req.query.
// 4 - gera a planilha através de spreadsheetService.exportProductsSpreadsheet.
// 5 - define os cabeçalhos Content-Type e Content-Disposition com o nome do arquivo.
// 6 - despacha o buffer do arquivo na resposta HTTP com res.send(buffer).
export async function exportProducts(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - extrai formato
    const { format = "xlsx", status = "ativos" } = req.query;
    // 4 - gera planilha
    const { buffer, filename, contentType } = await spreadsheetService.exportProductsSpreadsheet(
      scope,
      req.user.organizacaoSlug,
      format,
      status
    );

    // 5 e 6 - define headers e envia buffer
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err }, "Erro ao exportar planilha de produtos");
    next(err);
  }
}

// função responsável por gerar e fornecer para download a planilha modelo oficial (.xlsx ou .csv) para importação em lote.
//
// contexto: invocada pela rota GET /products/import/template para orientar usuários no preenchimento de planilhas.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo o formato solicitado em req.query.format.
//   - res (Response, obrigatório): resposta HTTP com o arquivo anexado.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (transmite o buffer do template gerado via HTTP).
// erros: repassa ao next(err) se houver falha.
// efeitos colaterais: nenhum (geração de modelo em memória).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai o formato solicitado de req.query.format (padrão 'xlsx').
// 3 - gera a planilha modelo oficial através de spreadsheetService.generateImportTemplate(format).
// 4 - define cabeçalhos HTTP de download e transmite o buffer via res.send(buffer).
export async function downloadImportTemplate(req, res, next) {
  try {
    // 2 - extrai formato
    const { format = "xlsx" } = req.query;
    // 3 - gera template com colunas e validações de dados
    const { buffer, filename, contentType } = await spreadsheetService.generateImportTemplate(format);

    // 4 - configura headers e transmite
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    log.error({ err }, "Erro ao gerar planilha modelo");
    next(err);
  }
}

// função responsável por processar a prévia (preview) ou gravação definitiva (commit) de produtos a partir de planilha.
//
// contexto: chamada pela rota POST /products/import após envio de arquivo .xlsx ou .csv pelo formulário de importação.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.file com o buffer da planilha e modo na query/body.
//   - res (Response, obrigatório): resposta HTTP com o relatório de linhas processadas e erros identificados.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o resumo de produtos criados, atualizados ou erros encontrados).
// erros: repassa ao next(err) em caso de falha de parsing.
// efeitos colaterais: insere ou atualiza produtos na tabela Produto quando executada no modo commit.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve a loja de destino da importação através de resolveWriteStore(req).
// 3 - identifica o modo de execução ('preview' ou 'commit').
// 4 - executa a validação e processamento no spreadsheetService.importProductsSpreadsheet.
// 5 - se executada no modo commit com erros impeditivos, responde HTTP 400 com o detalhamento dos erros por linha.
// 6 - em caso de sucesso, responde com status HTTP 201 (commit) ou 200 (preview) entregando o relatório da importação.
export async function importProducts(req, res, next) {
  try {
    // 2 - resolve loja de gravação
    const storeScope = await resolveWriteStore(req);
    // 3 - extrai modo
    const mode = req.query.mode || req.body?.mode || "commit";
    // 4 - processa a planilha
    const result = await spreadsheetService.importProductsSpreadsheet(
      req.file?.buffer,
      req.file?.originalname,
      storeScope,
      mode
    );

    // 5 - rejeita caso o commit contenha erros estruturais
    if (result.mode === "commit" && result.hasErrors) {
      return res.status(400).json({ error: result.message, ...result });
    }

    // 6 - responde com o relatório consolidado
    res.status(result.mode === "commit" ? 201 : 200).json(result);
  } catch (err) {
    log.error({ err }, "Erro ao importar planilha de produtos");
    next(err);
  }
}
