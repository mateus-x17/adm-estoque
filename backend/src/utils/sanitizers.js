// função responsável por limpar dados sensíveis de um usuário
// 1 - Recebe um objeto de usuário
// 2 - Retorna null se não houver usuário
// 3 - Usa desestruturação para retirar a senha do objeto e manter apenas os dados seguros
// 4 - Retorna o objeto contendo os dados seguros
export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

// função responsável por limpar dados sensíveis de uma lista de usuários
// 1 - Recebe um array de usuários
// 2 - Utiliza o map para aplicar a função sanitizeUser em cada item da lista
// 3 - Retorna a nova lista apenas com dados seguros
export function sanitizeUsers(users) {
  return users.map(sanitizeUser);
}
