// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import { prisma } from "../config/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


export async function loginController(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Erro no loginController:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}


export async function registerController(req, res) {
  // verificar se não está vazio
  if (!req.body.nome || !req.body.email || !req.body.senha) return res.status(400).json({ error: "Dados incompletos" });
  const { nome, email, senha, role } = req.body;
  // verificar se o usuário existe
  const userExists = await prisma.usuario.findUnique({ where: { email } });
  if (userExists) return res.status(400).json({ error: "Usuário já cadastrado" });
  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({ data: { nome, email, senha: hashed, role: role || "OPERADOR" } });
  res.json({message: "Usuário cadastrado com sucesso", usuario:user});
}