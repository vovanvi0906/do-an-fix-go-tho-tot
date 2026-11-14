import { Injectable, Dependencies, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FaceCoreService } from './face-core.service';

// Read-only session/proof inspector for the FaceID Lab. Metadata only: never returns
// nonce/nonce hash, capture digest, claim ID, ciphertext, key material, reviewer or
// evidence references. Ownership comes from the JWT user, never from a client workerId.
const LIMIT = 20;
const iso = d => (d instanceof Date ? d.toISOString() : null);

export function proofLifecycle(p, now) {
  if (p.revokedAt) return 'REVOKED';
  if (p.consumedAt) return 'CONSUMED';
  if (p.issuedAt > now) return 'NOT_YET_VALID';
  if (p.expiresAt <= now) return 'EXPIRED';
  return 'ACTIVE';
}

export function sessionLifecycle(s, now) {
  if (s.state === 'PENDING' && s.expiresAt <= now) return 'EXPIRED';
  return s.state;
}

@Injectable()
@Dependencies(PrismaService, FaceCoreService)
export class FaceLabInspectorService {
  constructor(prisma, core) { this.prisma = prisma; this.core = core; }

  async inspect(userId, orderId) {
    if (orderId != null && (typeof orderId !== 'string' || orderId.length === 0 || orderId.length > 128)) throw new BadRequestException('ORDER_SCOPE_INVALID');
    this.core.policy();
    let caps;
    try { caps = await this.core.gateway.capabilities(); } catch (_) { caps = null; }
    const o = this.core.options;
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { workerProfile: true } });
      if (!user || user.role !== 'WORKER' || user.status !== 'ACTIVE' || !user.workerProfile) throw new ForbiddenException('ACTIVE_WORKER_REQUIRED');
      const workerId = user.workerProfile.id;
      const now = await this.core.now(tx);
      let order = null;
      if (orderId) {
        const row = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, workerId: true, status: true } });
        if (row?.workerId !== workerId) throw new ForbiddenException('ORDER_ACCESS_DENIED');
        order = { id: row.id, status: row.status, faceStageAllowed: row.status === 'ARRIVED' };
      }
      const scope = orderId ? { workerId, orderId } : { workerId };
      const [state, templates, sessions, proofs, audits] = await Promise.all([
        tx.biometricState.findUnique({ where: { workerId } }),
        tx.biometricTemplate.findMany({ where: { workerId }, orderBy: { version: 'desc' }, take: LIMIT,
          select: { id: true, version: true, epoch: true, modelVersion: true, createdAt: true, revokedAt: true, deletedAt: true } }),
        tx.biometricSession.findMany({ where: scope, orderBy: { createdAt: 'desc' }, take: LIMIT,
          select: { id: true, purpose: true, orderId: true, state: true, attempts: true, epoch: true, templateVersion: true, errorCode: true, createdAt: true, expiresAt: true, consumedAt: true } }),
        tx.biometricProof.findMany({ where: scope, orderBy: { issuedAt: 'desc' }, take: LIMIT,
          select: { id: true, sessionId: true, purpose: true, orderId: true, templateVersion: true, epoch: true, policyVersion: true, identityScore: true, issuedAt: true, expiresAt: true, consumedAt: true, revokedAt: true } }),
        tx.biometricAudit.findMany({ where: { workerId }, orderBy: { createdAt: 'desc' }, take: LIMIT,
          select: { action: true, reason: true, createdAt: true } }),
      ]);
      const consentValid = !!this.core.consentValid(state);
      return {
        labOnly: true, serverTime: iso(now),
        worker: { approvalStatus: user.workerProfile.approvalStatus },
        consent: { valid: consentValid, requiredVersion: o.consentVersion, version: state?.consentVersion ?? null,
          consentedAt: iso(state?.consentedAt), withdrawnAt: iso(state?.withdrawnAt) },
        biometricState: state ? { epoch: state.epoch, lastVersion: state.lastVersion } : null,
        templates: templates.map(t => ({ id: t.id, version: t.version, epoch: t.epoch, modelVersion: t.modelVersion,
          createdAt: iso(t.createdAt), revokedAt: iso(t.revokedAt), deletedAt: iso(t.deletedAt),
          status: t.deletedAt ? 'DELETED' : t.revokedAt ? 'REVOKED' : state && t.epoch === state.epoch ? 'ACTIVE' : 'STALE_EPOCH' })),
        sessions: sessions.map(s => ({ ...s, createdAt: iso(s.createdAt), expiresAt: iso(s.expiresAt), consumedAt: iso(s.consumedAt),
          lifecycle: sessionLifecycle(s, now), stale: !!state && s.epoch !== state.epoch })),
        proofs: proofs.map(p => ({ ...p, issuedAt: iso(p.issuedAt), expiresAt: iso(p.expiresAt), consumedAt: iso(p.consumedAt),
          revokedAt: iso(p.revokedAt), lifecycle: proofLifecycle(p, now) })),
        audit: audits.map(a => ({ action: a.action, reason: a.reason, createdAt: iso(a.createdAt) })),
        order,
        policy: { sessionTtlMs: o.sessionMs, dailyProofTtlMs: o.dailyMs, orderProofTtlMs: o.orderMs,
          attemptsPerSession: o.attempts, windowAttempts: o.windowAttempts, windowMs: o.windowMs,
          inferenceTimeoutMs: o.timeoutMs, identityThreshold: o.threshold, thresholdStatus: 'PROVISIONAL_UNCALIBRATED',
          captureApproved: o.captureApproved === true, keysConfigured: this.core.cryptoReady() === true,
          padEvaluated: caps?.padEvaluated === true, padModelVersion: caps?.padModelVersion ?? null,
          identityModelReady: caps?.identityModelReady === true, modelVersion: caps?.modelVersion ?? null },
      };
    });
  }
}
