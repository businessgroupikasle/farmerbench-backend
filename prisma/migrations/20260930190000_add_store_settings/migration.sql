CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'store',
    "standardShippingFee" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);