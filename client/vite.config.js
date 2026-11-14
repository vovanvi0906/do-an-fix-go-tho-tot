import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { faceTestPlugin } from './scripts/faceTestPlugin.js';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), faceTestPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
