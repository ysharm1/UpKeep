-- CreateEnum
CREATE TYPE "DiagnosticRecommendation" AS ENUM ('REPAIR', 'REPLACE', 'MONITOR', 'NO_ACTION_NEEDED');

-- CreateEnum
CREATE TYPE "DiagnosticSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "DiagnosticReport" (
    "id" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendation" "DiagnosticRecommendation" NOT NULL,
    "severity" "DiagnosticSeverity",
    "estimatedCost" TEXT,
    "photoUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticReport_jobRequestId_key" ON "DiagnosticReport"("jobRequestId");

-- CreateIndex
CREATE INDEX "DiagnosticReport_jobRequestId_idx" ON "DiagnosticReport"("jobRequestId");

-- CreateIndex
CREATE INDEX "DiagnosticReport_providerId_idx" ON "DiagnosticReport"("providerId");

-- AddForeignKey
ALTER TABLE "DiagnosticReport" ADD CONSTRAINT "DiagnosticReport_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
