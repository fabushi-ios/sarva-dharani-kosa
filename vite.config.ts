import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const generatedCache = new Map<string, { code: Buffer; gzip: Buffer }>();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fast-generated-corpus-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlPath = (req.url || '').split('?')[0];
          if (urlPath.startsWith('/src/data/generated/') && urlPath.endsWith('.ts')) {
            const filePath = path.join(process.cwd(), urlPath);
            if (fs.existsSync(filePath)) {
              let cached = generatedCache.get(filePath);
              if (!cached) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const transformed = esbuild.transformSync(raw, {
                  loader: 'ts',
                  sourcemap: false,
                  charset: 'utf8',
                  minifyWhitespace: true,
                  minifySyntax: true,
                  legalComments: 'none',
                });
                const codeBuf = Buffer.from(transformed.code, 'utf8');
                const gzipBuf = zlib.gzipSync(codeBuf);
                cached = { code: codeBuf, gzip: gzipBuf };
                generatedCache.set(filePath, cached);
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'public, max-age=3600');
              const acceptEncoding = String(req.headers['accept-encoding'] || '');
              if (acceptEncoding.includes('gzip')) {
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Content-Length', String(cached.gzip.length));
                res.end(cached.gzip);
              } else {
                res.setHeader('Content-Length', String(cached.code.length));
                res.end(cached.code);
              }
              return;
            }
          }
          next();
        });
      },
    },
  ],
  base: '/',
  publicDir: 'public',
  esbuild: {
    sourcemap: false,
    legalComments: 'none',
  },
  css: {
    devSourcemap: false,
  },
  build: {
    sourcemap: false,
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
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
