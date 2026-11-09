import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('cbetaAuthRecords')) return 'data-cbeta';
          if (id.includes('gretilAuthRecords')) return 'data-gretil';
          if (id.includes('taishoMikkyoIndex')) return 'data-taisho';
          if (id.includes('tier1Databases')) return 'data-tier1';
          if (id.includes('tier23Databases')) return 'data-tier23';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/.gemini/**',
        '**/.agents/**',
        '**/fabushi-ios/**',
        '**/data/**',
        '**/dist/**',
        '**/models/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        bypass(req) {
          if (req.url) {
            const cleanUrl = req.url.split('?')[0];
            const localPath = path.join(process.cwd(), 'public', cleanUrl);
            if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
              return cleanUrl;
            }
          }
          return undefined;
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
