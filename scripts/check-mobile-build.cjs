// Runs from either mobile app; EAS supplies public URLs via its selected environment.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const config = JSON.parse(readFileSync(resolve('app.json'), 'utf8')).expo;
const profile = process.env.EAS_BUILD_PROFILE;
if (!['preview', 'production'].includes(profile)) {
  console.log('Development build: local endpoint fallback is enabled.');
  process.exit(0);
}
for (const key of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SOCKET_URL']) {
  const value = process.env[key];
  let url;
  try { url = new URL(value); } catch { throw new Error(`Set ${key} in the EAS ${profile} environment.`); }
  if (url.protocol !== 'https:' || /(^localhost$|^127\.|^10\.|^192\.168\.|\.trycloudflare\.com$|\.ngrok-free\.app$)/i.test(url.hostname)) {
    throw new Error(`${key} must use a stable public HTTPS backend for ${profile}.`);
  }
  if (url.search || url.hash || url.username || url.password) throw new Error(`${key} must not contain credentials, query or fragment.`);
  const path = url.pathname.replace(/\/+$/, '');
  if (key.endsWith('API_URL') && path !== '/api') throw new Error(`${key} must end with /api.`);
  if (key.endsWith('SOCKET_URL') && path !== '') throw new Error(`${key} must be an origin without /api or /orders.`);
}
const customerProjectId = JSON.parse(readFileSync(resolve('../customer-app/app.json'), 'utf8')).expo.extra.eas.projectId;
if (config.android.package === 'com.fixgo.worker' &&
    (process.env.EXPO_EAS_PROJECT_ID || config.extra.eas.projectId) === customerProjectId) {
  throw new Error('Set EXPO_EAS_PROJECT_ID to a separate worker EAS project before preview/production builds. See docs/mobile-debugging.md.');
}
console.log(`Build configuration validated: ${config.android.package} / ${profile}`);
