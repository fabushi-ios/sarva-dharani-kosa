/**
 * src/services/audio/browserOnnxTtsEngine.ts
 *
 * Zero-Backend Browser-Side 48,000 Hz Classical Sanskrit Neural VITS Engine
 * Runs the authentic IIT Madras / Ninada Sanskrit VITS ONNX models (`sa.onnx` / `sa_female.onnx`)
 * directly in the browser via `onnxruntime-web` (WebAssembly SIMD), hosted on
 * Hugging Face Hub CDN (`https://huggingface.co/bhrum108/sarva-dharani-kosa-tts`)
 * with persistent Browser CacheStorage (`sarva-dharani-onnx-v1`), idle pre-warming,
 * priority mutex scheduling, and sub-clause breath chunking for sub-300ms time-to-first-audio.
 */

import { iastToDevanagari } from '../../core/sanskrit/transliterator';

export const HF_MODEL_CDN_BASE =
  'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main';

const ORT_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js',
  'https://unpkg.com/onnxruntime-web@1.20.1/dist/ort.min.js',
];
const ORT_WASM_DIR = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const CACHE_BUCKET = 'sarva-dharani-onnx-v1';
const TARGET_SAMPLE_RATE = 48000;
const PEAK_TARGET_LINEAR = 0.8912509381337456; // -1.0 dBFS

/**
 * Maximum words per VITS inference call so Transformer attention O(L^2) stays < 300ms
 * and never blocks the browser main thread for tens of seconds on long verses.
 */
const MAX_WORDS_PER_VITS_CHUNK = 5;
const MAX_CHARS_PER_VITS_CHUNK = 42;

const DEVA_CONSONANTS = new Set(
  Array.from('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ')
);

interface StudioVocabSpec {
  blank_id: number;
  pad_id: number;
  char_to_id: Record<string, number>;
}

interface OrtTensor {
  data: Float32Array | BigInt64Array | Int32Array;
  dims: readonly number[];
}

interface OrtSession {
  inputNames: readonly string[];
  outputNames: readonly string[];
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}

interface OrtGlobal {
  env: {
    wasm: {
      wasmPaths: string;
      numThreads?: number;
      simd?: boolean;
    };
  };
  Tensor: new (
    type: 'int64' | 'float32',
    data: BigInt64Array | Float32Array,
    dims: number[]
  ) => OrtTensor;
  InferenceSession: {
    create(
      buffer: ArrayBuffer | Uint8Array,
      options?: { executionProviders?: string[]; graphOptimizationLevel?: string }
    ): Promise<OrtSession>;
  };
}

let ortLoadPromise: Promise<OrtGlobal> | null = null;
let vocabPromise: Promise<StudioVocabSpec> | null = null;
const sessionCache = new Map<string, Promise<OrtSession>>();
const readyVoices = new Set<'male' | 'female'>();

/**
 * Priority-aware mutex queue so two `session.run()` calls never collide
 * on the single-threaded WebAssembly session, and active user playback
 * always jumps ahead of background prefetching.
 */
interface QueuedTask {
  priority: 'high' | 'low';
  run: () => Promise<void>;
}

const inferenceQueue: QueuedTask[] = [];
let inferenceRunning = false;

function scheduleInference<T>(
  taskFn: () => Promise<T>,
  priority: 'high' | 'low' = 'high'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const wrapped = async () => {
      try {
        const res = await taskFn();
        resolve(res);
      } catch (err) {
        reject(err);
      }
    };

    if (priority === 'high') {
      let insertIdx = inferenceQueue.length;
      for (let i = 0; i < inferenceQueue.length; i++) {
        if (inferenceQueue[i].priority === 'low') {
          insertIdx = i;
          break;
        }
      }
      inferenceQueue.splice(insertIdx, 0, { priority, run: wrapped });
    } else {
      inferenceQueue.push({ priority, run: wrapped });
    }

    void drainInferenceQueue();
  });
}

async function drainInferenceQueue(): Promise<void> {
  if (inferenceRunning) return;
  inferenceRunning = true;
  try {
    while (inferenceQueue.length > 0) {
      const next = inferenceQueue.shift();
      if (next) {
        await next.run();
        // Yield briefly to keep browser UI responsive at 60fps
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  } finally {
    inferenceRunning = false;
  }
}

async function fetchWithPersistentCache(url: string): Promise<Response> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_BUCKET);
      const cached = await cache.match(url);
      if (cached && cached.ok) {
        return cached;
      }
      const fresh = await fetch(url, { mode: 'cors' });
      if (fresh.ok) {
        await cache.put(url, fresh.clone());
      }
      return fresh;
    } catch {
      // Fallback to direct fetch if CacheStorage is restricted
    }
  }
  return fetch(url, { mode: 'cors' });
}

async function ensureOrtLoaded(): Promise<OrtGlobal> {
  if (typeof window === 'undefined') {
    throw new Error('Browser ONNX engine requires window environment');
  }
  const win = window as unknown as { ort?: OrtGlobal; crossOriginIsolated?: boolean };
  if (win.ort) {
    return win.ort;
  }
  if (ortLoadPromise) {
    return ortLoadPromise;
  }

  ortLoadPromise = (async () => {
    let lastError: unknown = null;
    for (const src of ORT_CDN_URLS) {
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
        if (win.ort) {
          win.ort.env.wasm.wasmPaths = ORT_WASM_DIR;
          win.ort.env.wasm.simd = true;
          win.ort.env.wasm.numThreads = win.crossOriginIsolated
            ? Math.min(4, navigator.hardwareConcurrency || 2)
            : 1;
          return win.ort;
        }
      } catch (err) {
        lastError = err;
      }
    }
    ortLoadPromise = null;
    throw lastError instanceof Error ? lastError : new Error('Unable to load onnxruntime-web');
  })();

  return ortLoadPromise;
}

async function getSanskritVocab(): Promise<StudioVocabSpec> {
  if (!vocabPromise) {
    vocabPromise = (async () => {
      const res = await fetchWithPersistentCache(`${HF_MODEL_CDN_BASE}/vocabs.json`);
      if (!res.ok) {
        vocabPromise = null;
        throw new Error(`Failed to load vocabs.json (${res.status})`);
      }
      const json = (await res.json()) as {
        languages: Record<string, StudioVocabSpec>;
      };
      return json.languages.sa;
    })();
  }
  return vocabPromise;
}

async function getOrLoadSession(voice: 'male' | 'female'): Promise<{
  session: OrtSession;
  modelId: string;
}> {
  const relPath =
    voice === 'female' ? 'onnx_mobile/sa_female.onnx' : 'onnx_mobile/sa.onnx';
  const modelUrl = `${HF_MODEL_CDN_BASE}/${relPath}`;
  const modelId = `bhrum108/sarva-dharani-kosa-tts:${relPath}`;

  let sessPromise = sessionCache.get(relPath);
  if (!sessPromise) {
    sessPromise = (async () => {
      const [ort, res] = await Promise.all([
        ensureOrtLoaded(),
        fetchWithPersistentCache(modelUrl),
      ]);
      if (!res.ok) {
        throw new Error(`Failed to download ONNX model ${modelUrl} (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const session = await ort.InferenceSession.create(new Uint8Array(buf), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      readyVoices.add(voice);
      return session;
    })();
    sessPromise.catch(() => {
      sessionCache.delete(relPath);
      readyVoices.delete(voice);
    });
    sessionCache.set(relPath, sessPromise);
  }

  const session = await sessPromise;
  readyVoices.add(voice);
  return { session, modelId };
}

/**
 * Returns true if the ONNX Runtime Web session for `voice` is already downloaded and compiled in RAM.
 */
export function isBrowserOnnxReady(voice: 'male' | 'female' = 'male'): boolean {
  return readyVoices.has(voice);
}

let keepAliveSent = false;

function sendHfKeepAliveBeacon(): void {
  if (keepAliveSent || typeof window === 'undefined' || typeof fetch === 'undefined') {
    return;
  }
  keepAliveSent = true;
  setTimeout(() => {
    void fetch(`${HF_MODEL_CDN_BASE}/vocabs.json?keepalive=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    }).catch(() => {});
    void fetch(`https://bhrum108-sarva-dharani-kosa.static.hf.space/index.html?keepalive=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    }).catch(() => {});
  }, 4000);
}

/**
 * Pre-downloads and compiles the ONNX model in the background so that when the user clicks Play,
 * zero download or WASM compilation delay occurs.
 */
export async function warmupBrowserOnnxVits(voice: 'male' | 'female' = 'male'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  sendHfKeepAliveBeacon();
  try {
    await Promise.all([ensureOrtLoaded(), getSanskritVocab(), getOrLoadSession(voice)]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits up to `timeoutMs` for the ONNX session to finish loading; resolves `false` on timeout.
 */
export async function waitForBrowserOnnxReady(
  voice: 'male' | 'female' = 'male',
  timeoutMs = 1800
): Promise<boolean> {
  if (readyVoices.has(voice)) return true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const ok = await Promise.race<boolean>([
      warmupBrowserOnnxVits(voice),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
    return ok;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Splits a single clause into short breath-groups (max ~5 words / 42 Devanāgarī chars)
 * so VITS self-attention never stalls on 200+ character mantra lines.
 */
function splitClauseIntoBreathChunks(
  vitsText: string,
  endPauseMs: number
): Array<{ vitsText: string; pauseMs: number }> {
  const words = vitsText.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS_PER_VITS_CHUNK && vitsText.length <= MAX_CHARS_PER_VITS_CHUNK) {
    return [{ vitsText, pauseMs: endPauseMs }];
  }

  const chunks: Array<{ vitsText: string; pauseMs: number }> = [];
  let currentWords: string[] = [];
  let currentLen = 0;

  for (const w of words) {
    const nextLen = currentLen === 0 ? w.length : currentLen + 1 + w.length;
    if (
      currentWords.length > 0 &&
      (currentWords.length >= MAX_WORDS_PER_VITS_CHUNK || nextLen > MAX_CHARS_PER_VITS_CHUNK)
    ) {
      chunks.push({
        vitsText: currentWords.join(' '),
        pauseMs: 35,
      });
      currentWords = [w];
      currentLen = w.length;
    } else {
      currentWords.push(w);
      currentLen = nextLen;
    }
  }

  if (currentWords.length > 0) {
    chunks.push({
      vitsText: currentWords.join(' '),
      pauseMs: endPauseMs,
    });
  }

  return chunks;
}

function normalizeSikshaDevanagari(
  rawText: string,
  isSingleSyllable: boolean
): {
  clauses: Array<{ vitsText: string; pauseMs: number }>;
} {
  const hasDeva = /[\u0900-\u097F]/.test(rawText);
  let deva = hasDeva ? rawText : iastToDevanagari(rawText);
  deva = deva
    .normalize('NFC')
    .replace(/ॐ/g, 'ओम्')
    .replace(/ॠ/g, 'ऋ')
    .replace(/ॄ/g, 'ृ')
    .replace(/ऌ/g, 'लृ')
    .replace(/ॡ/g, 'लृ')
    .replace(/ॢ/g, '्लृ')
    .replace(/ॣ/g, '्लृ');

  if (isSingleSyllable) {
    const trimmed = deva.trim();
    if (trimmed.length === 1 && DEVA_CONSONANTS.has(trimmed)) {
      return { clauses: [{ vitsText: `${trimmed}ऽ`, pauseMs: 0 }] };
    }
    return { clauses: [{ vitsText: trimmed, pauseMs: 0 }] };
  }

  deva = deva.replace(/\s*ऽ+/g, '');
  const parts = deva.split(/(॥|।|\|\||\|)/);
  const rawClauses: Array<{ vitsText: string; pauseMs: number }> = [];
  let cur = '';

  for (const p of parts) {
    const ps = p.trim();
    if (!ps) continue;
    if (ps === '॥' || ps === '||') {
      if (cur.trim()) {
        rawClauses.push({ vitsText: cur.trim(), pauseMs: 420 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = 420;
      }
    } else if (ps === '।' || ps === '|') {
      if (cur.trim()) {
        rawClauses.push({ vitsText: cur.trim(), pauseMs: 220 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = Math.max(
          rawClauses[rawClauses.length - 1].pauseMs,
          220
        );
      }
    } else {
      cur = cur ? `${cur} ${ps}`.trim() : ps;
    }
  }
  if (cur.trim()) {
    rawClauses.push({ vitsText: cur.trim(), pauseMs: 0 });
  }

  const finalClauses: Array<{ vitsText: string; pauseMs: number }> = [];
  for (const cl of rawClauses) {
    const normalizedWords = cl.vitsText
      .split(/\s+/)
      .map((w) => (w.length === 1 && DEVA_CONSONANTS.has(w) ? `${w}ऽ` : w))
      .join(' ');
    const breathChunks = splitClauseIntoBreathChunks(normalizedWords, cl.pauseMs);
    for (const bc of breathChunks) {
      finalClauses.push(bc);
    }
  }

  return {
    clauses:
      finalClauses.length > 0
        ? finalClauses
        : [{ vitsText: deva.trim() || 'अ', pauseMs: 0 }],
  };
}

function upsample24kTo48kAndMaster(pcm24k: Float32Array): Float32Array {
  const n24 = pcm24k.length;
  if (n24 === 0) return new Float32Array(0);
  const n48 = n24 * 2;
  const out = new Float32Array(n48);

  // 2x linear phase-aligned interpolation from 24kHz to 48kHz
  for (let i = 0; i < n24 - 1; i++) {
    const s0 = pcm24k[i];
    const s1 = pcm24k[i + 1];
    out[2 * i] = s0;
    out[2 * i + 1] = 0.5 * (s0 + s1);
  }
  out[n48 - 2] = pcm24k[n24 - 1];
  out[n48 - 1] = pcm24k[n24 - 1];

  // 1-pole DC blocker y[n] = x[n] - x[n-1] + 0.9965 * y[n-1]
  let prevX = 0;
  let prevY = 0;
  let sum = 0;
  for (let i = 0; i < n48; i++) {
    const x = out[i];
    const y = x - prevX + 0.9965 * prevY;
    prevX = x;
    prevY = y;
    out[i] = y;
    sum += y;
  }
  const mean = sum / n48;
  for (let i = 0; i < n48; i++) {
    out[i] -= mean;
  }

  // Cosine fade-in (8ms) and fade-out (20ms)
  const fadeIn = Math.min(Math.round(0.008 * TARGET_SAMPLE_RATE), Math.floor(n48 / 3));
  const fadeOut = Math.min(Math.round(0.02 * TARGET_SAMPLE_RATE), Math.floor(n48 / 2));
  for (let i = 0; i < fadeIn; i++) {
    out[i] *= 0.5 * (1 - Math.cos((Math.PI * i) / Math.max(1, fadeIn - 1)));
  }
  for (let i = 0; i < fadeOut; i++) {
    const w = 0.5 * (1 + Math.cos((Math.PI * i) / Math.max(1, fadeOut - 1)));
    out[n48 - fadeOut + i] *= w;
  }

  // Peak normalize to -1.0 dBFS
  let peak = 0;
  for (let i = 0; i < n48; i++) {
    const a = Math.abs(out[i]);
    if (a > peak) peak = a;
  }
  if (peak > 1e-5) {
    const scale = PEAK_TARGET_LINEAR / peak;
    for (let i = 0; i < n48; i++) {
      out[i] *= scale;
    }
  }
  return out;
}

export interface AcousticChunkSpan {
  speechStartSec: number;
  speechEndSec: number;
  charCount: number;
}

export async function synthesizeWithBrowserOnnxVits(
  ctx: AudioContext,
  text: string,
  voice: 'male' | 'female' = 'male',
  rate = 1.0,
  isSingleSyllable = false,
  priority: 'high' | 'low' = 'high'
): Promise<{
  audioBuffer: AudioBuffer;
  pcm48k: Float32Array;
  durationSec: number;
  model: string;
  chunkSpans: AcousticChunkSpan[];
}> {
  const [ort, vocab, { session, modelId }] = await Promise.all([
    ensureOrtLoaded(),
    getSanskritVocab(),
    getOrLoadSession(voice),
  ]);

  const effRate = Math.max(0.5, Math.min(2.0, rate));
  const { clauses } = normalizeSikshaDevanagari(text, isSingleSyllable);
  const c2i = vocab.char_to_id;
  const blankId = BigInt(vocab.blank_id ?? 143);

  const pcmParts: Float32Array[] = [];
  const chunkSpans: AcousticChunkSpan[] = [];
  let totalSamples = 0;

  for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
    const cl = clauses[cIdx];
    const cleaned = cl.vitsText
      .replace(/[\u0951-\u0954\u1cd0-\u1cff\u200c\u200d\ufeff]/g, '')
      .toLowerCase()
      .trim();

    const rawIds: bigint[] = [];
    for (const ch of cleaned) {
      if (ch in c2i) {
        rawIds.push(BigInt(c2i[ch]));
      }
    }
    if (rawIds.length === 0) {
      rawIds.push(BigInt(c2i[' '] ?? vocab.pad_id ?? 0));
    }

    const interleaved = new BigInt64Array(rawIds.length * 2 + 1);
    interleaved[0] = blankId;
    for (let i = 0; i < rawIds.length; i++) {
      interleaved[2 * i + 1] = rawIds[i];
      interleaved[2 * i + 2] = blankId;
    }

    const scales = new Float32Array([1.0 / effRate, 0.333, isSingleSyllable ? 0.0 : 0.25]);
    const feeds: Record<string, OrtTensor> = {
      input_ids: new ort.Tensor('int64', interleaved, [1, interleaved.length]),
      scales: new ort.Tensor('float32', scales, [3]),
    };

    const clause48k = await scheduleInference(async () => {
      const outputs = await session.run(feeds);
      const firstOutputName = session.outputNames[0] || Object.keys(outputs)[0];
      const wavOut = outputs[firstOutputName].data as Float32Array;
      return upsample24kTo48kAndMaster(wavOut);
    }, priority);

    const chunkStartSample = totalSamples;
    const nSamps = clause48k.length;
    const maxLeadTrim = Math.min(Math.floor(nSamps * 0.25), Math.round(0.11 * TARGET_SAMPLE_RATE));
    const maxTailTrim = Math.min(Math.floor(nSamps * 0.3), Math.round(0.16 * TARGET_SAMPLE_RATE));

    let onsetIdx = 0;
    while (onsetIdx < maxLeadTrim && Math.abs(clause48k[onsetIdx]) < 0.022) {
      onsetIdx++;
    }
    let offsetIdx = nSamps - 1;
    while (offsetIdx > nSamps - 1 - maxTailTrim && Math.abs(clause48k[offsetIdx]) < 0.022) {
      offsetIdx--;
    }

    const speechStartSec = (chunkStartSample + onsetIdx) / TARGET_SAMPLE_RATE;
    const speechEndSec = Math.max(
      speechStartSec + 0.06,
      (chunkStartSample + Math.max(onsetIdx + 1, offsetIdx)) / TARGET_SAMPLE_RATE
    );
    const charCount = Math.max(1, cleaned.replace(/\s+/g, '').length);

    chunkSpans.push({
      speechStartSec,
      speechEndSec,
      charCount,
    });

    pcmParts.push(clause48k);
    totalSamples += clause48k.length;

    if (cl.pauseMs > 0 && cIdx < clauses.length - 1) {
      const pauseSamps = Math.round(((cl.pauseMs / effRate) / 1000) * TARGET_SAMPLE_RATE);
      if (pauseSamps > 0) {
        const silence = new Float32Array(pauseSamps);
        pcmParts.push(silence);
        totalSamples += pauseSamps;
      }
    }
  }

  const finalPcm = new Float32Array(Math.max(480, totalSamples));
  let offset = 0;
  for (const part of pcmParts) {
    finalPcm.set(part, offset);
    offset += part.length;
  }

  const audioBuffer = ctx.createBuffer(1, finalPcm.length, TARGET_SAMPLE_RATE);
  audioBuffer.getChannelData(0).set(finalPcm);

  return {
    audioBuffer,
    pcm48k: finalPcm,
    durationSec: finalPcm.length / TARGET_SAMPLE_RATE,
    model: modelId,
    chunkSpans,
  };
}

