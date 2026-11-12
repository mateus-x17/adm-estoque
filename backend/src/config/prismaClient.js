// arquivo responsável por inicializar e exportar a instância singleton do cliente Prisma ORM e tipos auxiliares do banco de dados.
// atua na camada de configuração e persistência do backend.
// tecnologias principais: Prisma ORM e PostgreSQL (NeonDB).
// usado por: todos os serviços, middlewares e controladores que realizam operações de leitura ou escrita no banco de dados.

// importações da biblioteca do Prisma: PrismaClient é a classe cliente para executar consultas no PostgreSQL; Prisma provê utilitários e tipos como Prisma.sql.
import { PrismaClient, Prisma } from "@prisma/client";

// instância singleton do PrismaClient compartilhada por toda a aplicação para evitar esgotamento de conexões no pool do PostgreSQL.
export const prisma = new PrismaClient();

// exportação nomeada do namespace Prisma para montagem de queries SQL parametrizadas e tratamento de erros de catálogo.
export { Prisma };
