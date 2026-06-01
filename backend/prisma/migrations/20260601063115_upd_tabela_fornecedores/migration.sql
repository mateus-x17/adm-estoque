/*
  Warnings:

  - You are about to drop the column `contato` on the `Fornecedor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Fornecedor" DROP COLUMN "contato",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefone" TEXT;

-- CreateIndex
CREATE INDEX "Movimento_usuarioId_idx" ON "Movimento"("usuarioId");

-- CreateIndex
CREATE INDEX "Movimento_produtoId_idx" ON "Movimento"("produtoId");

-- CreateIndex
CREATE INDEX "Movimento_data_idx" ON "Movimento"("data");

-- CreateIndex
CREATE INDEX "Produto_categoriaId_idx" ON "Produto"("categoriaId");

-- CreateIndex
CREATE INDEX "Produto_fornecedorId_idx" ON "Produto"("fornecedorId");

-- CreateIndex
CREATE INDEX "Produto_quantidade_idx" ON "Produto"("quantidade");

-- CreateIndex
CREATE INDEX "Produto_nome_idx" ON "Produto"("nome");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "Usuario"("role");
