const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { root, dir, run, load, env, identity, privateWrite } = require('./common.cjs');
const { PrismaClient } = require(path.join(root, 'server/node_modules/@prisma/client'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function ticks(pid) { try { return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')[19]; } catch { return null; } }
function records() { try { return JSON.parse(fs.readFileSync(path.join(dir, 'pids.json'), 'utf8')); } catch { return []; } }
function stop() {
  for (const item of records()) if (ticks(item.pid) === item.startTicks) { try { process.kill(-item.pid, 'SIGTERM'); } catch {} }
  privateWrite('pids.json', '[]\n');
  console.log('Stopped only runner-owned QA process groups; containers and phone data retained.');
}
function mobileEnv(app, config = load()) {
  const dotenv = require(path.join(root, 'server/node_modules/dotenv'));
  const publicVars = {};
  for (const file of ['.env', '.env.local']) {
    const filePath = path.join(root, app, file);
    if (fs.existsSync(filePath)) for (const [key, val] of Object.entries(dotenv.parse(fs.readFileSync(filePath)))) if (key.startsWith('EXPO_PUBLIC_')) publicVars[key] = val;
  }
  return { ...env(config), ...publicVars, EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3000/api', EXPO_PUBLIC_SOCKET_URL: 'http://127.0.0.1:3000', EXPO_NO_DOTENV: '1', CI: '1', FACE_RESEARCH_APP: 'false', ANDROID_SERIAL: config.serial, ANDROID_HOME: process.env.ANDROID_HOME || path.join(process.env.HOME, 'Android/Sdk') };
}
async function checkApproval(config) {
  const db = new PrismaClient({ datasourceUrl: config.env.DATABASE_URL });
  try {
    await identity(db);
    const approvedMappings = await db.symptomService.findMany({ where: { isActive: true, reviewStatus: 'APPROVED', symptom: { isActive: true, reviewStatus: 'APPROVED', target: { isActive: true, category: { isActive: true } } }, service: { isActive: true } }, include: { service: true, symptom: { include: { target: true } } } });
    const ready = approvedMappings.some(link => link.service.targetId === link.targetId && link.symptom.targetId === link.targetId && link.service.categoryId === link.symptom.target.categoryId);
    if (!ready) throw new Error('NO_APPROVED_ACTIVE_QA_SYMPTOM_MAPPING_KEEP_FLAG_FALSE');
  } finally { await db.$disconnect(); }
}
async function start() {
  const config = load();
  const deviceAt = process.argv.indexOf('--device');
  if (deviceAt !== -1 && process.argv[deviceAt + 1] !== config.serial) throw new Error('USE_CONFIGURED_VIVO_SERIAL');
  const qaEnv = env(config);
  run(process.execPath, [path.join(root, 'scripts/assert-usb-ports-free.cjs')], { env: qaEnv, stdio: 'inherit' });
  if (config.env.SYMPTOM_CATALOG_ENABLED === 'true') await checkApproval(config);
  const cli = path.join(root, 'server/node_modules/prisma/build/index.js');
  run(process.execPath, [cli, 'validate'], { cwd: path.join(root, 'server'), env: qaEnv, stdio: 'inherit' });
  run(process.execPath, [cli, 'generate'], { cwd: path.join(root, 'server'), env: qaEnv, stdio: 'inherit' });
  run(process.execPath, [path.join(root, 'server/scripts/usb-runtime-preflight.cjs')], { cwd: dir, env: qaEnv, stdio: 'inherit' });
  run('npm', ['run', 'build'], { cwd: path.join(root, 'server'), env: qaEnv, stdio: 'inherit' });
  run('bash', [path.join(root, 'scripts/dev-usb-connect.sh'), '--device', config.serial], { env: qaEnv, stdio: 'inherit' });
  const items = [];
  const launch = (name, cmd, args, cwd, childEnv) => {
    const fd = fs.openSync(path.join(dir, `${name}.log`), 'a', 0o600);
    const child = spawn(cmd, args, { cwd, env: childEnv, detached: true, stdio: ['ignore', fd, fd] });
    fs.closeSync(fd);
    child.on('error', () => {});
    items.push({ name, pid: child.pid, startTicks: ticks(child.pid) }); child.unref();
    privateWrite('pids.json', JSON.stringify(items, null, 2));
  };
  try {
    launch('backend', process.execPath, [path.join(root, 'server/dist/main.js')], dir, qaEnv);
    launch('ai', path.join(root, 'ai-service/.venv/bin/python'), ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], path.join(root, 'ai-service'), qaEnv);
    for (const [app, port, name] of [['customer-app', '8081', 'customer'], ['worker-app', '8082', 'worker']]) launch(name, process.execPath, [path.join(root, app, 'node_modules/expo/bin/cli'), 'start', '--dev-client', '--port', port, '--localhost', '--clear'], path.join(root, app), mobileEnv(app, config));
    launch('admin', process.execPath, [path.join(root, 'client/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], path.join(root, 'client'), { ...qaEnv, VITE_API_BASE_URL: 'http://127.0.0.1:3000/api' });
    const endpoints = [['backend', 'http://127.0.0.1:3000/api/health'], ['ai', 'http://127.0.0.1:8000/openapi.json'], ['customer', 'http://127.0.0.1:8081/status'], ['worker', 'http://127.0.0.1:8082/status'], ['admin', 'http://127.0.0.1:5173']];
    for (let attempt = 0; attempt < 100; attempt++) {
      const checks = await Promise.all(endpoints.map(async ([name, url]) => { try { const response = await fetch(url, { signal: AbortSignal.timeout(1500) }); return response.ok; } catch { return false; } }));
      if (checks.every(Boolean)) { console.log('PASS: QA Backend 3000, FastAPI 8000, Customer Metro 8081, Worker Metro 8082, Admin 5173.'); return; }
      if (items.some(item => ticks(item.pid) !== item.startTicks)) throw new Error('QA_PROCESS_EXITED_SEE_PRIVATE_LOGS');
      if (attempt % 10 === 0) console.log(`Waiting for QA: ${endpoints.filter((_, i) => !checks[i]).map(([name]) => name).join(', ')}`);
      await sleep(1000);
    }
    throw new Error('QA_READINESS_TIMEOUT_SEE_PRIVATE_LOGS');
  } catch (error) { stop(); throw error; }
}
async function main() {
  const action = process.argv[2] || 'status';
  if (action === 'start') await start();
  else if (action === 'stop') stop();
  else if (action === 'status') console.log(records().map(item => ({ name: item.name, pid: item.pid, running: ticks(item.pid) === item.startTicks })));
  else if (action === 'enable-symptoms') {
    const config = load(); await checkApproval(config); config.env.SYMPTOM_CATALOG_ENABLED = 'true';
    privateWrite('runtime.json', JSON.stringify(config, null, 2) + '\n');
    privateWrite('.env', Object.entries(config.env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n');
    console.log('Approved active QA mappings present. Flag true saved; restart QA services to apply.');
  } else throw new Error('Use start [--device SERIAL] | stop | status | enable-symptoms');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { mobileEnv, checkApproval };
