import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'strip-giant-inline-sourcemaps-and-gzip',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const origEnd = res.end.bind(res);
          const chunks: Buffer[] = [];

          res.write = function (chunk: unknown) {
            if (chunk) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            }
            return true;
          } as typeof res.write;

          res.end = function (chunk?: unknown, ...args: unknown[]) {
            if (chunk) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            }
            let fullBuf = Buffer.concat(chunks);
            const contentType = String(res.getHeader('Content-Type') || '');

            if (contentType.includes('javascript') && fullBuf.length > 30_000) {
              const str = fullBuf.toString('utf8');
              const idx = str.lastIndexOf('//# sourceMappingURL=data:');
              if (idx !== -1) {
                fullBuf = Buffer.from(str.slice(0, idx), 'utf8');
              }
            }

            const acceptEncoding = String(req.headers['accept-encoding'] || '');
            const existingEncoding = res.getHeader('Content-Encoding');
            if (
              !existingEncoding &&
              acceptEncoding.includes('gzip') &&
              fullBuf.length > 8_192 &&
              (contentType.includes('javascript') ||
                contentType.includes('text/html') ||
                contentType.includes('text/css') ||
                contentType.includes('application/json'))
            ) {
              const gz = zlib.gzipSync(fullBuf);
              res.setHeader('Content-Encoding', 'gzip');
              res.setHeader('Content-Length', String(gz.length));
              return origEnd(gz);
            }

            if (chunks.length > 0) {
              res.setHeader('Content-Length', String(fullBuf.length));
              return origEnd(fullBuf);
            }
            return (origEnd as (...a: unknown[]) => unknown)(chunk, ...args);
          } as typeof res.end;

          next();
        });
      },
    },
  ],
  base: '/',
  publicDir: 'public',
  css: {
    devSourcemap: false,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    sourcemapIgnoreList: () => true,
    watch: {
      ignored: [
        '**/.gemini/**',
        '**/.agents/**',
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
});
