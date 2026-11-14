/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only proxy: the browser talks to one loopback origin, so neither backend needs CORS
// changes. Targets must be loopback; the lab is never exposed on a LAN/public interface.
const loopback = (value: string | undefined, fallback: string) => {
  const url = new URL(value || fallback);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error(`FaceID Lab proxy target must be loopback: ${url.host}`);
  return url.origin;
};
const research = loopback(process.env.FACEID_LAB_RESEARCH_URL, 'http://127.0.0.1:3107');
const api = loopback(process.env.FACEID_LAB_API_URL, 'http://127.0.0.1:3000');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', port: 5199, strictPort: true,
    proxy: {
      '/face-research': { target: research, changeOrigin: true },
      '/api': { target: api, changeOrigin: true },
    },
  },
  preview: { host: '127.0.0.1', port: 5199, strictPort: true },
  build: { sourcemap: false },
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'] },
});
