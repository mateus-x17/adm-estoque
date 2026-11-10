-- CreateEnum
CREATE TYPE "SituacaoFuncionario" AS ENUM ('ATIVO', 'SUSPENSO', 'FERIAS');

-- AlterTable Usuario: matricula unica gerada pelo ID, telefone, situacao trabalhista e data de admissao
ALTER TABLE "Usuario"
ADD COLUMN "matricula" TEXT,
ADD COLUMN "telefone" TEXT,
ADD COLUMN "situacao" "SituacaoFuncionario" NOT NULL DEFAULT 'ATIVO',
ADD COLUMN "dataAdmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Usuario"
SET "matricula" = 'MAT-' || LPAD("id"::text, 5, '0'),
    "dataAdmissao" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "matricula" IS NULL;

CREATE UNIQUE INDEX "Usuario_matricula_key" ON "Usuario"("matricula");
CREATE INDEX "Usuario_organizacaoId_situacao_idx" ON "Usuario"("organizacaoId", "situacao");
CREATE INDEX "Usuario_matricula_idx" ON "Usuario"("matricula");

-- AlterTable Pedido: snapshots de matricula e periodo trabalhado (inicio/termino) para auditoria pos-desligamento
ALTER TABLE "Pedido"
ADD COLUMN "vendedorMatriculaSnapshot" TEXT,
ADD COLUMN "vendedorDataAdmissaoSnapshot" TIMESTAMP(3),
ADD COLUMN "vendedorDataDesligamentoSnapshot" TIMESTAMP(3);

UPDATE "Pedido"
SET "vendedorMatriculaSnapshot" = 'MAT-' || LPAD("vendedorRefId"::text, 5, '0')
WHERE "vendedorMatriculaSnapshot" IS NULL AND "vendedorRefId" > 0;

-- AlterTable Movimento: snapshots de matricula e periodo trabalhado (inicio/termino)
ALTER TABLE "Movimento"
ADD COLUMN "vendedorMatriculaSnapshot" TEXT,
ADD COLUMN "vendedorDataAdmissaoSnapshot" TIMESTAMP(3),
ADD COLUMN "vendedorDataDesligamentoSnapshot" TIMESTAMP(3);

UPDATE "Movimento"
SET "vendedorMatriculaSnapshot" = 'MAT-' || LPAD("vendedorRefId"::text, 5, '0')
WHERE "vendedorMatriculaSnapshot" IS NULL AND "vendedorRefId" > 0;

