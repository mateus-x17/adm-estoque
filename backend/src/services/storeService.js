// arquivo responsável por gerenciar regras de negócio, ciclo de vida e persistência de lojas filiais e matriz da organização.
// atua na camada de serviços (services) do backend.
// tecnologias principais: Prisma Client, PostgreSQL, JavaScript ES Modules.
// usado por: storeController.js para atender rotas de listagem, consulta, cadastro, edição e exclusão de lojas.

// importações de infraestrutura e persistência:
// prisma estabelece comunicação direta com o banco relacional para operações na tabela Loja.
import { prisma } from "../config/prismaClient.js";

// importações de utilitários do sistema:
// AppError padroniza lançamento de erros com código HTTP; parseBooleanFlag sanitiza valores booleanos;
// generateSlug produz identificadores textuais seguros para URLs da filial.
import { AppError } from "../utils/errorHandler.js";
import { parseBooleanFlag } from "../utils/sanitizers.js";
import { generateSlug } from "../utils/tenantScope.js";

// importações de middlewares para efeitos colaterais de cache:
// invalidateUserCache invalida tokens e sessões em cache para aplicar imediatamente bloqueios ou renomeações de loja.
import { invalidateUserCache } from "../middlewares/authMiddleware.js";

// função responsável por listar lojas acessíveis ao usuário autenticado de acordo com seu perfil de acesso.
//
// contexto: invocada por storeController.js na rota GET /api/stores.
//
// parâmetros:
//   - requestingUser (objeto, obrigatório): dados da sessão do usuário contendo role, organizacaoId e lojaId.
//   - status (string, opcional, padrão "todos"): filtro de situação ('ativos', 'inativos' ou 'todos').
//
// retorno: array de objetos de lojas com contadores agregados de usuários, produtos e pedidos.
// erros: AppError (400) se requestingUser.organizacaoId não estiver presente.
// efeitos colaterais: realiza consulta de leitura na tabela Loja do banco de dados.
//
// passo a passo:
// 1 - recebe requestingUser (objeto obrigatório) e status (string opcional com padrão 'todos').
// 2 - valida a presença de organizacaoId no usuário solicitante lançando AppError (400) se ausente.
// 3 - converte organizacaoId para número e define o filtro de status booleano para a consulta.
// 4 - avalia se o usuário possui perfil não administrador retornando apenas sua loja de vínculo ou lista vazia.
// 5 - executa consulta findMany para administradores filtrando pela organização com ordenação por status e identificador.
// 6 - retorna a lista de lojas com contadores agregados de relacionamentos.
export async function listStores(requestingUser, status = "todos") {
  // 1 - recebe requestingUser (objeto obrigatório) e status (string opcional com padrão 'todos').
  // 2 - valida a presença de organizacaoId no usuário solicitante lançando AppError (400) se ausente.
  if (!requestingUser?.organizacaoId) {
    throw new AppError("Organização não identificada", 400);
  }

  // 3 - converte organizacaoId para número e define o filtro de status booleano para a consulta.
  const organizacaoId = Number(requestingUser.organizacaoId);
  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  // 4 - avalia se o usuário possui perfil não administrador retornando apenas sua loja de vínculo ou lista vazia.
  if (requestingUser.role !== "ADMIN") {
    if (!requestingUser.lojaId) return [];
    const loja = await prisma.loja.findFirst({
      where: { id: Number(requestingUser.lojaId), organizacaoId },
      include: {
        _count: { select: { usuarios: true, produtos: true, pedidos: true } },
      },
    });
    return loja ? [loja] : [];
  }

  // 5 - executa consulta findMany para administradores filtrando pela organização com ordenação por status e identificador.
  // 6 - retorna a lista de lojas com contadores agregados de relacionamentos.
  return prisma.loja.findMany({
    where: { organizacaoId, ...statusFilter },
    include: {
      _count: {
        select: { usuarios: true, produtos: true, pedidos: true },
      },
    },
    orderBy: [{ ativo: "desc" }, { id: "asc" }],
  });
}

// função responsável por buscar detalhes completos de uma loja específica garantindo isolamento da organização.
//
// contexto: invocada por storeController.js na rota GET /api/stores/:id.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico da loja a ser consultada.
//   - requestingUser (objeto, obrigatório): dados do usuário solicitante contendo role, organizacaoId e lojaId.
//
// retorno: objeto detalhado da loja contendo contadores agregados de usuários, produtos, categorias, fornecedores e pedidos.
// erros: AppError (400) se id for inválido; AppError (403) se usuário não administrador tentar consultar loja alheia; AppError (404) se a loja não existir na organização.
// efeitos colaterais: realiza consulta de leitura na tabela Loja do banco de dados.
//
// passo a passo:
// 1 - recebe id (número ou string) e requestingUser (objeto obrigatório).
// 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
// 3 - valida se o usuário possui perfil de administrador ou se pertence à loja solicitada lançando AppError (403) em caso negativo.
// 4 - busca a loja no banco pelo id e organizacaoId incluindo contadores agregados de relacionamentos.
// 5 - lança AppError (404) caso a loja não seja encontrada na organização do usuário.
// 6 - retorna os dados detalhados da loja consultada.
export async function getStoreById(id, requestingUser) {
  // 1 - recebe id (número ou string) e requestingUser (objeto obrigatório).
  // 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  // 3 - valida se o usuário possui perfil de administrador ou se pertence à loja solicitada lançando AppError (403) em caso negativo.
  if (requestingUser.role !== "ADMIN" && Number(requestingUser.lojaId) !== lojaId) {
    throw new AppError("Acesso negado a esta loja", 403);
  }

  // 4 - busca a loja no banco pelo id e organizacaoId incluindo contadores agregados de relacionamentos.
  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(requestingUser.organizacaoId) },
    include: {
      _count: {
        select: { usuarios: true, produtos: true, categorias: true, fornecedores: true, pedidos: true },
      },
    },
  });

  // 5 - lança AppError (404) caso a loja não seja encontrada na organização do usuário.
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  // 6 - retorna os dados detalhados da loja consultada.
  return loja;
}

// função responsável por criar uma nova loja ou filial para a organização.
//
// contexto: invocada por storeController.js na rota POST /api/stores restrita a administradores.
//
// parâmetros:
//   - data (objeto, obrigatório): informações cadastrais da filial (nome, slug, cnpj, telefone, endereco).
//       - data.nome (string, obrigatório): nome fantasia da nova loja.
//       - data.slug (string, opcional): identificador textual único da loja dentro da organização.
//       - data.cnpj (string, opcional): cadastro fiscal da filial.
//       - data.telefone (string, opcional): contato telefônico da loja.
//       - data.endereco (string, opcional): endereço completo da unidade.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária da filial.
//
// retorno: objeto da loja recém-criada com contadores zerados de relacionamentos.
// erros: AppError (400) se organizacaoId faltar, se o nome for vazio, se o slug for inválido ou duplicado.
// efeitos colaterais: insere um novo registro na tabela Loja do banco de dados.
//
// passo a passo:
// 1 - recebe data (objeto obrigatório) e organizacaoId (número ou string obrigatório).
// 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
// 3 - extrai e valida o nome da loja lançando AppError (400) se vazio.
// 4 - gera o slug base da loja validando sua estrutura com generateSlug.
// 5 - verifica no banco se já existe outra loja com o mesmo slug na organização lançando erro se informado manualmente ou gerando sufixo numérico.
// 6 - cria o registro da loja no banco de dados vinculando-o à organizacaoId com status ativo.
// 7 - retorna o registro da loja criada com inclusão dos contadores de entidades relacionadas.
export async function createStore(data, organizacaoId) {
  // 1 - recebe data (objeto obrigatório) e organizacaoId (número ou string obrigatório).
  // 2 - valida a presença de organizacaoId lançando AppError (400) se ausente.
  if (!organizacaoId) throw new AppError("Organização não identificada", 400);

  // 3 - extrai e valida o nome da loja lançando AppError (400) se vazio.
  const { nome, slug, cnpj, telefone, endereco } = data;
  if (!nome || String(nome).trim() === "") {
    throw new AppError("Nome da loja é obrigatório", 400);
  }

  // 4 - gera o slug base da loja validando sua estrutura com generateSlug.
  const baseSlug = generateSlug(slug || nome);
  if (!baseSlug) throw new AppError("Nome inválido para geração de código da loja", 400);

  // 5 - verifica no banco se já existe outra loja com o mesmo slug na organização lançando erro se informado manualmente ou gerando sufixo numérico.
  let finalSlug = baseSlug;
  const existing = await prisma.loja.findUnique({
    where: {
      organizacaoId_slug: {
        organizacaoId: Number(organizacaoId),
        slug: finalSlug,
      },
    },
  });

  if (existing) {
    if (slug) {
      throw new AppError("Já existe uma loja com este identificador (slug) na sua rede", 400);
    }
    finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // 6 - cria o registro da loja no banco de dados vinculando-o à organizacaoId com status ativo.
  // 7 - retorna o registro da loja criada com inclusão dos contadores de entidades relacionadas.
  return prisma.loja.create({
    data: {
      nome: String(nome).trim(),
      slug: finalSlug,
      cnpj: cnpj ? String(cnpj).trim() : null,
      telefone: telefone ? String(telefone).trim() : null,
      endereco: endereco ? String(endereco).trim() : null,
      ativo: true,
      organizacaoId: Number(organizacaoId),
    },
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });
}

// função responsável por atualizar dados cadastrais de uma loja da organização.
//
// contexto: invocada por storeController.js na rota PUT /api/stores/:id restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico da loja a ser alterada.
//   - data (objeto, obrigatório): campos a serem atualizados (nome, slug, cnpj, telefone, endereco).
//   - organizacaoId (número ou string, obrigatório): identificador da organização dona da loja.
//
// retorno: objeto da loja atualizada com contadores de relacionamentos.
// erros: AppError (400) se id for inválido, nome for vazio ou slug colidir com outra loja; AppError (404) se a loja não existir na organização.
// efeitos colaterais: atualiza registro na tabela Loja e invalida cache de sessões ativas com invalidateUserCache.
//
// passo a passo:
// 1 - recebe id (número ou string), data (objeto) e organizacaoId (número ou string obrigatório).
// 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
// 3 - localiza a loja garantindo que pertence à organização lançando AppError (404) se não existir.
// 4 - valida e monta os campos a atualizar verificando unicidade de slug na organização se alterado.
// 5 - atualiza os dados cadastrais da loja no banco de dados via Prisma update.
// 6 - invalida o cache de usuários para refletir eventuais alterações cadastrais da loja nas sessões.
// 7 - retorna o registro da loja atualizado.
export async function updateStore(id, data, organizacaoId) {
  // 1 - recebe id (número ou string), data (objeto) e organizacaoId (número ou string obrigatório).
  // 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  // 3 - localiza a loja garantindo que pertence à organização lançando AppError (404) se não existir.
  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
  });
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  // 4 - valida e monta os campos a atualizar verificando unicidade de slug na organização se alterado.
  const { nome, slug, cnpj, telefone, endereco } = data;
  const updateData = {};

  if (nome !== undefined) {
    if (String(nome).trim() === "") throw new AppError("Nome da loja não pode ser vazio", 400);
    updateData.nome = String(nome).trim();
  }

  if (slug !== undefined && String(slug).trim() !== "") {
    const cleanSlug = generateSlug(slug);
    if (!cleanSlug) throw new AppError("Slug da loja inválido", 400);
    const conflict = await prisma.loja.findUnique({
      where: {
        organizacaoId_slug: {
          organizacaoId: Number(organizacaoId),
          slug: cleanSlug,
        },
      },
    });
    if (conflict && conflict.id !== lojaId) {
      throw new AppError("Já existe outra loja utilizando este identificador (slug)", 400);
    }
    updateData.slug = cleanSlug;
  }

  if (cnpj !== undefined) updateData.cnpj = cnpj ? String(cnpj).trim() : null;
  if (telefone !== undefined) updateData.telefone = telefone ? String(telefone).trim() : null;
  if (endereco !== undefined) updateData.endereco = endereco ? String(endereco).trim() : null;

  // 5 - atualiza os dados cadastrais da loja no banco de dados via Prisma update.
  const updated = await prisma.loja.update({
    where: { id: lojaId },
    data: updateData,
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });

  // 6 - invalida o cache de usuários para refletir eventuais alterações cadastrais da loja nas sessões.
  invalidateUserCache();

  // 7 - retorna o registro da loja atualizado.
  return updated;
}

// função responsável por alternar a situação ativa ou inativa de uma filial promovendo soft delete.
//
// contexto: invocada por storeController.js na rota PATCH /api/stores/:id/status restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador numérico da filial.
//   - ativo (booleano ou string, obrigatório): novo estado desejado para o status da loja.
//   - organizacaoId (número ou string, obrigatório): identificador da organização vinculada.
//
// retorno: objeto da loja com status atualizado e contadores agregados.
// erros: AppError (400) se id for inválido ou se for solicitada desativação da única loja ativa restante; AppError (404) se a loja não for localizada.
// efeitos colaterais: atualiza a coluna ativo da tabela Loja e invalida o cache de autenticação de usuários.
//
// passo a passo:
// 1 - recebe id (número ou string), ativo (booleano ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
// 3 - busca a loja no banco para confirmar sua existência na organização informada lançando AppError (404) se ausente.
// 4 - sanitiza o parâmetro ativo com parseBooleanFlag e impede a inativação caso seja a única filial ativa restante na rede.
// 5 - atualiza a flag ativo da loja no banco de dados.
// 6 - invalida o cache de autenticação de usuários para revogar imediatamente o acesso dos colaboradores da filial.
// 7 - retorna o registro da loja com o status modificado.
export async function toggleStoreStatus(id, ativo, organizacaoId) {
  // 1 - recebe id (número ou string), ativo (booleano ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  // 3 - busca a loja no banco para confirmar sua existência na organização informada lançando AppError (404) se ausente.
  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
  });
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  // 4 - sanitiza o parâmetro ativo com parseBooleanFlag e impede a inativação caso seja a única filial ativa restante na rede.
  const newStatus = parseBooleanFlag(ativo);
  if (!newStatus) {
    const activeCount = await prisma.loja.count({
      where: { organizacaoId: Number(organizacaoId), ativo: true },
    });
    if (activeCount <= 1 && loja.ativo) {
      throw new AppError(
        "Operação bloqueada: a organização precisa manter pelo menos uma loja ativa.",
        400
      );
    }
  }

  // 5 - atualiza a flag ativo da loja no banco de dados.
  const updated = await prisma.loja.update({
    where: { id: lojaId },
    data: { ativo: newStatus },
    include: {
      _count: { select: { usuarios: true, produtos: true, pedidos: true } },
    },
  });

  // 6 - invalida o cache de autenticação de usuários para revogar imediatamente o acesso dos colaboradores da filial.
  invalidateUserCache();

  // 7 - retorna o registro da loja com o status modificado.
  return updated;
}

// função responsável por excluir fisicamente uma filial ou inativá-la logicamente se possuir dados históricos.
//
// contexto: invocada por storeController.js na rota DELETE /api/stores/:id restrita a administradores.
//
// parâmetros:
//   - id (número ou string, obrigatório): identificador único da loja a ser excluída ou desativada.
//   - organizacaoId (número ou string, obrigatório): identificador da organização proprietária da filial.
//
// retorno: objeto contendo softDeleted (booleano), message (mensagem descritiva da ação realizada) e opcionalmente loja (dados inativados).
// erros: AppError (400) se id for inválido ou se a loja for a única filial ativa restante; AppError (404) se a loja não for encontrada.
// efeitos colaterais: atualiza registro com ativo false ou remove definitivamente a linha da tabela Loja; invalida cache de sessões.
//
// passo a passo:
// 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
// 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
// 3 - localiza a loja no banco verificando pertencimento à organização e carregando contadores de todas as dependências.
// 4 - lança AppError (404) se a loja não for encontrada na organização.
// 5 - verifica a quantidade total de lojas ativas na rede impedindo a exclusão ou inativação da única unidade ativa restante.
// 6 - avalia se existem dependências vinculadas (produtos, pedidos, movimentos, usuários, categorias ou fornecedores).
// 7 - se houver histórico ou dependências, aplica inativação lógica (soft delete) definindo ativo como false.
// 8 - se não houver registros vinculados, exclui fisicamente o registro da tabela Loja.
// 9 - invalida o cache de usuários em ambos os cenários e retorna o resultado da operação.
export async function deleteStore(id, organizacaoId) {
  // 1 - recebe id (número ou string) e organizacaoId (número ou string obrigatório).
  // 2 - valida e converte o id da loja para número lançando AppError (400) se for NaN.
  const lojaId = Number(id);
  if (isNaN(lojaId)) throw new AppError("ID de loja inválido", 400);

  // 3 - localiza a loja no banco verificando pertencimento à organização e carregando contadores de todas as dependências.
  const loja = await prisma.loja.findFirst({
    where: { id: lojaId, organizacaoId: Number(organizacaoId) },
    include: {
      _count: {
        select: {
          usuarios: true,
          produtos: true,
          categorias: true,
          fornecedores: true,
          pedidos: true,
          movimentos: true,
        },
      },
    },
  });

  // 4 - lança AppError (404) se a loja não for encontrada na organização.
  if (!loja) throw new AppError("Loja não encontrada nesta organização", 404);

  // 5 - verifica a quantidade total de lojas ativas na rede impedindo a exclusão ou inativação da única unidade ativa restante.
  const activeCount = await prisma.loja.count({
    where: { organizacaoId: Number(organizacaoId), ativo: true },
  });
  if (activeCount <= 1 && loja.ativo) {
    throw new AppError(
      "Não é possível excluir ou inativar a única loja ativa da organização.",
      400
    );
  }

  // 6 - avalia se existem dependências vinculadas (produtos, pedidos, movimentos, usuários, categorias ou fornecedores).
  const hasDependencies =
    loja._count.produtos > 0 ||
    loja._count.pedidos > 0 ||
    loja._count.movimentos > 0 ||
    loja._count.usuarios > 0 ||
    loja._count.categorias > 0 ||
    loja._count.fornecedores > 0;

  // 7 - se houver histórico ou dependências, aplica inativação lógica (soft delete) definindo ativo como false.
  if (hasDependencies) {
    const inactivated = await prisma.loja.update({
      where: { id: lojaId },
      data: { ativo: false },
    });
    // 9 - invalida o cache de usuários em ambos os cenários e retorna o resultado da operação.
    invalidateUserCache();
    return {
      softDeleted: true,
      message: `Loja "${loja.nome}" possui histórico ou equipe vinculada e foi desativada logicamente.`,
      loja: inactivated,
    };
  }

  // 8 - se não houver registros vinculados, exclui fisicamente o registro da tabela Loja.
  await prisma.loja.delete({ where: { id: lojaId } });
  // 9 - invalida o cache de usuários em ambos os cenários e retorna o resultado da operação.
  invalidateUserCache();
  return {
    softDeleted: false,
    message: `Loja "${loja.nome}" removida definitivamente com sucesso.`,
  };
}
