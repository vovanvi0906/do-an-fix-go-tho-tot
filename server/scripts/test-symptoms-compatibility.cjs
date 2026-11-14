// Runs EXISTING Face/ARC-01 regressions after the additive symptom migration.
// No .env; only a runner-owned disposable container. No security code changes.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
const root = resolve(__dirname, '..');
const container = `fixgo-symptom-compat-${randomUUID()}`;
const temp = mkdtempSync(join(tmpdir(), 'fixgo-symptom-compat-'));
let created = false;
function run(command, args, options = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (r.status !== 0) throw new Error(`${command}: ${(r.stderr || r.stdout || '').slice(-7000)}`);
  return r.stdout;
}
function sql(input) { return run('docker', ['exec', '-i', container, 'psql', '-U', 'face_test', '-d', 'fixgo_face_test', '-v', 'ON_ERROR_STOP=1'], { input }); }
try {
  run('docker', ['run', '-d', '--rm', '--name', container, '-e', 'POSTGRES_DB=fixgo_face_test', '-e', 'POSTGRES_USER=face_test', '-e', 'POSTGRES_PASSWORD=disposable-compat-only', '-p', '127.0.0.1::5432', 'postgis/postgis:16-3.4-alpine']); created = true;
  const port = run('docker', ['port', container, '5432']).trim().split(':').pop();
  if (!/^\d+$/.test(port)) throw new Error('Missing disposable port');
  const url = `postgresql://face_test:disposable-compat-only@127.0.0.1:${port}/fixgo_face_test?schema=public`;
  const env = { ...process.env, DATABASE_URL: url, FACE_TEST_DATABASE_URL: url, ARC01_TEST_DATABASE_URL: url, FACE_CORE_ENABLED: 'false', SYMPTOM_CATALOG_ENABLED: 'true' };
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (spawnSync('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'face_test', '-d', 'fixgo_face_test']).status === 0) { ready = true; break; }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  if (!ready) throw new Error('Disposable database did not start');
  writeFileSync(join(temp, 'baseline.prisma'), run('git', ['show', '9e77da5:server/prisma/schema.prisma']));
  let baseline = run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', join(temp, 'baseline.prisma'), '--script'], { env });
  baseline = baseline.replace(/CREATE TABLE "spatial_ref_sys" \([\s\S]*?\);/g, '');
  sql(baseline);
  for (const name of ['20261113190000_face_core_v2', '20261113200000_face_binding_hardening', '20261114000000_symptom_catalog_v3']) sql(readFileSync(join(root, 'prisma/migrations', name, 'migration.sql'), 'utf8'));
  run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-url', url, '--to-schema-datamodel', 'prisma/schema.prisma', '--script', '--exit-code'], { env });
  const triggers = sql("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'biometric_%';");
  for (const name of ['biometric_template_immutable', 'biometric_review_authority', 'biometric_template_authority', 'biometric_session_immutable', 'biometric_proof_guard', 'biometric_state_monotonic', 'biometric_session_authority']) if (!triggers.includes(name)) throw new Error(`Missing existing Face SQL guard: ${name}`);
  run(process.execPath, ['node_modules/jest/bin/jest.js', '--config', 'test/face/jest.config.cjs', '--runInBand'], { env, stdio: 'inherit' });
  run(process.execPath, ['node_modules/jest/bin/jest.js', '--config', 'test/jest-arc01.config.cjs', '--runInBand'], { env, stdio: 'inherit' });
  console.log('PASS: existing Face Core/PostgreSQL guards and ARC-01 tests after symptom migration; no production/PAD inference claim.');
} finally {
  if (created) spawnSync('docker', ['rm', '-f', container], { encoding: 'utf8' });
}
