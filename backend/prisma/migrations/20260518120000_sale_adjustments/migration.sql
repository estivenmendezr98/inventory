-- CreateEnum
CREATE TYPE "SaleAdjustmentAction" AS ENUM ('ADD', 'REMOVE');

-- CreateTable
CREATE TABLE "sale_adjustments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "cashSessionId" TEXT,
    "reason" TEXT NOT NULL,
    "totalBefore" DECIMAL(12,2) NOT NULL,
    "totalAfter" DECIMAL(12,2) NOT NULL,
    "cashDelta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_adjustment_lines" (
    "id" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "action" "SaleAdjustmentAction" NOT NULL,
    "productId" TEXT NOT NULL,
    "saleItemId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "lineSubtotal" DECIMAL(12,2),

    CONSTRAINT "sale_adjustment_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_adjustments_saleId_idx" ON "sale_adjustments"("saleId");

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustment_lines" ADD CONSTRAINT "sale_adjustment_lines_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "sale_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustment_lines" ADD CONSTRAINT "sale_adjustment_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
