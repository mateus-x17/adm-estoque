// arquivo responsável por controlar requisições HTTP do módulo de Multipedidos, anexação de comprovantes e cancelamento com estorno de estoque.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js, Pino Logger e Cloudinary SDK.
// usado por: orderRoutes.js para responder aos endpoints de pedidos (/orders).

// importações de logging: childLogger instancia logger contextualizado com módulo orderController.
import { childLogger } from "../config/logger.js";
// importações de serviços: orderService encapsula a lógica transacional atômica de criação de pedidos e movimentações.
import * as orderService from "../services/orderService.js";
// importações de escopo: resolveReadScope e resolveWriteStore garantem isolamento de filial e organização.
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";
// importações de upload: getTenantFolder e uploadToCloudinary gerenciam pastas e transferências de comprovantes para a nuvem.
import { getTenantFolder, uploadToCloudinary } from "../config/cloudinaryConfig.js";

// instância de logger para registro de criação e cancelamento de pedidos
const log = childLogger("orderController");

// função responsável por fazer upload do arquivo de comprovante (imagem ou PDF) para o Cloudinary ou salvar caminho local.
//
// contexto: função auxiliar interna chamada durante a criação ou atualização de comprovantes de pagamento de pedidos.
//
// parâmetros:
//   - file (objeto Express.Multer.File|null, opcional): arquivo intermediário interceptado pelo Multer.
//   - req (Request, obrigatório): requisição contendo dados do usuário autenticado.
//   - storeScope (objeto, obrigatório): escopo contendo organizacaoId, lojaId e slugs correspondentes.
//
// retorno: string contendo a URL pública segura do Cloudinary, o caminho relativo local (/uploads/comprovantes/...) ou null.
// erros: nenhum (propaga erro caso o upload no Cloudinary falhe).
// efeitos colaterais: transfere arquivo para o storage remoto ou preserva no disco local.
//
// passo a passo:
// 1 - recebe file, req e storeScope.
// 2 - retorna null se file for nulo ou indefinido.
// 3 - verifica se as credenciais do Cloudinary estão configuradas no ambiente.
// 4 - se configurado, resolve a pasta hierárquica da loja via getTenantFolder e envia com uploadToCloudinary.
// 5 - caso não configurado, retorna o caminho local formatado como `/uploads/comprovantes/${file.filename}`.
async function resolveProofUrl(file, req, storeScope) {
  // 2 - encerra se não houver arquivo
  if (!file) return null;
  // 3 - detecta presença do Cloudinary
  const hasCloud =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  // 4 - despacha para nuvem
  if (hasCloud) {
    const folder = getTenantFolder(
      req.user.organizacaoSlug || storeScope.organizacaoId,
      storeScope.lojaSlug || storeScope.lojaId,
      "comprovantes"
    );
    return uploadToCloudinary(file.path, folder);
  }
  // 5 - fallback para disco local
  return `/uploads/comprovantes/${file.filename}`;
}

// função responsável por listar pedidos paginados respeitando as permissões do usuário e o escopo da organização/loja.
//
// contexto: invocada pela rota GET /orders; colaboradores com papel OPERADOR recebem apenas seus próprios pedidos.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo query params (page, limit, search, status, tipo, startDate, endDate).
//   - res (Response, obrigatório): resposta HTTP para envio do JSON com pedidos e metadados de paginação.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com a lista de pedidos paginada).
// erros: repassa ao next(err) em caso de erro.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - invoca orderService.listOrdersPaginated passando query, scope e o usuário logado.
// 4 - responde entregando o resultado paginado em formato JSON.
export async function listOrders(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - consulta paginada
    const result = await orderService.listOrdersPaginated(req.query, scope, req.user);
    // 4 - devolve pedidos
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao listar pedidos");
    next(err);
  }
}

// função responsável por obter os detalhes completos de um pedido específico incluindo seus itens e histórico.
//
// contexto: chamada pela rota GET /orders/:id ao abrir o modal ou tela de detalhes de um pedido.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e usuário autenticado.
//   - res (Response, obrigatório): resposta Express para entrega dos dados do pedido.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com os dados do pedido).
// erros: repassa 404 ao next(err) se o pedido não existir ou 403 se o OPERADOR tentar acessar pedido alheio.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - consulta o pedido através de orderService.getOrderById(req.params.id, scope, req.user).
// 4 - envia a resposta JSON com o pedido completo e seus itens associados.
export async function getOrder(req, res, next) {
  try {
    // 2 - resolve escopo multitenant
    const scope = await resolveReadScope(req);
    // 3 - consulta detalhes
    const order = await orderService.getOrderById(req.params.id, scope, req.user);
    // 4 - entrega resposta
    res.json(order);
  } catch (err) {
    log.error({ err }, "Erro ao buscar detalhes do pedido");
    next(err);
  }
}

// função responsável por criar um pedido com múltiplos itens e atualizar estoques e livro-razão de forma atômica.
//
// contexto: chamada pela rota POST /orders no fechamento de vendas, reposições de fornecedores ou saídas manuais.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo corpo com itens, tipo, formaPagamento, comprovante opcional e cabeçalho de idempotência.
//   - res (Response, obrigatório): resposta HTTP com status 201 e dados do pedido gerado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (responde HTTP 201 Created com o pedido consolidado).
// erros: repassa ao next(err) se houver estoque insuficiente, produtos inativos ou falha na transação.
// efeitos colaterais: insere registros em Pedido, ItemPedido e Movimento e altera quantidades na tabela Produto.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - valida a filial de destino através de resolveWriteStore(req, req.body?.lojaId).
// 3 - extrai chave de idempotência de headers ou corpo.
// 4 - processa upload do comprovante anexado via resolveProofUrl.
// 5 - executa a criação atômica no banco através de orderService.createOrder.
// 6 - grava log de auditoria com o código do pedido, valor total e usuário vendedor.
// 7 - responde com status HTTP 201 Created entregando o pedido registrado.
export async function createOrder(req, res, next) {
  try {
    // 2 - resolve loja de gravação
    const storeScope = await resolveWriteStore(req, req.body?.lojaId);
    // 3 - extrai chave de idempotência
    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body?.idempotencyKey;

    // 4 - processa comprovante se houver
    const comprovanteUrl = await resolveProofUrl(req.file, req, storeScope);

    // 5 - cria pedido atômico
    const order = await orderService.createOrder(
      {
        ...req.body,
        ...(comprovanteUrl ? { comprovanteUrl } : {}),
      },
      req.user,
      storeScope,
      idempotencyKey
    );

    // 6 - auditoria de pedido
    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_ORDER",
        orderId: order.id,
        codigo: order.codigo,
        valorTotal: order.valorTotal,
      },
      "Pedido multi-item criado com sucesso"
    );

    // 7 - responde com 201
    res.status(201).json(order);
  } catch (err) {
    log.warn({ err }, "Erro ao criar pedido multi-item");
    next(err);
  }
}

// função responsável por anexar ou atualizar o comprovante de pagamento e status financeiro de um pedido existente.
//
// contexto: invocada pela rota PATCH /orders/:id/proof para confirmação pós-venda de transferências PIX ou comprovantes bancários.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id, dados de pagamento e anexo de arquivo opcional.
//   - res (Response, obrigatório): resposta HTTP com o pedido atualizado.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com o pedido atualizado).
// erros: repassa ao next(err) se o pedido não for localizado.
// efeitos colaterais: atualiza campos de pagamento e comprovante na tabela Pedido no PostgreSQL.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - busca o pedido existente com getOrderById para obter a loja vinculada.
// 4 - envia o novo arquivo de comprovante (se enviado) via resolveProofUrl.
// 5 - aciona orderService.updateOrderProof gravando os novos dados de pagamento.
// 6 - devolve o pedido atualizado em formato JSON.
export async function updateOrderProof(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - localiza pedido
    const existing = await orderService.getOrderById(req.params.id, scope, req.user);
    // 4 - processa arquivo
    const comprovanteUrl = await resolveProofUrl(req.file, req, {
      organizacaoId: scope.organizacaoId,
      lojaId: existing.lojaId,
      lojaSlug: existing.loja?.slug,
    });

    // 5 - atualiza no service
    const updated = await orderService.updateOrderProof(
      req.params.id,
      {
        ...req.body,
        ...(comprovanteUrl ? { comprovanteUrl } : {}),
      },
      scope,
      req.user
    );

    // 6 - responde
    res.json(updated);
  } catch (err) {
    log.warn({ err }, "Erro ao atualizar comprovante do pedido");
    next(err);
  }
}

// função responsável por cancelar um pedido e estornar automaticamente os saldos de estoque (exclusivo para ADMIN e GERENTE).
//
// contexto: chamada pela rota POST /orders/:id/cancel quando um pedido precisa ser cancelado por desistência ou erro.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id, req.body.motivo e gestor autenticado.
//   - res (Response, obrigatório): resposta HTTP com o pedido cancelado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o pedido atualizado para status CANCELADO).
// erros: repassa ao next(err) se o pedido já estiver cancelado ou pertencer a outra loja/organização.
// efeitos colaterais: altera status do Pedido para CANCELADO, insere contrapartidas estorno = true no livro-razão e restaura o estoque dos produtos.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo do gestor via resolveReadScope(req).
// 3 - executa cancelamento transacional através de orderService.cancelOrder passando o motivo informado.
// 4 - registra log de auditoria confirmando o cancelamento do pedido e o estorno de estoque.
// 5 - entrega a resposta JSON com o pedido cancelado.
export async function cancelOrder(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - cancela pedido e estorna estoque
    const updatedOrder = await orderService.cancelOrder(
      req.params.id,
      req.body?.motivo,
      scope,
      req.user
    );

    // 4 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "CANCEL_ORDER",
        orderId: updatedOrder.id,
        codigo: updatedOrder.codigo,
      },
      "Pedido cancelado e estoque estornado"
    );

    // 5 - responde
    res.json(updatedOrder);
  } catch (err) {
    log.warn({ err }, "Erro ao cancelar pedido");
    next(err);
  }
}
