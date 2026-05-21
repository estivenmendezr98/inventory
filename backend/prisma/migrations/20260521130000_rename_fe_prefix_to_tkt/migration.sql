-- Comprobantes locales: reemplazar prefijo FE por TKT en datos existentes.
UPDATE "invoice_numbering" SET "prefix" = 'TKT' WHERE "prefix" = 'FE';
UPDATE "invoices" SET "prefix" = 'TKT' WHERE "prefix" = 'FE';
