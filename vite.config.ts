import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
    sourcemap:
      process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
    rollupOptions: {
      input: {
        main: 'index.html',
        spanish: 'es/index.html',
        admin: 'admin.html',
      },
      maxParallelFileOps: 128,
    },
  },
});
