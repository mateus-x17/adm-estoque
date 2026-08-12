import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// serviço responsável por listar todas as categorias diretamente do banco
// 1 - Executa a consulta findMany na tabela categoria sem filtros
// 2 - Retorna a lista de categorias em formato de array de objetos
export async function listCategories() {
  return prisma.categoria.findMany();
}

// serviço responsável por criar uma nova categoria
// 1 - Valida o input certificando-se que não é uma string vazia, nula ou diferente de texto
// 2 - Lança um erro 400 (Bad Request) caso o nome seja inválido
// 3 - Remove os espaços em branco no início e no fim da string usando trim()
// 4 - Persiste a nova categoria no banco usando o ORM Prisma e retorna o objeto criado
export async function createCategory(nome) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  return prisma.categoria.create({ data: { nome: nome.trim() } });
}

// serviço responsável por atualizar o nome da categoria
// 1 - Valida o input do novo nome garantindo que seja um texto válido
// 2 - Tenta encontrar a categoria pelo ID passado convertendo-o para número
// 3 - Lança erro 404 (Not Found) se a categoria não for encontrada no banco
// 4 - Realiza a atualização aplicando trim() no nome e retorna a categoria atualizada
export async function updateCategory(id, nome) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new AppError('Nome de categoria é obrigatório e deve ser texto', 400);
  }

  const category = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  return prisma.categoria.update({
    where: { id: Number(id) },
    data: { nome: nome.trim() }
  });
}

// serviço responsável por excluir uma categoria
// 1 - Busca a categoria pelo ID para verificar se ela realmente existe
// 2 - Retorna erro 404 caso ela não exista
// 3 - Executa a deleção no banco de dados e retorna a resposta da operação
export async function deleteCategory(id) {
  const category = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AppError('Categoria não encontrada', 404);

  return prisma.categoria.delete({ where: { id: Number(id) } });
}

// serviço responsável por contar a quantidade absoluta de categorias
// 1 - Executa a função count do Prisma para contar o número de linhas na tabela
// 2 - Retorna o valor inteiro representando o total
export async function countCategories() {
  return prisma.categoria.count();
}
