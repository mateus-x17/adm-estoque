import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// arquivo responsável pelas regras de autenticação, criação de estabelecimentos (tenants) e gestão de tokens JWT

// função utilitária local para gerar um slug limpo e padronizado a partir do nome da loja
// 1 - Normaliza acentos e caracteres especiais em ASCII simples
// 2 - Converte tudo para minúsculas, substitui espaços por hífens e remove caracteres inválidos
// 3 - Garante que o slug resultante não tenha hífens duplicados nem nas pontas
function generateSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// função utilitária local para limpar dados sensíveis antes de retornar ao cliente
// 1 - Recebe o objeto de usuário completo do banco de dados
// 2 - Remove a propriedade 'senha' (hash bcrypt) garantindo que nunca vaze na API
// 3 - Retorna o objeto seguro contendo os dados básicos do usuário e da empresa vinculada
export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

// serviço responsável por autenticar um usuário em um estabelecimento (suporta e-mail único por loja)
// 1 - Normaliza o e-mail e valida a presença obrigatória das credenciais
// 2 - Se o código/slug da loja for informado, busca exatamente o usuário naquela loja específica
// 3 - Se o slug não for informado, busca contas com aquele e-mail; caso exista em múltiplas lojas com a mesma senha, solicita seleção da loja
// 4 - Verifica se tanto o usuário quanto a loja estão ativos (regra de Soft Delete)
// 5 - Gera um token JWT contendo id, role, empresaId, empresaSlug e empresaNome, válido por 8 horas
export async function authenticateUser(email, senha, lojaSlug = null) {
  if (!email || !senha) throw new AppError('Email e senha são obrigatórios', 400);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSlug = lojaSlug ? generateSlug(lojaSlug) : null;

  let matchedUser = null;

  if (normalizedSlug) {
    // Busca direta na loja informada
    const empresa = await prisma.empresa.findUnique({ where: { slug: normalizedSlug } });
    if (!empresa) throw new AppError('Estabelecimento ou credenciais inválidas', 401);

    const user = await prisma.usuario.findUnique({
      where: {
        empresaId_email: {
          empresaId: empresa.id,
          email: normalizedEmail,
        },
      },
      include: { empresa: true },
    });

    if (!user) throw new AppError('Credenciais inválidas', 401);
    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) throw new AppError('Credenciais inválidas', 401);

    matchedUser = user;
  } else {
    // Busca por e-mail considerando que o mesmo e-mail pode existir em mais de uma loja
    const candidates = await prisma.usuario.findMany({
      where: { email: normalizedEmail },
      include: { empresa: true },
    });

    if (candidates.length === 0) throw new AppError('Credenciais inválidas', 401);

    // Verifica em quais contas candidatas a senha fornecida é válida
    const validCandidates = [];
    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(senha, candidate.senha);
      if (isValid) validCandidates.push(candidate);
    }

    if (validCandidates.length === 0) throw new AppError('Credenciais inválidas', 401);

    if (validCandidates.length > 1) {
      // Usuário possui o mesmo e-mail e senha em múltiplas lojas: retorna as opções ativas para escolha
      const activeStores = validCandidates
        .filter((u) => u.ativo && u.empresa?.ativo)
        .map((u) => ({
          id: u.empresa.id,
          nome: u.empresa.nome,
          slug: u.empresa.slug,
        }));

      if (activeStores.length === 0) {
        throw new AppError('Sua conta ou estabelecimento está inativo', 403);
      }

      if (activeStores.length > 1) {
        return {
          requiresStoreSelection: true,
          stores: activeStores,
        };
      }

      // Apenas uma das contas está ativa
      matchedUser = validCandidates.find((u) => u.ativo && u.empresa?.ativo);
    } else {
      matchedUser = validCandidates[0];
    }
  }

  // Checa bloqueios de Soft Delete (usuário ou loja inativados)
  if (!matchedUser.ativo) {
    throw new AppError('Esta conta de usuário foi desativada pelo administrador', 403);
  }
  if (!matchedUser.empresa || !matchedUser.empresa.ativo) {
    throw new AppError('O estabelecimento vinculado a esta conta está desativado', 403);
  }

  const token = jwt.sign(
    {
      id: matchedUser.id,
      role: matchedUser.role,
      empresaId: matchedUser.empresaId,
      empresaSlug: matchedUser.empresa.slug,
      empresaNome: matchedUser.empresa.nome,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, user: sanitizeUser(matchedUser) };
}

// serviço responsável por cadastrar um novo estabelecimento (tenant) e seu usuário administrador inicial
// 1 - Valida os campos obrigatórios do responsável e da loja (nomeLoja, nome, email, senha)
// 2 - Gera ou sanitiza o slug único da loja e verifica conflitos no banco
// 3 - Executa uma transação atômica criando a Empresa e o primeiro Usuário com papel ADMIN
// 4 - Emite o token JWT inicial da sessão para login automático pós-cadastro
export async function registerStoreAndAdmin({ nomeLoja, slug, cnpj, telefone, nome, email, senha }) {
  if (!nome || !email || !senha || !nomeLoja) {
    throw new AppError('Nome do responsável, nome da loja, email e senha são obrigatórios', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const baseSlug = generateSlug(slug || nomeLoja);

  if (!baseSlug) {
    throw new AppError('Nome da loja inválido para geração do identificador', 400);
  }

  // Verifica unicidade do slug; se foi gerado automaticamente e colidir, anexa sufixo único
  let finalSlug = baseSlug;
  const slugExists = await prisma.empresa.findUnique({ where: { slug: finalSlug } });
  if (slugExists) {
    if (slug) {
      throw new AppError('Já existe um estabelecimento com este identificador (slug)', 400);
    }
    finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const hashed = await bcrypt.hash(senha, 10);

  const created = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nome: nomeLoja.trim(),
        slug: finalSlug,
        cnpj: cnpj ? cnpj.trim() : null,
        telefone: telefone ? telefone.trim() : null,
        ativo: true,
      },
    });

    const adminUser = await tx.usuario.create({
      data: {
        nome: nome.trim(),
        email: normalizedEmail,
        senha: hashed,
        role: 'ADMIN', // Primeiro usuário fundador do estabelecimento sempre é ADMIN
        ativo: true,
        empresaId: empresa.id,
      },
      include: { empresa: true },
    });

    return { empresa, adminUser };
  });

  const token = jwt.sign(
    {
      id: created.adminUser.id,
      role: created.adminUser.role,
      empresaId: created.empresa.id,
      empresaSlug: created.empresa.slug,
      empresaNome: created.empresa.nome,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: sanitizeUser(created.adminUser),
    empresa: created.empresa,
  };
}
