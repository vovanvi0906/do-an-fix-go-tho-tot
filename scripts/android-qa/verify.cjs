const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, dir, run, load, identity, privateWrite } = require('./common.cjs');
const { PrismaClient } = require(path.join(root, 'server/node_modules/@prisma/client'));
const Redis = require(path.join(root, 'server/node_modules/ioredis'));
(async () => {
  const config = load(), db = new PrismaClient({ datasourceUrl: config.env.DATABASE_URL });
  const result = { checkedAt: new Date().toISOString(), serial: config.serial, database: '127.0.0.1:55440/fixgo_android_qa', redis: '127.0.0.1:56381', featureFlag: config.env.SYMPTOM_CATALOG_ENABLED === 'true', checks: {} };
  const check = (name, ok) => { result.checks[name] = ok ? 'PASS' : 'FAIL'; if (!ok) throw new Error(name); };
  const json = async (url, options) => { const r = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) }); return { status: r.status, data: await r.json() }; };
  try {
    await identity(db);
    const metadata = await db.$transaction(async tx => { await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY'); return tx.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('symptoms','symptom_services','symptom_catalog_audits','registration_proofs','biometric_proofs','biometric_sessions')`; });
    check('schemaDependencies', metadata.length === 6);
    check('noFaceProofOrTemplates', await db.biometricProof.count() === 0 && await db.biometricTemplate.count() === 0 && await db.biometricReview.count() === 0);
    check('faceFlagsClosed', config.env.FACE_CORE_ENABLED === 'false' && config.env.FACE_BIOMETRIC_CAPTURE_APPROVED === 'false');
    const redis = new Redis(config.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    try { check('redisPing', await redis.ping() === 'PONG'); } finally { await redis.quit(); }
    const health = await json('http://127.0.0.1:3000/api/health'); check('backendHealth', health.status === 200 && health.data.status === 'ok');
    const swagger = await json('http://127.0.0.1:3000/api/docs-json'); check('backendSwagger', swagger.status === 200 && !!swagger.data.paths['/api/admin/symptoms']);
    const ai = await json('http://127.0.0.1:8000/openapi.json'); check('aiV2Registered', ai.status === 200 && !!ai.data.paths['/ai/v2/diagnose']?.post);
    const face = await json('http://127.0.0.1:8000/ai/face-capabilities', { headers: { 'x-face-service-token': config.env.AI_FACE_SERVICE_TOKEN } });
    check('padRemainsNotEvaluated', face.status === 200 && face.data.padEvaluated === false && face.data.padDecision === 'NOT_EVALUATED');
    const probe = await json('http://127.0.0.1:8000/ai/v2/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'QA route contract probe; no image and no accuracy claim' }) });
    check('aiV2HttpContract', probe.status === 200 && probe.data.suggestedCategoryId === null);
    const categories = await json('http://127.0.0.1:3000/api/service-categories'); check('catalogCategories', categories.status === 200 && categories.data.some(c => c.id === 'android-qa-cold'));
    const targets = await json('http://127.0.0.1:3000/api/service-targets?categoryId=android-qa-cold'); check('catalogTargets', targets.status === 200 && targets.data.length === 2);
    const targetId = 'android-qa-tu-lanh-tu-lanh-side-by-side';
    const services = await json(`http://127.0.0.1:3000/api/services?categoryId=android-qa-cold&targetId=${targetId}&page=1&limit=3`);
    check('catalogServicePaging', services.status === 200 && services.data.items.length === 2 && services.data.items.every(s => s.targetId === targetId));
    const symptoms = await json(`http://127.0.0.1:3000/api/service-targets/${targetId}/symptoms`); check('symptomFeatureGate', config.env.SYMPTOM_CATALOG_ENABLED === 'true' ? symptoms.status === 200 : symptoms.status === 503 && symptoms.data.code === 'SYMPTOM_CATALOG_NOT_ENABLED');
    const before = await db.order.count();
    const diagnosis = await json('http://127.0.0.1:3000/api/orders/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: 'https://example.invalid/qa-not-downloaded.jpg', answers: { categoryId: 'android-qa-cold', targetId, serviceId: 'android-qa-sua-tu-lanh-khong-lanh' } }) });
    check('manualDiagnosisDbPrice', diagnosis.status === 201 && diagnosis.data.suggestedServiceId === 'android-qa-sua-tu-lanh-khong-lanh' && diagnosis.data.estimatedPriceMin === 100000);
    check('diagnosisDidNotCreateOrder', await db.order.count() === before);
    const mismatch = await json('http://127.0.0.1:3000/api/orders/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: 'https://example.invalid/qa-only.jpg', answers: { categoryId: 'android-qa-cold', targetId: 'not-a-qa-target' } }) }); check('targetMismatchRejected', mismatch.status === 400);
    for (const role of ['customer', 'worker', 'admin']) {
      const login = await json('http://127.0.0.1:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: config.accounts[role], password: config.accounts.password }) });
      const token = login.data.access_token || login.data.accessToken || login.data.data?.accessToken;
      check(`${role}PasswordLogin`, login.status >= 200 && login.status < 300 && !!token);
    }
    for (const port of [8081, 8082]) { const r = await fetch(`http://127.0.0.1:${port}/status`); check(`metro${port}`, r.ok && (await r.text()).includes('packager-status:running')); }
    check('vivoReady', run('adb', ['-s', config.serial, 'get-state']).trim() === 'device');
    const reverse = run('adb', ['-s', config.serial, 'reverse', '--list']);
    check('adbReverse', [3000, 8081, 8082].every(p => reverse.includes(`tcp:${p} tcp:${p}`)));
    const protectedBefore = JSON.parse(fs.readFileSync(path.join(dir, 'protected-before.json'), 'utf8'));
    for (const [file, hash] of Object.entries(protectedBefore.files)) check(`unchanged:${file}`, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') === hash);
    for (const [name, id] of Object.entries(protectedBefore.containers)) check(`unchanged:${name}`, JSON.parse(run('docker', ['inspect', name]))[0].Id === id);
    result.nativeAndroidAcceptance = 'NOT_RUN'; result.cloudImageUpload = 'BLOCKED_QA_CREDENTIALS_NOT_CONFIGURED';
    privateWrite('verification.json', JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally { await db.$disconnect(); }
})().catch(error => { console.error('QA_VERIFY_FAILED', error.code || error.message); process.exitCode = 1; });
