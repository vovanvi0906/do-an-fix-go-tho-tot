CREATE TABLE "registration_proofs" (
    "tokenHash" CHAR(64) NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registration_proofs_pkey" PRIMARY KEY ("tokenHash")
);
CREATE INDEX "registration_proofs_expiresAt_idx" ON "registration_proofs"("expiresAt");
