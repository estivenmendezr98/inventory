-- Unidades de medida y cantidades decimales para productos medidos (m, L, g, etc.)

CREATE TYPE "UnitCategory" AS ENUM ('COUNT', 'LENGTH', 'VOLUME', 'WEIGHT', 'AREA');

CREATE TABLE "units_of_measure" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "category" "UnitCategory" NOT NULL,
    "allowsDecimals" BOOLEAN NOT NULL DEFAULT false,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "units_of_measure_code_key" ON "units_of_measure"("code");

INSERT INTO "units_of_measure" ("id", "code", "name", "symbol", "category", "allowsDecimals", "decimalPlaces", "sortOrder", "isActive", "updatedAt") VALUES
  ('uom-un', 'UN', 'Unidad / pieza', 'und', 'COUNT', false, 0, 10, true, CURRENT_TIMESTAMP),
  ('uom-par', 'PAR', 'Par', 'par', 'COUNT', false, 0, 11, true, CURRENT_TIMESTAMP),
  ('uom-cj', 'CJ', 'Caja', 'cja', 'COUNT', false, 0, 12, true, CURRENT_TIMESTAMP),
  ('uom-kg', 'KG', 'Kilogramo', 'kg', 'WEIGHT', true, 3, 20, true, CURRENT_TIMESTAMP),
  ('uom-g', 'G', 'Gramo', 'g', 'WEIGHT', true, 2, 21, true, CURRENT_TIMESTAMP),
  ('uom-lb', 'LB', 'Libra', 'lb', 'WEIGHT', true, 3, 22, true, CURRENT_TIMESTAMP),
  ('uom-l', 'L', 'Litro', 'L', 'VOLUME', true, 3, 30, true, CURRENT_TIMESTAMP),
  ('uom-ml', 'ML', 'Mililitro', 'mL', 'VOLUME', true, 2, 31, true, CURRENT_TIMESTAMP),
  ('uom-m', 'M', 'Metro', 'm', 'LENGTH', true, 3, 40, true, CURRENT_TIMESTAMP),
  ('uom-cm', 'CM', 'Centímetro', 'cm', 'LENGTH', true, 2, 41, true, CURRENT_TIMESTAMP),
  ('uom-mm', 'MM', 'Milímetro', 'mm', 'LENGTH', true, 1, 42, true, CURRENT_TIMESTAMP),
  ('uom-m2', 'M2', 'Metro cuadrado', 'm²', 'AREA', true, 3, 50, true, CURRENT_TIMESTAMP);

ALTER TABLE "products" ADD COLUMN "unitOfMeasureId" TEXT;

UPDATE "products" SET "unitOfMeasureId" = 'uom-un' WHERE "unitOfMeasureId" IS NULL;

ALTER TABLE "products" ALTER COLUMN "unitOfMeasureId" SET NOT NULL;

ALTER TABLE "products" ADD CONSTRAINT "products_unitOfMeasureId_fkey"
  FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products" ALTER COLUMN "minStock" TYPE DECIMAL(14,4) USING "minStock"::decimal;
ALTER TABLE "products" ALTER COLUMN "maxStock" TYPE DECIMAL(14,4) USING "maxStock"::decimal;

ALTER TABLE "inventory" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING "quantity"::decimal;
ALTER TABLE "inventory" ALTER COLUMN "reservedQty" TYPE DECIMAL(14,4) USING "reservedQty"::decimal;

ALTER TABLE "kardex_entries" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING "quantity"::decimal;
ALTER TABLE "kardex_entries" ALTER COLUMN "previousStock" TYPE DECIMAL(14,4) USING "previousStock"::decimal;
ALTER TABLE "kardex_entries" ALTER COLUMN "newStock" TYPE DECIMAL(14,4) USING "newStock"::decimal;

ALTER TABLE "inventory_adjustments" ALTER COLUMN "previousQty" TYPE DECIMAL(14,4) USING "previousQty"::decimal;
ALTER TABLE "inventory_adjustments" ALTER COLUMN "newQty" TYPE DECIMAL(14,4) USING "newQty"::decimal;

ALTER TABLE "purchase_items" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING "quantity"::decimal;
ALTER TABLE "sale_items" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING "quantity"::decimal;
ALTER TABLE "sale_adjustment_lines" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING "quantity"::decimal;
