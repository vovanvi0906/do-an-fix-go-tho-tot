// Real S03 entrypoints and Metro listeners, owned disposable PostgreSQL + Redis only.
const {spawn, spawnSync} = require('node:child_process');
const {readFileSync, writeFileSync, openSync, closeSync, readlinkSync, mkdirSync, existsSync} = require('node:fs');
const {resolve, join} = require('node:path');
const {randomUUID} = require('node:crypto');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '../../..');
const url = process.env.FACE_TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/fixgo_face_test') throw Error('Runner-owned disposable database required');
const reportDir = resolve(process.env.S03_RUNTIME_LOG_DIR || '/tmp/fixgo-s03-runtime');
mkdirSync(reportDir, {recursive:true});
const redis = `fixgo-s03-runtime-${randomUUID()}`;
const processes = [];
const temporaryEnvFiles = [];
const useUsbScript = process.argv.includes('--usb-script');
let redisCreated = false;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function command(cmd, args) {
  const result = spawnSync(cmd, args, {cwd: root, encoding:'utf8'});
  if (result.status !== 0) throw Error(`${cmd} failed: ${result.stderr}`);
  return result.stdout.trim();
}
function start(name, directory, cmd, args, env) {
  const cwd = join(root, directory), log = join(reportDir, `${name}-runtime.log`), fd = openSync(log, 'w');
  const child = spawn(cmd, args, {cwd, env, detached:true, stdio:['ignore',fd,fd]});
  closeSync(fd);
  child.on('error', error => { child.launchError = error; });
  const item = {name, child, cwd, log}; processes.push(item); return item;
}
async function waitHttp(item, address) {
  for (let i=0;i<180;i++) {
    if (item.child.launchError || item.child.exitCode !== null) throw Error(`${item.name} exited; see ${item.log}`);
    try { const r = await fetch(address, {signal:AbortSignal.timeout(1500)}); if(r.ok) return r; } catch (_) {}
    await delay(500);
  }
  throw Error(`${item.name} readiness timed out; see ${item.log}`);
}
(async () => {
  try {
    command(process.execPath, ['scripts/assert-usb-ports-free.cjs']);
    command('docker', ['run','-d','--rm','--name',redis,'-p','127.0.0.1::6379','redis:7-alpine','redis-server','--save','','--appendonly','no']); redisCreated = true;
    const redisPort = command('docker', ['port',redis,'6379']).split(':').pop();
    const env = {...process.env, PORT:'3000', REDIS_URL:`redis://127.0.0.1:${redisPort}`, REDIS_HOST:'127.0.0.1', REDIS_PORT:redisPort,
      AI_SERVICE_URL:'http://127.0.0.1:8000', BACKEND_API_URL:'http://127.0.0.1:3000/api',
      FACE_CORE_ENABLED:'false', FACE_BIOMETRIC_CAPTURE_APPROVED:'false', FACE_RESEARCH_APP:'false',
      FACE_RESEARCH_CAPTURE_APPROVED:'false', AI_FACE_SERVICE_TOKEN:'s03-synthetic-runtime-token',
      PYTHONDONTWRITEBYTECODE:'1', ULTRALYTICS_AUTOINSTALL:'false', HF_HUB_OFFLINE:'1',
      EXPO_PUBLIC_API_URL:'http://127.0.0.1:3000/api', EXPO_PUBLIC_SOCKET_URL:'http://127.0.0.1:3000', CI:'1'};
    if (useUsbScript) {
      // Existing local config is preserved. Runner env overrides DB/Redis/Face
      // settings; create missing files exclusively and remove only files we own.
      for (const [relative, content] of [
        ['server/.env','# Disposable S03 smoke only; connection comes from runner environment.\n'],
        ...['customer-app','worker-app'].map(app=>[`${app}/.env.local`, 'EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api\nEXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000\n']),
      ]) {
        const path = join(root,relative);
        if (existsSync(path)) continue;
        writeFileSync(path,content,{flag:'wx',mode:0o600});temporaryEnvFiles.push(path);
      }
      const usb = start('usb-script','', 'bash', ['dev-local-usb.sh'], env);
      for (const address of ['http://127.0.0.1:3000/api/docs-json','http://127.0.0.1:8000/openapi.json',
        'http://127.0.0.1:8081/status','http://127.0.0.1:8082/status','http://127.0.0.1:5173']) await waitHttp(usb,address);
    } else {
    const backend = start('backend','server',process.execPath,['node_modules/@babel/node/bin/babel-node.js','src/main.js'],env);
    await waitHttp(backend,'http://127.0.0.1:3000/api/docs-json');
    const ai = start('fastapi','ai-service',join(root,'ai-service/.venv/bin/python'),['-m','uvicorn','main:app','--host','127.0.0.1','--port','8000'],env);
    await waitHttp(ai,'http://127.0.0.1:8000/openapi.json');
    for (const [name, port] of [['customer',8081],['worker',8082]]) {
      const metro = start(name,`${name}-app`,process.execPath,['node_modules/expo/bin/cli','start','--dev-client','--localhost','--port',String(port)],env);
      await waitHttp(metro,`http://127.0.0.1:${port}/status`);
    }
    const admin = start('admin','client',process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--strictPort'],env);
    await waitHttp(admin,'http://127.0.0.1:5173');
    }
    const openapi = await (await fetch('http://127.0.0.1:8000/openapi.json')).json();
    const nest = await (await fetch('http://127.0.0.1:3000/api/docs-json')).json();
    const facePaths = ['/ai/face-verify','/api/v1/ai/verify-face','/ai/face-enroll','/ai/face-capabilities'];
    assert.ok(openapi.paths['/ai/v2/diagnose']);
    for (const path of facePaths) assert.ok(openapi.paths[path]);
    assert.ok(!Object.keys(openapi.paths).some(path=>path.includes('research')));
    assert.ok(!Object.keys(nest.paths).some(path=>path.includes('face-research')));
    const call = async (path, body, token) => {
      const r = await fetch('http://127.0.0.1:8000'+path,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-face-service-token':env.AI_FACE_SERVICE_TOKEN}:{})},body:JSON.stringify(body)});
      return {status:r.status, body:await r.json()};
    };
    const diagnose = await call('/ai/v2/diagnose',{imageUrl:join(root,'ai-service/eval/images/sample_garden.jpg'), description:'cắt tỉa cây vườn'});
    assert.equal(diagnose.status,200); assert.equal(diagnose.body.engine,'model'); assert.equal(diagnose.body.suggestedCategoryId,'lam-vuon');
    const unauthenticated = await call('/ai/face-verify',{}); assert.equal(unauthenticated.status,401);
    const face = await call('/ai/face-verify',{},true);
    assert.equal(face.status,200); assert.equal(face.body.verified,false); assert.equal(face.body.padDecision,'NOT_EVALUATED');
    assert.equal(face.body.embedding,undefined); assert.equal(face.body.proof,undefined);
    // Verify kernel socket ownership, cwd and executable arguments, not just an HTTP banner.
    const listeners = [3000,8000,8081,8082,5173].map(port => {
      const pid = Number(command('lsof',['-t',`-iTCP:${port}`,'-sTCP:LISTEN']).split('\n')[0]);
      const cwd = readlinkSync(`/proc/${pid}/cwd`);
      assert.ok(cwd.startsWith(root+'/'), `Foreign listener ${port}: ${cwd}`);
      return {port,pid,cwd,cmdline:readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0').filter(Boolean)};
    });
    writeFileSync(join(reportDir,'runtime-smoke.json'),JSON.stringify({sourceRoot:root,disposableDatabase:true,disposableRedis:true,
      fullUsbScriptExecuted:useUsbScript,physicalDeviceTest:false,listeners,diagnose,face,unauthenticatedFaceStatus:unauthenticated.status,
      facePaths,researchMounted:false,productionFaceCoreEnabled:false},null,2)+'\n');
    console.log('PASS: worktree Backend, production FastAPI/V2/Face, Customer/Worker Metro, Admin; kernel listener provenance confirmed');
  } finally {
    for (const {child} of processes.reverse()) { try { process.kill(-child.pid,'SIGTERM'); } catch (_) {} }
    await delay(1000);
    for (const {child} of processes) { try { process.kill(-child.pid,'SIGKILL'); } catch (_) {} }
    if (redisCreated) command('docker',['rm','-f',redis]);
    for (const path of temporaryEnvFiles) require('node:fs').unlinkSync(path);
  }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
