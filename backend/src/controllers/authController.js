import { authenticateUser, registerUser } from '../services/authService.js';
import { AppError } from '../utils/errorHandler.js';

// função responsável por autenticar (fazer login) de um usuário
// 1 - Recebe a requisição (req), a resposta (res) e a função next do Express
// 2 - Extrai o email e a senha do corpo da requisição (req.body)
// 3 - Chama o serviço authenticateUser passando email e senha, que validará os dados e retornará o token e usuário
// 4 - Retorna uma resposta JSON contendo os dados obtidos do serviço
// 5 - Em caso de erro, cai no bloco catch, registra no console e envia para o errorHandler através do next()
// Se não for um AppError conhecido, empacota como Erro Interno (500)
export async function loginController(req, res, next) {
  try {
    const { email, senha } = req.body;
    const result = await authenticateUser(email, senha);
    res.json(result);
  } catch (err) {
    console.error('ERRO REAL:');
    console.error(err);
    next(err instanceof AppError ? err : new AppError('Erro interno do servidor', 500));
  }
}

// função responsável por registrar um novo usuário no sistema
// 1 - Recebe req, res, next
// 2 - Extrai os dados do novo usuário (nome, email, senha, role) do corpo da requisição
// 3 - Chama o serviço registerUser, que verifica unicidade de email, encripta a senha e salva no banco
// 4 - Retorna o status 201 (Created) e os dados do usuário cadastrado em formato JSON
// 5 - O catch captura erros (como email já existente) e repassa ao next()
export async function registerController(req, res, next) {
  try {
    const { nome, email, senha, role } = req.body;
    const user = await registerUser({ nome, email, senha, role });
    res.status(201).json({ message: 'Usuário cadastrado com sucesso', usuario: user });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Erro interno do servidor', 500));
  }
}