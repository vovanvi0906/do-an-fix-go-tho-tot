import { test, expect } from '@playwright/test';

async function fakeCamera(page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      const paint = () => {
        for (let y = 0; y < 480; y += 4) for (let x = 0; x < 640; x += 4) {
          ctx.fillStyle = ((x + y) / 4) % 2 ? '#555' : '#bbb'; ctx.fillRect(x, y, 4, 4);
        }
      };
      paint(); const stream = canvas.captureStream(16); const timer = setInterval(paint, 60);
      const original = stream.getTracks()[0].stop.bind(stream.getTracks()[0]);
      stream.getTracks()[0].stop = () => { clearInterval(timer); original(); };
      return stream;
    };
  });
}
async function detectorStub(page) {
  // Synthetic plumbing only: this test does not claim biometric model accuracy.
  await page.route(/\/node_modules\/\.vite\/deps\/@mediapipe_tasks-vision\.js/, route => route.fulfill({ contentType: 'application/javascript', body: `
    export const FilesetResolver={forVisionTasks:async()=>({})};
    export const FaceDetector={createFromOptions:async()=>({close(){},detectForVideo(){return {detections:[{boundingBox:{originX:180,originY:80,width:280,height:320},keypoints:[{x:.4,y:.4},{x:.6,y:.4},{x:.5,y:.5}]}]}}})};` }));
}

test('real WASM camera detection rejects synthetic no-face; consent and mobile layout', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await fakeCamera(page);
  await page.goto('/test-ai');
  await expect(page.getByRole('button', { name: 'Bật camera', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  await page.getByRole('button', { name: 'Bật camera', exact: true }).click();
  await expect(page.getByText('● LIVE', { exact: true })).toBeVisible({ timeout: 45000 });
  await expect(page.getByText('Đưa khuôn mặt vào khung', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chụp khi đủ điều kiện' })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).uncheck();
  await expect(page.getByText('CAMERA TẮT', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test('camera permission refusal is actionable', async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('denied', 'NotAllowedError'); }; });
  await page.goto('/test-ai');
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  await page.getByRole('button', { name: 'Bật camera', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Quyền camera bị từ chối');
});

test('real model API rejects no-face image, nonce replay and deleted workspace', async ({ page }) => {
  await page.goto('/test-ai');
  await expect(page.getByText('● AI SẴN SÀNG', { exact: true })).toBeVisible({ timeout: 45000 });
  const result = await page.evaluate(async () => {
    const request = async (path, method = 'GET', body, workspace) => {
      const response = await fetch('/api/test-face' + path, { method, headers: { 'content-type': 'application/json', 'x-test-face-client': '1', ...(workspace ? { 'x-face-workspace': workspace } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    };
    const ws = (await request('/workspaces', 'POST', { consent: true })).body.workspace;
    const session = (await request('/sessions', 'POST', { purpose: 'ENROLL' }, ws)).body;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 320;
    const payload = { nonce: session.nonce, photo: canvas.toDataURL('image/png') };
    const measured = await request(`/sessions/${session.id}/capture`, 'POST', payload, ws);
    const replay = await request(`/sessions/${session.id}/capture`, 'POST', payload, ws);
    const erased = await request('/workspace', 'DELETE', undefined, ws);
    const expired = await request('/sessions', 'POST', { purpose: 'ENROLL' }, ws);
    return { measured, replay, erased, expired };
  });
  expect(result.measured.status).toBe(200);
  expect(result.measured.body.reasons).toContain('NO_FACE');
  expect(result.measured.body.testAccepted).toBe(false);
  expect(result.measured.body.templateStoredInMemory).toBe(false);
  expect(result.measured.body.verified).toBe(false);
  expect(result.replay.status).toBe(409);
  expect(result.erased.body.deleted).toBe(true);
  expect(result.expired.status).toBe(410);
});

test('synthetic UI flow auto-captures, enrolls, compares, exports and erases', async ({ page }) => {
  await fakeCamera(page); await detectorStub(page);
  let purpose = 'ENROLL', captures = 0, deletions = 0;
  await page.route('**/api/test-face/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body;
    if (path.endsWith('/capabilities')) body = { identityReady: true, padReady: true };
    else if (path.endsWith('/workspaces')) body = { workspace: 'synthetic-workspace' };
    else if (path.endsWith('/workspace')) { deletions++; body = { deleted: true }; }
    else if (path.endsWith('/sessions')) { purpose = route.request().postDataJSON().purpose; body = { id: 'synthetic-session', nonce: 'synthetic-nonce' }; }
    else {
      captures++;
      body = { purpose, testOnly: true, testAccepted: true, templateStoredInMemory: true, templateVersion: 1,
        identityScore: purpose === 'VERIFY' ? .8 : null, identityDecision: purpose === 'VERIFY' ? 'TEST_MATCH' : 'NOT_COMPARED',
        identityThreshold: .6, padRealScore: .95, padThreshold: .85, testPadDecision: 'TEST_PASS', padDecision: 'NOT_EVALUATED', verified: false, proof: null,
        quality: { decision: 'PASS', faceCount: 1, brightness: 120, sharpness: 100 }, reasons: [], latencyMs: { totalMs: 100 } };
    }
    await route.fulfill({ json: body });
  });
  await page.goto('/test-ai');
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  await page.getByRole('button', { name: 'Bật camera', exact: true }).click();
  await expect(page.getByAltText('Ảnh vừa chụp để test')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Đăng ký mẫu test', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đã lưu mẫu test tạm thời' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục đối chiếu' }).click();
  await expect(page.getByAltText('Ảnh vừa chụp để test')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Đối chiếu khuôn mặt' }).click();
  await expect(page.getByRole('heading', { name: 'Đạt điều kiện đối chiếu test' })).toBeVisible();
  expect(captures).toBe(2);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Xuất JSON' }).click();
  expect((await download).suggestedFilename()).toBe('fixgo-face-test-results.json');
  await page.getByRole('button', { name: 'Xóa phiên & mẫu' }).click();
  expect(deletions).toBe(1);
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /Tôi đồng ý/ })).not.toBeChecked();
});
