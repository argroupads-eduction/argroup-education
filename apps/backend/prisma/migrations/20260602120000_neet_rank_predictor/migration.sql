-- CreateTable (idempotent — safe if a prior deploy partially applied this migration)
CREATE TABLE IF NOT EXISTS "NeetRankPredictorSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "bestRank" INTEGER NOT NULL,
    "expectedRank" INTEGER NOT NULL,
    "worstRank" INTEGER NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "collegeChances" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeetRankPredictorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NeetRankPredictorSubmission_phone_idx" ON "NeetRankPredictorSubmission"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NeetRankPredictorSubmission_createdAt_idx" ON "NeetRankPredictorSubmission"("createdAt");
