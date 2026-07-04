ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "receiptTitle" TEXT NOT NULL DEFAULT 'FICHA TÉCNICA';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "receiptTagline" TEXT DEFAULT 'Centro de Servicio Técnico';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "warrantyText" TEXT NOT NULL DEFAULT 'Este servicio técnico cuenta con una garantía de 30 días en mano de obra a partir de la fecha de entrega. Los repuestos instalados cubren la garantía otorgada por el fabricante. La garantía no cubre daños por mal uso, golpes, humedad o manipulación por terceros no autorizados.';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "invoicePrefix" TEXT NOT NULL DEFAULT 'REP-';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "defaultWarrantyDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
