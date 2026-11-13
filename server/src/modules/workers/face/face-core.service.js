import { Injectable, Dependencies, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FaceEvidenceGateway } from './face-evidence.gateway';
import { faceCoreConfig } from './face-core.config';
import { sealTemplate, openTemplate } from './template-crypto';

const fail = code => { throw new BadRequestException(code); };
const metaTemplate = t => t && ({ id: t.id, version: t.version, modelVersion: t.modelVersion, revokedAt: t.revokedAt, deletedAt: t.deletedAt });
const metaProof = p => p && ({ id: p.id, purpose: p.purpose, orderId: p.orderId, templateVersion: p.templateVersion, issuedAt: p.issuedAt, expiresAt: p.expiresAt, consumedAt: p.consumedAt });
const text = (v, max = 128) => typeof v === 'string' && v.length > 0 && v.length <= max;
const digest = value => createHash('sha256').update(value).digest('hex');

@Injectable()
@Dependencies(PrismaService, FaceEvidenceGateway)
export class FaceCoreService {
  constructor(prisma, gateway, options = faceCoreConfig()) {
    this.prisma = prisma; this.gateway = gateway; this.options = options;
  }
  enabled() { return this.options.enabled === true; }
  policy() {
    const o = this.options;
    if (!this.enabled()) throw new ForbiddenException('FACE_CORE_DISABLED');
    for (const k of ['sessionMs', 'dailyMs', 'orderMs', 'attempts', 'windowAttempts', 'windowMs', 'timeoutMs']) {
      if (!Number.isSafeInteger(o[k]) || o[k] <= 0 || o[k] > 86400000) fail('FACE_POLICY_INVALID');
    }
    if (!Number.isFinite(o.threshold) || o.threshold < -1 || o.threshold > 1 || !text(o.consentVersion)) fail('FACE_POLICY_INVALID');
  }
  async now(tx) { return (await tx.$queryRaw`SELECT clock_timestamp() AS now`)[0].now; }
  async workerTx(userId, fn) {
    this.policy();
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { workerProfile: true } });
      if (!user || user.role !== 'WORKER' || user.status !== 'ACTIVE' || !user.workerProfile) throw new ForbiddenException('ACTIVE_WORKER_REQUIRED');
      const workerId = user.workerProfile.id;
      await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id = ${workerId} FOR UPDATE`;
      const worker = await tx.workerProfile.findUnique({ where: { id: workerId }, include: { user: true } });
      if (worker.user.status !== 'ACTIVE' || worker.user.role !== 'WORKER') throw new ForbiddenException('ACTIVE_WORKER_REQUIRED');
      return fn(tx, worker, await this.now(tx));
    }, { maxWait: 10000, timeout: 10000 });
  }
  async state(tx, workerId) {
    return tx.biometricState.upsert({ where: { workerId }, create: { workerId }, update: {} });
  }
  async audit(tx, actorId, workerId, action, reason, targetId = null) {
    await tx.biometricAudit.create({ data: { actorId, workerId, action, reason, targetId } });
  }
  async current(tx, workerId) {
    const state = await tx.biometricState.findUnique({ where: { workerId } });
    if (!state) return null;
    return tx.biometricTemplate.findFirst({ where: { workerId, epoch: state.epoch, version: state.lastVersion, revokedAt: null, deletedAt: null } });
  }
  consentValid(state) { return state && state.consentVersion === this.options.consentVersion && state.consentedAt && !state.withdrawnAt; }
  cryptoReady() {
    return this.options.keys?.[this.options.currentKeyId]?.length === 32 && this.options.nonceKey?.length >= 32;
  }
  async ready() {
    this.policy();
    const caps = await this.gateway.capabilities();
    if (!this.options.captureApproved) fail('BIOMETRIC_DATA_POLICY_NOT_APPROVED');
    if (!this.cryptoReady()) fail('FACE_KEYS_NOT_CONFIGURED');
    if (!caps?.padEvaluated || !text(caps.padModelVersion, 256) || !text(caps.modelVersion, 256)) fail('PAD_NOT_EVALUATED');
    return caps;
  }
  nonce(session) {
    return createHmac('sha256', this.options.nonceKey).update(JSON.stringify([session.id, session.workerId, session.userId])).digest('base64url');
  }
  async status(userId, orderId) {
    this.policy();
    let caps;
    try { caps = await this.gateway.capabilities(); } catch (_) { caps = {}; }
    return this.workerTx(userId, async (tx, worker, now) => {
      const state = await tx.biometricState.findUnique({ where: { workerId: worker.id } });
      const template = await this.current(tx, worker.id);
      const review = state && await tx.biometricReview.findFirst({ where: { workerId: worker.id, epoch: state.epoch, revokedAt: null, expiresAt: { gt: now } }, orderBy: { approvedAt: 'desc' } });
      const blockers = [];
      if (worker.approvalStatus !== 'APPROVED') blockers.push('WORKER_APPROVAL_REQUIRED');
      if (!review) blockers.push('IDENTITY_REVIEW_REQUIRED');
      if (!this.consentValid(state)) blockers.push('CONSENT_REQUIRED');
      if (!this.cryptoReady()) blockers.push('FACE_KEYS_NOT_CONFIGURED');
      if (!this.options.captureApproved) blockers.push('BIOMETRIC_DATA_POLICY_NOT_APPROVED');
      if (!caps?.padEvaluated) blockers.push('PAD_NOT_EVALUATED');
      const proof = template && this.consentValid(state) && await tx.biometricProof.findFirst({ where: {
        workerId: worker.id, templateId: template.id, templateVersion: template.version, modelVersion: template.modelVersion, epoch: state.epoch, purpose: 'DAILY', revokedAt: null,
        consumedAt: null, expiresAt: { gt: now }, issuedAt: { lte: now },
      }, orderBy: { issuedAt: 'desc' } });
      let orderProof = null;
      if (orderId) {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (order?.workerId !== worker.id) throw new ForbiddenException('ORDER_ACCESS_DENIED');
        if (template && this.consentValid(state)) orderProof = await tx.biometricProof.findFirst({ where: {
          workerId: worker.id, orderId, templateId: template.id, templateVersion: template.version, modelVersion: template.modelVersion, epoch: state.epoch, purpose: 'ORDER',
          consumedAt: null, revokedAt: null, issuedAt: { lte: now }, expiresAt: { gt: now },
        }, orderBy: { issuedAt: 'desc' } });
      }
      return { enrollmentStatus: template ? 'ENROLLED' : state?.withdrawnAt ? 'WITHDRAWN' : 'PENDING_REVIEW',
        template: metaTemplate(template), templateVersion: template?.version ?? null,
        requiredConsentVersion: this.options.consentVersion, consentVersion: state?.consentVersion ?? null, consentRequired: !this.consentValid(state),
        identityReviewApproved: !!review, reviewRequestSubmitted: false, blockers,
        canEnroll: !template && blockers.length === 0, canRequestReset: !!template,
        canVerifyDaily: !!template && blockers.length === 0, canVerifyOrder: !!template && blockers.length === 0,
        padDecision: caps?.padEvaluated ? 'INCONCLUSIVE' : 'NOT_EVALUATED', dailyProof: metaProof(proof) || null, orderProof: metaProof(orderProof) || null };
    });
  }
  async consent(userId, version) {
    if (version !== this.options.consentVersion) fail('CONSENT_VERSION_REQUIRED');
    return this.workerTx(userId, async (tx, worker, now) => {
      await this.state(tx, worker.id);
      await tx.biometricState.update({ where: { workerId: worker.id }, data: { consentVersion: version, consentedAt: now, withdrawnAt: null } });
      await this.audit(tx, userId, worker.id, 'CONSENT', version);
      return { consentVersion: version, consentedAt: now };
    });
  }
  async review(adminId, workerId, body) {
    this.policy();
    return this.prisma.$transaction(async tx => {
      const admin = await tx.user.findUnique({ where: { id: adminId } });
      if (admin?.role !== 'ADMIN' || admin.status !== 'ACTIVE') throw new ForbiddenException('ACTIVE_ADMIN_REQUIRED');
      await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id = ${workerId} FOR UPDATE`;
      const worker = await tx.workerProfile.findUnique({ where: { id: workerId }, include: { user: true } });
      if (worker?.approvalStatus !== 'APPROVED' || worker.user.status !== 'ACTIVE' || worker.user.role !== 'WORKER') fail('APPROVED_ACTIVE_WORKER_REQUIRED');
      const now = await this.now(tx), expiresAt = new Date(body.expiresAt);
      if (body.reviewedIdentity !== true || !['ENROLLMENT', 'REENROLLMENT'].includes(body.kind) ||
          !/^[a-zA-Z0-9:_-]{1,128}$/.test(body.evidenceReference || '') || !/^[a-f0-9]{64}$/.test(body.evidenceDigest || '') ||
          !text(body.reason, 160) || !Number.isFinite(+expiresAt) || expiresAt <= now || +expiresAt - now > 30 * 86400000) fail('IDENTITY_REVIEW_EVIDENCE_REQUIRED');
      const state = await this.state(tx, worker.id);
      if (state.lastVersion > 0 && body.kind !== 'REENROLLMENT') fail('REENROLLMENT_REVIEW_REQUIRED');
      if (body.kind === 'REENROLLMENT') {
        await this.revoke(tx, worker.id, adminId, now, false);
      }
      const fresh = await this.state(tx, worker.id);
      const review = await tx.biometricReview.create({ data: { workerId, reviewerId: adminId, kind: body.kind,
        evidenceReference: body.evidenceReference, evidenceDigest: body.evidenceDigest, reason: body.reason,
        approvedAt: now, expiresAt, epoch: fresh.epoch } });
      await this.audit(tx, adminId, workerId, 'IDENTITY_REVIEW_APPROVED', body.kind, review.id);
      return { id: review.id, kind: review.kind, approvedAt: now, expiresAt, reviewerId: adminId };
    });
  }
  async revoke(tx, workerId, actorId, now, withdraw) {
    await this.state(tx, workerId);
    await tx.biometricState.update({ where: { workerId }, data: { epoch: { increment: 1 }, ...(withdraw ? { withdrawnAt: now, consentVersion: null, consentedAt: null } : {}) } });
    await tx.biometricTemplate.updateMany({ where: { workerId, revokedAt: null, deletedAt: null }, data: { revokedAt: now } });
    await tx.biometricTemplate.updateMany({ where: { workerId, deletedAt: null }, data: { deletedAt: now, encrypted: Prisma.DbNull } });
    await tx.biometricProof.updateMany({ where: { workerId, revokedAt: null }, data: { revokedAt: now } });
    await tx.biometricSession.updateMany({ where: { workerId, state: { in: ['PENDING', 'PROCESSING'] } }, data: { state: 'REVOKED', errorCode: 'TEMPLATE_REVOKED' } });
    await tx.biometricReview.updateMany({ where: { workerId, revokedAt: null }, data: { revokedAt: now } });
    await tx.workerProfile.update({ where: { id: workerId }, data: { isOnline: false } });
    await this.audit(tx, actorId, workerId, withdraw ? 'WITHDRAW_AND_DELETE' : 'RESET_AND_DELETE', 'CRYPTOGRAPHIC_PAYLOAD_DELETED');
  }
  async withdraw(userId) {
    return this.workerTx(userId, async (tx, worker, now) => {
      await this.revoke(tx, worker.id, userId, now, true);
      return { withdrawnAt: now, templatesDeleted: true, proofsRevoked: true };
    });
  }
  async orderAccess(tx, worker, purpose, orderId) {
    if (purpose === 'ORDER') {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order?.workerId !== worker.id) throw new ForbiddenException('ORDER_ACCESS_DENIED');
      if (order.status !== 'ARRIVED') fail('FACE_STAGE_NOT_ALLOWED');
    } else if (orderId != null) fail('ORDER_SCOPE_INVALID');
  }
  async createSession(userId, { purpose, orderId = null, requestKey }) {
    if (!['ENROLLMENT', 'DAILY', 'ORDER'].includes(purpose) || !text(requestKey) || (purpose === 'ORDER' && !text(orderId))) fail('INVALID_SESSION_INPUT');
    const caps = await this.ready();
    return this.workerTx(userId, async (tx, worker, now) => {
      if (worker.approvalStatus !== 'APPROVED') fail('WORKER_APPROVAL_REQUIRED');
      const state = await this.state(tx, worker.id);
      if (!this.consentValid(state)) fail('CONSENT_REQUIRED');
      await this.orderAccess(tx, worker, purpose, orderId);
      const duplicate = await tx.biometricSession.findUnique({ where: { workerId_requestKey: { workerId: worker.id, requestKey } } });
      if (duplicate) {
        if (duplicate.purpose !== purpose || duplicate.orderId !== orderId || duplicate.epoch !== state.epoch) throw new ConflictException('IDEMPOTENCY_SCOPE_CONFLICT');
        if (duplicate.expiresAt <= now || duplicate.state === 'REVOKED') fail('SESSION_EXPIRED');
        return this.sessionMeta(duplicate);
      }
      const count = await tx.biometricSession.count({ where: { workerId: worker.id, createdAt: { gt: new Date(+now - this.options.windowMs) } } });
      if (count >= this.options.windowAttempts) fail('FACE_RATE_LIMITED');
      const template = await this.current(tx, worker.id);
      const review = await tx.biometricReview.findFirst({ where: { workerId: worker.id, epoch: state.epoch, revokedAt: null, expiresAt: { gt: now } }, orderBy: { approvedAt: 'desc' } });
      if (!review) fail('IDENTITY_REVIEW_REQUIRED');
      if (purpose === 'ENROLLMENT' && template) throw new ConflictException('TEMPLATE_ALREADY_ENROLLED');
      if (purpose !== 'ENROLLMENT' && (!template || template.modelVersion !== caps.modelVersion)) fail('TRUSTED_TEMPLATE_REQUIRED');
      const id = randomUUID();
      const input = { id, workerId: worker.id, userId, purpose, orderId, requestKey, epoch: state.epoch,
        templateId: template?.id ?? null, templateVersion: template?.version ?? state.lastVersion + 1,
        modelVersion: caps.modelVersion, reviewId: review.id, createdAt: now, expiresAt: new Date(+now + this.options.sessionMs) };
      const session = await tx.biometricSession.create({ data: { ...input, nonceHash: digest(this.nonce(input)) } });
      await this.audit(tx, userId, worker.id, 'SESSION_CREATED', purpose, id);
      return this.sessionMeta(session);
    });
  }
  sessionMeta(s) { return { id: s.id, purpose: s.purpose, orderId: s.orderId, nonce: this.nonce(s), expiresAt: s.expiresAt, templateVersion: s.templateVersion, state: s.state }; }
  async authorizeCapture(userId, sessionId) {
    this.policy(); await this.ready();
    return this.workerTx(userId, async (tx, worker, now) => {
      const s = await tx.biometricSession.findUnique({ where: { id: sessionId } });
      const state = await tx.biometricState.findUnique({ where: { workerId: worker.id } });
      if (!s || s.userId !== userId || s.workerId !== worker.id) throw new ForbiddenException('SESSION_ACCESS_DENIED');
      if (!this.consentValid(state) || state.epoch !== s.epoch || s.expiresAt <= now || !['PENDING','SUCCEEDED'].includes(s.state)) fail('SESSION_EXPIRED_OR_BUSY');
      await this.orderAccess(tx, worker, s.purpose, s.orderId);
      return true;
    });
  }
  async submit(userId, sessionId, { nonce, photo }) {
    if (!text(nonce) || typeof photo !== 'string' || !/^data:image\/(jpeg|png);base64,/.test(photo) || photo.length > 6990600) fail('INLINE_CAPTURE_REQUIRED');
    const caps = await this.ready(), captureDigest = digest(photo), claimId = randomUUID();
    const claimed = await this.workerTx(userId, async (tx, worker, now) => {
      const session = await tx.biometricSession.findUnique({ where: { id: sessionId } });
      if (!session || session.workerId !== worker.id || session.userId !== userId) throw new ForbiddenException('SESSION_ACCESS_DENIED');
      const state = await this.state(tx, worker.id);
      if (!this.consentValid(state) || session.epoch !== state.epoch || session.expiresAt <= now || session.modelVersion !== caps.modelVersion) fail('SESSION_EXPIRED_OR_REVOKED');
      if (!/^[a-f0-9]{64}$/.test(session.nonceHash) || !timingSafeEqual(Buffer.from(digest(nonce)), Buffer.from(session.nonceHash))) fail('INVALID_NONCE');
      if (worker.approvalStatus !== 'APPROVED') fail('WORKER_APPROVAL_REQUIRED');
      await this.orderAccess(tx, worker, session.purpose, session.orderId);
      if (session.state === 'SUCCEEDED') {
        if (session.captureDigest !== captureDigest) throw new ConflictException('REPLAY_PAYLOAD_CHANGED');
        return { done: true, result: await this.completed(tx, session) };
      }
      if (session.state !== 'PENDING') throw new ConflictException('SESSION_BUSY_OR_REVOKED');
      const attempts = await tx.biometricSession.aggregate({ where: { workerId: worker.id, createdAt: { gt: new Date(+now - this.options.windowMs) } }, _sum: { attempts: true } });
      if (session.attempts >= this.options.attempts || attempts._sum.attempts >= this.options.windowAttempts) fail('FACE_RATE_LIMITED');
      const template = session.templateId && await tx.biometricTemplate.findUnique({ where: { id: session.templateId } });
      if (session.purpose !== 'ENROLLMENT' && (!template || template.workerId !== worker.id || template.version !== session.templateVersion || template.epoch !== session.epoch || template.modelVersion !== session.modelVersion || template.revokedAt || template.deletedAt)) fail('TRUSTED_TEMPLATE_REQUIRED');
      await tx.biometricSession.update({ where: { id: session.id }, data: { state: 'PROCESSING', attempts: { increment: 1 }, captureDigest, claimId } });
      return { session, template };
    });
    if (claimed.done) return claimed.result;
    let timer, evidence;
    try {
      const { session, template } = claimed;
      const input = { photo, workerId: session.workerId, sessionId: session.id, templateVersion: session.templateVersion, modelVersion: session.modelVersion };
      if (template) {
        const key = this.options.keys[template.keyId];
        input.templateEmbedding = openTemplate(template.encrypted, { workerId: template.workerId, templateVersion: template.version, modelVersion: template.modelVersion }, key);
      }
      evidence = await Promise.race([
        Promise.resolve().then(() => session.purpose === 'ENROLLMENT' ? this.gateway.enroll(input) : this.gateway.verify(input)),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('FACE_TIMEOUT')), this.options.timeoutMs); }),
      ]);
      return await this.finish(userId, session.id, claimId, caps, evidence);
    } catch (error) {
      await this.workerTx(userId, async (tx, worker) => {
        await tx.biometricSession.updateMany({ where: { id: sessionId, workerId: worker.id, state: 'PROCESSING', claimId }, data: { state: 'PENDING', errorCode: 'INFERENCE_REJECTED' } });
        await this.audit(tx, userId, worker.id, 'INFERENCE_REJECTED', 'NO_PROOF_GRANTED', sessionId);
      });
      // No exception payload or evidence gets logged or returned.
      fail('FACE_EVIDENCE_REJECTED');
    } finally { clearTimeout(timer); }
  }
  async completed(tx, session) {
    const template = await this.current(tx, session.workerId);
    if (!template || template.version !== session.templateVersion || template.modelVersion !== session.modelVersion) fail('TRUSTED_TEMPLATE_REQUIRED');
    if (session.purpose === 'ENROLLMENT') return { verified: false, enrolled: true, template: metaTemplate(template) };
    const proof = await tx.biometricProof.findUnique({ where: { sessionId: session.id } });
    const now = await this.now(tx);
    if (!proof || proof.revokedAt || proof.consumedAt || proof.expiresAt <= now || proof.issuedAt > now ||
        proof.workerId !== session.workerId || proof.orderId !== session.orderId || proof.purpose !== session.purpose ||
        proof.templateId !== template.id || proof.templateVersion !== template.version || proof.epoch !== session.epoch || proof.modelVersion !== template.modelVersion) fail('PROOF_EXPIRED_OR_CONSUMED');
    return { verified: true, proof: metaProof(proof) };
  }
  async finish(userId, id, claimId, caps, evidence) {
    return this.workerTx(userId, async (tx, worker, now) => {
      const s = await tx.biometricSession.findUnique({ where: { id } });
      const state = await this.state(tx, worker.id);
      if (!s || s.workerId !== worker.id || s.state !== 'PROCESSING' || s.claimId !== claimId || s.expiresAt <= now || s.epoch !== state.epoch || !this.consentValid(state)) fail('SESSION_EXPIRED_OR_REVOKED');
      if (worker.approvalStatus !== 'APPROVED') fail('WORKER_APPROVAL_REQUIRED');
      await this.orderAccess(tx, worker, s.purpose, s.orderId);
      const review = await tx.biometricReview.findUnique({ where: { id: s.reviewId } });
      if (!review || review.workerId !== worker.id || review.revokedAt || review.expiresAt <= now || review.epoch !== state.epoch) fail('IDENTITY_REVIEW_REQUIRED');
      if (evidence?.workerId !== worker.id || evidence.sessionId !== id || evidence.modelVersion !== s.modelVersion || evidence.templateVersion !== s.templateVersion ||
          evidence.qualityDecision !== 'PASS' || evidence.padDecision !== 'PASS' || evidence.padModelVersion !== caps.padModelVersion) fail('INVALID_FACE_EVIDENCE');
      if (s.purpose === 'ENROLLMENT') {
        if (await this.current(tx, worker.id)) throw new ConflictException('TEMPLATE_ALREADY_ENROLLED');
        if (s.templateVersion !== state.lastVersion + 1 || evidence.verificationMethod !== 'yunet_sface_embedding') fail('TEMPLATE_VERSION_CONFLICT');
        const encrypted = sealTemplate(evidence.embedding, { workerId: worker.id, templateVersion: s.templateVersion, modelVersion: s.modelVersion }, this.options.keys[this.options.currentKeyId]);
        const template = await tx.biometricTemplate.create({ data: { workerId: worker.id, version: s.templateVersion, epoch: state.epoch, reviewId: review.id,
          modelVersion: s.modelVersion, keyId: this.options.currentKeyId, encrypted, consentVersion: state.consentVersion, createdAt: now } });
        await tx.biometricState.update({ where: { workerId: worker.id }, data: { lastVersion: s.templateVersion } });
        await tx.biometricSession.update({ where: { id }, data: { state: 'SUCCEEDED', consumedAt: now } });
        await this.audit(tx, userId, worker.id, 'ENROLLED', 'REVIEW_QUALITY_PAD_VALIDATED', template.id);
        return { verified: false, enrolled: true, template: metaTemplate(template) };
      }
      const template = await this.current(tx, worker.id);
      if (!template || template.id !== s.templateId || template.version !== s.templateVersion || evidence.identityDecision !== 'MATCH' ||
          evidence.verificationMethod !== 'yunet_sface_cosine' || typeof evidence.identityScore !== 'number' || !Number.isFinite(evidence.identityScore) ||
          evidence.identityScore < this.options.threshold || evidence.identityScore > 1) fail('IDENTITY_NOT_VERIFIED');
      await tx.biometricSession.update({ where: { id }, data: { state: 'SUCCEEDED', consumedAt: now } });
      const proof = await tx.biometricProof.create({ data: { sessionId: id, workerId: worker.id, templateId: template.id, templateVersion: template.version,
        epoch: state.epoch, purpose: s.purpose, orderId: s.orderId, modelVersion: s.modelVersion, padModelVersion: caps.padModelVersion,
        policyVersion: `experimental-v1:cosine:${this.options.threshold}`, identityScore: evidence.identityScore, issuedAt: now,
        expiresAt: new Date(+now + (s.purpose === 'DAILY' ? this.options.dailyMs : this.options.orderMs)) } });
      await this.audit(tx, userId, worker.id, 'PROOF_ISSUED', s.purpose, proof.id);
      return { verified: true, proof: metaProof(proof) };
    });
  }
  async eligibleWorker(tx, workerId) {
    const worker = await tx.workerProfile.findUnique({ where: { id: workerId }, include: { user: true } });
    if (worker?.user.role !== 'WORKER' || worker.user.status !== 'ACTIVE' || worker.approvalStatus !== 'APPROVED') fail('APPROVED_ACTIVE_WORKER_REQUIRED');
    return worker;
  }
  async requireDaily(tx, workerId) {
    this.policy(); await this.eligibleWorker(tx, workerId);
    const state = await tx.biometricState.findUnique({ where: { workerId } }), now = await this.now(tx);
    const template = await this.current(tx, workerId);
    if (!this.consentValid(state) || !template) fail('DAILY_PROOF_REQUIRED');
    const proof = await tx.biometricProof.findFirst({ where: { workerId, templateId: template.id, templateVersion: template.version, modelVersion: template.modelVersion, epoch: state.epoch,
      purpose: 'DAILY', orderId: null, revokedAt: null, consumedAt: null, issuedAt: { lte: now }, expiresAt: { gt: now } } });
    if (!proof) fail('DAILY_PROOF_REQUIRED');
    return metaProof(proof);
  }
  async consumeOrder(tx, workerId, orderId, actorId) {
    this.policy(); const worker = await this.eligibleWorker(tx, workerId);
    const state = await tx.biometricState.findUnique({ where: { workerId } }), now = await this.now(tx);
    const template = await this.current(tx, workerId);
    if (!this.consentValid(state) || !template) fail('ORDER_FACE_PROOF_REQUIRED');
    const proof = await tx.biometricProof.findFirst({ where: { workerId, orderId, templateId: template.id, templateVersion: template.version, modelVersion: template.modelVersion, epoch: state.epoch,
      purpose: 'ORDER', revokedAt: null, consumedAt: null, issuedAt: { lte: now }, expiresAt: { gt: now } }, orderBy: { issuedAt: 'desc' } });
    if (!proof) fail('ORDER_FACE_PROOF_REQUIRED');
    // Keep historical order lineage, but never consume for a changed current assignee/stage.
    await this.orderAccess(tx, worker, 'ORDER', orderId);
    const changed = await tx.biometricProof.updateMany({ where: { id: proof.id, workerId, orderId, consumedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
    if (changed.count !== 1) throw new ConflictException('PROOF_ALREADY_CONSUMED');
    await this.audit(tx, actorId || (await tx.workerProfile.findUnique({ where: { id: workerId }, select: { userId: true } })).userId, workerId, 'ORDER_PROOF_CONSUMED', 'START_WORK', proof.id);
    return metaProof({ ...proof, consumedAt: now });
  }
}
