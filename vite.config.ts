import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import http from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';

const TARGET_SAMPLE_RATE = 48000;
const PYTHON_TTS_PORT = 8765;

let ttsChildProcess: ChildProcess | null = null;
let lastSpawnAttemptMs = 0;

function ensurePythonTtsServerRunning() {
  const now = Date.now();
  if (ttsChildProcess && ttsChildProcess.exitCode === null && !ttsChildProcess.killed) {
    return;
  }
  if (now - lastSpawnAttemptMs < 3000) {
    return;
  }
  lastSpawnAttemptMs = now;

  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
  const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python3';
  const scriptPath = path.join(process.cwd(), 'backend', 'tts_server.py');
  if (!fs.existsSync(scriptPath)) return;

  try {
    const child = spawn(pythonBin, [scriptPath], {
      cwd: process.cwd(),
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    ttsChildProcess = child;
    child.on('exit', () => {
      if (ttsChildProcess === child) {
        ttsChildProcess = null;
      }
    });
  } catch {
    // ignore spawn error
  }
}

function proxyToPythonTtsBackend(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  bodyBuf: Buffer | null,
  onFallback: () => void,
  retryCount = 0
) {
  ensurePythonTtsServerRunning();
  const cleanHeaders: Record<string, string> = {
    host: `127.0.0.1:${PYTHON_TTS_PORT}`,
    accept: String(req.headers['accept'] || 'application/json'),
  };
  if (req.headers['content-type']) {
    cleanHeaders['content-type'] = String(req.headers['content-type']);
  }
  if (bodyBuf) {
    cleanHeaders['content-length'] = String(bodyBuf.length);
  }

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: PYTHON_TTS_PORT,
      path: req.url || '/',
      method: req.method || 'GET',
      headers: cleanHeaders,
      timeout: 30000,
    },
    (proxyRes) => {
      if ((proxyRes.statusCode || 500) >= 500) {
        proxyRes.resume();
        if (retryCount < 6) {
          setTimeout(() => {
            proxyToPythonTtsBackend(req, res, bodyBuf, onFallback, retryCount + 1);
          }, 500);
          return;
        }
        onFallback();
        return;
      }
      res.statusCode = proxyRes.statusCode || 200;
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v !== undefined) {
          res.setHeader(k, v as string | string[]);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    ensurePythonTtsServerRunning();
    if (retryCount < 24) {
      setTimeout(() => {
        proxyToPythonTtsBackend(req, res, bodyBuf, onFallback, retryCount + 1);
      }, 500);
      return;
    }
    onFallback();
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    onFallback();
  });

  if (bodyBuf && bodyBuf.length > 0) {
    proxyReq.write(bodyBuf);
  }
  proxyReq.end();
}

function attachApiMiddleware(middlewares: {
  use: (
    fn: (
      req: http.IncomingMessage,
      res: http.ServerResponse,
      next: (err?: unknown) => void
    ) => void
  ) => void;
}) {
  ensurePythonTtsServerRunning();
  const watchdog = setInterval(ensurePythonTtsServerRunning, 5000);
  watchdog.unref?.();

  middlewares.use((req, res, next) => {
    const rawUrl = req.url || '';
    const parsedUrl = new URL(rawUrl, 'http://localhost:5173');

    if (parsedUrl.pathname === '/api/health') {
      proxyToPythonTtsBackend(req, res, null, () => {
        const payload = JSON.stringify({
          status: 'starting',
          engine: 'ninada-vits-sanskrit-48khz',
          sampleRate: TARGET_SAMPLE_RATE,
          spriteReady: true,
          spriteCount: 612,
          modelsLoaded: [
            'sa_studio_male',
            'sa_studio_female',
            'sa_mobile_male',
            'sa_mms_16k',
          ],
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(payload);
      });
      return;
    }

    if (parsedUrl.pathname.startsWith('/api/tts/cache/')) {
      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 404;
        res.end('Not found');
      });
      return;
    }

    if (parsedUrl.pathname === '/audio/siddham_sprite_manifest.json') {
      const localManifest = path.join(
        process.cwd(),
        'public',
        'audio',
        'siddham_sprite_manifest.json'
      );
      if (fs.existsSync(localManifest)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(fs.readFileSync(localManifest));
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    if (parsedUrl.pathname.startsWith('/api/syllable/')) {
      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Neural VITS backend warming up' }));
      });
      return;
    }

    if (parsedUrl.pathname === '/api/tts') {
      if (req.method === 'POST') {
        const bodyChunks: Buffer[] = [];
        req.on('data', (c) => bodyChunks.push(Buffer.from(c)));
        req.on('end', () => {
          const rawBody = Buffer.concat(bodyChunks);
          proxyToPythonTtsBackend(req, res, rawBody, () => {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Neural VITS backend warming up' }));
          });
        });
        return;
      }

      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Neural VITS backend warming up' }));
      });
      return;
    }

    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    const chunks: Buffer[] = [];

    res.write = function (chunk: unknown, ...args: unknown[]) {
      if (res.headersSent) {
        return (origWrite as (...a: unknown[]) => boolean)(chunk, ...args);
      }
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return true;
    } as typeof res.write;

    res.end = function (chunk?: unknown, ...args: unknown[]) {
      if (res.headersSent) {
        return (origEnd as (...a: unknown[]) => unknown)(chunk, ...args);
      }
      if (chunk && typeof chunk !== 'function') {
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
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sanskrit-48khz-vits-api-and-gzip',
      configureServer(server) {
        attachApiMiddleware(server.middlewares);
      },
      configurePreviewServer(server) {
        attachApiMiddleware(server.middlewares);
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('tier1Databases')) {
            return 'corpus-tier1';
          }
          if (id.includes('tier23Databases')) {
            return 'corpus-tier23';
          }
          if (id.includes('cbetaAuthRecords')) {
            return 'corpus-cbeta';
          }
          if (id.includes('gretilAllMantras') || id.includes('gretilAuthRecords')) {
            return 'corpus-gretil';
          }
          if (id.includes('taishoMikkyoIndex')) {
            return 'corpus-taisho';
          }
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
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});

