-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loja" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "organizacaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Organizacao e Loja
CREATE UNIQUE INDEX "Organizacao_slug_key" ON "Organizacao"("slug");
CREATE INDEX "Organizacao_slug_idx" ON "Organizacao"("slug");
CREATE INDEX "Organizacao_ativo_idx" ON "Organizacao"("ativo");

CREATE UNIQUE INDEX "Loja_organizacaoId_slug_key" ON "Loja"("organizacaoId", "slug");
CREATE INDEX "Loja_organizacaoId_ativo_idx" ON "Loja"("organizacaoId", "ativo");

ALTER TABLE "Loja" ADD CONSTRAINT "Loja_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: Converte registros de Empresa existentes em Organizacao e Loja preservando os IDs
INSERT INTO "Organizacao" ("id", "nome", "slug", "cnpj", "telefone", "ativo", "createdAt", "updatedAt")
SELECT "id", "nome", "slug", "cnpj", "telefone", "ativo", "createdAt", "updatedAt"
FROM "Empresa";

INSERT INTO "Loja" ("id", "nome", "slug", "cnpj", "telefone", "ativo", "organizacaoId", "createdAt", "updatedAt")
SELECT "id", "nome", "slug", "cnpj", "telefone", "ativo", "id", "createdAt", "updatedAt"
FROM "Empresa";

SELECT setval(pg_get_serial_sequence('"Organizacao"', 'id'), COALESCE((SELECT MAX(id) FROM "Organizacao"), 1));
SELECT setval(pg_get_serial_sequence('"Loja"', 'id'), COALESCE((SELECT MAX(id) FROM "Loja"), 1));

-- Remove FKs e indices legados de Empresa
ALTER TABLE "Usuario" DROP CONSTRAINT IF EXISTS "Usuario_empresaId_fkey";
ALTER TABLE "Categoria" DROP CONSTRAINT IF EXISTS "Categoria_empresaId_fkey";
ALTER TABLE "Fornecedor" DROP CONSTRAINT IF EXISTS "Fornecedor_empresaId_fkey";
ALTER TABLE "Produto" DROP CONSTRAINT IF EXISTS "Produto_empresaId_fkey";
ALTER TABLE "Movimento" DROP CONSTRAINT IF EXISTS "Movimento_empresaId_fkey";
ALTER TABLE "Movimento" DROP CONSTRAINT IF EXISTS "Movimento_usuarioId_fkey";

DROP INDEX IF EXISTS "Usuario_empresaId_email_idx";
DROP INDEX IF EXISTS "Usuario_empresaId_role_idx";
DROP INDEX IF EXISTS "Usuario_empresaId_ativo_idx";
DROP INDEX IF EXISTS "Usuario_empresaId_email_key";
DROP INDEX IF EXISTS "Categoria_empresaId_idx";
DROP INDEX IF EXISTS "Categoria_empresaId_ativo_idx";
DROP INDEX IF EXISTS "Categoria_empresaId_nome_key";
DROP INDEX IF EXISTS "Fornecedor_empresaId_idx";
DROP INDEX IF EXISTS "Fornecedor_empresaId_ativo_idx";
DROP INDEX IF EXISTS "Produto_empresaId_ativo_idx";
DROP INDEX IF EXISTS "Produto_empresaId_categoriaId_quantidade_idx";
DROP INDEX IF EXISTS "Produto_empresaId_fornecedorId_idx";
DROP INDEX IF EXISTS "Produto_empresaId_quantidade_idx";
DROP INDEX IF EXISTS "Produto_empresaId_nome_idx";
DROP INDEX IF EXISTS "Movimento_empresaId_usuarioId_idx";
DROP INDEX IF EXISTS "Movimento_empresaId_produtoId_data_idx";
DROP INDEX IF EXISTS "Movimento_empresaId_data_idx";

-- Migra Usuario (exclusao real sem coluna ativo + organizacaoId + lojaId opcional)
ALTER TABLE "Usuario" ADD COLUMN "organizacaoId" INTEGER,
ADD COLUMN "lojaId" INTEGER;

UPDATE "Usuario"
SET "organizacaoId" = "empresaId",
    "lojaId" = CASE WHEN "role" = 'ADMIN' THEN NULL ELSE "empresaId" END;

ALTER TABLE "Usuario" ALTER COLUMN "organizacaoId" SET NOT NULL;
ALTER TABLE "Usuario" DROP COLUMN "empresaId",
DROP COLUMN "ativo";

CREATE UNIQUE INDEX "Usuario_organizacaoId_email_key" ON "Usuario"("organizacaoId", "email");
CREATE INDEX "Usuario_organizacaoId_email_idx" ON "Usuario"("organizacaoId", "email");
CREATE INDEX "Usuario_organizacaoId_role_idx" ON "Usuario"("organizacaoId", "role");
CREATE INDEX "Usuario_lojaId_idx" ON "Usuario"("lojaId");

ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migra Categoria
ALTER TABLE "Categoria" ADD COLUMN "organizacaoId" INTEGER,
ADD COLUMN "lojaId" INTEGER;

UPDATE "Categoria" SET "organizacaoId" = "empresaId", "lojaId" = "empresaId";

ALTER TABLE "Categoria" ALTER COLUMN "organizacaoId" SET NOT NULL,
ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Categoria" DROP COLUMN "empresaId";

CREATE UNIQUE INDEX "Categoria_lojaId_nome_key" ON "Categoria"("lojaId", "nome");
CREATE INDEX "Categoria_organizacaoId_lojaId_ativo_idx" ON "Categoria"("organizacaoId", "lojaId", "ativo");

ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra Fornecedor
ALTER TABLE "Fornecedor" ADD COLUMN "organizacaoId" INTEGER,
ADD COLUMN "lojaId" INTEGER;

UPDATE "Fornecedor" SET "organizacaoId" = "empresaId", "lojaId" = "empresaId";

ALTER TABLE "Fornecedor" ALTER COLUMN "organizacaoId" SET NOT NULL,
ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Fornecedor" DROP COLUMN "empresaId";

CREATE INDEX "Fornecedor_organizacaoId_lojaId_ativo_idx" ON "Fornecedor"("organizacaoId", "lojaId", "ativo");

ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra Produto
ALTER TABLE "Produto" ADD COLUMN "organizacaoId" INTEGER,
ADD COLUMN "lojaId" INTEGER;

UPDATE "Produto" SET "organizacaoId" = "empresaId", "lojaId" = "empresaId";

ALTER TABLE "Produto" ALTER COLUMN "organizacaoId" SET NOT NULL,
ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Produto" DROP COLUMN "empresaId";

CREATE INDEX "Produto_organizacaoId_lojaId_ativo_idx" ON "Produto"("organizacaoId", "lojaId", "ativo");
CREATE INDEX "Produto_lojaId_categoriaId_quantidade_idx" ON "Produto"("lojaId", "categoriaId", "quantidade");
CREATE INDEX "Produto_lojaId_fornecedorId_idx" ON "Produto"("lojaId", "fornecedorId");
CREATE INDEX "Produto_lojaId_quantidade_idx" ON "Produto"("lojaId", "quantidade");
CREATE INDEX "Produto_lojaId_nome_idx" ON "Produto"("lojaId", "nome");

ALTER TABLE "Produto" ADD CONSTRAINT "Produto_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Pedido e ItemPedido
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "MovimentoTipo" NOT NULL DEFAULT 'VENDA',
    "status" "PedidoStatus" NOT NULL DEFAULT 'CONCLUIDO',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,
    "clienteNome" TEXT,
    "fornecedorId" INTEGER,
    "organizacaoId" INTEGER NOT NULL,
    "lojaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "vendedorRefId" INTEGER NOT NULL,
    "vendedorNomeSnapshot" TEXT NOT NULL,
    "vendedorEmailSnapshot" TEXT NOT NULL,
    "canceladoPorRefId" INTEGER,
    "canceladoPorNome" TEXT,
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemPedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "produtoNomeSnapshot" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pedido_organizacaoId_codigo_key" ON "Pedido"("organizacaoId", "codigo");
CREATE INDEX "Pedido_organizacaoId_lojaId_createdAt_idx" ON "Pedido"("organizacaoId", "lojaId", "createdAt");
CREATE INDEX "Pedido_organizacaoId_vendedorRefId_createdAt_idx" ON "Pedido"("organizacaoId", "vendedorRefId", "createdAt");
CREATE INDEX "Pedido_lojaId_status_tipo_createdAt_idx" ON "Pedido"("lojaId", "status", "tipo", "createdAt");

CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");
CREATE INDEX "ItemPedido_produtoId_idx" ON "ItemPedido"("produtoId");

ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migra Movimento (adicionando snapshot do vendedor, preco unitario, estorno e vinculacao opcional com Pedido)
ALTER TABLE "Movimento" ALTER COLUMN "usuarioId" DROP NOT NULL;

ALTER TABLE "Movimento" ADD COLUMN "organizacaoId" INTEGER,
ADD COLUMN "lojaId" INTEGER,
ADD COLUMN "pedidoId" INTEGER,
ADD COLUMN "estorno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "precoUnitario" DECIMAL(10,2),
ADD COLUMN "valorTotal" DECIMAL(10,2),
ADD COLUMN "vendedorRefId" INTEGER,
ADD COLUMN "vendedorNomeSnapshot" TEXT,
ADD COLUMN "vendedorEmailSnapshot" TEXT;

UPDATE "Movimento" m
SET
  "organizacaoId" = m."empresaId",
  "lojaId" = m."empresaId",
  "precoUnitario" = COALESCE(p."preco", 0),
  "valorTotal" = COALESCE(p."preco", 0) * m."quantidade",
  "vendedorRefId" = COALESCE(m."usuarioId", 0),
  "vendedorNomeSnapshot" = COALESCE((SELECT u."nome" FROM "Usuario" u WHERE u."id" = m."usuarioId"), 'Colaborador'),
  "vendedorEmailSnapshot" = COALESCE((SELECT u."email" FROM "Usuario" u WHERE u."id" = m."usuarioId"), 'historico@estoqueos.com')
FROM "Produto" p
WHERE m."produtoId" = p."id";

UPDATE "Movimento"
SET
  "organizacaoId" = COALESCE("organizacaoId", "empresaId"),
  "lojaId" = COALESCE("lojaId", "empresaId"),
  "precoUnitario" = COALESCE("precoUnitario", 0),
  "valorTotal" = COALESCE("valorTotal", 0),
  "vendedorRefId" = COALESCE("vendedorRefId", "usuarioId", 0),
  "vendedorNomeSnapshot" = COALESCE("vendedorNomeSnapshot", 'Colaborador'),
  "vendedorEmailSnapshot" = COALESCE("vendedorEmailSnapshot", 'historico@estoqueos.com')
WHERE "organizacaoId" IS NULL;

ALTER TABLE "Movimento" ALTER COLUMN "organizacaoId" SET NOT NULL,
ALTER COLUMN "lojaId" SET NOT NULL,
ALTER COLUMN "precoUnitario" SET NOT NULL,
ALTER COLUMN "valorTotal" SET NOT NULL,
ALTER COLUMN "vendedorRefId" SET NOT NULL,
ALTER COLUMN "vendedorNomeSnapshot" SET NOT NULL,
ALTER COLUMN "vendedorEmailSnapshot" SET NOT NULL;

ALTER TABLE "Movimento" DROP COLUMN "empresaId";

CREATE INDEX "Movimento_organizacaoId_lojaId_data_idx" ON "Movimento"("organizacaoId", "lojaId", "data");
CREATE INDEX "Movimento_organizacaoId_vendedorRefId_data_idx" ON "Movimento"("organizacaoId", "vendedorRefId", "data");
CREATE INDEX "Movimento_lojaId_produtoId_data_idx" ON "Movimento"("lojaId", "produtoId", "data");
CREATE INDEX "Movimento_pedidoId_idx" ON "Movimento"("pedidoId");

ALTER TABLE "Movimento" ADD CONSTRAINT "Movimento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Movimento" ADD CONSTRAINT "Movimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Movimento" ADD CONSTRAINT "Movimento_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Movimento" ADD CONSTRAINT "Movimento_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy Empresa table
DROP TABLE "Empresa";
