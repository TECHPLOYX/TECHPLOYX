import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        spanish: 'es/index.html',
        admin: 'admin.html',
        continuity: 'continuidad.html',
      },
      maxParallelFileOps: 128,
    },
  },
});
