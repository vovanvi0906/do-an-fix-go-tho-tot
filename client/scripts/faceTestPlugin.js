import { randomBytes } from 'node:crypto';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createReadStream, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';

const exec = promisify(execFile);
const loopback = hostname => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Vite serve only. Starts one disposable inference container on first lab request.
 * No production API, database, worker token or enrollment is involved.
 */
export function faceTestPlugin() {
  let boot, target, container, closed = false;
  const secret = randomBytes(32).toString('hex');
  const root = path.resolve(import.meta.dirname, '../..');
  const tokenEnv = { ...process.env, FACE_TEST_TOKEN: secret };
  async function cleanup() {
    closed = true;
    if (boot) await boot.catch(() => {});
    if (container) await exec('docker', ['rm', '-f', container]).catch(() => {});
  }
  async function start() {
    const cache = process.env.FACE_TEST_RUNTIME_DIR || path.join(os.homedir(), '.cache/fixgo-pad-mn3');
    const models = process.env.FACE_TEST_MODEL_DIR || path.join(root, 'ai-service/weights');
    if (!existsSync(path.join(cache, 'anti-spoof-mn3.onnx'))) throw Error('PAD_RUNTIME_MISSING');
    container = `fixgo-face-test-${randomBytes(8).toString('hex')}`;
    await exec('docker', ['run', '-d', '--rm', '--name', container,
      '-p', '127.0.0.1::8099', '--cpus', '2', '--memory', '1g', '--read-only', '--tmpfs', '/tmp',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
      '-e', 'PYTHONDONTWRITEBYTECODE=1', '-e', 'FACE_TEST_LOCAL_ONLY=true', '-e', 'FACE_TEST_TOKEN',
      '-v', `${cache}:/experiment:ro`, '-v', `${models}:/models:ro`,
      '-v', `${path.join(root, 'ai-service')}:/app:ro`, '-w', '/app',
      'python:3.11-slim', '/experiment/venv/bin/python', '-m', 'uvicorn', 'face_test_app:app',
      '--host', '0.0.0.0', '--port', '8099', '--no-access-log', '--log-level', 'error'], { env: tokenEnv, timeout: 30000 });
    const { stdout } = await exec('docker', ['port', container, '8099/tcp']);
    const port = Number(stdout.trim().split(':').at(-1));
    if (!Number.isSafeInteger(port)) throw Error('TEST_AI_PORT_INVALID');
    target = `http://127.0.0.1:${port}`;
    for (let attempt = 0; attempt < 60 && !closed; attempt++) {
      try {
        const response = await fetch(`${target}/capabilities`, { headers: { 'x-face-test-token': secret }, signal: AbortSignal.timeout(1000) });
        if (response.ok) return;
      } catch { /* warmup */ }
      await pause(250);
    }
    throw Error('TEST_AI_STARTUP_FAILED');
  }
  return {
    name: 'fixgo-local-face-test', apply: 'serve',
    configureServer(server) {
      const onExit = () => { if (container) spawnSync('docker', ['rm', '-f', container], { timeout: 5000, stdio: 'ignore' }); };
      process.once('exit', onExit);
      server.httpServer?.once('close', cleanup);
      server.watcher.once('close', cleanup);
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (!pathname.startsWith('/api/test-face/') && !pathname.startsWith('/test-face-assets/')) return next();
        const json = (code, message) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify({ detail: message })); };
        let host;
        try { host = new URL(`http://${req.headers.host}`); } catch { return json(403, 'LOCALHOST_REQUIRED'); }
        if (!loopback(host.hostname) || (req.headers.origin && req.headers.origin !== host.origin)) return json(403, 'LOCALHOST_REQUIRED');
        if (pathname.startsWith('/test-face-assets/')) {
          const name = pathname.slice('/test-face-assets/'.length);
          const wasmFiles = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm'];
          const model = name === 'blaze_face_short_range.tflite';
          if (!model && !wasmFiles.includes(name)) return json(404, 'ASSET_NOT_FOUND');
          const file = model ? path.join(root, 'ai-service/weights', name) : path.join(root, 'client/node_modules/@mediapipe/tasks-vision/wasm', name);
          if (!existsSync(file)) return json(404, 'RUN_NPM_FACE_SETUP');
          res.setHeader('content-type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
          createReadStream(file).on('error', () => res.destroy()).pipe(res); return;
        }
        if (req.headers['x-test-face-client'] !== '1') return json(403, 'TEST_CLIENT_REQUIRED');
        try {
          if (!boot) boot = start().catch(async error => {
            if (container) await exec('docker', ['rm', '-f', container]).catch(() => {});
            boot = null; target = null;
            throw error;
          });
          await boot;
        } catch { return json(503, 'TEST_AI_UNAVAILABLE'); }
        if (closed) return json(503, 'TEST_AI_STOPPED');
        const upstream = http.request(target + pathname.replace('/api/test-face', ''), {
          method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json',
            'x-face-test-token': secret, 'x-face-workspace': req.headers['x-face-workspace'] || '' },
        }, response => {
          res.writeHead(response.statusCode || 502, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          response.pipe(res);
        });
        upstream.setTimeout(30000, () => upstream.destroy());
        upstream.on('error', () => { if (!res.headersSent) json(503, 'TEST_AI_UNAVAILABLE'); else res.destroy(); });
        res.on('close', () => upstream.destroy());
        req.pipe(upstream);
      });
    },
  };
}
