import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
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
  },
});
