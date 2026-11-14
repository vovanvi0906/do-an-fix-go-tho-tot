import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Browser E2E (real Chromium) against the isolated lab stack:
 *   research Nest :3107 → FastAPI with real YuNet/SFace/MN3; Face Core Nest :3118 with real
 *   FaceCoreService/JwtStrategy on disposable PostgreSQL. Synthetic accounts and pixels only.
 * Tokens are read from the private fixture file (FACEID_LAB_FIXTURES) and never printed.
 * Tests marked [stub] intercept one HTTP response in the browser to exercise a UI state that the
 * live stack cannot produce on demand (timeout); the live equivalent is covered by test-e2e.cjs.
 */
interface Fixtures { researchToken: string; researchOtherToken: string; coreToken: string; coreOtherToken: string; orderId: string; otherWorkerOrderId: string; notArrivedOrderId: string; sessionTtlMs: number }
const fixturePath = process.env.FACEID_LAB_FIXTURES;
const f: Fixtures | null = fixturePath ? JSON.parse(readFileSync(fixturePath, 'utf8')) : null;
const EVIDENCE = join(process.cwd(), '..', 'docs', 'ai-labs', 'evidence', 'faceid-lab-02');
mkdirSync(EVIDENCE, { recursive: true });

test.skip(!f, 'BLOCKED: start server/scripts/face-lab/lab-stack.cjs and set FACEID_LAB_FIXTURES');

const consoleErrors: string[] = [];
const stage = (page: Page, name: string) => page.locator(`[data-stage="${name}"]`);
const status = (page: Page, name: string) => stage(page, name).getAttribute('data-status');
async function shot(page: Page, name: string, project: string) {
  await page.screenshot({ path: join(EVIDENCE, `${project}-${name}.png`), fullPage: true });
}
async function noHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, 'page must not scroll horizontally').toBeLessThanOrEqual(iw + 1);
}
async function eraseResearch(context: BrowserContext) {
  // Reset research rate-limit window between tests (owner-scoped DELETE of synthetic sessions).
  for (const token of [f!.researchToken, f!.researchOtherToken]) {
    const r = await context.request.delete('/face-research/sessions', { headers: { authorization: `Bearer ${token}` } });
    expect(r.ok()).toBeTruthy();
  }
}
async function connect(page: Page, { research = true, core = true, others = true } = {}) {
  await page.goto('/');
  if (research) await page.getByLabel('Research token (lab :3107)').fill(f!.researchToken);
  if (core) await page.getByLabel('Worker TEST JWT (Face Core /api)').fill(f!.coreToken);
  if (others) {
    await page.getByLabel('Research token worker #2 (kiểm thử âm)').fill(f!.researchOtherToken);
    await page.getByLabel('Face Core JWT worker #2 (kiểm thử âm)').fill(f!.coreOtherToken);
  }
  if (research) { await page.getByRole('button', { name: 'Research capabilities' }).click(); await expect(page.getByText('PAD evaluated')).toBeVisible(); }
  if (core) { await page.getByRole('button', { name: 'Face Core status' }).click(); await expect(page.getByText('Blockers')).toBeVisible(); }
}
const useBackend = (page: Page, which: 'research' | 'core') =>
  page.getByLabel(which === 'research' ? 'Research lab (đo lường thật, không thẩm quyền)' : 'Face Core (gate production thật)').check();

test.beforeEach(async ({ page, context }) => {
  page.on('console', m => {
    // HTTP 4xx/5xx responses are expected outcomes of negative tests; Chromium logs them as resource errors.
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push(String(e)));
  page.on('dialog', d => d.accept());
  await eraseResearch(context);
});
test.afterEach(() => { expect(consoleErrors, 'no console/page errors').toEqual([]); consoleErrors.length = 0; });

test('connection: real capabilities show PAD NOT_EVALUATED and blocked gates', async ({ page }, info) => {
  await connect(page);
  await expect(page.getByText('PAD_BLOCKED_DATA').first()).toBeVisible();
  await expect(page.getByText('BLOCKED', { exact: true }).first()).toBeVisible();
  for (const b of ['BIOMETRIC_DATA_POLICY_NOT_APPROVED', 'PAD_NOT_EVALUATED', 'CONSENT_REQUIRED']) await expect(page.locator('.badge', { hasText: b })).toBeVisible();
  await expect(page.locator('input[type=password]').first()).toHaveAttribute('type', 'password');
  await noHorizontalOverflow(page);
  await shot(page, '01-connection', info.project.name);
});

test('enrollment (Face Core): consent → session blocked by data policy + PAD, no template; withdraw', async ({ page }, info) => {
  await connect(page);
  await useBackend(page, 'core');
  await page.getByRole('button', { name: 'Ghi nhận consent (test account)' }).click();
  await expect(page.locator('.badge', { hasText: /^VALID$/ })).toBeVisible();
  await expect(page.locator('.badge', { hasText: 'CONSENT_REQUIRED' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect(stage(page, 'POLICY')).toContainText('BIOMETRIC_DATA_POLICY_NOT_APPROVED');
  expect(await status(page, 'SESSION')).toBe('BLOCKED');
  expect(await status(page, 'PAD')).toBe('NOT_EVALUATED');
  expect(await status(page, 'PROOF')).toBe('BLOCKED');
  expect(await status(page, 'MATCH')).toBe('SKIPPED');
  await expect(page.getByText('— (chưa có)')).toBeVisible();
  await noHorizontalOverflow(page);
  await shot(page, '02-enroll-core-blocked', info.project.name);
  await page.getByRole('button', { name: 'Thu hồi consent + xóa template' }).click();
  await expect(page.locator('.badge', { hasText: 'CONSENT_REQUIRED' }).first()).toBeVisible();
});

test('enrollment (research): live fake camera capture is NOT uploaded while capture is unapproved', async ({ page }, info) => {
  const uploads: string[] = [];
  page.on('request', r => { if (r.url().includes('/capture')) uploads.push(r.url()); });
  await connect(page, { core: false, others: false });
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  expect(await status(page, 'AUTH')).toBe('PASS');
  await page.getByRole('button', { name: 'Bật camera' }).click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Chụp probe' }).click();
  await expect(page.getByAltText('probe capture')).toBeVisible();
  await page.getByRole('button', { name: 'Gửi ảnh camera' }).click();
  await expect(stage(page, 'POLICY')).toContainText('RESEARCH_CAPTURE_NOT_APPROVED');
  expect(await status(page, 'CAMERA')).toBe('BLOCKED');
  expect(uploads, 'no frame may leave the browser').toEqual([]);
  await shot(page, '03-enroll-research-camera-not-uploaded', info.project.name);
  await page.getByRole('button', { name: 'Xóa ảnh' }).click();
  await expect(page.getByAltText('probe capture')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tắt camera' }).click();
});

test('enrollment (research): real YuNet on server-generated blank → NO_FACE; inspectors', async ({ page }, info) => {
  await connect(page, { core: false, others: false });
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  await page.getByRole('button', { name: 'Synthetic (server tự tạo ảnh)' }).click();
  await expect.poll(() => status(page, 'DETECTION')).toBe('FAIL');
  await expect(stage(page, 'DETECTION')).toContainText('NO_FACE');
  await expect(stage(page, 'DETECTION')).toContainText('yunet-sface:');
  expect(await status(page, 'IMAGE')).toBe('PASS');
  expect(await status(page, 'QUALITY')).toBe('SKIPPED');
  expect(await status(page, 'PAD')).toBe('NOT_EVALUATED');
  expect(await status(page, 'PROOF')).toBe('BLOCKED');
  await shot(page, '04-enroll-research-no-face', info.project.name);
  await page.getByRole('tab', { name: 'D. PAD Inspector' }).click();
  await expect(page.getByText('MN3 loaded (experimental, measurement only)')).toBeVisible();
  await expect(page.getByText('PAD_NOT_RUN_NO_SINGLE_FACE').first()).toBeVisible();
  await noHorizontalOverflow(page);
  await shot(page, '05-pad-inspector', info.project.name);
  await page.getByRole('tab', { name: 'E. Identity Inspector' }).click();
  await expect(page.getByLabel('Detection overlay')).toBeVisible();
  await expect(page.getByText('Không bao giờ rời AI process')).toBeVisible();
  await noHorizontalOverflow(page);
  await shot(page, '06-identity-inspector', info.project.name);
});

test('daily (research): idempotent retry, nonce forgery, wrong worker, duplicate, expiry', async ({ page }, info) => {
  await connect(page, { core: false });
  await page.getByRole('tab', { name: 'B. Daily check-in' }).click();
  await page.getByRole('button', { name: 'Tạo session DAILY' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  const id = await page.locator('dd code').first().textContent();
  await page.getByRole('button', { name: 'Retry cùng requestKey' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  expect(await page.locator('dd code').first().textContent(), 'same requestKey returns the same session').toBe(id);
  await page.getByRole('button', { name: 'Nonce sai/replay' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_NONCE_INVALID');
  await page.getByRole('button', { name: 'Session của worker khác' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_SESSION_DENIED');
  await page.getByRole('button', { name: 'Synthetic (server tự tạo ảnh)' }).click();
  await expect.poll(() => status(page, 'DETECTION')).toBe('FAIL');
  const first = await stage(page, 'DETECTION').textContent();
  await page.getByRole('button', { name: 'Synthetic (server tự tạo ảnh)' }).click();
  await expect.poll(() => status(page, 'DETECTION')).toBe('FAIL');
  expect(await stage(page, 'DETECTION').textContent(), 'duplicate submission returns persisted result').toBe(first);
  await shot(page, '07-daily-negative', info.project.name);
  // Session TTL in the lab stack is short (FACE_LAB_SESSION_TTL_MS); wait for real server-side expiry.
  await expect(page.getByText('hết hạn — gửi để kiểm tra từ chối')).toBeVisible({ timeout: f!.sessionTtlMs + 5000 });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Nonce sai/replay' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_SESSION_EXPIRED');
  await shot(page, '08-daily-expired', info.project.name);
});

test('order: ownership, wrong order, not-arrived order, Face Core inspector scope', async ({ page }, info) => {
  await connect(page);
  await page.getByRole('tab', { name: 'C. Order proof' }).click();
  const order = page.getByLabel('Order ID (đơn TEST được gán, trạng thái ARRIVED)');
  await order.fill(f!.orderId);
  await page.getByRole('button', { name: 'Tạo session ORDER' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  await page.getByRole('button', { name: 'Session của worker khác' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_SESSION_DENIED');
  await page.getByRole('button', { name: 'Order không thuộc worker' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_ORDER_DENIED');
  await order.fill(f!.otherWorkerOrderId);
  await page.getByRole('button', { name: 'Tạo session ORDER' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_ORDER_DENIED');
  await order.fill(f!.notArrivedOrderId);
  await page.getByRole('button', { name: 'Tạo session ORDER' }).click();
  await expect(stage(page, 'SESSION')).toContainText('RESEARCH_ORDER_STAGE_INVALID');
  await shot(page, '09-order-negative', info.project.name);
  // Face Core lab inspector: own order readable, other worker's order denied.
  await order.fill(f!.orderId);
  await page.getByRole('button', { name: 'Xem proof của đơn' }).click();
  await page.getByRole('tab', { name: 'Session/Proof Inspector' }).click();
  await expect(page.getByText('ARRIVED · được xác thực')).toBeVisible();
  await expect(page.getByText('padEvaluated')).toBeVisible();
  await noHorizontalOverflow(page);
  await shot(page, '10-session-proof-inspector', info.project.name);
  await page.getByRole('tab', { name: 'C. Order proof' }).click();
  await order.fill(f!.otherWorkerOrderId);
  await page.getByRole('button', { name: 'Xem proof của đơn' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'ORDER_ACCESS_DENIED' }).first()).toBeVisible();
});

test('camera denied by browser permission', async ({ browser }, info) => {
  // Fresh browser whose permission UI answers "Block" (Chromium fake-UI deny): real NotAllowedError path.
  const b = await browser.browserType().launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream=deny'] });
  const ctx = await b.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport ?? undefined });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Bật camera' }).click();
  await expect(page.getByRole('alert')).toContainText('CAMERA_PERMISSION_DENIED');
  expect(await status(page, 'CAMERA')).toBe('BLOCKED');
  await shot(page, '11-camera-denied', info.project.name);
  await b.close();
});

test('no camera API (insecure context / no device) [simulated]', async ({ page }, info) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true }); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bật camera' }).click();
  await expect(page.getByRole('alert')).toContainText('CAMERA_UNSUPPORTED');
  await shot(page, '12-no-camera', info.project.name);
});

test('network offline → NETWORK_UNAVAILABLE, then recovery', async ({ page, context }, info) => {
  await connect(page, { core: false, others: false });
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect(stage(page, 'SESSION')).toContainText('NETWORK_UNAVAILABLE');
  expect(await status(page, 'SESSION')).toBe('ERROR');
  await shot(page, '13-offline', info.project.name);
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
});

test('model timeout [stub 504] shows ERROR, retry with same nonce succeeds live', async ({ page }, info) => {
  await connect(page, { core: false, others: false });
  await page.getByRole('button', { name: 'Tạo session ENROLLMENT' }).click();
  await expect.poll(() => status(page, 'SESSION')).toBe('PASS');
  await page.route('**/synthetic', r => r.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ statusCode: 504, message: 'RESEARCH_AI_TIMEOUT' }) }));
  await page.getByRole('button', { name: 'Synthetic (server tự tạo ảnh)' }).click();
  await expect(stage(page, 'DETECTION')).toContainText('RESEARCH_AI_TIMEOUT');
  expect(await status(page, 'DETECTION')).toBe('ERROR');
  expect(await status(page, 'PROOF')).toBe('BLOCKED');
  await shot(page, '14-timeout', info.project.name);
  await page.unroute('**/synthetic');
  await page.getByRole('button', { name: 'Synthetic (server tự tạo ảnh)' }).click();
  await expect.poll(() => status(page, 'DETECTION')).toBe('FAIL');
  await expect(stage(page, 'DETECTION')).toContainText('NO_FACE');
});

test('all tabs render without horizontal overflow; requests log has no secrets', async ({ page }, info) => {
  await connect(page);
  for (const name of ['A. Enrollment', 'B. Daily check-in', 'C. Order proof', 'D. PAD Inspector', 'E. Identity Inspector', 'Session/Proof Inspector', 'PAD trials', 'Requests']) {
    await page.getByRole('tab', { name }).click();
    await noHorizontalOverflow(page);
  }
  const text = await page.locator('body').innerText();
  for (const secret of [f!.researchToken, f!.coreToken, f!.researchOtherToken, f!.coreOtherToken]) expect(text.includes(secret)).toBe(false);
  await shot(page, '15-requests', info.project.name);
  const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
  expect(stored).toEqual({ local: 0, session: 0, cookies: '' });
});
