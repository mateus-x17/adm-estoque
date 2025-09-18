import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

export async function loginController(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: "Email e senha são obrigatórios" });

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const isValid = await bcrypt.compare(senha, user.senha);
  if (!isValid) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });

  res.json({
    token,
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
  });
}
