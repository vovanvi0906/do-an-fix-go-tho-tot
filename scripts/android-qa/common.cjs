const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, '.android-qa');
const pgName = 'fixgo-android-qa-postgres';
const redisName = 'fixgo-android-qa-redis';
function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${path.basename(cmd)} failed; see private QA logs (exit ${result.status})`);
  return result.stdout || '';
}
function assertQaUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'postgresql:' || u.hostname !== '127.0.0.1' || u.port !== '55440' || u.pathname !== '/fixgo_android_qa' || u.username !== 'fixgo_android_qa') throw new Error('REFUSE_NON_QA_DATABASE');
  return value;
}
function load() {
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'runtime.json'), 'utf8'));
  assertQaUrl(config.env.DATABASE_URL);
  if (config.env.REDIS_URL !== 'redis://127.0.0.1:56381/0' || config.env.REDIS_PORT !== '56381' || config.env.REDIS_HOST !== '127.0.0.1') throw new Error('REFUSE_NON_QA_REDIS');
  if (config.env.FACE_CORE_ENABLED !== 'false' || config.env.FACE_BIOMETRIC_CAPTURE_APPROVED !== 'false') throw new Error('QA_FACE_GATES_MUST_REMAIN_CLOSED');
  return config;
}
function cleanEnv() {
  const result = { ...process.env };
  for (const key of Object.keys(result)) if (/^(DATABASE_URL|REDIS_|FACE_|PAD_|AI_|CLOUDINARY_|SMTP_|MAIL_|EMAIL_|ESMS_|FIREBASE_|GOOGLE_|JWT_|EXPO_PUBLIC_|DOTENV_CONFIG_|PORT$|NODE_ENV$|BACKEND_API_URL$)/.test(key)) delete result[key];
  return result;
}
function env(config = load()) {
  return { ...cleanEnv(), ...config.env, DOTENV_CONFIG_PATH: path.join(dir, '.env'), PYTHONDONTWRITEBYTECODE: '1', ULTRALYTICS_AUTOINSTALL: 'false', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', EXPO_NO_DOTENV: '1' };
}
async function identity(db) {
  const [row] = await db.$queryRaw`SELECT current_database() AS name, current_user AS username`;
  if (row.name !== 'fixgo_android_qa' || row.username !== 'fixgo_android_qa') throw new Error('REFUSE_NON_QA_SERVER_IDENTITY');
}
function privateWrite(file, value) { fs.writeFileSync(path.join(dir, file), value, { mode: 0o600 }); fs.chmodSync(path.join(dir, file), 0o600); }
module.exports = { root, dir, pgName, redisName, run, assertQaUrl, load, cleanEnv, env, identity, privateWrite };
