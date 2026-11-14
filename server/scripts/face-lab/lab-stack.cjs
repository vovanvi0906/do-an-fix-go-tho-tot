// FaceID Lab stack (dev/test only). Everything it starts is owned and torn down by this PID:
//   - research FastAPI container (real YuNet/SFace/MN3, --network internal, read-only)
//   - disposable PostgreSQL container (via research prepare.cjs; never DATABASE_URL/.env)
//   - research Nest  (127.0.0.1:FACE_LAB_RESEARCH_PORT, default 3107)
//   - Face Core Nest (127.0.0.1:FACE_LAB_CORE_PORT, default 3118, prefix /api) running the REAL
//     FaceCoreController/FaceCoreService/FaceEvidenceGateway/JwtStrategy/RolesGuard and the lab inspector.
// No production policy is relaxed: capture approval stays false, the gateway reports padEvaluated=false.
// Secrets/tokens are written only to a mode-0600 file in a mode-0700 temp dir; stdout prints paths/ports.
const { resolve, join, dirname } = require('path');
const { spawnSync } = require('child_process');
const { randomBytes } = require('crypto');
const { writeFileSync, chmodSync } = require('fs');
const net = require('net');
const root = resolve(__dirname, '../..');
require('@babel/register')({ configFile: join(root, '.babelrc') });
require('reflect-metadata');

const run = args => { const r = spawnSync('docker', args, { encoding: 'utf8' }); if (r.status !== 0) throw new Error((r.stderr || 'docker failed').slice(-1500)); return r.stdout.trim(); };
const delay = ms => new Promise(r => setTimeout(r, ms));
const portFree = port => new Promise(res => { const s = net.createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))).listen(port, '127.0.0.1'); });

async function startCore({ databaseUrl, port, sessionMs }) {
  // Process-local environment for the real strategy/guards; never written to disk or .env.
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.NODE_ENV = 'development';
  process.env.FACE_LAB_DEBUG_ENABLED = 'true';
  const { PrismaClient } = require('@prisma/client');
  const { Module } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  const { PassportModule } = require('@nestjs/passport');
  const { JwtService } = require('@nestjs/jwt');
  const { FaceCoreController, FaceReviewController } = require('../../src/modules/workers/face/face-core.controller');
  const { FaceCoreService } = require('../../src/modules/workers/face/face-core.service');
  const { FaceEvidenceGateway } = require('../../src/modules/workers/face/face-evidence.gateway');
  const { FaceReadyGuard } = require('../../src/modules/workers/face/face-ready.guard');
  const { FaceLabController } = require('../../src/modules/workers/face/face-lab.controller');
  const { FaceLabDebugGuard } = require('../../src/modules/workers/face/face-lab.guard');
  const { FaceLabInspectorService } = require('../../src/modules/workers/face/face-lab-inspector.service');
  const { JwtStrategy } = require('../../src/modules/auth/strategies/jwt.strategy');
  const { RolesGuard } = require('../../src/modules/auth/guards/roles.guard');
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const options = { enabled: true, captureApproved: false, consentVersion: 'lab-synthetic-v1',
    keys: { 'lab-key-1': randomBytes(32) }, currentKeyId: 'lab-key-1', nonceKey: randomBytes(32),
    sessionMs, dailyMs: 28800000, orderMs: 300000, attempts: 3, windowAttempts: 50, windowMs: 900000, timeoutMs: 15000, threshold: 0.6 };
  // Real gateway with no AI client: reports identityModelReady=false, padEvaluated=false (production code path).
  const core = new FaceCoreService(db, new FaceEvidenceGateway({}), options);
  class FaceCoreLabModule {}
  Module({ imports: [PassportModule], controllers: [FaceCoreController, FaceReviewController, FaceLabController],
    providers: [RolesGuard, FaceReadyGuard, FaceLabDebugGuard, { provide: FaceCoreService, useValue: core },
      { provide: FaceLabInspectorService, useValue: new FaceLabInspectorService(db, core) },
      { provide: JwtStrategy, useFactory: () => new JwtStrategy(db) }] })(FaceCoreLabModule);
  const app = await NestFactory.create(FaceCoreLabModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(port, '127.0.0.1');
  const sign = sub => new JwtService().sign({ sub, type: 'access' }, { secret: process.env.JWT_SECRET, algorithm: 'HS256', expiresIn: '4h' });
  return { app, db, core, sign, url: `http://127.0.0.1:${port}`, consentVersion: options.consentVersion, close: async () => { await app.close(); await db.$disconnect(); } };
}

(async () => {
  const modelDir = process.env.FACE_RESEARCH_SOURCE_MODEL_DIR, cache = process.env.FACE_RESEARCH_RUNTIME_DIR;
  if (!modelDir || !cache) throw new Error('FACE_RESEARCH_SOURCE_MODEL_DIR and FACE_RESEARCH_RUNTIME_DIR required');
  const researchPort = Number(process.env.FACE_LAB_RESEARCH_PORT || 3107), corePort = Number(process.env.FACE_LAB_CORE_PORT || 3118);
  const sessionMs = Number(process.env.FACE_LAB_SESSION_TTL_MS || 120000);
  for (const p of [researchPort, corePort]) if (!(await portFree(p))) throw new Error(`PORT_IN_USE ${p}: choose FACE_LAB_*_PORT`);
  const { prepare } = require('../face-research/prepare.cjs');
  const { start } = require('../face-research/start.cjs');
  const suffix = randomBytes(8).toString('hex'), network = 'fixgo-face-lab-' + suffix, aiName = network + '-ai', aiToken = randomBytes(32).toString('hex');
  let networkCreated = false, aiCreated = false, prepared, research, core, proxy; const sockets = new Set();
  const cleanup = async () => {
    try { if (core) await core.close(); } catch (_) {}
    try { if (research) await research.close(); } catch (_) {}
    try { if (prepared) prepared.destroy(); } catch (_) {}
    if (proxy) { for (const s of sockets) s.destroy(); await new Promise(r => proxy.close(r)); }
    try { if (aiCreated) run(['rm', '-f', aiName]); } catch (_) {}
    try { if (networkCreated) run(['network', 'rm', network]); } catch (_) {}
  };
  // Signals at ANY point (also during startup) tear down exactly what this PID created.
  let stopping = false;
  const stop = async (code = 0) => { if (stopping) return; stopping = true; await cleanup(); console.log(JSON.stringify({ stopped: true })); process.exit(code); };
  process.on('SIGINT', () => stop(0)); process.on('SIGTERM', () => stop(0));
  try {
    run(['network', 'create', '--internal', network]); networkCreated = true;
    run(['run', '-d', '--rm', '--name', aiName, '--network', network, '--cpus', '2', '--memory', '1g', '--read-only', '--tmpfs', '/tmp',
      '-e', 'PYTHONDONTWRITEBYTECODE=1', '-e', 'FACE_RESEARCH_ISOLATED=true', '-e', 'FACE_RESEARCH_CAPTURE_APPROVED=false', '-e', 'FACE_RESEARCH_AI_TOKEN=' + aiToken,
      '-e', 'FACE_RESEARCH_MODEL_DIR=/models', '-e', 'FACE_RESEARCH_PAD_MODEL=/experiment/anti-spoof-mn3.onnx',
      '-v', resolve(cache) + ':/experiment:ro', '-v', resolve(modelDir) + ':/models:ro', '-v', join(root, '../ai-service') + ':/app:ro', '-w', '/app',
      'python:3.11-slim', '/experiment/venv/bin/python', '-m', 'uvicorn', 'face_research_app:app', '--host', '0.0.0.0', '--port', '8099', '--no-access-log', '--log-level', 'error']);
    aiCreated = true;
    const ip = run(['inspect', '-f', '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}', aiName]);
    proxy = net.createServer(socket => { const up = net.connect(8099, ip); sockets.add(socket); sockets.add(up); socket.pipe(up).pipe(socket);
      socket.on('error', () => up.destroy()); up.on('error', () => socket.destroy()); socket.on('close', () => { sockets.delete(socket); up.destroy(); }); up.on('close', () => sockets.delete(up)); });
    await new Promise(r => proxy.listen(0, '127.0.0.1', r));
    const aiUrl = 'http://127.0.0.1:' + proxy.address().port;
    let ready = false;
    for (let i = 0; i < 150 && !ready; i++) { try { ready = (await fetch(aiUrl + '/research/capabilities', { headers: { 'x-face-research-token': aiToken }, signal: AbortSignal.timeout(500) })).ok; } catch (_) {} if (!ready) await delay(100); }
    if (!ready) throw new Error('AI_START_FAILED');
    prepared = await prepare({ aiUrl, aiToken, sessionMs });
    prepared.config.port = researchPort;
    research = await start(prepared.config);
    core = await startCore({ databaseUrl: prepared.config.databaseUrl, port: corePort, sessionMs });
    const f = prepared.fixtures;
    // Second order assigned to the OTHER worker (wrong-order tests) and an order not yet ARRIVED.
    const other = await core.db.workerProfile.findUnique({ where: { userId: f.otherUserId } });
    const base = await core.db.order.findUnique({ where: { id: f.orderId } });
    const otherOrder = await core.db.order.create({ data: { workerId: other.id, customerId: base.customerId, categoryId: base.categoryId, status: 'ARRIVED', addressText: 'Synthetic lab order (other worker)', lat: 10, lng: 106, estimatedPrice: 100000 } });
    const earlyOrder = await core.db.order.create({ data: { workerId: f.workerId, customerId: base.customerId, categoryId: base.categoryId, status: 'WORKER_ARRIVING', addressText: 'Synthetic lab order (not arrived)', lat: 10, lng: 106, estimatedPrice: 100000 } });
    const labFixtures = { researchToken: f.token, researchOtherToken: f.otherToken, coreToken: core.sign(f.userId), coreOtherToken: core.sign(f.otherUserId),
      orderId: f.orderId, otherWorkerOrderId: otherOrder.id, notArrivedOrderId: earlyOrder.id, consentVersion: core.consentVersion, sessionTtlMs: sessionMs };
    const fixturePath = join(dirname(prepared.fixturePath), 'lab-fixtures.json');
    writeFileSync(fixturePath, JSON.stringify(labFixtures, null, 2), { mode: 0o600 }); chmodSync(fixturePath, 0o600);
    // Identity only (no password/URL): lets launchers prove the DB is the disposable one.
    const db = new URL(prepared.config.databaseUrl);
    const [marker] = await core.db.$queryRaw`SELECT current_database() AS name, (SELECT id FROM face_research.environment) AS env`;
    if (marker.name !== db.pathname.slice(1) || !/^fixgo_face_research_[a-f0-9]+$/.test(marker.name) || marker.env !== prepared.config.environmentId) throw new Error('DATABASE_ISOLATION_UNPROVEN');
    console.log(JSON.stringify({ ready: true, pid: process.pid, researchUrl: research.url, coreUrl: core.url + '/api', fixturePath,
      database: { name: marker.name, host: db.hostname, container: prepared.container, isolated: true },
      containers: [prepared.container, aiName], network,
      captureApproved: false, padEvaluated: false, stop: `kill -INT ${process.pid}` }));
  } catch (error) {
    console.error('LAB_STACK_FAILED', String(error.message).slice(0, 500));
    await stop(1);
  }
})();
