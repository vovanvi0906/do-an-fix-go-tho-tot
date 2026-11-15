-- New enrollment is authorized by the authenticated worker and consent, not a manual review.
-- Historical reviews/attribution and existing foreign keys remain intact.
BEGIN;
ALTER TABLE biometric_templates ALTER COLUMN "reviewId" DROP NOT NULL;
ALTER TABLE biometric_sessions ALTER COLUMN "reviewId" DROP NOT NULL;

CREATE OR REPLACE FUNCTION biometric_validate_template_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."reviewId" IS NOT NULL OR NOT EXISTS (
   SELECT 1 FROM biometric_states s
   JOIN worker_profiles w ON w.id=s."workerId"
   JOIN users u ON u.id=w."userId"
   WHERE s."workerId"=NEW."workerId" AND s.epoch=NEW.epoch
   AND NEW.version=s."lastVersion"+1
   AND s."consentVersion"=NEW."consentVersion" AND s."consentedAt" IS NOT NULL
   AND s."withdrawnAt" IS NULL AND w."approvalStatus"='APPROVED'
   AND u.role='WORKER' AND u.status='ACTIVE'
 ) OR EXISTS (
   SELECT 1 FROM biometric_templates t WHERE t."workerId"=NEW."workerId"
   AND t.epoch=NEW.epoch AND t."revokedAt" IS NULL AND t."deletedAt" IS NULL
 ) THEN
   RAISE EXCEPTION 'BIOMETRIC_TEMPLATE_AUTHORITY_INVALID';
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION biometric_validate_session_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."reviewId" IS NOT NULL OR NOT EXISTS (
   SELECT 1 FROM biometric_states st
   JOIN worker_profiles w ON w.id=st."workerId" JOIN users u ON u.id=w."userId"
   WHERE st."workerId"=NEW."workerId" AND st.epoch=NEW.epoch
   AND st."withdrawnAt" IS NULL AND st."consentedAt" IS NOT NULL
   AND st."consentVersion" IS NOT NULL AND w."userId"=NEW."userId"
   AND w."approvalStatus"='APPROVED' AND u.role='WORKER' AND u.status='ACTIVE'
 ) THEN
   RAISE EXCEPTION 'BIOMETRIC_SESSION_AUTHORITY_INVALID';
 END IF;
 IF NEW.purpose='ENROLLMENT' THEN
   IF NEW."templateId" IS NOT NULL OR NOT EXISTS (
     SELECT 1 FROM biometric_states s WHERE s."workerId"=NEW."workerId"
     AND NEW."templateVersion"=s."lastVersion"+1
   ) OR EXISTS (
     SELECT 1 FROM biometric_templates t WHERE t."workerId"=NEW."workerId"
     AND t.epoch=NEW.epoch AND t."revokedAt" IS NULL AND t."deletedAt" IS NULL
   ) THEN RAISE EXCEPTION 'BIOMETRIC_TEMPLATE_AUTHORITY_INVALID'; END IF;
 ELSE
   IF NOT EXISTS (
     SELECT 1 FROM biometric_templates t JOIN biometric_states s ON s."workerId"=t."workerId"
     WHERE t.id=NEW."templateId" AND t."workerId"=NEW."workerId"
     AND t.epoch=NEW.epoch AND t.version=NEW."templateVersion" AND t.version=s."lastVersion"
     AND t."modelVersion"=NEW."modelVersion" AND t."consentVersion"=s."consentVersion"
     AND t."revokedAt" IS NULL AND t."deletedAt" IS NULL
   ) THEN RAISE EXCEPTION 'BIOMETRIC_TEMPLATE_AUTHORITY_INVALID'; END IF;
 END IF;
 IF NEW.purpose='ORDER' THEN
   PERFORM id FROM orders WHERE id=NEW."orderId" AND "workerId"=NEW."workerId" AND status='ARRIVED' FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'BIOMETRIC_ORDER_AUTHORITY_INVALID'; END IF;
 END IF;
 RETURN NEW;
END $$;
COMMIT;
