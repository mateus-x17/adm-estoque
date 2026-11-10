// arquivo responsável por utilitários de sanitização de dados sensíveis e normalização de flags booleanas

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

// função utilitária para converter valores booleanos vindos de JSON, query strings ou FormData
// 1 - Se já for boolean, retorna diretamente
// 2 - Se for string ('false', '0', 'nao', 'não'), retorna false de forma segura (evitando que Boolean('false') vire true)
// 3 - Para demais tipos, aplica conversão padrão Boolean
export function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['false', '0', 'nao', 'não', 'inativo', 'no', ''].includes(normalized)) {
      return false;
    }
    if (['true', '1', 'sim', 'ativo', 'yes'].includes(normalized)) {
      return true;
    }
  }
  return Boolean(value);
}
