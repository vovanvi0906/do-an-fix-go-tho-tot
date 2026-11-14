#!/usr/bin/env node
// FaceID Lab health probe used by dev-local.sh. Reads tokens from the private fixture file and
// NEVER prints them; output is a single JSON line with statuses/codes only.
// usage: node health.cjs <fixturePath> <researchUrl> <coreApiUrl> [webUrl]
const { readFileSync } = require('fs');
const [fixturePath, researchUrl, coreUrl, webUrl] = process.argv.slice(2);
const timeout = () => AbortSignal.timeout(5000);
async function get(url, token) {
  try {
    const r = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {}, signal: timeout() });
    let body = null; try { body = await r.json(); } catch (_) {}
    return { status: r.status, body };
  } catch (e) { return { status: 0, body: null, error: e.name === 'TimeoutError' ? 'TIMEOUT' : 'UNREACHABLE' }; }
}
(async () => {
  const out = { research: 'DOWN', ai: 'DOWN', core: 'DOWN', web: webUrl ? 'DOWN' : 'SKIPPED', pad: 'UNKNOWN', proof: 'UNKNOWN' };
  let f;
  try { f = JSON.parse(readFileSync(fixturePath, 'utf8')); } catch (_) { out.error = 'FIXTURES_UNREADABLE'; console.log(JSON.stringify(out)); process.exit(2); }
  const caps = await get(`${researchUrl}/face-research/capabilities`, f.researchToken);
  if (caps.status === 200 && caps.body?.data) {
    const d = caps.body.data;
    out.research = 'RUNNING';
    // AI is healthy only when the real pinned identity model and PAD measurer loaded.
    out.ai = /^yunet-sface:[a-f0-9]{64}:[a-f0-9]{64}$/.test(d.modelVersion || '') && d.padReady === true ? 'RUNNING' : 'DEGRADED';
    out.pad = d.padEvaluated === true ? 'EVALUATED' : `NOT_EVALUATED (${d.padEvaluationStatus || 'NO_RECORD'})`;
    out.cameraUpload = d.cameraAllowed === true ? 'ALLOWED' : 'BLOCKED (capture not approved)';
  } else out.researchHttp = caps.status || caps.error;
  const unauth = await get(`${coreUrl}/workers/me/face/capabilities`);
  const status = await get(`${coreUrl}/workers/me/face/capabilities`, f.coreToken);
  if (unauth.status === 401 && status.status === 200 && status.body?.data) {
    out.core = 'RUNNING';
    const blockers = status.body.data.blockers || [];
    out.blockers = blockers;
    out.proof = blockers.length ? 'BLOCKED BY POLICY' : 'POLICY OPEN';
  } else out.coreHttp = `${unauth.status || unauth.error}/${status.status || status.error}`;
  if (webUrl) {
    try {
      const page = await fetch(webUrl, { signal: timeout() });
      const html = await page.text();
      const proxied = await get(`${webUrl.replace(/\/$/, '')}/face-research/capabilities`, f.researchToken);
      out.web = page.ok && html.includes('FixGo FaceID Lab') && proxied.status === 200 ? 'RUNNING' : 'DEGRADED';
    } catch (_) { out.web = 'DOWN'; }
  }
  console.log(JSON.stringify(out));
  process.exit(out.research === 'RUNNING' && out.ai === 'RUNNING' && out.core === 'RUNNING' && out.web !== 'DOWN' && out.web !== 'DEGRADED' ? 0 : 1);
})();
