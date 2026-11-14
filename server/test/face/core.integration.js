// Synthetic protocol fixtures ONLY. Gateway assertions are not biometric/PAD measurements.
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import { FaceCoreService } from '../../src/modules/workers/face/face-core.service';
import { faceCoreConfig } from '../../src/modules/workers/face/face-core.config';
import { FaceEvidenceGateway } from '../../src/modules/workers/face/face-evidence.gateway';
import { OrderWorkflowService } from '../../src/modules/orders/order-workflow.service';
import { openTemplate } from '../../src/modules/workers/face/template-crypto';
const url = process.env.FACE_TEST_DATABASE_URL;
if (!url) throw new Error('Run ONLY with test/face/run-isolated.cjs; no DATABASE_URL fallback');
const parsed = new URL(url);
if (parsed.hostname !== '127.0.0.1' || parsed.pathname !== '/fixgo_face_test' || !parsed.port) throw new Error('Disposable PostgreSQL required');
const db = new PrismaClient({ datasources: { db: { url } } });
const photo = 'data:image/jpeg;base64,c3ludGhldGlj';
const embedding = Array(128).fill(.125);
let core, gateway, options, worker, admin, user, order, customer;
function evidence(input, enrollment = false) {
  return { workerId: input.workerId, sessionId: input.sessionId, templateVersion: input.templateVersion, modelVersion: 'synthetic-model',
    qualityDecision: 'PASS', padDecision: 'PASS', padModelVersion: 'synthetic-test-provider',
    verificationMethod: enrollment ? 'yunet_sface_embedding' : 'yunet_sface_cosine',
    ...(enrollment ? { embedding } : { identityDecision: 'MATCH', identityScore: .8 }) };
}
async function review(kind = 'ENROLLMENT') {
  return core.review(admin.id, worker.id, { kind, reviewedIdentity: true, evidenceReference: 'synthetic:review:1', evidenceDigest: 'a'.repeat(64),
    reason: 'Synthetic fixture identity review', expiresAt: new Date(Date.now() + 86400000).toISOString() });
}
async function session(purpose, requestKey = randomUUID()) { return core.createSession(user.id, { purpose, requestKey, ...(purpose === 'ORDER' ? { orderId: order.id } : {}) }); }
async function submit(s, capture = photo) { return core.submit(user.id, s.id, { nonce: s.nonce, photo: capture }); }
async function enroll() { return submit(await session('ENROLLMENT')); }
async function issue(purpose) { return submit(await session(purpose)); }
beforeAll(async () => {
  await db.$connect();
  expect((await db.$queryRaw`SELECT current_database() AS name`)[0].name).toBe('fixgo_face_test');
});
afterAll(async () => db.$disconnect());
beforeEach(async () => {
  // Never runs on the project DB: URL + current_database guard above, runner owns container.
  await db.$executeRawUnsafe('TRUNCATE biometric_audits, biometric_proofs, biometric_sessions, biometric_templates, biometric_reviews, biometric_states, users, service_categories CASCADE');
  admin = await db.user.create({ data: { role: 'ADMIN' } });
  customer = await db.user.create({ data: { role: 'CUSTOMER' } });
  user = await db.user.create({ data: { role: 'WORKER' } });
  worker = await db.workerProfile.create({ data: { userId: user.id, approvalStatus: 'APPROVED', faceVerifiedAt: new Date() } });
  const category = await db.serviceCategory.create({ data: { name: 'Synthetic category' } });
  order = await db.order.create({ data: { workerId: worker.id, customerId: customer.id, categoryId: category.id, status: 'ARRIVED', addressText: 'Synthetic', lat: 10, lng: 106, estimatedPrice: 100000 } });
  await db.orderStatusHistory.create({ data: { orderId: order.id, status: 'ARRIVED', createdAt: new Date(Date.now() - 1000) } });
  await db.orderImage.create({ data: { orderId: order.id, type: 'BEFORE', url: 'https://synthetic.invalid/before' } });
  options = { ...faceCoreConfig(), enabled: true, captureApproved: true, keys: { k1: randomBytes(32) }, currentKeyId: 'k1', nonceKey: randomBytes(32), timeoutMs: 1000 };
  gateway = { capabilities: jest.fn(async () => ({ modelVersion: 'synthetic-model', padEvaluated: true, padModelVersion: 'synthetic-test-provider' })),
    enroll: jest.fn(async input => evidence(input, true)), verify: jest.fn(async input => { expect(input.templateEmbedding).toEqual(embedding); return evidence(input); }) };
  core = new FaceCoreService(db, gateway, options);
  await review(); await core.consent(user.id, options.consentVersion);
});

test('enrollment persists encrypted versioned template, reviewed evidence and metadata audit', async () => {
  const result = await enroll(); expect(result.enrolled).toBe(true);
  const stored = await db.biometricTemplate.findFirst();
  expect(stored.encrypted.ciphertext).toBeDefined(); expect(stored.encrypted).not.toEqual(embedding);
  expect(openTemplate(stored.encrypted, { workerId: worker.id, templateVersion: 1, modelVersion: stored.modelVersion }, options.keys.k1)).toEqual(embedding);
  expect((await db.biometricReview.findUnique({ where: { id: stored.reviewId } })).reviewerId).toBe(admin.id);
  const audit = await db.biometricAudit.findMany();
  expect(JSON.stringify(audit)).not.toContain('ciphertext'); expect(JSON.stringify(audit)).not.toContain('base64');
  await expect(session('ENROLLMENT')).rejects.toThrow('TEMPLATE_ALREADY_ENROLLED');
  await expect(db.biometricTemplate.update({ where: { id: stored.id }, data: { modelVersion: 'overwrite' } })).rejects.toThrow();
});
test('professional approval alone or consent without review cannot enroll', async () => {
  await db.biometricReview.updateMany({ data: { revokedAt: new Date() } });
  await expect(session('ENROLLMENT')).rejects.toThrow('IDENTITY_REVIEW_REQUIRED');
  await expect(core.review(user.id, worker.id, {})).rejects.toThrow('ACTIVE_ADMIN_REQUIRED');
});
test('default gateway and data policy remain closed, with no template or capture sent', async () => {
  const actual = new FaceCoreService(db, new FaceEvidenceGateway({}), options);
  await expect(actual.createSession(user.id, { purpose: 'ENROLLMENT', requestKey: randomUUID() })).rejects.toThrow('PAD_NOT_EVALUATED');
  options.captureApproved = false;
  await expect(session('ENROLLMENT')).rejects.toThrow('BIOMETRIC_DATA_POLICY_NOT_APPROVED');
  expect(await db.biometricTemplate.count()).toBe(0); expect(gateway.enroll).not.toHaveBeenCalled();
});
test('duplicate concurrent session request returns same durable session and nonce', async () => {
  const key = randomUUID();
  const sessions = await Promise.all(Array.from({ length: 8 }, () => session('ENROLLMENT', key)));
  expect(new Set(sessions.map(s => s.id)).size).toBe(1); expect(new Set(sessions.map(s => s.nonce)).size).toBe(1);
  expect(await db.biometricSession.count()).toBe(1);
  await expect(core.createSession(user.id, { purpose: 'DAILY', requestKey: key })).rejects.toThrow('IDEMPOTENCY_SCOPE_CONFLICT');
});
test('concurrent enrollment cannot overwrite first committed version', async () => {
  const a = await session('ENROLLMENT'), b = await session('ENROLLMENT');
  const results = await Promise.allSettled([submit(a), submit(b)]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(await db.biometricTemplate.count()).toBe(1); expect((await db.biometricState.findUnique({ where: { workerId: worker.id } })).lastVersion).toBe(1);
});
test('duplicate successful capture returns same proof, changed payload and other nonce rejected', async () => {
  await enroll(); const s = await session('DAILY'); const first = await submit(s), second = await submit(s);
  expect(second.proof.id).toBe(first.proof.id); expect(second.proof.expiresAt).toEqual(first.proof.expiresAt);
  expect(await db.biometricProof.count()).toBe(1);
  await expect(submit(s, photo + 'x')).rejects.toThrow('REPLAY_PAYLOAD_CHANGED');
  const fresh = await session('DAILY');
  await expect(core.submit(user.id, fresh.id, { nonce: s.nonce, photo })).rejects.toThrow('INVALID_NONCE');
});
test('session owned by another worker and wrong-order creation denied', async () => {
  const s = await session('ENROLLMENT');
  const other = await db.user.create({ data: { role: 'WORKER', workerProfile: { create: { approvalStatus: 'APPROVED' } } } });
  await expect(core.submit(other.id, s.id, { nonce: s.nonce, photo })).rejects.toThrow('SESSION_ACCESS_DENIED');
  await db.order.update({ where: { id: order.id }, data: { workerId: other.workerProfile?.id ?? null } });
  await expect(session('ORDER')).rejects.toThrow('ORDER_ACCESS_DENIED');
});
test('timeout consumes retry budget and late evidence never creates template', async () => {
  options.timeoutMs = 15;
  let resolve; gateway.enroll.mockImplementation(() => new Promise(r => { resolve = r; }));
  const s = await session('ENROLLMENT');
  await expect(submit(s)).rejects.toThrow('FACE_EVIDENCE_REJECTED');
  resolve(evidence({ workerId: worker.id, sessionId: s.id, templateVersion: 1 }, true));
  expect(await db.biometricTemplate.count()).toBe(0);
  for (let i = 0; i < 2; i++) await expect(submit(s)).rejects.toThrow('FACE_EVIDENCE_REJECTED');
  await expect(submit(s)).rejects.toThrow('FACE_RATE_LIMITED');
  expect((await db.biometricSession.findUnique({ where: { id: s.id } })).attempts).toBe(3);
});
test.each(['NOT_EVALUATED','INCONCLUSIVE','FAIL'])('PAD %s cannot create template', async padDecision => {
  gateway.enroll.mockImplementation(async input => ({ ...evidence(input, true), padDecision }));
  await expect(enroll()).rejects.toThrow('FACE_EVIDENCE_REJECTED'); expect(await db.biometricTemplate.count()).toBe(0);
});
test('daily proof never substitutes for per-order proof or legacy timestamp', async () => {
  await enroll(); await issue('DAILY');
  await core.workerTx(user.id, (tx, w) => core.requireDaily(tx, w.id));
  const flow = new OrderWorkflowService(db, {}, core);
  await expect(flow.transition(order.id, user.id, 'IN_PROGRESS')).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
  expect((await db.order.findUnique({ where: { id: order.id } })).status).toBe('ARRIVED');
});
test('two concurrent start-work requests consume exactly once in ARC-01 transaction', async () => {
  await enroll(); const proof = (await issue('ORDER')).proof;
  const events = { emitStatusChanged: jest.fn() }, flow = new OrderWorkflowService(db, events, core);
  const results = await Promise.all([flow.transition(order.id, user.id, 'IN_PROGRESS'), flow.transition(order.id, user.id, 'IN_PROGRESS')]);
  expect(results.filter(r => r.changed)).toHaveLength(1); expect(events.emitStatusChanged).toHaveBeenCalledTimes(1);
  expect((await db.biometricProof.findUnique({ where: { id: proof.id } })).consumedAt).not.toBeNull();
  expect(await db.biometricAudit.count({ where: { action: 'ORDER_PROOF_CONSUMED' } })).toBe(1);
  await expect(core.workerTx(user.id, (tx,w) => core.consumeOrder(tx,w.id,order.id))).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
});
test('failed FSM prerequisite rolls back consumption, audit, history and order update', async () => {
  await enroll(); const proof = (await issue('ORDER')).proof;
  await db.orderImage.deleteMany({ where: { orderId: order.id } });
  const events = { emitStatusChanged: jest.fn() }, flow = new OrderWorkflowService(db, events, core);
  await expect(flow.transition(order.id, user.id, 'IN_PROGRESS')).rejects.toThrow('MISSING_BEFORE_PHOTO');
  expect((await db.biometricProof.findUnique({ where: { id: proof.id } })).consumedAt).toBeNull();
  expect(await db.biometricAudit.count({ where: { action: 'ORDER_PROOF_CONSUMED' } })).toBe(0); expect(events.emitStatusChanged).not.toHaveBeenCalled();
});
test('expired session and expired proof are rejected using PostgreSQL time', async () => {
  await enroll(); options.sessionMs = 25;
  const s = await session('DAILY'); await new Promise(r => setTimeout(r, 50));
  await expect(submit(s)).rejects.toThrow('SESSION_EXPIRED_OR_REVOKED');
  options.sessionMs = 120000; options.orderMs = 25;
  await issue('ORDER'); await new Promise(r => setTimeout(r, 50));
  await expect(core.workerTx(user.id, (tx,w) => core.consumeOrder(tx,w.id,order.id))).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
});
test('withdrawal deletes ciphertext and revokes sessions/proofs; re-enrollment increments version', async () => {
  await enroll(); await issue('DAILY'); const stale = await session('ORDER');
  await core.withdraw(user.id);
  expect((await db.biometricTemplate.findFirst()).encrypted).toBeNull();
  expect((await db.biometricTemplate.findFirst()).deletedAt).not.toBeNull();
  await expect(submit(stale)).rejects.toThrow('SESSION_EXPIRED_OR_REVOKED');
  await expect(core.workerTx(user.id, (tx,w) => core.requireDaily(tx,w.id))).rejects.toThrow('DAILY_PROOF_REQUIRED');
  await review('REENROLLMENT'); await core.consent(user.id, options.consentVersion);
  expect((await enroll()).template.version).toBe(2);
});
test('withdraw during inference prevents commit even if delayed gateway returns PASS', async () => {
  let complete, started;
  const ready = new Promise(r => { started = r; });
  gateway.enroll.mockImplementation(input => new Promise(resolve => { complete = () => resolve(evidence(input,true)); started(); }));
  const s = await session('ENROLLMENT'), pending = submit(s);
  await ready; await core.withdraw(user.id); complete();
  await expect(pending).rejects.toThrow('FACE_EVIDENCE_REJECTED'); expect(await db.biometricTemplate.count()).toBe(0);
});
test('cross-instance session quota enforced under row locks', async () => {
  const otherInstance = new FaceCoreService(db, gateway, options);
  const attempts = await Promise.allSettled(Array.from({ length: 10 }, (_,i) => (i % 2 ? core : otherInstance).createSession(user.id, { purpose: 'ENROLLMENT', requestKey: randomUUID() })));
  expect(attempts.filter(r => r.status === 'fulfilled')).toHaveLength(5);
  expect(await db.biometricSession.count()).toBe(5);
});

test('real Nest HTTP review -> consent -> enrollment -> daily/order proof -> withdraw, PostgreSQL-backed', async () => {
  const { Test } = require('@nestjs/testing');
  const request = require('supertest');
  const { FaceCoreController, FaceReviewController } = require('../../src/modules/workers/face/face-core.controller');
  const { FaceReadyGuard } = require('../../src/modules/workers/face/face-ready.guard');
  const { JwtAuthGuard } = require('../../src/modules/auth/guards/jwt-auth.guard');
  const { RolesGuard } = require('../../src/modules/auth/guards/roles.guard');
  const { Reflector } = require('@nestjs/core');
  const module = await Test.createTestingModule({ controllers: [FaceCoreController, FaceReviewController],
    providers: [Reflector, RolesGuard, FaceReadyGuard, { provide: FaceCoreService, useValue: core }] })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: async ctx => {
      // Test-only authentication seam; real RolesGuard and all service authorization run.
      const req = ctx.switchToHttp().getRequest(), actor = await db.user.findUnique({ where: { id: req.headers['x-test-user'] || '' } });
      if (!actor || actor.status !== 'ACTIVE') return false;
      req.user = { userId: actor.id, role: actor.role }; return true;
    } }).compile();
  const app = module.createNestApplication(); await app.init();
  const http = request(app.getHttpServer());
  try {
    await db.biometricReview.deleteMany(); await db.biometricState.deleteMany();
    const reviewBody = { reviewedIdentity: true, kind: 'ENROLLMENT', evidenceReference: 'synthetic:doc', evidenceDigest: 'b'.repeat(64), reason: 'synthetic review', expiresAt: new Date(Date.now()+86400000).toISOString() };
    expect((await http.post(`/admin/workers/${worker.id}/face/identity-reviews`).set('x-test-user', user.id).send(reviewBody)).status).toBe(403);
    expect((await http.post(`/admin/workers/${worker.id}/face/identity-reviews`).set('x-test-user', admin.id).send(reviewBody)).status).toBe(201);
    expect((await http.post('/workers/me/face/consent').set('x-test-user', user.id).send({ consent: true, version: options.consentVersion })).status).toBe(201);
    for (const purpose of ['ENROLLMENT','DAILY','ORDER']) {
      const s = await http.post('/workers/me/face/sessions').set('x-test-user', user.id).send({ purpose, requestKey: randomUUID(), ...(purpose === 'ORDER' ? { orderId: order.id } : {}) });
      expect(s.status).toBe(201);
      const result = await http.post(`/workers/me/face/sessions/${s.body.data.id}/capture`).set('x-test-user', user.id)
        .field('nonce', s.body.data.nonce).attach('image', Buffer.from('synthetic pixels; gateway seam'), { filename: 'synthetic.jpg', contentType: 'image/jpeg' });
      expect(result.status).toBe(201);
      expect(result.body.data[purpose === 'ENROLLMENT' ? 'enrolled' : 'verified']).toBe(true);
    }
    const status = await http.get('/workers/me/face/capabilities').query({ orderId: order.id }).set('x-test-user', user.id);
    expect(status.body.data.enrollmentStatus).toBe('ENROLLED'); expect(status.body.data.dailyProof.purpose).toBe('DAILY');
    expect(status.body.data.orderProof.orderId).toBe(order.id);
    expect((await http.post('/workers/me/face/sessions').set('x-test-user', user.id).send({ purpose: 'DAILY', requestKey: randomUUID(), templateEmbedding: embedding })).status).toBe(400);
    expect((await http.delete('/workers/me/face/template').set('x-test-user', user.id)).status).toBe(200);
    expect((await db.biometricTemplate.findFirst()).encrypted).toBeNull();
  } finally { await app.close(); }
});

test('multipart preguard rejects unavailable PAD before evidence gateway runs', async () => {
  const { FaceReadyGuard } = require('../../src/modules/workers/face/face-ready.guard');
  const actual = new FaceCoreService(db, new FaceEvidenceGateway({}), options);
  const guard = new FaceReadyGuard(actual);
  await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ user: { userId: user.id }, params: { id: randomUUID() } }) }) })).rejects.toThrow('PAD_NOT_EVALUATED');
  expect(gateway.enroll).not.toHaveBeenCalled();
});

test('stored key ID survives rotation; missing retired key cannot grant new proof', async () => {
  await enroll(); options.keys.k2 = randomBytes(32); options.currentKeyId = 'k2';
  await issue('DAILY'); expect(await db.biometricProof.count()).toBe(1);
  delete options.keys.k1;
  await expect(issue('DAILY')).rejects.toThrow('FACE_EVIDENCE_REJECTED');
  expect(await db.biometricProof.count()).toBe(1);
});
test.each([{ identityScore: NaN }, { verificationMethod: 'manual_review' }, { padModelVersion: 'unapproved' },
  { templateVersion: 99 }, { qualityDecision: 'FAIL' }])('invalid result %j cannot persist proof', async change => {
  await enroll(); gateway.verify.mockImplementation(async input => ({ ...evidence(input), ...change }));
  await expect(issue('DAILY')).rejects.toThrow('FACE_EVIDENCE_REJECTED'); expect(await db.biometricProof.count()).toBe(0);
});

test('one order proof cannot be consumed for a second assigned order', async () => {
  await enroll(); const proof = (await issue('ORDER')).proof;
  const other = await db.order.create({ data: { workerId: worker.id, customerId: customer.id, categoryId: order.categoryId, status: 'ARRIVED', addressText: 'Synthetic second', lat: 10, lng: 106, estimatedPrice: 100000 } });
  await expect(core.workerTx(user.id, (tx,w) => core.consumeOrder(tx,w.id,other.id))).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
  expect((await db.biometricProof.findUnique({ where: { id: proof.id } })).consumedAt).toBeNull();
});

test('Admin start retains permission while consuming proof under worker lock with correct audit actor', async () => {
  await enroll(); await issue('ORDER');
  const flow = new OrderWorkflowService(db, { emitStatusChanged: jest.fn() }, core);
  expect((await flow.transition(order.id, admin.id, 'IN_PROGRESS')).changed).toBe(true);
  expect((await db.biometricAudit.findFirst({ where: { action: 'ORDER_PROOF_CONSUMED' } })).actorId).toBe(admin.id);
});

test('durable proof with wrong template version is never trusted', async () => {
  await enroll(); const result = await issue('DAILY');
  await expect(db.biometricProof.update({ where: { id: result.proof.id }, data: { templateVersion: 2 } })).rejects.toThrow();
  expect((await core.status(user.id)).dailyProof.id).toBe(result.proof.id);
});

test('blocking worker invalidates authorization from an otherwise current order proof even for Admin start', async () => {
  await enroll(); const proof = (await issue('ORDER')).proof;
  await db.user.update({ where: { id: user.id }, data: { status: 'BLOCKED' } });
  const flow = new OrderWorkflowService(db, { emitStatusChanged: jest.fn() }, core);
  await expect(flow.transition(order.id, admin.id, 'IN_PROGRESS')).rejects.toThrow('APPROVED_ACTIVE_WORKER_REQUIRED');
  expect((await db.biometricProof.findUnique({ where: { id: proof.id } })).consumedAt).toBeNull();
});

// Migration hardening: direct DML exercises constraints as defense against writer bugs.
test.each(['userId','reviewId','templateVersion','epoch','modelVersion','templateId'])('DB rejects session binding mismatch %s', async field => {
  await enroll(); const s = await session('DAILY');
  const saved = await db.biometricSession.findUnique({ where: { id: s.id } });
  const other = await db.user.create({ data: { role: 'WORKER', workerProfile: { create: { approvalStatus: 'APPROVED' } } }, include: { workerProfile: true } });
  const otherCore = new FaceCoreService(db,gateway,options);
  const otherReview = await otherCore.review(admin.id,other.workerProfile.id,{kind:'ENROLLMENT',reviewedIdentity:true,evidenceReference:'synthetic:other',evidenceDigest:'c'.repeat(64),reason:'synthetic',expiresAt:new Date(Date.now()+86400000).toISOString()});
  const changes = { userId: other.id, reviewId: otherReview.id, templateVersion: 999, epoch: 999, modelVersion: 'other-model', templateId: null };
  await expect(db.biometricSession.create({ data: { ...saved, id: randomUUID(), requestKey: randomUUID(), [field]: changes[field] } })).rejects.toThrow();
  expect(await db.biometricSession.count()).toBe(2);
});
test.each(['workerId','purpose','epoch','templateVersion','modelVersion','orderId'])('DB rejects proof binding mismatch %s', async field => {
  await enroll(); const original = (await issue('ORDER')).proof;
  const saved = await db.biometricProof.findUnique({ where: { id: original.id } });
  const otherOrder = await db.order.create({ data: { workerId: worker.id, customerId: customer.id, categoryId: order.categoryId, status: 'ARRIVED', addressText:'synthetic',lat:0,lng:0,estimatedPrice:1 } });
  const changes = { workerId: randomUUID(), purpose:'DAILY', epoch:999, templateVersion:999, modelVersion:'other-model', orderId:otherOrder.id };
  await expect(db.$transaction(async tx => {
    await tx.biometricProof.delete({ where: { id: original.id } });
    await tx.biometricProof.create({ data: { ...saved, id:randomUUID(), [field]:changes[field], ...(field==='purpose'?{orderId:null}:{}) } });
  })).rejects.toThrow();
  expect((await db.biometricProof.findUnique({ where: { id:original.id } })).consumedAt).toBeNull();
});
test('DB forbids proof issuance for pending session', async () => {
  await enroll(); const p = (await issue('DAILY')).proof, pending = await session('DAILY');
  const saved = await db.biometricProof.findUnique({where:{id:p.id}});
  await expect(db.biometricProof.create({data:{...saved,id:randomUUID(),sessionId:pending.id}})).rejects.toThrow('BIOMETRIC_PROOF_AUTHORITY_INVALID');
  expect(await db.biometricProof.count()).toBe(1);
});
test.each(['session','proof'])('Order hard-delete is explicitly RESTRICTED with %s evidence', async stage => {
  await enroll(); const s = await session('ORDER'); if(stage==='proof') await submit(s);
  await expect(db.order.delete({where:{id:order.id}})).rejects.toMatchObject({code:'P2003'});
  expect(await db.order.findUnique({where:{id:order.id}})).not.toBeNull();
  expect((await db.biometricSession.findUnique({where:{id:s.id}})).orderId).toBe(order.id);
});
test('Order without biometric history remains hard-deletable', async () => {
  await db.order.delete({where:{id:order.id}}); expect(await db.order.findUnique({where:{id:order.id}})).toBeNull();
});
test.each(['purpose','nonceHash','expiresAt','epoch'])('session scope cannot be rewritten: %s', async field => {
  const s = await session('ENROLLMENT');
  const changes={purpose:'DAILY',nonceHash:'b'.repeat(64),expiresAt:new Date(Date.now()+600000),epoch:999};
  await expect(db.biometricSession.update({where:{id:s.id},data:{[field]:changes[field]}})).rejects.toThrow('BIOMETRIC_SESSION_IMMUTABLE');
});
test('proof cannot extend TTL, retarget scope or undo consumption', async () => {
  await enroll(); const p=(await issue('ORDER')).proof;
  await expect(db.biometricProof.update({where:{id:p.id},data:{expiresAt:new Date(Date.now()+86400000)}})).rejects.toThrow('BIOMETRIC_PROOF_IMMUTABLE');
  await core.workerTx(user.id,(tx,w)=>core.consumeOrder(tx,w.id,order.id));
  await expect(db.biometricProof.update({where:{id:p.id},data:{consumedAt:null}})).rejects.toThrow('BIOMETRIC_PROOF_IMMUTABLE');
});
test('epoch fence makes historical template/proof unusable without rewriting their history', async () => {
  await enroll(); await issue('DAILY');
  await db.biometricState.update({where:{workerId:worker.id},data:{epoch:{increment:1}}});
  await expect(core.workerTx(user.id,(tx,w)=>core.requireDaily(tx,w.id))).rejects.toThrow('DAILY_PROOF_REQUIRED');
  expect((await core.status(user.id)).dailyProof).toBeNull();
  await expect(db.biometricState.update({where:{workerId:worker.id},data:{epoch:0}})).rejects.toThrow('BIOMETRIC_STATE_REGRESSION');
});
test('ciphertext erasure cannot be reversed or replaced with JSON null', async () => {
  await enroll(); const t=await db.biometricTemplate.findFirst();
  await core.withdraw(user.id);
  await expect(db.biometricTemplate.update({where:{id:t.id},data:{encrypted:t.encrypted,deletedAt:null,revokedAt:null}})).rejects.toThrow();
  expect((await db.biometricTemplate.findUnique({where:{id:t.id}})).encrypted).toBeNull();
});
test('template cannot bind a revoked review', async () => {
  await enroll(); const t=await db.biometricTemplate.findFirst();
  await db.biometricReview.update({where:{id:t.reviewId},data:{revokedAt:new Date()}});
  await expect(db.biometricTemplate.create({data:{...t,id:randomUUID(),version:2}})).rejects.toThrow('BIOMETRIC_TEMPLATE_AUTHORITY_INVALID');
});

test('template cannot bind review belonging to another worker', async () => {
  await enroll(); const t=await db.biometricTemplate.findFirst();
  const other=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
  const review=await core.review(admin.id,other.workerProfile.id,{kind:'ENROLLMENT',reviewedIdentity:true,evidenceReference:'synthetic:other',evidenceDigest:'d'.repeat(64),reason:'synthetic',expiresAt:new Date(Date.now()+86400000).toISOString()});
  await expect(db.biometricTemplate.create({data:{...t,id:randomUUID(),version:2,reviewId:review.id}})).rejects.toThrow('BIOMETRIC_TEMPLATE_AUTHORITY_INVALID');
});
test.each([Prisma.JsonNull,{format:null,iv:'a',tag:'a',ciphertext:'a'},{format:'sface-aes256gcm-v1',iv:123,tag:'a',ciphertext:'a'}])('DB rejects malformed encrypted envelope %#', async encrypted => {
  await enroll(); const t=await db.biometricTemplate.findFirst();
  await expect(db.biometricTemplate.create({data:{...t,id:randomUUID(),version:2,encrypted}})).rejects.toThrow();
  expect(await db.biometricTemplate.count()).toBe(1);
});
test('review record cannot name non-Admin as approving reviewer', async () => {
  const r=await db.biometricReview.findFirst();
  await expect(db.biometricReview.create({data:{...r,id:randomUUID(),reviewerId:user.id}})).rejects.toThrow('BIOMETRIC_REVIEW_AUTHORITY_INVALID');
});
test('persisted envelope with old AAD cannot verify as a newer version', async () => {
  await enroll(); const old=await db.biometricTemplate.findFirst();
  const r=await review('REENROLLMENT');
  await db.biometricTemplate.create({data:{...old,id:randomUUID(),version:2,epoch:1,reviewId:r.id,revokedAt:null,deletedAt:null,createdAt:new Date()}});
  await db.biometricState.update({where:{workerId:worker.id},data:{lastVersion:2}});
  await expect(issue('DAILY')).rejects.toThrow('FACE_EVIDENCE_REJECTED');
  expect(await db.biometricProof.count()).toBe(0);
});

test('historical proof cannot be consumed after order assignment changes', async () => {
  await enroll(); const p=(await issue('ORDER')).proof;
  const other=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
  await db.order.update({where:{id:order.id},data:{workerId:other.workerProfile.id}});
  await expect(core.workerTx(user.id,(tx,w)=>core.consumeOrder(tx,w.id,order.id))).rejects.toThrow('ORDER_ACCESS_DENIED');
  expect((await db.biometricProof.findUnique({where:{id:p.id}})).consumedAt).toBeNull();
});
test('DB session/proof insertion checks current order owner without rewriting historical evidence', async () => {
  await enroll(); const p=(await issue('ORDER')).proof;
  const source=await db.biometricProof.findUnique({where:{id:p.id}});
  const sourceSession=await db.biometricSession.findUnique({where:{id:source.sessionId}});
  const other=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
  await db.order.update({where:{id:order.id},data:{workerId:other.workerProfile.id}});
  await expect(db.biometricSession.create({data:{...sourceSession,id:randomUUID(),requestKey:randomUUID(),state:'PENDING',attempts:0,consumedAt:null}})).rejects.toThrow('BIOMETRIC_ORDER_AUTHORITY_INVALID');
  await expect(db.$transaction(async tx=>{await tx.biometricProof.delete({where:{id:p.id}});await tx.biometricProof.create({data:{...source,id:randomUUID()}});})).rejects.toThrow('BIOMETRIC_ORDER_AUTHORITY_INVALID');
  expect((await db.biometricProof.findUnique({where:{id:p.id}})).workerId).toBe(worker.id);
});

test('duplicate completed submission never reports success for an expired proof', async () => {
  await enroll(); options.dailyMs=25;
  const s=await session('DAILY'); const result=await submit(s);
  await new Promise(r=>setTimeout(r,50));
  await expect(submit(s)).rejects.toThrow('PROOF_EXPIRED_OR_CONSUMED');
  expect(await db.biometricProof.count()).toBe(1);
  expect((await db.biometricProof.findUnique({where:{id:result.proof.id}})).expiresAt).toEqual(result.proof.expiresAt);
});
test('duplicate order result is denied after assignment change', async () => {
  await enroll(); const s=await session('ORDER'); await submit(s);
  const other=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
  await db.order.update({where:{id:order.id},data:{workerId:other.workerProfile.id}});
  await expect(submit(s)).rejects.toThrow('ORDER_ACCESS_DENIED');
  expect(await db.biometricProof.count()).toBe(1);
});
