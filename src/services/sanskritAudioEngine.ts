/**
 * src/services/sanskritAudioEngine.ts
 * Unified Sanskrit Acoustic & Neural Synthesis Engine:
 * 1. Plan 1: 48,000 Hz Native Classical Sanskrit Neural VITS TTS (`/api/tts` & `/api/syllable/{slp1}`,
 *    models `sa_studio_male`, `sa_studio_female`, `sa_mobile_male`, `sa_mms_16k`)
 * 2. 136.1 Hz "Om" Web Audio API Formant Synthesizer (`VOWEL_FORMANTS`, `bandpass` F1/F2 resonators)
 * 3. Web Speech API (`sa-IN` / `hi-IN`) fallback
 * 100% safe in both Browser and headless Node.js / Vitest environments.
 */

import { inputToSlp1, slp1ToDevanagari, slp1ToIast } from '../core/transliterator';
import { syllabifySlp1Word } from '../core/prosody';
import type {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableTimingItem,
} from '../types/dharani';
import {
  isBrowserOnnxReady,
  synthesizeWithBrowserOnnxVits,
  waitForBrowserOnnxReady,
  warmupBrowserOnnxVits,
} from './audio/browserOnnxTtsEngine';

export const VOWEL_FORMANTS: Record<string, [number, number, number]> = {
  'a': [720, 1240, 0.22], 'A': [750, 1280, 0.40],
  'i': [300, 2280, 0.22], 'I': [280, 2350, 0.40],
  'u': [320, 820,  0.22], 'U': [300, 780,  0.40],
  'f': [460, 1520, 0.26], 'F': [460, 1550, 0.42],
  'x': [440, 1620, 0.26], 'X': [440, 1650, 0.42],
  'e': [450, 1980, 0.36], 'E': [620, 1850, 0.42],
  'o': [460, 920,  0.36], 'O': [640, 1020, 0.42]
};

export interface SyllableAcousticProfile {
  slpSyl: string;
  vowel: string;
  f1: number;
  f2: number;
  fundamentalHz: number;
  subHarmonicHz: number;
  durationSec: number;
  hasNasal: boolean;
  hasAspirateOrSibilant: boolean;
}

export interface SpeakOptions {
  mode?: 'auto' | 'synth' | 'tts' | 'neural-tts' | 'neural-auto' | 'legacy-tts';
  voice?: NeuralVoice;
  rate?: number;
  title?: string;
  onSyllableIndex?: (idx: number) => void;
  onEnd?: () => void;
}

export interface PlaySyllableOptions {
  voice?: NeuralVoice;
  rate?: number;
  speed?: number;
  mode?: AudioEngineMode;
}

export interface SpeakTextOptions {
  voice?: NeuralVoice;
  rate?: number;
  speed?: number;
  mode?: AudioEngineMode;
  title?: string;
  onSyllableHighlight?: (index: number, timing: SyllableTimingItem | null) => void;
  onPlaybackEnd?: () => void;
  onComplete?: () => void;
}

export interface SpeakTextResult {
  mode: string;
  sampleRate: number;
  durationSec: number;
  audioUrl?: string;
  syllableTimings: SyllableTimingItem[];
}

export interface PlaySyllableResult {
  source: 'neural-tts' | 'synth' | 'legacy-tts';
  sampleRate: number;
  durationSec: number;
  slp1: string;
}

type EngineStateListener = () => void;

let audioCtx: AudioContext | null = null;
let currentStopTimer: ReturnType<typeof setTimeout> | null = null;
let currentIntervalId: ReturnType<typeof setInterval> | null = null;

function getBrowserAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass({ sampleRate: 48000 });
    } catch {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pure deterministic calculation of the acoustic formant profile for a single SLP1 syllable.
 * Used by both `synthesizeSyllableAudio` and headless unit tests.
 */
export function computeSyllableAcousticProfile(
  slpSyl: string,
  rate = 0.85
): SyllableAcousticProfile {
  const speedScale = 0.85 / Math.max(0.4, rate);
  let vowel = 'a';
  for (const ch of slpSyl) {
    if (VOWEL_FORMANTS[ch]) {
      vowel = ch;
      break;
    }
  }
  const [f1, f2, baseDur] = VOWEL_FORMANTS[vowel] || [700, 1200, 0.25];
  const hasNasal = slpSyl.includes('M') || slpSyl.includes('~') || /[NYRnm]$/.test(slpSyl);
  const hasAspirateOrSibilant = /[KGCJWQTDPBhHSzs]/.test(slpSyl);
  const durationSec = Number(((baseDur + (hasNasal ? 0.12 : 0)) * speedScale).toFixed(4));

  return {
    slpSyl,
    vowel,
    f1,
    f2,
    fundamentalHz: 136.1,
    subHarmonicHz: 272.2,
    durationSec,
    hasNasal,
    hasAspirateOrSibilant
  };
}

/**
 * Synthesizes a single Sanskrit syllable using the 136.1 Hz "Om" Web Audio API formant synthesizer.
 * In headless Node/Vitest environments where `window.AudioContext` is absent, returns `durationSec` cleanly.
 */
export function synthesizeSyllableAudio(
  slpSyl: string,
  startTimeOffset = 0,
  rate = 0.85
): number {
  const profile = computeSyllableAcousticProfile(slpSyl, rate);
  const ctx = getBrowserAudioContext();
  if (!ctx) {
    return profile.durationSec;
  }

  const { f1, f2, fundamentalHz, subHarmonicHz, durationSec, hasAspirateOrSibilant } = profile;
  const start = ctx.currentTime + startTimeOffset;
  const end = start + durationSec;

  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  osc.type = 'sawtooth';
  subOsc.type = 'triangle';
  osc.frequency.setValueAtTime(fundamentalHz, start);
  osc.frequency.exponentialRampToValueAtTime(132.0, end);
  subOsc.frequency.setValueAtTime(subHarmonicHz, start);

  const filter1 = ctx.createBiquadFilter();
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(f1, start);
  filter1.Q.setValueAtTime(5.5, start);

  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'bandpass';
  filter2.frequency.setValueAtTime(f2, start);
  filter2.Q.setValueAtTime(7.0, start);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, start);
  masterGain.gain.linearRampToValueAtTime(0.28, start + 0.035);
  masterGain.gain.setValueAtTime(0.24, Math.max(start + 0.04, end - 0.06));
  masterGain.gain.exponentialRampToValueAtTime(0.001, end);

  osc.connect(filter1);
  osc.connect(filter2);
  subOsc.connect(filter1);
  filter1.connect(masterGain);
  filter2.connect(masterGain);
  masterGain.connect(ctx.destination);

  if (hasAspirateOrSibilant) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.09);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2600;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(start);
  }

  osc.start(start);
  subOsc.start(start);
  osc.stop(end);
  subOsc.stop(end);

  return durationSec;
}

/**
 * Reactive 48,000 Hz Classical Sanskrit Neural VITS + 136.1 Hz Formant Dual-Engine Controller
 */
class SanskritAudioEngine {
  private loadingPromise: Promise<void> | null = null;
  private syllableBufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private highlightTimers: number[] = [];
  private isPlayingState = false;
  private currentMode: AudioEngineMode = 'neural-auto';
  private currentVoice: NeuralVoice = 'male';
  private currentRate = 1.0;
  private lastDownloadWavUrl: string | null = null;
  private lastSpokenTitle = '';
  private activeSyllableIndex = -1;
  private activeTimings: SyllableTimingItem[] = [];

  private healthStatus: AudioHealthStatus = {
    backendOnline: false,
    engine: 'ninada-vits-sanskrit-48khz',
    sampleRate: 48000,
    modelsLoaded: ['sa_studio_male', 'sa_studio_female', 'sa_mobile_male', 'sa_mms_16k'],
  };

  private listeners: Set<EngineStateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).sarvaAudioEngine = this;
    }
  }

  public subscribe(listener: EngineStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore listener error
      }
    }
  }

  public async init(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = this.performInit();
    return this.loadingPromise;
  }

  private getApiBaseUrl(): string {
    return (
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_TTS_API_BASE_URL) ||
      ''
    ).replace(/\/+$/, '');
  }

  private async performInit(): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      const healthRes = await fetch(`${this.getApiBaseUrl()}/api/health`);
      const ct = healthRes.headers?.get?.('content-type') || 'application/json';
      if (healthRes.ok && ct.includes('application/json')) {
        const data = await healthRes.json();
        this.healthStatus = {
          backendOnline: data.status === 'ok',
          engine: data.engine || 'ninada-vits-sanskrit-48khz',
          sampleRate: Number(data.sampleRate) || 48000,
          modelsLoaded: Array.isArray(data.modelsLoaded)
            ? data.modelsLoaded
            : this.healthStatus.modelsLoaded,
        };
        this.notify();
        return;
      }
    } catch {
      this.healthStatus.backendOnline = false;
    }
    if (typeof document !== 'undefined' && Boolean(document.head)) {
      const onnxVoice: 'male' | 'female' = this.currentVoice === 'female' ? 'female' : 'male';
      void warmupBrowserOnnxVits(onnxVoice);
    }
    this.notify();
  }

  public getHealthStatus(): AudioHealthStatus {
    return { ...this.healthStatus };
  }

  public getMode(): AudioEngineMode {
    return this.currentMode;
  }

  public setMode(mode: AudioEngineMode): void {
    this.currentMode = mode;
    this.notify();
  }

  public getVoice(): NeuralVoice {
    return this.currentVoice;
  }

  public setVoice(voice: NeuralVoice): void {
    this.currentVoice = voice;
    this.notify();
  }

  public getRate(): number {
    return this.currentRate;
  }

  public setRate(rate: number): void {
    this.currentRate = Math.max(0.6, Math.min(1.2, rate));
    this.notify();
  }

  public getSpeed(): number {
    return this.currentRate;
  }

  public setSpeed(speed: number): void {
    this.setRate(speed);
  }

  private droneOsc: OscillatorNode | null = null;
  private droneSubOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneActive = false;

  public toggleOmDrone(enable?: boolean): boolean {
    const nextState = enable !== undefined ? enable : !this.droneActive;
    if (!nextState) {
      if (this.droneOsc) {
        try {
          this.droneOsc.stop();
          this.droneOsc.disconnect();
        } catch {}
        this.droneOsc = null;
      }
      if (this.droneSubOsc) {
        try {
          this.droneSubOsc.stop();
          this.droneSubOsc.disconnect();
        } catch {}
        this.droneSubOsc = null;
      }
      this.droneActive = false;
      this.notify();
      return false;
    }

    const ctx = getBrowserAudioContext();
    if (!ctx) {
      this.droneActive = false;
      return false;
    }
    this.toggleOmDrone(false);
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(136.1, ctx.currentTime);
    sub.frequency.setValueAtTime(68.05, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    osc.connect(gain);
    sub.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    sub.start();
    this.droneOsc = osc;
    this.droneSubOsc = sub;
    this.droneGain = gain;
    this.droneActive = true;
    this.notify();
    return true;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getActiveSyllableIndex(): number {
    return this.activeSyllableIndex;
  }

  public getActiveTimings(): SyllableTimingItem[] {
    return this.activeTimings;
  }

  public getLastDownloadWavUrl(): string | null {
    return this.lastDownloadWavUrl;
  }

  public getLastSpokenTitle(): string {
    return this.lastSpokenTitle;
  }

  public stop(): void {
    if (typeof window !== 'undefined') {
      for (const timer of this.highlightTimers) {
        window.clearTimeout(timer);
      }
    }
    this.highlightTimers = [];

    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources.clear();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (currentStopTimer) {
      clearTimeout(currentStopTimer);
      currentStopTimer = null;
    }
    if (currentIntervalId) {
      clearInterval(currentIntervalId);
      currentIntervalId = null;
    }

    this.isPlayingState = false;
    this.activeSyllableIndex = -1;
    this.notify();
  }

  private stopActiveSources(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources.clear();
  }

  /**
   * Plays a single Sanskrit syllable (Akṣara) at 48,000 Hz using Plan 1 (`GET /api/syllable/{slp1Key}`)
   * or in-browser ONNX VITS (`sa.onnx` / `sa_female.onnx`), with in-memory `AudioBuffer` caching,
   * falling back to 136.1 Hz Formant Synth or Web Speech.
   */
  public async playSyllable(
    rawSlpOrIast: string,
    options: PlaySyllableOptions = {}
  ): Promise<PlaySyllableResult> {
    const cleanKey = inputToSlp1(rawSlpOrIast.trim(), 'smart') || rawSlpOrIast.trim();
    const voice = options.voice || this.currentVoice;
    const onnxVoice: 'male' | 'female' = voice === 'female' ? 'female' : 'male';
    const rate = options.rate || this.currentRate;
    const mode = options.mode || this.currentMode;

    this.stopActiveSources();

    if (mode === 'synth') {
      const dur = synthesizeSyllableAudio(cleanKey, 0, rate);
      return { source: 'synth', sampleRate: 48000, durationSec: dur, slp1: cleanKey };
    }

    if (mode === 'legacy-tts' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(slp1ToDevanagari(cleanKey));
      utter.lang = 'sa-IN';
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
      return { source: 'legacy-tts', sampleRate: 48000, durationSec: 0.25, slp1: cleanKey };
    }

    const ctx = getBrowserAudioContext();
    if (ctx && typeof fetch !== 'undefined') {
      const cacheKey = `${cleanKey}:${voice}:${rate.toFixed(2)}`;
      let decoded = this.syllableBufferCache.get(cacheKey);

      if (!decoded) {
        try {
          const q = new URLSearchParams({
            voice,
            rate: String(rate),
            format: 'wav',
          });
          const res = await fetch(
            `${this.getApiBaseUrl()}/api/syllable/${encodeURIComponent(cleanKey)}?${q.toString()}`
          );
          const ct = res.headers?.get?.('content-type') || 'audio/wav';
          if (res.ok && ct.includes('audio')) {
            this.healthStatus.backendOnline = true;
            const wavBuf = await res.arrayBuffer();
            decoded = await ctx.decodeAudioData(wavBuf.slice(0));
            this.syllableBufferCache.set(cacheKey, decoded);
          }
        } catch {
          // Backend unreachable; try Browser ONNX VITS next
        }
      }

      if (
        !decoded &&
        typeof document !== 'undefined' &&
        Boolean(document.head)
      ) {
        try {
          const ready =
            isBrowserOnnxReady(onnxVoice) || (await waitForBrowserOnnxReady(onnxVoice, 6500));
          if (ready) {
            const iastSyl = slp1ToIast(cleanKey) || slp1ToDevanagari(cleanKey) || cleanKey;
            const wasmOut = await synthesizeWithBrowserOnnxVits(
              ctx,
              iastSyl,
              onnxVoice,
              rate,
              true,
              'high'
            );
            decoded = wasmOut.audioBuffer;
            this.syllableBufferCache.set(cacheKey, decoded);
          }
        } catch {
          // Fall back to formant synth below
        }
      }

      if (decoded) {
        this.stopActiveSources();
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        this.activeSources.add(source);
        source.onended = () => {
          this.activeSources.delete(source);
        };
        source.start();
        this.notify();
        return {
          source: 'neural-tts',
          sampleRate: 48000,
          durationSec: decoded.duration,
          slp1: cleanKey,
        };
      }
    }

    const dur = synthesizeSyllableAudio(cleanKey, 0, rate);
    return { source: 'synth', sampleRate: 48000, durationSec: dur, slp1: cleanKey };
  }

  /**
   * Synthesizes and plays a full verse, mantra, or Dhāraṇī at 48,000 Hz with
   * frame-accurate syllable highlighting via Plan 1 (`POST /api/tts`) or Browser ONNX VITS,
   * or falls back to the 136.1 Hz Formant Synthesizer (`synth`).
   */
  public async speakText(
    text: string,
    options: SpeakTextOptions = {}
  ): Promise<SpeakTextResult> {
    this.stop();
    const cleanText = text.trim();
    if (!cleanText) {
      return { mode: this.currentMode, sampleRate: 48000, durationSec: 0, syllableTimings: [] };
    }

    const mode = options.mode || this.currentMode;
    const voice = options.voice || this.currentVoice;
    const onnxVoice: 'male' | 'female' = voice === 'female' ? 'female' : 'male';
    const rate = options.rate || options.speed || this.currentRate;
    const onDone = () => {
      options.onPlaybackEnd?.();
      options.onComplete?.();
    };
    this.lastSpokenTitle = options.title || cleanText.slice(0, 42);
    this.isPlayingState = true;
    this.notify();

    const slpFull = inputToSlp1(cleanText, 'smart');
    const rawWords = slpFull.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    const allSyllables: string[] = [];
    for (const w of rawWords) {
      const tokens = syllabifySlp1Word(w);
      for (const tk of tokens) {
        if (!tk.symbol) {
          allSyllables.push((tk.onset || '') + (tk.vowel || '') + (tk.mod || '') + (tk.coda || ''));
        }
      }
    }

    // Plan 1: Native Classical Sanskrit Neural VITS TTS (/api/tts) + Browser ONNX fallback
    if (
      (mode === 'neural-auto' || mode === 'neural-tts') &&
      typeof window !== 'undefined' &&
      typeof fetch !== 'undefined'
    ) {
      try {
        const response = await fetch(`${this.getApiBaseUrl()}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            script: 'auto',
            voice,
            rate,
            response_format: 'json',
          }),
        });

        const ct = response.headers?.get?.('content-type') || 'application/json';
        if (response.ok && ct.includes('application/json')) {
          this.healthStatus.backendOnline = true;
          const data = await response.json();
          const timings: SyllableTimingItem[] = Array.isArray(data.syllableTimings)
            ? data.syllableTimings
            : [];
          this.activeTimings = timings;
          this.lastDownloadWavUrl = data.audioUrl || null;

          const binaryStr = window.atob(data.audioBase64Wav);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const ctx = getBrowserAudioContext();
          if (ctx) {
            const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            this.activeSources.add(source);

            for (const t of timings) {
              const timerId = window.setTimeout(() => {
                this.activeSyllableIndex = t.index;
                this.notify();
                options.onSyllableHighlight?.(t.index, t);
              }, Math.max(0, t.startMs));
              this.highlightTimers.push(timerId);
            }

            const endTimerId = window.setTimeout(() => {
              this.isPlayingState = false;
              this.activeSyllableIndex = -1;
              this.notify();
              options.onSyllableHighlight?.(-1, null);
              onDone();
            }, Math.ceil(audioBuffer.duration * 1000) + 60);
            this.highlightTimers.push(endTimerId);

            source.onended = () => {
              this.activeSources.delete(source);
            };

            source.start();
            this.notify();

            return {
              mode: 'neural-tts',
              sampleRate: 48000,
              durationSec: audioBuffer.duration,
              audioUrl: data.audioUrl,
              syllableTimings: timings,
            };
          }
        }
      } catch {
        // Proceed to Browser ONNX VITS in real browser environments
      }

      if (typeof document !== 'undefined' && Boolean(document.head)) {
        const ctx = getBrowserAudioContext();
        if (ctx) {
          try {
            const ready =
              isBrowserOnnxReady(onnxVoice) || (await waitForBrowserOnnxReady(onnxVoice, 7500));
            if (ready) {
              const iastLine = slp1ToIast(slpFull) || cleanText;
              const phraseCacheKey = `phrase:${iastLine}|${onnxVoice}|${rate.toFixed(2)}`;
              let audioBuffer = this.syllableBufferCache.get(phraseCacheKey);
              if (!audioBuffer) {
                const wasmOut = await synthesizeWithBrowserOnnxVits(
                  ctx,
                  iastLine,
                  onnxVoice,
                  rate,
                  allSyllables.length <= 1,
                  'high'
                );
                const rawPcm = wasmOut.pcm48k;
                let s0 = 0;
                while (s0 < rawPcm.length && Math.abs(rawPcm[s0]) < 0.0085) s0++;
                let s1 = rawPcm.length - 1;
                while (s1 > s0 && Math.abs(rawPcm[s1]) < 0.0085) s1--;
                const cut0 = Math.max(0, s0 - 288);
                const cut1 = Math.min(rawPcm.length, Math.max(cut0 + 1200, s1 + 672));
                const trimmed = rawPcm.subarray(cut0, cut1);
                audioBuffer = ctx.createBuffer(1, Math.max(480, trimmed.length), 48000);
                audioBuffer.getChannelData(0).set(trimmed);
                if (this.syllableBufferCache.size >= 256) {
                  const firstK = this.syllableBufferCache.keys().next().value;
                  if (firstK) this.syllableBufferCache.delete(firstK);
                }
                this.syllableBufferCache.set(phraseCacheKey, audioBuffer);
              }
              const totalMs = Math.max(80, Math.round(audioBuffer.duration * 1000));
              const weights = allSyllables.map((rawSyl) =>
                /[AIFXEO]|[MH~]$|[kKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL]$/.test(rawSyl) ? 1.75 : 1.0
              );
              const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
              let cursorMs = 6;
              const activeMs = Math.max(50, totalMs - 20);
              const wasmTimings: SyllableTimingItem[] = allSyllables.map((rawSyl, idx) => {
                const durMs = Math.max(30, Math.round((weights[idx] / weightSum) * activeMs));
                const item: SyllableTimingItem = {
                  index: idx,
                  slp1: rawSyl,
                  deva: slp1ToDevanagari(rawSyl),
                  iast: slp1ToIast(rawSyl),
                  meter: weights[idx] > 1 ? '—' : '⏑',
                  startMs: cursorMs,
                  endMs: cursorMs + durMs,
                  durationMs: durMs,
                };
                cursorMs += durMs;
                return item;
              });

              this.activeTimings = wasmTimings;
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              this.activeSources.add(source);

              for (const t of wasmTimings) {
                const timerId = window.setTimeout(() => {
                  this.activeSyllableIndex = t.index;
                  this.notify();
                  options.onSyllableHighlight?.(t.index, t);
                }, Math.max(0, t.startMs));
                this.highlightTimers.push(timerId);
              }

              const endTimerId = window.setTimeout(() => {
                this.isPlayingState = false;
                this.activeSyllableIndex = -1;
                this.notify();
                options.onSyllableHighlight?.(-1, null);
                onDone();
              }, Math.ceil(audioBuffer.duration * 1000) + 18);
              this.highlightTimers.push(endTimerId);

              source.onended = () => {
                this.activeSources.delete(source);
              };

              source.start();
              this.notify();

              return {
                mode: 'neural-tts',
                sampleRate: 48000,
                durationSec: audioBuffer.duration,
                syllableTimings: wasmTimings,
              };
            }
          } catch {
            // Fall through to 136.1 Hz Formant Synthesizer
          }
        }
      }
    }

    // 136.1 Hz Formant Synthesizer fallback (with syllable timeline population for AudioPlayerBar)
    let offset = 0;
    const synthTimings: SyllableTimingItem[] = [];
    allSyllables.forEach((rawSyl, idx) => {
      const dur = synthesizeSyllableAudio(rawSyl, offset, rate);
      const startMs = Math.round(offset * 1000);
      const durMs = Math.round(dur * 1000);
      const isGuru = /[AIFXEO]|[MH~]$|[kKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL]$/.test(rawSyl);
      const timingItem: SyllableTimingItem = {
        index: idx,
        slp1: rawSyl,
        deva: slp1ToDevanagari(rawSyl),
        iast: slp1ToIast(rawSyl),
        meter: isGuru ? '—' : '⏑',
        startMs,
        endMs: startMs + durMs,
        durationMs: durMs,
      };
      synthTimings.push(timingItem);

      if (typeof window !== 'undefined') {
        const timerId = window.setTimeout(() => {
          this.activeSyllableIndex = idx;
          this.notify();
          options.onSyllableHighlight?.(idx, timingItem);
        }, startMs);
        this.highlightTimers.push(timerId);
      }
      offset += dur + 0.05;
    });

    this.activeTimings = synthTimings;
    this.notify();

    if (typeof window !== 'undefined') {
      const endTimerId = window.setTimeout(() => {
        this.isPlayingState = false;
        this.activeSyllableIndex = -1;
        this.notify();
        options.onSyllableHighlight?.(-1, null);
        onDone();
      }, Math.ceil(offset * 1000) + 80);
      this.highlightTimers.push(endTimerId);
    } else {
      this.isPlayingState = false;
    }

    return {
      mode: 'synth',
      sampleRate: 48000,
      durationSec: Number(offset.toFixed(4)),
      syllableTimings: synthTimings,
    };
  }
}

export const sanskritAudioEngine = new SanskritAudioEngine();
export default sanskritAudioEngine;

/**
 * Play a single Sanskrit syllable using 48kHz Neural VITS (in browser when neural mode is active),
 * Web Speech TTS, or the 136.1 Hz Web Audio Formant Synth.
 */
export function playSingleSyllable(
  rawSlpOrIastOrObj: string | { slp1?: string; rawIast?: string; iast?: string },
  options: {
    mode?: 'auto' | 'synth' | 'tts' | 'neural-tts' | 'neural-auto' | 'legacy-tts';
    voice?: NeuralVoice;
    rate?: number;
    speed?: number;
  } = {}
): number {
  const { mode = 'auto' } = options;
  const rate = options.rate || options.speed || 0.85;
  const rawStr =
    typeof rawSlpOrIastOrObj === 'string'
      ? rawSlpOrIastOrObj
      : rawSlpOrIastOrObj.slp1 || rawSlpOrIastOrObj.rawIast || rawSlpOrIastOrObj.iast || 'oM';
  const slpSyl = inputToSlp1(rawStr, 'smart');
  const devaSyl = slp1ToDevanagari(slpSyl);

  // If running in browser and user requests neural-tts (or auto in a real DOM browser / active backend)
  if (
    typeof window !== 'undefined' &&
    (mode === 'neural-tts' ||
      mode === 'neural-auto' ||
      (mode === 'auto' &&
        (sanskritAudioEngine.getMode() === 'neural-tts' ||
          sanskritAudioEngine.getMode() === 'neural-auto') &&
        (sanskritAudioEngine.getHealthStatus().backendOnline ||
          (typeof document !== 'undefined' && Boolean(document.head)))))
  ) {
    void sanskritAudioEngine.playSyllable(slpSyl, { voice: options.voice, rate });
    return computeSyllableAcousticProfile(slpSyl, rate).durationSec;
  }

  if (
    mode !== 'synth' &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  ) {
    const voices = window.speechSynthesis.getVoices();
    const targetVoice =
      voices.find((v) => v.lang.startsWith('sa')) ||
      voices.find((v) => v.lang.startsWith('hi')) ||
      voices.find((v) => v.lang.includes('IN'));
    if (targetVoice || mode === 'tts' || mode === 'legacy-tts') {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(devaSyl);
      if (targetVoice) {
        utter.voice = targetVoice;
        utter.lang = targetVoice.lang;
      } else {
        utter.lang = 'hi-IN';
      }
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
      if (targetVoice) {
        return computeSyllableAcousticProfile(slpSyl, rate).durationSec;
      }
    }
  }

  return synthesizeSyllableAudio(slpSyl, 0, rate);
}

export function stopSpeaking(): void {
  sanskritAudioEngine.stop();
}

export function stopSanskritSpeech(): void {
  sanskritAudioEngine.stop();
}

/**
 * Speak a full Sanskrit line or mantra with sequential syllable highlighting and automatic
 * 48kHz Neural VITS / 136.1 Hz Web Audio Formant Synth support.
 */
export function speakSanskrit(
  textOrSlp1: string,
  options: SpeakOptions = {}
): { stop: () => void; totalDurationSec: number; modeUsed: 'tts' | 'synth' | 'neural-tts' } {
  stopSpeaking();
  const { mode = 'auto', rate = 0.85, onSyllableIndex, onEnd, title, voice } = options;
  const slpFull = inputToSlp1(textOrSlp1.trim(), 'smart');
  const devaText = slp1ToDevanagari(slpFull);

  const rawWords = slpFull.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  const allSyllables: string[] = [];
  for (const w of rawWords) {
    const tokens = syllabifySlp1Word(w);
    for (const tk of tokens) {
      if (!tk.symbol) {
        allSyllables.push((tk.onset || '') + (tk.vowel || '') + (tk.mod || '') + (tk.coda || ''));
      }
    }
  }

  // If running in browser and neural-tts is requested (or auto in a real DOM browser / active backend)
  if (
    typeof window !== 'undefined' &&
    (mode === 'neural-tts' ||
      mode === 'neural-auto' ||
      (mode === 'auto' &&
        (sanskritAudioEngine.getMode() === 'neural-tts' ||
          sanskritAudioEngine.getMode() === 'neural-auto') &&
        (sanskritAudioEngine.getHealthStatus().backendOnline ||
          (typeof document !== 'undefined' && Boolean(document.head)))))
  ) {
    let estTotal = 0;
    for (const s of allSyllables) {
      estTotal += computeSyllableAcousticProfile(s, rate).durationSec + 0.05;
    }
    void sanskritAudioEngine.speakText(textOrSlp1, {
      mode: 'neural-tts',
      voice,
      rate,
      title,
      onSyllableHighlight: (idx) => {
        if (idx >= 0 && onSyllableIndex) onSyllableIndex(idx);
      },
      onPlaybackEnd: () => {
        if (onEnd) onEnd();
      },
    });
    return {
      stop: stopSpeaking,
      totalDurationSec: Number(estTotal.toFixed(4)),
      modeUsed: 'neural-tts',
    };
  }

  const hasBrowserSpeech =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const voices = hasBrowserSpeech ? window.speechSynthesis.getVoices() : [];
  const targetVoice =
    voices.find((v) => v.lang.startsWith('sa')) ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.lang.includes('IN'));

  if (mode === 'synth' || !hasBrowserSpeech || (mode === 'auto' && !targetVoice)) {
    let offset = 0;
    const synthTimings: SyllableTimingItem[] = [];
    allSyllables.forEach((rawSyl, idx) => {
      const dur = synthesizeSyllableAudio(rawSyl, offset, rate);
      const startMs = Math.round(offset * 1000);
      const durMs = Math.round(dur * 1000);
      const isGuru = /[AIFXEO]|[MH~]$|[kKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL]$/.test(rawSyl);
      synthTimings.push({
        index: idx,
        slp1: rawSyl,
        deva: slp1ToDevanagari(rawSyl),
        iast: slp1ToIast(rawSyl),
        meter: isGuru ? '—' : '⏑',
        startMs,
        endMs: startMs + durMs,
        durationMs: durMs,
      });
      if (onSyllableIndex && typeof window !== 'undefined') {
        setTimeout(() => {
          onSyllableIndex(idx);
        }, startMs);
      }
      offset += dur + 0.05;
    });

    if (typeof window !== 'undefined' && onEnd) {
      currentStopTimer = setTimeout(() => {
        onEnd();
      }, offset * 1000 + 120);
    }

    return {
      stop: stopSpeaking,
      totalDurationSec: Number(offset.toFixed(4)),
      modeUsed: 'synth'
    };
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(devaText);
  if (targetVoice) {
    utter.voice = targetVoice;
    utter.lang = targetVoice.lang;
  } else {
    utter.lang = 'hi-IN';
  }
  utter.rate = rate;

  const stepMs = Math.max(220, Math.round(320 / rate));
  let curIdx = 0;
  currentIntervalId = setInterval(() => {
    if (curIdx >= allSyllables.length) {
      if (currentIntervalId) clearInterval(currentIntervalId);
      return;
    }
    if (onSyllableIndex) onSyllableIndex(curIdx);
    curIdx++;
  }, stepMs);

  utter.onend = () => {
    stopSpeaking();
    if (onEnd) onEnd();
  };
  utter.onerror = () => {
    stopSpeaking();
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utter);

  return {
    stop: stopSpeaking,
    totalDurationSec: Number(((allSyllables.length * stepMs) / 1000).toFixed(4)),
    modeUsed: 'tts'
  };
}
