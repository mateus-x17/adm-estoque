import { authenticateUser, registerUser } from '../services/authService.js';
import { AppError } from '../utils/errorHandler.js';

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

export async function registerController(req, res, next) {
  try {
    const { nome, email, senha, role } = req.body;
    const user = await registerUser({ nome, email, senha, role });
    res.status(201).json({ message: 'Usuário cadastrado com sucesso', usuario: user });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Erro interno do servidor', 500));
  }
}