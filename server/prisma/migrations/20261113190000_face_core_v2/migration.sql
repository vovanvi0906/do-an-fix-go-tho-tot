-- CreateTable
CREATE TABLE "biometric_states" (
    "workerId" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL DEFAULT 0,
    "lastVersion" INTEGER NOT NULL DEFAULT 0,
    "consentVersion" TEXT,
    "consentedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "biometric_states_pkey" PRIMARY KEY ("workerId")
);

-- CreateTable
CREATE TABLE "biometric_reviews" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "evidenceReference" TEXT NOT NULL,
    "evidenceDigest" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "epoch" INTEGER NOT NULL,

    CONSTRAINT "biometric_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_templates" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "epoch" INTEGER NOT NULL,
    "reviewId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "encrypted" JSONB,
    "consentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "biometric_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_sessions" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "orderId" TEXT,
    "requestKey" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL,
    "templateId" TEXT,
    "templateVersion" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "reviewId" TEXT,
    "nonceHash" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "captureDigest" TEXT,
    "claimId" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "biometric_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_proofs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "epoch" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "orderId" TEXT,
    "modelVersion" TEXT NOT NULL,
    "padModelVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "identityScore" DOUBLE PRECISION NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "biometric_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_audits" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "biometric_reviews_workerId_revokedAt_expiresAt_idx" ON "biometric_reviews"("workerId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_templates_workerId_version_key" ON "biometric_templates"("workerId", "version");

-- CreateIndex
CREATE INDEX "biometric_sessions_workerId_createdAt_idx" ON "biometric_sessions"("workerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_sessions_workerId_requestKey_key" ON "biometric_sessions"("workerId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_proofs_sessionId_key" ON "biometric_proofs"("sessionId");

-- CreateIndex
CREATE INDEX "biometric_proofs_workerId_purpose_expiresAt_idx" ON "biometric_proofs"("workerId", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "biometric_proofs_orderId_consumedAt_idx" ON "biometric_proofs"("orderId", "consumedAt");

-- CreateIndex
CREATE INDEX "biometric_audits_workerId_createdAt_idx" ON "biometric_audits"("workerId", "createdAt");

-- AddForeignKey
ALTER TABLE "biometric_states" ADD CONSTRAINT "biometric_states_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_reviews" ADD CONSTRAINT "biometric_reviews_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_reviews" ADD CONSTRAINT "biometric_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_templates" ADD CONSTRAINT "biometric_templates_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "biometric_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_proofs" ADD CONSTRAINT "biometric_proofs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Face Core invariants not expressible by Prisma.
CREATE UNIQUE INDEX biometric_one_active_template ON biometric_templates ("workerId") WHERE "revokedAt" IS NULL AND "deletedAt" IS NULL;
ALTER TABLE biometric_states ADD CONSTRAINT biometric_state_versions CHECK (epoch >= 0 AND "lastVersion" >= 0);
ALTER TABLE biometric_reviews ADD CONSTRAINT biometric_review_policy CHECK (kind IN ('ENROLLMENT','REENROLLMENT') AND "expiresAt" > "approvedAt" AND epoch >= 0);
ALTER TABLE biometric_templates ADD CONSTRAINT biometric_template_policy CHECK (version > 0 AND epoch >= 0 AND ((encrypted IS NOT NULL AND "deletedAt" IS NULL) OR (encrypted IS NULL AND "deletedAt" IS NOT NULL AND "revokedAt" IS NOT NULL)));
ALTER TABLE biometric_sessions ADD CONSTRAINT biometric_session_policy CHECK (
 purpose IN ('ENROLLMENT','DAILY','ORDER') AND state IN ('PENDING','PROCESSING','SUCCEEDED','REVOKED') AND
 ((purpose = 'ORDER' AND "orderId" IS NOT NULL) OR (purpose <> 'ORDER' AND "orderId" IS NULL)) AND
 "expiresAt" > "createdAt" AND attempts >= 0 AND "templateVersion" > 0 AND epoch >= 0);
ALTER TABLE biometric_proofs ADD CONSTRAINT biometric_proof_policy CHECK (
 purpose IN ('DAILY','ORDER') AND ((purpose = 'ORDER' AND "orderId" IS NOT NULL) OR (purpose = 'DAILY' AND "orderId" IS NULL)) AND
 "expiresAt" > "issuedAt" AND "identityScore" BETWEEN -1 AND 1 AND "templateVersion" > 0 AND epoch >= 0);
CREATE FUNCTION biometric_template_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW."workerId",NEW.version,NEW.epoch,NEW."reviewId",NEW."modelVersion",NEW."keyId",NEW."consentVersion",NEW."createdAt") IS DISTINCT FROM
    (OLD.id,OLD."workerId",OLD.version,OLD.epoch,OLD."reviewId",OLD."modelVersion",OLD."keyId",OLD."consentVersion",OLD."createdAt") OR
    (NEW.encrypted IS DISTINCT FROM OLD.encrypted AND NOT (NEW.encrypted IS NULL AND NEW."deletedAt" IS NOT NULL AND NEW."revokedAt" IS NOT NULL)) OR
    (OLD."revokedAt" IS NOT NULL AND NEW."revokedAt" IS DISTINCT FROM OLD."revokedAt") OR
    (OLD."deletedAt" IS NOT NULL AND NEW."deletedAt" IS DISTINCT FROM OLD."deletedAt") THEN
   RAISE EXCEPTION 'BIOMETRIC_TEMPLATE_IMMUTABLE';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER biometric_template_immutable BEFORE UPDATE ON biometric_templates FOR EACH ROW EXECUTE FUNCTION biometric_template_immutable();
