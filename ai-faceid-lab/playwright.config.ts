import { defineConfig, devices } from '@playwright/test';

// Browser E2E against the isolated FaceID lab stack (server/scripts/face-lab/lab-stack.cjs).
// Chromium's fake camera produces a synthetic test pattern: no person, no biometric data.
// Traces/videos are OFF: they would record pasted tokens. Screenshots mask password inputs by design.
const fakeCamera = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];
const apiTarget = process.env.FACEID_LAB_API_URL || 'http://127.0.0.1:3118';
// When the Lab is already served (./dev-local.sh faceid), test that real URL instead of starting Vite.
const external = process.env.FACEID_LAB_BASE_URL;
const baseURL = external || 'http://127.0.0.1:5199';
// Evidence (screenshots + JSON results) folder under docs/ai-labs/evidence/.
const evidence = process.env.FACEID_LAB_EVIDENCE || 'faceid-lab-ui-03/after';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['json', { outputFile: `../docs/ai-labs/evidence/${evidence}/playwright-results.json` }]],
  use: { baseURL, trace: 'off', video: 'off', screenshot: 'off' },
  webServer: external ? undefined : {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
    env: { FACEID_LAB_API_URL: apiTarget, FACEID_LAB_RESEARCH_URL: process.env.FACEID_LAB_RESEARCH_URL || 'http://127.0.0.1:3107' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { args: fakeCamera } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, launchOptions: { args: fakeCamera } } },
  ],
});
