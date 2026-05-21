-- Presentación o detalle de medida del producto (ej. "500 mL", "rollo 50 m")
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "measureDetail" VARCHAR(255);
