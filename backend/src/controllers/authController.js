import { authenticateUser, registerUser } from '../services/authService.js';
import { childLogger } from '../config/logger.js';
const log = childLogger('authController');

// função responsável por autenticar (fazer login) de um usuário
export async function loginController(req, res, next) {
  try {
    const { email, senha } = req.body;
    const result = await authenticateUser(email, senha);
    log.info({ userId: result.user.id, email: result.user.email }, 'User logged in successfully');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// função responsável por registrar um novo usuário no sistema
// O papel (role) é estritamente ignorado no cadastro público para prevenir escalação de privilégios
export async function registerController(req, res, next) {
  try {
    const { nome, email, senha } = req.body;
    const user = await registerUser({ nome, email, senha });
    log.info({ userId: user.id, email: user.email }, 'New user registered via public endpoint');
    res.status(201).json({ message: 'Usuário cadastrado com sucesso', usuario: user });
  } catch (err) {
    next(err);
  }
}