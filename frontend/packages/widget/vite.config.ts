import { defineConfig } from 'vite';
import { productionMockGuard } from '../../config/production-mock-guard.ts';
export default defineConfig({
  plugins: [productionMockGuard()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Pokayoke',
      formats: ['iife'],
      fileName: () => 'pokayoke-widget.js',
    },
    emptyOutDir: true,
  },
});
