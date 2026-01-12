-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "formAnalysis" JSONB,
ADD COLUMN     "headToHeadStats" JSONB,
ADD COLUMN     "injuryNews" TEXT[],
ADD COLUMN     "marketInsight" JSONB,
ADD COLUMN     "tacticalAnalysis" TEXT[],
ADD COLUMN     "teamComparison" JSONB;
