-- CreateTable
CREATE TABLE "WebsiteFormLead" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "formName" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "fields" JSONB NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteFormLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteFormLead_source_idx" ON "WebsiteFormLead"("source");

-- CreateIndex
CREATE INDEX "WebsiteFormLead_email_idx" ON "WebsiteFormLead"("email");

-- CreateIndex
CREATE INDEX "WebsiteFormLead_phone_idx" ON "WebsiteFormLead"("phone");

-- CreateIndex
CREATE INDEX "WebsiteFormLead_createdAt_idx" ON "WebsiteFormLead"("createdAt");
