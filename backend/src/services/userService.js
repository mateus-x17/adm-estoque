import bcrypt from "bcryptjs";
import { prisma } from "../config/prismaClient.js";
import fs from "fs";
import { AppError } from "../utils/errorHandler.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitizers.js";
import { deleteFromCloudinary } from "../config/cloudinaryConfig.js";

// serviço responsável pela criação de novo usuário
// 1 - Realiza a validação da presença dos dados sensíveis do request (nome, email, senha)
// 2 - Faz query ao DB garantindo que aquele e-mail ainda não tem cadastro (único)
// 3 - Assina a hash encriptada da senha do usuário com "salt" base de nível 10 no bcrypt
// 4 - Cria o usuário na base de dados, caso "role" venha vazio, designa "OPERADOR" por segurança e injeta a imagem (CDN)
// 5 - Ao finalizar a query, devolve os campos sanitizados utilizando utility
export async function createUser(data, imagePath = null) {
  const { nome, email, senha, role } = data;
  if (!nome || !email || !senha)
    throw new AppError("Nome, email e senha são obrigatórios", 400);

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) throw new AppError("Email já registrado", 400);

  const hashed = await bcrypt.hash(senha, 10);
  const user = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: hashed,
      role: role || "OPERADOR",
      imagem: imagePath,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      imagem: true,
      createdAt: true,
    },
  });

  return sanitizeUser(user);
}

// serviço responsável por listar usuários com paginação, filtros por nome/id, e filtro por cargo (role)
// 1 - Cria o cálculo base de paginação determinando os skips a partir da fórmula padrão (page - 1 * limit)
// 2 - Constrói recursivamente o filtro Prisma (where.AND), tratando 'search' se for string e checando de forma insensible case e convertendo se parecer ser Number (para ID)
// 3 - Ataca o Prisma via paralelismo (Promise.all) requisitando um total global para a paginação em count() e a query específica paginada
// 4 - Devolve os dados e a paginação, chamando 'sanitizeUsers' em 'users' (remove propriedades como senhas e hashes em grupo)
export async function listUsers({
  page = 1,
  limit = 10,
  search = "",
  role = "",
}) {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search
        ? {
          OR: [
            {
              nome: {
                contains: search,
                mode: "insensitive", // busca case-insensitive no Prisma
              },
            },
            !isNaN(search)
              ? {
                id: Number(search),
              }
              : {},
          ],
        }
        : {},

      role && role !== "todos"
        ? {
          role: role.toUpperCase(),
        }
        : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.usuario.count({
      where,
    }),
  ]);

  return {
    data: sanitizeUsers(users), // usa o utilitário para garantir que não saia dado sigiloso 
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// serviço de busca detalhada de usuário pelo id
// 1 - Tenta encontrar unicamente pelo integer formatado do id via Prisma
// 2 - Aplica Throw 404 e interceptação no middleware caso dê nulo, senão, sanitiza e envia a requisição
export async function getUserById(id) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  return sanitizeUser(user);
}

// serviço de atualização de usuário responsável por fazer a limpeza da foto em nuvem se necessário, gerar hash de nova senha caso enviada
// 1 - Puxa no banco a entidade completa, e avalia apenas os dados específicos permitidos para alteração (role, nome e e-mail) (Impede Overposting/escalação pela web)
// 2 - Verifica se houve submissão de senha; se houve, chama o salt/bcrypt na hora
// 3 - Analisa o 'removeImage' se o controle do formData demandou deleção; varre links HTTP/HTTPS e tenta deletar do Cloudinary
// 4 - Adiciona a nova URL no final, injeta tudo usando Prisma (fazendo filter de retorno usando Select para dados vazados)
export async function updateUser(id, data, newImagePath = null, removeImage = false) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  // Só pegamos os campos que realmente podem ser atualizados.
  // Isso evita que "removerImagem" (campo de controle no formData) ou "imagem"
  // (controlada só via newImagePath/removeImage local/nuvem) vazem pro DB em estado quebrado.
  const { nome, email, role, senha } = data;
  const updateData = {};
  if (nome !== undefined) updateData.nome = nome;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;

  if (senha) {
    updateData.senha = await bcrypt.hash(senha, 10);
  }

  let imagePath = user.imagem;

  if (removeImage) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    updateData.imagem = null;
  } else if (newImagePath) {
    if (imagePath) {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        await deleteFromCloudinary(imagePath);
      } else if (fs.existsSync(`.${imagePath}`)) {
        try { fs.unlinkSync(`.${imagePath}`); } catch (e) { /* ignore */ }
      }
    }
    imagePath = newImagePath;
    updateData.imagem = imagePath;
  }

  const updated = await prisma.usuario.update({
    where: { id: Number(id) },
    data: updateData,
    select: { id: true, nome: true, email: true, role: true, imagem: true }, // garante select de dados limitados
  });

  return sanitizeUser(updated);
}

// serviço de deletar (limpando arquivo de avatar)
// 1 - Puxa no banco, confirmando e lançando Erro na ausência
// 2 - Avalia a URI persistida (CDN cloud x fs upload dir); expurga do armazenamento
// 3 - Deleta com o ID
export async function deleteUser(id) {
  const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (user.imagem) {
    if (user.imagem.startsWith("http://") || user.imagem.startsWith("https://")) {
      await deleteFromCloudinary(user.imagem);
    } else if (fs.existsSync(`.${user.imagem}`)) {
      try { fs.unlinkSync(`.${user.imagem}`); } catch (e) { /* ignore */ }
    }
  }

  return prisma.usuario.delete({ where: { id: Number(id) } });
}
