/**
 * src/services/audio/browserOnnxTtsEngine.ts
 *
 * Zero-Backend Browser-Side 48,000 Hz Classical Sanskrit Neural VITS Engine
 * Runs the authentic IIT Madras / Ninada Studio Sanskrit VITS ONNX models (`sa.onnx` / `sa_female.onnx`)
 * directly in the browser via `onnxruntime-web` (WebAssembly SIMD), hosted on
 * Hugging Face Hub CDN (`https://huggingface.co/bhrum108/sarva-dharani-kosa-tts`)
 * with persistent Browser CacheStorage (`sarva-dharani-onnx-v2`), idle pre-warming,
 * priority mutex scheduling, native `\u200a` (U+200A) inherent-`a` phonetic conditioning,
 * exact VITS duration-tensor frame shaping, and 31-tap polyphase half-band 48kHz mastering.
 */

import { iastToDevanagari } from '../../core/sanskrit/transliterator';

export const HF_MODEL_CDN_BASE = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_HF_MODEL_BASE_URL) ||
  'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main'
).replace(/\/+$/, '');

export const HF_TTS_API_BASE_URL = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_HF_TTS_API_URL) ||
  'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space'
).replace(/\/+$/, '');

export const HF_CHINA_MIRROR_BASE =
  'https://hf-mirror.com/bhrum108/sarva-dharani-kosa-tts/resolve/main';

const ORT_CDN_URLS = [
  '/ort-cdn/ort.min.js',
  'https://registry.npmmirror.com/onnxruntime-web/1.20.1/files/dist/ort.min.js',
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js',
  'https://unpkg.com/onnxruntime-web@1.20.1/dist/ort.min.js',
];
const ORT_WASM_DIR = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const CACHE_BUCKET = 'sarva-dharani-onnx-v2';
const SOURCE_SAMPLE_RATE = 24000;
const TARGET_SAMPLE_RATE = 48000;
const VITS_HOP_LENGTH_24K = 256;
const ONSET_PAD_SAMPLES_24K = 240; // 10ms clean zero pre-pad so initial plosives/affricates are never clipped
const PEAK_TARGET_LINEAR = 0.8912509381337456; // -1.0 dBFS

/**
 * Ninada Sanskrit (`languages.sa`) dedicated inherent-`a` (hrasva `a`) realization token:
 * U+200A HAIR SPACE (`id = 102` in `vocabs.json`, present exclusively in Sanskrit `sa` and absent in Hindi `hi`).
 * Appending `\u200a` to Devanāgarī words ending in a bare consonant prevents modern Indo-Aryan word-final
 * schwa deletion (`cipa` -> `ci-pa`, `hunupa` -> `hu-nu-pa`, `dharma` -> `dhar-ma`) without introducing
 * any Avagraha glottal stop or vowel duplication (`pa-a`).
 */
export const VITS_INHERENT_A_MARKER = '\u200a';

/**
 * Explicit whitespace patterns that NEVER match U+200A (`\u200a`), so `.trim()` / `.split()`
 * cannot accidentally strip or split our Sanskrit inherent-`a` phonetic marker.
 */
const ASCII_WS_SPLIT_RE = /[ \t\r\n\f\v\u00a0\u3000]+/;
const ASCII_WS_TRIM_RE = /^[ \t\r\n\f\v\u00a0\u3000]+|[ \t\r\n\f\v\u00a0\u3000]+$/g;

/**
 * Maximum words per VITS inference call so Transformer attention O(L^2) stays < 300ms
 * and never blocks the browser main thread on long mantra lines.
 */
const MAX_WORDS_PER_VITS_CHUNK = 5;
const MAX_CHARS_PER_VITS_CHUNK = 48;

export const DEVA_CONSONANTS = new Set(
  Array.from('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळक़ख़ग़ज़ड़ढ़फ़य़')
);

const BARE_VIRAMA_SYLLABLE_RE = /^(?:[\u0915-\u0939\u0958-\u095f]\u093c?\u094d)+$/;
const TRAILING_PUNCT_RE = /[।॥|.,;:!?'"()[\]{}—–-]+$/u;

/**
 * Precomputed 8-pair (16-tap odd branch / 31-tap full) symmetric Kaiser-windowed (beta = 7.0)
 * half-band polyphase 2x FIR interpolation weights for 24,000 Hz -> 48,000 Hz upsampling.
 */
const HALFBAND_ODD_WEIGHTS: Float64Array = (() => {
  const M = 8;
  const beta = 7.0;
  const besselI0 = (x: number): number => {
    let sum = 1.0;
    let term = 1.0;
    const halfX = x * 0.5;
    for (let k = 1; k <= 24; k++) {
      term *= (halfX * halfX) / (k * k);
      sum += term;
      if (term < 1e-12 * sum) break;
    }
    return sum;
  };
  const denom = besselI0(beta);
  const w = new Float64Array(M);
  let total = 0;
  for (let k = 0; k < M; k++) {
    const d = k + 0.5;
    const sinc = Math.sin(Math.PI * d) / (Math.PI * d);
    const ratio = d / M;
    const win = besselI0(beta * Math.sqrt(Math.max(0, 1 - ratio * ratio))) / denom;
    // Alternate sign for midpoint interpolation at n + 0.5: cos(pi * k) = (-1)^k
    const val = (k % 2 === 0 ? 1 : -1) * sinc * win;
    w[k] = val;
    total += 2 * val;
  }
  for (let k = 0; k < M; k++) {
    w[k] /= total;
  }
  return w;
})();

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
const sessionCache = new Map<string, Promise<{ session: OrtSession; modelId: string }>>();
const readyVoices = new Set<'male' | 'female'>();
const activeModelIds = new Map<'male' | 'female', string>();

interface QueuedTask {
  priority: 'high' | 'low';
  abort: () => void;
  run: () => Promise<void>;
}

const inferenceQueue: QueuedTask[] = [];
let inferenceRunning = false;

function createAbortError(): Error {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * Purges any pending low-priority prefetch/prewarm tasks that have not yet started executing,
 * ensuring immediate zero-wait turnaround when the user clicks Play or switches Dhāraṇī entries.
 */
export function cancelLowPriorityBrowserOnnxTasks(): void {
  for (let i = inferenceQueue.length - 1; i >= 0; i--) {
    if (inferenceQueue[i].priority === 'low') {
      const [removed] = inferenceQueue.splice(i, 1);
      removed.abort();
    }
  }
}

function scheduleInference<T>(
  taskFn: () => Promise<T>,
  priority: 'high' | 'low' = 'high',
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const cleanupSignal = () => {
      if (signal) {
        signal.removeEventListener('abort', onSignalAbort);
      }
    };

    const abortTask = () => {
      if (settled) return;
      settled = true;
      cleanupSignal();
      reject(createAbortError());
    };

    const taskEntry: QueuedTask = {
      priority,
      abort: abortTask,
      run: async () => {
        if (settled || signal?.aborted) {
          abortTask();
          return;
        }
        settled = true;
        cleanupSignal();
        try {
          const res = await taskFn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      },
    };

    const onSignalAbort = () => {
      const idx = inferenceQueue.indexOf(taskEntry);
      if (idx !== -1) {
        inferenceQueue.splice(idx, 1);
      }
      abortTask();
    };

    if (signal) {
      signal.addEventListener('abort', onSignalAbort, { once: true });
    }

    if (priority === 'high') {
      let insertIdx = inferenceQueue.length;
      for (let i = 0; i < inferenceQueue.length; i++) {
        if (inferenceQueue[i].priority === 'low') {
          insertIdx = i;
          break;
        }
      }
      inferenceQueue.splice(insertIdx, 0, taskEntry);
    } else {
      inferenceQueue.push(taskEntry);
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
      }
    }
  } finally {
    inferenceRunning = false;
  }
}

function buildCandidateUrls(url: string): string[] {
  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  if (url.startsWith(HF_MODEL_CDN_BASE)) {
    const rel = url.slice(HF_MODEL_CDN_BASE.length).replace(/^\/+/, '');
    const candidates: string[] = [];
    if (origin) {
      candidates.push(`${origin}/hf-cdn/${rel}`);
    }
    candidates.push(url, `${HF_CHINA_MIRROR_BASE}/${rel}`);
    return candidates;
  }
  if (url.startsWith('/') && origin) {
    return [`${origin}${url}`];
  }
  return [url];
}

async function fetchWithPersistentCache(url: string): Promise<Response> {
  const cache =
    typeof window !== 'undefined' && 'caches' in window
      ? await window.caches.open(CACHE_BUCKET).catch(() => null)
      : null;

  if (cache) {
    try {
      const cached = await cache.match(url);
      if (cached && cached.ok) {
        return cached;
      }
    } catch {
      // ignore cache match error
    }
  }

  let lastErr: unknown = null;
  for (const candidateUrl of buildCandidateUrls(url)) {
    try {
      const fresh = await fetch(candidateUrl, { mode: 'cors' });
      if (!fresh.ok) continue;
      const ct = (fresh.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html')) continue;
      if (cache) {
        await cache.put(url, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (err) {
      lastErr = err;
    }
  }

  if (lastErr) throw lastErr;
  return fetch(url, { mode: 'cors' });
}

interface WorkerInferResponse {
  clause48k: Float32Array;
  shapedDurs: number[];
  modelId: string;
}

interface OnnxWorkerClient {
  warmup(voice: 'male' | 'female'): Promise<string>;
  infer(params: {
    voice: 'male' | 'female';
    interleaved: BigInt64Array;
    effRate: number;
    lengthScale?: number;
    validChars: string[];
    isBareVirama: boolean;
    coreCharCount?: number;
  }): Promise<WorkerInferResponse>;
}

let workerClient: OnnxWorkerClient | null = null;
let workerFailed = false;
const workerVoiceInitPromises = new Map<'male' | 'female', Promise<string>>();

function buildWorkerSource(): string {
  const weightsJson = JSON.stringify(Array.from(HALFBAND_ODD_WEIGHTS));
  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const resolvedOrtUrls = ORT_CDN_URLS.map((u) =>
    u.startsWith('/') && origin ? `${origin}${u}` : u
  );
  const ortUrlsJson = JSON.stringify(resolvedOrtUrls);
  return `
"use strict";
const PAGE_ORIGIN = ${JSON.stringify(origin)};
const HF_BASE = ${JSON.stringify(HF_MODEL_CDN_BASE)};
const HF_MIRROR = ${JSON.stringify(HF_CHINA_MIRROR_BASE)};
const ORT_URLS = ${ortUrlsJson};
const ORT_WASM_DIR = ${JSON.stringify(ORT_WASM_DIR)};
const CACHE_BUCKET = ${JSON.stringify(CACHE_BUCKET)};
const ODD_WEIGHTS = new Float64Array(${weightsJson});
const HOP_24K = 256;
const ONSET_PAD_24K = 240;
const PEAK_TARGET = 0.8912509381337456;
const MAX_NORM_GAIN = 14.0;
const INHERENT_A_CH = String.fromCharCode(0x200a);
const VIRAMA_CH = String.fromCharCode(0x094d);

let ortPromise = null;
const sessions = new Map();

function getCandidates(url) {
  if (url.indexOf(HF_BASE) === 0) {
    const rel = url.slice(HF_BASE.length).replace(/^\\/+/, "");
    const list = [];
    if (PAGE_ORIGIN) list.push(PAGE_ORIGIN + "/hf-cdn/" + rel);
    list.push(url, HF_MIRROR + "/" + rel);
    return list;
  }
  return [url];
}

async function fetchCached(url) {
  let cache = null;
  if (typeof caches !== "undefined") {
    try {
      cache = await caches.open(CACHE_BUCKET);
      const hit = await cache.match(url);
      if (hit && hit.ok) return hit;
    } catch (_) {}
  }
  let lastErr = null;
  for (const cand of getCandidates(url)) {
    try {
      const net = await fetch(cand, { mode: "cors" });
      if (!net.ok) continue;
      const ct = (net.headers.get("content-type") || "").toLowerCase();
      if (ct.indexOf("text/html") !== -1) continue;
      if (cache) {
        try { await cache.put(url, net.clone()); } catch (_) {}
      }
      return net;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return fetch(url, { mode: "cors" });
}

async function ensureOrt() {
  if (self.ort) return self.ort;
  if (ortPromise) return ortPromise;
  ortPromise = (async () => {
    let lastErr = null;
    for (const url of ORT_URLS) {
      try {
        try {
          self.importScripts(url);
        } catch (_) {
          const resp = await fetchCached(url);
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          const ct = (resp.headers.get("content-type") || "").toLowerCase();
          if (ct.indexOf("text/html") !== -1) throw new Error("Unexpected HTML");
          const code = await resp.text();
          (0, eval)(code);
        }
        if (self.ort) {
          const slashIdx = url.lastIndexOf("/");
          self.ort.env.wasm.wasmPaths = slashIdx !== -1 ? url.slice(0, slashIdx + 1) : ORT_WASM_DIR;
          self.ort.env.wasm.simd = true;
          const hw = (self.navigator && self.navigator.hardwareConcurrency) || 2;
          self.ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, hw) : 1;
          return self.ort;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    ortPromise = null;
    throw lastErr || new Error("Failed to load onnxruntime-web in worker");
  })();
  return ortPromise;
}

async function fetchModelBytes(voice) {
  const mobileRel = voice === "female" ? "onnx_mobile/sa_female.onnx" : "onnx_mobile/sa.onnx";
  const studioRel = voice === "female" ? "onnx/sa_female.onnx" : "onnx/sa.onnx";
  let chosenRel = mobileRel;
  let resp = await fetchCached(HF_BASE + "/" + mobileRel).catch(() => null);
  if (!resp || !resp.ok) {
    chosenRel = studioRel;
    resp = await fetchCached(HF_BASE + "/" + studioRel);
  }
  if (!resp.ok) {
    throw new Error("Failed to load ONNX model " + chosenRel + " (" + resp.status + ")");
  }
  const buf = await resp.arrayBuffer();
  return { buf, modelId: "bhrum108/sarva-dharani-kosa-tts:" + chosenRel };
}

async function getSession(voice) {
  let p = sessions.get(voice);
  if (!p) {
    p = (async () => {
      const [ort, modelData] = await Promise.all([ensureOrt(), fetchModelBytes(voice)]);
      const session = await ort.InferenceSession.create(new Uint8Array(modelData.buf), {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all"
      });
      // Run 3-token micro warmup so WASM SIMD kernels & arena memory are hot before first click
      try {
        const warmIds = new BigInt64Array([143n, 5n, 143n]);
        const warmScales = new Float32Array([1.0, 0.25, 0.0]);
        await session.run({
          input_ids: new ort.Tensor("int64", warmIds, [1, 3]),
          scales: new ort.Tensor("float32", warmScales, [3])
        });
      } catch (_) {}
      return { session, modelId: modelData.modelId };
    })();
    p.catch(() => sessions.delete(voice));
    sessions.set(voice, p);
  }
  return p;
}

function segmentRms(buf, s0, e0) {
  const s = Math.max(0, s0);
  const e = Math.min(buf.length, e0);
  if (e <= s) return 0;
  let sumSq = 0;
  for (let i = s; i < e; i++) {
    const v = buf[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / (e - s));
}

function cosineTail(buf, fadeStart, fadeEnd) {
  const s = Math.max(0, fadeStart);
  const e = Math.min(buf.length, fadeEnd);
  const len = e - s;
  if (len <= 1) return;
  for (let i = 0; i < len; i++) {
    buf[s + i] *= 0.5 * (1 + Math.cos((Math.PI * i) / (len - 1)));
  }
}

function shapeWav24k(rawWav24k, chars, rawDurs, effRate, isBareVirama, coreCharCount) {
  let expectedLen = chars.length * 2 + 1;
  if (chars.length === 0 || rawDurs.length !== expectedLen || rawWav24k.length === 0) {
    return { wav24k: rawWav24k, durs: rawDurs.slice() };
  }
  let wav = rawWav24k;
  let curChars = chars;
  let durs = rawDurs.map((d) => Math.max(0, Math.round(d)));
  let prefix = new Int32Array(expectedLen + 1);
  for (let i = 0; i < expectedLen; i++) prefix[i + 1] = prefix[i] + durs[i];

  if (!isBareVirama && coreCharCount > 0 && coreCharCount < curChars.length) {
    const coreEndBlankIdx = 2 * coreCharCount;
    const coreLastCh = curChars[coreCharCount - 1];
    const maxTrail = coreLastCh === INHERENT_A_CH ? 4 : 16;
    const trailFrames = Math.min(durs[coreEndBlankIdx], maxTrail);
    const cutFrame = prefix[coreEndBlankIdx] + trailFrames;
    const cutSamples = Math.min(wav.length, cutFrame * HOP_24K);
    const sliced = wav.slice(0, cutSamples);
    const fadeSamples = Math.min(cutSamples, 2 * HOP_24K);
    cosineTail(sliced, cutSamples - fadeSamples, cutSamples);
    wav = sliced;
    curChars = curChars.slice(0, coreCharCount);
    durs = durs.slice(0, coreEndBlankIdx + 1);
    durs[coreEndBlankIdx] = trailFrames;
    expectedLen = curChars.length * 2 + 1;
    prefix = new Int32Array(expectedLen + 1);
    for (let i = 0; i < expectedLen; i++) prefix[i + 1] = prefix[i] + durs[i];
  }

  const lastCharIdx = curChars.length - 1;
  const lastTokenIdx = 2 * lastCharIdx + 1;
  const lastChar = curChars[lastCharIdx];

  if (isBareVirama && lastChar === INHERENT_A_CH) {
    const keepVot = Math.min(durs[lastTokenIdx], 2);
    const cutFrame = prefix[lastTokenIdx] + keepVot;
    const silentTail = 3;
    const cutSamples = Math.min(wav.length, cutFrame * HOP_24K);
    const out = new Float32Array(cutSamples + silentTail * HOP_24K);
    out.set(wav.subarray(0, cutSamples), 0);
    const fadeSamples = Math.min(cutSamples, 2 * HOP_24K);
    cosineTail(out, cutSamples - fadeSamples, cutSamples);
    durs[lastTokenIdx] = keepVot;
    durs[lastTokenIdx + 1] = silentTail;
    return { wav24k: out, durs };
  }

  if (lastChar === VIRAMA_CH) {
    const prevBlankIdx = lastTokenIdx - 1;
    const prevBlankRms = segmentRms(wav, prefix[prevBlankIdx] * HOP_24K, prefix[prevBlankIdx + 1] * HOP_24K);
    const viramaRms = segmentRms(wav, prefix[lastTokenIdx] * HOP_24K, prefix[lastTokenIdx + 1] * HOP_24K);
    if (durs[prevBlankIdx] >= 2 && prevBlankRms < 0.032 && viramaRms > 0.015) {
      const cutSamples = Math.min(wav.length, prefix[lastTokenIdx] * HOP_24K);
      const silentTail = 4;
      const out = new Float32Array(cutSamples + silentTail * HOP_24K);
      out.set(wav.subarray(0, cutSamples), 0);
      const fadeSamples = Math.min(cutSamples, 2 * HOP_24K);
      cosineTail(out, cutSamples - fadeSamples, cutSamples);
      durs[lastTokenIdx] = 0;
      durs[lastTokenIdx + 1] = silentTail;
      return { wav24k: out, durs };
    }
  }

  if (lastChar === INHERENT_A_CH) {
    const prevBlankIdx = lastTokenIdx - 1;
    const prevBlankRms = segmentRms(wav, prefix[prevBlankIdx] * HOP_24K, prefix[prevBlankIdx + 1] * HOP_24K);
    const maxHs = prevBlankRms >= 0.055
      ? Math.max(4, Math.round(13 / effRate) - durs[prevBlankIdx])
      : Math.max(9, Math.round(12 / effRate));
    if (durs[lastTokenIdx] > maxHs) {
      const cutFrame = prefix[lastTokenIdx] + maxHs;
      const cutSamples = Math.min(wav.length, cutFrame * HOP_24K);
      const silentTail = 4;
      const out = new Float32Array(cutSamples + silentTail * HOP_24K);
      out.set(wav.subarray(0, cutSamples), 0);
      const fadeSamples = Math.min(maxHs * HOP_24K, 4 * HOP_24K);
      cosineTail(out, cutSamples - fadeSamples, cutSamples);
      durs[lastTokenIdx] = maxHs;
      durs[lastTokenIdx + 1] = silentTail;
      return { wav24k: out, durs };
    }
  }

  return { wav24k: wav, durs };
}

function upsampleAndMaster(pcm24k) {
  const nRaw = pcm24k.length;
  if (nRaw === 0) return new Float32Array(0);
  const clean24 = new Float32Array(ONSET_PAD_24K + nRaw);
  let prevX = pcm24k[0];
  let prevY = 0;
  let sum = 0;
  for (let i = 0; i < nRaw; i++) {
    const x = pcm24k[i];
    const y = x - prevX + 0.995 * prevY;
    prevX = x;
    prevY = y;
    clean24[ONSET_PAD_24K + i] = y;
    sum += y;
  }
  const mean = sum / nRaw;
  for (let i = 0; i < nRaw; i++) clean24[ONSET_PAD_24K + i] -= mean;

  const microFadeIn = Math.min(36, Math.floor(nRaw / 4));
  for (let i = 0; i < microFadeIn; i++) {
    clean24[ONSET_PAD_24K + i] *= 0.5 * (1 - Math.cos((Math.PI * i) / Math.max(1, microFadeIn - 1)));
  }
  const fadeOut24 = Math.min(384, Math.floor(nRaw / 3));
  cosineTail(clean24, clean24.length - fadeOut24, clean24.length);

  const n24 = clean24.length;
  const n48 = n24 * 2;
  const out = new Float32Array(n48);
  const M = ODD_WEIGHTS.length;
  for (let n = 0; n < n24; n++) {
    out[2 * n] = clean24[n];
    let acc = 0;
    for (let k = 0; k < M; k++) {
      const idxL = n - k;
      const idxR = n + 1 + k;
      acc += ODD_WEIGHTS[k] * ((idxL >= 0 ? clean24[idxL] : 0) + (idxR < n24 ? clean24[idxR] : 0));
    }
    out[2 * n + 1] = acc;
  }

  let peak = 0;
  for (let i = 0; i < n48; i++) {
    const a = Math.abs(out[i]);
    if (a > peak) peak = a;
  }
  if (peak > 1e-5) {
    const scale = peak >= 0.065 ? (PEAK_TARGET / peak) : Math.min(PEAK_TARGET / peak, MAX_NORM_GAIN);
    for (let i = 0; i < n48; i++) out[i] *= scale;
  }
  return out;
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  const id = msg.id;
  try {
    if (msg.type === "warmup") {
      const { modelId } = await getSession(msg.voice);
      self.postMessage({ id, ok: true, modelId });
      return;
    }
    if (msg.type === "infer") {
      const [ort, { session, modelId }] = await Promise.all([ensureOrt(), getSession(msg.voice)]);
      const ids = new BigInt64Array(msg.interleavedBuffer);
      const lenScale = typeof msg.lengthScale === "number" && msg.lengthScale > 0 ? msg.lengthScale : (1.0 / msg.effRate);
      const scales = new Float32Array([lenScale, 0.25, 0.0]);
      const outputs = await session.run({
        input_ids: new ort.Tensor("int64", ids, [1, ids.length]),
        scales: new ort.Tensor("float32", scales, [3])
      });
      const wavName = session.outputNames[0] || "waveform";
      const durName = session.outputNames[1] || "durations";
      const wavOut = outputs[wavName].data;
      const durTensor = outputs[durName];
      const rawDurs = durTensor && durTensor.data ? Array.from(durTensor.data, (v) => Number(v)) : [];
      const shaped = shapeWav24k(
        wavOut,
        msg.validChars,
        rawDurs,
        msg.effRate,
        Boolean(msg.isBareVirama),
        Number(msg.coreCharCount || 0)
      );
      const clause48k = upsampleAndMaster(shaped.wav24k);
      self.postMessage(
        { id, ok: true, pcm48kBuffer: clause48k.buffer, shapedDurs: shaped.durs, modelId },
        [clause48k.buffer]
      );
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};
`;
}

function getOrCreateWorkerClient(): OnnxWorkerClient | null {
  if (workerFailed || typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (workerClient) {
    return workerClient;
  }

  try {
    const blob = new Blob([buildWorkerSource()], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);
    let nextMsgId = 1;
    const pending = new Map<
      number,
      { resolve: (val: unknown) => void; reject: (err: Error) => void }
    >();

    worker.onmessage = (ev: MessageEvent) => {
      const data = ev.data as {
        id: number;
        ok: boolean;
        error?: string;
        modelId?: string;
        pcm48kBuffer?: ArrayBuffer;
        shapedDurs?: number[];
      };
      const entry = pending.get(data.id);
      if (!entry) return;
      pending.delete(data.id);
      if (!data.ok) {
        entry.reject(new Error(data.error || 'Worker ONNX error'));
        return;
      }
      if (data.pcm48kBuffer) {
        entry.resolve({
          clause48k: new Float32Array(data.pcm48kBuffer),
          shapedDurs: data.shapedDurs || [],
          modelId: data.modelId || 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx',
        } satisfies WorkerInferResponse);
      } else {
        entry.resolve(data.modelId || 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx');
      }
    };

    worker.onerror = (err) => {
      workerFailed = true;
      workerClient = null;
      workerVoiceInitPromises.clear();
      for (const [, p] of pending) {
        p.reject(new Error(err.message || 'Worker crashed'));
      }
      pending.clear();
      try {
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    };

    workerClient = {
      warmup(voice: 'male' | 'female'): Promise<string> {
        let p = workerVoiceInitPromises.get(voice);
        if (!p) {
          p = new Promise<string>((resolve, reject) => {
            const id = nextMsgId++;
            pending.set(id, {
              resolve: (val) => {
                const modelId = String(val);
                readyVoices.add(voice);
                activeModelIds.set(voice, modelId);
                resolve(modelId);
              },
              reject: (e) => {
                workerVoiceInitPromises.delete(voice);
                reject(e);
              },
            });
            worker.postMessage({ id, type: 'warmup', voice });
          });
          workerVoiceInitPromises.set(voice, p);
        }
        return p;
      },
      infer(params): Promise<WorkerInferResponse> {
        return new Promise<WorkerInferResponse>((resolve, reject) => {
          const id = nextMsgId++;
          const copy = new BigInt64Array(params.interleaved);
          pending.set(id, {
            resolve: (val) => {
              const res = val as WorkerInferResponse;
              readyVoices.add(params.voice);
              activeModelIds.set(params.voice, res.modelId);
              resolve(res);
            },
            reject,
          });
          worker.postMessage(
            {
              id,
              type: 'infer',
              voice: params.voice,
              interleavedBuffer: copy.buffer,
              effRate: params.effRate,
              lengthScale: params.lengthScale,
              validChars: params.validChars,
              isBareVirama: params.isBareVirama,
              coreCharCount: params.coreCharCount ?? 0,
            },
            [copy.buffer]
          );
        });
      },
    };
    return workerClient;
  } catch {
    workerFailed = true;
    workerClient = null;
    return null;
  }
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
          const slashIdx = src.lastIndexOf('/');
          win.ort.env.wasm.wasmPaths = slashIdx !== -1 ? src.slice(0, slashIdx + 1) : ORT_WASM_DIR;
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
  const mobileRel =
    voice === 'female' ? 'onnx_mobile/sa_female.onnx' : 'onnx_mobile/sa.onnx';
  const studioRel = voice === 'female' ? 'onnx/sa_female.onnx' : 'onnx/sa.onnx';

  let sessPromise = sessionCache.get(voice);
  if (!sessPromise) {
    sessPromise = (async () => {
      // Download model bytes in parallel with loading ONNX Runtime script (eliminates sequential waterfall)
      const fetchModelPromise = (async () => {
        let chosenRel = mobileRel;
        let res = await fetchWithPersistentCache(`${HF_MODEL_CDN_BASE}/${mobileRel}`).catch(
          () => null
        );
        if (!res || !res.ok) {
          chosenRel = studioRel;
          res = await fetchWithPersistentCache(`${HF_MODEL_CDN_BASE}/${studioRel}`);
        }
        if (!res.ok) {
          throw new Error(`Failed to download ONNX model ${chosenRel} (${res.status})`);
        }
        return { buf: await res.arrayBuffer(), chosenRel };
      })();

      const [ort, { buf, chosenRel }] = await Promise.all([
        ensureOrtLoaded(),
        fetchModelPromise,
      ]);
      const session = await ort.InferenceSession.create(new Uint8Array(buf), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      // Run 3-token micro warmup so WASM SIMD kernels are compiled before user interaction
      try {
        const warmIds = new BigInt64Array([143n, 5n, 143n]);
        const warmScales = new Float32Array([1.0, 0.25, 0.0]);
        await session.run({
          input_ids: new ort.Tensor('int64', warmIds, [1, 3]),
          scales: new ort.Tensor('float32', warmScales, [3]),
        });
      } catch {
        // Ignore warmup glitch if any
      }
      const modelId = `bhrum108/sarva-dharani-kosa-tts:${chosenRel}`;
      readyVoices.add(voice);
      activeModelIds.set(voice, modelId);
      return { session, modelId };
    })();
    sessPromise.catch(() => {
      sessionCache.delete(voice);
      readyVoices.delete(voice);
    });
    sessionCache.set(voice, sessPromise);
  }

  const loaded = await sessPromise;
  readyVoices.add(voice);
  return loaded;
}

/**
 * Returns true if the ONNX Runtime Web session for `voice` is already downloaded and compiled in RAM.
 */
export function isBrowserOnnxReady(voice: 'male' | 'female' = 'male'): boolean {
  return readyVoices.has(voice);
}

let keepAliveSent = false;

export function sendHfKeepAliveBeacon(): void {
  if (keepAliveSent || typeof window === 'undefined' || typeof fetch === 'undefined') {
    return;
  }
  keepAliveSent = true;

  const fireKeepAlive = () => {
    const ts = Date.now();
    void fetch(`${HF_TTS_API_BASE_URL}/api/health?keepalive=${ts}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    }).catch(() => {});
    void fetch(`${HF_MODEL_CDN_BASE}/vocabs.json?keepalive=${ts}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    }).catch(() => {});
    void fetch(
      `https://bhrum108-sarva-dharani-kosa.static.hf.space/index.html?keepalive=${ts}`,
      {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      }
    ).catch(() => {});
  };

  // Immediate warmup ping on first entry so HF Neural TTS API Space is hot before user clicks Play
  setTimeout(fireKeepAlive, 120);

  // Periodic 20-minute keep-alive while the user keeps the study page open
  const timer = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    fireKeepAlive();
  }, 20 * 60 * 1000);

  if (typeof (timer as unknown as { unref?: () => void })?.unref === 'function') {
    (timer as unknown as { unref: () => void }).unref();
  }
}

/**
 * Pre-downloads and compiles the ONNX model in the background Dedicated Worker (or fallback main thread)
 * so that when the user clicks Play, zero download or WASM JIT compilation delay occurs.
 */
export async function warmupBrowserOnnxVits(voice: 'male' | 'female' = 'male'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  sendHfKeepAliveBeacon();
  try {
    const wc = getOrCreateWorkerClient();
    if (wc) {
      try {
        await Promise.all([getSanskritVocab(), wc.warmup(voice)]);
        return true;
      } catch {
        workerFailed = true;
        workerClient = null;
      }
    }
    await Promise.all([getSanskritVocab(), getOrLoadSession(voice)]);
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
  timeoutMs = 7500
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

function trimAsciiWs(s: string): string {
  return s.replace(ASCII_WS_TRIM_RE, '');
}

/**
 * Conditions an individual Devanāgarī word token for Classical Sanskrit Śikṣā pronunciation:
 * - Appends `VITS_INHERENT_A_MARKER` (`\u200a`) whenever the word ends on a bare Devanāgarī
 *   consonant (or consonant + Nukta `़`), guaranteeing full realization of final short `a`
 *   (`चिप` -> `चिप\u200a` = "ci-pa", `हुनुप` -> `हुनुप\u200a` = "hu-nu-pa", `प` -> `प\u200a` = "pa").
 * - Leaves overt vowel signs (`ा..ौ`, `ृ..ॣ`), Anusvāra (`ं`), Visarga (`ः`), Candrabindu (`ँ`),
 *   and Virāma (`्`, e.g. `फट्`, `ओम्`, `सम्यक्`) untouched.
 */
export function conditionDevanagariWordForVits(word: string): string {
  const clean = trimAsciiWs(word).replace(/\u200a+/g, '');
  if (!clean) return '';

  const trailingMatch = clean.match(TRAILING_PUNCT_RE);
  const core = trailingMatch ? clean.slice(0, clean.length - trailingMatch[0].length) : clean;
  const suffixPunct = trailingMatch ? trailingMatch[0] : '';
  if (!core) return clean;

  const chars = Array.from(core);
  const last = chars[chars.length - 1];
  const secondLast = chars.length >= 2 ? chars[chars.length - 2] : '';

  const endsWithBareConsonant =
    DEVA_CONSONANTS.has(last) || (last === '\u093c' && DEVA_CONSONANTS.has(secondLast));

  if (endsWithBareConsonant) {
    return `${core}${VITS_INHERENT_A_MARKER}${suffixPunct}`;
  }
  return `${core}${suffixPunct}`;
}

function splitClauseIntoBreathChunks(
  vitsText: string,
  endPauseMs: number
): Array<{ vitsText: string; pauseMs: number; isBareVirama?: boolean }> {
  const words = trimAsciiWs(vitsText).split(ASCII_WS_SPLIT_RE).filter(Boolean);
  if (words.length <= MAX_WORDS_PER_VITS_CHUNK && vitsText.length <= MAX_CHARS_PER_VITS_CHUNK) {
    return [{ vitsText: words.join(' '), pauseMs: endPauseMs }];
  }

  const chunks: Array<{ vitsText: string; pauseMs: number; isBareVirama?: boolean }> = [];
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
        pauseMs: 0,
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

export function normalizeSikshaDevanagari(
  rawText: string,
  isSingleSyllable: boolean
): {
  clauses: Array<{
    vitsText: string;
    pauseMs: number;
    isBareVirama?: boolean;
    hadLongVocalic?: boolean;
  }>;
} {
  const cleanedInput = trimAsciiWs(rawText).replace(/\u200a+/g, '');
  const hasDeva = /[\u0900-\u097F]/.test(cleanedInput);
  const rawDeva = (hasDeva ? cleanedInput : iastToDevanagari(cleanedInput)).normalize('NFC');
  const hadLongVocalic =
    /[ॠॄॡॣṝḹṜḸ]/.test(cleanedInput) || /[ॠॄॡॣ]/.test(rawDeva);

  let deva = rawDeva
    .replace(/[\u0951-\u0954\u1cd0-\u1cff\u200c\u200d\ufeff]/g, '')
    .replace(/ॐ/g, 'ओम्')
    .replace(/ॠ/g, 'ऋ')
    .replace(/ॄ/g, 'ृ')
    .replace(/ऌ/g, 'लृ')
    .replace(/ॡ/g, 'लृ')
    .replace(/ॢ/g, '्लृ')
    .replace(/ॣ/g, '्लृ');

  if (isSingleSyllable) {
    let single = trimAsciiWs(deva.replace(/ऽ+/g, '').replace(/[-–—]+/g, ' '));
    if (!single) {
      return { clauses: [{ vitsText: 'अ', pauseMs: 0 }] };
    }
    // Isolated vowelless consonant cell in 34x14 matrix (e.g. 'क्', 'क्ष्'):
    // synthesize consonant + `\u200a` and window strictly to the consonant burst before `\u200a` vowel onset.
    if (BARE_VIRAMA_SYLLABLE_RE.test(single)) {
      const withoutFinalVirama = single.slice(0, -1);
      return {
        clauses: [
          {
            vitsText: `${withoutFinalVirama}${VITS_INHERENT_A_MARKER}`,
            pauseMs: 0,
            isBareVirama: true,
          },
        ],
      };
    }
    // Siddhaṃ Chapters 8–15 phonotactic *a-kāra* onset prosthesis:
    // Word-initial Repha + consonant ('र्क..र्क्न', 阿勒迦～阿勒迦那) and velar/palatal/retroflex nasal + homorganic stop
    // ('ङ्क..ङ्कै', 阿盎迦) never occur word-initially in Sanskrit corpus and require traditional prosthetic 'अ'.
    if (
      !ASCII_WS_SPLIT_RE.test(single) &&
      /^(?:र\u094d[\u0915-\u0939]|[ङञण]\u094d[\u0915-\u0928])/u.test(single)
    ) {
      single = `अ${single}`;
    }
    const conditionedSingle = single
      .split(ASCII_WS_SPLIT_RE)
      .filter(Boolean)
      .map(conditionDevanagariWordForVits)
      .join(' ');
    return {
      clauses: [
        hadLongVocalic
          ? { vitsText: conditionedSingle, pauseMs: 0, hadLongVocalic: true }
          : { vitsText: conditionedSingle, pauseMs: 0 },
      ],
    };
  }

  // Elided Avagraha ('सोऽहम्' -> 'सो हम्') and compound hyphens ('सर्व-बुद्ध' -> 'सर्व बुद्ध')
  deva = deva.replace(/[ \t]*ऽ+[ \t]*/g, ' ').replace(/[-–—]+/g, ' ');
  const parts = deva.split(/(॥|।|\|\||\|)/);
  const rawClauses: Array<{ vitsText: string; pauseMs: number }> = [];
  let cur = '';

  for (const p of parts) {
    const ps = trimAsciiWs(p);
    if (!ps) continue;
    if (ps === '॥' || ps === '||') {
      if (trimAsciiWs(cur)) {
        rawClauses.push({ vitsText: trimAsciiWs(cur), pauseMs: 165 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = 165;
      }
    } else if (ps === '।' || ps === '|') {
      if (trimAsciiWs(cur)) {
        rawClauses.push({ vitsText: trimAsciiWs(cur), pauseMs: 95 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = Math.max(
          rawClauses[rawClauses.length - 1].pauseMs,
          95
        );
      }
    } else {
      cur = cur ? `${cur} ${ps}` : ps;
    }
  }
  if (trimAsciiWs(cur)) {
    rawClauses.push({ vitsText: trimAsciiWs(cur), pauseMs: 0 });
  }

  const finalClauses: Array<{ vitsText: string; pauseMs: number; isBareVirama?: boolean }> = [];
  for (const cl of rawClauses) {
    const conditionedWords = cl.vitsText
      .split(ASCII_WS_SPLIT_RE)
      .filter(Boolean)
      .map(conditionDevanagariWordForVits)
      .join(' ');
    const breathChunks = splitClauseIntoBreathChunks(conditionedWords, cl.pauseMs);
    for (const bc of breathChunks) {
      finalClauses.push(bc);
    }
  }

  return {
    clauses:
      finalClauses.length > 0
        ? finalClauses
        : [{ vitsText: conditionDevanagariWordForVits(deva) || 'अ', pauseMs: 0 }],
  };
}

/**
 * Builds prosodic Daṇḍa (`।`) conditioning + Guru/Laghu `lengthScale` for isolated single-syllable
 * VITS inference so 1-token / 2-token syllables (`उ`, `ऊ`, `ऐ`, `खृ`, `तु`, `वि`, `ठो`, `चौ`, `हं`, `अँ`)
 * never suffer VITS stochastic duration collapse, and can be sliced cleanly before `' ।'` via `coreCharCount`.
 */
export function buildSingleSyllableProsodicPlan(
  conditionedVitsText: string,
  isBareVirama = false,
  hadLongVocalic = false
): {
  inferenceText: string;
  useProsodicSlice: boolean;
  baseLengthScale: number;
} {
  const clean = trimAsciiWs(conditionedVitsText);
  if (!clean || isBareVirama || /[।॥]/.test(clean) || ASCII_WS_SPLIT_RE.test(clean)) {
    return {
      inferenceText: clean,
      useProsodicSlice: false,
      baseLengthScale: 1.0,
    };
  }

  const isStandaloneGuruVowel =
    /^[आईऊएऐओऔ]$/u.test(clean) || (hadLongVocalic && (clean === 'ऋ' || clean === 'लृ'));
  const isStandaloneHrasvaVowel =
    /^[अइउऋ]$/u.test(clean) || (!hadLongVocalic && clean === 'लृ');
  const isGuruSyllable =
    hadLongVocalic || /[ाीूेैोौंःँ]|\u094d$/u.test(clean);

  let baseLengthScale = 0.95;
  if (isStandaloneGuruVowel) {
    baseLengthScale = 1.35;
  } else if (isStandaloneHrasvaVowel) {
    baseLengthScale = 1.08;
  } else if (isGuruSyllable) {
    baseLengthScale = 1.15;
  }

  return {
    inferenceText: `${clean} ।`,
    useProsodicSlice: true,
    baseLengthScale,
  };
}

function computeSegmentRms(buf: Float32Array, startSample: number, endSample: number): number {
  const s = Math.max(0, startSample);
  const e = Math.min(buf.length, endSample);
  if (e <= s) return 0;
  let sumSq = 0;
  for (let i = s; i < e; i++) {
    const v = buf[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / (e - s));
}

function applyRaisedCosineTail(buf: Float32Array, fadeStart: number, fadeEnd: number): void {
  const s = Math.max(0, fadeStart);
  const e = Math.min(buf.length, fadeEnd);
  const len = e - s;
  if (len <= 1) return;
  for (let i = 0; i < len; i++) {
    const w = 0.5 * (1 + Math.cos((Math.PI * i) / (len - 1)));
    buf[s + i] *= w;
  }
}

/**
 * Uses the exact VITS `durations` alignment tensor (`1 frame = 256 samples @ 24kHz`) to:
 * 0. When `coreCharCount > 0`, slice out prosodic conditioning suffix (`' ।'`) cleanly after the core syllable.
 * 1. Window bare Virāma matrix cells (`क्..ह्`) strictly to their consonant release burst.
 * 2. Suppress post-stop Virāma vowel epenthesis (`फट्` -> crisp `"phaṭ"`, never `"pha-ṭa"`),
 *    while preserving continuous nasal codas (`ओम्` -> full `[mː]` resonance).
 * 3. Cap utterance-final `\u200a` short-`a` duration to Laghu (~11 frames) so `cipa` / `hunupa` / `ka`
 *    never over-lengthen into Dīrgha `ā`.
 */
export function shapeVitsWaveform24kWithDurations(
  rawWav24k: Float32Array,
  chars: string[],
  rawDurs: number[],
  effRate = 1.0,
  isBareVirama = false,
  coreCharCount = 0
): { wav24k: Float32Array; durs: number[] } {
  let expectedLen = chars.length * 2 + 1;
  if (chars.length === 0 || rawDurs.length !== expectedLen || rawWav24k.length === 0) {
    return { wav24k: rawWav24k, durs: rawDurs.slice() };
  }

  let wav = rawWav24k;
  let curChars = chars;
  let durs = rawDurs.map((d) => Math.max(0, Math.round(d)));
  let prefixFrames = new Int32Array(expectedLen + 1);
  for (let i = 0; i < expectedLen; i++) {
    prefixFrames[i + 1] = prefixFrames[i] + durs[i];
  }

  // 0. Slice off prosodic Daṇḍa conditioning suffix (' ।') strictly before space token `2 * coreCharCount + 1`
  if (!isBareVirama && coreCharCount > 0 && coreCharCount < curChars.length) {
    const coreEndBlankIdx = 2 * coreCharCount;
    const coreLastChar = curChars[coreCharCount - 1];
    const maxTrailFrames = coreLastChar === VITS_INHERENT_A_MARKER ? 4 : 16;
    let trailFrames = Math.min(durs[coreEndBlankIdx], maxTrailFrames);
    let cutFrame = prefixFrames[coreEndBlankIdx] + trailFrames;
    if (coreLastChar !== VITS_INHERENT_A_MARKER && coreLastChar !== '\u094d' && cutFrame < 14) {
      let nxtIdx = coreEndBlankIdx + 1;
      while (nxtIdx < expectedLen - 2 && cutFrame < 14) {
        const segR = computeSegmentRms(
          wav,
          prefixFrames[nxtIdx] * VITS_HOP_LENGTH_24K,
          prefixFrames[nxtIdx + 1] * VITS_HOP_LENGTH_24K
        );
        if (segR < 0.055) break;
        const extra = Math.min(durs[nxtIdx], 14 - cutFrame);
        trailFrames += extra;
        cutFrame += extra;
        nxtIdx++;
      }
    }
    const cutSamples = Math.min(wav.length, cutFrame * VITS_HOP_LENGTH_24K);
    const sliced = wav.slice(0, cutSamples);
    const fadeSamples = Math.min(cutSamples, 2 * VITS_HOP_LENGTH_24K);
    applyRaisedCosineTail(sliced, cutSamples - fadeSamples, cutSamples);
    wav = sliced;
    curChars = curChars.slice(0, coreCharCount);
    durs = durs.slice(0, coreEndBlankIdx + 1);
    durs[coreEndBlankIdx] = trailFrames;
    expectedLen = curChars.length * 2 + 1;
    prefixFrames = new Int32Array(expectedLen + 1);
    for (let i = 0; i < expectedLen; i++) {
      prefixFrames[i + 1] = prefixFrames[i] + durs[i];
    }
  }

  const lastCharIdx = curChars.length - 1;
  const lastTokenIdx = 2 * lastCharIdx + 1;
  const lastChar = curChars[lastCharIdx];

  // 1. Bare Virāma matrix cell (e.g. 'क्'): keep strictly consonant closure + release burst
  if (isBareVirama && lastChar === VITS_INHERENT_A_MARKER) {
    const keepVotFrames = Math.min(durs[lastTokenIdx], 2);
    const cutFrame = prefixFrames[lastTokenIdx] + keepVotFrames;
    const silentTailFrames = 3;
    const cutSamples = Math.min(wav.length, cutFrame * VITS_HOP_LENGTH_24K);
    const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
    out.set(wav.subarray(0, cutSamples), 0);
    const fadeSamples = Math.min(cutSamples, 2 * VITS_HOP_LENGTH_24K);
    applyRaisedCosineTail(out, cutSamples - fadeSamples, cutSamples);
    durs[lastTokenIdx] = keepVotFrames;
    durs[lastTokenIdx + 1] = silentTailFrames;
    return { wav24k: out, durs };
  }

  // 2. Utterance-final Virāma epenthesis suppression ('फट्', 'सम्यक्', 'तत्')
  if (lastChar === '\u094d') {
    const prevBlankIdx = lastTokenIdx - 1;
    const blankStart = prefixFrames[prevBlankIdx] * VITS_HOP_LENGTH_24K;
    const blankEnd = prefixFrames[prevBlankIdx + 1] * VITS_HOP_LENGTH_24K;
    const viramaStart = prefixFrames[lastTokenIdx] * VITS_HOP_LENGTH_24K;
    const viramaEnd = prefixFrames[lastTokenIdx + 1] * VITS_HOP_LENGTH_24K;

    const prevBlankRms = computeSegmentRms(wav, blankStart, blankEnd);
    const viramaRms = computeSegmentRms(wav, viramaStart, viramaEnd);

    // Oral stop closure has silent blank (< 0.032 RMS) followed by spurious voiced epenthesis on '्';
    // nasal codas ('ओम्') have voiced blank (~0.09 RMS) and are preserved intact.
    if (durs[prevBlankIdx] >= 2 && prevBlankRms < 0.032 && viramaRms > 0.015) {
      const cutSamples = Math.min(wav.length, viramaStart);
      const silentTailFrames = 4;
      const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
      out.set(wav.subarray(0, cutSamples), 0);
      const fadeSamples = Math.min(cutSamples, 2 * VITS_HOP_LENGTH_24K);
      applyRaisedCosineTail(out, cutSamples - fadeSamples, cutSamples);
      durs[lastTokenIdx] = 0;
      durs[lastTokenIdx + 1] = silentTailFrames;
      return { wav24k: out, durs };
    }
  }

  // 3. Utterance-final `\u200a` Laghu duration cap (prevents short `a` from sounding like long `ā`)
  if (lastChar === VITS_INHERENT_A_MARKER) {
    const prevBlankIdx = lastTokenIdx - 1;
    const blankStart = prefixFrames[prevBlankIdx] * VITS_HOP_LENGTH_24K;
    const blankEnd = prefixFrames[prevBlankIdx + 1] * VITS_HOP_LENGTH_24K;
    const prevBlankRms = computeSegmentRms(wav, blankStart, blankEnd);

    const maxHsFrames =
      prevBlankRms >= 0.055
        ? Math.max(4, Math.round(13 / effRate) - durs[prevBlankIdx])
        : Math.max(9, Math.round(12 / effRate));

    if (durs[lastTokenIdx] > maxHsFrames) {
      const cutFrame = prefixFrames[lastTokenIdx] + maxHsFrames;
      const cutSamples = Math.min(wav.length, cutFrame * VITS_HOP_LENGTH_24K);
      const silentTailFrames = 4;
      const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
      out.set(wav.subarray(0, cutSamples), 0);
      const fadeSamples = Math.min(
        maxHsFrames * VITS_HOP_LENGTH_24K,
        4 * VITS_HOP_LENGTH_24K
      );
      applyRaisedCosineTail(out, cutSamples - fadeSamples, cutSamples);
      durs[lastTokenIdx] = maxHsFrames;
      durs[lastTokenIdx + 1] = silentTailFrames;
      return { wav24k: out, durs };
    }
  }

  return { wav24k: wav, durs };
}

/**
 * 24kHz -> 48kHz Mastering Pipeline:
 * 1. 1-pole high-pass DC blocker + mean removal at 24kHz.
 * 2. Ultra-short 1.5ms micro-ramp + 10ms clean zero pre-pad (`ONSET_PAD_SAMPLES_24K`) so initial
 *    palatal/plosive bursts (`च` in `cipa`, `क`, `त`, `प`) are 100% preserved without onset clipping.
 * 3. 31-tap symmetric Kaiser half-band polyphase 2x FIR upsampler to 48,000 Hz.
 * 4. Peak normalization to -1.0 dBFS (with max-gain guard against floor noise amplification).
 */
export function upsample24kTo48kAndMaster(pcm24k: Float32Array): Float32Array {
  const nRaw = pcm24k.length;
  if (nRaw === 0) return new Float32Array(0);

  // 1. DC blocker at 24kHz: y[n] = x[n] - x[n-1] + 0.995 * y[n-1]
  const clean24 = new Float32Array(ONSET_PAD_SAMPLES_24K + nRaw);
  let prevX = pcm24k[0];
  let prevY = 0;
  let sum = 0;
  for (let i = 0; i < nRaw; i++) {
    const x = pcm24k[i];
    const y = x - prevX + 0.995 * prevY;
    prevX = x;
    prevY = y;
    clean24[ONSET_PAD_SAMPLES_24K + i] = y;
    sum += y;
  }
  const mean = sum / nRaw;
  for (let i = 0; i < nRaw; i++) {
    clean24[ONSET_PAD_SAMPLES_24K + i] -= mean;
  }

  // 2. Micro 1.5ms (36 samples @ 24kHz) attack after the 10ms zero pre-pad + 16ms tail release
  const microFadeIn = Math.min(36, Math.floor(nRaw / 4));
  for (let i = 0; i < microFadeIn; i++) {
    const w = 0.5 * (1 - Math.cos((Math.PI * i) / Math.max(1, microFadeIn - 1)));
    clean24[ONSET_PAD_SAMPLES_24K + i] *= w;
  }
  const fadeOut24 = Math.min(Math.round(0.016 * SOURCE_SAMPLE_RATE), Math.floor(nRaw / 3));
  applyRaisedCosineTail(clean24, clean24.length - fadeOut24, clean24.length);

  // 3. 31-tap polyphase half-band FIR 2x upsampler (24kHz -> 48kHz)
  const n24 = clean24.length;
  const n48 = n24 * 2;
  const out = new Float32Array(n48);
  const M = HALFBAND_ODD_WEIGHTS.length; // 8

  for (let n = 0; n < n24; n++) {
    out[2 * n] = clean24[n];
    let acc = 0;
    for (let k = 0; k < M; k++) {
      const idxLeft = n - k;
      const idxRight = n + 1 + k;
      const sLeft = idxLeft >= 0 ? clean24[idxLeft] : 0;
      const sRight = idxRight < n24 ? clean24[idxRight] : 0;
      acc += HALFBAND_ODD_WEIGHTS[k] * (sLeft + sRight);
    }
    out[2 * n + 1] = acc;
  }

  // 4. Peak normalize to -1.0 dBFS with floor-hiss amplification guard
  let peak = 0;
  for (let i = 0; i < n48; i++) {
    const a = Math.abs(out[i]);
    if (a > peak) peak = a;
  }
  if (peak > 1e-5) {
    const scale =
      peak >= 0.065 ? PEAK_TARGET_LINEAR / peak : Math.min(PEAK_TARGET_LINEAR / peak, 14.0);
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

/**
 * Extracts exact per-word acoustic `[speechStartSec, speechEndSec]` spans at 48kHz directly from
 * the VITS `durations` alignment tensor so karaoke syllable highlighting locks onto each spoken word.
 */
function extractWordSpansFromDurations(
  chars: string[],
  durs: number[],
  chunkStartSample48k: number,
  clauseLen48k: number
): AcousticChunkSpan[] {
  const expectedLen = chars.length * 2 + 1;
  if (chars.length === 0 || durs.length !== expectedLen) return [];

  const samplesPerFrame48k = VITS_HOP_LENGTH_24K * 2; // 512 samples @ 48kHz
  const baseOffset48k = chunkStartSample48k + ONSET_PAD_SAMPLES_24K * 2;
  const prefixFrames = new Int32Array(expectedLen + 1);
  for (let i = 0; i < expectedLen; i++) {
    prefixFrames[i + 1] = prefixFrames[i] + Math.max(0, durs[i]);
  }

  const spans: AcousticChunkSpan[] = [];
  let wordFirstChar = -1;
  let wordVisibleChars = 0;

  const flushWord = (lastCharIdx: number) => {
    if (wordFirstChar < 0 || lastCharIdx < wordFirstChar) return;
    const firstTokenIdx = 2 * wordFirstChar + 1;
    // Include trailing blank of final character (often carries vowel release in VITS)
    const endTokenExclusive = Math.min(expectedLen, 2 * lastCharIdx + 3);
    const startSample = Math.min(
      chunkStartSample48k + clauseLen48k,
      baseOffset48k + prefixFrames[firstTokenIdx] * samplesPerFrame48k
    );
    const endSample = Math.min(
      chunkStartSample48k + clauseLen48k,
      baseOffset48k + prefixFrames[endTokenExclusive] * samplesPerFrame48k
    );
    const speechStartSec = startSample / TARGET_SAMPLE_RATE;
    const speechEndSec = Math.max(speechStartSec + 0.045, endSample / TARGET_SAMPLE_RATE);
    spans.push({
      speechStartSec,
      speechEndSec,
      charCount: Math.max(1, wordVisibleChars),
    });
    wordFirstChar = -1;
    wordVisibleChars = 0;
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ') {
      flushWord(i - 1);
    } else {
      if (wordFirstChar < 0) wordFirstChar = i;
      if (ch !== VITS_INHERENT_A_MARKER) {
        wordVisibleChars++;
      }
    }
  }
  flushWord(chars.length - 1);
  return spans;
}

function parseDurationsTensor(tensor?: OrtTensor): number[] {
  if (!tensor || !tensor.data) return [];
  const data = tensor.data;
  const out = new Array<number>(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = Number(data[i]);
  }
  return out;
}

export async function synthesizePcmWithBrowserOnnxVits(
  text: string,
  voice: 'male' | 'female' = 'male',
  rate = 1.0,
  isSingleSyllable = false,
  priority: 'high' | 'low' = 'high',
  signal?: AbortSignal
): Promise<{
  pcm48k: Float32Array;
  durationSec: number;
  model: string;
  chunkSpans: AcousticChunkSpan[];
}> {
  if (signal?.aborted) {
    throw createAbortError();
  }

  let wc = getOrCreateWorkerClient();
  let vocab: StudioVocabSpec;
  let fallbackOrt: OrtGlobal | null = null;
  let fallbackSession: OrtSession | null = null;
  let resolvedModelId =
    activeModelIds.get(voice) ||
    (voice === 'female'
      ? 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa_female.onnx'
      : 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx');

  if (wc) {
    try {
      const [v, mId] = await Promise.all([getSanskritVocab(), wc.warmup(voice)]);
      vocab = v;
      resolvedModelId = mId;
    } catch {
      workerFailed = true;
      workerClient = null;
      wc = null;
      const [ort, v, loaded] = await Promise.all([
        ensureOrtLoaded(),
        getSanskritVocab(),
        getOrLoadSession(voice),
      ]);
      fallbackOrt = ort;
      vocab = v;
      fallbackSession = loaded.session;
      resolvedModelId = loaded.modelId;
    }
  } else {
    const [ort, v, loaded] = await Promise.all([
      ensureOrtLoaded(),
      getSanskritVocab(),
      getOrLoadSession(voice),
    ]);
    fallbackOrt = ort;
    vocab = v;
    fallbackSession = loaded.session;
    resolvedModelId = loaded.modelId;
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  const effRate = Math.max(0.5, Math.min(2.0, rate));
  const { clauses } = normalizeSikshaDevanagari(text, isSingleSyllable);
  const c2i = vocab.char_to_id;
  const blankId = BigInt(vocab.blank_id ?? 143);

  const pcmParts: Float32Array[] = [];
  const chunkSpans: AcousticChunkSpan[] = [];
  let totalSamples = 0;

  for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const cl = clauses[cIdx];
    const coreCleaned = trimAsciiWs(
      cl.vitsText.replace(/[\u0951-\u0954\u1cd0-\u1cff\u200c\u200d\ufeff]/g, '').toLowerCase()
    );
    const prosodicPlan = isSingleSyllable
      ? buildSingleSyllableProsodicPlan(
          coreCleaned,
          Boolean(cl.isBareVirama),
          Boolean(cl.hadLongVocalic)
        )
      : { inferenceText: coreCleaned, useProsodicSlice: false, baseLengthScale: 1.0 };

    const coreValidChars: string[] = [];
    for (const ch of coreCleaned) {
      if (ch in c2i) {
        coreValidChars.push(ch);
      }
    }

    const cleaned = prosodicPlan.inferenceText;
    const validChars: string[] = [];
    const rawIds: bigint[] = [];
    for (const ch of cleaned) {
      if (ch in c2i) {
        validChars.push(ch);
        rawIds.push(BigInt(c2i[ch]));
      }
    }
    if (rawIds.length === 0) {
      validChars.push(' ');
      rawIds.push(BigInt(c2i[' '] ?? vocab.pad_id ?? 0));
    }

    const coreCharCount =
      prosodicPlan.useProsodicSlice &&
      coreValidChars.length > 0 &&
      coreValidChars.length < validChars.length
        ? coreValidChars.length
        : 0;
    const effectiveLengthScale = prosodicPlan.baseLengthScale / effRate;

    const interleaved = new BigInt64Array(rawIds.length * 2 + 1);
    interleaved[0] = blankId;
    for (let i = 0; i < rawIds.length; i++) {
      interleaved[2 * i + 1] = rawIds[i];
      interleaved[2 * i + 2] = blankId;
    }

    const { clause48k, shapedDurs } = await scheduleInference(
      async () => {
        if (wc) {
          try {
            const workerOut = await wc.infer({
              voice,
              interleaved,
              effRate,
              lengthScale: effectiveLengthScale,
              validChars,
              isBareVirama: Boolean(cl.isBareVirama),
              coreCharCount,
            });
            resolvedModelId = workerOut.modelId;
            return {
              clause48k: workerOut.clause48k,
              shapedDurs: workerOut.shapedDurs,
            };
          } catch {
            workerFailed = true;
            workerClient = null;
            wc = null;
          }
        }

        if (!fallbackOrt || !fallbackSession) {
          const [ort, loaded] = await Promise.all([
            ensureOrtLoaded(),
            getOrLoadSession(voice),
          ]);
          fallbackOrt = ort;
          fallbackSession = loaded.session;
          resolvedModelId = loaded.modelId;
        }

        const scales = new Float32Array([effectiveLengthScale, 0.25, 0.0]);
        const feeds: Record<string, OrtTensor> = {
          input_ids: new fallbackOrt.Tensor('int64', interleaved, [1, interleaved.length]),
          scales: new fallbackOrt.Tensor('float32', scales, [3]),
        };
        const outputs = await fallbackSession.run(feeds);
        const wavName = fallbackSession.outputNames[0] || 'waveform';
        const durName = fallbackSession.outputNames[1] || 'durations';
        const wavOut = outputs[wavName].data as Float32Array;
        const rawDurs = parseDurationsTensor(outputs[durName]);
        const { wav24k, durs } = shapeVitsWaveform24kWithDurations(
          wavOut,
          validChars,
          rawDurs,
          effRate,
          Boolean(cl.isBareVirama),
          coreCharCount
        );
        return {
          clause48k: upsample24kTo48kAndMaster(wav24k),
          shapedDurs: durs,
        };
      },
      priority,
      signal
    );

    const chunkStartSample = totalSamples;
    const spanChars = coreCharCount > 0 ? validChars.slice(0, coreCharCount) : validChars;
    const wordSpans = extractWordSpansFromDurations(
      spanChars,
      shapedDurs,
      chunkStartSample,
      clause48k.length
    );

    if (wordSpans.length > 0) {
      for (const ws of wordSpans) {
        chunkSpans.push(ws);
      }
    } else {
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
      const charCount = Math.max(
        1,
        cleaned.replace(ASCII_WS_SPLIT_RE, '').replace(/\u200a/g, '').length
      );
      chunkSpans.push({ speechStartSec, speechEndSec, charCount });
    }

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

  return {
    pcm48k: finalPcm,
    durationSec: finalPcm.length / TARGET_SAMPLE_RATE,
    model: resolvedModelId,
    chunkSpans,
  };
}

export async function synthesizeWithBrowserOnnxVits(
  ctx: BaseAudioContext,
  text: string,
  voice: 'male' | 'female' = 'male',
  rate = 1.0,
  isSingleSyllable = false,
  priority: 'high' | 'low' = 'high',
  signal?: AbortSignal
): Promise<{
  audioBuffer: AudioBuffer;
  pcm48k: Float32Array;
  durationSec: number;
  model: string;
  chunkSpans: AcousticChunkSpan[];
}> {
  const res = await synthesizePcmWithBrowserOnnxVits(
    text,
    voice,
    rate,
    isSingleSyllable,
    priority,
    signal
  );

  const audioBuffer = ctx.createBuffer(1, res.pcm48k.length, TARGET_SAMPLE_RATE);
  audioBuffer.getChannelData(0).set(res.pcm48k);

  return {
    audioBuffer,
    ...res,
  };
}
