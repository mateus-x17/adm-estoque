-- Migration: Alter MovimentoTipo from ENTRADA/SAIDA to REPOSICAO/VENDA

-- Create new enum
CREATE TYPE "MovimentoTipo_new" AS ENUM ('REPOSICAO', 'VENDA');

-- Alter table column to use new enum with mapping
ALTER TABLE "Movimento" 
  ALTER COLUMN "tipo" TYPE "MovimentoTipo_new" 
  USING (
    CASE "tipo"::text
      WHEN 'ENTRADA' THEN 'REPOSICAO'::"MovimentoTipo_new"
      WHEN 'SAIDA' THEN 'VENDA'::"MovimentoTipo_new"
      WHEN 'REPOSICAO' THEN 'REPOSICAO'::"MovimentoTipo_new"
      WHEN 'VENDA' THEN 'VENDA'::"MovimentoTipo_new"
      ELSE 'REPOSICAO'::"MovimentoTipo_new"
    END
  );

-- Drop old enum and rename new enum
DROP TYPE IF EXISTS "MovimentoTipo";
ALTER TYPE "MovimentoTipo_new" RENAME TO "MovimentoTipo";
