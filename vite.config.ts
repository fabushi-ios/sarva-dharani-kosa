import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import http from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';

const TARGET_SAMPLE_RATE = 48000;
const PYTHON_TTS_PORT = 8765;
const LOCAL_QA_PORT = 7860;
const HF_UPSTREAM_BASE = 'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main';
const DEFAULT_QA_SPACE_ID =
  process.env.HF_QA_SPACE_ID || 'bhrum108/sarva-dharani-kosa-buddhist-qa';
const DEFAULT_HF_QA_ORIGIN =
  process.env.HF_QA_API_URL ||
  `https://${DEFAULT_QA_SPACE_ID.trim().replace(/\//g, '-').toLowerCase()}.hf.space`;

const ALLOWED_SOURCE_PROXY_HOSTS = new Set<string>([
  'raw.githubusercontent.com',
  'cbdata.dila.edu.tw',
  'cbetaonline.dila.edu.tw',
  'www.dsbcproject.org',
  'dsbcproject.org',
  'gretil.sub.uni-goettingen.de',
  'dharmamitra.org',
  'www2.hf.uio.no',
  'polyglotta.uio.no',
  'www.rkts.org',
  'rkts.org',
  'publicapi.asianlegacylibrary.org',
  'idp.bbaw.de',
  'cetom.univie.ac.at',
  'services.cudl.lib.cam.ac.uk',
  'cudl.lib.cam.ac.uk',
  'ochs-database.netlify.app',
  'huggingface.co',
  'hf-mirror.com',
]);

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

async function pipeRemoteUrlToResponse(
  upstreamUrl: string,
  res: http.ServerResponse,
  extraHeaders?: Record<string, string>
) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const upstreamResp = await fetch(upstreamUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*',
        ...extraHeaders,
      },
    });
    clearTimeout(timer);

    res.statusCode = upstreamResp.status;
    res.setHeader('Access-Control-Allow-Origin', '*');
    const ct = upstreamResp.headers.get('content-type');
    if (ct) {
      res.setHeader('Content-Type', ct);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buf = Buffer.from(await upstreamResp.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: `Upstream proxy failed: ${String(err)}` }));
  }
}

function tryLocalQaBackendFirst(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  targetPathAndSearch: string,
  bodyBuf: Buffer | null,
  onRemoteFallback: () => void
) {
  const cleanHeaders: Record<string, string> = {
    host: `127.0.0.1:${LOCAL_QA_PORT}`,
    accept: String(req.headers['accept'] || 'text/event-stream, application/json'),
  };
  if (req.headers['content-type']) {
    cleanHeaders['content-type'] = String(req.headers['content-type']);
  }
  if (bodyBuf) {
    cleanHeaders['content-length'] = String(bodyBuf.length);
  }

  const localReq = http.request(
    {
      hostname: '127.0.0.1',
      port: LOCAL_QA_PORT,
      path: targetPathAndSearch,
      method: req.method || 'GET',
      headers: cleanHeaders,
      timeout: 1200,
    },
    (localRes) => {
      if ((localRes.statusCode || 500) >= 500) {
        localRes.resume();
        onRemoteFallback();
        return;
      }
      res.statusCode = localRes.statusCode || 200;
      for (const [k, v] of Object.entries(localRes.headers)) {
        if (v !== undefined) {
          res.setHeader(k, v as string | string[]);
        }
      }
      localRes.pipe(res);
    }
  );

  localReq.on('error', () => onRemoteFallback());
  localReq.on('timeout', () => {
    localReq.destroy();
    onRemoteFallback();
  });

  if (bodyBuf && bodyBuf.length > 0) {
    localReq.write(bodyBuf);
  }
  localReq.end();
}

async function pipeRemoteQaRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  targetPathAndSearch: string,
  rawBody: Buffer | null
) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 95000);
    const upstreamResp = await fetch(
      `${DEFAULT_HF_QA_ORIGIN.replace(/\/+$/, '')}${targetPathAndSearch}`,
      {
        method: req.method || 'GET',
        headers: {
          ...(req.headers['content-type']
            ? { 'Content-Type': String(req.headers['content-type']) }
            : {}),
          Accept: String(req.headers['accept'] || 'text/event-stream, application/json'),
        },
        body: rawBody ? new Uint8Array(rawBody) : undefined,
        redirect: 'follow',
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    res.statusCode = upstreamResp.status;
    res.setHeader('Access-Control-Allow-Origin', '*');
    const ct = upstreamResp.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', ct);
    if (ct.includes('text/event-stream')) {
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
    }

    if (upstreamResp.body) {
      const reader = upstreamResp.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          res.write(Buffer.from(value));
        }
      }
      res.end();
      return;
    }

    res.end(Buffer.from(await upstreamResp.arrayBuffer()));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Buddhist Q&A Space unreachable',
        detail: String(err),
      })
    );
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
    const qIdx = rawUrl.indexOf('?');
    const pathname = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);
    const search = qIdx === -1 ? '' : rawUrl.slice(qIdx);
    const searchParams = new URLSearchParams(search);

    // 0. /qa-api/* MITRA-Qwen3.5 Buddhist Sutra Q&A Streaming Gateway
    if (pathname.startsWith('/qa-api/')) {
      const stripped = pathname.slice('/qa-api'.length) || '/';
      const targetPathAndSearch = `${stripped}${search}`;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(Buffer.from(c)));
        req.on('end', () => {
          const buf = Buffer.concat(chunks);
          tryLocalQaBackendFirst(req, res, targetPathAndSearch, buf, () => {
            void pipeRemoteQaRequest(req, res, targetPathAndSearch, buf);
          });
        });
        return;
      }
      tryLocalQaBackendFirst(req, res, targetPathAndSearch, null, () => {
        void pipeRemoteQaRequest(req, res, targetPathAndSearch, null);
      });
      return;
    }

    // 1. /hf-cdn/* dev/preview proxy (local build/public first, then HF Hub CDN)
    if (pathname.startsWith('/hf-cdn/')) {
      const rel = pathname.slice('/hf-cdn/'.length);
      const localBuildCanon = rel.startsWith('canon/')
        ? path.join(process.cwd(), 'build', rel)
        : '';
      const localPublic = path.join(process.cwd(), 'public', rel);
      const chosenLocal =
        localBuildCanon && fs.existsSync(localBuildCanon)
          ? localBuildCanon
          : fs.existsSync(localPublic)
          ? localPublic
          : '';
      if (chosenLocal && fs.statSync(chosenLocal).isFile()) {
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          chosenLocal.endsWith('.gz') ? 'application/gzip' : 'application/json; charset=utf-8'
        );
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(fs.readFileSync(chosenLocal));
        return;
      }
      void pipeRemoteUrlToResponse(`${HF_UPSTREAM_BASE}/${rel}${search}`, res);
      return;
    }

    // 2. /canon/* dev/preview proxy (serves local build/canon or proxies HF Hub canon/)
    if (pathname.startsWith('/canon/')) {
      const rel = pathname.slice('/canon/'.length);
      const localBuild = path.join(process.cwd(), 'build', 'canon', rel);
      const localPublic = path.join(process.cwd(), 'public', 'canon', rel);
      const chosen = fs.existsSync(localBuild)
        ? localBuild
        : fs.existsSync(localPublic)
        ? localPublic
        : '';
      if (chosen && fs.statSync(chosen).isFile()) {
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          chosen.endsWith('.gz') ? 'application/gzip' : 'application/json; charset=utf-8'
        );
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(fs.readFileSync(chosen));
        return;
      }
      void pipeRemoteUrlToResponse(`${HF_UPSTREAM_BASE}/canon/${rel}${search}`, res);
      return;
    }

    // 3. /source-proxy/* allowlisted external database CORS & HTTP->HTTPS gateway
    if (pathname.startsWith('/source-proxy/')) {
      const targetParam = searchParams.get('url');
      let targetUrlStr = targetParam || '';
      if (!targetUrlStr) {
        const rest = pathname.slice('/source-proxy/'.length);
        const matchProto = rest.match(/^(https?)\/(.+)$/i);
        if (matchProto) {
          targetUrlStr = `${matchProto[1].toLowerCase()}://${matchProto[2]}${search}`;
        }
      }
      try {
        const targetParsed = new URL(targetUrlStr);
        if (!ALLOWED_SOURCE_PROXY_HOSTS.has(targetParsed.hostname.toLowerCase())) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: `Host not in allowlist: ${targetParsed.hostname}` }));
          return;
        }
        void pipeRemoteUrlToResponse(targetParsed.toString(), res);
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Invalid target URL for /source-proxy' }));
      }
      return;
    }

    if (pathname === '/api/health') {
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

    if (pathname.startsWith('/api/tts/cache/')) {
      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 404;
        res.end('Not found');
      });
      return;
    }

    if (pathname === '/audio/siddham_sprite_manifest.json') {
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

    if (pathname.startsWith('/api/corpus/')) {
      const shardName = path.basename(pathname.slice('/api/corpus/'.length));
      const localShard = path.join(process.cwd(), 'public', 'corpus', shardName);
      if (fs.existsSync(localShard)) {
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          shardName.endsWith('.gz') ? 'application/gzip' : 'application/json; charset=utf-8'
        );
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.end(fs.readFileSync(localShard));
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    if (pathname === '/api/search') {
      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            query: searchParams.get('q') || '',
            totalMatched: 0,
            matchedEntryIds: [],
            results: [],
            engine: 'sarva-dharani-cloud-search-v2',
          })
        );
      });
      return;
    }

    if (pathname.startsWith('/api/syllable/')) {
      proxyToPythonTtsBackend(req, res, null, () => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Neural VITS backend warming up' }));
      });
      return;
    }

    if (pathname === '/api/tts') {
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
      closeBundle() {
        const distCorpusDir = path.join(process.cwd(), 'dist', 'corpus');
        const cfMaxBytes = 24 * 1024 * 1024;
        if (fs.existsSync(distCorpusDir)) {
          for (const entry of fs.readdirSync(distCorpusDir)) {
            if (!entry.endsWith('.json')) continue;
            const fullPath = path.join(distCorpusDir, entry);
            const gzTwin = `${fullPath}.gz`;
            try {
              const stat = fs.statSync(fullPath);
              if (stat.size > cfMaxBytes && fs.existsSync(gzTwin)) {
                fs.unlinkSync(fullPath);
                console.log(
                  `[cloudflare-pages] Pruned oversized uncompressed shard dist/corpus/${entry} (${(stat.size / 1024 / 1024).toFixed(1)} MiB); keeping ${entry}.gz + HF CDN fallback.`
                );
              }
            } catch {
              // ignore stat/unlink error
            }
          }
        }

        const distDir = path.join(process.cwd(), 'dist');
        if (fs.existsSync(distDir)) {
          const headersContent = [
            '/assets/*',
            '  Cache-Control: public, max-age=31536000, immutable',
            '/fonts/*',
            '  Cache-Control: public, max-age=31536000, immutable',
            '  Access-Control-Allow-Origin: *',
            '/corpus/*.gz',
            '  Cache-Control: public, max-age=86400',
            '  Access-Control-Allow-Origin: *',
            '/corpus/*.json',
            '  Cache-Control: public, max-age=86400',
            '  Access-Control-Allow-Origin: *',
            '/data/*',
            '  Cache-Control: public, max-age=86400',
            '  Access-Control-Allow-Origin: *',
            '',
          ].join('\n');
          fs.writeFileSync(path.join(distDir, '_headers'), headersContent, 'utf8');
        }
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
        '**/hf-buddhist-qa-space/**',
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
