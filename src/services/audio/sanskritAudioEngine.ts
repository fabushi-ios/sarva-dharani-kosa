/**
 * Plan 1 Unified 48,000 Hz Classical Sanskrit Neural Audio Engine
 * (`src/services/audio/sanskritAudioEngine.ts`)
 *
 * - Plan 1: Native Classical Sanskrit Neural VITS TTS (`POST /api/tts` & `GET /api/syllable/{slp1}`)
 *   powered by IIT Madras Rasa (`gnumanth/ninada`) at 48,000 Hz with frame-exact `syllableTimings`
 *   and in-memory `AudioBuffer` caching for instant 0ms replay on repeated syllable clicks.
 */

import { slp1ToDevanagari } from '../../core/transliterator';
import {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
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
  source: 'neural-tts' | 'legacy-tts';
  sampleRate: number;
  durationSec: number;
  slp1: string;
}

type EngineStateListener = () => void;

class SanskritAudioEngine {
  private audioCtx: AudioContext | null = null;
  private loadingPromise: Promise<void> | null = null;
  private syllableBufferCache: Map<string, AudioBuffer> = new Map();

  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private highlightTimers: number[] = [];
  private isPlayingState = false;
  private currentMode: AudioEngineMode = 'neural-tts';
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
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    // Check Plan 1 FastAPI Backend Health (/api/health)
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        this.healthStatus = {
          ...this.healthStatus,
          backendOnline: data.status === 'ok',
          engine: data.engine || 'ninada-vits-sanskrit-48khz',
          sampleRate: 48000,
          modelsLoaded: Array.isArray(data.modelsLoaded)
            ? data.modelsLoaded
            : this.healthStatus.modelsLoaded,
        };
      }
    } catch {
      this.healthStatus.backendOnline = false;
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
   * Plays a single Sanskrit syllable (Akṣara) at 48,000 Hz using Plan 1 (`GET /api/syllable/{slp1Key}`)
   * with in-memory `AudioBuffer` caching.
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

    const cacheKey = `${cleanKey}:${voice}:${rate.toFixed(2)}`;
    const ctx = this.getAudioContext();

    try {
      let decoded = this.syllableBufferCache.get(cacheKey);
      if (!decoded) {
        const q = new URLSearchParams({
          voice,
          rate: String(rate),
          format: 'wav',
        });
        const res = await fetch(`/api/syllable/${encodeURIComponent(cleanKey)}?${q.toString()}`);
        if (res.ok) {
          const wavBuf = await res.arrayBuffer();
          decoded = await ctx.decodeAudioData(wavBuf.slice(0));
          this.syllableBufferCache.set(cacheKey, decoded);
        }
      }

      if (decoded) {
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
      // Fallback to Web Speech API only if backend is unreachable
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(slp1ToDevanagari(cleanKey));
        utter.lang = 'sa-IN';
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore
      }
    }
    return { source: 'legacy-tts', sampleRate: 48000, durationSec: 0.25, slp1: cleanKey };
  }

  /**
   * Synthesizes and plays a full verse, mantra, or Dhāraṇī at 48,000 Hz with
   * frame-accurate syllable highlighting via Plan 1 (`POST /api/tts`).
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
    if (mode !== 'legacy-tts') {
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
        // Fallback to Web Speech API only if backend is unreachable
      }
    }

    // Legacy Web Speech API fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = 'sa-IN';
        utter.rate = rate;
        utter.onend = () => {
          this.isPlayingState = false;
          this.activeSyllableIndex = -1;
          this.notify();
          options.onSyllableHighlight?.(-1, null);
          options.onPlaybackEnd?.();
        };
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore
      }
    }
    this.isPlayingState = false;
    this.notify();
    return {
      mode: 'legacy-tts',
      sampleRate: 24000,
      durationSec: 1.0,
      syllableTimings: [],
    };
  }
}

export const sanskritAudioEngine = new SanskritAudioEngine();
export default sanskritAudioEngine;
