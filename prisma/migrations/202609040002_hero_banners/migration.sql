CREATE TYPE "HeroPage" AS ENUM ('HOME', 'ABOUT', 'SERVICES', 'PRODUCTS');

CREATE TABLE "HeroBanner" (
  "id" TEXT NOT NULL,
  "page" "HeroPage" NOT NULL,
  "title" TEXT NOT NULL,
  "highlightedText" TEXT,
  "eyebrow" TEXT,
  "description" TEXT,
  "desktopImage" TEXT NOT NULL,
  "mobileImage" TEXT,
  "imageAlt" TEXT,
  "primaryButtonText" TEXT,
  "primaryButtonLink" TEXT,
  "secondaryButtonText" TEXT,
  "secondaryButtonLink" TEXT,
  "textAlignment" TEXT NOT NULL DEFAULT 'left',
  "overlayColor" TEXT NOT NULL DEFAULT '#000000',
  "overlayOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "autoplayDuration" INTEGER NOT NULL DEFAULT 5000,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroBanner_page_isActive_sortOrder_idx" ON "HeroBanner"("page", "isActive", "sortOrder");
CREATE INDEX "HeroBanner_startsAt_endsAt_idx" ON "HeroBanner"("startsAt", "endsAt");
