-- AlterTable Pedido: adiciona campos comprobatórios de pagamento e recebimento
ALTER TABLE "Pedido"
ADD COLUMN "formaPagamento" TEXT,
ADD COLUMN "statusPagamento" TEXT NOT NULL DEFAULT 'PAGO',
ADD COLUMN "comprovanteCodigo" TEXT,
ADD COLUMN "comprovanteUrl" TEXT,
ADD COLUMN "recebidoPor" TEXT;

