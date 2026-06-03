-- SitePage navigation placement (Payload CMS → frontend menu)

ALTER TABLE "SitePage" ADD COLUMN IF NOT EXISTS "navEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SitePage" ADD COLUMN IF NOT EXISTS "navSection" TEXT;
ALTER TABLE "SitePage" ADD COLUMN IF NOT EXISTS "navParent" TEXT;
ALTER TABLE "SitePage" ADD COLUMN IF NOT EXISTS "navLabel" TEXT;
ALTER TABLE "SitePage" ADD COLUMN IF NOT EXISTS "navSortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "SitePage_navEnabled_navSection_idx" ON "SitePage"("navEnabled", "navSection");
