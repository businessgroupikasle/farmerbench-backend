ALTER TABLE "ServiceBooking" ADD COLUMN "details" JSONB, ADD COLUMN "attachments" JSONB;
ALTER TABLE "StoreSettings" ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maintenanceMessage" TEXT NOT NULL DEFAULT 'We are making improvements. Please check back soon.';
