// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import { childLogger } from '../config/logger.js';
import * as userService from '../services/userService.js';
const log = childLogger('userController');

export async function createUser(req, res, next) {
  try {
    const imagem = req.file ? `/uploads/usuarios/${req.file.filename}` : undefined;
    const user = await userService.createUser(req.body, imagem);
    res.status(201).json(user);
  } catch (err) {
    log.error({ err }, 'Error creating user');
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    log.error({ err }, 'Error listing users');
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    log.error({ err }, 'Error getting user');
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const newImagePath = req.file ? `/uploads/usuarios/${req.file.filename}` : null;
    const user = await userService.updateUser(req.params.id, req.body, newImagePath);
    res.json(user);
  } catch (err) {
    log.error({ err }, 'Error updating user');
    next(err);
  }
}


export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Error deleting user');
    next(err);
  }
}
