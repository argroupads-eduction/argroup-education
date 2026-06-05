-- Payload CMS globals (header, footer, site-settings) synced to Neon

CREATE TABLE "SiteGlobal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteGlobal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiteGlobal_slug_key" ON "SiteGlobal"("slug");
CREATE INDEX "SiteGlobal_slug_idx" ON "SiteGlobal"("slug");
