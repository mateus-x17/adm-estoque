// arquivo responsável por gerenciar catálogo de produtos, controle de estoque unitário, precificação, métricas e soft delete.
// atua na camada de serviços (services) do backend.
// tecnologias principais: Prisma Client, PostgreSQL Raw SQL com Lock Pessimista, Cloudinary, JavaScript ES Modules.
// usado por: productController.js para atender requisições de consulta, paginação, cadastro, edição, ajuste de estoque e exclusão de itens.

// importações de bibliotecas de acesso ao banco de dados:
// prisma provê o cliente ORM e Prisma fornece utilitários de templates SQL para queries com lock pessimista.
import { prisma, Prisma } from "../config/prismaClient.js";

// importações de utilitários internos e regras de domínio:
// AppError padroniza lançamento de erros com status HTTP; cleanupStoredMedia remove imagens locais ou no Cloudinary;
// parseBooleanFlag sanitiza valores booleanos; formatMatricula resolve matrícula para snapshot de movimentação.
import { AppError } from "../utils/errorHandler.js";
import { cleanupStoredMedia } from "../config/cloudinaryConfig.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";
import { formatMatricula } from "../utils/matriculaHelper.js";

// tempo de vida útil em milissegundos para chaves de idempotência de ajustes de estoque (10 minutos):
// protege requisições duplicadas garantindo resposta consistente sem reprocessar saldo financeiro ou estoque.
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 10;

// mapa em memória para armazenar chaves de idempotência e seus resultados processados:
// chave: identificador composto (organizacaoId:idempotencyKey), valor: objeto { status, result, timestamp }.
const idempotencyStore = new Map();

// mapa em memória para prevenção de clique duplo e operações concorrentes em curto intervalo de tempo (debounce):
// chave: hash textual da operação (organizacao_usuario_produto_tipo_qtd), valor: timestamp em milissegundos.
const recentOperations = new Map();

// rotina periódica em segundo plano para expirar chaves de idempotência e registros de debounce obsoletos:
// executada a cada 5 minutos sem reter o ciclo de vida do processo Node.js (.unref()).
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.timestamp > IDEMPOTENCY_TTL_MS) idempotencyStore.delete(key);
  }
  for (const [key, timestamp] of recentOperations.entries()) {
    if (now - timestamp > 5000) recentOperations.delete(key);
  }
}, 1000 * 60 * 5).unref();

// função responsável por validar se uma categoria informada pertence exatamente à mesma loja do produto.
//
// contexto: invocada internamente por createProduct e updateProduct para evitar associação de categorias de outras filiais.
//
// parâmetros:
//   - categoriaId (número ou string, opcional): identificador numérico da categoria a validar.
//   - lojaId (número ou string, obrigatório): identificador da loja proprietária do produto.
//
// retorno: número com o identificador da categoria validada ou null se não fornecido.
// erros: AppError (400) se o identificador for inválido ou se a categoria pertencer a outra loja.
// efeitos colaterais: realiza consulta de leitura na tabela Categoria do banco de dados.
//
// passo a passo:
// 1 - recebe categoriaId (número ou string opcional) e lojaId (número ou string obrigatório).
// 2 - avalia se categoriaId é nulo, indefinido ou vazio retornando null antecipadamente.
// 3 - converte categoriaId para número lançando AppError (400) se for NaN.
// 4 - consulta a categoria no banco de dados filtrando pelo identificador e lojaId.
// 5 - lança AppError (400) caso a categoria não pertença à loja informada.
// 6 - retorna o identificador numérico validado.
async function resolveStoreCategoryId(categoriaId, lojaId) {
  // 1 - recebe categoriaId (número ou string opcional) e lojaId (número ou string obrigatório).
  // 2 - avalia se categoriaId é nulo, indefinido ou vazio retornando null antecipadamente.
  if (categoriaId === undefined || categoriaId === null || categoriaId === "" || categoriaId === "null") {
    return null;
  }

  // 3 - converte categoriaId para número lançando AppError (400) se for NaN.
  const parsedId = Number(categoriaId);
  if (isNaN(parsedId)) throw new AppError("ID de categoria inválido", 400);

  // 4 - consulta a categoria no banco de dados filtrando pelo identificador e lojaId.
  const cat = await prisma.categoria.findFirst({
    where: { id: parsedId, lojaId: Number(lojaId) },
  });

  // 5 - lança AppError (400) caso a categoria não pertença à loja informada.
  if (!cat) {
    throw new AppError("Categoria selecionada não pertence a esta loja", 400);
  }

  // 6 - retorna o identificador numérico validado.
  return parsedId;
}

// função responsável por validar se um fornecedor informado pertence exatamente à mesma loja do produto.
//
// contexto: invocada internamente por createProduct e updateProduct para evitar associação de fornecedores de outras filiais.
//
// parâmetros:
//   - fornecedorId (número ou string, opcional): identificador numérico do fornecedor a validar.
//   - lojaId (número ou string, obrigatório): identificador da loja proprietária do produto.
//
// retorno: número com o identificador do fornecedor validado ou null se não fornecido.
// erros: AppError (400) se o identificador for inválido ou se o fornecedor pertencer a outra loja.
// efeitos colaterais: realiza consulta de leitura na tabela Fornecedor do banco de dados.
//
// passo a passo:
// 1 - recebe fornecedorId (número ou string opcional) e lojaId (número ou string obrigatório).
// 2 - avalia se fornecedorId é nulo, indefinido ou vazio retornando null antecipadamente.
// 3 - converte fornecedorId para número lançando AppError (400) se for NaN.
// 4 - consulta o fornecedor no banco de dados filtrando pelo identificador e lojaId.
// 5 - lança AppError (400) caso o fornecedor não pertença à loja informada.
// 6 - retorna o identificador numérico validado.
async function resolveStoreSupplierId(fornecedorId, lojaId) {
  // 1 - recebe fornecedorId (número ou string opcional) e lojaId (número ou string obrigatório).
  // 2 - avalia se fornecedorId é nulo, indefinido ou vazio retornando null antecipadamente.
  if (fornecedorId === undefined || fornecedorId === null || fornecedorId === "" || fornecedorId === "null") {
    return null;
  }

  // 3 - converte fornecedorId para número lançando AppError (400) se for NaN.
  const parsedId = Number(fornecedorId);
  if (isNaN(parsedId)) throw new AppError("ID de fornecedor inválido", 400);

  // 4 - consulta o fornecedor no banco de dados filtrando pelo identificador e lojaId.
  const sup = await prisma.fornecedor.findFirst({
    where: { id: parsedId, lojaId: Number(lojaId) },
  });

  // 5 - lança AppError (400) caso o fornecedor não pertença à loja informada.
  if (!sup) {
    throw new AppError("Fornecedor selecionado não pertence a esta loja", 400);
  }

  // 6 - retorna o identificador numérico validado.
  return parsedId;
}

// função responsável por listar produtos paginados com filtros de busca, categoria, ordenação e status lógico.
//
// contexto: invocada por productController.js na rota GET /api/products para alimentar tabelas de catálogo no frontend.
//
// parâmetros:
//   - filters (objeto, opcional): critérios de filtragem (page, limit, search, sortPrice, categoriaId, status).
//       - filters.page (número ou string, opcional, padrão 1): número da página atual.
//       - filters.limit (número ou string, opcional, padrão 10): quantidade de registros por página ou 'all'.
//       - filters.search (string, opcional): termo de busca textual no nome do produto.
//       - filters.sortPrice (string, opcional): ordenação por preço ('asc' ou 'desc').
//       - filters.categoriaId (número ou string, opcional): filtro por identificador de categoria.
//       - filters.status (string, opcional, padrão 'ativos'): situação de ativação ('ativos', 'inativos' ou 'todos').
//   - scope (objeto, obrigatório): escopo organizacional contendo organizacaoId e opcionalmente lojaId.
//
// retorno: objeto contendo a lista data (array de produtos com categoria, fornecedor e loja) e metadados de pagination.
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: realiza consultas de leitura e contagem na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe filters (objeto opcional) e scope (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - extrai os filtros recebidos e monta o objeto statusFilter para produtos ativos ou inativos.
// 4 - constrói a cláusula where combinando organizacaoId, lojaId, busca textual insensível e categoria.
// 5 - calcula limites e deslocamento seguro (skip/take) para a paginação.
// 6 - define ordenação por preço caso solicitada ou padrão por status ativo e id decrescente.
// 7 - executa consultas paralelas findMany e count no banco de dados via Promise.all.
// 8 - retorna objeto estruturado com os produtos carregados e métricas completas de paginação.
export async function listProductsPaginated(filters = {}, scope) {
  // 1 - recebe filters (objeto opcional) e scope (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - extrai os filtros recebidos e monta o objeto statusFilter para produtos ativos ou inativos.
  const {
    page = 1,
    limit = 10,
    search,
    sortPrice,
    categoriaId,
    status = "ativos",
  } = filters;

  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  // 4 - constrói a cláusula where combinando organizacaoId, lojaId, busca textual insensível e categoria.
  const where = {
    AND: [
      { organizacaoId: Number(scope.organizacaoId) },
      scope.lojaId ? { lojaId: Number(scope.lojaId) } : {},
      statusFilter,
      search && search !== "undefined" && search !== "null"
        ? { nome: { contains: search, mode: "insensitive" } }
        : {},
      categoriaId && categoriaId !== "undefined" && categoriaId !== "null" && !isNaN(Number(categoriaId))
        ? { categoriaId: Number(categoriaId) }
        : {},
    ],
  };

  // 5 - calcula limites e deslocamento seguro (skip/take) para a paginação.
  const limitSafe = limit === "all" ? undefined : Math.min(Math.max(1, parseInt(limit) || 10), 100);
  const pageSafe = Math.max(1, parseInt(page) || 1);
  const skip = limit === "all" ? undefined : (pageSafe - 1) * limitSafe;

  // 6 - define ordenação por preço caso solicitada ou padrão por status ativo e id decrescente.
  const orderBy =
    sortPrice && ["asc", "desc"].includes(sortPrice)
      ? [{ preco: sortPrice }]
      : [{ ativo: "desc" }, { id: "desc" }];

  // 7 - executa consultas paralelas findMany e count no banco de dados via Promise.all.
  const [products, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip,
      take: limitSafe,
      orderBy,
      include: {
        categoria: true,
        fornecedor: true,
        loja: { select: { id: true, nome: true, slug: true } },
      },
    }),
    prisma.produto.count({ where }),
  ]);

  // 8 - retorna objeto estruturado com os produtos carregados e métricas completas de paginação.
  return {
    data: products,
    pagination: {
      page: pageSafe,
      limit: limitSafe,
      total,
      pages: limit === "all" ? 1 : Math.max(1, Math.ceil(total / limitSafe)),
    },
  };
}

// função responsável por buscar detalhes completos de um produto garantindo pertencimento ao escopo permitido.
//
// contexto: invocada por productController.js na rota GET /api/products/:id para visualização e edição de itens.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do produto pesquisado.
//   - scope (objeto, obrigatório): escopo de validação contendo organizacaoId e opcionalmente lojaId.
//
// retorno: objeto do produto contendo detalhes de categoria, fornecedor e loja associados.
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se o produto não for localizado no escopo.
// efeitos colaterais: realiza consulta de leitura na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string) e scope (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o produto no banco filtrando por id, organizacaoId e restrição de loja quando presente.
// 4 - lança AppError (404) caso o produto não seja encontrado no escopo organizacional do usuário.
// 5 - retorna os dados detalhados do produto com relacionamentos incluídos.
export async function getProductById(id, scope) {
  // 1 - recebe id (número ou string) e scope (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - consulta o produto no banco filtrando por id, organizacaoId e restrição de loja quando presente.
  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });

  // 4 - lança AppError (404) caso o produto não seja encontrado no escopo organizacional do usuário.
  if (!product) throw new AppError("Produto não encontrado", 404);

  // 5 - retorna os dados detalhados do produto com relacionamentos incluídos.
  return product;
}

// função responsável por criar um novo produto no estoque da loja alvo.
//
// contexto: invocada por productController.js na rota POST /api/products para inserção manual de mercadorias.
//
// parâmetros:
//   - data (objeto, obrigatório): campos de cadastro do produto (nome, descricao, preco, quantidade, categoriaId, fornecedorId).
//   - imagePath (string, opcional, padrão null): url segura ou caminho da imagem persistida no Cloudinary/storage.
//   - storeScope (objeto, obrigatório): escopo de destino contendo organizacaoId e lojaId obrigatórios.
//
// retorno: objeto do produto recém-criado com categoria, fornecedor e loja associados.
// erros: AppError (400) se lojaId ou organizacaoId faltarem, se nome for vazio ou se categoria/fornecedor forem inválidos.
// efeitos colaterais: insere um novo registro na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe data (objeto obrigatório), imagePath (string opcional) e storeScope (objeto obrigatório).
// 2 - valida a presença obrigatória de organizacaoId e lojaId no storeScope lançando AppError (400) se ausentes.
// 3 - extrai dados do produto e valida a obrigatoriedade do nome lançando AppError (400) se vazio.
// 4 - converte os identificadores de escopo para formato numérico.
// 5 - valida o pertencimento de categoriaId e fornecedorId à mesma loja através dos métodos auxiliares de resolução.
// 6 - persiste o novo produto no banco de dados com status ativo como padrão.
// 7 - retorna o produto criado com seus relacionamentos carregados.
export async function createProduct(data, imagePath = null, storeScope) {
  // 1 - recebe data (objeto obrigatório), imagePath (string opcional) e storeScope (objeto obrigatório).
  // 2 - valida a presença obrigatória de organizacaoId e lojaId no storeScope lançando AppError (400) se ausentes.
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }

  // 3 - extrai dados do produto e valida a obrigatoriedade do nome lançando AppError (400) se vazio.
  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId } = data;
  if (!nome || String(nome).trim() === "") throw new AppError("Nome é obrigatório", 400);

  // 4 - converte os identificadores de escopo para formato numérico.
  const organizacaoId = Number(storeScope.organizacaoId);
  const lojaId = Number(storeScope.lojaId);

  // 5 - valida o pertencimento de categoriaId e fornecedorId à mesma loja através dos métodos auxiliares de resolução.
  const validCategoriaId = await resolveStoreCategoryId(categoriaId, lojaId);
  const validFornecedorId = await resolveStoreSupplierId(fornecedorId, lojaId);

  // 6 - persiste o novo produto no banco de dados com status ativo como padrão.
  // 7 - retorna o produto criado com seus relacionamentos carregados.
  return prisma.produto.create({
    data: {
      nome: String(nome).trim(),
      descricao: descricao !== undefined ? String(descricao) : null,
      preco: preco !== undefined && preco !== "" ? parseFloat(preco) : 0,
      quantidade: quantidade !== undefined && quantidade !== "" ? Number(quantidade) : 0,
      imagem: imagePath,
      ativo: true,
      organizacaoId,
      lojaId,
      categoriaId: validCategoriaId,
      fornecedorId: validFornecedorId,
    },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por atualizar dados cadastrais e mídia de um produto existente.
//
// contexto: invocada por productController.js na rota PUT /api/products/:id.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do produto a ser editado.
//   - data (objeto, obrigatório): dados atualizados (nome, descricao, preco, quantidade, categoriaId, fornecedorId, ativo).
//   - newImagePath (string, opcional, padrão null): novo endereço da imagem do produto caso tenha havido upload.
//   - removeImage (booleano, opcional, padrão false): flag indicando solicitação expressa de remoção da imagem.
//   - scope (objeto, obrigatório): escopo de permissão com organizacaoId e restrição de loja para colaboradores.
//
// retorno: objeto do produto atualizado com seus relacionamentos incluídos.
// erros: AppError (400) se organizacaoId faltar ou campos forem inválidos; AppError (404) se o produto não for localizado no escopo.
// efeitos colaterais: atualiza registro na tabela Produto e remove mídia antiga no storage via cleanupStoredMedia.
//
// passo a passo:
// 1 - recebe id (número ou string), data (objeto), newImagePath (string opcional), removeImage (booleano) e scope (objeto).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o produto no banco respeitando o escopo e restrição de loja do usuário lançando AppError (404) se ausente.
// 4 - processa a substituição ou remoção segura da imagem antiga no Cloudinary ou disco local via cleanupStoredMedia.
// 5 - monta o objeto de atualização com validação de tipos, sanitização de status e resolução de categoria/fornecedor na mesma loja.
// 6 - persiste as alterações no produto via Prisma update.
// 7 - retorna o produto com dados atualizados e relacionamentos inclusos.
export async function updateProduct(
  id,
  data,
  newImagePath = null,
  removeImage = false,
  scope
) {
  // 1 - recebe id (número ou string), data (objeto), newImagePath (string opcional), removeImage (booleano) e scope (objeto).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - consulta o produto no banco respeitando o escopo e restrição de loja do usuário lançando AppError (404) se ausente.
  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  // 4 - processa a substituição ou remoção segura da imagem antiga no Cloudinary ou disco local via cleanupStoredMedia.
  let imagePath = product.imagem;
  if (removeImage) {
    await cleanupStoredMedia(imagePath);
    imagePath = null;
  } else if (newImagePath) {
    await cleanupStoredMedia(imagePath);
    imagePath = newImagePath;
  }

  // 5 - monta o objeto de atualização com validação de tipos, sanitização de status e resolução de categoria/fornecedor na mesma loja.
  const { nome, descricao, preco, quantidade, categoriaId, fornecedorId, ativo } = data;
  const updateData = { imagem: imagePath };

  if (nome !== undefined) updateData.nome = String(nome).trim();
  if (descricao !== undefined) updateData.descricao = descricao;
  if (preco !== undefined && preco !== "") updateData.preco = parseFloat(preco);
  if (quantidade !== undefined && quantidade !== "") updateData.quantidade = Number(quantidade);
  if (ativo !== undefined) updateData.ativo = parseBooleanFlag(ativo);

  if (categoriaId !== undefined) {
    updateData.categoriaId = await resolveStoreCategoryId(categoriaId, product.lojaId);
  }
  if (fornecedorId !== undefined) {
    updateData.fornecedorId = await resolveStoreSupplierId(fornecedorId, product.lojaId);
  }

  // 6 - persiste as alterações no produto via Prisma update.
  // 7 - retorna o produto com dados atualizados e relacionamentos inclusos.
  return prisma.produto.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por alternar o status ativo ou inativo de um produto promovendo soft delete.
//
// contexto: invocada por productController.js na rota PATCH /api/products/:id/status.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único do produto.
//   - ativo (booleano ou string, obrigatório): novo valor booleano para o campo ativo.
//   - scope (objeto, obrigatório): escopo contendo organizacaoId e restrição de loja quando aplicável.
//
// retorno: objeto do produto com o status ativo atualizado e relacionamentos incluídos.
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se o produto não for localizado.
// efeitos colaterais: atualiza a coluna ativo na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string), ativo (booleano ou string) e scope (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta o produto no banco respeitando as permissões do escopo lançando AppError (404) se ausente.
// 4 - executa a alteração do status ativo convertendo o valor com parseBooleanFlag.
// 5 - retorna o produto atualizado com dados de categoria, fornecedor e loja vinculada.
export async function toggleProductStatus(id, ativo, scope) {
  // 1 - recebe id (número ou string), ativo (booleano ou string) e scope (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - consulta o produto no banco respeitando as permissões do escopo lançando AppError (404) se ausente.
  const product = await prisma.produto.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  // 4 - executa a alteração do status ativo convertendo o valor com parseBooleanFlag.
  // 5 - retorna o produto atualizado com dados de categoria, fornecedor e loja vinculada.
  return prisma.produto.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
    include: {
      categoria: true,
      fornecedor: true,
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por excluir definitivamente um produto ou aplicar soft delete automático caso possua histórico.
//
// contexto: invocada por productController.js na rota DELETE /api/products/:id restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico do produto a excluir.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária do produto.
//
// retorno: objeto contendo ok (booleano), softDeleted (booleano), message (texto descritivo) e opcionalmente produto (dados inativados).
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se o produto não for localizado.
// efeitos colaterais: atualiza status para ativo false ou exclui fisicamente o produto e limpa sua mídia no storage.
//
// passo a passo:
// 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - busca o produto no banco contando movimentos de estoque e itens de pedidos associados.
// 4 - lança AppError (404) se o produto não existir na organização.
// 5 - avalia se o produto possui histórico vinculado em movimentos ou pedidos.
// 6 - se houver dependências históricas, aplica soft delete definindo ativo como false preservando os dados contábeis.
// 7 - se não houver histórico, limpa a mídia associada com cleanupStoredMedia e remove definitivamente a linha do banco.
// 8 - retorna objeto de confirmação detalhando se o produto foi inativado ou excluído permanentemente.
export async function deleteProduct(id, organizacaoId) {
  // 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - busca o produto no banco contando movimentos de estoque e itens de pedidos associados.
  const product = await prisma.produto.findFirst({
    where: { id: Number(id), organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { movimentos: true, itensPedido: true } } },
  });
  // 4 - lança AppError (404) se o produto não existir na organização.
  if (!product) throw new AppError("Produto não encontrado", 404);

  // 5 - avalia se o produto possui histórico vinculado em movimentos ou pedidos.
  const totalRefs = product._count.movimentos + product._count.itensPedido;

  // 6 - se houver dependências históricas, aplica soft delete definindo ativo como false preservando os dados contábeis.
  if (totalRefs > 0) {
    const inactivated = await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false },
      include: {
        categoria: true,
        fornecedor: true,
        loja: { select: { id: true, nome: true, slug: true } },
      },
    });
    return {
      ok: true,
      softDeleted: true,
      message: `Produto "${product.nome}" possui histórico de movimentações/pedidos e foi inativado logicamente.`,
      produto: inactivated,
    };
  }

  // 7 - se não houver histórico, limpa a mídia associada com cleanupStoredMedia e remove definitivamente a linha do banco.
  await cleanupStoredMedia(product.imagem);

  await prisma.produto.delete({ where: { id: Number(id) } });

  // 8 - retorna objeto de confirmação detalhando se o produto foi inativado ou excluído permanentemente.
  return {
    ok: true,
    softDeleted: false,
    message: `Produto "${product.nome}" excluído permanentemente com sucesso.`,
  };
}

// função responsável por realizar ajuste transacional atômico de estoque com lock pessimista e registro no livro-razão.
//
// contexto: invocada por productController.js na rota POST /api/products/:id/adjust para repor ou debitar produtos manualmente.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único do produto cujo saldo será alterado.
//   - quantidade (número ou string, obrigatório): quantidade inteira positiva a movimentar.
//   - tipo (string, obrigatório): modalidade da movimentação ('REPOSICAO' ou 'VENDA', com suporte a aliases).
//   - requestingUser (objeto, obrigatório): dados do colaborador autenticado contendo id, nome, email, role, organizacaoId e lojaId.
//   - observacao (string, opcional, padrão null): justificativa ou anotação operacional do ajuste.
//   - idempotencyKey (string, opcional, padrão null): chave opcional enviada pelo cliente para evitar duplicidade.
//
// retorno: objeto contendo ok (true), novaQuantidade (saldo final em estoque) e movimento (registro criado no livro-razão).
// erros: AppError (400) para argumentos inválidos ou estoque insuficiente; AppError (404) se produto não for localizado; AppError (409) para transação concorrente; AppError (429) para debounce por duplo clique.
// efeitos colaterais: atualiza quantidade na tabela Produto, cria registro na tabela Movimento com snapshots funcionais e gerencia mapas de memória.
//
// passo a passo:
// 1 - recebe id, quantidade, tipo, requestingUser, observacao e idempotencyKey.
// 2 - valida a presença de organizacaoId no usuário solicitante lançando AppError (400) se ausente.
// 3 - valida a quantidade numérica positiva e normaliza o tipo de ajuste para REPOSICAO ou VENDA.
// 4 - avalia e protege a requisição contra repetição via chave de idempotência com TTL de dez minutos.
// 5 - aplica mecanismo de debounce em memória bloqueando cliques duplos em menos de 1200 milissegundos.
// 6 - abre transação atômica no banco de dados bloqueando a linha do produto com lock pessimista FOR UPDATE.
// 7 - verifica se a loja e o produto estão ativos no estabelecimento do usuário.
// 8 - valida se há saldo suficiente no estoque caso a operação seja uma venda.
// 9 - calcula a nova quantidade aplicando o delta correspondente e garantindo que não fique negativa.
// 10 - insere registro no livro-razão de Movimento armazenando snapshots imutáveis do colaborador e preço.
// 11 - atualiza a quantidade resultante do produto na tabela Produto.
// 12 - armazena o resultado no cache de idempotência e retorna confirmação com a nova quantidade e movimento.
export async function adjustProductQuantity(
  id,
  quantidade,
  tipo,
  requestingUser,
  observacao = null,
  idempotencyKey = null
) {
  // 1 - recebe id, quantidade, tipo, requestingUser, observacao e idempotencyKey.
  // 2 - valida a presença de organizacaoId no usuário solicitante lançando AppError (400) se ausente.
  if (!requestingUser?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - valida a quantidade numérica positiva e normaliza o tipo de ajuste para REPOSICAO ou VENDA.
  const qtdNum = Number(quantidade);
  if (!quantidade || isNaN(qtdNum) || qtdNum <= 0 || !tipo) {
    throw new AppError("Quantidade válida e tipo são obrigatórios", 400);
  }

  let normalizedTipo = String(tipo).toUpperCase();
  if (normalizedTipo === "ENTRADA") normalizedTipo = "REPOSICAO";
  if (normalizedTipo === "SAIDA") normalizedTipo = "VENDA";

  if (!["REPOSICAO", "VENDA"].includes(normalizedTipo)) {
    throw new AppError("Tipo deve ser REPOSICAO ou VENDA", 400);
  }

  const productId = Number(id);
  const orgId = Number(requestingUser.organizacaoId);
  if (isNaN(productId)) throw new AppError("ID de produto inválido", 400);

  // 4 - avalia e protege a requisição contra repetição via chave de idempotência com TTL de dez minutos.
  const scopedIdempotencyKey = idempotencyKey ? `${orgId}:${idempotencyKey}` : null;
  if (scopedIdempotencyKey) {
    const cached = idempotencyStore.get(scopedIdempotencyKey);
    if (cached) {
      if (cached.status === "PROCESSING") {
        throw new AppError("Esta operação já está em processamento. Por favor, aguarde.", 409);
      }
      return cached.result;
    }
    idempotencyStore.set(scopedIdempotencyKey, { status: "PROCESSING", timestamp: Date.now() });
  }

  // 5 - aplica mecanismo de debounce em memória bloqueando cliques duplos em menos de 1200 milissegundos.
  const debounceKey = `org_${orgId}_user_${requestingUser.id}_prod_${productId}_${normalizedTipo}_${qtdNum}`;
  const now = Date.now();
  const lastOp = recentOperations.get(debounceKey);
  if (!scopedIdempotencyKey && lastOp && now - lastOp < 1200) {
    throw new AppError(
      "Operação duplicada detectada (clique duplo). Por favor, aguarde a conclusão.",
      429
    );
  }
  recentOperations.set(debounceKey, now);

  // 6 - abre transação atômica no banco de dados bloqueando a linha do produto com lock pessimista FOR UPDATE.
  try {
    const result = await prisma.$transaction(async (tx) => {
      const storeClause =
        requestingUser.role !== "ADMIN" && requestingUser.lojaId
          ? Prisma.sql`AND p."lojaId" = ${Number(requestingUser.lojaId)}`
          : Prisma.empty;

      const [product] = await tx.$queryRaw`
        SELECT p.id, p.nome, p.quantidade, p.preco, p.ativo, p."organizacaoId", p."lojaId", l.ativo AS "lojaAtiva"
        FROM "Produto" p
        JOIN "Loja" l ON l.id = p."lojaId"
        WHERE p.id = ${productId} AND p."organizacaoId" = ${orgId} ${storeClause}
        FOR UPDATE OF p
      `;

      // 7 - verifica se a loja e o produto estão ativos no estabelecimento do usuário.
      if (!product) throw new AppError("Produto não encontrado neste estabelecimento", 404);
      if (!product.lojaAtiva) {
        throw new AppError("A loja deste produto está desativada para movimentações.", 400);
      }
      if (!product.ativo) {
        throw new AppError(
          "Este produto está inativo. Reative-o antes de registrar movimentações.",
          400
        );
      }

      // 8 - valida se há saldo suficiente no estoque caso a operação seja uma venda.
      if (normalizedTipo === "VENDA" && product.quantidade < qtdNum) {
        throw new AppError(
          `Quantidade insuficiente no estoque. Saldo disponível: ${product.quantidade}, Solicitado: ${qtdNum}`,
          400
        );
      }

      // 9 - calcula a nova quantidade aplicando o delta correspondente e garantindo que não fique negativa.
      const delta = normalizedTipo === "REPOSICAO" ? qtdNum : -qtdNum;
      const newQuantity = product.quantidade + delta;
      if (newQuantity < 0) throw new AppError("Quantidade não pode ser negativa", 400);

      const unitPrice = Number(product.preco || 0);
      const totalVal = Number((unitPrice * qtdNum).toFixed(2));

      // 10 - insere registro no livro-razão de Movimento armazenando snapshots imutáveis do colaborador e preço.
      const movimento = await tx.movimento.create({
        data: {
          produtoId: productId,
          quantidade: qtdNum,
          tipo: normalizedTipo,
          precoUnitario: unitPrice,
          valorTotal: totalVal,
          estorno: false,
          usuarioId: Number(requestingUser.id),
          vendedorRefId: Number(requestingUser.id),
          vendedorNomeSnapshot: requestingUser.nome,
          vendedorEmailSnapshot: requestingUser.email,
          vendedorMatriculaSnapshot:
            requestingUser.matricula || formatMatricula(requestingUser.id),
          vendedorDataAdmissaoSnapshot: requestingUser.dataAdmissao
            ? new Date(requestingUser.dataAdmissao)
            : null,
          organizacaoId: orgId,
          lojaId: Number(product.lojaId),
          observacao,
        },
        include: {
          produto: true,
          loja: { select: { id: true, nome: true, slug: true } },
          usuario: { select: { id: true, nome: true, email: true, role: true } },
        },
      });

      // 11 - atualiza a quantidade resultante do produto na tabela Produto.
      const updatedProduct = await tx.produto.update({
        where: { id: productId },
        data: { quantidade: newQuantity },
      });

      return { ok: true, novaQuantidade: updatedProduct.quantidade, movimento };
    });

    // 12 - armazena o resultado no cache de idempotência e retorna confirmação com a nova quantidade e movimento.
    if (scopedIdempotencyKey) {
      idempotencyStore.set(scopedIdempotencyKey, { status: "DONE", result, timestamp: Date.now() });
    }
    return result;
  } catch (err) {
    if (scopedIdempotencyKey) {
      idempotencyStore.delete(scopedIdempotencyKey);
    }
    throw err;
  }
}

// função responsável por calcular indicadores agregados e patrimônio total em estoque no escopo selecionado.
//
// contexto: invocada por productController.js na rota GET /api/products/stats para visualização em dashboards e painéis.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo de autorização contendo organizacaoId e opcionalmente lojaId.
//
// retorno: objeto com total (total de itens ativos), lowStock (contagem de itens com estoque menor que 10), totalValue (valor total patrimonial em reais) e lowStockList (lista detalhada de produtos críticos).
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: executa consultas de contagem e agregação SQL na tabela Produto.
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório) com os dados organizacionais.
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - monta o filtro base where exigindo produtos ativos no escopo organizacional e de filial.
// 4 - executa consultas paralelas count e findMany para contagem total e produtos em estoque crítico.
// 5 - calcula o montante financeiro total investido em estoque via query raw SQL agregando preço por quantidade.
// 6 - retorna objeto estruturado com as estatísticas consolidadas e listagem de alerta de estoque baixo.
export async function getProductStats(scope) {
  // 1 - recebe scope (objeto obrigatório) com os dados organizacionais.
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - monta o filtro base where exigindo produtos ativos no escopo organizacional e de filial.
  const orgId = Number(scope.organizacaoId);
  const lojaId = scope.lojaId ? Number(scope.lojaId) : null;

  const baseWhere = {
    organizacaoId: orgId,
    ...(lojaId ? { lojaId } : {}),
    ativo: true,
  };

  // 4 - executa consultas paralelas count e findMany para contagem total e produtos em estoque crítico.
  const [total, lowStockCount, lowStockList] = await Promise.all([
    prisma.produto.count({ where: baseWhere }),
    prisma.produto.count({ where: { ...baseWhere, quantidade: { lt: 10 } } }),
    prisma.produto.findMany({
      where: { ...baseWhere, quantidade: { lt: 10 } },
      select: {
        id: true,
        nome: true,
        preco: true,
        quantidade: true,
        loja: { select: { id: true, nome: true } },
        categoria: { select: { id: true, nome: true } },
      },
      orderBy: [{ quantidade: "asc" }, { nome: "asc" }],
      take: 50,
    }),
  ]);

  // 5 - calcula o montante financeiro total investido em estoque via query raw SQL agregando preço por quantidade.
  const lojaSql = lojaId ? Prisma.sql`AND "lojaId" = ${lojaId}` : Prisma.empty;
  const valueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(preco * quantidade), 0) AS "totalValue"
    FROM "Produto"
    WHERE "organizacaoId" = ${orgId} AND "ativo" = true ${lojaSql}
  `;

  // 6 - retorna objeto estruturado com as estatísticas consolidadas e listagem de alerta de estoque baixo.
  return {
    total,
    lowStock: lowStockCount,
    totalValue: Number(valueResult[0]?.totalValue || 0),
    lowStockList,
  };
}

// função responsável por contar o número total de produtos ativos no escopo selecionado.
//
// contexto: invocada por productController.js na rota GET /api/products/count para badges e contadores numéricos.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo contendo organizacaoId e opcionalmente lojaId.
//
// retorno: número inteiro com a quantidade de produtos ativos encontrados.
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: realiza consulta de contagem na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório) com os dados organizacionais.
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - executa método count no Prisma filtrando por organizacaoId, lojaId e status ativo true.
// 4 - retorna o total numérico calculado.
export async function countProducts(scope) {
  // 1 - recebe scope (objeto obrigatório) com os dados organizacionais.
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - executa método count no Prisma filtrando por organizacaoId, lojaId e status ativo true.
  // 4 - retorna o total numérico calculado.
  return prisma.produto.count({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ativo: true,
    },
  });
}
