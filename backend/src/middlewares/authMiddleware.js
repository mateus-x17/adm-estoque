import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import { AppError } from "../utils/errorHandler.js";

// middleware responsável por validar a autenticação do usuário nas rotas protegidas
// 1 - Extrai o cabeçalho de autorização (authorization) da requisição HTTP
// 2 - Se o cabeçalho não existir, invoca o errorHandler passando um AppError de não autorizado (401)
// 3 - Extrai apenas o token do cabeçalho (ignorando o prefixo "Bearer ")
// 4 - Usa a biblioteca jwt para decodificar e verificar o token usando a chave secreta
// 5 - Busca o usuário no banco de dados usando o ID extraído do payload do token
// 6 - Se o usuário não existir (token obsoleto de conta apagada), retorna erro de não autorizado
// 7 - Anexa os dados do usuário (id, email, role) no objeto da requisição (req.user) para ser acessado por outros controladores e middlewares
// 8 - Chama a função next() para permitir que a requisição siga para o próximo passo/controlador
// 9 - Em caso de falha na validação do jwt (expirado ou malformado), o catch captura o erro e retorna não autorizado (401)
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError('Token não fornecido', 401));

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // valida assinatura do token
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } }); // busca usuário real no banco
    if (!user) return next(new AppError('Usuário não encontrado', 401));
    
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return next(new AppError('Token inválido', 401));
  }
}
