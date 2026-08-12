import { childLogger } from "../config/logger.js";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/errorHandler.js";
import { uploadToCloudinary } from "../config/cloudinaryConfig.js";
import { prisma } from "../config/prismaClient.js";
const log = childLogger("userController");

// função para criação de novos usuários (admin/gerente criando para operadores)
// 1 - Checa se há arquivo anexado na requisição (req.file) via Multer
// 2 - Se sim, faz o upload para o Cloudinary na pasta 'usuarios'
// 3 - Chama o userService com os dados do corpo e o link da foto para salvar no banco
// 4 - Registra a ação log e retorna com status 201 (Created)
export async function createUser(req, res, next) {
  try {
    let imagem = undefined;
    if (req.file) {
      imagem = await uploadToCloudinary(req.file.path, "usuarios");
    }
    const user = await userService.createUser(req.body, imagem);
    log.info({ user: req.user?.id, action: 'CREATE_USER', targetId: user.id }, 'User created a new user');
    res.status(201).json(user);
  } catch (err) {
    log.error({ err }, "Error creating user");
    next(err);
  }
}

// função simplificada para buscar apenas os nomes e IDs dos usuários (ótima para selects e dropdowns, reduzindo payload)
// 1 - Usa o prisma com um "select" projetado especificamente para pegar apenas ID e NOME e omite campos sensíveis
// 2 - Ordena por ordem alfabética (asc)
// 3 - Retorna JSON
export async function getUserNames(req, res, next) {
  try {
    const users = await prisma.usuario.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
    log.info({ user: req.user?.id, action: 'GET_USER_NAMES' }, 'User fetched user names list');
    res.json(users);
  } catch (err) {
    log.error({ err }, 'Error fetching user names');
    next(err);
  }
}

// função para listagem rica de usuários com paginação e filtros de busca/role
// 1 - Extrai da string de busca parâmetros page, limit, search e role e os converte
// 2 - Chama o serviço enviando um objeto empacotado para o processamento de regras
// 3 - Retorna o JSON processado (lista e metadados de paginação)
export async function listUsers(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const users = await userService.listUsers({
      page,
      limit,
      search,
      role,
    });

    res.json(users);
  } catch (err) {
    log.error({ err }, "Error listing users");
    next(err);
  }
}

// função para obter os dados completos de um único usuário via ID
// 1 - Pega req.params.id e aciona serviço
// 2 - O serviço remove a senha da resposta e devolve os dados sanitizados
export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error getting user");
    next(err);
  }
}

// função de administrador para atualizar usuários de terceiros
// 1 - Avalia se há imagem via Multer para upload
// 2 - Avalia a flag 'removerImagem' (caso o admin queira excluir a foto atual do usuário editado)
// 3 - Invoca o serviço que salva as alterações
// 4 - Registra ação (UPDATE_USER) e retorna novos dados
export async function updateUser(req, res, next) {
  try {
    let newImagePath = null;
    if (req.file) {
      newImagePath = await uploadToCloudinary(req.file.path, "ADM-estoque/usuarios");
    }
    const removeImage = req.body.removerImagem === "true";
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      newImagePath,
      removeImage
    );
    log.info({ user: req.user?.id, action: 'UPDATE_USER', targetId: user.id }, 'User updated a user');
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error updating user");
    next(err);
  }
}

// função que delega a exclusão ao serviço
// 1 - Pega id, tenta apagar no serviço (que trata regras como impedir usuário de excluir a si mesmo)
export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    log.info({ user: req.user?.id, action: 'DELETE_USER', targetId: req.params.id }, 'User deleted a user');
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, "Error deleting user");
    next(err);
  }
}

// função para o próprio usuário autenticado pegar seus dados ("Meu Perfil")
// 1 - Usa o req.user.id injetado pelo token jwt em authMiddleware
// 2 - Chama serviço getUserById garantindo que pega apenas as própias infos
export async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error getting logged user");
    next(err);
  }
}

// função para o próprio usuário logado atualizar seus dados (Meu Perfil)
// 1 - Verifica se o solicitante é ADMIN usando a role extraída do token
// 2 - Lida com nova imagem ou deleção de imagem
// 3 - Aplica "Guardrails": Se um usuário NÃO for admin e tentar mudar sua 'role' (passando esse parâmetro pelo cliente/POSTMAN forçadamente), a aplicação lança 403 negando a operação
// 4 - Caso o solicitante seja ADMIN e passe uma role, o sistema autoriza alterar os privilégios
// 5 - Aciona o serviço para efetivar as mudanças permitidas no banco e gera o log (UPDATE_ME)
export async function updateMe(req, res, next) {
  try {
    const isAdmin = req.user.role === "ADMIN";

    let newImagePath = null;
    if (req.file) {
      newImagePath = await uploadToCloudinary(req.file.path, "ADM-estoque/usuarios");
    }

    const removeImage = req.body.removerImagem === "true";

    const { nome, email, role } = req.body || {};

    // Guardrails: Impede escalonamento de privilégios via API falsificada (proteção extra de segurança vital em APIs nodejs)
    if (!isAdmin && role !== undefined) {
      throw new AppError("Acesso negado", 403);
    }

    const updateData = {
      nome,
      email,
    };

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
      removeImage
    );

    log.info({ user: req.user?.id, action: 'UPDATE_ME' }, 'User updated their own profile');
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error updating logged user");
    next(err);
  }
}
