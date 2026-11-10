import { authenticateUser, registerOrganizationAndAdmin } from "../services/authService.js";
import { childLogger } from "../config/logger.js";
const log = childLogger("authController");

// arquivo responsável por controlar requisições de autenticação (Portal Admin e Loja) e abertura de redes

// função para autenticar usuário em sua Organização/Loja
// 1 - Extrai email, senha, organizacaoSlug (ou alias lojaSlug) e portal ('admin' ou 'loja')
// 2 - Se houver múltiplas organizações para o mesmo e-mail/senha, retorna lista para seleção
// 3 - Devolve JWT, perfil sanitizado e lojas da rede quando aplicável
export async function loginController(req, res, next) {
  try {
    const { email, senha, organizacaoSlug, lojaSlug, portal } = req.body;
    const result = await authenticateUser(
      email,
      senha,
      organizacaoSlug || lojaSlug || null,
      portal || null
    );

    if (result.requiresOrgSelection) {
      log.info({ email }, "Multiple organizations found for user credentials, requesting selection");
      return res.json(result);
    }

    log.info(
      {
        userId: result.user?.id,
        organizacaoId: result.user?.organizacaoId,
        lojaId: result.user?.lojaId,
        role: result.user?.role,
      },
      "User logged in successfully"
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// função para registrar uma nova Organização (Rede), sua 1ª Loja e usuário ADMIN fundador
// 1 - Extrai dados corporativos (nomeOrganizacao, nomeLoja, slug, cnpj, telefone, endereco) e do administrador
// 2 - Executa criação transacional via registerOrganizationAndAdmin atribuindo role ADMIN
// 3 - Responde HTTP 201 com token de acesso, organização, loja inicial e usuário fundador
export async function registerController(req, res, next) {
  try {
    const { nomeOrganizacao, nomeLoja, slug, cnpj, telefone, endereco, nome, email, senha } =
      req.body;
    const result = await registerOrganizationAndAdmin({
      nomeOrganizacao,
      nomeLoja,
      slug,
      cnpj,
      telefone,
      endereco,
      nome,
      email,
      senha,
    });

    log.info(
      {
        userId: result.user.id,
        organizacaoId: result.organizacao.id,
        slug: result.organizacao.slug,
      },
      "New organization, first store and admin user registered"
    );

    res.status(201).json({
      message: "Organização, primeira loja e conta administradora criadas com sucesso",
      token: result.token,
      user: result.user,
      usuario: result.user,
      organizacao: result.organizacao,
      lojas: result.lojas,
    });
  } catch (err) {
    next(err);
  }
}
