import { authenticateUser, registerStoreAndAdmin } from '../services/authService.js';
import { childLogger } from '../config/logger.js';
const log = childLogger('authController');

// arquivo responsável por controlar as requisições de autenticação e abertura de contas de estabelecimentos

// função responsável por autenticar (fazer login) de um usuário em seu estabelecimento
// 1 - Extrai email, senha e o identificador opcional da loja (lojaSlug) do corpo da requisição
// 2 - Chama authenticateUser; se houver múltiplos tenants para o mesmo email/senha, retorna lista para seleção
// 3 - Registra log de auditoria quando o login é concluído e responde com token JWT e usuário sanitizado
export async function loginController(req, res, next) {
  try {
    const { email, senha, lojaSlug } = req.body;
    const result = await authenticateUser(email, senha, lojaSlug);

    if (result.requiresStoreSelection) {
      log.info({ email }, 'Multiple stores found for user credentials, requesting selection');
      return res.json(result);
    }

    log.info(
      { userId: result.user?.id, empresaId: result.user?.empresaId, email: result.user?.email },
      'User logged in successfully'
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// função responsável por registrar uma nova loja (tenant) e seu usuário administrador fundador
// 1 - Extrai os dados da loja (nomeLoja, slug, cnpj, telefone) e do administrador (nome, email, senha)
// 2 - Executa a criação transacional via registerStoreAndAdmin atribuindo automaticamente a role ADMIN ao fundador
// 3 - Registra evento no logger e devolve status 201 com token de acesso, empresa e usuário criados
export async function registerController(req, res, next) {
  try {
    const { nomeLoja, slug, cnpj, telefone, nome, email, senha } = req.body;
    const result = await registerStoreAndAdmin({ nomeLoja, slug, cnpj, telefone, nome, email, senha });

    log.info(
      { userId: result.user.id, empresaId: result.empresa.id, slug: result.empresa.slug },
      'New store and admin user registered'
    );

    res.status(201).json({
      message: 'Estabelecimento e conta administradora criados com sucesso',
      token: result.token,
      user: result.user,
      usuario: result.user,
      empresa: result.empresa,
    });
  } catch (err) {
    next(err);
  }
}
