// arquivo responsável por implementar as regras de negócio, persistência e métricas analíticas de fornecedores isolados por Organização e Loja.
// atua na camada de serviços do backend, entre os controllers HTTP e o banco de dados relacional.
// tecnologias principais: Prisma ORM (PostgreSQL/NeonDB) com suporte a consultas agregadas em SQL nativo ($queryRaw).
// usado por: supplierController.js para atender aos endpoints REST de /suppliers (criação, listagem, atualização, soft delete e estatísticas).

// importações de acesso ao banco de dados: prisma executa as operações relacionais no PostgreSQL; Prisma.sql constrói fragmentos parametrizados seguros.
import { prisma, Prisma } from "../config/prismaClient.js";
// importações de controle de exceções: AppError lança erros operacionais com código HTTP e mensagem padronizada para o errorHandler global.
import { AppError } from "../utils/errorHandler.js";
// importações de utilitários de sanitização: parseBooleanFlag normaliza strings e números recebidos via JSON/query em valores booleanos estritos.
import { parseBooleanFlag } from "../utils/sanitizers.js";

// função responsável por cadastrar um novo fornecedor vinculado obrigatoriamente à organização e à loja de destino.
//
// contexto: invocada por criarFornecedor em supplierController.js a partir da rota POST /suppliers (restrita a ADMIN e GERENTE).
//
// parâmetros:
//   - data (objeto, obrigatório): dados de cadastro do fornecedor.
//       - data.nome (string, obrigatório): razão social ou nome fantasia do fornecedor; não pode ser vazio.
//       - data.email (string, opcional): endereço eletrônico de contato; convertido para null caso não informado.
//       - data.telefone (string, opcional): telefone de contato; convertido para null caso não informado.
//       - data.endereco (string, opcional): endereço físico da sede; convertido para null caso não informado.
//   - storeScope (objeto, obrigatório): escopo validado pela função resolveWriteStore.
//       - storeScope.organizacaoId (number|string, obrigatório): ID da organização locatária dona do cadastro.
//       - storeScope.lojaId (number|string, obrigatório): ID da filial que receberá o fornecedor.
//
// retorno: objeto fornecedor criado contendo todos os campos da tabela Fornecedor e o objeto loja com id, nome e slug.
// erros:
//   - AppError(400) se storeScope não contiver organizacaoId ou lojaId.
//   - AppError(400) se data.nome estiver ausente, não for string ou contiver apenas espaços em branco.
// efeitos colaterais: insere uma nova linha na tabela Fornecedor no PostgreSQL com ativo = true.
//
// passo a passo:
// 1 - recebe data (objeto com os dados cadastrais) e storeScope (objeto com os identificadores de tenant).
// 2 - valida se storeScope possui organizacaoId e lojaId válidos; lança AppError(400) se faltar algum.
// 3 - extrai nome, email, telefone e endereco de data.
// 4 - valida se nome é uma string não vazia após trim(); lança AppError(400) se for inválido.
// 5 - persiste o novo fornecedor no banco via prisma.fornecedor.create definindo ativo como true, organizacaoId, lojaId e sanitizando campos opcionais para null.
// 6 - inclui os dados parciais da filial vinculada (loja: { select: { id, nome, slug } }).
// 7 - retorna o registro completo do fornecedor persistido.
export async function createSupplier(data, storeScope) {
  // 2 - valida o escopo de gravação obrigatório para garantir o multitenancy
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Loja ou organização não identificada", 400);
  }

  // 3 - extrai as propriedades recebidas no payload
  const { nome, email, telefone, endereco } = data;

  // 4 - valida consistência textual do nome obrigatório
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    throw new AppError("Nome de fornecedor é obrigatório", 400);
  }

  // 5 a 7 - persiste o fornecedor no PostgreSQL associado à organização/loja e devolve com os dados da loja
  return prisma.fornecedor.create({
    data: {
      nome: nome.trim(),
      email: email || null,
      telefone: telefone || null,
      endereco: endereco || null,
      ativo: true,
      organizacaoId: Number(storeScope.organizacaoId),
      lojaId: Number(storeScope.lojaId),
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por listar fornecedores da organização com suporte a filtro de filial e status operacional.
//
// contexto: chamada por listarFornecedores em supplierController.js ao acessar GET /suppliers, alimentando a listagem de fornecedores e seletores de compras.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo de leitura resolvido por resolveReadScope.
//       - scope.organizacaoId (number|string, obrigatório): ID da organização dona dos registros.
//       - scope.lojaId (number|string, opcional): ID da filial; quando presente, restringe a listagem àquela loja.
//   - status (string, opcional, padrão "ativos"): critério de filtro ('ativos', 'inativos' ou qualquer outro valor para trazer todos).
//
// retorno: array de objetos Fornecedor contendo os dados da loja vinculada e o contador numérico de produtos vinculados (_count.produtos).
// erros: AppError(400) se scope.organizacaoId não estiver definido.
// efeitos colaterais: nenhum (função de leitura pura no banco de dados).
//
// passo a passo:
// 1 - recebe scope (objeto de escopo) e status (string de filtro, padrão "ativos").
// 2 - valida se scope.organizacaoId existe; se ausente, lança AppError(400).
// 3 - avalia o parâmetro status e constrói o objeto de filtro statusFilter.
//     3a - se status for "ativos", define { ativo: true }.
//     3b - se status for "inativos", define { ativo: false }.
//     3c - para outros valores (ex.: "todos"), define objeto vazio {}.
// 4 - consulta o banco de dados via prisma.fornecedor.findMany filtrando por organizacaoId, lojaId opcional e statusFilter.
// 5 - carrega os campos id, nome e slug da loja vinculada via include.loja.
// 6 - calcula a quantidade de produtos associados ao fornecedor via include._count.select.produtos.
// 7 - ordena os resultados colocando os fornecedores ativos primeiro (ativo: "desc") e em ordem alfabética (nome: "asc").
// 8 - retorna o array de fornecedores encontrado.
export async function listSuppliers(scope, status = "ativos") {
  // 2 - valida presença de organização no escopo
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - determina o filtro condicional de ativação lógica
  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  // 4 a 8 - busca registros com contagem de produtos e ordenação prioritária por ativos
  return prisma.fornecedor.findMany({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...statusFilter,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
      _count: {
        select: { produtos: true },
      },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

// função responsável por atualizar os dados cadastrais e o status de um fornecedor existente dentro do escopo autorizado.
//
// contexto: invocada por atualizarFornecedor em supplierController.js a partir da rota PUT /suppliers/:id (restrita a ADMIN e GERENTE).
//
// parâmetros:
//   - id (string|number, obrigatório): chave primária do fornecedor que será editado.
//   - data (objeto, obrigatório): campos a serem atualizados (nome, email, telefone, endereco, ativo).
//   - scope (objeto, obrigatório): contexto do usuário autenticado contendo organizacaoId, lojaId e flag restrictToUserStore.
//
// retorno: objeto fornecedor atualizado com os dados da loja associada.
// erros:
//   - AppError(400) se scope.organizacaoId não estiver presente.
//   - AppError(404) se o fornecedor não existir ou não pertencer à organização/loja do usuário.
// efeitos colaterais: atualiza a linha correspondente na tabela Fornecedor no PostgreSQL.
//
// passo a passo:
// 1 - recebe o id do fornecedor, data com os campos a modificar e scope com as restrições de tenant.
// 2 - valida se scope.organizacaoId existe; lança AppError(400) se ausente.
// 3 - extrai nome, email, telefone, endereco e ativo de data.
// 4 - busca o fornecedor via prisma.fornecedor.findFirst validando se o id pertence à organizacaoId e, caso scope.restrictToUserStore seja verdadeiro, se pertence à lojaId do usuário.
// 5 - se o fornecedor não for encontrado, lança AppError(404) "Fornecedor não encontrado".
// 6 - executa prisma.fornecedor.update aplicando apenas os valores definidos (campos com undefined são ignorados pelo Prisma).
// 7 - se ativo tiver sido informado, normaliza o valor através de parseBooleanFlag(ativo).
// 8 - retorna o registro do fornecedor com seus dados atualizados e o relacionamento com a loja.
export async function updateSupplier(id, data, scope) {
  // 2 - valida identificação da organização
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const { nome, email, telefone, endereco, ativo } = data;

  // 4 - busca o fornecedor aplicando o isolamento da organização e da loja para perfis restritos
  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: parseInt(id),
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });

  // 5 - lança 404 se não encontrado ou se pertencer a outro tenant/loja
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  // 6 a 8 - atualiza apenas os atributos fornecidos e retorna o registro
  return prisma.fornecedor.update({
    where: { id: parseInt(id) },
    data: {
      nome: nome ? nome.trim() : undefined,
      email: email !== undefined ? email : undefined,
      telefone: telefone !== undefined ? telefone : undefined,
      endereco: endereco !== undefined ? endereco : undefined,
      ativo: ativo !== undefined ? parseBooleanFlag(ativo) : undefined,
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por ativar ou inativar logicamente um fornecedor (Soft Delete reversível).
//
// contexto: chamada por toggleFornecedorStatus em supplierController.js pela rota PATCH /suppliers/:id/status.
//
// parâmetros:
//   - id (string|number, obrigatório): identificador único do fornecedor.
//   - ativo (boolean|string|number, obrigatório): novo estado desejado para o fornecedor.
//   - scope (objeto, obrigatório): escopo com organizacaoId, lojaId e restrictToUserStore para garantia multitenant.
//
// retorno: objeto fornecedor atualizado com a flag ativo ajustada e dados da loja.
// erros:
//   - AppError(400) se scope.organizacaoId não for informado.
//   - AppError(404) se o fornecedor não for localizado no escopo do usuário.
// efeitos colaterais: modifica o valor da coluna ativo na tabela Fornecedor no PostgreSQL.
//
// passo a passo:
// 1 - recebe o id numérico/string, a flag ativo e o scope do usuário.
// 2 - valida se scope.organizacaoId existe; lança AppError(400) se for falso.
// 3 - converte o id recebido para número inteiro com parseInt(id).
// 4 - busca o fornecedor via prisma.fornecedor.findFirst conferindo se pertence à organização e à loja permitida.
// 5 - se não encontrar, interrompe o fluxo lançando AppError(404).
// 6 - executa prisma.fornecedor.update gravando o novo valor de ativo sanitizado com parseBooleanFlag(ativo).
// 7 - retorna o fornecedor atualizado com as informações da loja incluídas.
export async function toggleSupplierStatus(id, ativo, scope) {
  // 2 - valida presença de organizacaoId
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);
  const supplierId = parseInt(id);

  // 4 - busca o fornecedor respeitando escopo de loja quando restrito
  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: supplierId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.restrictToUserStore && scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
  });

  // 5 - valida existência
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  // 6 e 7 - altera apenas a coluna de ativação e retorna o modelo atualizado
  return prisma.fornecedor.update({
    where: { id: supplierId },
    data: { ativo: parseBooleanFlag(ativo) },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });
}

// função responsável por excluir fornecedor (exclusivo para ADMIN), aplicando Soft Delete automático se houver histórico ou exclusão física caso esteja sem vínculos.
//
// contexto: chamada por deletarFornecedor em supplierController.js a partir da rota DELETE /suppliers/:id, exclusiva para a role ADMIN.
//
// parâmetros:
//   - id (string|number, obrigatório): identificador do fornecedor a ser removido.
//   - organizacaoId (number|string, obrigatório): ID da organização do administrador solicitante.
//
// retorno: objeto com o resumo da operação contendo:
//   - softDeleted (boolean): true se sofreu inativação lógica; false se foi excluído definitivamente.
//   - message (string): mensagem descritiva da ação realizada com o nome do fornecedor.
//   - fornecedor (objeto, opcional): dados do fornecedor inativado quando softDeleted for true.
// erros:
//   - AppError(400) se organizacaoId não for fornecido.
//   - AppError(404) se o fornecedor não existir dentro da organização informada.
// efeitos colaterais: altera ativo para false (se tiver vínculos) OU deleta fisicamente o registro da tabela Fornecedor.
//
// passo a passo:
// 1 - recebe id e organizacaoId.
// 2 - valida se organizacaoId foi informado; lança AppError(400) caso contrário.
// 3 - converte id para número inteiro via parseInt(id).
// 4 - busca o fornecedor no banco conferindo id e organizacaoId, incluindo a contagem de produtos e pedidos vinculados via _count.
// 5 - se o fornecedor não existir na organização, lança AppError(404) "Fornecedor não encontrado".
// 6 - avalia se o fornecedor possui histórico operacional vinculado.
//     6a - se tiver produtos (> 0) OU pedidos (> 0), atualiza ativo para false no banco com prisma.fornecedor.update para preservar integridade referencial.
//     6b - retorna objeto indicando softDeleted = true com mensagem explicativa e o fornecedor inativado.
// 7 - caso não possua nenhum produto ou pedido vinculado, deleta a linha definitivamente via prisma.fornecedor.delete.
// 8 - retorna objeto indicando softDeleted = false com mensagem de sucesso na exclusão permanente.
export async function deleteSupplier(id, organizacaoId) {
  // 2 - valida presença de organização
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);
  const supplierId = parseInt(id);

  // 4 - busca o fornecedor com a contagem de produtos e pedidos vinculados
  const supplier = await prisma.fornecedor.findFirst({
    where: { id: supplierId, organizacaoId: Number(organizacaoId) },
    include: { _count: { select: { produtos: true, pedidos: true } } },
  });

  // 5 - interrompe com 404 se não encontrado
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  // 6 - decisão de integridade: se houver histórico de produtos ou pedidos, aplica inativação lógica (Soft Delete)
  if (supplier._count.produtos > 0 || supplier._count.pedidos > 0) {
    const inactivated = await prisma.fornecedor.update({
      where: { id: supplierId },
      data: { ativo: false },
    });
    return {
      softDeleted: true,
      message: `Fornecedor "${supplier.nome}" possui histórico ou produtos vinculados e foi inativado logicamente.`,
      fornecedor: inactivated,
    };
  }

  // 7 e 8 - sem histórico associado, executa deleção física direta
  await prisma.fornecedor.delete({ where: { id: supplierId } });
  return {
    softDeleted: false,
    message: `Fornecedor "${supplier.nome}" deletado permanentemente com sucesso.`,
  };
}

// função responsável por obter os dados completos de um único fornecedor respeitando os limites da organização e filial.
//
// contexto: invocada por obterFornecedor em supplierController.js na rota GET /suppliers/:id.
//
// parâmetros:
//   - id (string|number, obrigatório): identificador do fornecedor requisitado.
//   - scope (objeto, obrigatório): escopo de leitura resolvido com organizacaoId e opcionalmente lojaId.
//
// retorno: objeto Fornecedor completo com os dados da loja vinculada (id, nome e slug).
// erros:
//   - AppError(400) se scope.organizacaoId for inválido ou ausente.
//   - AppError(400) se id não for um número inteiro válido (NaN).
//   - AppError(404) se o fornecedor não for encontrado dentro do escopo.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe id e o objeto scope.
// 2 - valida se scope.organizacaoId existe; se faltar, lança AppError(400).
// 3 - converte id para inteiro e valida via isNaN(); se for inválido, lança AppError(400) "ID de fornecedor inválido".
// 4 - consulta o fornecedor via prisma.fornecedor.findFirst filtrando por id, organizacaoId e lojaId (se presente no escopo).
// 5 - carrega os campos id, nome e slug da loja vinculada.
// 6 - verifica se o registro foi localizado; se não existir no escopo, lança AppError(404) "Fornecedor não encontrado".
// 7 - retorna os dados do fornecedor localizado.
export async function getSupplierById(id, scope) {
  // 2 - valida identificação da organização
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - valida tipo numérico do id
  const supplierId = parseInt(id);
  if (isNaN(supplierId)) throw new AppError("ID de fornecedor inválido", 400);

  // 4 e 5 - consulta fornecedor associado à loja no escopo da organização
  const supplier = await prisma.fornecedor.findFirst({
    where: {
      id: supplierId,
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
    },
    include: {
      loja: { select: { id: true, nome: true, slug: true } },
    },
  });

  // 6 - lança 404 caso não exista
  if (!supplier) throw new AppError("Fornecedor não encontrado", 404);

  // 7 - retorna os dados do fornecedor
  return supplier;
}

// função responsável por contar a quantidade de fornecedores ativos na organização ou na loja especificada.
//
// contexto: chamada por countFornecedores em supplierController.js a partir do endpoint GET /suppliers/count, utilizada para alimentar cards de KPI no Dashboard.
//
// parâmetros:
//   - scope (objeto, obrigatório): contexto multitenant com organizacaoId e lojaId opcional.
//
// retorno: número inteiro representando o total de fornecedores com ativo = true encontrados no escopo.
// erros: AppError(400) se scope.organizacaoId estiver ausente.
// efeitos colaterais: nenhum (consulta count no banco).
//
// passo a passo:
// 1 - recebe o objeto scope.
// 2 - valida a presença de scope.organizacaoId; lança AppError(400) se ausente.
// 3 - executa prisma.fornecedor.count aplicando filtros para organizacaoId, lojaId (se informada) e ativo = true.
// 4 - retorna o número total de fornecedores ativos encontrados.
export async function countSuppliers(scope) {
  // 2 - valida identificação da organização
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 e 4 - conta registros ativos
  return prisma.fornecedor.count({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ativo: true,
    },
  });
}

// função responsável por consolidar métricas de movimentação física (reposições e vendas) por fornecedor através de consulta SQL analítica pura.
//
// contexto: invocada por getSupplierStats em supplierController.js a partir da rota GET /suppliers/stats, alimentando os gráficos e tabelas da tela de Fornecedores.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo de consulta com organizacaoId e lojaId opcional.
//   - status (string, opcional, padrão "ativos"): filtro de situação ('ativos', 'inativos' ou 'todos').
//
// retorno: array de objetos com as métricas consolidadas de cada fornecedor contendo:
//   - id (number): chave primária do fornecedor.
//   - nome (string): nome do fornecedor.
//   - ativo (boolean): estado de ativação.
//   - lojaNome (string): nome da filial à qual o fornecedor pertence.
//   - totalReposicoes (number): quantidade total de itens repostos (entradas).
//   - totalVendas (number): quantidade total de itens vendidos (saídas).
//   - totalEntradas (number): espelho de totalReposicoes para compatibilidade com o frontend.
//   - totalSaidas (number): espelho de totalVendas para compatibilidade com o frontend.
//   - totalMovimentacoes (number): soma total de itens movimentados.
//   - produtoMaisMovimentado (string): texto fixo indicativo "Geral".
// erros: AppError(400) se scope.organizacaoId estiver ausente.
// efeitos colaterais: nenhum (execução de query SQL bruta somente de leitura).
//
// passo a passo:
// 1 - recebe scope e o filtro de status (padrão "ativos").
// 2 - valida a existência de scope.organizacaoId; lança AppError(400) se não existir.
// 3 - monta o filtro dinâmico de loja em Prisma.sql: se houver lojaId, gera cláusula AND f."lojaId" = :lojaId; senão, utiliza Prisma.empty.
// 4 - monta o filtro dinâmico de status em Prisma.sql.
//     4a - se status for "inativos", gera AND f."ativo" = false.
//     4b - se status for "todos", utiliza Prisma.empty.
//     4c - caso contrário, gera AND f."ativo" = true.
// 5 - executa prisma.$queryRaw realizando os JOINs entre Fornecedor, Loja, Produto, Movimento e Pedido.
// 6 - itera sobre rawResults com .map() convertendo tipos numéricos do PostgreSQL para Number e Boolean nativos do JavaScript.
// 7 - retorna o array de objetos estruturados pronto para renderização nos gráficos e relatórios do frontend.
export async function getSupplierStats(scope, status = "ativos") {
  // 2 - valida a organização no escopo
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - monta cláusula de filtro de loja parametrizada
  const lojaFilter = scope.lojaId
    ? Prisma.sql`AND f."lojaId" = ${Number(scope.lojaId)}`
    : Prisma.empty;

  // 4 - monta cláusula de filtro de status parametrizada
  const statusFilterSql =
    status === "inativos"
      ? Prisma.sql`AND f."ativo" = false`
      : status === "todos"
      ? Prisma.empty
      : Prisma.sql`AND f."ativo" = true`;

  // 5 - executa agregação SQL analítica excluindo estornos e pedidos não concluídos
  const rawResults = await prisma.$queryRaw`
    SELECT
      f.id AS "id",
      f.nome AS "nome",
      f.ativo AS "ativo",
      l.nome AS "lojaNome",
      COALESCE(SUM(CASE WHEN m.tipo = 'REPOSICAO' THEN m.quantidade ELSE 0 END), 0)::int AS "totalReposicoes",
      COALESCE(SUM(CASE WHEN m.tipo = 'VENDA' THEN m.quantidade ELSE 0 END), 0)::int AS "totalVendas",
      COALESCE(SUM(m.quantidade), 0)::int AS "totalMovimentacoes"
    FROM "Fornecedor" f
    JOIN "Loja" l ON l.id = f."lojaId"
    LEFT JOIN "Produto" p ON p."fornecedorId" = f.id
    LEFT JOIN "Movimento" m ON m."produtoId" = p.id AND m."estorno" = false
    LEFT JOIN "Pedido" ped ON ped.id = m."pedidoId"
    WHERE f."organizacaoId" = ${Number(scope.organizacaoId)}
      ${statusFilterSql}
      ${lojaFilter}
      AND (m.id IS NULL OR m."pedidoId" IS NULL OR ped."status" = 'CONCLUIDO')
    GROUP BY f.id, f.nome, f.ativo, l.nome
    ORDER BY f.nome ASC
  `;

  // 6 e 7 - mapeia os resultados brutos tipando e criando propriedades compatíveis com o frontend
  return rawResults.map((sup) => ({
    id: Number(sup.id),
    nome: sup.nome,
    ativo: Boolean(sup.ativo),
    lojaNome: sup.lojaNome,
    totalReposicoes: Number(sup.totalReposicoes || 0),
    totalVendas: Number(sup.totalVendas || 0),
    totalEntradas: Number(sup.totalReposicoes || 0),
    totalSaidas: Number(sup.totalVendas || 0),
    totalMovimentacoes: Number(sup.totalMovimentacoes || 0),
    produtoMaisMovimentado: "Geral",
  }));
}
