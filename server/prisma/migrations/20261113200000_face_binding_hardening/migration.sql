-- Atomic hardening: invalid existing data aborts; no auto-repair.
BEGIN;
-- DropForeignKey
ALTER TABLE "biometric_templates" DROP CONSTRAINT "biometric_templates_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_workerId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_sessions" DROP CONSTRAINT "biometric_sessions_templateId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_templateId_fkey";

-- DropForeignKey
ALTER TABLE "biometric_proofs" DROP CONSTRAINT "biometric_proofs_orderId_fkey";

-- AlterTable
ALTER TABLE "biometric_sessions" ALTER COLUMN "reviewId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "biometric_worker_identity_key" ON "worker_profiles"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_review_binding_key" ON "biometric_reviews"("id", "workerId", "epoch");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_template_binding_key" ON "biometric_templates"("id", "workerId", "version", "epoch", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_session_binding_key" ON "biometric_sessions"("id", "workerId", "templateId", "templateVersion", "epoch", "purpose", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_session_order_key" ON "biometric_sessions"("id", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_proof_binding_key" ON "biometric_proofs"("sessionId", "workerId", "templateId", "templateVersion", "epoch", "purpose", "modelVersion");

-- AddForeignKey
ALTER TABLE "biometric_templates" ADD CONSTRAINT "biometric_templates_reviewId_workerId_epoch_fkey" FOREIGN KEY ("reviewId", "workerId", "epoch") REFERENCES "biometric_reviews"("id", "workerId", "epoch") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_workerId_userId_fkey" FOREIGN KEY ("workerId", "userId") REFERENCES "worker_profiles"("id", "userId") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_templateId_workerId_templateVersion_epo_fkey" FOREIGN KEY ("templateId", "workerId", "templateVersion", "epoch", "modelVersion") REFERENCES "biometric_templates"("id", "workerId", "version", "epoch", "modelVersion") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_sessions" ADD CONSTRAINT "biometric_sessions_reviewId_workerId_epoch_fkey" FOREIGN KEY ("reviewId", "workerId", "epoch") REFERENCES "biometric_reviews"("id", "workerId", "epoch") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_sessionId_workerId_templateId_templateVer_fkey" FOREIGN KEY ("sessionId", "workerId", "templateId", "templateVersion", "epoch", "purpose", "modelVersion") REFERENCES "biometric_sessions"("id", "workerId", "templateId", "templateVersion", "epoch", "purpose", "modelVersion") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_templateId_workerId_templateVersion_epoch_fkey" FOREIGN KEY ("templateId", "workerId", "templateVersion", "epoch", "modelVersion") REFERENCES "biometric_templates"("id", "workerId", "version", "epoch", "modelVersion") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_sessionId_orderId_fkey" FOREIGN KEY ("sessionId", "orderId") REFERENCES "biometric_sessions"("id", "orderId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- MATCH SIMPLE would otherwise skip nullable template bindings for non-enrollment sessions.
ALTER TABLE biometric_sessions ADD CONSTRAINT biometric_session_template_required CHECK (
 (purpose = 'ENROLLMENT' AND "templateId" IS NULL) OR
 (purpose IN ('DAILY','ORDER') AND "templateId" IS NOT NULL));
ALTER TABLE biometric_sessions ADD CONSTRAINT biometric_session_terminal_state CHECK (
 (state = 'SUCCEEDED' AND "consumedAt" IS NOT NULL AND "claimId" IS NOT NULL AND attempts > 0) OR
 (state <> 'SUCCEEDED' AND "consumedAt" IS NULL));
ALTER TABLE biometric_templates ADD CONSTRAINT biometric_envelope_shape CHECK (encrypted IS NULL OR
 (jsonb_typeof(encrypted) = 'object' AND encrypted->>'format' = 'sface-aes256gcm-v1' AND
 jsonb_typeof(encrypted->'iv') = 'string' AND jsonb_typeof(encrypted->'tag') = 'string' AND
 jsonb_typeof(encrypted->'ciphertext') = 'string' AND
 encrypted ?& ARRAY['format','iv','tag','ciphertext']) IS TRUE);

CREATE FUNCTION biometric_validate_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM users WHERE id=NEW."reviewerId" AND role='ADMIN' AND status='ACTIVE') OR
    NOT EXISTS (SELECT 1 FROM worker_profiles w JOIN users u ON w."userId"=u.id
      WHERE w.id=NEW."workerId" AND w."approvalStatus"='APPROVED' AND u.role='WORKER' AND u.status='ACTIVE') OR
    NOT EXISTS (SELECT 1 FROM biometric_states WHERE "workerId"=NEW."workerId" AND epoch=NEW.epoch) OR
    NEW."evidenceDigest" !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'BIOMETRIC_REVIEW_AUTHORITY_INVALID';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_review_authority BEFORE INSERT ON biometric_reviews FOR EACH ROW EXECUTE FUNCTION biometric_validate_review();

CREATE FUNCTION biometric_validate_template_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM biometric_states s JOIN biometric_reviews r ON r.id=NEW."reviewId"
   WHERE s."workerId"=NEW."workerId" AND s.epoch=NEW.epoch AND NEW.version=s."lastVersion"+1
   AND s."consentVersion"=NEW."consentVersion" AND s."consentedAt" IS NOT NULL AND s."withdrawnAt" IS NULL
   AND r."workerId"=s."workerId" AND r.epoch=s.epoch AND r."revokedAt" IS NULL AND r."expiresAt">clock_timestamp()) THEN
   RAISE EXCEPTION 'BIOMETRIC_TEMPLATE_AUTHORITY_INVALID';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_template_authority BEFORE INSERT ON biometric_templates FOR EACH ROW EXECUTE FUNCTION biometric_validate_template_insert();

CREATE FUNCTION biometric_session_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW."workerId",NEW."userId",NEW.purpose,NEW."orderId",NEW."requestKey",NEW.epoch,NEW."templateId",NEW."templateVersion",NEW."modelVersion",NEW."reviewId",NEW."nonceHash",NEW."createdAt",NEW."expiresAt") IS DISTINCT FROM
    (OLD.id,OLD."workerId",OLD."userId",OLD.purpose,OLD."orderId",OLD."requestKey",OLD.epoch,OLD."templateId",OLD."templateVersion",OLD."modelVersion",OLD."reviewId",OLD."nonceHash",OLD."createdAt",OLD."expiresAt") OR
    NEW.attempts < OLD.attempts OR
    (OLD.state IN ('SUCCEEDED','REVOKED') AND (NEW.state,NEW."consumedAt",NEW.attempts,NEW."captureDigest",NEW."claimId") IS DISTINCT FROM (OLD.state,OLD."consumedAt",OLD.attempts,OLD."captureDigest",OLD."claimId")) THEN
   RAISE EXCEPTION 'BIOMETRIC_SESSION_IMMUTABLE';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_session_immutable BEFORE UPDATE ON biometric_sessions FOR EACH ROW EXECUTE FUNCTION biometric_session_immutable();

CREATE FUNCTION biometric_proof_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.purpose='ORDER' THEN
     PERFORM id FROM orders WHERE id=NEW."orderId" AND "workerId"=NEW."workerId" AND status='ARRIVED' FOR SHARE;
     IF NOT FOUND THEN RAISE EXCEPTION 'BIOMETRIC_ORDER_AUTHORITY_INVALID'; END IF;
   END IF;
   IF NOT EXISTS (SELECT 1 FROM biometric_sessions s JOIN biometric_templates t ON t.id=NEW."templateId"
     JOIN biometric_states st ON st."workerId"=NEW."workerId"
     WHERE s.id=NEW."sessionId" AND s.state='SUCCEEDED' AND s."consumedAt" IS NOT NULL AND NEW."issuedAt">=s."consumedAt" AND NEW."issuedAt"<s."expiresAt"
     AND t."workerId"=st."workerId" AND t.epoch=st.epoch AND t.version=st."lastVersion"
     AND NEW.epoch=st.epoch AND t."revokedAt" IS NULL AND t."deletedAt" IS NULL
     AND st."consentVersion" IS NOT NULL AND st."consentedAt" IS NOT NULL AND st."withdrawnAt" IS NULL) THEN
      RAISE EXCEPTION 'BIOMETRIC_PROOF_AUTHORITY_INVALID';
   END IF;
 ELSE
   IF (NEW.id,NEW."sessionId",NEW."workerId",NEW."templateId",NEW."templateVersion",NEW.epoch,NEW.purpose,NEW."orderId",NEW."modelVersion",NEW."padModelVersion",NEW."policyVersion",NEW."identityScore",NEW."issuedAt",NEW."expiresAt") IS DISTINCT FROM
      (OLD.id,OLD."sessionId",OLD."workerId",OLD."templateId",OLD."templateVersion",OLD.epoch,OLD.purpose,OLD."orderId",OLD."modelVersion",OLD."padModelVersion",OLD."policyVersion",OLD."identityScore",OLD."issuedAt",OLD."expiresAt") OR
      (OLD."consumedAt" IS NOT NULL AND NEW."consumedAt" IS DISTINCT FROM OLD."consumedAt") OR
      (OLD."revokedAt" IS NOT NULL AND NEW."revokedAt" IS DISTINCT FROM OLD."revokedAt") THEN
      RAISE EXCEPTION 'BIOMETRIC_PROOF_IMMUTABLE';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_proof_guard BEFORE INSERT OR UPDATE ON biometric_proofs FOR EACH ROW EXECUTE FUNCTION biometric_proof_guard();

CREATE FUNCTION biometric_state_monotonic() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."workerId" IS DISTINCT FROM OLD."workerId" OR NEW.epoch<OLD.epoch OR NEW."lastVersion"<OLD."lastVersion" THEN
   RAISE EXCEPTION 'BIOMETRIC_STATE_REGRESSION';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_state_monotonic BEFORE UPDATE ON biometric_states FOR EACH ROW EXECUTE FUNCTION biometric_state_monotonic();

CREATE FUNCTION biometric_validate_session_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM biometric_states st JOIN biometric_reviews r ON r.id=NEW."reviewId"
   JOIN worker_profiles w ON w.id=st."workerId" JOIN users u ON u.id=w."userId"
   WHERE st."workerId"=NEW."workerId" AND st.epoch=NEW.epoch AND st."withdrawnAt" IS NULL
   AND st."consentedAt" IS NOT NULL AND st."consentVersion" IS NOT NULL
   AND r."workerId"=st."workerId" AND r.epoch=st.epoch AND r."revokedAt" IS NULL AND r."expiresAt">clock_timestamp()
   AND w."userId"=NEW."userId" AND w."approvalStatus"='APPROVED' AND u.role='WORKER' AND u.status='ACTIVE') THEN
   RAISE EXCEPTION 'BIOMETRIC_SESSION_AUTHORITY_INVALID';
 END IF;
 IF NEW.purpose='ORDER' THEN
   PERFORM id FROM orders WHERE id=NEW."orderId" AND "workerId"=NEW."workerId" AND status='ARRIVED' FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'BIOMETRIC_ORDER_AUTHORITY_INVALID'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_session_authority BEFORE INSERT ON biometric_sessions FOR EACH ROW EXECUTE FUNCTION biometric_validate_session_insert();

COMMIT;
