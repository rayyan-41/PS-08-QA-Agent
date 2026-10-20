import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { productionMockGuard } from '../../config/production-mock-guard.ts';
export default defineConfig({ plugins: [productionMockGuard(), react(), tailwindcss()] });
