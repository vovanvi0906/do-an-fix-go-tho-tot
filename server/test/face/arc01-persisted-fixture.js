// Persisted authorization-state fixtures for FSM tests, NOT an inference/PAD provider.
// No gateway mock, no runtime flag approval, no disabled SQL trigger/constraint.
import { randomBytes, randomUUID, createHash } from 'crypto';
import { sealTemplate } from '../../src/modules/workers/face/template-crypto';

export async function assertArc01Disposable(db) {
  const url = process.env.ARC01_TEST_DATABASE_URL;
  if (!url || url !== process.env.FACE_TEST_DATABASE_URL)
    throw new Error('Runner-owned disposable URL required');
  const parsed = new URL(url);
  if (
    parsed.hostname !== '127.0.0.1' ||
    !parsed.port ||
    parsed.pathname !== '/fixgo_face_test'
  )
    throw new Error('ARC01 disposable identity mismatch');
  const [identity] = await db.$queryRaw`SELECT current_database() AS name`;
  if (identity.name !== 'fixgo_face_test')
    throw new Error('ARC01 server database identity mismatch');
}

export async function persistedIdentity(db, user, admin, consentVersion) {
  await assertArc01Disposable(db);
  const workerId = user.workerProfile.id;
  return db.$transaction(async (tx) => {
    const [{ now }] = await tx.$queryRaw`SELECT clock_timestamp() AS now`;
    await tx.biometricState.create({
      data: { workerId, consentVersion, consentedAt: now },
    });
    const review = await tx.biometricReview.create({
      data: {
        workerId,
        reviewerId: admin.id,
        kind: 'ENROLLMENT',
        evidenceReference: 'synthetic:arc01:persisted-state',
        evidenceDigest: 'a'.repeat(64),
        reason: 'FSM fixture only; no human identity or PAD verification',
        approvedAt: now,
        expiresAt: new Date(+now + 3600000),
        epoch: 0,
      },
    });
    const modelVersion = 'arc01-synthetic-fixture-not-a-real-model';
    const template = await tx.biometricTemplate.create({
      data: {
        workerId,
        reviewId: review.id,
        version: 1,
        epoch: 0,
        modelVersion,
        keyId: 'arc01-ephemeral-fixture',
        consentVersion,
        encrypted: sealTemplate(
          Array(128).fill(0.125),
          { workerId, templateVersion: 1, modelVersion },
          randomBytes(32),
        ),
      },
    });
    await tx.biometricState.update({
      where: { workerId },
      data: { lastVersion: 1 },
    });
    return {
      userId: user.id,
      workerId,
      reviewId: review.id,
      templateId: template.id,
      modelVersion,
    };
  });
}

export async function persistedProof(db, identity, purpose, orderId = null) {
  await assertArc01Disposable(db);
  return db.$transaction(async (tx) => {
    const [{ now }] = await tx.$queryRaw`SELECT clock_timestamp() AS now`;
    const session = await tx.biometricSession.create({
      data: {
        ...identity,
        purpose,
        orderId,
        epoch: 0,
        templateVersion: 1,
        requestKey: randomUUID(),
        nonceHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
        createdAt: now,
        expiresAt: new Date(+now + 120000),
      },
    });
    await tx.biometricSession.update({
      where: { id: session.id },
      data: {
        state: 'PROCESSING',
        attempts: 1,
        claimId: randomUUID(),
        captureDigest: 'b'.repeat(64),
      },
    });
    await tx.biometricSession.update({
      where: { id: session.id },
      data: { state: 'SUCCEEDED', consumedAt: now },
    });
    return tx.biometricProof.create({
      data: {
        sessionId: session.id,
        workerId: identity.workerId,
        templateId: identity.templateId,
        templateVersion: 1,
        epoch: 0,
        purpose,
        orderId,
        modelVersion: identity.modelVersion,
        padModelVersion: 'arc01-fixture-not-evaluated',
        policyVersion: 'arc01:persisted-fixture:not-biometric-verification',
        identityScore: 0.8,
        issuedAt: now,
        expiresAt: new Date(+now + 3600000),
      },
    });
  });
}
