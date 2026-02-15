-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'diagnostic_scheduled';
ALTER TYPE "JobStatus" ADD VALUE 'diagnostic_completed';
ALTER TYPE "JobStatus" ADD VALUE 'repair_pending_approval';
ALTER TYPE "JobStatus" ADD VALUE 'repair_approved';

-- AlterTable
ALTER TABLE "JobRequest" ADD COLUMN     "diagnosticPaymentIntentId" TEXT,
ADD COLUMN     "repairPaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "ServiceProviderProfile" ADD COLUMN     "cancellationRate" DECIMAL(5,2),
ADD COLUMN     "completionRate" DECIMAL(5,2),
ADD COLUMN     "diagnosticFee" DECIMAL(10,2),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reliabilityScore" DECIMAL(5,2),
ADD COLUMN     "responseTimeAvg" INTEGER;

-- CreateTable
CREATE TABLE "RepairQuote" (
    "id" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "laborCost" DECIMAL(10,2) NOT NULL,
    "partsCost" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepairQuote_jobRequestId_key" ON "RepairQuote"("jobRequestId");

-- CreateIndex
CREATE INDEX "RepairQuote_jobRequestId_idx" ON "RepairQuote"("jobRequestId");

-- CreateIndex
CREATE INDEX "RepairQuote_providerId_idx" ON "RepairQuote"("providerId");

-- AddForeignKey
ALTER TABLE "RepairQuote" ADD CONSTRAINT "RepairQuote_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairQuote" ADD CONSTRAINT "RepairQuote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
