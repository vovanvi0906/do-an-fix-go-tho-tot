// Read-only index audit. Findings contain paths/rules only, never credential values.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const all = process.argv.includes('--index-all');
const files = git(all ? ['ls-files', '-z'] : ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']).split('\0').filter(Boolean);
const privateValues = new Set();
const dotenv = require('dotenv');
const privateEnv = path.join(root, 'server/.env');
if (fs.existsSync(privateEnv)) for (const [key, value] of Object.entries(dotenv.parse(fs.readFileSync(privateEnv)))) {
  if (/SECRET|PASSWORD|TOKEN|SMTP_PASS|ESMS_.*KEY|SMTP_USER/.test(key) && value.length >= 8) privateValues.add(value);
  if (key === 'DATABASE_URL') { try { const dbPassword = decodeURIComponent(new URL(value).password); if (dbPassword.length >= 8) privateValues.add(dbPassword); } catch {} }
}
const qaFile = path.join(root, '.android-qa/runtime.json');
if (fs.existsSync(qaFile)) {
  const qa = JSON.parse(fs.readFileSync(qaFile, 'utf8'));
  for (const [key, value] of Object.entries(qa.env || {})) if (/SECRET|TOKEN/.test(key) && typeof value === 'string' && value.length > 16) privateValues.add(value);
  if (qa.accounts?.password) privateValues.add(qa.accounts.password);
}
const findings = [];
for (const file of files) {
  if (/(^|\/)\.android-qa\//.test(file) || /\.(apk|aab|p12|pfx|jks|keystore|pem|key)$/i.test(file) || /(^|\/)\.env(?:\..*)?$/.test(file) && !file.endsWith('.env.example')) { findings.push({ file, rule: 'FORBIDDEN_PRIVATE_OR_RUNTIME_FILE' }); continue; }
  const content = execFileSync('git', ['show', `:${file}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 25 * 1024 * 1024 });
  if (content.includes(0)) continue;
  const text = content.toString('utf8');
  for (const value of privateValues) if (text.includes(value)) { findings.push({ file, rule: 'PRIVATE_CREDENTIAL_OVERLAP' }); break; }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) findings.push({ file, rule: 'PRIVATE_KEY' });
  if (/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{12,}/.test(text)) findings.push({ file, rule: 'JWT_LITERAL_REVIEW_REQUIRED' });
  if (/(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{25,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,})/.test(text)) findings.push({ file, rule: 'EXTERNAL_TOKEN' });
}
console.log(JSON.stringify({ scope: all ? 'entire-index' : 'staged', filesScanned: files.length, findings, note: 'Pattern and local credential-overlap checks; not proof that previously exposed provider credentials were revoked.' }, null, 2));
if (findings.length) process.exitCode = 1;
