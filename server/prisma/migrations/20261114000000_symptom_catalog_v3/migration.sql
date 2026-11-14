-- Additive migration. Execute only after review; disposable validation required.
BEGIN;
-- CreateEnum
CREATE TYPE "SymptomKind" AS ENUM ('VISUAL_OBSERVABLE', 'USER_REPORTED', 'REQUIRES_TECHNICIAN_CHECK');

-- CreateEnum
CREATE TYPE "CatalogReviewStatus" AS ENUM ('NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "symptoms" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kind" "SymptomKind" NOT NULL DEFAULT 'USER_REPORTED',
    "reviewStatus" "CatalogReviewStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_services" (
    "symptomId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "reviewStatus" "CatalogReviewStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_services_pkey" PRIMARY KEY ("symptomId","serviceId")
);

-- CreateTable
CREATE TABLE "symptom_catalog_audits" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_catalog_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "symptoms_targetId_isActive_sortOrder_idx" ON "symptoms"("targetId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_targetId_code_key" ON "symptoms"("targetId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_id_target_key" ON "symptoms"("id", "targetId");

-- CreateIndex
CREATE INDEX "symptom_services_targetId_isActive_priority_idx" ON "symptom_services"("targetId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "symptom_catalog_audits_entityId_createdAt_idx" ON "symptom_catalog_audits"("entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "services_id_target_key" ON "services"("id", "targetId");

-- AddForeignKey
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "service_targets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_symptomId_targetId_fkey" FOREIGN KEY ("symptomId", "targetId") REFERENCES "symptoms"("id", "targetId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_serviceId_targetId_fkey" FOREIGN KEY ("serviceId", "targetId") REFERENCES "services"("id", "targetId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Active records must have explicit human approval. Range checks defend direct SQL too.
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_review_active_check" CHECK (NOT "isActive" OR "reviewStatus" = 'APPROVED');
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_sort_order_check" CHECK ("sortOrder" >= 0 AND "sortOrder" <= 100000);
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_review_active_check" CHECK (NOT "isActive" OR "reviewStatus" = 'APPROVED');
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_priority_check" CHECK ("priority" >= 0 AND "priority" <= 100000);
COMMIT;
