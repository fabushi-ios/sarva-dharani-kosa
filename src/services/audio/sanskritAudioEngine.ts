/**
 * Plan 1 & Plan 3 Unified 48,000 Hz Classical Sanskrit Neural Audio Engine
 * (`src/services/audio/sanskritAudioEngine.ts`)
 *
 * - Plan 1: Native Classical Sanskrit Neural VITS TTS (`POST /api/tts` & `GET /api/syllable/{slp1}`)
 *   powered by IIT Madras Rasa (`gnumanth/ninada`) at 48,000 Hz with frame-exact `syllableTimings`.
 * - Plan 3: Pre-generated 48,000 Hz Siddhaṃ 34×14 Phonetic Matrix & High-Frequency Dhāraṇī Syllable
 *   Neural Audio Sprite (`/audio/siddham_sprite_manifest.json` + `/audio/siddham_sprite_48k.ogg` / `.wav`)
 *   decoded into a Web Audio `AudioBuffer` for 0-latency single-syllable click & offline concatenation.
 */

import { analyzeSanskritText } from '../../core/prosody';
import { slp1ToDevanagari } from '../../core/transliterator';
import {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SiddhamSpriteManifest,
  SyllableTimingItem,
} from '../../types/dharani';

export interface PlaySyllableOptions {
  voice?: NeuralVoice;
  rate?: number;
  mode?: AudioEngineMode;
}

export interface SpeakTextOptions {
  voice?: NeuralVoice;
  rate?: number;
  mode?: AudioEngineMode;
  onSyllableHighlight?: (index: number, timing: SyllableTimingItem | null) => void;
  onPlaybackEnd?: () => void;
}

export interface SpeakTextResult {
  mode: string;
  sampleRate: number;
  durationSec: number;
  audioUrl?: string;
  syllableTimings: SyllableTimingItem[];
}

export interface PlaySyllableResult {
  source: 'neural-sprite' | 'neural-tts' | 'legacy-tts';
  sampleRate: number;
  durationSec: number;
  slp1: string;
}

type EngineStateListener = () => void;

class SanskritAudioEngine {
  private audioCtx: AudioContext | null = null;
  private manifest: SiddhamSpriteManifest | null = null;
  private spriteBuffer: AudioBuffer | null = null;
  private loadingPromise: Promise<void> | null = null;

  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private highlightTimers: number[] = [];
  private isPlayingState = false;
  private currentMode: AudioEngineMode = 'neural-auto';
  private currentVoice: NeuralVoice = 'male';
  private currentRate = 1.0;
  private lastDownloadWavUrl: string | null = null;
  private lastSpokenTitle = '';
  private activeSyllableIndex: number = -1;
  private activeTimings: SyllableTimingItem[] = [];

  private healthStatus: AudioHealthStatus = {
    backendOnline: false,
    engine: 'ninada-vits-sanskrit-48khz',
    sampleRate: 48000,
    modelsLoaded: ['sa_studio_male', 'sa_studio_female', 'sa_mobile_male', 'sa_mms_16k'],
    spriteCount: 650,
    spriteReady: false,
    spriteBufferDecoded: false,
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

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx({ sampleRate: 48000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public async init(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = this.performInit();
    return this.loadingPromise;
  }

  private async performInit(): Promise<void> {
    // 1. Check Plan 1 FastAPI Backend Health (/api/health)
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        this.healthStatus = {
          ...this.healthStatus,
          backendOnline: data.status === 'ok',
          engine: data.engine || 'ninada-vits-sanskrit-48khz',
          sampleRate: 48000,
          modelsLoaded: Array.isArray(data.modelsLoaded) ? data.modelsLoaded : this.healthStatus.modelsLoaded,
          spriteCount: Number(data.spriteCount) || this.healthStatus.spriteCount,
          spriteReady: Boolean(data.spriteReady),
        };
      }
    } catch {
      this.healthStatus.backendOnline = false;
    }

    // 2. Load Plan 3 48kHz Sprite Manifest (/audio/siddham_sprite_manifest.json)
    try {
      const manifestRes = await fetch('/audio/siddham_sprite_manifest.json');
      if (manifestRes.ok) {
        const manifestData = (await manifestRes.json()) as SiddhamSpriteManifest;
        this.manifest = manifestData;
        this.healthStatus.spriteCount = Object.keys(manifestData.sprites || {}).length;
        this.healthStatus.spriteReady = true;
      }
    } catch {
      // Manifest will be retried on demand
    }

    this.notify();

    // 3. Pre-decode 48kHz Audio Sprite (/audio/siddham_sprite_48k.ogg with fallback to /audio/siddham_sprite_48k.wav)
    await this.ensureSpriteBufferDecoded();
  }

  public async ensureSpriteBufferDecoded(): Promise<AudioBuffer | null> {
    if (this.spriteBuffer) return this.spriteBuffer;
    if (!this.manifest) {
      try {
        const manifestRes = await fetch('/audio/siddham_sprite_manifest.json');
        if (manifestRes.ok) {
          this.manifest = (await manifestRes.json()) as SiddhamSpriteManifest;
          this.healthStatus.spriteCount = Object.keys(this.manifest.sprites || {}).length;
          this.healthStatus.spriteReady = true;
        }
      } catch {
        // ignore
      }
    }

    const urlsToTry = [
      this.manifest?.audioUrlOgg || '/audio/siddham_sprite_48k.ogg',
      this.manifest?.audioUrlWav || '/audio/siddham_sprite_48k.wav',
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        const ctx = this.getAudioContext();
        const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
        this.spriteBuffer = decoded;
        this.healthStatus.spriteBufferDecoded = true;
        this.notify();
        return decoded;
      } catch {
        // try next URL
      }
    }
    return null;
  }

  public getHealthStatus(): AudioHealthStatus {
    return { ...this.healthStatus };
  }

  public getManifest(): SiddhamSpriteManifest | null {
    return this.manifest;
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
    for (const timer of this.highlightTimers) {
      window.clearTimeout(timer);
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

    this.isPlayingState = false;
    this.activeSyllableIndex = -1;
    this.notify();
  }

  /**
   * Plays a single Sanskrit syllable (Akṣara) at 48,000 Hz:
   * - Primarily slices the preloaded Plan 3 48kHz neural `AudioBuffer` with 0ms latency.
   * - Falls back to `GET /api/syllable/{slp1Key}` when using `female`/`mobile` voices or unseen clusters.
   */
  public async playSyllable(
    slp1Key: string,
    options: PlaySyllableOptions = {}
  ): Promise<PlaySyllableResult> {
    const cleanKey = slp1Key.trim();
    const voice = options.voice || this.currentVoice;
    const rate = options.rate || this.currentRate;
    const mode = options.mode || this.currentMode;

    if (mode === 'legacy-tts' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(slp1ToDevanagari(cleanKey));
      utter.lang = 'sa-IN';
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
      return { source: 'legacy-tts', sampleRate: 48000, durationSec: 0.25, slp1: cleanKey };
    }

    await this.ensureSpriteBufferDecoded();

    // Check if present in Plan 3 48kHz Sprite Manifest
    const spriteEntry = this.manifest?.sprites?.[cleanKey];
    if (
      spriteEntry &&
      this.spriteBuffer &&
      (mode === 'neural-sprite' || (mode === 'neural-auto' && voice === 'male'))
    ) {
      const ctx = this.getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = this.spriteBuffer;
      source.playbackRate.value = rate;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const playDur = spriteEntry.duration / rate;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(1.0, now + Math.min(0.008, playDur * 0.15));
      gain.gain.setValueAtTime(1.0, now + Math.max(0.01, playDur - 0.018));
      gain.gain.linearRampToValueAtTime(0.0001, now + playDur);

      source.connect(gain);
      gain.connect(ctx.destination);

      this.activeSources.add(source);
      source.onended = () => {
        this.activeSources.delete(source);
      };

      source.start(now, spriteEntry.offset, spriteEntry.duration);
      return {
        source: 'neural-sprite',
        sampleRate: 48000,
        durationSec: playDur,
        slp1: cleanKey,
      };
    }

    // Fallback to Plan 1 GET /api/syllable/{slp1Key}
    try {
      const q = new URLSearchParams({
        voice,
        rate: String(rate),
        format: 'wav',
      });
      const res = await fetch(`/api/syllable/${encodeURIComponent(cleanKey)}?${q.toString()}`);
      if (res.ok) {
        const wavBuf = await res.arrayBuffer();
        const ctx = this.getAudioContext();
        const decoded = await ctx.decodeAudioData(wavBuf.slice(0));
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        this.activeSources.add(source);
        source.onended = () => {
          this.activeSources.delete(source);
        };
        source.start();
        return {
          source: 'neural-tts',
          sampleRate: 48000,
          durationSec: decoded.duration,
          slp1: cleanKey,
        };
      }
    } catch {
      // Fallback to composite onset+vowel slice if backend unreachable
    }

    // Offline composite fallback from sprite if available
    if (this.spriteBuffer && this.manifest) {
      const baseFallback = this.manifest.sprites[cleanKey.slice(0, 2)] || this.manifest.sprites.ka;
      if (baseFallback) {
        const ctx = this.getAudioContext();
        const source = ctx.createBufferSource();
        source.buffer = this.spriteBuffer;
        source.playbackRate.value = rate;
        source.connect(ctx.destination);
        source.start(0, baseFallback.offset, baseFallback.duration);
        return {
          source: 'neural-sprite',
          sampleRate: 48000,
          durationSec: baseFallback.duration / rate,
          slp1: cleanKey,
        };
      }
    }

    return { source: 'neural-sprite', sampleRate: 48000, durationSec: 0.22, slp1: cleanKey };
  }

  /**
   * Synthesizes and plays a full verse, mantra, or Dhāraṇī at 48,000 Hz with
   * frame-accurate syllable highlighting.
   */
  public async speakText(
    text: string,
    options: SpeakTextOptions & { title?: string } = {}
  ): Promise<SpeakTextResult> {
    this.stop();
    const cleanText = text.trim();
    if (!cleanText) {
      return { mode: this.currentMode, sampleRate: 48000, durationSec: 0, syllableTimings: [] };
    }

    const mode = options.mode || this.currentMode;
    const voice = options.voice || this.currentVoice;
    const rate = options.rate || this.currentRate;
    this.lastSpokenTitle = options.title || cleanText.slice(0, 36);
    this.isPlayingState = true;
    this.notify();

    // Plan 1: Native Classical Sanskrit Neural VITS TTS (/api/tts)
    if (mode === 'neural-auto' || mode === 'neural-tts') {
      try {
        const response = await fetch('/api/tts', {
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

        if (response.ok) {
          const data = await response.json();
          const timings: SyllableTimingItem[] = Array.isArray(data.syllableTimings)
            ? data.syllableTimings
            : [];
          this.activeTimings = timings;
          this.lastDownloadWavUrl = data.audioUrl || null;

          // Decode base64 48kHz WAV into Web Audio API AudioBuffer
          const binaryStr = window.atob(data.audioBase64Wav);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const ctx = this.getAudioContext();
          const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);

          this.activeSources.add(source);

          // Schedule frame-exact syllable highlighting
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
            options.onPlaybackEnd?.();
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
      } catch {
        // Fall through to Plan 3 48kHz neural sprite concatenation
      }
    }

    // Plan 3: Offline 48kHz Neural Sprite Prosodic Concatenation
    await this.ensureSpriteBufferDecoded();
    const analyzed = analyzeSanskritText(cleanText);
    const phoneticSyllables = analyzed.syllables.filter((s) => !s.isSymbol && s.slp1);
    const timings: SyllableTimingItem[] = [];

    const ctx = this.getAudioContext();
    const baseStartTime = ctx.currentTime + 0.02;
    let cursorSec = 0;

    for (let idx = 0; idx < phoneticSyllables.length; idx++) {
      const syl = phoneticSyllables[idx];
      const spriteEntry =
        this.manifest?.sprites?.[syl.slp1] ||
        this.manifest?.sprites?.[`${syl.onset}${syl.vowel}`] ||
        this.manifest?.sprites?.a;

      const rawDur = spriteEntry ? spriteEntry.duration : syl.meter === '—' ? 0.36 : 0.22;
      const playDur = rawDur / rate;
      const startMs = Math.round(cursorSec * 1000);
      const endMs = Math.round((cursorSec + playDur) * 1000);

      const timingItem: SyllableTimingItem = {
        index: idx,
        slp1: syl.slp1,
        deva: syl.deva,
        iast: syl.iast,
        meter: syl.meter,
        startMs,
        endMs,
        durationMs: endMs - startMs,
      };
      timings.push(timingItem);

      if (this.spriteBuffer && spriteEntry) {
        const src = ctx.createBufferSource();
        src.buffer = this.spriteBuffer;
        src.playbackRate.value = rate;

        const gain = ctx.createGain();
        const t0 = baseStartTime + cursorSec;
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(1.0, t0 + 0.008);
        gain.gain.setValueAtTime(1.0, t0 + Math.max(0.01, playDur - 0.015));
        gain.gain.linearRampToValueAtTime(0.0001, t0 + playDur);

        src.connect(gain);
        gain.connect(ctx.destination);

        this.activeSources.add(src);
        src.onended = () => {
          this.activeSources.delete(src);
        };
        src.start(t0, spriteEntry.offset, spriteEntry.duration);
      }

      const timerId = window.setTimeout(() => {
        this.activeSyllableIndex = idx;
        this.notify();
        options.onSyllableHighlight?.(idx, timingItem);
      }, startMs);
      this.highlightTimers.push(timerId);

      // Slight prosodic overlap/crossfade for natural连读
      cursorSec += Math.max(0.08, playDur - 0.012);
    }

    this.activeTimings = timings;
    const totalMs = Math.ceil(cursorSec * 1000) + 60;
    const finishId = window.setTimeout(() => {
      this.isPlayingState = false;
      this.activeSyllableIndex = -1;
      this.notify();
      options.onSyllableHighlight?.(-1, null);
      options.onPlaybackEnd?.();
    }, totalMs);
    this.highlightTimers.push(finishId);

    this.notify();
    return {
      mode: 'neural-sprite',
      sampleRate: 48000,
      durationSec: cursorSec,
      syllableTimings: timings,
    };
  }
}

export const sanskritAudioEngine = new SanskritAudioEngine();
export default sanskritAudioEngine;
