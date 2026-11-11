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

export const HF_MODEL_CDN_BASE =
  'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main';

const ORT_CDN_URLS = [
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
  const studioRel = voice === 'female' ? 'onnx/sa_female.onnx' : 'onnx/sa.onnx';
  const mobileRel =
    voice === 'female' ? 'onnx_mobile/sa_female.onnx' : 'onnx_mobile/sa.onnx';

  let sessPromise = sessionCache.get(voice);
  if (!sessPromise) {
    sessPromise = (async () => {
      const ort = await ensureOrtLoaded();
      let chosenRel = studioRel;
      let res = await fetchWithPersistentCache(`${HF_MODEL_CDN_BASE}/${studioRel}`).catch(
        () => null
      );
      if (!res || !res.ok) {
        chosenRel = mobileRel;
        res = await fetchWithPersistentCache(`${HF_MODEL_CDN_BASE}/${mobileRel}`);
      }
      if (!res.ok) {
        throw new Error(`Failed to download ONNX model ${chosenRel} (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const session = await ort.InferenceSession.create(new Uint8Array(buf), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      readyVoices.add(voice);
      return {
        session,
        modelId: `bhrum108/sarva-dharani-kosa-tts:${chosenRel}`,
      };
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
    void fetch(
      `https://bhrum108-sarva-dharani-kosa.static.hf.space/index.html?keepalive=${Date.now()}`,
      {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      }
    ).catch(() => {});
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
  timeoutMs = 4500
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

export function normalizeSikshaDevanagari(
  rawText: string,
  isSingleSyllable: boolean
): {
  clauses: Array<{ vitsText: string; pauseMs: number; isBareVirama?: boolean }>;
} {
  const cleanedInput = trimAsciiWs(rawText).replace(/\u200a+/g, '');
  const hasDeva = /[\u0900-\u097F]/.test(cleanedInput);
  let deva = hasDeva ? cleanedInput : iastToDevanagari(cleanedInput);
  deva = deva
    .normalize('NFC')
    .replace(/[\u0951-\u0954\u1cd0-\u1cff\u200c\u200d\ufeff]/g, '')
    .replace(/ॐ/g, 'ओम्')
    .replace(/ॠ/g, 'ऋ')
    .replace(/ॄ/g, 'ृ')
    .replace(/ऌ/g, 'लृ')
    .replace(/ॡ/g, 'लृ')
    .replace(/ॢ/g, '्लृ')
    .replace(/ॣ/g, '्लृ');

  if (isSingleSyllable) {
    const single = trimAsciiWs(deva.replace(/ऽ+/g, '').replace(/[-–—]+/g, ' '));
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
    const conditionedSingle = single
      .split(ASCII_WS_SPLIT_RE)
      .filter(Boolean)
      .map(conditionDevanagariWordForVits)
      .join(' ');
    return { clauses: [{ vitsText: conditionedSingle, pauseMs: 0 }] };
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
        rawClauses.push({ vitsText: trimAsciiWs(cur), pauseMs: 420 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = 420;
      }
    } else if (ps === '।' || ps === '|') {
      if (trimAsciiWs(cur)) {
        rawClauses.push({ vitsText: trimAsciiWs(cur), pauseMs: 220 });
        cur = '';
      } else if (rawClauses.length > 0) {
        rawClauses[rawClauses.length - 1].pauseMs = Math.max(
          rawClauses[rawClauses.length - 1].pauseMs,
          220
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
  isBareVirama = false
): { wav24k: Float32Array; durs: number[] } {
  const expectedLen = chars.length * 2 + 1;
  if (chars.length === 0 || rawDurs.length !== expectedLen || rawWav24k.length === 0) {
    return { wav24k: rawWav24k, durs: rawDurs.slice() };
  }

  const durs = rawDurs.map((d) => Math.max(0, Math.round(d)));
  const prefixFrames = new Int32Array(expectedLen + 1);
  for (let i = 0; i < expectedLen; i++) {
    prefixFrames[i + 1] = prefixFrames[i] + durs[i];
  }

  const lastCharIdx = chars.length - 1;
  const lastTokenIdx = 2 * lastCharIdx + 1;
  const lastChar = chars[lastCharIdx];

  // 1. Bare Virāma matrix cell (e.g. 'क्'): keep strictly consonant closure + release burst
  if (isBareVirama && lastChar === VITS_INHERENT_A_MARKER) {
    const keepVotFrames = Math.min(durs[lastTokenIdx], 2);
    const cutFrame = prefixFrames[lastTokenIdx] + keepVotFrames;
    const silentTailFrames = 3;
    const cutSamples = Math.min(rawWav24k.length, cutFrame * VITS_HOP_LENGTH_24K);
    const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
    out.set(rawWav24k.subarray(0, cutSamples), 0);
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

    const prevBlankRms = computeSegmentRms(rawWav24k, blankStart, blankEnd);
    const viramaRms = computeSegmentRms(rawWav24k, viramaStart, viramaEnd);

    // Oral stop closure has silent blank (< 0.032 RMS) followed by spurious voiced epenthesis on '्';
    // nasal codas ('ओम्') have voiced blank (~0.09 RMS) and are preserved intact.
    if (durs[prevBlankIdx] >= 2 && prevBlankRms < 0.032 && viramaRms > 0.015) {
      const cutSamples = Math.min(rawWav24k.length, viramaStart);
      const silentTailFrames = 4;
      const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
      out.set(rawWav24k.subarray(0, cutSamples), 0);
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
    const prevBlankRms = computeSegmentRms(rawWav24k, blankStart, blankEnd);

    const maxHsFrames =
      prevBlankRms >= 0.055
        ? Math.max(4, Math.round(13 / effRate) - durs[prevBlankIdx])
        : Math.max(9, Math.round(12 / effRate));

    if (durs[lastTokenIdx] > maxHsFrames) {
      const cutFrame = prefixFrames[lastTokenIdx] + maxHsFrames;
      const cutSamples = Math.min(rawWav24k.length, cutFrame * VITS_HOP_LENGTH_24K);
      const silentTailFrames = 4;
      const out = new Float32Array(cutSamples + silentTailFrames * VITS_HOP_LENGTH_24K);
      out.set(rawWav24k.subarray(0, cutSamples), 0);
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

  return { wav24k: rawWav24k, durs };
}

/**
 * 24kHz -> 48kHz Mastering Pipeline:
 * 1. 1-pole high-pass DC blocker + mean removal at 24kHz.
 * 2. Ultra-short 1.5ms micro-ramp + 10ms clean zero pre-pad (`ONSET_PAD_SAMPLES_24K`) so initial
 *    palatal/plosive bursts (`च` in `cipa`, `क`, `त`, `प`) are 100% preserved without onset clipping.
 * 3. 31-tap symmetric Kaiser half-band polyphase 2x FIR upsampler to 48,000 Hz.
 * 4. Peak normalization to -1.0 dBFS.
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

  // 4. Peak normalize to -1.0 dBFS
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
    const cleaned = trimAsciiWs(
      cl.vitsText.replace(/[\u0951-\u0954\u1cd0-\u1cff\u200c\u200d\ufeff]/g, '').toLowerCase()
    );

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

    const interleaved = new BigInt64Array(rawIds.length * 2 + 1);
    interleaved[0] = blankId;
    for (let i = 0; i < rawIds.length; i++) {
      interleaved[2 * i + 1] = rawIds[i];
      interleaved[2 * i + 2] = blankId;
    }

    // Deterministic duration predictor (`noise_w = 0.0`) + clean harmonic glottal excitation (`noise_scale = 0.25`)
    const scales = new Float32Array([1.0 / effRate, 0.25, 0.0]);
    const feeds: Record<string, OrtTensor> = {
      input_ids: new ort.Tensor('int64', interleaved, [1, interleaved.length]),
      scales: new ort.Tensor('float32', scales, [3]),
    };

    const { clause48k, shapedDurs } = await scheduleInference(async () => {
      const outputs = await session.run(feeds);
      const wavName = session.outputNames[0] || 'waveform';
      const durName = session.outputNames[1] || 'durations';
      const wavOut = outputs[wavName].data as Float32Array;
      const rawDurs = parseDurationsTensor(outputs[durName]);
      const { wav24k, durs } = shapeVitsWaveform24kWithDurations(
        wavOut,
        validChars,
        rawDurs,
        effRate,
        Boolean(cl.isBareVirama)
      );
      return {
        clause48k: upsample24kTo48kAndMaster(wav24k),
        shapedDurs: durs,
      };
    }, priority);

    const chunkStartSample = totalSamples;
    const wordSpans = extractWordSpansFromDurations(
      validChars,
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
