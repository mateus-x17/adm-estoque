// arquivo responsável por controlar requisições HTTP de autenticação de usuários (Portal Admin e Loja) e criação de organizações.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: authRoutes.js para atender aos endpoints POST /auth/login e POST /auth/register.

// importações da camada de serviços: authenticateUser valida credenciais e gera tokens; registerOrganizationAndAdmin cria tenant inicial.
import { authenticateUser, registerOrganizationAndAdmin } from "../services/authService.js";
// importações de logging: childLogger instancia um logger estruturado associado ao módulo authController.
import { childLogger } from "../config/logger.js";

// instância de logger especializada para auditoria de autenticação
const log = childLogger("authController");

// função responsável por autenticar usuários nos portais corporativo ou da loja e retornar token JWT de sessão.
//
// contexto: invocada pela rota POST /auth/login quando um colaborador ou administrador envia e-mail e senha.
//
// parâmetros:
//   - req (Request, obrigatório): requisição Express contendo email, senha, organizacaoSlug, lojaSlug e portal no corpo.
//   - res (Response, obrigatório): resposta Express para emissão do JSON com token e dados de sessão.
//   - next (NextFunction, obrigatório): função de encadeamento para repasse de erros ao errorHandler.
//
// retorno: nenhum (envia JSON ao cliente com token e perfil, ou objeto solicitando seleção de organização).
// erros: repassa AppError ao next(err) se as credenciais forem incorretas ou a conta estiver bloqueada.
// efeitos colaterais: grava logs de auditoria informando o ID do usuário e do tenant logado.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - desestrutura email, senha, organizacaoSlug, lojaSlug e portal de req.body.
// 3 - invoca authenticateUser no service passando as credenciais e o slug opcional da organização.
// 4 - se result.requiresOrgSelection for verdadeiro, registra log informativo e responde imediatamente com a lista de tenants para o usuário escolher.
// 5 - registra log de sucesso com o ID do usuário, da organização e o cargo.
// 6 - envia a resposta JSON com o token e dados de sessão para o cliente.
export async function loginController(req, res, next) {
  try {
    // 2 - extrai credenciais e portal
    const { email, senha, organizacaoSlug, lojaSlug, portal } = req.body;

    // 3 - autentica no service
    const result = await authenticateUser(
      email,
      senha,
      organizacaoSlug || lojaSlug || null,
      portal || null
    );

    // 4 - desvio para seleção quando mesmo e-mail existe em mais de uma organização
    if (result.requiresOrgSelection) {
      log.info({ email }, "Multiple organizations found for user credentials, requesting selection");
      return res.json(result);
    }

    // 5 - auditoria de login com sucesso
    log.info(
      {
        userId: result.user?.id,
        organizacaoId: result.user?.organizacaoId,
        lojaId: result.user?.lojaId,
        role: result.user?.role,
      },
      "User logged in successfully"
    );

    // 6 - responde com o payload de sessão
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// função responsável por registrar uma nova Organização (Rede), sua primeira Loja e o usuário fundador com perfil ADMIN.
//
// contexto: chamada pela rota POST /auth/register na criação inicial de uma conta corporativa no sistema.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo dados corporativos da organização, da filial inicial e credenciais do administrador.
//   - res (Response, obrigatório): resposta HTTP para envio do status 201 e dados do tenant criado.
//   - next (NextFunction, obrigatório): função para tratamento de exceções.
//
// retorno: nenhum (responde HTTP 201 com JSON contendo mensagem de sucesso, token JWT, dados do usuário, organização e lojas).
// erros: repassa ao next(err) se já existir organização ou administrador com o mesmo e-mail ou documento único.
// efeitos colaterais: insere registros transacionais nas tabelas Organizacao, Loja e Usuario no PostgreSQL.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai os campos corporativos e cadastrais de req.body.
// 3 - aciona registerOrganizationAndAdmin no authService para execução transacional da criação.
// 4 - registra log de auditoria com o novo ID de usuário e organização criada.
// 5 - responde com status HTTP 201 Created entregando o token de acesso e os modelos criados.
export async function registerController(req, res, next) {
  try {
    // 2 - extrai dados do formulário de registro
    const { nomeOrganizacao, nomeLoja, slug, cnpj, telefone, endereco, nome, email, senha } =
      req.body;

    // 3 - persiste organização, loja e administrador de forma atômica
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

    // 4 - registra auditoria corporativa
    log.info(
      {
        userId: result.user.id,
        organizacaoId: result.organizacao.id,
        slug: result.organizacao.slug,
      },
      "New organization, first store and admin user registered"
    );

    // 5 - responde HTTP 201 com os dados de inicialização
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
