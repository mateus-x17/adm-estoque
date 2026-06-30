// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import { childLogger } from "../config/logger.js";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/errorHandler.js";
const log = childLogger("userController");

export async function createUser(req, res, next) {
  try {
    const imagem = req.file
      ? `/uploads/usuarios/${req.file.filename}`
      : undefined;
    const user = await userService.createUser(req.body, imagem);
    res.status(201).json(user);
  } catch (err) {
    log.error({ err }, "Error creating user");
    next(err);
  }
}

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

export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error getting user");
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const newImagePath = req.file
      ? `/uploads/usuarios/${req.file.filename}`
      : null;
    const removeImage = req.body.removerImagem === "true";
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      newImagePath,
      removeImage
    );
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error updating user");
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, "Error deleting user");
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    log.error({ err }, "Error getting logged user");
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const isAdmin = req.user.role === "ADMIN";

    const newImagePath = req.file
      ? `/uploads/usuarios/${req.file.filename}`
      : null;

    const removeImage = req.body.removerImagem === "true";

    const { nome, email, role } = req.body || {};

    // Guardrails: não confiar em role vindo do cliente para não-admin.
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

    res.json(user);
  } catch (err) {
    log.error({ err }, "Error updating logged user");
    next(err);
  }
}
