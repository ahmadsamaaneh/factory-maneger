import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root (parent of /frontend) — so we read the same `PORT` as the API server. */
const projectRoot = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, projectRoot, '');
  const backendPort = rootEnv.PORT || '3000';
  const apiTarget = `http://127.0.0.1:${backendPort}`;

  const proxy = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  };
});
