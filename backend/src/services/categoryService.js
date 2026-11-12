// arquivo responsável por gerenciar regras de negócio, persistência e ciclo de vida de categorias de produtos por organização e loja.
// atua na camada de serviços (services) do backend.
// tecnologias principais: Prisma Client, PostgreSQL, JavaScript ES Modules.
// usado por: categoryController.js para atender requisições de consulta, criação, edição, contagem e remoção de categorias.

// importações de clientes de infraestrutura:
// prisma provê comunicação direta com o banco relacional para operações na tabela Categoria.
import { prisma } from "../config/prismaClient.js";

// importações de utilitários do sistema:
// AppError padroniza lançamento de falhas operacionais; parseBooleanFlag converte parâmetros booleanos e strings.
import { AppError } from "../utils/errorHandler.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";

// função responsável por montar a cláusula where de isolamento por organização e loja.
//
// contexto: invocada internamente por listCategories e countCategories para garantir o escopo multi-tenant correto.
//
// parâmetros:
//   - scope (objeto, obrigatório): objeto de escopo contendo organizacaoId e opcionalmente lojaId.
//       - scope.organizacaoId (número ou string, obrigatório): identificador da organização dona do recurso.
//       - scope.lojaId (número ou string, opcional): identificador da loja específica quando filtrado.
//
// retorno: objeto contendo a cláusula where com organizacaoId e condicionalmente lojaId convertidos para número.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório) com os parâmetros de escopo.
// 2 - extrai organizacaoId convertendo para tipo numérico como filtro mandatório.
// 3 - avalia se lojaId foi informado incluindo no objeto caso presente.
// 4 - retorna o objeto formatado para a cláusula where do Prisma.
function buildScopeWhere(scope) {
  // 1 - recebe scope (objeto obrigatório) com os parâmetros de escopo.
  // 2 - extrai organizacaoId convertendo para tipo numérico como filtro mandatório.
  // 3 - avalia se lojaId foi informado incluindo no objeto caso presente.
  // 4 - retorna o objeto formatado para a cláusula where do Prisma.
  return {
    organizacaoId: Number(scope.organizacaoId),
    ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
  };
}

// função responsável por listar categorias cadastradas respeitando o escopo organizacional e filtro de status.
//
// contexto: invocada por categoryController.js na rota GET /api/categories.
//
// parâmetros:
//   - scope (objeto, obrigatório): informações de escopo multi-tenant com organizacaoId e opcionalmente lojaId.
//   - status (string, opcional, padrão "ativos"): critério de filtragem ('ativos', 'inativos' ou 'todos').
//
// retorno: array de objetos de categoria incluindo dados resumidos da loja vinculada e contagem agregada de produtos.
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: realiza consulta de leitura na tabela Categoria do banco de dados.
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório) e status (string opcional com padrão 'ativos').
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - define o objeto de filtro statusFilter de acordo com o valor recebido ('ativos', 'inativos' ou vazio para todos).
// 4 - executa consulta findMany no Prisma aplicando o escopo, filtro de status, includes relacionais e ordenação.
// 5 - retorna a lista de categorias encontradas.
export async function listCategories(scope, status = "ativos") {
  // 1 - recebe scope (objeto obrigatório) e status (string opcional com padrão 'ativos').
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - define o objeto de filtro statusFilter de acordo com o valor recebido ('ativos', 'inativos' ou vazio para todos).
  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  // 4 - executa consulta findMany no Prisma aplicando o escopo, filtro de status, includes relacionais e ordenação.
  // 5 - retorna a lista de categorias encontradas.
  return prisma.categoria.findMany({
    where: {
      ...buildScopeWhere(scope),
      ...statusFilter,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      _count: { select: { produtos: true } },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

// função responsável por criar uma nova categoria vinculada a uma loja específica.
//
// contexto: invocada por categoryController.js na rota POST /api/categories.
//
// parâmetros:
//   - nome (string, obrigatório): nome descritivo da nova categoria.
//   - storeScope (objeto, obrigatório): escopo contendo lojaId e organizacaoId onde a categoria será criada.
//       - storeScope.lojaId (número ou string, obrigatório): identificador da loja de destino.
//       - storeScope.organizacaoId (número ou string, obrigatório): identificador da organização dona da loja.
//
// retorno: objeto da categoria recém-criada incluindo informações da loja associada.
// erros: AppError (400) se lojaId/organizacaoId faltarem, nome for inválido ou já existir categoria com mesmo nome na loja.
// efeitos colaterais: insere um novo registro na tabela Categoria do banco de dados.
//
// passo a passo:
// 1 - recebe nome (string obrigatória) e storeScope (objeto obrigatório).
// 2 - valida a presença de lojaId e organizacaoId no storeScope lançando AppError (400) se ausentes.
// 3 - valida se o nome é uma string não vazia lançando AppError (400) se inválido.
// 4 - normaliza o nome removendo espaços em branco extras e converte os identificadores para número.
// 5 - verifica no banco se já existe categoria com o mesmo nome na mesma loja usando a chave composta lojaId_nome.
// 6 - lança AppError (400) se houver colisão de nome para a mesma unidade comercial.
// 7 - persiste a nova categoria como ativa no banco de dados com vínculo de organizacaoId e lojaId.
// 8 - retorna o registro da categoria criada com dados da loja incluídos.
export async function createCategory(nome, storeScope) {
  // 1 - recebe nome (string obrigatória) e storeScope (objeto obrigatório).
  // 2 - valida a presença de lojaId e organizacaoId no storeScope lançando AppError (400) se ausentes.
  if (!storeScope?.lojaId || !storeScope?.organizacaoId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }
  // 3 - valida se o nome é uma string não vazia lançando AppError (400) se inválido.
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de categoria é obrigatório e deve ser texto", 400);
  }

  // 4 - normaliza o nome removendo espaços em branco extras e converte os identificadores para número.
  const cleanName = nome.trim();
  const lojaId = Number(storeScope.lojaId);
  const organizacaoId = Number(storeScope.organizacaoId);

  // 5 - verifica no banco se já existe categoria com o mesmo nome na mesma loja usando a chave composta lojaId_nome.
  const existing = await prisma.categoria.findUnique({
    where: {
      lojaId_nome: {
        lojaId,
        nome: cleanName,
      },
    },
  });

  // 6 - lança AppError (400) se houver colisão de nome para a mesma unidade comercial.
  if (existing) {
    throw new AppError("Já existe uma categoria cadastrada com este nome nesta loja", 400);
  }

  // 7 - persiste a nova categoria como ativa no banco de dados com vínculo de organizacaoId e lojaId.
  // 8 - retorna o registro da categoria criada com dados da loja incluídos.
  return prisma.categoria.create({
    data: {
      nome: cleanName,
      ativo: true,
      organizacaoId,
      lojaId,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por atualizar a nomenclatura de uma categoria existente.
//
// contexto: invocada por categoryController.js na rota PUT /api/categories/:id.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico da categoria a ser atualizada.
//   - nome (string, obrigatório): novo nome desejado para a categoria.
//   - scope (objeto, obrigatório): escopo contendo organizacaoId e restrição opcional de loja do usuário solicitante.
//
// retorno: objeto da categoria com dados atualizados incluindo dados da loja vinculada.
// erros: AppError (400) se organizacaoId faltar, se o nome for inválido ou colidir com outra categoria da mesma loja; AppError (404) se a categoria não for encontrada no escopo.
// efeitos colaterais: atualiza o registro na tabela Categoria no banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string), nome (string) e scope (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - valida se o novo nome é texto válido e não vazio lançando AppError (400) se inválido.
// 4 - busca a categoria existente validando pertencimento à organização e restrição de loja quando aplicável.
// 5 - lança AppError (404) se a categoria não for localizada no escopo permitido.
// 6 - verifica no banco se já existe outra categoria cadastrada com o novo nome na mesma loja.
// 7 - lança AppError (400) se outro registro na mesma loja já utilizar o novo nome fornecido.
// 8 - atualiza o nome da categoria no banco de dados via Prisma update.
// 9 - retorna a categoria atualizada com dados da loja vinculada.
export async function updateCategory(id, nome, scope) {
  // 1 - recebe id (número ou string), nome (string) e scope (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  // 3 - valida se o novo nome é texto válido e não vazio lançando AppError (400) se inválido.
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de categoria é obrigatório e deve ser texto", 400);
  }

  const cleanName = nome.trim();
  // 4 - busca a categoria existente validando pertencimento à organização e restrição de loja quando aplicável.
  const category = await prisma.categoria.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });

  // 5 - lança AppError (404) se a categoria não for localizada no escopo permitido.
  if (!category) throw new AppError("Categoria não encontrada", 404);

  // 6 - verifica no banco se já existe outra categoria cadastrada com o novo nome na mesma loja.
  const existing = await prisma.categoria.findUnique({
    where: {
      lojaId_nome: {
        lojaId: category.lojaId,
        nome: cleanName,
      },
    },
  });

  // 7 - lança AppError (400) se outro registro na mesma loja já utilizar o novo nome fornecido.
  if (existing && existing.id !== Number(id)) {
    throw new AppError("Já existe outra categoria cadastrada com este nome nesta loja", 400);
  }

  // 8 - atualiza o nome da categoria no banco de dados via Prisma update.
  // 9 - retorna a categoria atualizada com dados da loja vinculada.
  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { nome: cleanName },
    include: { loja: { select: { id: true, nome: true, slug: true } } },
  });
}

// função responsável por alternar o status ativo ou inativo de uma categoria promovendo soft delete.
//
// contexto: invocada por categoryController.js na rota PATCH /api/categories/:id/status.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único da categoria.
//   - ativo (booleano ou string, obrigatório): novo status booleano desejado para ativação ou inativação.
//   - scope (objeto, obrigatório): escopo multi-tenant contendo organizacaoId e lojaId restrito se não for administrador.
//
// retorno: objeto da categoria com o campo ativo atualizado e dados da loja associada.
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se a categoria não for encontrada no escopo.
// efeitos colaterais: atualiza a coluna ativo na tabela Categoria do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string), ativo (booleano ou string) e scope (objeto obrigatório).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - localiza a categoria no banco de dados assegurando que pertence ao escopo organizacional e de loja do requisitante.
// 4 - lança AppError (404) caso a categoria não exista ou pertença a outro escopo restrito.
// 5 - executa atualização do campo ativo no banco de dados aplicando sanitização com parseBooleanFlag.
// 6 - retorna a categoria atualizada com informações da loja.
export async function toggleCategoryStatus(id, ativo, scope) {
  // 1 - recebe id (número ou string), ativo (booleano ou string) e scope (objeto obrigatório).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - localiza a categoria no banco de dados assegurando que pertence ao escopo organizacional e de loja do requisitante.
  const category = await prisma.categoria.findFirst({
    where: {
      id: Number(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });
  // 4 - lança AppError (404) caso a categoria não exista ou pertença a outro escopo restrito.
  if (!category) throw new AppError("Categoria não encontrada", 404);

  // 5 - executa atualização do campo ativo no banco de dados aplicando sanitização com parseBooleanFlag.
  // 6 - retorna a categoria atualizada com informações da loja.
  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { ativo: parseBooleanFlag(ativo) },
    include: { loja: { select: { id: true, nome: true, slug: true } } },
  });
}

// função responsável por excluir fisicamente uma categoria ou inativá-la logicamente caso possua produtos associados.
//
// contexto: invocada por categoryController.js na rota DELETE /api/categories/:id restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único da categoria a ser excluída ou inativada.
//   - organizacaoId (número ou string, obrigatório): identificador da organização para validação de posse.
//
// retorno: objeto contendo softDeleted (booleano), message (mensagem descritiva da ação tomada) e opcionalmente category (dados inativados).
// erros: AppError (400) se organizacaoId não for fornecido; AppError (404) se a categoria não existir na organização.
// efeitos colaterais: atualiza o status para ativo false ou remove definitivamente o registro da tabela Categoria.
//
// passo a passo:
// 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - busca a categoria no banco pelo identificador e organizacaoId incluindo a contagem de produtos associados.
// 4 - lança AppError (404) se a categoria não for encontrada.
// 5 - avalia se existem produtos vinculados à categoria.
// 6 - se houver produtos vinculados, executa inativação lógica (soft delete) definindo ativo como false.
// 7 - se não houver produtos associados, exclui fisicamente o registro da categoria do banco de dados.
// 8 - retorna objeto descritivo com resultado da operação indicando se foi soft delete ou exclusão física.
export async function deleteCategory(id, organizacaoId) {
  // 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - busca a categoria no banco pelo identificador e organizacaoId incluindo a contagem de produtos associados.
  const category = await prisma.categoria.findFirst({
    where: { id: Number(id), organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { produtos: true } } },
  });
  // 4 - lança AppError (404) se a categoria não for encontrada.
  if (!category) throw new AppError("Categoria não encontrada", 404);

  // 5 - avalia se existem produtos vinculados à categoria.
  // 6 - se houver produtos vinculados, executa inativação lógica (soft delete) definindo ativo como false.
  if (category._count.produtos > 0) {
    const inactivated = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { ativo: false },
    });
    return {
      softDeleted: true,
      message: `Categoria "${category.nome}" possui ${category._count.produtos} produto(s) associado(s) e foi inativada logicamente.`,
      category: inactivated,
    };
  }

  // 7 - se não houver produtos associados, exclui fisicamente o registro da categoria do banco de dados.
  await prisma.categoria.delete({ where: { id: Number(id) } });

  // 8 - retorna objeto descritivo com resultado da operação indicando se foi soft delete ou exclusão física.
  return {
    softDeleted: false,
    message: `Categoria "${category.nome}" excluída permanentemente.`,
  };
}

// função responsável por contar o número total de categorias ativas dentro do escopo informado.
//
// contexto: invocada por categoryController.js na rota GET /api/categories/count para métricas e indicadores.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo de filtragem contendo organizacaoId e opcionalmente lojaId.
//
// retorno: número inteiro com a quantidade de categorias ativas encontradas.
// erros: AppError (400) se scope.organizacaoId não for informado.
// efeitos colaterais: realiza consulta de contagem na tabela Categoria do banco de dados.
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório) com os identificadores organizacionais.
// 2 - valida se organizacaoId está presente lançando AppError (400) caso não informado.
// 3 - executa método count no Prisma aplicando o escopo resolvido por buildScopeWhere e filtro de ativo true.
// 4 - retorna o total numérico calculado.
export async function countCategories(scope) {
  // 1 - recebe scope (objeto obrigatório) com os identificadores organizacionais.
  // 2 - valida se organizacaoId está presente lançando AppError (400) caso não informado.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - executa método count no Prisma aplicando o escopo resolvido por buildScopeWhere e filtro de ativo true.
  // 4 - retorna o total numérico calculado.
  return prisma.categoria.count({
    where: {
      ...buildScopeWhere(scope),
      ativo: true,
    },
  });
}
