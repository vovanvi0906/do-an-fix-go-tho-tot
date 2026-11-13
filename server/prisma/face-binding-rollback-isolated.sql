-- Disposable isolated test ONLY. Roll back v3 DDL to v2, retaining records. Never run on project DB.
BEGIN;
DROP TRIGGER biometric_session_authority ON biometric_sessions;
DROP FUNCTION biometric_validate_session_insert();
DROP TRIGGER biometric_review_authority ON biometric_reviews;
DROP TRIGGER biometric_template_authority ON biometric_templates;
DROP TRIGGER biometric_session_immutable ON biometric_sessions;
DROP TRIGGER biometric_proof_guard ON biometric_proofs;
DROP TRIGGER biometric_state_monotonic ON biometric_states;
DROP FUNCTION biometric_validate_review();
DROP FUNCTION biometric_validate_template_insert();
DROP FUNCTION biometric_session_immutable();
DROP FUNCTION biometric_proof_guard();
DROP FUNCTION biometric_state_monotonic();
ALTER TABLE biometric_sessions DROP CONSTRAINT biometric_session_template_required, DROP CONSTRAINT biometric_session_terminal_state;
ALTER TABLE biometric_templates DROP CONSTRAINT biometric_envelope_shape;
-- DropForeignKey
ALTER TABLE "biometric_templates" DROP CONSTRAINT "biometric_templates_reviewId_workerId_epoch_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_workerId_userId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_templateId_workerId_templateVersion_epo_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_reviewId_workerId_epoch_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_sessionId_workerId_templateId_templateVer_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_templateId_workerId_templateVersion_epoch_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_orderId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_sessionId_orderId_fkey";

-- DropIndex
DROP INDEX "biometric_worker_identity_key";

-- DropIndex
DROP INDEX "biometric_review_binding_key";

-- DropIndex
DROP INDEX "biometric_template_binding_key";

-- DropIndex
DROP INDEX "biometric_session_binding_key";

-- DropIndex
DROP INDEX "biometric_session_order_key";

-- DropIndex
DROP INDEX "biometric_proof_binding_key";

-- AlterTable
ALTER TABLE "biometric_sessions" ALTER COLUMN "reviewId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "biometric_templates" ADD CONSTRAINT "biometric_templates_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "biometric_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "biometric_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "biometric_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "biometric_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;


COMMIT;
