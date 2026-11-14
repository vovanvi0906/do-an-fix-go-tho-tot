-- DESTRUCTIVE to NEW symptom data only. Disposable test/approved backup-restore only.
-- Operational rollback: turn SYMPTOM_CATALOG_ENABLED=false and keep additive tables.
BEGIN;
DROP TABLE "symptom_services";
DROP TABLE "symptoms";
DROP TABLE "symptom_catalog_audits";
DROP INDEX "services_id_target_key";
DROP TYPE "CatalogReviewStatus";
DROP TYPE "SymptomKind";
COMMIT;
