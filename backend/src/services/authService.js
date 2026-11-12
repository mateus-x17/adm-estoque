// arquivo responsável por gerenciar regras de autenticação, login multi-organização, criação de conta/rede e emissão de tokens JWT.
// atua na camada de serviços (services) do backend.
// tecnologias principais: bcryptjs, jsonwebtoken, Prisma Client, JavaScript ES Modules.
// usado por: authController.js para efetuar login de usuários e cadastro de novas organizações.

// importações de bibliotecas externas para criptografia e emissão de tokens JWT:
// bcrypt realiza a comparação e geração de hash seguro de senhas; jwt assina tokens de sessão de usuários.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// importações de clientes e configurações de infraestrutura:
// prisma fornece acesso direto ao banco de dados relacional para usuários, organizações e lojas.
import { prisma } from "../config/prismaClient.js";

// importações de utilitários e regras de domínio:
// AppError padroniza lançamento de erros com status HTTP; generateSlug cria slugs url-friendly;
// sanitizeUser remove campos sensíveis do usuário antes de expor na sessão; formatMatricula gera a matrícula visual padrão.
import { AppError } from "../utils/errorHandler.js";
import { generateSlug } from "../utils/tenantScope.js";
import { sanitizeUser } from "../utils/sanitizers.js";
import { formatMatricula } from "../utils/matriculaHelper.js";

// função responsável por construir o token JWT de sessão e montar o objeto seguro do usuário autenticado.
//
// contexto: invocada internamente por authenticateUser e registerOrganizationAndAdmin ao autenticar um colaborador ou administrador.
//
// parâmetros:
//   - user (objeto, obrigatório): entidade do usuário recuperada do banco de dados contendo id, role, organizacaoId, lojaId, organizacao e loja.
//
// retorno: objeto contendo a propriedade token (string JWT) e a propriedade user (objeto com dados sanitizados sem senha).
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe user (objeto obrigatório).
// 2 - resolve a matrícula do usuário utilizando o valor existente ou formatando a partir do identificador numérico.
// 3 - gera e assina o token JWT contendo as claims de identificação, perfil de acesso e escopo organizacional com validade de 8 horas.
// 4 - sanitiza os dados do usuário removendo hash de senha e mesclando a matrícula formatada.
// 5 - retorna objeto estruturado com token e usuário sanitizado.
function buildSessionPayload(user) {
  // 1 - recebe user (objeto obrigatório).
  // 2 - resolve a matrícula do usuário utilizando o valor existente ou formatando a partir do identificador numérico.
  const resolvedMatricula = user.matricula || formatMatricula(user.id);

  // 3 - gera e assina o token JWT contendo as claims de identificação, perfil de acesso e escopo organizacional com validade de 8 horas.
  const token = jwt.sign(
    {
      id: user.id,
      matricula: resolvedMatricula,
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

  // 4 - sanitiza os dados do usuário removendo hash de senha e mesclando a matrícula formatada.
  const sanitizedUser = sanitizeUser({ ...user, matricula: resolvedMatricula });

  // 5 - retorna objeto estruturado com token e usuário sanitizado.
  return { token, user: sanitizedUser };
}

// função responsável por autenticar colaborador ou administrador respeitando portais e múltiplas organizações.
//
// contexto: invocada por authController.js na rota POST /api/auth/login para validar credenciais e liberar acesso ao sistema.
//
// parâmetros:
//   - email (string, obrigatório): endereço de e-mail cadastrado do colaborador ou administrador.
//   - senha (string, obrigatório): senha em texto puro submetida para verificação criptográfica.
//   - organizacaoSlug (string, opcional, padrão null): identificador textual da organização pretendida quando houver desambiguação.
//   - portal (string, opcional, padrão null): portal de origem da requisição ('admin' para gestores ou 'loja' para colaboradores operacionais).
//
// retorno: objeto de sessão com token JWT e dados do usuário, ou objeto informando requiresOrgSelection quando o usuário tiver múltiplos vínculos ativos.
// erros: AppError (400) se email ou senha não forem fornecidos; AppError (401) se as credenciais ou organização forem inválidas; AppError (403) se permissão de portal for negada ou situação do colaborador/organização/loja estiver inativa, suspensa ou em férias.
// efeitos colaterais: realiza consultas de leitura nas tabelas de organizações, usuários e lojas no banco de dados.
//
// passo a passo:
// 1 - recebe email (string), senha (string), organizacaoSlug (string opcional) e portal (string opcional).
// 2 - valida presença de email e senha lançando AppError (400) se ausentes.
// 3 - normaliza os valores de email, organizacaoSlug e portal para minusculas e sem espaços extras.
// 4 - busca candidatos a autenticação verificando se o slug da organização foi especificado ou se deve buscar em toda a base.
// 5 - valida as senhas criptografadas dos usuários localizados comparando com o hash via bcrypt.
// 6 - aplica restrição de portal garantindo que gestores acessem portal admin e colaboradores acessem portal de loja.
// 7 - desambigua casos onde o mesmo e-mail possui múltiplos acessos em organizações distintas solicitando seleção prévia.
// 8 - valida situação funcional do colaborador bloqueando acessos suspensos, em férias ou com lojas/organizações inativas.
// 9 - gera payload de sessão com token JWT e anexa a listagem de lojas caso o usuário seja administrador.
// 10 - retorna objeto de sessão autenticada.
export async function authenticateUser(email, senha, organizacaoSlug = null, portal = null) {
  // 1 - recebe email (string), senha (string), organizacaoSlug (string opcional) e portal (string opcional).
  // 2 - valida presença de email e senha lançando AppError (400) se ausentes.
  if (!email || !senha) throw new AppError("Email e senha são obrigatórios", 400);

  // 3 - normaliza os valores de email, organizacaoSlug e portal para minusculas e sem espaços extras.
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrgSlug = organizacaoSlug ? generateSlug(organizacaoSlug) : null;
  const normalizedPortal = portal ? String(portal).trim().toLowerCase() : null;

  let candidates = [];

  // 4 - busca candidatos a autenticação verificando se o slug da organização foi especificado ou se deve buscar em toda a base.
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
    // 5 - valida as senhas criptografadas dos usuários localizados comparando com o hash via bcrypt.
    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) throw new AppError("Credenciais inválidas", 401);

    candidates = [user];
  } else {
    const users = await prisma.usuario.findMany({
      where: { email: normalizedEmail },
      include: { organizacao: true, loja: true },
    });

    if (users.length === 0) throw new AppError("Credenciais inválidas", 401);

    // 5 - valida as senhas criptografadas dos usuários localizados comparando com o hash via bcrypt.
    for (const candidate of users) {
      const isValid = await bcrypt.compare(senha, candidate.senha);
      if (isValid) candidates.push(candidate);
    }

    if (candidates.length === 0) throw new AppError("Credenciais inválidas", 401);
  }

  // 6 - aplica restrição de portal garantindo que gestores acessem portal admin e colaboradores acessem portal de loja.
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

  // 7 - desambigua casos onde o mesmo e-mail possui múltiplos acessos em organizações distintas solicitando seleção prévia.
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

  // 8 - valida situação funcional do colaborador bloqueando acessos suspensos, em férias ou com lojas/organizações inativas.
  if (matchedUser.situacao === "SUSPENSO") {
    throw new AppError("Sua matrícula está suspensa temporariamente. Contate o administrador.", 403);
  }

  if (matchedUser.situacao === "FERIAS") {
    throw new AppError("Acesso pausado: colaborador em período de férias.", 403);
  }

  if (!matchedUser.organizacao || !matchedUser.organizacao.ativo) {
    throw new AppError("A organização vinculada a esta conta está desativada", 403);
  }

  if (matchedUser.role !== "ADMIN" && (!matchedUser.loja || !matchedUser.loja.ativo)) {
    throw new AppError("A loja vinculada a esta conta está desativada", 403);
  }

  // 9 - gera payload de sessão com token JWT e anexa a listagem de lojas caso o usuário seja administrador.
  const session = buildSessionPayload(matchedUser);

  if (matchedUser.role === "ADMIN") {
    const lojas = await prisma.loja.findMany({
      where: { organizacaoId: matchedUser.organizacaoId },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
    return { ...session, lojas };
  }

  // 10 - retorna objeto de sessão autenticada.
  return session;
}

// função responsável por registrar uma nova organização comercial, sua loja matriz inicial e o usuário administrador fundador.
//
// contexto: invocada por authController.js na rota pública POST /api/auth/register ao integrar um novo cliente no sistema multi-tenant.
//
// parâmetros:
//   - payload (objeto, obrigatório): dados de criação da organização, loja e credenciais do administrador.
//       - payload.nomeOrganizacao (string, opcional): razão social ou nome da rede empresarial.
//       - payload.nomeLoja (string, opcional): nome descritivo da primeira unidade comercial (matriz).
//       - payload.slug (string, opcional): identificador textual único para urls e subdomínios da organização.
//       - payload.cnpj (string, opcional): documento fiscal de identificação da empresa.
//       - payload.telefone (string, opcional): telefone comercial para contato e suporte.
//       - payload.endereco (string, opcional): endereço físico da loja matriz.
//       - payload.nome (string, obrigatório): nome completo do fundador administrador.
//       - payload.email (string, obrigatório): endereço de e-mail de acesso do administrador.
//       - payload.senha (string, obrigatório): senha de acesso em texto com pelo menos 6 caracteres.
//
// retorno: objeto de sessão autenticada contendo token JWT, dados sanitizados do admin, entidade da organização e lista de lojas criadas.
// erros: AppError (400) se dados obrigatórios faltarem, senha for menor que 6 caracteres ou slug for inválido/duplicado.
// efeitos colaterais: cria registros atômicos nas tabelas de organizacoes, lojas e usuarios com transação do Prisma.
//
// passo a passo:
// 1 - recebe payload (objeto obrigatório) com dados da empresa, loja e usuário administrador fundador.
// 2 - valida a presença dos campos obrigatórios e comprimento mínimo de seis caracteres para a senha.
// 3 - normaliza email e gera identificadores slug únicos para a organização e loja matriz.
// 4 - verifica se o slug da organização já existe no banco lançando erro se especificado manualmente ou sufixando com aleatório.
// 5 - gera o hash criptográfico seguro da senha do administrador utilizando bcrypt com custo dez.
// 6 - executa transação no banco de dados persistindo a organização, a loja matriz e o usuário administrador inicial.
// 7 - atualiza o registro do administrador atribuindo sua matrícula formatada baseada no identificador gerado.
// 8 - monta o payload de sessão JWT utilizando buildSessionPayload para o administrador recém-criado.
// 9 - retorna sessão autenticada com token, dados do administrador, organização e loja matriz cadastrada.
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
  // 1 - recebe payload (objeto obrigatório) com dados da empresa, loja e usuário administrador fundador.
  const orgTitle = String(nomeOrganizacao || nomeLoja || "").trim();
  const storeTitle = String(nomeLoja || (orgTitle ? `${orgTitle} Matriz` : "")).trim();

  // 2 - valida a presença dos campos obrigatórios e comprimento mínimo de seis caracteres para a senha.
  if (!nome || !email || !senha || !orgTitle || !storeTitle) {
    throw new AppError(
      "Nome do administrador, nome da organização/loja, e-mail e senha são obrigatórios",
      400
    );
  }
  if (String(senha).length < 6) {
    throw new AppError("A senha deve conter pelo menos 6 caracteres", 400);
  }

  // 3 - normaliza email e gera identificadores slug únicos para a organização e loja matriz.
  const normalizedEmail = email.trim().toLowerCase();
  const baseOrgSlug = generateSlug(slug || orgTitle);
  const storeSlug = generateSlug(storeTitle) || "matriz";

  if (!baseOrgSlug) {
    throw new AppError("Nome inválido para geração do identificador da organização", 400);
  }

  // 4 - verifica se o slug da organização já existe no banco lançando erro se especificado manualmente ou sufixando com aleatório.
  let finalOrgSlug = baseOrgSlug;
  const orgExists = await prisma.organizacao.findUnique({ where: { slug: finalOrgSlug } });
  if (orgExists) {
    if (slug) {
      throw new AppError("Já existe uma organização registrada com este identificador (slug)", 400);
    }
    finalOrgSlug = `${baseOrgSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 5 - gera o hash criptográfico seguro da senha do administrador utilizando bcrypt com custo dez.
  const hashed = await bcrypt.hash(senha, 10);

  // 6 - executa transação no banco de dados persistindo a organização, a loja matriz e o usuário administrador inicial.
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

    const createdAdmin = await tx.usuario.create({
      data: {
        nome: nome.trim(),
        email: normalizedEmail,
        senha: hashed,
        role: "ADMIN",
        situacao: "ATIVO",
        organizacaoId: organizacao.id,
        lojaId: null, // Admin gerencia todas as lojas da Organização
      },
    });

    // 7 - atualiza o registro do administrador atribuindo sua matrícula formatada baseada no identificador gerado.
    const adminUser = await tx.usuario.update({
      where: { id: createdAdmin.id },
      data: { matricula: formatMatricula(createdAdmin.id) },
      include: { organizacao: true, loja: true },
    });

    return { organizacao, loja, adminUser };
  });

  // 8 - monta o payload de sessão JWT utilizando buildSessionPayload para o administrador recém-criado.
  const session = buildSessionPayload(created.adminUser);

  // 9 - retorna sessão autenticada com token, dados do administrador, organização e loja matriz cadastrada.
  return {
    ...session,
    organizacao: created.organizacao,
    lojas: [created.loja],
  };
}
