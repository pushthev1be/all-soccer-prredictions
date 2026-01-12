-- CreateTable
CREATE TABLE "fixtures" (
    "id" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "venue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'web-scraper',
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixtures_competition_idx" ON "fixtures"("competition");

-- CreateIndex
CREATE INDEX "fixtures_kickoff_idx" ON "fixtures"("kickoff");

-- CreateIndex
CREATE INDEX "fixtures_homeTeam_idx" ON "fixtures"("homeTeam");

-- CreateIndex
CREATE INDEX "fixtures_awayTeam_idx" ON "fixtures"("awayTeam");
