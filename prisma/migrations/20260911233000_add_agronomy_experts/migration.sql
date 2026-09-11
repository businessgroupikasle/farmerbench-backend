CREATE TABLE "AgronomyExpert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "territory" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "consultations" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgronomyExpert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AgronomyExpert_name_idx" ON "AgronomyExpert"("name");
CREATE INDEX "AgronomyExpert_territory_idx" ON "AgronomyExpert"("territory");
CREATE INDEX "AgronomyExpert_isActive_idx" ON "AgronomyExpert"("isActive");