// Creates/initializes only labelled QA containers. Never loads server/.env or project data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { root, dir, pgName, redisName, run, load, env, identity, privateWrite } = require('./common.cjs');
const { PrismaClient } = require(path.join(root, 'server/node_modules/@prisma/client'));
const bcrypt = require(path.join(root, 'server/node_modules/bcrypt'));
const token = () => crypto.randomBytes(24).toString('hex');
function ensureContainer(name, args) {
  const exists = spawnSync('docker', ['inspect', name], { encoding: 'utf8' });
  if (exists.status === 0) {
    const c = JSON.parse(exists.stdout)[0];
    if (c.Config.Labels?.['fixgo.android-qa'] !== 'true') throw new Error('QA_CONTAINER_OWNERSHIP_OR_STATE_MISMATCH');
    if (!c.State.Running) run('docker', ['start', name]);
    return;
  }
  run('docker', ['run', '-d', '--name', name, '--label', 'fixgo.android-qa=true', ...args]);
}
function ready(name, args) {
  for (let i = 0; i < 100; i++) {
    if (spawnSync('docker', ['exec', name, ...args], { stdio: 'ignore' }).status === 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  throw new Error('QA_CONTAINER_NOT_READY');
}
(async () => {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); fs.chmodSync(dir, 0o700);
  if (!fs.existsSync(path.join(dir, 'runtime.json'))) {
    const password = token();
    const config = { serial: '10HF8GFBU200050', accounts: { password: token(), customer: 'customer.android.qa@example.invalid', worker: 'worker.android.qa@example.invalid', admin: 'admin.android.qa@example.invalid' }, env: {
      DATABASE_URL: `postgresql://fixgo_android_qa:${password}@127.0.0.1:55440/fixgo_android_qa`,
      REDIS_URL: 'redis://127.0.0.1:56381/0', REDIS_HOST: '127.0.0.1', REDIS_PORT: '56381',
      PORT: '3000', NODE_ENV: 'development', JWT_SECRET: token(), JWT_REFRESH_SECRET: token(),
      AI_SERVICE_URL: 'http://127.0.0.1:8000', FASTAPI_AI_URL: 'http://127.0.0.1:8000', BACKEND_API_URL: 'http://127.0.0.1:3000/api',
      AI_FACE_SERVICE_TOKEN: token(), FACE_MODEL_DIR: path.join(root, 'ai-service/weights'),
      FACE_CORE_ENABLED: 'false', FACE_BIOMETRIC_CAPTURE_APPROVED: 'false', FACE_TEMPLATE_KEYS_JSON: '{}', FACE_TEMPLATE_KEY_ID: '', FACE_NONCE_KEY_BASE64: '',
      SYMPTOM_CATALOG_ENABLED: 'false',
      CLOUDINARY_CLOUD_NAME: 'fixgo-qa-disabled', CLOUDINARY_API_KEY: 'qa-disabled', CLOUDINARY_API_SECRET: 'qa-disabled',
      FIREBASE_PROJECT_ID: 'fixgo-android-qa', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9',
      ESMS_API_URL: 'http://127.0.0.1:9/qa-disabled', SMTP_HOST: '127.0.0.1', SMTP_PORT: '9',
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3000/api', EXPO_PUBLIC_SOCKET_URL: 'http://127.0.0.1:3000', FACE_RESEARCH_APP: 'false',
    } };
    privateWrite('runtime.json', JSON.stringify(config, null, 2) + '\n');
    privateWrite('.env', Object.entries(config.env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n');
    privateWrite('accounts.txt', `QA ONLY — no production identity or proof\nCustomer: ${config.accounts.customer}\nWorker: ${config.accounts.worker}\nAdmin: ${config.accounts.admin}\nPassword: ${config.accounts.password}\n`);
  }
  const config = load(), qaEnv = env(config), pgPassword = new URL(config.env.DATABASE_URL).password;
  ensureContainer(pgName, ['-p', '127.0.0.1:55440:5432', '-e', 'POSTGRES_DB=fixgo_android_qa', '-e', 'POSTGRES_USER=fixgo_android_qa', '-e', `POSTGRES_PASSWORD=${pgPassword}`, 'postgis/postgis:16-3.4-alpine']);
  ensureContainer(redisName, ['-p', '127.0.0.1:56381:6379', 'redis:7-alpine']);
  ready(pgName, ['pg_isready', '-h', '127.0.0.1', '-U', 'fixgo_android_qa', '-d', 'fixgo_android_qa']);
  ready(redisName, ['redis-cli', 'ping']);
  const db = new PrismaClient({ datasourceUrl: config.env.DATABASE_URL });
  try {
    await identity(db);
    const [tables] = await db.$queryRaw`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name NOT IN ('spatial_ref_sys')`;
    if (tables.count === 0) {
      const baseline = path.join(dir, 'baseline.prisma'), baselineSql = path.join(dir, 'baseline.sql');
      privateWrite('baseline.prisma', run('git', ['show', '9e77da5:server/prisma/schema.prisma']));
      run(process.execPath, [path.join(root, 'server/node_modules/prisma/build/index.js'), 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', baseline, '--script', '--output', baselineSql], { cwd: path.join(root, 'server'), env: qaEnv });
      let sql = fs.readFileSync(baselineSql, 'utf8').replace(/CREATE TABLE "spatial_ref_sys" \([\s\S]*?\);/g, '');
      const sources = ['20261113190000_face_core_v2', '20261113200000_face_binding_hardening', '20261114000000_symptom_catalog_v3'];
      for (const name of sources) sql += '\n' + fs.readFileSync(path.join(root, 'server/prisma/migrations', name, 'migration.sql'), 'utf8');
      const result = spawnSync('docker', ['exec', '-i', pgName, 'psql', '-U', 'fixgo_android_qa', '-d', 'fixgo_android_qa', '-v', 'ON_ERROR_STOP=1'], { input: sql, encoding: 'utf8' });
      privateWrite('schema-apply.log', (result.stdout || '') + (result.stderr || ''));
      if (result.status !== 0) throw new Error('QA_SCHEMA_APPLY_FAILED_SEE_PRIVATE_LOG');
      privateWrite('schema-history.json', JSON.stringify({ baseline: '9e77da5:server/prisma/schema.prisma', baselineSha256: crypto.createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'), migrations: sources.map(name => ({ name, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'server/prisma/migrations', name, 'migration.sql'))).digest('hex') })) }, null, 2));
    } else if (!fs.existsSync(path.join(dir, 'schema-history.json'))) throw new Error('REFUSE_UNTRACKED_QA_SCHEMA_NO_RESET');
    run(process.execPath, [path.join(root, 'server/node_modules/prisma/build/index.js'), 'migrate', 'diff', '--from-url', config.env.DATABASE_URL, '--to-schema-datamodel', path.join(root, 'server/prisma/schema.prisma'), '--script', '--exit-code'], { env: qaEnv });
    const triggers = await db.$queryRaw`SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'biometric_%'`;
    for (const name of ['biometric_template_immutable', 'biometric_review_authority', 'biometric_template_authority', 'biometric_session_immutable', 'biometric_proof_guard', 'biometric_state_monotonic', 'biometric_session_authority']) if (!triggers.some(t => t.tgname === name)) throw new Error('MISSING_EXISTING_FACE_SQL_GUARD');
    if (!(await db.user.count())) {
      await db.$transaction(async tx => {
        const passwordHash = await bcrypt.hash(config.accounts.password, 10);
        for (const role of ['CUSTOMER', 'WORKER', 'ADMIN']) {
          const email = config.accounts[role.toLowerCase()];
          const user = await tx.user.create({ data: { id: `android-qa-${role.toLowerCase()}`, email, name: `QA synthetic ${role}`, passwordHash, role, status: 'ACTIVE' } });
          if (role === 'CUSTOMER') {
            const customer = await tx.customerProfile.create({ data: { userId: user.id, fullName: 'QA Synthetic Customer' } });
            await tx.address.create({ data: { customerId: customer.id, title: 'QA synthetic location', street: 'Địa chỉ giả lập QA — không điều phối thực', latitude: 10.7769, longitude: 106.7009, isDefault: true } });
          }
          if (role === 'WORKER') await tx.workerProfile.create({ data: { userId: user.id, fullName: 'QA Synthetic Worker', isOnline: false, approvalStatus: 'DRAFT', kycStatus: 'PENDING', idCardVerified: false, faceVerifiedAt: null } });
        }
        const category = await tx.serviceCategory.create({ data: { id: 'android-qa-cold', name: 'Điện lạnh (QA)', slug: 'dien-lanh', basePrice: 100000, description: 'Catalog giả lập cho Android QA, không dùng điều phối thực.' } });
        for (const [slug, label] of [['tu-lanh-tu-lanh-side-by-side', 'Tủ lạnh (QA)'], ['may-giat-may-giat-say', 'Máy giặt (QA)']]) {
          const target = await tx.serviceTarget.create({ data: { id: `android-qa-${slug}`, categoryId: category.id, slug, name: label, aiPrompts: [slug.startsWith('tu-lanh') ? 'a photo of a refrigerator appliance' : 'a photo of a washing machine appliance'] } });
          const choices = slug.startsWith('tu-lanh') ? [['sua-ngan-mat-dong-tuyet', 'Kiểm tra ngăn mát đóng tuyết (QA)', 'fridge_frost'], ['sua-tu-lanh-khong-lanh', 'Kiểm tra tủ lạnh không lạnh (QA)', 'fridge_weak']] : [['sua-may-giat-khong-vat', 'Kiểm tra máy giặt không vắt (QA)', 'washer_spin']];
          for (const [serviceSlug, name, code] of choices) {
            const service = await tx.service.create({ data: { id: `android-qa-${serviceSlug}`, categoryId: category.id, targetId: target.id, slug: serviceSlug, name, description: 'Dịch vụ giả lập cho QA; giá fixture từ database, không phải giá AI hoặc báo giá thật.', basePrice: 100000, unit: 'lần' } });
            const symptom = await tx.symptom.create({ data: { targetId: target.id, code, name: `DRAFT QA: ${name}`, kind: 'USER_REPORTED', reviewStatus: 'NEEDS_REVIEW', isActive: false, createdBy: 'android-qa-admin', updatedBy: 'android-qa-admin' } });
            await tx.symptomService.create({ data: { symptomId: symptom.id, serviceId: service.id, targetId: target.id, reviewStatus: 'NEEDS_REVIEW', isActive: false, createdBy: 'android-qa-admin', updatedBy: 'android-qa-admin' } });
          }
        }
      });
    }
    if (await db.biometricProof.count() || await db.biometricTemplate.count() || await db.biometricReview.count()) throw new Error('QA_MUST_NOT_CONTAIN_SYNTHETIC_FACE_AUTHORITY');
    console.log('PASS: isolated QA PostgreSQL + Redis, full schema + existing Face SQL guards, synthetic accounts/catalog and unapproved symptom drafts. Feature remains false.');
    console.log(`Private config/accounts: ${dir} (not tracked).`);
  } finally { await db.$disconnect(); }
})().catch(error => { console.error(error.message?.includes('failed') ? error.message : error.code || error.message); process.exitCode = 1; });
