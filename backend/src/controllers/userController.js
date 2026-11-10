import { childLogger } from "../config/logger.js";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/errorHandler.js";
import { uploadToCloudinary, getTenantFolder } from "../config/cloudinaryConfig.js";
import { prisma } from "../config/prismaClient.js";
import { resolveReadScope } from "../utils/tenantScope.js";
const log = childLogger("userController");

// arquivo responsável por controlar requisições HTTP de colaboradores isolados por Organização e Loja

const namesCacheByScope = new Map();
const NAMES_CACHE_TTL_MS = 30 * 1000;

// função para invalidar o cache de dropdown de colaboradores de uma Organização inteira
export function invalidateUserNamesCache(organizacaoId = null) {
  if (!organizacaoId) {
    namesCacheByScope.clear();
    return;
  }
  const prefix = `${Number(organizacaoId)}:`;
  for (const key of namesCacheByScope.keys()) {
    if (key.startsWith(prefix)) {
      namesCacheByScope.delete(key);
    }
  }
}

// função auxiliar para resolver a pasta correta no Cloudinary conforme a loja selecionada para o usuário
// 1 - Busca slug da loja caso lojaId esteja presente; caso contrário utiliza subpasta 'corporativo'
async function resolveUserCloudinaryFolder(orgSlug, organizacaoId, lojaId) {
  if (!lojaId) {
    return getTenantFolder(orgSlug, "corporativo", "usuarios");
  }
  const loja = await prisma.loja.findFirst({
    where: { id: Number(lojaId), organizacaoId: Number(organizacaoId) },
    select: { slug: true },
  });
  return getTenantFolder(orgSlug, loja?.slug || lojaId, "usuarios");
}

// função para criar colaborador ou administrador na Organização (exclusivo ADMIN)
// 1 - Faz upload do avatar para subpasta da organização/loja no Cloudinary quando houver arquivo
// 2 - Cria usuário via userService.createUser e limpa cache de nomes
export async function createUser(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

    let imagem = undefined;
    if (req.file) {
      const folder = await resolveUserCloudinaryFolder(orgSlug, organizacaoId, req.body?.lojaId);
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    const user = await userService.createUser(req.body, imagem, organizacaoId);
    invalidateUserNamesCache(organizacaoId);

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

// função para listar nomes e IDs de colaboradores ativos para seletores (ADMIN ou GERENTE)
// 1 - Respeita escopo: GERENTE recebe apenas vendedores da sua loja; ADMIN pode filtrar por loja ou ver rede inteira
// 2 - Utiliza cache em memória com TTL de 30 segundos por chave organização+loja
export async function getUserNames(req, res, next) {
  try {
    const scope = await resolveReadScope(req);
    const cacheKey = `${scope.organizacaoId}:${scope.lojaId || "all"}`;
    const now = Date.now();
    const cached = namesCacheByScope.get(cacheKey);

    if (cached && now - cached.timestamp < NAMES_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

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

    namesCacheByScope.set(cacheKey, { data: users, timestamp: now });
    res.json(users);
  } catch (err) {
    log.error({ err }, "Erro ao buscar nomes de colaboradores");
    next(err);
  }
}

// função para listar colaboradores paginados da Organização (inclui opção de desligados/cancelados via RegistroDesligamento)
export async function listUsers(req, res, next) {
  try {
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
    res.json(users);
  } catch (err) {
    log.error({ err }, "Erro ao listar usuários");
    next(err);
  }
}

// função para consultar detalhes de um colaborador da Organização
export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id, req.user.organizacaoId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao buscar usuário");
    next(err);
  }
}

// função para atualizar colaborador (incluindo mudança de cargo ou transferência de loja)
export async function updateUser(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

    let newImagePath = null;
    if (req.file) {
      const folder = await resolveUserCloudinaryFolder(orgSlug, organizacaoId, req.body?.lojaId);
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }
    const removeImage = req.body.removerImagem === "true";

    const user = await userService.updateUser(
      req.params.id,
      req.body,
      newImagePath,
      removeImage,
      organizacaoId
    );

    invalidateUserNamesCache(organizacaoId);
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

// função rápida para transferir um Gerente ou Operador de uma loja para outra dentro da mesma Organização
export async function transferUserStore(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const { lojaId } = req.body;
    const user = await userService.transferUserStore(req.params.id, lojaId, organizacaoId);
    invalidateUserNamesCache(organizacaoId);

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

// função para alterar situação trabalhista do colaborador (ATIVO, SUSPENSO ou FERIAS)
// 1 - Bloqueia acesso imediatamente em caso de suspensão/férias limpando cache de nomes e sessão
export async function changeUserSituation(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const { situacao } = req.body;
    const user = await userService.updateUserSituation(
      req.params.id,
      situacao,
      req.user?.id,
      organizacaoId
    );
    invalidateUserNamesCache(organizacaoId);

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

// função para excluir definitivamente um colaborador (demitir / cancelar matrícula) preservando histórico e gerando relatório de vendas
export async function deleteUser(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const { dataDemissao = null, motivo = null } = req.body || {};
    const result = await userService.deleteUser(req.params.id, req.user?.id, organizacaoId, {
      dataDemissao,
      motivo,
    });

    invalidateUserNamesCache(organizacaoId);
    log.info(
      { user: req.user?.id, organizacaoId, action: "DELETE_USER", targetId: req.params.id },
      "Exclusão física de usuário concluída com registro de desligamento e histórico"
    );
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao excluir usuário");
    next(err);
  }
}

// função para consultar ou reimprimir o Relatório Final de Desligamento de um colaborador demitido (por matrícula ou ID)
export async function getDismissalReport(req, res, next) {
  try {
    const organizacaoId = req.user.organizacaoId;
    const relatorio = await userService.getDismissalReportByRef(req.params.refId, organizacaoId);
    res.json(relatorio);
  } catch (err) {
    log.warn({ err }, "Erro ao gerar relatório de desligamento");
    next(err);
  }
}

// função para consultar o próprio perfil autenticado
export async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id, req.user.organizacaoId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao obter perfil logado");
    next(err);
  }
}

// função para o próprio usuário atualizar nome, e-mail e avatar (sem autoescalação de cargo)
export async function updateMe(req, res, next) {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const organizacaoId = req.user.organizacaoId;
    const orgSlug = req.user.organizacaoSlug || organizacaoId;

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

    const updateData = { nome, email, ...(telefone !== undefined ? { telefone } : {}) };
    if (isAdmin && role !== undefined && role !== "") {
      const allowedRoles = ["ADMIN", "GERENTE", "OPERADOR"];
      const normalizedRole = String(role).toUpperCase();
      if (!allowedRoles.includes(normalizedRole)) {
        throw new AppError("Role inválida", 400);
      }
      updateData.role = normalizedRole;
    }

    const user = await userService.updateUser(
      req.user.id,
      updateData,
      newImagePath,
      removeImage,
      organizacaoId
    );

    invalidateUserNamesCache(organizacaoId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar perfil próprio");
    next(err);
  }
}
