// arquivo responsável por controlar requisições HTTP de colaboradores, perfil próprio (/me), situações de RH e demissões.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js, Pino Logger e Cloudinary SDK.
// usado por: userRoutes.js para responder aos endpoints de colaboradores (/users).

// importações de logging: childLogger instancia logger estruturado para o módulo userController.
import { childLogger } from "../config/logger.js";
// importações de serviços: userService encapsula regras de criação, edição, transferência, rescisão e relatórios de desligamento.
import * as userService from "../services/userService.js";
// importações de erros: AppError formata exceções operacionais com código HTTP adequado.
import { AppError } from "../utils/errorHandler.js";
// importações de upload: uploadToCloudinary e getTenantFolder gerenciam o upload de avatares no storage na nuvem.
import { uploadToCloudinary, getTenantFolder } from "../config/cloudinaryConfig.js";
// importações de banco de dados: prisma executa consultas diretas para resolução de slugs de filiais.
import { prisma } from "../config/prismaClient.js";
// importações de escopo: resolveReadScope valida e isola o acesso a colaboradores por filial.
import { resolveReadScope } from "../utils/tenantScope.js";

// instância de logger para registro de operações de colaboradores
const log = childLogger("userController");

// cache em memória para armazenar a lista resumida de nomes de colaboradores para dropdowns com TTL de 30 segundos
const namesCacheByScope = new Map();
const NAMES_CACHE_TTL_MS = 30 * 1000;

// função responsável por invalidar o cache de nomes de colaboradores de uma organização inteira ou de todas.
//
// contexto: chamada após qualquer mutação em colaboradores (criação, edição, transferência, demissão).
//
// parâmetros:
//   - organizacaoId (number|string|null, opcional, padrão null): identificador da organização; se nulo, limpa todo o mapa.
//
// retorno: nenhum (função síncrona de purga de memória).
// erros: nenhum.
// efeitos colaterais: remove chaves do mapa namesCacheByScope em memória.
//
// passo a passo:
// 1 - recebe organizacaoId.
// 2 - se organizacaoId for omitido, limpa todo o cache com namesCacheByScope.clear().
// 3 - caso contrário, itera sobre as chaves removendo as que iniciam com o prefixo da organização especificada.
export function invalidateUserNamesCache(organizacaoId = null) {
  // 2 - limpa todo o cache se nulo
  if (!organizacaoId) {
    namesCacheByScope.clear();
    return;
  }
  // 3 - remove apenas as entradas da organização
  const prefix = `${Number(organizacaoId)}:`;
  for (const key of namesCacheByScope.keys()) {
    if (key.startsWith(prefix)) {
      namesCacheByScope.delete(key);
    }
  }
}

// função responsável por resolver a pasta hierárquica no Cloudinary para armazenamento do avatar do colaborador.
//
// contexto: função auxiliar interna chamada durante a criação ou atualização de fotos de usuários.
//
// parâmetros:
//   - orgSlug (string, obrigatório): slug da organização locatária.
//   - organizacaoId (number, obrigatório): chave primária da organização.
//   - lojaId (number|string|null, opcional): chave primária da loja vinculada ao colaborador.
//
// retorno: string estruturada com o caminho da pasta no Cloudinary.
// erros: nenhum.
// efeitos colaterais: consulta o banco com prisma.loja.findFirst para obter o slug da filial.
//
// passo a passo:
// 1 - recebe orgSlug, organizacaoId e lojaId.
// 2 - se lojaId não for informado, retorna pasta corporativa da organização através de getTenantFolder(orgSlug, "corporativo", "usuarios").
// 3 - consulta o slug da loja no banco via prisma.loja.findFirst.
// 4 - retorna o caminho da pasta no Cloudinary com o slug da filial.
async function resolveUserCloudinaryFolder(orgSlug, organizacaoId, lojaId) {
  // 2 - pasta corporativa para ADMIN sem loja fixa
  if (!lojaId) {
    return getTenantFolder(orgSlug, "corporativo", "usuarios");
  }
  // 3 - busca slug da filial
  const loja = await prisma.loja.findFirst({
    where: { id: Number(lojaId), organizacaoId: Number(organizacaoId) },
    select: { slug: true },
  });
  // 4 - monta pasta da filial
  return getTenantFolder(orgSlug, loja?.slug || lojaId, "usuarios");
}

// função responsável por cadastrar um novo colaborador ou administrador na organização (exclusivo para perfil ADMIN).
//
// contexto: chamada pela rota POST /users no cadastro de funcionários da equipe.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo dados do colaborador no corpo e foto opcional em req.file.
//   - res (Response, obrigatório): resposta HTTP com status 201 e dados do usuário cadastrado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (responde HTTP 201 Created com o usuário criado).
// erros: repassa ao next(err) se o e-mail for duplicado ou a loja for inválida.
// efeitos colaterais: grava foto no Cloudinary, insere linha na tabela Usuario e purga cache de nomes.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai organizacaoId e orgSlug do administrador logado.
// 3 - processa upload do avatar no Cloudinary via uploadToCloudinary se req.file existir.
// 4 - aciona userService.createUser para persistir o novo colaborador com hash de senha bcrypt.
// 5 - invalida o cache de nomes da organização através de invalidateUserNamesCache.
// 6 - grava log de auditoria e responde com status HTTP 201 Created entregando o colaborador.
export async function createUser(req, res, next) {
  try {
    // 2 - extrai contexto de tenant
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

    // 3 - realiza upload do avatar se fornecido
    let imagem = undefined;
    if (req.file) {
      const folder = await resolveUserCloudinaryFolder(orgSlug, organizacaoId, req.body?.lojaId);
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    // 4 - persiste usuário
    const user = await userService.createUser(req.body, imagem, organizacaoId);
    // 5 - purga cache
    invalidateUserNamesCache(organizacaoId);

    // 6 - auditoria e resposta 201
    log.info(
      { user: req.user?.id, organizacaoId, action: "CREATE_USER", targetId: user.id },
      "Colaborador criado na organização"
    );
    res.status(201).json(user);
  } catch (err) {
    log.error({ err }, "Erro ao criar colaborador");
    next(err);
  }
}

// função responsável por listar nomes e identificadores de colaboradores ativos para preenchimento de seletores e filtros.
//
// contexto: invocada pela rota GET /users/names; utiliza cache em memória para resposta instantânea.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo usuário autenticado e parâmetros de escopo.
//   - res (Response, obrigatório): resposta HTTP para envio do array de colaboradores.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com a lista resumida de colaboradores).
// erros: repassa ao next(err) em caso de falha.
// efeitos colaterais: armazena resultados no mapa namesCacheByScope por 30 segundos.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - monta a chave de cache e verifica se há dados recentes (menos de 30s); se houver, responde imediatamente.
// 4 - caso não esteja em cache, consulta os usuários ativos no banco via prisma.usuario.findMany.
// 5 - armazena o resultado no cache com timestamp atual e responde enviando o JSON.
export async function getUserNames(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - consulta cache em memória
    const cacheKey = `${scope.organizacaoId}:${scope.lojaId || "all"}`;
    const now = Date.now();
    const cached = namesCacheByScope.get(cacheKey);

    if (cached && now - cached.timestamp < NAMES_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    // 4 - busca no banco
    const users = await prisma.usuario.findMany({
      where: {
        organizacaoId: scope.organizacaoId,
        ...(scope.lojaId ? { lojaId: scope.lojaId } : {}),
      },
      select: {
        id: true,
        nome: true,
        role: true,
        lojaId: true,
        loja: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
    });

    // 5 - popula cache e responde
    namesCacheByScope.set(cacheKey, { data: users, timestamp: now });
    res.json(users);
  } catch (err) {
    log.error({ err }, "Erro ao buscar nomes de colaboradores");
    next(err);
  }
}

// função responsável por listar colaboradores paginados da organização com suporte a filtros de cargo, situação e desligados.
//
// contexto: chamada pela rota GET /users para alimentar a tela de gestão de colaboradores.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo parâmetros de filtro e paginação em req.query.
//   - res (Response, obrigatório): resposta HTTP com o array paginado e metadados.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com os usuários paginados).
// erros: repassa ao next(err) em caso de falha.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona userService.listUsers com os filtros da query, organizacaoId e parâmetros de paginação.
// 3 - responde entregando o resultado paginado em formato JSON.
export async function listUsers(req, res, next) {
  try {
    // 2 - consulta usuários paginados
    const users = await userService.listUsers({
      organizacaoId: req.user.organizacaoId,
      lojaId: req.query.lojaId || "",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search || "",
      role: req.query.role || "",
      situacao: req.query.situacao || "",
      includeDismissed: req.query.includeDismissed || "",
    });
    // 3 - responde
    res.json(users);
  } catch (err) {
    log.error({ err }, "Erro ao listar usuários");
    next(err);
  }
}

// função responsável por consultar os detalhes cadastrais completos de um colaborador específico da organização.
//
// contexto: chamada pela rota GET /users/:id ao abrir o modal de informações do colaborador.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e a organização do administrador.
//   - res (Response, obrigatório): resposta HTTP com os dados do usuário.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com o perfil completo do colaborador).
// erros: repassa 404 ao next(err) se o usuário não pertencer à organização.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - busca o usuário no serviço através de userService.getUserById(req.params.id, req.user.organizacaoId).
// 3 - envia a resposta JSON com o registro do colaborador.
export async function getUser(req, res, next) {
  try {
    // 2 - consulta detalhes
    const user = await userService.getUserById(req.params.id, req.user.organizacaoId);
    // 3 - responde
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao buscar usuário");
    next(err);
  }
}

// função responsável por atualizar os dados cadastrais, cargo, filial ou avatar de um colaborador existente.
//
// contexto: invocada pela rota PUT /users/:id ao salvar alterações na tela de gestão de equipe.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id, corpo com novos valores e foto opcional em req.file.
//   - res (Response, obrigatório): resposta HTTP com o usuário atualizado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o colaborador atualizado).
// erros: repassa ao next(err) se houver violação de unicidade ou dados inválidos.
// efeitos colaterais: atualiza registro no PostgreSQL, envia foto ao Cloudinary e invalida cache de nomes.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai organizacaoId e orgSlug do administrador autenticado.
// 3 - realiza upload do novo avatar se fornecido via req.file.
// 4 - executa a atualização no serviço com userService.updateUser tratando exclusão ou substituição de foto.
// 5 - invalida o cache de nomes da organização através de invalidateUserNamesCache.
// 6 - grava log de auditoria e entrega a resposta JSON com o modelo atualizado.
export async function updateUser(req, res, next) {
  try {
    // 2 - contexto de tenant
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

    // 3 - upload de nova imagem se enviada
    let newImagePath = null;
    if (req.file) {
      const folder = await resolveUserCloudinaryFolder(orgSlug, organizacaoId, req.body?.lojaId);
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }
    const removeImage = req.body.removerImagem === "true";

    // 4 - atualiza no service
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      newImagePath,
      removeImage,
      organizacaoId
    );

    // 5 - purga cache
    invalidateUserNamesCache(organizacaoId);
    // 6 - auditoria e resposta
    log.info(
      { user: req.user?.id, organizacaoId, action: "UPDATE_USER", targetId: user.id },
      "Colaborador atualizado"
    );
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar usuário");
    next(err);
  }
}

// função responsável por transferir instantaneamente um Gerente ou Operador para outra filial da organização.
//
// contexto: chamada pela rota PATCH /users/:id/store na movimentação interna de funcionários entre unidades da rede.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.lojaId da nova filial.
//   - res (Response, obrigatório): resposta HTTP com o usuário atualizado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o colaborador alocado na nova filial).
// erros: repassa 400 ou 404 ao next(err) se a nova filial estiver inativa ou pertencer a outra organização.
// efeitos colaterais: atualiza lojaId na tabela Usuario, invalida o cache de nomes e purga o cache de sessão do usuário.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai organizacaoId e lojaId do corpo da requisição.
// 3 - aciona userService.transferUserStore transferindo o vínculo da filial.
// 4 - invalida o cache de nomes através de invalidateUserNamesCache.
// 5 - registra log de auditoria confirmando a transferência e devolve a resposta JSON.
export async function transferUserStore(req, res, next) {
  try {
    // 2 - extrai parâmetros
    const organizacaoId = req.user.organizacaoId;
    const { lojaId } = req.body;
    // 3 - executa transferência
    const user = await userService.transferUserStore(req.params.id, lojaId, organizacaoId);
    // 4 - purga cache
    invalidateUserNamesCache(organizacaoId);

    // 5 - auditoria e resposta
    log.info(
      {
        user: req.user?.id,
        organizacaoId,
        action: "TRANSFER_USER_STORE",
        targetId: user.id,
        newLojaId: user.lojaId,
      },
      "Colaborador transferido de loja"
    );
    res.json(user);
  } catch (err) {
    log.warn({ err }, "Erro ao transferir loja do colaborador");
    next(err);
  }
}

// função responsável por alterar a situação funcional do colaborador (ATIVO, SUSPENSO ou FERIAS).
//
// contexto: invocada pela rota PATCH /users/:id/situation para suspensão preventiva ou afastamento por férias.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.situacao.
//   - res (Response, obrigatório): resposta HTTP com o usuário atualizado.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com o modelo do colaborador atualizado).
// erros: repassa ao next(err) se o status informado for inválido.
// efeitos colaterais: atualiza situacao na tabela Usuario e purga caches de nomes e sessão.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai organizacaoId e situacao do corpo da requisição.
// 3 - aciona userService.updateUserSituation gravando a nova situação funcional.
// 4 - invalida o cache de nomes via invalidateUserNamesCache.
// 5 - grava log de auditoria e responde enviando o usuário modificado em JSON.
export async function changeUserSituation(req, res, next) {
  try {
    // 2 - extrai parâmetros
    const organizacaoId = req.user.organizacaoId;
    const { situacao } = req.body;
    // 3 - altera situação funcional
    const user = await userService.updateUserSituation(
      req.params.id,
      situacao,
      req.user?.id,
      organizacaoId
    );
    // 4 - purga cache
    invalidateUserNamesCache(organizacaoId);

    // 5 - auditoria e resposta
    log.info(
      {
        user: req.user?.id,
        organizacaoId,
        action: "CHANGE_USER_SITUATION",
        targetId: user.id,
        situacao: user.situacao,
      },
      "Situação trabalhista da matrícula alterada"
    );
    res.json(user);
  } catch (err) {
    log.warn({ err }, "Erro ao alterar situação do usuário");
    next(err);
  }
}

// função responsável por demitir um colaborador, cancelar sua matrícula e consolidar o relatório final rescisório.
//
// contexto: chamada pela rota DELETE /users/:id na rescisão definitiva de um funcionário.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e corpo opcional com dataDemissao e motivo.
//   - res (Response, obrigatório): resposta HTTP com o relatório e confirmação da rescisão.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o resultado do desligamento e o relatório consolidado).
// erros: repassa ao next(err) se tentar demitir o próprio administrador logado ou se o usuário não for localizado.
// efeitos colaterais: grava registro histórico em RegistroDesligamento, desvincula dados na tabela Usuario e emite log.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai dataDemissao e motivo de req.body.
// 3 - aciona userService.deleteUser executando a rescisão atômica com preservação histórica de vendas.
// 4 - invalida o cache de nomes da organização através de invalidateUserNamesCache.
// 5 - registra log de auditoria confirmando a exclusão com relatório de desligamento.
// 6 - responde entregando o resultado e o relatório rescisório em formato JSON.
export async function deleteUser(req, res, next) {
  try {
    // 2 - extrai parâmetros de desligamento
    const organizacaoId = req.user.organizacaoId;
    const { dataDemissao = null, motivo = null } = req.body || {};
    // 3 - executa rescisão no service
    const result = await userService.deleteUser(req.params.id, req.user?.id, organizacaoId, {
      dataDemissao,
      motivo,
    });

    // 4 - purga cache
    invalidateUserNamesCache(organizacaoId);
    // 5 - auditoria
    log.info(
      { user: req.user?.id, organizacaoId, action: "DELETE_USER", targetId: req.params.id },
      "Exclusão física de usuário concluída com registro de desligamento e histórico"
    );
    // 6 - responde
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao excluir usuário");
    next(err);
  }
}

// função responsável por consultar ou reimprimir o Relatório Final de Desligamento de um colaborador demitido.
//
// contexto: invocada pela rota GET /users/:refId/dismissal-report para consulta retroativa de dados rescisórios.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.refId (ID ou matrícula do colaborador) e organizacaoId.
//   - res (Response, obrigatório): resposta HTTP com o relatório estruturado em JSON.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com o relatório rescisório consolidado).
// erros: repassa 404 ao next(err) se não houver registro de desligamento para o identificador informado.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - consulta o relatório no serviço através de userService.getDismissalReportByRef.
// 3 - devolve o relatório estruturado em formato JSON.
export async function getDismissalReport(req, res, next) {
  try {
    // 2 - busca relatório rescisório
    const organizacaoId = req.user.organizacaoId;
    const relatorio = await userService.getDismissalReportByRef(req.params.refId, organizacaoId);
    // 3 - responde
    res.json(relatorio);
  } catch (err) {
    log.warn({ err }, "Erro ao gerar relatório de desligamento");
    next(err);
  }
}

// função responsável por consultar o perfil completo do próprio usuário autenticado na sessão.
//
// contexto: chamada pela rota GET /users/me na inicialização do frontend e na tela de perfil.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.user.id e req.user.organizacaoId.
//   - res (Response, obrigatório): resposta HTTP com o perfil do usuário.
//   - next (NextFunction, obrigatório): função de erro.
//
// retorno: nenhum (envia JSON com os dados cadastrais do próprio usuário).
// erros: repassa ao next(err) se a conta não for encontrada.
// efeitos colaterais: nenhum (leitura no banco).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - busca os dados do próprio usuário logado via userService.getUserById(req.user.id, req.user.organizacaoId).
// 3 - responde entregando o perfil sanitizado em formato JSON.
export async function getMe(req, res, next) {
  try {
    // 2 - busca perfil do usuário na sessão
    const user = await userService.getUserById(req.user.id, req.user.organizacaoId);
    // 3 - responde
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao obter perfil logado");
    next(err);
  }
}

// função responsável por permitir que o próprio usuário autenticado atualize seu nome, e-mail, telefone e foto de perfil.
//
// contexto: invocada pela rota PUT /users/me com proteção estrita contra autoescalação de privilégios.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo novos dados cadastrais e foto opcional em req.file.
//   - res (Response, obrigatório): resposta HTTP com o perfil modificado.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON com o perfil atualizado).
// erros: lança AppError(403) se um colaborador não-ADMIN tentar alterar o próprio cargo (role).
// efeitos colaterais: atualiza a linha do usuário na tabela Usuario, envia foto ao Cloudinary e purga caches.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - verifica se o usuário solicitante é ADMIN; se não for e tentar enviar role, lança AppError(403) "Acesso negado para alteração de privilégios".
// 3 - realiza upload do novo avatar se req.file existir através de uploadToCloudinary.
// 4 - monta o payload sanitizado e aciona userService.updateUser com o ID do usuário logado.
// 5 - invalida o cache de nomes da organização através de invalidateUserNamesCache.
// 6 - entrega a resposta JSON com o perfil atualizado.
export async function updateMe(req, res, next) {
  try {
    // 2 - proteção contra autoescalação de privilégios
    const isAdmin = req.user.role === "ADMIN";
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

    // 3 - upload de nova imagem se enviada
    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(
        orgSlug,
        req.user.lojaSlug || "corporativo",
        "usuarios"
      );
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }

    const removeImage = req.body.removerImagem === "true";
    const { nome, email, telefone, role } = req.body || {};

    if (!isAdmin && role !== undefined) {
      throw new AppError("Acesso negado para alteração de privilégios", 403);
    }

    // 4 - monta payload seguro
    const updateData = { nome, email, ...(telefone !== undefined ? { telefone } : {}) };
    if (isAdmin && role !== undefined && role !== "") {
      const allowedRoles = ["ADMIN", "GERENTE", "OPERADOR"];
      const normalizedRole = String(role).toUpperCase();
      if (!allowedRoles.includes(normalizedRole)) {
        throw new AppError("Role inválida", 400);
      }
      updateData.role = normalizedRole;
    }

    // 5 - persiste alteração no service
    const user = await userService.updateUser(
      req.user.id,
      updateData,
      newImagePath,
      removeImage,
      organizacaoId
    );

    // 6 - purga cache e responde
    invalidateUserNamesCache(organizacaoId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar perfil próprio");
    next(err);
  }
}
