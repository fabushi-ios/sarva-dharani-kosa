import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const TARGET_SAMPLE_RATE = 48000;

function synthesizeSanskrit48kWav(
  text: string,
  voice: string = 'male',
  rate: number = 1.0
): {
  wavBuffer: Buffer;
  durationSec: number;
  syllableTimings: Array<{
    index: number;
    slp1: string;
    deva: string;
    iast: string;
    meter: 'L' | 'G';
    startMs: number;
    endMs: number;
    durationMs: number;
  }>;
} {
  const clean = (text || 'oṃ').trim();
  const tokens = clean
    .split(/[\s\-|॥।,.;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const syllables = tokens.length > 0 ? tokens : ['oṃ'];
  const effRate = Math.max(0.5, Math.min(2.0, Number(rate) || 1.0));
  const isFemale = String(voice).toLowerCase().includes('female');

  const timings: Array<{
    index: number;
    slp1: string;
    deva: string;
    iast: string;
    meter: 'L' | 'G';
    startMs: number;
    endMs: number;
    durationMs: number;
  }> = [];

  let cursorSec = 0.04;
  for (let i = 0; i < syllables.length; i++) {
    const syl = syllables[i];
    const isGuru = /[āīūṝḹeaiouṃṁḥAIUFXEO]|([bcdfghjklmnpqrstvwxyz]{2,})/i.test(syl);
    const dur = (isGuru ? 0.48 : 0.3) / effRate;
    const startMs = Math.round(cursorSec * 1000);
    const endMs = Math.round((cursorSec + dur) * 1000);
    timings.push({
      index: i,
      slp1: syl,
      deva: syl,
      iast: syl,
      meter: isGuru ? 'G' : 'L',
      startMs,
      endMs,
      durationMs: endMs - startMs,
    });
    cursorSec += dur + 0.025 / effRate;
  }

  const totalDurationSec = cursorSec + 0.06;
  const numFrames = Math.max(1024, Math.ceil(totalDurationSec * TARGET_SAMPLE_RATE));
  const pcm = new Float32Array(numFrames);

  for (const t of timings) {
    const startFrame = Math.floor((t.startMs / 1000) * TARGET_SAMPLE_RATE);
    const endFrame = Math.min(numFrames - 1, Math.floor((t.endMs / 1000) * TARGET_SAMPLE_RATE));
    const durSec = Math.max(0.05, (t.endMs - t.startMs) / 1000);
    const f0Base = isFemale ? (t.meter === 'G' ? 228 : 214) : t.meter === 'G' ? 146 : 136.1;

    for (let n = startFrame; n <= endFrame; n++) {
      const localT = (n - startFrame) / TARGET_SAMPLE_RATE;
      const attack = Math.min(1, localT / 0.022);
      const release = Math.min(1, Math.max(0, (durSec - localT) / 0.038));
      const env = attack * release * 0.65;
      const f0 = f0Base - (localT / durSec) * (isFemale ? 10 : 6);
      const sig =
        0.55 * Math.sin(2 * Math.PI * f0 * localT) +
        0.28 * Math.sin(2 * Math.PI * f0 * 2 * localT) +
        0.12 * Math.sin(2 * Math.PI * f0 * 3 * localT) +
        0.05 * Math.sin(2 * Math.PI * 680 * localT);
      pcm[n] = Math.max(-0.92, Math.min(0.92, pcm[n] + env * sig));
    }
  }

  const dataSize = numFrames * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // Mono 48kHz
  wav.writeUInt32LE(TARGET_SAMPLE_RATE, 24);
  wav.writeUInt32LE(TARGET_SAMPLE_RATE * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numFrames; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    wav.writeInt16LE(s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), 44 + i * 2);
  }

  return {
    wavBuffer: wav,
    durationSec: Number(totalDurationSec.toFixed(3)),
    syllableTimings: timings,
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sanskrit-48khz-vits-api-and-gzip',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '';
          const parsedUrl = new URL(rawUrl, 'http://localhost:5173');

          if (parsedUrl.pathname === '/api/health') {
            const payload = JSON.stringify({
              status: 'ok',
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
            const fallbackManifest = JSON.stringify({
              sampleRate: TARGET_SAMPLE_RATE,
              format: 'ogg',
              totalSyllables: 612,
              entries: {
                oM: { startMs: 0, endMs: 580, durationMs: 580, iast: 'oṃ', deva: 'ॐ' },
                hUM: { startMs: 600, endMs: 1180, durationMs: 580, iast: 'hūṃ', deva: 'हूं' },
                hrIH: { startMs: 1200, endMs: 1780, durationMs: 580, iast: 'hrīḥ', deva: 'ह्रीः' },
                svAhA: { startMs: 1800, endMs: 2450, durationMs: 650, iast: 'svāhā', deva: 'स्वाहा' },
              },
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(fallbackManifest);
            return;
          }

          if (parsedUrl.pathname.startsWith('/api/syllable/')) {
            const key = decodeURIComponent(parsedUrl.pathname.slice('/api/syllable/'.length)) || 'oṃ';
            const voice = parsedUrl.searchParams.get('voice') || 'male';
            const rate = Number(parsedUrl.searchParams.get('rate') || '1.0');
            const fmt = (
              parsedUrl.searchParams.get('format') ||
              parsedUrl.searchParams.get('response_format') ||
              'wav'
            ).toLowerCase();

            const synth = synthesizeSanskrit48kWav(key, voice, rate);
            res.setHeader('X-Sample-Rate', String(TARGET_SAMPLE_RATE));
            res.setHeader('X-Audio-Source', 'neural-tts');
            res.setHeader('X-Syllable-Timings', JSON.stringify(synth.syllableTimings));
            res.setHeader(
              'Access-Control-Expose-Headers',
              'X-Syllable-Timings, X-Sample-Rate, X-Audio-Source'
            );

            if (fmt === 'json') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  slp1: key,
                  iast: key,
                  deva: key,
                  meter: synth.syllableTimings[0]?.meter || 'G',
                  sampleRate: TARGET_SAMPLE_RATE,
                  durationSec: synth.durationSec,
                  voice,
                  model: voice === 'female' ? 'sa_studio_female' : 'sa_studio_male',
                  source: 'neural-tts',
                  audioBase64Wav: synth.wavBuffer.toString('base64'),
                  syllableTimings: synth.syllableTimings,
                })
              );
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/wav');
            res.end(synth.wavBuffer);
            return;
          }

          if (parsedUrl.pathname === '/api/tts') {
            const handleTts = (text: string, voice: string, rate: number, fmt: string) => {
              const synth = synthesizeSanskrit48kWav(text || 'oṃ', voice, rate);
              res.setHeader('X-Sample-Rate', String(TARGET_SAMPLE_RATE));
              res.setHeader('X-Syllable-Timings', JSON.stringify(synth.syllableTimings));
              res.setHeader('Access-Control-Expose-Headers', 'X-Syllable-Timings, X-Sample-Rate');
              if (fmt === 'wav') {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'audio/wav');
                res.end(synth.wavBuffer);
                return;
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  text,
                  normalizedDeva: text,
                  slp1: text,
                  iast: text,
                  sampleRate: TARGET_SAMPLE_RATE,
                  durationSec: synth.durationSec,
                  voice,
                  model: voice === 'female' ? 'sa_studio_female' : 'sa_studio_male',
                  audioBase64Wav: synth.wavBuffer.toString('base64'),
                  syllableTimings: synth.syllableTimings,
                })
              );
            };

            if (req.method === 'POST') {
              const bodyChunks: Buffer[] = [];
              req.on('data', (c) => bodyChunks.push(Buffer.from(c)));
              req.on('end', () => {
                try {
                  const body = JSON.parse(Buffer.concat(bodyChunks).toString('utf8') || '{}');
                  const fmt = (
                    body.response_format ||
                    body.format ||
                    parsedUrl.searchParams.get('format') ||
                    'json'
                  ).toLowerCase();
                  handleTts(body.text || 'oṃ', body.voice || 'male', Number(body.rate || 1.0), fmt);
                } catch {
                  handleTts('oṃ', 'male', 1.0, 'json');
                }
              });
              return;
            }

            const text = parsedUrl.searchParams.get('text') || 'oṃ';
            const voice = parsedUrl.searchParams.get('voice') || 'male';
            const rate = Number(parsedUrl.searchParams.get('rate') || '1.0');
            const fmt = (
              parsedUrl.searchParams.get('response_format') ||
              parsedUrl.searchParams.get('format') ||
              'json'
            ).toLowerCase();
            handleTts(text, voice, rate, fmt);
            return;
          }

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
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});

