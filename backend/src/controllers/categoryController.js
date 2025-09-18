import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function listCategories(req, res) {
  const cats = await prisma.categoria.findMany();
  res.json(cats);
}

export async function createCategory(req, res) {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: "nome é obrigatório" });
  try {
    const c = await prisma.categoria.create({ data: { nome } });
    res.status(201).json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateCategory(req, res) {
  const id = Number(req.params.id);
  const { nome } = req.body;
  const updated = await prisma.categoria.update({ where: { id }, data: { nome } });
  res.json(updated);
}

export async function deleteCategory(req, res) {
  const id = Number(req.params.id);
  await prisma.categoria.delete({ where: { id } });
  res.json({ ok: true });
}
