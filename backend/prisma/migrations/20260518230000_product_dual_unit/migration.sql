-- Unidad de inventario + contenido por unidad (ej. 1 tubo = 30 cm) y venta en unidad alternativa

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "contentPerUnit" DECIMAL(14,4);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "contentUnitId" TEXT;

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_contentUnitId_fkey";
ALTER TABLE "products" ADD CONSTRAINT "products_contentUnitId_fkey"
  FOREIGN KEY ("contentUnitId") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "saleUnitId" TEXT;
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "baseQuantity" DECIMAL(14,4);

UPDATE "sale_items" si
SET
  "saleUnitId" = p."unitOfMeasureId",
  "baseQuantity" = si."quantity"
FROM "products" p
WHERE p.id = si."productId" AND si."baseQuantity" IS NULL;

ALTER TABLE "sale_items" ALTER COLUMN "baseQuantity" SET NOT NULL;

ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_saleUnitId_fkey";
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleUnitId_fkey"
  FOREIGN KEY ("saleUnitId") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
