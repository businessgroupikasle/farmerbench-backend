CREATE TABLE "PostalCodeLookup" (
  "id" TEXT NOT NULL, "postalCode" TEXT NOT NULL, "city" TEXT NOT NULL,
  "district" TEXT NOT NULL, "state" TEXT NOT NULL, "country" TEXT NOT NULL DEFAULT 'India',
  "postOffice" TEXT, "providerData" JSONB, "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PostalCodeLookup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PostalCodeLookup_postalCode_key" ON "PostalCodeLookup"("postalCode");
CREATE INDEX "PostalCodeLookup_postalCode_idx" ON "PostalCodeLookup"("postalCode");
