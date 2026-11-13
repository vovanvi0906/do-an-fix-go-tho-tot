// Creates ONLY a disposable owned container. Never reads .env or defaults to DATABASE_URL.
const { spawnSync } = require('child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const { resolve, join } = require('path');
const { randomUUID } = require('crypto');
const root = resolve(__dirname, '../..');
const container = `fixgo-face-test-${randomUUID()}`;
const temp = mkdtempSync(join(tmpdir(), 'fixgo-face-'));
let created = false;
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || r.stdout || '').slice(-5000)}`);
  return r.stdout;
}
function sql(input) { return run('docker', ['exec', '-i', container, 'psql', '-U', 'face_test', '-d', 'fixgo_face_test', '-v', 'ON_ERROR_STOP=1'], { input }); }
try {
  run('docker', ['run', '-d', '--rm', '--name', container, '-e', 'POSTGRES_DB=fixgo_face_test', '-e', 'POSTGRES_USER=face_test', '-e', 'POSTGRES_PASSWORD=synthetic-face-only', '-p', '127.0.0.1::5432', 'postgis/postgis:16-3.4']); created = true;
  const port = run('docker', ['port', container, '5432']).trim().split(':').pop();
  if (!/^\d+$/.test(port)) throw new Error('Isolated port missing');
  const url = `postgresql://face_test:synthetic-face-only@127.0.0.1:${port}/fixgo_face_test?schema=public`;
  const env = { ...process.env, DATABASE_URL: url, FACE_TEST_DATABASE_URL: url, FACE_CORE_ENABLED: 'false' };
  let ready = false;
  for (let i = 0; i < 50; i++) {
    const r = spawnSync('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'face_test', '-d', 'fixgo_face_test']);
    if (r.status === 0) { ready = true; break; }
    // Short bounded wait, not a production server or database.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  if (!ready) throw new Error('Disposable PostgreSQL did not start');
  writeFileSync(join(temp, 'baseline.prisma'), run('git', ['show', 'f6737fd:server/prisma/schema.prisma']));
  let baseline = run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', join(temp, 'baseline.prisma'), '--script'], { env });
  // PostGIS owns this table and creates it with the extension, before application DDL.
  baseline = baseline.replace(/CREATE TABLE "spatial_ref_sys" \([\s\S]*?\);/g, '');
  sql(baseline);
  const migration = readFileSync(join(root, 'prisma/migrations/20261113190000_face_core_v2/migration.sql'), 'utf8');
  sql(`BEGIN;\n${migration}\nCOMMIT;`);
  const first = run(process.execPath, ['node_modules/jest/bin/jest.js', '--config', 'test/face/jest.config.cjs', '--runInBand'], { env, stdio: 'inherit' });
  const legacyCount = sql('SELECT count(*) FROM users;');
  sql(readFileSync(join(root, 'prisma/face-core-rollback-isolated.sql'), 'utf8'));
  if (sql('SELECT count(*) FROM users;') !== legacyCount) throw new Error('Rollback changed legacy rows');
  sql(`BEGIN;\n${migration}\nCOMMIT;`);
  console.log('Migration apply, PostgreSQL integration, destructive isolated rollback preserving legacy rows, and reapply: PASS');
} finally {
  if (created) run('docker', ['rm', '-f', container]);
  rmSync(temp, { recursive: true, force: true });
}
