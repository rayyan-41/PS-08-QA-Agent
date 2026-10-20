import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { productionMockGuard } from '../../config/production-mock-guard.ts';
const backend = process.env.POKAYOKE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [productionMockGuard(), react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/openapi.json': { target: backend, changeOrigin: true },
    },
  },
});
