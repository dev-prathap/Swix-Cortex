/*
  Warnings:

  - Added the required column `datasetId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('UPLOADED', 'PROFILING', 'PROFILED', 'CLEANING_SUGGESTED', 'CLEANED', 'ANALYZED', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "VersionType" AS ENUM ('RAW', 'CLEANED', 'USER_MODIFIED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('SUMMARY', 'TREND', 'COMPARISON', 'ANOMALY', 'FORECAST');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('CLEANING_PREFERENCE', 'COLUMN_RENAME', 'REJECTED_SUGGESTION', 'ACCEPTED_SUGGESTION', 'SEMANTIC_MAPPING', 'QUERY_PATTERN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DataSourceType" ADD VALUE 'SHOPIFY';
ALTER TYPE "DataSourceType" ADD VALUE 'STRIPE';
ALTER TYPE "DataSourceType" ADD VALUE 'WOOCOMMERCE';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "datasetId" TEXT NOT NULL,
ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'pdf',
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'executive',
ALTER COLUMN "visualizations" DROP NOT NULL;

-- CreateTable
CREATE TABLE "sales_data" (
    "id" SERIAL NOT NULL,
    "region" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "sales_amount" DECIMAL(65,30) NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "sales_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "rawFileLocation" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DatasetStatus" NOT NULL DEFAULT 'UPLOADED',
    "syncProgress" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "insightFeed" JSONB,
    "customerSegmentSummary" JSONB,
    "forecastSummary" JSONB,
    "lastProfiledAt" TIMESTAMP(3),
    "lastForecastAt" TIMESTAMP(3),
    "lastAnomalyCheckAt" TIMESTAMP(3),
    "dataSourceId" TEXT,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetVersion" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionType" "VersionType" NOT NULL,
    "fileLocation" TEXT NOT NULL,
    "cleaningActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProfile" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "mainEntity" TEXT NOT NULL,
    "timeColumn" TEXT,
    "metrics" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "dataQualityScore" DOUBLE PRECISION NOT NULL,
    "issues" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "profiledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningPlan" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "suggestedActions" JSONB NOT NULL,
    "userApproved" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "resultingVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleaningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticMapping" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "mappedColumns" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SemanticMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "type" "AnalysisType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "visualizations" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Query" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "naturalLanguage" TEXT NOT NULL,
    "interpretation" JSONB NOT NULL,
    "resultAnalysisId" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Query_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" "MemoryType" NOT NULL,
    "context" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "learnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetRelationship" (
    "id" TEXT NOT NULL,
    "dataset1Id" TEXT NOT NULL,
    "dataset2Id" TEXT NOT NULL,
    "joinKey1" TEXT NOT NULL,
    "joinKey2" TEXT NOT NULL,
    "relationshipType" "RelationType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DatasetRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL DEFAULT 'number',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeEvent" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rfmScore" JSONB NOT NULL,
    "segment" TEXT NOT NULL,
    "churnRisk" JSONB NOT NULL,
    "lifetimeValue" JSONB NOT NULL,
    "behavioralInsights" JSONB,
    "recommendations" TEXT[],
    "lastProfiledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBriefing" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "briefingDate" TIMESTAMP(3) NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "keyMetrics" JSONB NOT NULL,
    "anomalies" TEXT,
    "rawData" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInsight" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "predictedStockoutDays" INTEGER,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataProfile_datasetId_key" ON "DataProfile"("datasetId");

-- CreateIndex
CREATE INDEX "DocumentChunk_datasetId_idx" ON "DocumentChunk"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_datasetId_name_key" ON "MetricDefinition"("datasetId", "name");

-- CreateIndex
CREATE INDEX "RealtimeEvent_dataSourceId_idx" ON "RealtimeEvent"("dataSourceId");

-- CreateIndex
CREATE INDEX "CustomerProfile_datasetId_idx" ON "CustomerProfile"("datasetId");

-- CreateIndex
CREATE INDEX "CustomerProfile_segment_idx" ON "CustomerProfile"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_datasetId_customerId_key" ON "CustomerProfile"("datasetId", "customerId");

-- CreateIndex
CREATE INDEX "DailyBriefing_datasetId_idx" ON "DailyBriefing"("datasetId");

-- CreateIndex
CREATE INDEX "DailyBriefing_briefingDate_idx" ON "DailyBriefing"("briefingDate");

-- CreateIndex
CREATE INDEX "ProductInsight_datasetId_idx" ON "ProductInsight"("datasetId");

-- CreateIndex
CREATE INDEX "ProductInsight_riskLevel_idx" ON "ProductInsight"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInsight_datasetId_productSku_key" ON "ProductInsight"("datasetId", "productSku");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetVersion" ADD CONSTRAINT "DatasetVersion_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProfile" ADD CONSTRAINT "DataProfile_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningPlan" ADD CONSTRAINT "CleaningPlan_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticMapping" ADD CONSTRAINT "SemanticMapping_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Query" ADD CONSTRAINT "Query_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Query" ADD CONSTRAINT "Query_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMemory" ADD CONSTRAINT "UserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetRelationship" ADD CONSTRAINT "DatasetRelationship_dataset1Id_fkey" FOREIGN KEY ("dataset1Id") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetRelationship" ADD CONSTRAINT "DatasetRelationship_dataset2Id_fkey" FOREIGN KEY ("dataset2Id") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDefinition" ADD CONSTRAINT "MetricDefinition_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtimeEvent" ADD CONSTRAINT "RealtimeEvent_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBriefing" ADD CONSTRAINT "DailyBriefing_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInsight" ADD CONSTRAINT "ProductInsight_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
