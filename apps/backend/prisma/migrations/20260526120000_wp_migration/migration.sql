-- WordPress migration: SitePage + BlogPost fields

-- AlterTable BlogPost: remove unique on title, add wp fields
ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_title_key";

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "wpId" INTEGER;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_wpId_key" ON "BlogPost"("wpId");

-- CreateTable SitePage
CREATE TABLE IF NOT EXISTS "SitePage" (
    "id" TEXT NOT NULL,
    "wpId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "keywords" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SitePage_wpId_key" ON "SitePage"("wpId");
CREATE UNIQUE INDEX IF NOT EXISTS "SitePage_slug_key" ON "SitePage"("slug");
CREATE INDEX IF NOT EXISTS "SitePage_slug_idx" ON "SitePage"("slug");
CREATE INDEX IF NOT EXISTS "SitePage_published_idx" ON "SitePage"("published");
