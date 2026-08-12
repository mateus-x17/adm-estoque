import { PrismaClient } from "@prisma/client";

// arquivo responsável por instanciar o cliente do prisma
// 1 - Importa a classe PrismaClient da biblioteca @prisma/client
// 2 - Instancia um novo objeto do PrismaClient e o exporta para ser utilizado em toda a aplicação (padrão Singleton)
export const prisma = new PrismaClient();