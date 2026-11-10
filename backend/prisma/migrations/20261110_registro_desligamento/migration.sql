-- Migração para histórico permanente de colaboradores desligados (RegistroDesligamento)
-- Mantém exclusão física real em Usuario enquanto preserva matrícula cancelada, data de admissão e data de demissão para listagem/filtros em Usuários

CREATE TABLE IF NOT EXISTS "RegistroDesligamento" (
    "id" SERIAL NOT NULL,
    "vendedorRefId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "matricula" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERADOR',
    "lojaId" INTEGER,
    "lojaNome" TEXT,
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "dataDemissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" INTEGER NOT NULL,

    CONSTRAINT "RegistroDesligamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RegistroDesligamento_organizacaoId_vendedorRefId_key" ON "RegistroDesligamento"("organizacaoId", "vendedorRefId");
CREATE INDEX IF NOT EXISTS "RegistroDesligamento_organizacaoId_dataDemissao_idx" ON "RegistroDesligamento"("organizacaoId", "dataDemissao");
CREATE INDEX IF NOT EXISTS "RegistroDesligamento_organizacaoId_matricula_idx" ON "RegistroDesligamento"("organizacaoId", "matricula");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RegistroDesligamento_organizacaoId_fkey'
  ) THEN
    ALTER TABLE "RegistroDesligamento"
    ADD CONSTRAINT "RegistroDesligamento_organizacaoId_fkey"
    FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill seguro de colaboradores já desligados antes desta migração (baseado nos snapshots históricos de Movimento)
INSERT INTO "RegistroDesligamento" (
  "vendedorRefId",
  "nome",
  "email",
  "matricula",
  "role",
  "lojaId",
  "lojaNome",
  "dataAdmissao",
  "dataDemissao",
  "organizacaoId"
)
SELECT
  m."vendedorRefId",
  COALESCE(MAX(m."vendedorNomeSnapshot"), 'Ex-Colaborador #' || m."vendedorRefId"),
  COALESCE(MAX(m."vendedorEmailSnapshot"), 'desligado-' || m."vendedorRefId" || '@historico.local'),
  COALESCE(MAX(m."vendedorMatriculaSnapshot"), 'MAT-' || LPAD(m."vendedorRefId"::text, 5, '0')),
  'OPERADOR'::"Role",
  MAX(m."lojaId"),
  MAX(l."nome"),
  COALESCE(MAX(m."vendedorDataAdmissaoSnapshot"), MIN(m."data")),
  COALESCE(MAX(m."vendedorDataDesligamentoSnapshot"), MAX(m."data")),
  m."organizacaoId"
FROM "Movimento" m
LEFT JOIN "Loja" l ON l."id" = m."lojaId"
LEFT JOIN "Usuario" u ON u."id" = m."vendedorRefId"
WHERE u."id" IS NULL
  AND m."vendedorRefId" IS NOT NULL
GROUP BY m."organizacaoId", m."vendedorRefId"
ON CONFLICT ("organizacaoId", "vendedorRefId") DO NOTHING;

