ALTER TABLE "OrderItem"
ADD COLUMN "variantId" TEXT,
ADD COLUMN "selectedAttributes" JSONB;

ALTER TABLE "Payment"
ADD COLUMN "razorpayOrderId" TEXT,
ADD COLUMN "razorpayPaymentId" TEXT;

CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
