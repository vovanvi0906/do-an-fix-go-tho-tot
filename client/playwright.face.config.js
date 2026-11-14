import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'face-test.spec.js', timeout: 60000,
  workers: 1, use: { baseURL: 'http://localhost:5173', headless: true },
  reporter: 'list', outputDir: '/tmp/fixgo-test-ai-playwright',
});
