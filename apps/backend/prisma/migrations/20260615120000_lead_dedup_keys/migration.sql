-- Dedup keys for website leads (same email + phone = one enquiry)
ALTER TABLE "WebsiteFormLead" ADD COLUMN IF NOT EXISTS "emailKey" TEXT;
ALTER TABLE "WebsiteFormLead" ADD COLUMN IF NOT EXISTS "phoneKey" TEXT;

CREATE INDEX IF NOT EXISTS "WebsiteFormLead_emailKey_phoneKey_idx" ON "WebsiteFormLead"("emailKey", "phoneKey");

CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteFormLead_emailKey_phoneKey_unique"
ON "WebsiteFormLead"("emailKey", "phoneKey")
WHERE "emailKey" IS NOT NULL AND "phoneKey" IS NOT NULL;
