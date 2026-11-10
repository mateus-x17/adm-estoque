import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";
import { generateSlug } from "../utils/tenantScope.js";
import { sanitizeUser } from "../utils/sanitizers.js";

// arquivo responsável pelas regras de autenticação (portais Admin e Loja), abertura de Organizações e emissão de JWT

// função auxiliar para construir payload seguro do token JWT e objeto resumido do usuário
// 1 - Assina token de 8h carregando id, role, organizacaoId e lojaId (null para ADMIN global da rede)
function buildSessionPayload(user) {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      organizacaoId: user.organizacaoId,
      organizacaoSlug: user.organizacao.slug,
      organizacaoNome: user.organizacao.nome,
      lojaId: user.lojaId,
      lojaSlug: user.loja?.slug || null,
      lojaNome: user.loja?.nome || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, user: sanitizeUser(user) };
}

// serviço para autenticar colaborador ou administrador respeitando portais e múltiplas organizações
// 1 - Normaliza e-mail e verifica credenciais obrigatórias
// 2 - Se organizacaoSlug for informado, busca diretamente na organização escolhida; caso contrário localiza todas as contas com o e-mail
// 3 - Valida senha com bcryptjs; se o usuário atuar em 2+ organizações ativas, retorna requiresOrgSelection
// 4 - Aplica regra opcional de portal ('admin' exige role ADMIN; 'loja' orienta ADMIN a entrar pelo Portal Admin)
// 5 - Bloqueia acesso se a Organização ou a Loja do colaborador estiverem inativas (403)
export async function authenticateUser(email, senha, organizacaoSlug = null, portal = null) {
  if (!email || !senha) throw new AppError("Email e senha são obrigatórios", 400);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrgSlug = organizacaoSlug ? generateSlug(organizacaoSlug) : null;
  const normalizedPortal = portal ? String(portal).trim().toLowerCase() : null;

  let candidates = [];

  if (normalizedOrgSlug) {
    const organizacao = await prisma.organizacao.findUnique({ where: { slug: normalizedOrgSlug } });
    if (!organizacao) throw new AppError("Organização ou credenciais inválidas", 401);

    const user = await prisma.usuario.findUnique({
      where: {
        organizacaoId_email: {
          organizacaoId: organizacao.id,
          email: normalizedEmail,
        },
      },
      include: { organizacao: true, loja: true },
    });

    if (!user) throw new AppError("Credenciais inválidas", 401);
    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) throw new AppError("Credenciais inválidas", 401);

    candidates = [user];
  } else {
    const users = await prisma.usuario.findMany({
      where: { email: normalizedEmail },
      include: { organizacao: true, loja: true },
    });

    if (users.length === 0) throw new AppError("Credenciais inválidas", 401);

    for (const candidate of users) {
      const isValid = await bcrypt.compare(senha, candidate.senha);
      if (isValid) candidates.push(candidate);
    }

    if (candidates.length === 0) throw new AppError("Credenciais inválidas", 401);
  }

  // Filtragem opcional por portal de login (Portal Admin vs Portal da Loja)
  if (normalizedPortal === "admin") {
    const adminCandidates = candidates.filter((u) => u.role === "ADMIN");
    if (adminCandidates.length === 0) {
      throw new AppError(
        "Esta conta não possui privilégio de Administrador. Acesse pelo Portal da Loja (/login).",
        403
      );
    }
    candidates = adminCandidates;
  } else if (normalizedPortal === "loja") {
    const staffCandidates = candidates.filter((u) => u.role !== "ADMIN");
    if (staffCandidates.length === 0) {
      throw new AppError(
        "Contas de Administrador da rede devem acessar pelo Portal do Administrador (/admin/login).",
        403
      );
    }
    candidates = staffCandidates;
  }

  let matchedUser = null;

  if (candidates.length > 1) {
    const activeOrgs = candidates
      .filter((u) => u.organizacao?.ativo && (u.role === "ADMIN" || u.loja?.ativo))
      .map((u) => ({
        id: u.organizacao.id,
        nome: u.organizacao.nome,
        slug: u.organizacao.slug,
        role: u.role,
        lojaNome: u.loja?.nome || "Todas as Lojas",
      }));

    if (activeOrgs.length === 0) {
      throw new AppError("Sua organização ou loja vinculada está inativa", 403);
    }

    if (activeOrgs.length > 1) {
      return {
        requiresOrgSelection: true,
        organizations: activeOrgs,
      };
    }

    matchedUser = candidates.find(
      (u) => u.organizacao?.ativo && (u.role === "ADMIN" || u.loja?.ativo)
    );
  } else {
    matchedUser = candidates[0];
  }

  if (!matchedUser.organizacao || !matchedUser.organizacao.ativo) {
    throw new AppError("A organização vinculada a esta conta está desativada", 403);
  }

  if (matchedUser.role !== "ADMIN" && (!matchedUser.loja || !matchedUser.loja.ativo)) {
    throw new AppError("A loja vinculada a esta conta está desativada", 403);
  }

  const session = buildSessionPayload(matchedUser);

  if (matchedUser.role === "ADMIN") {
    const lojas = await prisma.loja.findMany({
      where: { organizacaoId: matchedUser.organizacaoId },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
    return { ...session, lojas };
  }

  return session;
}

// serviço para registrar uma nova Organização (Rede), sua 1ª Loja e o usuário fundador ADMIN
// 1 - Valida presença de nome da organização/loja, responsável, e-mail e senha
// 2 - Gera slugs únicos para a Organização e para a Loja Matriz inicial
// 3 - Executa transação atômica criando Organizacao -> Loja -> Usuario (role ADMIN, lojaId null)
// 4 - Emite o JWT inicial e devolve token, usuário, organização e loja criada
export async function registerOrganizationAndAdmin({
  nomeOrganizacao,
  nomeLoja,
  slug,
  cnpj,
  telefone,
  endereco,
  nome,
  email,
  senha,
}) {
  const orgTitle = String(nomeOrganizacao || nomeLoja || "").trim();
  const storeTitle = String(nomeLoja || (orgTitle ? `${orgTitle} Matriz` : "")).trim();

  if (!nome || !email || !senha || !orgTitle || !storeTitle) {
    throw new AppError(
      "Nome do administrador, nome da organização/loja, e-mail e senha são obrigatórios",
      400
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const baseOrgSlug = generateSlug(slug || orgTitle);
  const storeSlug = generateSlug(storeTitle) || "matriz";

  if (!baseOrgSlug) {
    throw new AppError("Nome inválido para geração do identificador da organização", 400);
  }

  let finalOrgSlug = baseOrgSlug;
  const orgExists = await prisma.organizacao.findUnique({ where: { slug: finalOrgSlug } });
  if (orgExists) {
    if (slug) {
      throw new AppError("Já existe uma organização registrada com este identificador (slug)", 400);
    }
    finalOrgSlug = `${baseOrgSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const hashed = await bcrypt.hash(senha, 10);

  const created = await prisma.$transaction(async (tx) => {
    const organizacao = await tx.organizacao.create({
      data: {
        nome: orgTitle,
        slug: finalOrgSlug,
        cnpj: cnpj ? String(cnpj).trim() : null,
        telefone: telefone ? String(telefone).trim() : null,
        ativo: true,
      },
    });

    const loja = await tx.loja.create({
      data: {
        nome: storeTitle,
        slug: storeSlug,
        cnpj: cnpj ? String(cnpj).trim() : null,
        telefone: telefone ? String(telefone).trim() : null,
        endereco: endereco ? String(endereco).trim() : null,
        ativo: true,
        organizacaoId: organizacao.id,
      },
    });

    const adminUser = await tx.usuario.create({
      data: {
        nome: nome.trim(),
        email: normalizedEmail,
        senha: hashed,
        role: "ADMIN",
        organizacaoId: organizacao.id,
        lojaId: null, // Admin gerencia todas as lojas da Organização
      },
      include: { organizacao: true, loja: true },
    });

    return { organizacao, loja, adminUser };
  });

  const session = buildSessionPayload(created.adminUser);

  return {
    ...session,
    organizacao: created.organizacao,
    lojas: [created.loja],
  };
}
