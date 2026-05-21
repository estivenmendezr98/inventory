-- Factura reactivada tras ajuste de venta (anulación previa + corrección de totales).
ALTER TYPE "InvoiceStatus" ADD VALUE 'ACTIVE_ADJUSTED';
