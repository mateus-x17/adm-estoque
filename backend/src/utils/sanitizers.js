export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

export function sanitizeUsers(users) {
  return users.map(sanitizeUser);
}
