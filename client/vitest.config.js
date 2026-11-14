import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', include: ['src/features/symptoms/**/*.test.{js,jsx}'], globals: false, maxWorkers: 1 } });
