import { childLogger } from "../config/logger.js";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/errorHandler.js";
import { uploadToCloudinary, getTenantFolder } from "../config/cloudinaryConfig.js";
import { prisma } from "../config/prismaClient.js";
const log = childLogger("userController");

// arquivo responsável por intermediar requisições HTTP para a gestão de usuários isolados por loja

// Cache em memória para dropdowns de nomes de usuários indexado por empresaId com TTL de 30s
const namesCacheByTenant = new Map();
const NAMES_CACHE_TTL_MS = 30 * 1000;

// função para invalidar o cache de dropdown de uma loja ou de todas
export function invalidateUserNamesCache(empresaId = null) {
  if (empresaId) {
    namesCacheByTenant.delete(Number(empresaId));
  } else {
    namesCacheByTenant.clear();
  }
}

// função para criação de novos colaboradores dentro do estabelecimento
// 1 - Realiza upload de foto de avatar na pasta dedicada do tenant no Cloudinary ('estoque-os/lojas/<loja>/usuarios')
// 2 - Chama userService.createUser passando os dados validados e o empresaId do administrador logado
// 3 - Invalida cache de dropdown e retorna status 201 com o novo colaborador
export async function createUser(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const tenantSlug = req.user.empresaSlug || empresaId;

    let imagem = undefined;
    if (req.file) {
      const folder = getTenantFolder(tenantSlug, "usuarios");
      imagem = await uploadToCloudinary(req.file.path, folder);
    }

    const user = await userService.createUser(req.body, imagem, empresaId);
    invalidateUserNamesCache(empresaId);

    log.info({ user: req.user?.id, empresaId, action: 'CREATE_USER', targetId: user.id }, 'Colaborador criado com sucesso');
    res.status(201).json(user);
  } catch (err) {
    log.error({ err }, "Erro ao criar colaborador");
    next(err);
  }
}

// função para buscar apenas nomes e IDs dos colaboradores da loja atual (ideal para selects e filtros)
// 1 - Consulta no cache local em memória pelo empresaId da sessão para entrega em < 1ms
// 2 - Em caso de cache miss, busca apenas colaboradores ativos daquela loja ordenados por nome
// 3 - Salva no cache com TTL de 30s e retorna o array para a interface
export async function getUserNames(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const now = Date.now();
    const cached = namesCacheByTenant.get(empresaId);

    if (cached && (now - cached.timestamp < NAMES_CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    const users = await prisma.usuario.findMany({
      where: {
        empresaId: Number(empresaId),
        ativo: true,
      },
      select: { id: true, nome: true, role: true },
      orderBy: { nome: 'asc' },
    });

    namesCacheByTenant.set(empresaId, { data: users, timestamp: now });

    log.info({ user: req.user?.id, empresaId, action: 'GET_USER_NAMES' }, 'Lista de nomes da loja consultada');
    res.json(users);
  } catch (err) {
    log.error({ err }, 'Erro ao buscar nomes de colaboradores');
    next(err);
  }
}

// função para listar os colaboradores da loja com paginação, busca e filtros de cargo e status
// 1 - Extrai parâmetros page, limit, search, role e status ('ativos', 'inativos', 'todos')
// 2 - Delega a listagem ao serviço garantindo a clausula empresaId
// 3 - Retorna dados sanitizados e metadados de paginação
export async function listUsers(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "todos";

    const users = await userService.listUsers({
      empresaId,
      page,
      limit,
      search,
      role,
      status,
    });

    res.json(users);
  } catch (err) {
    log.error({ err }, "Erro ao listar usuários");
    next(err);
  }
}

// função para buscar dados de um usuário pelo ID garantindo isolamento da loja
export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id, req.user.empresaId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao buscar usuário");
    next(err);
  }
}

// função para atualizar colaboradores da loja
// 1 - Salva nova imagem na pasta dedicada do tenant no Cloudinary se houver upload
// 2 - Repassa dados higienizados e empresaId ao serviço
// 3 - Invalida cache de dropdown e devolve o usuário atualizado
export async function updateUser(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const tenantSlug = req.user.empresaSlug || empresaId;

    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(tenantSlug, "usuarios");
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }
    const removeImage = req.body.removerImagem === "true";

    const user = await userService.updateUser(
      req.params.id,
      req.body,
      newImagePath,
      removeImage,
      empresaId
    );

    invalidateUserNamesCache(empresaId);
    log.info({ user: req.user?.id, empresaId, action: 'UPDATE_USER', targetId: user.id }, 'Usuário da loja atualizado');
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar usuário");
    next(err);
  }
}

// função para inativar ou reativar um colaborador (Soft Delete)
// 1 - Recebe ativo (boolean) do corpo da requisição
// 2 - Aciona toggleUserStatus validando integridade e impedindo auto-inativação
// 3 - Invalida caches e retorna o usuário com novo status
export async function toggleUserStatus(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const { ativo } = req.body;
    const user = await userService.toggleUserStatus(req.params.id, ativo, req.user.id, empresaId);

    invalidateUserNamesCache(empresaId);
    log.info({ user: req.user?.id, empresaId, action: 'TOGGLE_USER_STATUS', targetId: user.id, ativo }, 'Status de usuário alterado');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// função para excluir colaborador da loja
// 1 - Chama deleteUser: se tiver histórico de movimentações, executa Soft Delete automático preservando auditoria
// 2 - Retorna resposta informando se foi exclusão física ou inativação lógica
export async function deleteUser(req, res, next) {
  try {
    const empresaId = req.user.empresaId;
    const result = await userService.deleteUser(req.params.id, req.user?.id, empresaId);

    invalidateUserNamesCache(empresaId);
    log.info({ user: req.user?.id, empresaId, action: 'DELETE_USER', targetId: req.params.id, result }, 'Resultado da exclusão de usuário');
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao deletar usuário");
    next(err);
  }
}

// função para o próprio usuário autenticado buscar suas informações de perfil
export async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id, req.user.empresaId);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao obter perfil logado");
    next(err);
  }
}

// função para o próprio colaborador logado atualizar seus dados de perfil
export async function updateMe(req, res, next) {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const empresaId = req.user.empresaId;
    const tenantSlug = req.user.empresaSlug || empresaId;

    let newImagePath = null;
    if (req.file) {
      const folder = getTenantFolder(tenantSlug, "usuarios");
      newImagePath = await uploadToCloudinary(req.file.path, folder);
    }

    const removeImage = req.body.removerImagem === "true";
    const { nome, email, role } = req.body || {};

    if (!isAdmin && role !== undefined) {
      throw new AppError("Acesso negado para alteração de privilégios", 403);
    }

    const updateData = { nome, email };
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
      empresaId
    );

    invalidateUserNamesCache(empresaId);
    log.info({ user: req.user?.id, empresaId, action: 'UPDATE_ME' }, 'Colaborador atualizou o próprio perfil');
    res.json(user);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar perfil logado");
    next(err);
  }
}
