CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discountType" "DiscountType" NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "minimumSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "validUntil" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_active_validUntil_idx" ON "Coupon"("active", "validUntil");

ALTER TABLE "Order"
ADD COLUMN "discountPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "couponCode" TEXT,
ADD COLUMN "couponRedeemed" BOOLEAN NOT NULL DEFAULT false;
