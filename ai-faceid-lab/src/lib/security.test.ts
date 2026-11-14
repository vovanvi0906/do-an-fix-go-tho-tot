import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Static guard: biometric frames/tokens must never be persisted or logged by the lab.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? files(p) : [p]; });
}
const sources = files(join(__dirname, '..')).filter(p => /\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p));

// Patterns match API usage (property access/calls), not prose in comments.
test.each([
  ['localStorage', /\blocalStorage\s*[.[]/], ['sessionStorage', /\bsessionStorage\s*[.[]/], ['indexedDB', /\bindexedDB\s*\./],
  ['caches API', /\bcaches\s*\.\s*open/], ['cookies', /document\s*\.\s*cookie/], ['console logging', /console\s*\.\s*(log|debug|info|trace)\s*\(/],
  ['file inputs', /type=["']file["']/], ['data URLs of frames', /toDataURL\s*\(/],
])('source never uses %s', (_, banned) => {
  for (const f of sources) expect(`${f}: ${banned.test(readFileSync(f, 'utf8'))}`).toBe(`${f}: false`);
});
test('no client-chosen workerId is ever sent', () => {
  for (const f of sources) expect(readFileSync(f, 'utf8')).not.toMatch(/workerId\s*:/);
});
