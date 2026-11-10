-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");
CREATE INDEX "Empresa_slug_idx" ON "Empresa"("slug");
CREATE INDEX "Empresa_ativo_idx" ON "Empresa"("ativo");

-- Backfill: Cria empresa padrao (id = 1) para vincular registros legados sem perda de dados
INSERT INTO "Empresa" ("nome", "slug", "ativo", "updatedAt")
VALUES ('Loja Matriz', 'matriz', true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- DropIndex antigos (com IF EXISTS para seguranca em diferentes estados do banco)
DROP INDEX IF EXISTS "Categoria_nome_key";
DROP INDEX IF EXISTS "Movimento_data_idx";
DROP INDEX IF EXISTS "Movimento_produtoId_data_idx";
DROP INDEX IF EXISTS "Movimento_usuarioId_idx";
DROP INDEX IF EXISTS "Produto_categoriaId_quantidade_idx";
DROP INDEX IF EXISTS "Produto_fornecedorId_idx";
DROP INDEX IF EXISTS "Produto_nome_idx";
DROP INDEX IF EXISTS "Produto_quantidade_idx";
DROP INDEX IF EXISTS "Usuario_email_idx";
DROP INDEX IF EXISTS "Usuario_email_key";
DROP INDEX IF EXISTS "Usuario_role_idx";

-- Expand & Backfill nas tabelas existentes usando DEFAULT temporario para a empresa 1
ALTER TABLE "Categoria" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "empresaId" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Fornecedor" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "empresaId" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Movimento" ADD COLUMN "empresaId" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Produto" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "empresaId" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Usuario" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "empresaId" INTEGER NOT NULL DEFAULT 1;

-- Contract: Remove o DEFAULT de empresaId para forcar o envio explicito pela aplicacao
ALTER TABLE "Categoria" ALTER COLUMN "empresaId" DROP DEFAULT;
ALTER TABLE "Fornecedor" ALTER COLUMN "empresaId" DROP DEFAULT;
ALTER TABLE "Movimento" ALTER COLUMN "empresaId" DROP DEFAULT;
ALTER TABLE "Produto" ALTER COLUMN "empresaId" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "empresaId" DROP DEFAULT;

-- CreateIndex compostos por empresaId
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");
CREATE INDEX "Categoria_empresaId_ativo_idx" ON "Categoria"("empresaId", "ativo");
CREATE UNIQUE INDEX "Categoria_empresaId_nome_key" ON "Categoria"("empresaId", "nome");

CREATE INDEX "Fornecedor_empresaId_idx" ON "Fornecedor"("empresaId");
CREATE INDEX "Fornecedor_empresaId_ativo_idx" ON "Fornecedor"("empresaId", "ativo");

CREATE INDEX "Movimento_empresaId_usuarioId_idx" ON "Movimento"("empresaId", "usuarioId");
CREATE INDEX "Movimento_empresaId_produtoId_data_idx" ON "Movimento"("empresaId", "produtoId", "data");
CREATE INDEX "Movimento_empresaId_data_idx" ON "Movimento"("empresaId", "data");

CREATE INDEX "Produto_empresaId_ativo_idx" ON "Produto"("empresaId", "ativo");
CREATE INDEX "Produto_empresaId_categoriaId_quantidade_idx" ON "Produto"("empresaId", "categoriaId", "quantidade");
CREATE INDEX "Produto_empresaId_fornecedorId_idx" ON "Produto"("empresaId", "fornecedorId");
CREATE INDEX "Produto_empresaId_quantidade_idx" ON "Produto"("empresaId", "quantidade");
CREATE INDEX "Produto_empresaId_nome_idx" ON "Produto"("empresaId", "nome");

CREATE INDEX "Usuario_empresaId_email_idx" ON "Usuario"("empresaId", "email");
CREATE INDEX "Usuario_empresaId_role_idx" ON "Usuario"("empresaId", "role");
CREATE INDEX "Usuario_empresaId_ativo_idx" ON "Usuario"("empresaId", "ativo");
CREATE UNIQUE INDEX "Usuario_empresaId_email_key" ON "Usuario"("empresaId", "email");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Movimento" ADD CONSTRAINT "Movimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
