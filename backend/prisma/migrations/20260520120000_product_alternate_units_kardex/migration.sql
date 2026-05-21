-- Unidades alternas con factor a base, kardex operativo y compras por unidad

CREATE TABLE "product_alternate_units" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitOfMeasureId" TEXT NOT NULL,
    "factorToBase" DECIMAL(14,6) NOT NULL,
    "label" VARCHAR(64),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_alternate_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_alternate_units_productId_unitOfMeasureId_key"
  ON "product_alternate_units"("productId", "unitOfMeasureId");

ALTER TABLE "product_alternate_units"
  ADD CONSTRAINT "product_alternate_units_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_alternate_units"
  ADD CONSTRAINT "product_alternate_units_unitOfMeasureId_fkey"
  FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrar contentPerUnit/contentUnitId → factorToBase = 1/contentPerUnit
INSERT INTO "product_alternate_units" ("id", "productId", "unitOfMeasureId", "factorToBase", "sortOrder")
SELECT
  gen_random_uuid()::text,
  p."id",
  p."contentUnitId",
  ROUND((1 / p."contentPerUnit")::numeric, 6),
  1
FROM "products" p
WHERE p."contentUnitId" IS NOT NULL
  AND p."contentPerUnit" IS NOT NULL
  AND p."contentPerUnit" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "product_alternate_units" a
    WHERE a."productId" = p."id" AND a."unitOfMeasureId" = p."contentUnitId"
  );

ALTER TABLE "kardex_entries" ADD COLUMN "operationalQuantity" DECIMAL(14,4);
ALTER TABLE "kardex_entries" ADD COLUMN "operationalUnitId" TEXT;
ALTER TABLE "kardex_entries" ADD COLUMN "conversionFactor" DECIMAL(14,6);

ALTER TABLE "kardex_entries"
  ADD CONSTRAINT "kardex_entries_operationalUnitId_fkey"
  FOREIGN KEY ("operationalUnitId") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_items" ADD COLUMN "baseQuantity" DECIMAL(14,4);
ALTER TABLE "purchase_items" ADD COLUMN "purchaseUnitId" TEXT;

UPDATE "purchase_items" SET "baseQuantity" = "quantity" WHERE "baseQuantity" IS NULL;

ALTER TABLE "purchase_items" ALTER COLUMN "baseQuantity" SET NOT NULL;

ALTER TABLE "purchase_items"
  ADD CONSTRAINT "purchase_items_purchaseUnitId_fkey"
  FOREIGN KEY ("purchaseUnitId") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
