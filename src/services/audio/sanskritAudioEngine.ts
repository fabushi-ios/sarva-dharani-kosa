/**
 * src/services/audio/sanskritAudioEngine.ts
 *
 * Studio-Grade Multi-Engine Sanskrit Chanting & Pronunciation Synthesizer
 * Solves web playback lag and provides WAV audio file export/delivery:
 *
 * 1. 'studio-vocal-chant' (Default):
 *    - Pre-renders each verse into a continuous 48000 Hz PCM AudioBuffer with:
 *      * Rosenberg glottal vocal source + 3-formant (F1, F2, F3) smooth vowel tract trajectories
 *      * Consonant articulation synthesis (sibilant fricatives ś/ṣ/s, aspiration h/ḥ/bh/dh, nasal murmur ṃ/m/n)
 *      * Temple singing bowl chime & Tanpura (Sa-Pa 204.15Hz) harmonic accompaniment
 *      * Compatible with `/api/tts`, `/api/syllable/`, `/api/health` and `/audio/siddham_sprite_manifest.json` + `/audio/siddham_sprite_48k.ogg`
 *    - Hardware-clock (AudioContext.currentTime + requestAnimationFrame) 60fps synchronization:
 *      ZERO setTimeout jitter, ZERO lag, comfortable human follow-along tempo (Laghu=380ms, Guru=680ms).
 *
 * 2. 'mandarin-phonetic-guide':
 *    - Uses zh-CN Web Speech API to read the aligned "现代梵音拼读参考" clearly at a teaching pace
 *      while highlighting each Sanskrit syllable in sync.
 *
 * 3. 'indic-devanagari-tts':
 *    - Uses sa-IN / hi-IN Web Speech API for native Indic Devanāgarī reading with boundary tracking.
 *
 * 4. One-Click WAV File Generator (`renderVersesToWavBlob`):
 *    - Synthesizes any verse or the entire Dhāraṇī into a downloadable 48000 Hz 16-bit `.wav` file
 *      so users can play it in a native `<audio>` tag or send/save the audio file to their phone.
 */

import { analyzeSanskritProsody, type SyllableAnalysis } from '../../core/sanskrit/prosody';
import { iastToDevanagari } from '../../core/sanskrit/transliterator';
import {
  enrichSyllablesWithPhonetics,
  mapSyllableToChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import type { DharaniVerse } from '../../types/kosaTypes';
import {
  HF_TTS_API_BASE_URL,
  cancelLowPriorityBrowserOnnxTasks,
  isBrowserOnnxReady,
  sendHfKeepAliveBeacon,
  synthesizePcmWithBrowserOnnxVits,
  synthesizeWithBrowserOnnxVits,
  warmupBrowserOnnxVits,
  type AcousticChunkSpan,
} from './browserOnnxTtsEngine';
import {
  buildDharaniAudioFileName,
  encodePcmToMp3Bytes,
  encodePcmToWavBytes,
  splitIastIntoExportSubclauses,
  uint8ArrayToAudioBlob,
  type AudioExportFormat,
  type AudioExportProgress,
  type ExportedDharaniAudio,
} from './audioExportEncoder';
import {
  renderNeuralResonanceStereoPcm,
  type NeuralResonanceVariant,
} from './neuralResonanceDsp';

export type { AudioExportFormat, AudioExportProgress, ExportedDharaniAudio, NeuralResonanceVariant };

export type AudioEngineMode =
  | 'neural-vits-48k'
  | 'neural-resonance-hall'
  | 'neural-vedic-chant'
  | 'studio-vocal-chant'
  | 'mandarin-phonetic-guide'
  | 'indic-devanagari-tts';

export function isNeuralEngineMode(mode: AudioEngineMode): boolean {
  return (
    mode === 'neural-vits-48k' ||
    mode === 'neural-resonance-hall' ||
    mode === 'neural-vedic-chant'
  );
}

export function getNeuralResonanceVariant(mode: AudioEngineMode): NeuralResonanceVariant | null {
  if (mode === 'neural-resonance-hall') return 'hall';
  if (mode === 'neural-vedic-chant') return 'vedic-chant';
  return null;
}

export type SanskritVoiceGender = 'male' | 'female';

export interface PlaybackSyllableTiming {
  syl: SyllableAnalysis;
  classicalZh: string;
  modernZh: string;
  startSec: number;
  endSec: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isLoadingAudio?: boolean;
  currentVerseIndex: number | null;
  currentSyllableIndex: number | null;
  currentSyllableInfo: SyllableAnalysis | null;
  currentSyllableClassicalZh: string;
  currentSyllableModernZh: string;
  syllableProgress: number; // 0 to 1
  verseProgress: number;    // 0 to 1
  rate: number;
  loopVerse: boolean;
  autoScroll: boolean;
  mode: AudioEngineMode;
  voice: SanskritVoiceGender;
  omDroneActive: boolean;
  backendOnline: boolean;
  spriteCount: number;
  activeModel?: string;
}

type StateListener = (state: PlaybackState) => void;

const SAMPLE_RATE = 48000;
const SA_FUNDAMENTAL_HZ = 136 + 0.1;
const TTS_API_BASE_URL = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_TTS_API_BASE_URL) ||
  ''
).replace(/\/+$/, '');

export const AUDIO_API_ENDPOINTS = {
  tts: `${TTS_API_BASE_URL}/api/tts`,
  syllable: `${TTS_API_BASE_URL}/api/syllable/`,
  health: `${TTS_API_BASE_URL}/api/health`,
  spriteManifest: `${TTS_API_BASE_URL}/audio/siddham_sprite_manifest.json`,
  spriteOgg: `${TTS_API_BASE_URL}/audio/siddham_sprite_48k.ogg`,
} as const;

export const HF_AUDIO_API_ENDPOINTS = {
  tts: `${HF_TTS_API_BASE_URL}/api/tts`,
  syllable: `${HF_TTS_API_BASE_URL}/api/syllable/`,
  health: `${HF_TTS_API_BASE_URL}/api/health`,
} as const;

/**
 * Trims leading and trailing near-silent padding from a 48kHz PCM waveform while preserving
 * a protective 6ms pre-onset margin (with 3ms raised-cosine attack) and 14ms post-offset decay
 * (with 10ms raised-cosine release), shifting all syllable timing windows by the exact trimmed offset.
 */
export function trimSilenceAndShiftTimings(
  pcm: Float32Array,
  sampleRate: number,
  timings: PlaybackSyllableTiming[]
): {
  pcm: Float32Array;
  timings: PlaybackSyllableTiming[];
  durationSec: number;
} {
  const n = pcm.length;
  const minSamples = Math.round(0.05 * sampleRate);
  if (n <= minSamples) {
    return {
      pcm,
      timings,
      durationSec: n / sampleRate,
    };
  }

  const threshold = 0.0085; // ~ -41.4 dBFS: preserves soft fricatives, aspirates & visargas while cutting dead air
  const preMargin = Math.round(0.006 * sampleRate); // 6ms clean onset guard
  const postMargin = Math.round(0.014 * sampleRate); // 14ms natural coda tail

  let firstActive = 0;
  while (firstActive < n && Math.abs(pcm[firstActive]) < threshold) {
    firstActive++;
  }

  if (firstActive >= n) {
    return {
      pcm,
      timings,
      durationSec: n / sampleRate,
    };
  }

  let lastActive = n - 1;
  while (lastActive > firstActive && Math.abs(pcm[lastActive]) < threshold) {
    lastActive--;
  }

  const cutStart = Math.max(0, firstActive - preMargin);
  const cutEnd = Math.min(n, Math.max(cutStart + minSamples, lastActive + 1 + postMargin));

  if (cutStart === 0 && cutEnd === n) {
    return {
      pcm,
      timings,
      durationSec: n / sampleRate,
    };
  }

  const outLen = cutEnd - cutStart;
  const trimmed = new Float32Array(outLen);
  trimmed.set(pcm.subarray(cutStart, cutEnd), 0);

  const fadeInLen = Math.min(Math.round(0.003 * sampleRate), Math.floor(outLen / 6));
  for (let i = 0; i < fadeInLen; i++) {
    const w = 0.5 * (1 - Math.cos((Math.PI * i) / Math.max(1, fadeInLen - 1)));
    trimmed[i] *= w;
  }

  const fadeOutLen = Math.min(Math.round(0.01 * sampleRate), Math.floor(outLen / 5));
  const fadeOutStart = outLen - fadeOutLen;
  for (let i = 0; i < fadeOutLen; i++) {
    const w = 0.5 * (1 + Math.cos((Math.PI * i) / Math.max(1, fadeOutLen - 1)));
    trimmed[fadeOutStart + i] *= w;
  }

  const trimmedLeadSec = cutStart / sampleRate;
  const newDurationSec = outLen / sampleRate;

  const shiftedTimings = timings.map((t) => {
    const s = Math.max(0, t.startSec - trimmedLeadSec);
    const e = Math.min(newDurationSec, Math.max(s + 0.032, t.endSec - trimmedLeadSec));
    return {
      ...t,
      startSec: s,
      endSec: e,
    };
  });

  return {
    pcm: trimmed,
    timings: shiftedTimings,
    durationSec: newDurationSec,
  };
}

interface CachedNeuralVerse {
  audioBuffer?: AudioBuffer;
  pcm48k?: Float32Array;
  resonantBuffers?: Partial<
    Record<
      NeuralResonanceVariant,
      {
        buffer: AudioBuffer;
        durationSec: number;
      }
    >
  >;
  timings: PlaybackSyllableTiming[];
  totalDurationSec: number;
  model: string;
}

class SanskritAudioEngine {
  private audioCtx: AudioContext | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private scheduledStreamingSources: Set<AudioBufferSourceNode> = new Set();
  private activeSingleSyllableSource: AudioBufferSourceNode | null = null;
  private singleSyllableRequestId = 0;
  private singleSyllableCache: Map<string, AudioBuffer> = new Map();
  private rafId: number | null = null;
  private abortController: AbortController | null = null;
  private prewarmAbortController: AbortController | null = null;
  private prewarmDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPrewarmSignature = '';
  private pendingPrewarmVerses: DharaniVerse[] = [];
  private droneGainNode: GainNode | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private neuralVerseCache: Map<string, CachedNeuralVerse> = new Map();
  private neuralInflightRequests: Map<string, Promise<CachedNeuralVerse>> = new Map();
  private exportedPcmCache: Map<
    string,
    {
      channels: Float32Array[];
      sampleRate: number;
      durationSec: number;
      model: string;
    }
  > = new Map();
  private pythonBackendAvailable = false;
  private hfCloudApiAvailable = true;
  private healthProbed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).sarvaAudioEngine = this;
      sendHfKeepAliveBeacon();
      this.probeBackendHealth();
    }
  }

  private state: PlaybackState = {
    isPlaying: false,
    isLoadingAudio: false,
    currentVerseIndex: null,
    currentSyllableIndex: null,
    currentSyllableInfo: null,
    currentSyllableClassicalZh: '',
    currentSyllableModernZh: '',
    syllableProgress: 0,
    verseProgress: 0,
    rate: 1.0,
    loopVerse: false,
    autoScroll: true,
    mode: 'neural-vits-48k',
    voice: 'male',
    omDroneActive: false,
    backendOnline: true,
    spriteCount: 612,
    activeModel: 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx',
  };

  private listeners: Set<StateListener> = new Set();

  private async probeBackendHealth() {
    const isLocalHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Always begin caching & compiling the ONNX neural model in the background Dedicated Worker
    // on first page entry, while using the Hugging Face Neural TTS API immediately until ONNX is ready!
    void warmupBrowserOnnxVits(this.state.voice).then((ok) => {
      if (ok && this.pendingPrewarmVerses.length > 0 && !this.state.isPlaying) {
        this.triggerPrewarmQueue(this.pendingPrewarmVerses, 3);
      }
    });

    const probeLocalPromise = (async () => {
      if (!isLocalHost && !TTS_API_BASE_URL) {
        return false;
      }
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 1400);
        let res: Response;
        try {
          res = await fetch(AUDIO_API_ENDPOINTS.health, { signal: ctrl.signal });
        } finally {
          clearTimeout(timeoutId);
        }
        const ct = res.headers?.get?.('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data?.status === 'ok') {
            if (typeof data?.spriteCount === 'number') {
              this.state.spriteCount = data.spriteCount;
            }
            return true;
          }
        }
      } catch {
        // Local FastAPI server not running
      }
      return false;
    })();

    const probeHfCloudPromise = (async () => {
      if (!HF_TTS_API_BASE_URL) {
        return false;
      }
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 8000);
        let res: Response;
        try {
          res = await fetch(HF_AUDIO_API_ENDPOINTS.health, {
            mode: 'cors',
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
        const ct = res.headers?.get?.('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          return data?.status === 'ok';
        }
      } catch {
        // Will retry HF API on demand if local ONNX is still downloading
      }
      return false;
    })();

    const [localOk, hfOk] = await Promise.all([probeLocalPromise, probeHfCloudPromise]);
    this.pythonBackendAvailable = localOk;
    this.hfCloudApiAvailable = hfOk;
    this.healthProbed = true;
    this.state.backendOnline = true;
    this.notify();

    if (this.pendingPrewarmVerses.length > 0 && !this.state.isPlaying) {
      this.triggerPrewarmQueue(this.pendingPrewarmVerses, 3);
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = { ...this.state };
    this.listeners.forEach((l) => l(snapshot));
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: SAMPLE_RATE });
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setRate(rate: number) {
    const nextRate = Math.max(0.5, Math.min(1.6, rate));
    if (Math.abs(nextRate - this.state.rate) > 1e-4) {
      this.state.rate = nextRate;
      this.lastPrewarmSignature = '';
      cancelLowPriorityBrowserOnnxTasks();
      this.notify();
      if (this.pendingPrewarmVerses.length > 0 && !this.state.isPlaying) {
        this.prewarmVerses(this.pendingPrewarmVerses, 3);
      }
    }
  }

  public setLoopVerse(loop: boolean) {
    this.state.loopVerse = loop;
    this.notify();
  }

  public setAutoScroll(autoScroll: boolean) {
    this.state.autoScroll = autoScroll;
    this.notify();
  }

  private formatActiveNeuralModelLabel(baseModel: string, mode: AudioEngineMode): string {
    if (mode === 'neural-resonance-hall') {
      return `${baseModel} + ${SA_FUNDAMENTAL_HZ}Hz 殿堂共鸣声场`;
    }
    if (mode === 'neural-vedic-chant') {
      return `${baseModel} + ${SA_FUNDAMENTAL_HZ}Hz 定调梵呗PSOLA`;
    }
    return baseModel;
  }

  public setMode(mode: AudioEngineMode) {
    this.stop();
    this.state.mode = mode;
    if (isNeuralEngineMode(mode)) {
      const baseModel =
        this.state.voice === 'female'
          ? 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa_female.onnx'
          : 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx';
      this.state.activeModel = this.formatActiveNeuralModelLabel(baseModel, mode);
      if (!this.pythonBackendAvailable) {
        void warmupBrowserOnnxVits(this.state.voice);
      }
      if (this.pendingPrewarmVerses.length > 0) {
        this.lastPrewarmSignature = '';
        this.prewarmVerses(this.pendingPrewarmVerses, 3);
      }
    } else if (mode === 'studio-vocal-chant') {
      this.state.activeModel = 'Rosenberg Sadja Formant + 612-Syllable Sprite';
    } else if (mode === 'mandarin-phonetic-guide') {
      this.state.activeModel = 'WebSpeech zh-CN 现代梵音拼读';
    } else {
      this.state.activeModel = 'WebSpeech sa-IN / hi-IN 天城文';
    }
    this.notify();
  }

  public setVoice(voice: SanskritVoiceGender) {
    const changed = this.state.voice !== voice;
    this.state.voice = voice;
    if (isNeuralEngineMode(this.state.mode)) {
      const baseModel =
        voice === 'female'
          ? 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa_female.onnx'
          : 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx';
      this.state.activeModel = this.formatActiveNeuralModelLabel(baseModel, this.state.mode);
      if (changed) {
        this.lastPrewarmSignature = '';
        cancelLowPriorityBrowserOnnxTasks();
      }
      if (!this.pythonBackendAvailable) {
        void warmupBrowserOnnxVits(voice).then((ok) => {
          if (ok && this.pendingPrewarmVerses.length > 0 && !this.state.isPlaying) {
            this.triggerPrewarmQueue(this.pendingPrewarmVerses, 3);
          }
        });
      }
      if (changed && this.pendingPrewarmVerses.length > 0 && !this.state.isPlaying) {
        this.prewarmVerses(this.pendingPrewarmVerses, 3);
      }
    }
    this.notify();
  }

  public getVoice(): SanskritVoiceGender {
    return this.state.voice;
  }

  public isOmDroneActive(): boolean {
    return this.state.omDroneActive;
  }

  /**
   * Toggle continuous Sadja (Om) + 204.15Hz Pa + 272.2Hz Sa' background resonance field
   */
  public toggleOmDrone(): boolean {
    if (this.state.omDroneActive) {
      this.stopOmDrone();
      return false;
    }
    const ctx = this.getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.8);
    masterGain.connect(ctx.destination);

    const freqs = [
      { hz: SA_FUNDAMENTAL_HZ, gain: 0.55, type: 'sine' as OscillatorType },
      { hz: SA_FUNDAMENTAL_HZ * 1.5, gain: 0.28, type: 'sine' as OscillatorType }, // 204.15 Hz Pa
      { hz: SA_FUNDAMENTAL_HZ * 2.0, gain: 0.17, type: 'triangle' as OscillatorType }, // 272.2 Hz Sa'
    ];

    const oscs: OscillatorNode[] = [];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = f.type;
      osc.frequency.setValueAtTime(f.hz, ctx.currentTime);
      g.gain.setValueAtTime(f.gain, ctx.currentTime);
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      oscs.push(osc);
    }

    this.droneGainNode = masterGain;
    this.droneOscillators = oscs;
    this.state.omDroneActive = true;
    this.notify();
    return true;
  }

  public stopOmDrone() {
    if (this.droneGainNode && this.audioCtx) {
      try {
        this.droneGainNode.gain.setValueAtTime(
          Math.max(0.001, this.droneGainNode.gain.value),
          this.audioCtx.currentTime
        );
        this.droneGainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          this.audioCtx.currentTime + 0.25
        );
      } catch {
        // ignore
      }
    }
    const oscsToStop = [...this.droneOscillators];
    setTimeout(() => {
      for (const osc of oscsToStop) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      }
    }, 260);
    this.droneOscillators = [];
    this.droneGainNode = null;
    this.state.omDroneActive = false;
    this.notify();
  }

  private stopSingleSyllableSource() {
    if (this.activeSingleSyllableSource) {
      try {
        this.activeSingleSyllableSource.stop();
        this.activeSingleSyllableSource.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.activeSingleSyllableSource = null;
    }
  }

  private playTrackedSingleSource(ctx: AudioContext, buffer: AudioBuffer) {
    this.stopSingleSyllableSource();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    this.activeSingleSyllableSource = src;
    src.onended = () => {
      if (this.activeSingleSyllableSource === src) {
        this.activeSingleSyllableSource = null;
      }
    };
    src.start();
  }

  private cacheSingleSyllableBuffer(key: string, buffer: AudioBuffer) {
    if (this.singleSyllableCache.size >= 256) {
      const oldest = this.singleSyllableCache.keys().next().value;
      if (oldest) this.singleSyllableCache.delete(oldest);
    }
    this.singleSyllableCache.set(key, buffer);
  }

  public stop() {
    this.singleSyllableRequestId++;
    this.stopSingleSyllableSource();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.activeSourceNode = null;
    }
    if (this.scheduledStreamingSources.size > 0) {
      for (const src of this.scheduledStreamingSources) {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      }
      this.scheduledStreamingSources.clear();
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.state.isPlaying = false;
    this.state.isLoadingAudio = false;
    this.state.currentVerseIndex = null;
    this.state.currentSyllableIndex = null;
    this.state.currentSyllableInfo = null;
    this.state.currentSyllableClassicalZh = '';
    this.state.currentSyllableModernZh = '';
    this.state.syllableProgress = 0;
    this.state.verseProgress = 0;
    this.notify();
  }

  private materializeAudioBuffer(ctx: AudioContext, entry: CachedNeuralVerse): AudioBuffer {
    if (entry.audioBuffer) {
      return entry.audioBuffer;
    }
    const pcm = entry.pcm48k || new Float32Array(480);
    const buf = ctx.createBuffer(1, Math.max(480, pcm.length), SAMPLE_RATE);
    buf.getChannelData(0).set(pcm);
    entry.audioBuffer = buf;
    entry.pcm48k = undefined;
    return buf;
  }

  private materializeVersePlaybackBuffer(
    ctx: AudioContext,
    entry: CachedNeuralVerse,
    options?: {
      isStreamingSegment?: boolean;
      segIndex?: number;
      segCount?: number;
    }
  ): { buffer: AudioBuffer; durationSec: number } {
    const dryBuf = this.materializeAudioBuffer(ctx, entry);
    const variant = getNeuralResonanceVariant(this.state.mode);
    if (!variant) {
      return { buffer: dryBuf, durationSec: entry.totalDurationSec };
    }

    const isStreamingSeg = Boolean(options?.isStreamingSegment);
    if (!isStreamingSeg && entry.resonantBuffers?.[variant]) {
      return entry.resonantBuffers[variant]!;
    }

    const dryPcm = dryBuf.getChannelData(0);
    const includeOpeningBell = isStreamingSeg ? (options?.segIndex ?? 0) === 0 : true;
    const isFinalSeg =
      !isStreamingSeg || (options?.segIndex ?? 0) >= Math.max(1, options?.segCount ?? 1) - 1;
    const tailSec = isFinalSeg ? 0.22 : 0;

    const rendered = renderNeuralResonanceStereoPcm(dryPcm, {
      sampleRate: SAMPLE_RATE,
      voice: this.state.voice,
      variant,
      timings: entry.timings,
      includeOpeningBell,
      tailSec,
    });

    const stereoBuf = ctx.createBuffer(2, Math.max(480, rendered.left.length), SAMPLE_RATE);
    stereoBuf.getChannelData(0).set(rendered.left);
    stereoBuf.getChannelData(1).set(rendered.right);

    const out = { buffer: stereoBuf, durationSec: rendered.durationSec };
    if (!isStreamingSeg) {
      if (!entry.resonantBuffers) {
        entry.resonantBuffers = {};
      }
      entry.resonantBuffers[variant] = out;
    }
    return out;
  }

  private renderSingleSyllableModeBuffer(
    ctx: AudioContext,
    dryBuf: AudioBuffer,
    syllables: SyllableAnalysis[]
  ): AudioBuffer {
    const variant = getNeuralResonanceVariant(this.state.mode);
    if (!variant) {
      return dryBuf;
    }
    const dryPcm = dryBuf.getChannelData(0);
    const timings = this.buildProportionalTimings(syllables, dryBuf.duration);
    const rendered = renderNeuralResonanceStereoPcm(dryPcm, {
      sampleRate: SAMPLE_RATE,
      voice: this.state.voice,
      variant,
      timings,
      includeOpeningBell: false,
      tailSec: 0.14,
    });
    const stereoBuf = ctx.createBuffer(2, Math.max(480, rendered.left.length), SAMPLE_RATE);
    stereoBuf.getChannelData(0).set(rendered.left);
    stereoBuf.getChannelData(1).set(rendered.right);
    return stereoBuf;
  }

  private decode16BitPcmWavToFloat32(wavBuf: ArrayBuffer): {
    pcm: Float32Array;
    sampleRate: number;
  } | null {
    if (wavBuf.byteLength < 44) return null;
    const view = new DataView(wavBuf);
    // 'RIFF' (0x46464952 LE) and 'WAVE' (0x45564157 LE)
    if (view.getUint32(0, true) !== 0x46464952 || view.getUint32(8, true) !== 0x45564157) {
      return null;
    }
    let offset = 12;
    let audioFormat = 0;
    let numChannels = 1;
    let sampleRate = SAMPLE_RATE;
    let bitsPerSample = 16;
    let dataOffset = -1;
    let dataByteLength = 0;

    while (offset + 8 <= wavBuf.byteLength) {
      const chunkId = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 0x20746d66 && offset + 24 <= wavBuf.byteLength) {
        // 'fmt '
        audioFormat = view.getUint16(offset + 8, true);
        numChannels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      } else if (chunkId === 0x61746164) {
        // 'data'
        dataOffset = offset + 8;
        dataByteLength = Math.min(chunkSize, wavBuf.byteLength - dataOffset);
        break;
      }
      offset += 8 + chunkSize + (chunkSize & 1);
    }

    if (
      audioFormat !== 1 ||
      bitsPerSample !== 16 ||
      numChannels < 1 ||
      sampleRate !== SAMPLE_RATE ||
      dataOffset < 0 ||
      dataByteLength < 2
    ) {
      return null;
    }

    const bytesPerFrame = numChannels * 2;
    const numFrames = Math.floor(dataByteLength / bytesPerFrame);
    const pcm = new Float32Array(numFrames);
    const inv = 1 / 32768;
    let bytePtr = dataOffset;
    if (numChannels === 1) {
      for (let i = 0; i < numFrames; i++) {
        pcm[i] = view.getInt16(bytePtr, true) * inv;
        bytePtr += 2;
      }
    } else {
      const chInv = inv / numChannels;
      for (let i = 0; i < numFrames; i++) {
        let sum = 0;
        for (let c = 0; c < numChannels; c++) {
          sum += view.getInt16(bytePtr, true);
          bytePtr += 2;
        }
        pcm[i] = sum * chInv;
      }
    }
    return { pcm, sampleRate };
  }

  /**
   * Proactively pre-synthesizes the first `maxCount` verses of the currently displayed Dhāraṇī
   * in the background Worker (without touching AudioContext prior to user gesture) so clicking
   * "Start" begins playback in < 5ms with zero cold-synthesis lag.
   */
  public prewarmVerses(verses: DharaniVerse[], maxCount = 3) {
    this.pendingPrewarmVerses = verses;
    if (
      typeof window === 'undefined' ||
      !isNeuralEngineMode(this.state.mode) ||
      this.state.isPlaying ||
      verses.length === 0
    ) {
      return;
    }

    if (this.prewarmDebounceTimer) {
      clearTimeout(this.prewarmDebounceTimer);
    }
    this.prewarmDebounceTimer = setTimeout(() => {
      this.prewarmDebounceTimer = null;
      if (!this.state.isPlaying && isNeuralEngineMode(this.state.mode)) {
        this.triggerPrewarmQueue(verses, maxCount);
      }
    }, 65);
  }

  /**
   * Pre-synthesizes an individual verse (e.g. on button hover/focus) for instant single-verse start.
   * Uses local Worker ONNX when ready, or Hugging Face Neural TTS API while ONNX is caching in background.
   */
  public prewarmSingleVerse(verse: DharaniVerse) {
    if (
      typeof window === 'undefined' ||
      !isNeuralEngineMode(this.state.mode) ||
      (!this.pythonBackendAvailable &&
        !this.hfCloudApiAvailable &&
        !isBrowserOnnxReady(this.state.voice))
    ) {
      return;
    }
    const cacheKey = `${verse.iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
    if (this.neuralVerseCache.has(cacheKey) || this.neuralInflightRequests.has(cacheKey)) {
      return;
    }
    const syls = analyzeSanskritProsody(verse.iast);
    if (syls.length === 0) return;
    void this.fetchNeuralVitsVerseBuffer(this.audioCtx, verse.iast, syls, undefined, 'low').catch(
      () => {}
    );
  }

  private triggerPrewarmQueue(verses: DharaniVerse[], maxCount: number) {
    const onnxReady = isBrowserOnnxReady(this.state.voice);
    if (!this.pythonBackendAvailable && !onnxReady) {
      // Ensure background ONNX model download & CacheStorage population is running
      void warmupBrowserOnnxVits(this.state.voice).then((ok) => {
        if (ok && !this.state.isPlaying && this.pendingPrewarmVerses === verses) {
          this.triggerPrewarmQueue(verses, maxCount);
        }
      });
      if (!this.hfCloudApiAvailable) {
        return;
      }
    }

    // While local ONNX is still caching on first visit, prewarm first 2 verses via HF Neural API;
    // once local ONNX is ready (or local FastAPI is active), prewarm full maxCount verses.
    const effectiveCount =
      this.pythonBackendAvailable || onnxReady ? maxCount : Math.min(maxCount, 2);
    const slice = verses.slice(0, effectiveCount);
    if (slice.length === 0) return;

    const sig = `${slice.map((v) => v.iast.trim()).join('||')}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
    if (sig === this.lastPrewarmSignature) {
      return;
    }
    this.lastPrewarmSignature = sig;

    if (this.prewarmAbortController) {
      this.prewarmAbortController.abort();
    }
    cancelLowPriorityBrowserOnnxTasks();

    const ctrl = new AbortController();
    this.prewarmAbortController = ctrl;

    void (async () => {
      for (const v of slice) {
        if (ctrl.signal.aborted || this.state.isPlaying) break;
        const key = `${v.iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
        if (this.neuralVerseCache.has(key)) continue;
        const syls = analyzeSanskritProsody(v.iast);
        if (syls.length === 0) continue;
        try {
          const entry = await this.fetchNeuralVitsVerseBuffer(
            this.audioCtx,
            v.iast,
            syls,
            ctrl.signal,
            'low'
          );
          if (!this.state.isPlaying && entry.model) {
            this.state.activeModel = entry.model;
          }
        } catch {
          if (ctrl.signal.aborted) break;
        }
      }
    })();
  }

  private getOrderedNeuralApiEndpoints(): Array<{
    tts: string;
    syllable: string;
    isLocal: boolean;
  }> {
    const list: Array<{ tts: string; syllable: string; isLocal: boolean }> = [];
    if (this.pythonBackendAvailable) {
      list.push({
        tts: AUDIO_API_ENDPOINTS.tts,
        syllable: AUDIO_API_ENDPOINTS.syllable,
        isLocal: true,
      });
    }
    if (HF_TTS_API_BASE_URL && HF_AUDIO_API_ENDPOINTS.tts !== AUDIO_API_ENDPOINTS.tts) {
      list.push({
        tts: HF_AUDIO_API_ENDPOINTS.tts,
        syllable: HF_AUDIO_API_ENDPOINTS.syllable,
        isLocal: false,
      });
    }
    return list;
  }

  private async requestNeuralTtsJsonFromApi(
    text: string,
    voice: SanskritVoiceGender,
    rate: number,
    signal?: AbortSignal,
    timeoutMs = 22_000
  ): Promise<Record<string, unknown> | null> {
    const endpoints = this.getOrderedNeuralApiEndpoints();
    for (const ep of endpoints) {
      const reqCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const onOuterAbort = () => reqCtrl?.abort();
      if (signal && reqCtrl) {
        if (signal.aborted) {
          reqCtrl.abort();
        } else {
          signal.addEventListener('abort', onOuterAbort, { once: true });
        }
      }
      const timeoutId =
        reqCtrl && timeoutMs > 0
          ? setTimeout(() => {
              reqCtrl.abort();
            }, timeoutMs)
          : null;

      try {
        const res = await fetch(ep.tts, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            script: 'auto',
            voice,
            rate,
            response_format: 'json',
          }),
          signal: reqCtrl ? reqCtrl.signal : signal,
        });
        const ct = res.headers?.get?.('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const json = (await res.json()) as Record<string, unknown>;
          if (typeof json.audioBase64Wav === 'string' && json.audioBase64Wav.length > 100) {
            if (!ep.isLocal) {
              this.hfCloudApiAvailable = true;
            }
            return json;
          }
        }
        if (ep.isLocal) {
          this.pythonBackendAvailable = false;
        }
      } catch (err) {
        if (signal?.aborted) throw err;
        if (ep.isLocal) {
          this.pythonBackendAvailable = false;
        } else {
          this.hfCloudApiAvailable = false;
        }
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        if (signal && reqCtrl) {
          signal.removeEventListener('abort', onOuterAbort);
        }
      }
    }
    return null;
  }

  private async requestNeuralSyllableBufferFromApi(
    ctx: AudioContext,
    sylIast: string,
    voice: SanskritVoiceGender,
    rate: number
  ): Promise<{ buffer: AudioBuffer; model: string } | null> {
    const endpoints = this.getOrderedNeuralApiEndpoints();
    for (const ep of endpoints) {
      try {
        const url = `${ep.syllable}${encodeURIComponent(sylIast)}?voice=${voice}&rate=${rate}&format=wav`;
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) {
          if (ep.isLocal) this.pythonBackendAvailable = false;
          continue;
        }
        const ct = res.headers?.get?.('content-type') || '';
        let wavArr: ArrayBuffer | null = null;
        let apiModel =
          voice === 'female'
            ? 'gnumanth/ninada:onnx/sa_female.onnx'
            : 'gnumanth/ninada:onnx/sa.onnx';

        if (ct.includes('audio')) {
          wavArr = await res.arrayBuffer();
        } else if (ct.includes('application/json')) {
          const json = (await res.json()) as Record<string, unknown>;
          if (typeof json.audioBase64Wav === 'string' && json.audioBase64Wav.length > 64) {
            wavArr = this.base64ToArrayBuffer(json.audioBase64Wav);
            if (typeof json.model === 'string' && json.model) {
              apiModel = json.model;
            }
          }
        }

        if (wavArr && wavArr.byteLength > 44) {
          if (!ep.isLocal) {
            this.hfCloudApiAvailable = true;
          }
          const fastWav = this.decode16BitPcmWavToFloat32(wavArr);
          if (fastWav) {
            const trimmed = trimSilenceAndShiftTimings(fastWav.pcm, SAMPLE_RATE, []);
            const outBuf = ctx.createBuffer(
              1,
              Math.max(480, trimmed.pcm.length),
              SAMPLE_RATE
            );
            outBuf.getChannelData(0).set(trimmed.pcm);
            return { buffer: outBuf, model: apiModel };
          }
          const decoded = await ctx.decodeAudioData(wavArr.slice(0));
          return { buffer: decoded, model: apiModel };
        }
      } catch {
        if (ep.isLocal) {
          this.pythonBackendAvailable = false;
        } else {
          this.hfCloudApiAvailable = false;
        }
      }
    }
    return null;
  }

  /**
   * Play a single Sanskrit syllable or word with 48,000 Hz Neural VITS (`sa.onnx` / `sa_female.onnx`).
   * In `'neural-vits-48k'` mode:
   * - Uses Hugging Face Neural TTS API immediately on first visit while local ONNX caches in background.
   * - Uses cached Dedicated Worker ONNX once ready.
   * - Never falls back to non-neural formant synthesis.
   */
  public async playSingleSyllable(iastSyllable: string) {
    const cleanText = (iastSyllable || '').trim();
    if (!cleanText) return;

    const reqId = ++this.singleSyllableRequestId;
    this.stopSingleSyllableSource();

    const prosody = analyzeSanskritProsody(cleanText);
    const syl =
      prosody[0] || {
        index: 1,
        iast: cleanText,
        devanagari: iastToDevanagari(cleanText),
        siddham: '',
        ipa: '',
        vowel: 'a',
        weight: 'guru' as const,
        matraCount: 2 as const,
        weightReasonZh: '',
        features: [],
        formantHz: { f1: 680, f2: 1220 },
      };

    if (this.state.mode === 'mandarin-phonetic-guide') {
      const enriched = enrichSyllablesWithPhonetics(prosody);
      const spokenZh =
        enriched.length > 0
          ? enriched.map((s) => s.modernZh).join('')
          : mapSyllableToChinesePhonetics(syl.iast).modernZh;
      this.speakUtteranceOnce(spokenZh.replace(/—/g, ''), 'zh-CN');
      return;
    }

    if (this.state.mode === 'indic-devanagari-tts' && this.hasIndicVoice()) {
      this.speakUtteranceOnce(
        prosody.length > 1 ? iastToDevanagari(cleanText) : syl.devanagari,
        'hi-IN'
      );
      return;
    }

    const ctx = this.getAudioContext();
    const voice = this.state.voice;
    const rate = this.state.rate;

    if (isNeuralEngineMode(this.state.mode)) {
      const targetSyllaList = prosody.length > 0 ? prosody : [syl];
      const dryKey = `${cleanText}|${voice}|${rate.toFixed(2)}|dry`;
      const singleKey = `${cleanText}|${voice}|${rate.toFixed(2)}|${this.state.mode}`;
      const cachedBuf = this.singleSyllableCache.get(singleKey);
      if (cachedBuf) {
        this.playTrackedSingleSource(ctx, cachedBuf);
        return;
      }

      const cachedDryBuf = this.singleSyllableCache.get(dryKey);
      if (cachedDryBuf) {
        const modeBuf = this.renderSingleSyllableModeBuffer(ctx, cachedDryBuf, targetSyllaList);
        this.cacheSingleSyllableBuffer(singleKey, modeBuf);
        this.playTrackedSingleSource(ctx, modeBuf);
        return;
      }

      const onnxReadyNow = isBrowserOnnxReady(voice);
      if (!onnxReadyNow && !this.pythonBackendAvailable) {
        void warmupBrowserOnnxVits(voice);
      }

      let showedLoading = false;
      if (!onnxReadyNow && !this.state.isPlaying) {
        showedLoading = true;
        this.state.isLoadingAudio = true;
        this.notify();
      }

      try {
        // Multi-syllable word/phrase: delegate to fetchNeuralVitsVerseBuffer (HF API first if !onnxReady, Worker ONNX if ready)
        if (prosody.length > 1) {
          const neural = await this.fetchNeuralVitsVerseBuffer(ctx, cleanText, prosody);
          if (reqId !== this.singleSyllableRequestId) return;
          this.state.activeModel = this.formatActiveNeuralModelLabel(neural.model, this.state.mode);
          const dryBuf = this.materializeAudioBuffer(ctx, neural);
          this.cacheSingleSyllableBuffer(dryKey, dryBuf);
          const modeBuf = this.renderSingleSyllableModeBuffer(ctx, dryBuf, targetSyllaList);
          this.cacheSingleSyllableBuffer(singleKey, modeBuf);
          this.playTrackedSingleSource(ctx, modeBuf);
          return;
        }

        const preferApi = this.pythonBackendAvailable || !onnxReadyNow;
        if (preferApi) {
          const apiOut = await this.requestNeuralSyllableBufferFromApi(ctx, syl.iast, voice, rate);
          if (apiOut) {
            if (reqId !== this.singleSyllableRequestId) return;
            this.state.activeModel = this.formatActiveNeuralModelLabel(
              apiOut.model,
              this.state.mode
            );
            this.cacheSingleSyllableBuffer(dryKey, apiOut.buffer);
            const modeBuf = this.renderSingleSyllableModeBuffer(ctx, apiOut.buffer, targetSyllaList);
            this.cacheSingleSyllableBuffer(singleKey, modeBuf);
            this.playTrackedSingleSource(ctx, modeBuf);
            return;
          }
        }

        const wasmOut = await synthesizeWithBrowserOnnxVits(
          ctx,
          cleanText,
          voice,
          rate,
          true,
          'high'
        );
        if (reqId !== this.singleSyllableRequestId) return;
        this.state.activeModel = this.formatActiveNeuralModelLabel(wasmOut.model, this.state.mode);
        const trimmedSingle = trimSilenceAndShiftTimings(wasmOut.pcm48k, SAMPLE_RATE, []);
        const outBuf = ctx.createBuffer(
          1,
          Math.max(480, trimmedSingle.pcm.length),
          SAMPLE_RATE
        );
        outBuf.getChannelData(0).set(trimmedSingle.pcm);
        this.cacheSingleSyllableBuffer(dryKey, outBuf);
        const modeBuf = this.renderSingleSyllableModeBuffer(ctx, outBuf, targetSyllaList);
        this.cacheSingleSyllableBuffer(singleKey, modeBuf);
        this.playTrackedSingleSource(ctx, modeBuf);
        return;
      } catch {
        // If local ONNX failed unexpectedly, attempt cloud HF Neural API before giving up
        try {
          const backupApi = await this.requestNeuralSyllableBufferFromApi(
            ctx,
            syl.iast,
            voice,
            rate
          );
          if (backupApi && reqId === this.singleSyllableRequestId) {
            this.state.activeModel = this.formatActiveNeuralModelLabel(
              backupApi.model,
              this.state.mode
            );
            this.cacheSingleSyllableBuffer(dryKey, backupApi.buffer);
            const modeBuf = this.renderSingleSyllableModeBuffer(
              ctx,
              backupApi.buffer,
              targetSyllaList
            );
            this.cacheSingleSyllableBuffer(singleKey, modeBuf);
            this.playTrackedSingleSource(ctx, modeBuf);
          }
        } catch {
          // Do not fall back to non-neural formant synthesizer in neural modes
        }
      } finally {
        if (showedLoading && !this.state.isPlaying) {
          this.state.isLoadingAudio = false;
          this.notify();
        }
      }
      return;
    }

    if (reqId !== this.singleSyllableRequestId) return;
    const { audioBuffer } = this.synthesizeContinuousVerseBuffer(
      ctx,
      prosody.length > 0 ? prosody : [syl],
      1.0,
      false
    );
    this.playTrackedSingleSource(ctx, audioBuffer);
  }

  /**
   * Play a sequence of verses with hardware-clock synchronized syllable tracking
   */
  public async playVerses(
    verses: DharaniVerse[],
    startVerseArrayIdx = 0,
    singleVerseOnly = false
  ) {
    this.stop();
    if (this.prewarmDebounceTimer) {
      clearTimeout(this.prewarmDebounceTimer);
      this.prewarmDebounceTimer = null;
    }
    if (this.prewarmAbortController) {
      this.prewarmAbortController.abort();
      this.prewarmAbortController = null;
    }

    const firstTarget = verses[startVerseArrayIdx];
    if (firstTarget && isNeuralEngineMode(this.state.mode)) {
      const firstKey = `${firstTarget.iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
      if (!this.neuralVerseCache.has(firstKey) && !this.neuralInflightRequests.has(firstKey)) {
        cancelLowPriorityBrowserOnnxTasks();
      }
    }

    const controller = new AbortController();
    this.abortController = controller;
    this.state.isPlaying = true;
    this.notify();

    try {
      let idx = startVerseArrayIdx;
      while (idx < verses.length && !controller.signal.aborted) {
        const verse = verses[idx];
        this.state.currentVerseIndex = verse.index;
        this.state.verseProgress = 0;
        this.notify();

        const upcomingVerses = !singleVerseOnly ? verses.slice(idx + 1, idx + 5) : [];

        if (this.state.mode === 'mandarin-phonetic-guide') {
          await this.playVerseSpeechSynced(verse, 'zh-CN', controller.signal);
        } else if (this.state.mode === 'indic-devanagari-tts') {
          await this.playVerseSpeechSynced(verse, 'hi-IN', controller.signal);
        } else if (isNeuralEngineMode(this.state.mode)) {
          await this.playVerseNeuralVitsBuffer(verse, controller.signal, upcomingVerses);
        } else {
          await this.playVerseHardwareBuffer(verse, controller.signal);
        }

        if (controller.signal.aborted) break;

        if (this.state.loopVerse) {
          await this.sleep(Math.round(130 / this.state.rate), controller.signal);
          continue;
        }
        if (singleVerseOnly) {
          break;
        }

        if (idx + 1 < verses.length) {
          if (isNeuralEngineMode(this.state.mode)) {
            const nextKey = `${verses[idx + 1].iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
            if (this.neuralVerseCache.has(nextKey)) {
              // Crisp 32ms natural breath articulation between cached verses (zero sluggish pause)
              await this.sleep(Math.max(18, Math.round(32 / this.state.rate)), controller.signal);
            }
          } else {
            await this.sleep(Math.max(25, Math.round(55 / this.state.rate)), controller.signal);
          }
        }
        idx++;
      }
    } catch {
      // Aborted
    } finally {
      if (this.abortController === controller) {
        this.stop();
      }
    }
  }

  private base64ToArrayBuffer(b64: string): ArrayBuffer {
    const binary = window.atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private buildProportionalTimings(
    syllables: SyllableAnalysis[],
    totalDurationSec: number,
    chunkSpans?: AcousticChunkSpan[]
  ): PlaybackSyllableTiming[] {
    if (syllables.length === 0) return [];
    const enriched = enrichSyllablesWithPhonetics(syllables);

    // If per-word or per-chunk acoustic spans are available from Browser ONNX VITS durations,
    // lock syllables directly onto their exact spoken windows [speechStartSec, speechEndSec].
    if (chunkSpans && chunkSpans.length > 0) {
      // 1. Exact 1-to-1 word-group alignment when chunkSpans matches prosody word/subword groups
      const wordGroups: Array<typeof enriched> = [];
      let lastGroupKey = '';
      for (const s of enriched) {
        const key =
          s.wordIndex !== undefined
            ? `${s.wordIndex}:${s.subwordIndex ?? 0}`
            : `syl:${s.index}`;
        if (wordGroups.length === 0 || key !== lastGroupKey) {
          wordGroups.push([s]);
          lastGroupKey = key;
        } else {
          wordGroups[wordGroups.length - 1].push(s);
        }
      }

      if (wordGroups.length === chunkSpans.length) {
        const exactTimings: PlaybackSyllableTiming[] = [];
        for (let gIdx = 0; gIdx < wordGroups.length; gIdx++) {
          const group = wordGroups[gIdx];
          const span = chunkSpans[gIdx];
          const groupMatras =
            group.reduce((acc, s) => acc + (s.weight === 'guru' ? 1.75 : 1.0), 0) || 1;
          const activeSpanSec = Math.max(0.045, span.speechEndSec - span.speechStartSec);
          let cursor = span.speechStartSec;
          for (const syl of group) {
            const w = syl.weight === 'guru' ? 1.75 : 1.0;
            const dur = (w / groupMatras) * activeSpanSec;
            exactTimings.push({
              syl,
              classicalZh: syl.classicalZh,
              modernZh: syl.modernZh,
              startSec: cursor,
              endSec: cursor + dur,
            });
            cursor += dur;
          }
        }
        if (exactTimings.length === enriched.length) {
          return exactTimings;
        }
      }

      // 2. Proportional alignment across chunkSpans when counts differ slightly
      const timings: PlaybackSyllableTiming[] = [];
      const totalChars = chunkSpans.reduce((acc, c) => acc + Math.max(1, c.charCount), 0) || 1;
      let sylCursor = 0;

      for (let cIdx = 0; cIdx < chunkSpans.length; cIdx++) {
        const span = chunkSpans[cIdx];
        const isLast = cIdx === chunkSpans.length - 1;
        const targetCount = isLast
          ? enriched.length - sylCursor
          : Math.max(
              1,
              Math.min(
                enriched.length - sylCursor - (chunkSpans.length - 1 - cIdx),
                Math.round((span.charCount / totalChars) * enriched.length)
              )
            );
        const chunkSyls = enriched.slice(sylCursor, sylCursor + Math.max(0, targetCount));
        sylCursor += chunkSyls.length;

        if (chunkSyls.length === 0) continue;

        const chunkMatras =
          chunkSyls.reduce((acc, s) => acc + (s.weight === 'guru' ? 1.75 : 1.0), 0) || 1;
        const activeSpanSec = Math.max(0.06, span.speechEndSec - span.speechStartSec);
        let cursor = span.speechStartSec;

        for (const syl of chunkSyls) {
          const w = syl.weight === 'guru' ? 1.75 : 1.0;
          const dur = (w / chunkMatras) * activeSpanSec;
          timings.push({
            syl,
            classicalZh: syl.classicalZh,
            modernZh: syl.modernZh,
            startSec: cursor,
            endSec: cursor + dur,
          });
          cursor += dur;
        }
      }

      if (timings.length === enriched.length) {
        return timings;
      }
    }

    const timings: PlaybackSyllableTiming[] = [];
    const leadSec = Math.min(0.05, totalDurationSec * 0.04);
    const tailSec = Math.min(0.08, totalDurationSec * 0.06);
    const activeDurationSec = Math.max(0.1, totalDurationSec - leadSec - tailSec);
    const totalMatras =
      enriched.reduce((acc, s) => acc + (s.weight === 'guru' ? 1.75 : 1.0), 0) || 1;
    let cursor = leadSec;
    for (const syl of enriched) {
      const w = syl.weight === 'guru' ? 1.75 : 1.0;
      const dur = (w / totalMatras) * activeDurationSec;
      timings.push({
        syl,
        classicalZh: syl.classicalZh,
        modernZh: syl.modernZh,
        startSec: cursor,
        endSec: cursor + dur,
      });
      cursor += dur;
    }
    return timings;
  }

  /**
   * Splits an uncached multi-word verse into a fast 1–2 word initial micro-segment (~120ms synthesis)
   * followed by balanced breath-segments so audio starts virtually instantaneously while the Worker
   * synthesizes the rest of the verse in the background.
   */
  private splitVerseIntoStreamingSegments(
    iastText: string,
    syllables: SyllableAnalysis[]
  ): Array<{ text: string; syllables: SyllableAnalysis[] }> {
    if (syllables.length <= 5 || iastText.trim().length <= 24) {
      return [{ text: iastText.trim(), syllables }];
    }

    const tokens = iastText.trim().split(/\s+/).filter(Boolean);
    if (tokens.length <= 2) {
      return [{ text: iastText.trim(), syllables }];
    }

    const segments: Array<{ text: string; syllables: SyllableAnalysis[] }> = [];
    let curWords: string[] = [];
    let curSylCount = 0;
    let sylCursor = 0;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const tokSylLen = analyzeSanskritProsody(tok).length;
      const isFirstSegment = segments.length === 0;
      const maxWords = isFirstSegment ? 2 : 4;
      const maxSyls = isFirstSegment ? 5 : 10;

      if (
        curWords.length >= maxWords ||
        (curWords.length > 0 && curSylCount + tokSylLen > maxSyls)
      ) {
        const segSyls = syllables.slice(sylCursor, sylCursor + curSylCount);
        if (segSyls.length > 0) {
          segments.push({
            text: curWords.join(' '),
            syllables: segSyls,
          });
          sylCursor += segSyls.length;
        }
        curWords = [tok];
        curSylCount = tokSylLen;
      } else {
        curWords.push(tok);
        curSylCount += tokSylLen;
      }
    }

    if (curWords.length > 0 || sylCursor < syllables.length) {
      const remainingSyls = syllables.slice(sylCursor);
      if (remainingSyls.length > 0) {
        segments.push({
          text: curWords.join(' ') || remainingSyls.map((s) => s.iast).join(' '),
          syllables: remainingSyls,
        });
      } else if (segments.length > 0 && curWords.length > 0) {
        segments[segments.length - 1].text += ' ' + curWords.join(' ');
      }
    }

    return segments.length > 0 ? segments : [{ text: iastText.trim(), syllables }];
  }

  /**
   * Fetches and decodes 48,000 Hz Native Classical Sanskrit Neural VITS audio (`sa.onnx` / `sa_female.onnx`):
   * - On first visit while local Browser ONNX is still caching in the background (`!isBrowserOnnxReady`),
   *   fetches immediately from the Hugging Face Neural TTS API (`POST /api/tts`).
   * - Once local Browser ONNX is cached and ready (`isBrowserOnnxReady`), synthesizes locally in the
   *   Dedicated Web Worker with 0ms network latency (falling over to HF Neural API only if Worker throws).
   */
  private async fetchNeuralVitsVerseBuffer(
    ctx: AudioContext | null,
    iastText: string,
    syllables: SyllableAnalysis[],
    signal?: AbortSignal,
    priority: 'high' | 'low' = 'high',
    rateOverride?: number
  ): Promise<CachedNeuralVerse> {
    const voice = this.state.voice;
    const rate = typeof rateOverride === 'number' && rateOverride > 0 ? rateOverride : this.state.rate;
    const cacheKey = `${iastText.trim()}|${voice}|${rate.toFixed(2)}`;

    const cached = this.neuralVerseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const inflight = this.neuralInflightRequests.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const promise = (async (): Promise<CachedNeuralVerse> => {
      const onnxReadyNow = isBrowserOnnxReady(voice);
      if (!onnxReadyNow && !this.pythonBackendAvailable) {
        void warmupBrowserOnnxVits(voice);
      }

      let data: Record<string, unknown> | null = null;
      let rawPcm48k: Float32Array | null = null;
      let decodedBuffer: AudioBuffer | undefined;
      let rawDurationSec = 0;
      let serverTimings: Array<{ index: number; startMs: number; endMs: number }> = [];
      let wasmChunkSpans: AcousticChunkSpan[] | undefined;
      let modelOverride: string | null = null;

      const preferApiFirst = this.pythonBackendAvailable || !onnxReadyNow;
      if (preferApiFirst) {
        data = await this.requestNeuralTtsJsonFromApi(iastText, voice, rate, signal);
      }

      if (!data) {
        try {
          const wasmRes = await synthesizePcmWithBrowserOnnxVits(
            iastText,
            voice,
            rate,
            syllables.length <= 1,
            priority,
            signal
          );
          rawPcm48k = wasmRes.pcm48k;
          rawDurationSec = wasmRes.durationSec;
          modelOverride = wasmRes.model;
          wasmChunkSpans = wasmRes.chunkSpans;
        } catch (wasmErr) {
          if (signal?.aborted) throw wasmErr;
          // If local Worker ONNX threw while ready, fall over to Hugging Face Neural API
          if (!preferApiFirst) {
            data = await this.requestNeuralTtsJsonFromApi(iastText, voice, rate, signal);
          }
          if (!data) {
            throw wasmErr;
          }
        }
      }

      if (data) {
        const b64 = String(data.audioBase64Wav || '');
        const wavArrayBuffer = this.base64ToArrayBuffer(b64);
        const fastWav = this.decode16BitPcmWavToFloat32(wavArrayBuffer);
        if (fastWav) {
          rawPcm48k = fastWav.pcm;
          rawDurationSec = rawPcm48k.length / SAMPLE_RATE;
        } else {
          const targetCtx = ctx || this.getAudioContext();
          decodedBuffer = await targetCtx.decodeAudioData(wavArrayBuffer.slice(0));
          rawDurationSec = decodedBuffer.duration || Number(data.durationSec) || 1.0;
          if (decodedBuffer.sampleRate === SAMPLE_RATE && decodedBuffer.numberOfChannels >= 1) {
            rawPcm48k = new Float32Array(decodedBuffer.getChannelData(0));
            decodedBuffer = undefined;
          }
        }
        if (Array.isArray(data.syllableTimings)) {
          serverTimings = data.syllableTimings as Array<{
            index: number;
            startMs: number;
            endMs: number;
          }>;
        }
      }

      let timings: PlaybackSyllableTiming[] = [];
      const enriched = enrichSyllablesWithPhonetics(syllables);

      if (serverTimings.length === enriched.length && enriched.length > 0) {
        for (let i = 0; i < enriched.length; i++) {
          const syl = enriched[i];
          const st = serverTimings[i];
          timings.push({
            syl,
            classicalZh: syl.classicalZh,
            modernZh: syl.modernZh,
            startSec: Math.max(0, (st.startMs || 0) / 1000),
            endSec: Math.min(rawDurationSec, Math.max(0.04, (st.endMs || 100) / 1000)),
          });
        }
      } else if (serverTimings.length > 0 && enriched.length > 0) {
        const firstStartSec = Math.max(0, (serverTimings[0].startMs || 0) / 1000);
        const lastEndSec = Math.min(
          rawDurationSec,
          Math.max(
            firstStartSec + 0.1,
            (serverTimings[serverTimings.length - 1].endMs || rawDurationSec * 1000) / 1000
          )
        );
        const activeSpanSec = Math.max(0.15, lastEndSec - firstStartSec);
        const totalMatras = enriched.reduce(
          (acc, s) => acc + (s.weight === 'guru' ? 1.85 : 1.0),
          0
        );

        let cursor = firstStartSec;
        for (let i = 0; i < enriched.length; i++) {
          const syl = enriched[i];
          const w = syl.weight === 'guru' ? 1.85 : 1.0;
          const dur = (w / totalMatras) * activeSpanSec;
          timings.push({
            syl,
            classicalZh: syl.classicalZh,
            modernZh: syl.modernZh,
            startSec: cursor,
            endSec: cursor + dur,
          });
          cursor += dur;
        }
      } else {
        timings = this.buildProportionalTimings(syllables, rawDurationSec, wasmChunkSpans);
      }

      let finalPcm48k = rawPcm48k;
      let totalDurationSec = rawDurationSec;

      if (finalPcm48k) {
        const trimmed = trimSilenceAndShiftTimings(finalPcm48k, SAMPLE_RATE, timings);
        finalPcm48k = trimmed.pcm;
        timings = trimmed.timings;
        totalDurationSec = trimmed.durationSec;
      }

      let audioBuffer = decodedBuffer;
      if (!audioBuffer && ctx && finalPcm48k) {
        audioBuffer = ctx.createBuffer(1, Math.max(480, finalPcm48k.length), SAMPLE_RATE);
        audioBuffer.getChannelData(0).set(finalPcm48k);
        finalPcm48k = null;
      }

      const modelStr = String(
        data?.model ||
          modelOverride ||
          (voice === 'female'
            ? 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa_female.onnx'
            : 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx')
      );

      const entry: CachedNeuralVerse = {
        audioBuffer,
        pcm48k: finalPcm48k || undefined,
        timings,
        totalDurationSec,
        model: modelStr,
      };

      this.storeInNeuralVerseCache(cacheKey, entry);
      return entry;
    })();

    this.neuralInflightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.neuralInflightRequests.delete(cacheKey);
    }
  }

  private storeInNeuralVerseCache(cacheKey: string, entry: CachedNeuralVerse) {
    if (this.neuralVerseCache.size >= 120) {
      const oldestKey = this.neuralVerseCache.keys().next().value;
      if (oldestKey) this.neuralVerseCache.delete(oldestKey);
    }
    this.neuralVerseCache.set(cacheKey, entry);
  }

  /**
   * Sliding-window lookahead prefetch across Local Worker ONNX, Local FastAPI, and Hugging Face Neural TTS API!
   * Upcoming verses finish synthesizing well before the current verse ends, guaranteeing 0ms inter-verse wait.
   */
  private prefetchUpcomingVerses(upcomingVerses: DharaniVerse[], signal?: AbortSignal) {
    if (!upcomingVerses || upcomingVerses.length === 0 || signal?.aborted) return;
    if (
      !this.pythonBackendAvailable &&
      !this.hfCloudApiAvailable &&
      !isBrowserOnnxReady(this.state.voice)
    ) {
      return;
    }

    const targets =
      this.pythonBackendAvailable || isBrowserOnnxReady(this.state.voice)
        ? upcomingVerses
        : upcomingVerses.slice(0, 2);

    void (async () => {
      for (const nextVerse of targets) {
        if (signal?.aborted || !this.state.isPlaying) break;
        const fullKey = `${nextVerse.iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
        if (this.neuralVerseCache.has(fullKey) || this.neuralInflightRequests.has(fullKey)) {
          continue;
        }
        const nextSyls = analyzeSanskritProsody(nextVerse.iast);
        if (nextSyls.length === 0) continue;
        try {
          await this.fetchNeuralVitsVerseBuffer(
            this.audioCtx,
            nextVerse.iast,
            nextSyls,
            signal,
            'low'
          );
        } catch {
          if (signal?.aborted) break;
        }
      }
    })();
  }

  /**
   * Plays an uncached multi-word verse via First-Clause Instant Streaming:
   * Synthesizes Segment 0 first with zero lock contention and begins hardware audio playback immediately
   * while pipelining remaining segments sequentially and scheduling them via `source.start(when)`.
   */
  private async playVerseNeuralStreaming(
    ctx: AudioContext,
    verse: DharaniVerse,
    segments: Array<{ text: string; syllables: SyllableAnalysis[] }>,
    signal: AbortSignal,
    upcomingVerses: DharaniVerse[]
  ): Promise<void> {
    this.state.isLoadingAudio = true;
    this.notify();

    let firstSeg: CachedNeuralVerse;
    try {
      firstSeg = await this.fetchNeuralVitsVerseBuffer(
        ctx,
        segments[0].text,
        segments[0].syllables,
        signal,
        'high'
      );
    } catch (err) {
      this.state.isLoadingAudio = false;
      this.notify();
      throw err;
    }

    this.state.isLoadingAudio = false;
    this.state.activeModel = this.formatActiveNeuralModelLabel(firstSeg.model, this.state.mode);
    this.state.backendOnline = true;
    this.notify();

    if (signal.aborted) {
      throw new Error('Aborted');
    }

    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      let settled = false;
      let allSegmentsScheduled = false;
      let endTimer: ReturnType<typeof setTimeout> | null = null;
      const resolvedSegments: Array<{
        entry: CachedNeuralVerse;
        offsetSec: number;
      }> = [];

      const liveTimings: PlaybackSyllableTiming[] = [];
      const verseStartTime = ctx.currentTime + 0.004;
      const interSegGapSec = 0.012 / this.state.rate;
      let nextHardwareStartSec = verseStartTime;
      let liveTotalDurationSec = Math.max(
        firstSeg.totalDurationSec * segments.length * 0.85,
        firstSeg.totalDurationSec
      );
      let finalEndHardwareTime = verseStartTime + firstSeg.totalDurationSec;

      const scheduleSegment = (segEntry: CachedNeuralVerse, segIdx: number) => {
        const { buffer: buf, durationSec: segPlayDurSec } = this.materializeVersePlaybackBuffer(
          ctx,
          segEntry,
          {
            isStreamingSegment: true,
            segIndex: segIdx,
            segCount: segments.length,
          }
        );
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        this.scheduledStreamingSources.add(src);
        this.activeSourceNode = src;

        const segStart = Math.max(ctx.currentTime + 0.003, nextHardwareStartSec);
        const offsetFromVerseStart = segStart - verseStartTime;

        for (const t of segEntry.timings) {
          liveTimings.push({
            ...t,
            startSec: offsetFromVerseStart + t.startSec,
            endSec: offsetFromVerseStart + t.endSec,
          });
        }
        resolvedSegments.push({ entry: segEntry, offsetSec: offsetFromVerseStart });

        finalEndHardwareTime = segStart + segPlayDurSec;
        nextHardwareStartSec = segStart + segEntry.totalDurationSec + interSegGapSec;

        src.onended = () => {
          this.scheduledStreamingSources.delete(src);
          if (this.activeSourceNode === src) {
            this.activeSourceNode = null;
          }
          if (allSegmentsScheduled && this.scheduledStreamingSources.size === 0) {
            finishCleanly();
          }
        };

        src.start(segStart);
      };

      const cleanup = () => {
        if (endTimer !== null) {
          clearTimeout(endTimer);
          endTimer = null;
        }
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        signal.removeEventListener('abort', onAbort);
      };

      const cacheFullStitchedVerse = () => {
        if (resolvedSegments.length !== segments.length) return;
        const fullKey = `${verse.iast.trim()}|${this.state.voice}|${this.state.rate.toFixed(2)}`;
        if (this.neuralVerseCache.has(fullKey)) return;
        const lastSeg = resolvedSegments[resolvedSegments.length - 1];
        const stitchedDurSec = lastSeg.offsetSec + lastSeg.entry.totalDurationSec;
        const totalFrames = Math.max(480, Math.ceil(stitchedDurSec * SAMPLE_RATE));
        const stitchedBuf = ctx.createBuffer(1, totalFrames, SAMPLE_RATE);
        const dst = stitchedBuf.getChannelData(0);
        for (const item of resolvedSegments) {
          const b = this.materializeAudioBuffer(ctx, item.entry);
          const ch = b.getChannelData(0);
          const dstStart = Math.min(totalFrames, Math.max(0, Math.round(item.offsetSec * SAMPLE_RATE)));
          const copyLen = Math.min(ch.length, totalFrames - dstStart);
          if (copyLen > 0) {
            dst.set(ch.subarray(0, copyLen), dstStart);
          }
        }
        this.storeInNeuralVerseCache(fullKey, {
          audioBuffer: stitchedBuf,
          timings: [...liveTimings],
          totalDurationSec: totalFrames / SAMPLE_RATE,
          model: firstSeg.model,
        });
      };

      const finishCleanly = () => {
        if (settled) return;
        settled = true;
        cleanup();
        cacheFullStitchedVerse();
        resolve();
      };

      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        for (const s of this.scheduledStreamingSources) {
          try {
            s.stop();
            s.disconnect();
          } catch {
            // ignore
          }
        }
        this.scheduledStreamingSources.clear();
        reject(new Error('Aborted'));
      };
      signal.addEventListener('abort', onAbort, { once: true });

      // Schedule Segment 0 immediately!
      scheduleSegment(firstSeg, 0);

      if (liveTimings.length > 0) {
        const first = liveTimings[0];
        this.state.currentSyllableIndex = first.syl.index;
        this.state.currentSyllableInfo = first.syl;
        this.state.currentSyllableClassicalZh = first.classicalZh;
        this.state.currentSyllableModernZh = first.modernZh;
        this.state.syllableProgress = 0;
        this.state.verseProgress = 0;
        this.notify();
      }

      // Pipeline Segments 1..K sequentially at high priority, then prefetch upcoming verses
      void (async () => {
        for (let i = 1; i < segments.length; i++) {
          if (settled || signal.aborted) return;
          try {
            const seg = await this.fetchNeuralVitsVerseBuffer(
              ctx,
              segments[i].text,
              segments[i].syllables,
              signal,
              'high'
            );
            if (settled || signal.aborted) return;
            scheduleSegment(seg, i);
            const doneFrac = (i + 1) / segments.length;
            const currentSpan = finalEndHardwareTime - verseStartTime;
            liveTotalDurationSec = Math.max(currentSpan, currentSpan / doneFrac);
          } catch {
            if (settled || signal.aborted) return;
          }
        }
        if (settled || signal.aborted) return;
        allSegmentsScheduled = true;
        this.prefetchUpcomingVerses(upcomingVerses, signal);
        liveTotalDurationSec = Math.max(0.05, finalEndHardwareTime - verseStartTime);
        const remainingMs = Math.max(0, (finalEndHardwareTime - ctx.currentTime) * 1000);
        endTimer = setTimeout(() => {
          finishCleanly();
        }, Math.ceil(remainingMs) + 6);
        if (this.scheduledStreamingSources.size === 0 && ctx.currentTime >= finalEndHardwareTime) {
          finishCleanly();
        }
      })();

      let lastNotifyElapsed = -1;
      const updateFrame = () => {
        if (settled || signal.aborted) return;
        const elapsed = Math.max(0, ctx.currentTime - verseStartTime);
        const verseProg = Math.min(1, Math.max(0, elapsed / Math.max(0.1, liveTotalDurationSec)));

        let activeTiming = liveTimings[0];
        for (const t of liveTimings) {
          if (elapsed >= t.startSec && elapsed <= t.endSec) {
            activeTiming = t;
            break;
          } else if (elapsed > t.endSec) {
            activeTiming = t;
          }
        }

        if (activeTiming) {
          const sylDur = Math.max(0.04, activeTiming.endSec - activeTiming.startSec);
          const sylProg = Math.min(1, Math.max(0, (elapsed - activeTiming.startSec) / sylDur));
          const changedSyl = this.state.currentSyllableIndex !== activeTiming.syl.index;

          this.state.currentSyllableIndex = activeTiming.syl.index;
          this.state.currentSyllableInfo = activeTiming.syl;
          this.state.currentSyllableClassicalZh = activeTiming.classicalZh;
          this.state.currentSyllableModernZh = activeTiming.modernZh;
          this.state.syllableProgress = sylProg;
          this.state.verseProgress = verseProg;

          if (changedSyl || elapsed - lastNotifyElapsed >= 0.05) {
            lastNotifyElapsed = elapsed;
            this.notify();
          }
        }

        if (allSegmentsScheduled && ctx.currentTime >= finalEndHardwareTime) {
          finishCleanly();
          return;
        }

        this.rafId = requestAnimationFrame(updateFrame);
      };

      this.rafId = requestAnimationFrame(updateFrame);
    });
  }

  /**
   * Plays a verse using the real 48,000 Hz ONNX Neural VITS engine (dry or with Sa-tonic Hall / Vedic Chant resonance):
   * - Uses Hugging Face Neural TTS API (`POST /api/tts`) immediately on first visit while
   *   local Browser ONNX caches in the background.
   * - Uses Dedicated Worker ONNX locally once cached & ready.
   * - Zero fallback to non-neural formant synthesis!
   */
  private async playVerseNeuralVitsBuffer(
    verse: DharaniVerse,
    signal: AbortSignal,
    upcomingVerses: DharaniVerse[] = []
  ): Promise<void> {
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    const syllables = analyzeSanskritProsody(verse.iast);
    if (syllables.length === 0) {
      return;
    }

    // Immediately highlight the first syllable of the verse so the user sees exact focus right away
    const enriched = enrichSyllablesWithPhonetics(syllables);
    const firstSyl = enriched[0];
    if (firstSyl) {
      this.state.currentSyllableIndex = firstSyl.index;
      this.state.currentSyllableInfo = firstSyl;
      this.state.currentSyllableClassicalZh = firstSyl.classicalZh;
      this.state.currentSyllableModernZh = firstSyl.modernZh;
      this.state.syllableProgress = 0;
    }

    const ctx = this.getAudioContext();
    const voice = this.state.voice;
    const rate = this.state.rate;
    const cacheKey = `${verse.iast.trim()}|${voice}|${rate.toFixed(2)}`;

    // 1. Instant < 2ms playback if full verse is already cached in RAM (from HF API prewarm or Worker prefetch!)
    const cachedVerse = this.neuralVerseCache.get(cacheKey);
    if (cachedVerse) {
      const { buffer: buf, durationSec: playDurSec } = this.materializeVersePlaybackBuffer(
        ctx,
        cachedVerse
      );
      this.state.isLoadingAudio = false;
      this.state.activeModel = this.formatActiveNeuralModelLabel(
        cachedVerse.model,
        this.state.mode
      );
      this.state.backendOnline = true;
      this.notify();
      this.prefetchUpcomingVerses(upcomingVerses, signal);
      return this.playDecodedBufferWithSync(
        ctx,
        buf,
        cachedVerse.timings,
        playDurSec,
        signal
      );
    }

    // 2. Ensure background ONNX caching is running while first-visit audio is served via HF Neural API
    const onnxReadyNow = isBrowserOnnxReady(voice);
    if (!onnxReadyNow && !this.pythonBackendAvailable) {
      void warmupBrowserOnnxVits(voice);
    }

    // 3. Use First-Clause Instant Streaming when local Worker ONNX is ready (or on extra-long verses > 24 syllables)
    if (!this.neuralInflightRequests.has(cacheKey)) {
      const segments = this.splitVerseIntoStreamingSegments(verse.iast, syllables);
      if (segments.length > 1 && (onnxReadyNow || syllables.length > 24)) {
        return this.playVerseNeuralStreaming(ctx, verse, segments, signal, upcomingVerses);
      }
    }

    // 4. Fetch full neural verse buffer (via HF Neural API when !onnxReadyNow, or Worker ONNX when ready)
    let audioBuffer: AudioBuffer;
    let timings: PlaybackSyllableTiming[];
    let totalDurationSec: number;

    try {
      this.state.isLoadingAudio = true;
      this.notify();
      const neural = await this.fetchNeuralVitsVerseBuffer(
        ctx,
        verse.iast,
        syllables,
        signal,
        'high'
      );
      const materialized = this.materializeVersePlaybackBuffer(ctx, neural);
      audioBuffer = materialized.buffer;
      timings = neural.timings;
      totalDurationSec = materialized.durationSec;
      this.state.activeModel = this.formatActiveNeuralModelLabel(neural.model, this.state.mode);
      this.state.backendOnline = true;
    } finally {
      this.state.isLoadingAudio = false;
      this.notify();
    }

    if (signal.aborted) {
      throw new Error('Aborted');
    }

    this.prefetchUpcomingVerses(upcomingVerses, signal);
    return this.playDecodedBufferWithSync(ctx, audioBuffer, timings, totalDurationSec, signal);
  }

  /**
   * Pre-renders the verse into a single continuous AudioBuffer and plays it
   * using hardware clock (`ctx.currentTime`) + `requestAnimationFrame` for 60fps zero-lag sync.
   */
  private playVerseHardwareBuffer(verse: DharaniVerse, signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      return Promise.reject(new Error('Aborted'));
    }

    const syllables = analyzeSanskritProsody(verse.iast);
    if (syllables.length === 0) {
      return Promise.resolve();
    }

    const ctx = this.getAudioContext();
    const { audioBuffer, timings, totalDurationSec } = this.synthesizeContinuousVerseBuffer(
      ctx,
      syllables,
      this.state.rate,
      true
    );

    return this.playDecodedBufferWithSync(ctx, audioBuffer, timings, totalDurationSec, signal);
  }

  private playDecodedBufferWithSync(
    ctx: AudioContext,
    audioBuffer: AudioBuffer,
    timings: PlaybackSyllableTiming[],
    totalDurationSec: number,
    signal: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      let settled = false;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      this.activeSourceNode = source;

      const startTime = ctx.currentTime;
      let lastNotifyElapsed = -1;

      const cleanupAndFinish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(endTimer);
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        signal.removeEventListener('abort', onAbort);
        if (this.activeSourceNode === source) {
          this.activeSourceNode = null;
        }
        resolve();
      };

      // High-precision timer fallback so background-tab throttling or delayed `onended` IPC
      // never adds sluggish dead air after the last sample has played
      const endTimer = setTimeout(() => {
        if (ctx.currentTime - startTime >= totalDurationSec - 0.006) {
          cleanupAndFinish();
        }
      }, Math.max(0, Math.ceil(totalDurationSec * 1000) + 5));

      if (timings.length > 0) {
        const first = timings[0];
        this.state.currentSyllableIndex = first.syl.index;
        this.state.currentSyllableInfo = first.syl;
        this.state.currentSyllableClassicalZh = first.classicalZh;
        this.state.currentSyllableModernZh = first.modernZh;
        this.state.syllableProgress = 0;
        this.state.verseProgress = 0;
        this.notify();
      }

      const updateFrame = () => {
        if (settled || signal.aborted) return;
        const elapsed = ctx.currentTime - startTime;
        const verseProg = Math.min(1, Math.max(0, elapsed / totalDurationSec));

        // Find active syllable at exact hardware timestamp
        let activeTiming = timings[0];
        for (const t of timings) {
          if (elapsed >= t.startSec && elapsed <= t.endSec) {
            activeTiming = t;
            break;
          } else if (elapsed > t.endSec) {
            activeTiming = t;
          }
        }

        if (activeTiming) {
          const sylDur = Math.max(0.04, activeTiming.endSec - activeTiming.startSec);
          const sylProg = Math.min(1, Math.max(0, (elapsed - activeTiming.startSec) / sylDur));
          const changedSyl = this.state.currentSyllableIndex !== activeTiming.syl.index;

          this.state.currentSyllableIndex = activeTiming.syl.index;
          this.state.currentSyllableInfo = activeTiming.syl;
          this.state.currentSyllableClassicalZh = activeTiming.classicalZh;
          this.state.currentSyllableModernZh = activeTiming.modernZh;
          this.state.syllableProgress = sylProg;
          this.state.verseProgress = verseProg;

          if (changedSyl || elapsed - lastNotifyElapsed >= 0.05) {
            lastNotifyElapsed = elapsed;
            this.notify();
          }
        }

        if (elapsed >= totalDurationSec) {
          cleanupAndFinish();
          return;
        }

        this.rafId = requestAnimationFrame(updateFrame);
      };

      source.onended = () => {
        cleanupAndFinish();
      };

      const onAbort = () => {
        if (settled) return;
        settled = true;
        clearTimeout(endTimer);
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        try {
          source.stop();
          source.disconnect();
        } catch {
          // ignore
        }
        if (this.activeSourceNode === source) {
          this.activeSourceNode = null;
        }
        reject(new Error('Aborted'));
      };
      signal.addEventListener('abort', onAbort, { once: true });

      source.start();
      this.rafId = requestAnimationFrame(updateFrame);
    });
  }

  /**
   * Synthesizes a continuous 44.1kHz stereo AudioBuffer for a sequence of Sanskrit syllables.
   * Uses a smooth Rosenberg glottal pulse + 3-formant vocal filter + consonant articulation + Tanpura drone.
   */
  private synthesizeContinuousVerseBuffer(
    ctx: BaseAudioContext,
    syllables: SyllableAnalysis[],
    rate: number,
    includeBellAndDrone: boolean
  ): {
    audioBuffer: AudioBuffer;
    timings: PlaybackSyllableTiming[];
    totalDurationSec: number;
  } {
    const timings: PlaybackSyllableTiming[] = [];
    let cursorSec = includeBellAndDrone ? 0.18 : 0.02;
    const enriched = enrichSyllablesWithPhonetics(syllables);

    // Comfortable human chanting pace: Laghu = 0.36s, Guru = 0.64s at 1.0x
    for (const syl of enriched) {
      const baseDur = syl.weight === 'guru' ? 0.62 : 0.36;
      const dur = baseDur / rate;
      timings.push({
        syl,
        classicalZh: syl.classicalZh,
        modernZh: syl.modernZh,
        startSec: cursorSec,
        endSec: cursorSec + dur,
      });
      cursorSec += dur + 0.035 / rate; // natural articulation transition
    }

    const totalDurationSec = cursorSec + (includeBellAndDrone ? 0.35 : 0.08);
    const totalSamples = Math.max(1024, Math.ceil(totalDurationSec * SAMPLE_RATE));
    const buffer = ctx.createBuffer(2, totalSamples, SAMPLE_RATE);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // 1. Optional Temple Singing Bowl Chime & Tanpura Drone (Sa = SA_FUNDAMENTAL_HZ, Pa = 204.15 Hz)
    if (includeBellAndDrone) {
      for (let i = 0; i < totalSamples; i++) {
        const t = i / SAMPLE_RATE;
        // Temple bell chime at start
        const bellEnv = Math.exp(-t * 3.8) * Math.min(1, t / 0.01);
        const bell =
          bellEnv *
          0.09 *
          (Math.sin(2 * Math.PI * 544.4 * t) +
            0.4 * Math.sin(2 * Math.PI * 1088.8 * t) +
            0.2 * Math.sin(2 * Math.PI * 1633.2 * t));

        // Warm continuous Tanpura drone
        const droneFadeIn = Math.min(1, t / 0.15);
        const droneFadeOut = Math.min(1, Math.max(0, (totalDurationSec - t) / 0.25));
        const droneEnv = droneFadeIn * droneFadeOut * 0.035;
        const drone =
          droneEnv *
          (Math.sin(2 * Math.PI * SA_FUNDAMENTAL_HZ * t) +
            0.5 * Math.sin(2 * Math.PI * 204.15 * t) +
            0.25 * Math.sin(2 * Math.PI * 272.2 * t));

        left[i] += bell + drone * 1.05;
        right[i] += bell * 0.92 + drone * 0.95;
      }
    }

    // 2. Render each syllable with 2nd-order digital resonator filters (F1, F2, F3) + consonant onset
    for (let idx = 0; idx < timings.length; idx++) {
      const item = timings[idx];
      const { syl, startSec, endSec } = item;
      const dur = endSec - startSec;
      const startSample = Math.floor(startSec * SAMPLE_RATE);
      const endSample = Math.min(totalSamples - 1, Math.floor(endSec * SAMPLE_RATE));

      const hasSibilant = /[śṣs]/.test(syl.iast);
      const hasAspiration = /(?:kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh|h|ḥ)/.test(syl.iast);
      const hasNasal = /[ṃṁmnṇñṅ]/.test(syl.iast);

      // Vedic chanting pitch contour:
      // Male: Guru 148 Hz -> 137.5 Hz, Laghu SA_FUNDAMENTAL_HZ -> 134.5 Hz
      // Female: Guru 232 Hz -> 216 Hz, Laghu 216 Hz -> 208 Hz
      const isFemale = this.state.voice === 'female';
      const f0Start = isFemale
        ? syl.weight === 'guru'
          ? 232.0
          : 216.0
        : syl.weight === 'guru'
        ? 148.0
        : SA_FUNDAMENTAL_HZ;
      const f0End = isFemale
        ? syl.weight === 'guru'
          ? 216.0
          : 208.0
        : syl.weight === 'guru'
        ? 137.5
        : 134.5;

      const formantScale = isFemale ? 1.14 : 1.0;
      const f1 = syl.formantHz.f1 * formantScale;
      const f2 = syl.formantHz.f2 * formantScale;
      const f3 = 2650 * formantScale;

      // Biquad resonator state variables
      let y1_1 = 0, y1_2 = 0;
      let y2_1 = 0, y2_2 = 0;
      let y3_1 = 0, y3_2 = 0;

      const r1 = Math.exp((-Math.PI * 90) / SAMPLE_RATE);
      const a1_1 = -2 * r1 * Math.cos((2 * Math.PI * f1) / SAMPLE_RATE);
      const a1_2 = r1 * r1;

      const r2 = Math.exp((-Math.PI * 120) / SAMPLE_RATE);
      const a2_1 = -2 * r2 * Math.cos((2 * Math.PI * f2) / SAMPLE_RATE);
      const a2_2 = r2 * r2;

      const r3 = Math.exp((-Math.PI * 160) / SAMPLE_RATE);
      const a3_1 = -2 * r3 * Math.cos((2 * Math.PI * f3) / SAMPLE_RATE);
      const a3_2 = r3 * r3;

      let phase = 0;

      for (let n = startSample; n <= endSample; n++) {
        const localT = (n - startSample) / SAMPLE_RATE;
        const normT = localT / dur;

        // Smooth ADSR envelope avoiding any clicks
        const attack = Math.min(1, localT / 0.028);
        const release = Math.min(1, Math.max(0, (dur - localT) / 0.045));
        const env = attack * release * (syl.weight === 'guru' ? 0.34 : 0.28);

        // Pitch with subtle natural human vibrato
        const vibrato = Math.sin(2 * Math.PI * 5.2 * localT) * 1.1;
        const f0 = f0Start + (f0End - f0Start) * normT + vibrato;
        phase += f0 / SAMPLE_RATE;
        const p = phase - Math.floor(phase);

        // Rosenberg glottal pulse waveform (warm human vocal cord spectrum)
        let glottal = 0;
        if (p < 0.45) {
          glottal = 0.5 * (1 - Math.cos((Math.PI * p) / 0.45));
        } else if (p < 0.65) {
          glottal = Math.cos(((Math.PI * (p - 0.45)) / 0.2) * 0.5);
        }
        glottal -= 0.32; // remove DC offset

        // Consonant sibilant / aspiration noise during first 15% of syllable
        let consonantNoise = 0;
        if (hasSibilant && normT < 0.16) {
          consonantNoise = (Math.random() * 2 - 1) * 0.14 * (1 - normT / 0.16);
        } else if (hasAspiration && (normT < 0.12 || normT > 0.85)) {
          consonantNoise = (Math.random() * 2 - 1) * 0.08;
        }

        const excitation = glottal + consonantNoise;

        // Pass through parallel formant resonators
        const out1 = excitation - a1_1 * y1_1 - a1_2 * y1_2;
        y1_2 = y1_1;
        y1_1 = out1;

        const out2 = excitation - a2_1 * y2_1 - a2_2 * y2_2;
        y2_2 = y2_1;
        y2_1 = out2;

        const out3 = excitation - a3_1 * y3_1 - a3_2 * y3_2;
        y3_2 = y3_1;
        y3_1 = out3;

        // Nasal murmur warmth during coda if syllable has anusvāra/nasal
        const nasalTone =
          hasNasal && normT > 0.55
            ? Math.sin(2 * Math.PI * f0 * localT) * 0.18 * ((normT - 0.55) / 0.45)
            : 0;

        const sampleVal =
          env * ((out1 * 0.022 + out2 * 0.014 + out3 * 0.005) + nasalTone + consonantNoise * 0.4);

        left[n] = Math.max(-0.95, Math.min(0.95, left[n] + sampleVal * 1.02));
        right[n] = Math.max(-0.95, Math.min(0.95, right[n] + sampleVal * 0.98));
      }
    }

    return {
      audioBuffer: buffer,
      timings,
      totalDurationSec,
    };
  }

  private createPurePcmContextShim(): BaseAudioContext {
    return {
      sampleRate: SAMPLE_RATE,
      createBuffer: (channels: number, length: number, sr: number) => {
        const chArrays = Array.from({ length: channels }, () => new Float32Array(length));
        return {
          numberOfChannels: channels,
          length,
          sampleRate: sr,
          duration: length / sr,
          getChannelData: (idx: number) => chArrays[idx],
        } as unknown as AudioBuffer;
      },
    } as unknown as BaseAudioContext;
  }

  private storeExportedPcmCache(
    key: string,
    value: {
      channels: Float32Array[];
      sampleRate: number;
      durationSec: number;
      model: string;
    }
  ) {
    if (this.exportedPcmCache.size >= 6) {
      const firstKey = this.exportedPcmCache.keys().next().value;
      if (firstKey) this.exportedPcmCache.delete(firstKey);
    }
    this.exportedPcmCache.set(key, value);
  }

  /**
   * Synthesizes all verses of a Dhāraṇī into 48,000 Hz PCM channels with:
   * - Instant reuse of `neuralVerseCache` (already prewarmed or played verses = 0ms)
   * - Automatic clause-chunking (`<= 220` IAST chars) so cloud requests never hit gateway timeouts
   * - Bounded concurrency (2 parallel requests on Cloud API, sequential high-priority in ONNX Worker)
   * - Live progress callbacks (`completedChunks / totalChunks`) for responsive UI feedback
   */
  private async synthesizeVersesPcmChannels(
    verses: DharaniVerse[],
    rate = 1.0,
    onProgress?: (progress: AudioExportProgress) => void,
    signal?: AbortSignal
  ): Promise<{
    channels: Float32Array[];
    sampleRate: number;
    durationSec: number;
    model: string;
  }> {
    const effRate = Math.max(0.5, Math.min(2.0, rate || this.state.rate || 1.0));
    const voice = this.state.voice;
    const useFormantChant = this.state.mode === 'studio-vocal-chant';
    const resonanceVariant = getNeuralResonanceVariant(this.state.mode);
    const modeBucket = useFormantChant
      ? 'chant'
      : resonanceVariant === 'hall'
        ? 'neural-hall'
        : resonanceVariant === 'vedic-chant'
          ? 'neural-vedic'
          : 'neural';
    const versesSig = verses.map((v) => (v.iast || '').trim()).join('||');
    const pcmCacheKey = `${modeBucket}|${voice}|${effRate.toFixed(2)}|${versesSig}`;

    const cachedPcm = this.exportedPcmCache.get(pcmCacheKey);
    if (cachedPcm) {
      onProgress?.({
        phase: 'synthesizing',
        completedChunks: 1,
        totalChunks: 1,
        percent: 90,
      });
      return cachedPcm;
    }

    if (useFormantChant) {
      const allSyllables: SyllableAnalysis[] = [];
      let runningIdx = 1;
      for (const v of verses) {
        const syls = analyzeSanskritProsody(v.iast);
        for (const s of syls) {
          allSyllables.push({ ...s, index: runningIdx++ });
        }
      }
      if (allSyllables.length === 0) {
        for (const s of analyzeSanskritProsody('oṃ svāhā')) {
          allSyllables.push({ ...s, index: runningIdx++ });
        }
      }
      const shimCtx = this.createPurePcmContextShim();
      const { audioBuffer, totalDurationSec } = this.synthesizeContinuousVerseBuffer(
        shimCtx,
        allSyllables,
        effRate,
        true
      );
      const res = {
        channels: [
          new Float32Array(audioBuffer.getChannelData(0)),
          new Float32Array(audioBuffer.getChannelData(1)),
        ],
        sampleRate: SAMPLE_RATE,
        durationSec: totalDurationSec,
        model: 'Rosenberg Sadja Formant 48kHz',
      };
      this.storeExportedPcmCache(pcmCacheKey, res);
      onProgress?.({
        phase: 'synthesizing',
        completedChunks: 1,
        totalChunks: 1,
        percent: 90,
      });
      return res;
    }

    // Build bounded subclauses across all verses so no single TTS call ever stalls or times out
    const tasks: Array<{ text: string; syllables: SyllableAnalysis[]; pauseAfterMs: number }> = [];
    for (let vIdx = 0; vIdx < verses.length; vIdx++) {
      const rawIast = (verses[vIdx]?.iast || '').trim();
      if (!rawIast) continue;
      const subclauses = splitIastIntoExportSubclauses(rawIast, 220);
      for (let sIdx = 0; sIdx < subclauses.length; sIdx++) {
        const sc = subclauses[sIdx];
        const isVerseEnd = sIdx === subclauses.length - 1;
        tasks.push({
          text: sc,
          syllables: analyzeSanskritProsody(sc),
          pauseAfterMs: isVerseEnd ? 260 : 140,
        });
      }
    }

    if (tasks.length === 0) {
      tasks.push({
        text: 'oṃ svāhā',
        syllables: analyzeSanskritProsody('oṃ svāhā'),
        pauseAfterMs: 0,
      });
    }

    const totalChunks = tasks.length;
    let completedChunks = 0;
    onProgress?.({
      phase: 'synthesizing',
      completedChunks: 0,
      totalChunks,
      percent: 4,
    });

    const onnxReady = isBrowserOnnxReady(voice);
    if (!onnxReady && !this.pythonBackendAvailable) {
      void warmupBrowserOnnxVits(voice);
    }

    const concurrency = onnxReady ? 1 : Math.min(2, totalChunks);
    const chunkResults = new Array<{
      pcm: Float32Array;
      timings: PlaybackSyllableTiming[];
      model: string;
    }>(totalChunks);
    let nextTaskIndex = 0;

    const runWorkerSlot = async () => {
      while (nextTaskIndex < totalChunks) {
        if (signal?.aborted) {
          throw new DOMException('Audio export aborted', 'AbortError');
        }
        const currentIdx = nextTaskIndex++;
        const task = tasks[currentIdx];
        const cachedVerse = await this.fetchNeuralVitsVerseBuffer(
          null,
          task.text,
          task.syllables,
          signal,
          'high',
          effRate
        );
        const pcmSlice =
          cachedVerse.pcm48k ??
          (cachedVerse.audioBuffer
            ? new Float32Array(cachedVerse.audioBuffer.getChannelData(0))
            : new Float32Array(480));

        chunkResults[currentIdx] = {
          pcm: pcmSlice,
          timings: cachedVerse.timings,
          model: cachedVerse.model,
        };
        completedChunks++;
        onProgress?.({
          phase: 'synthesizing',
          completedChunks,
          totalChunks,
          percent: Math.min(88, Math.max(6, Math.round((completedChunks / totalChunks) * 86))),
        });
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => runWorkerSlot()));

    const stitchedParts: Float32Array[] = [];
    const stitchedTimings: PlaybackSyllableTiming[] = [];
    let totalSamples = 0;
    let resolvedModel =
      voice === 'female'
        ? 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa_female.onnx'
        : 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx';

    for (let i = 0; i < chunkResults.length; i++) {
      const item = chunkResults[i];
      if (!item) continue;
      if (item.model) {
        resolvedModel = item.model;
      }
      const chunkStartSec = totalSamples / SAMPLE_RATE;
      for (const t of item.timings) {
        stitchedTimings.push({
          ...t,
          startSec: chunkStartSec + t.startSec,
          endSec: chunkStartSec + t.endSec,
        });
      }
      stitchedParts.push(item.pcm);
      totalSamples += item.pcm.length;

      if (i < chunkResults.length - 1 && tasks[i].pauseAfterMs > 0) {
        const pauseSamps = Math.round(((tasks[i].pauseAfterMs / effRate) / 1000) * SAMPLE_RATE);
        if (pauseSamps > 0) {
          const silence = new Float32Array(pauseSamps);
          stitchedParts.push(silence);
          totalSamples += pauseSamps;
        }
      }
    }

    const fullPcm = new Float32Array(Math.max(480, totalSamples));
    let writeOffset = 0;
    for (const part of stitchedParts) {
      fullPcm.set(part, writeOffset);
      writeOffset += part.length;
    }

    let res: {
      channels: Float32Array[];
      sampleRate: number;
      durationSec: number;
      model: string;
    };

    if (resonanceVariant) {
      const stereoRes = renderNeuralResonanceStereoPcm(fullPcm, {
        sampleRate: SAMPLE_RATE,
        voice,
        variant: resonanceVariant,
        timings: stitchedTimings,
        includeOpeningBell: true,
        tailSec: 0.42,
      });
      res = {
        channels: [stereoRes.left, stereoRes.right],
        sampleRate: SAMPLE_RATE,
        durationSec: stereoRes.durationSec,
        model: this.formatActiveNeuralModelLabel(resolvedModel, this.state.mode),
      };
    } else {
      res = {
        channels: [fullPcm],
        sampleRate: SAMPLE_RATE,
        durationSec: fullPcm.length / SAMPLE_RATE,
        model: resolvedModel,
      };
    }
    this.storeExportedPcmCache(pcmCacheKey, res);
    return res;
  }

  /**
   * Export an entire Dhāraṇī (all verses) into a downloadable 48kHz 16-bit PCM `.wav` Blob.
   */
  public renderVersesToWavBlob(verses: DharaniVerse[], rate = 1.0): {
    blob: Blob;
    url: string;
    durationSec: number;
  } {
    const allSyllables: SyllableAnalysis[] = [];
    let runningIdx = 1;
    for (const v of verses) {
      const syls = analyzeSanskritProsody(v.iast);
      for (const s of syls) {
        allSyllables.push({ ...s, index: runningIdx++ });
      }
    }

    const shimCtx = this.createPurePcmContextShim();
    const { audioBuffer, totalDurationSec } = this.synthesizeContinuousVerseBuffer(
      shimCtx,
      allSyllables,
      rate,
      true
    );

    const wavBuffer = this.encodeAudioBufferToWav(audioBuffer);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : '';
    return { blob, url, durationSec: totalDurationSec };
  }

  /**
   * Synthesize an entire Dhāraṇī into a downloadable 48,000 Hz `.mp3` (192 kbps) or `.wav` (16-bit PCM)
   * file named directly after the Dhāraṇī (`${dharaniTitle}.mp3` / `${dharaniTitle}.wav`).
   */
  public async exportDharaniAudio(options: {
    verses: DharaniVerse[];
    dharaniTitle: string;
    format?: AudioExportFormat;
    rate?: number;
    onProgress?: (progress: AudioExportProgress) => void;
    signal?: AbortSignal;
  }): Promise<ExportedDharaniAudio> {
    const format: AudioExportFormat = options.format === 'wav' ? 'wav' : 'mp3';
    const effRate = options.rate ?? this.state.rate ?? 1.0;

    const pcmRes = await this.synthesizeVersesPcmChannels(
      options.verses,
      effRate,
      options.onProgress,
      options.signal
    );

    if (options.signal?.aborted) {
      throw new DOMException('Audio export aborted', 'AbortError');
    }

    options.onProgress?.({
      phase: 'encoding',
      completedChunks: 1,
      totalChunks: 1,
      percent: 92,
    });

    let encodedBytes: Uint8Array;
    let mimeType: 'audio/mpeg' | 'audio/wav';

    if (format === 'mp3') {
      encodedBytes = await encodePcmToMp3Bytes(
        pcmRes.channels,
        pcmRes.sampleRate,
        192,
        (ratio) => {
          options.onProgress?.({
            phase: 'encoding',
            completedChunks: 1,
            totalChunks: 1,
            percent: Math.min(99, 92 + Math.round(ratio * 7)),
          });
        }
      );
      mimeType = 'audio/mpeg';
    } else {
      encodedBytes = encodePcmToWavBytes(pcmRes.channels, pcmRes.sampleRate);
      mimeType = 'audio/wav';
    }

    const blob = uint8ArrayToAudioBlob(encodedBytes, mimeType);
    const url =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : '';
    const fileName = buildDharaniAudioFileName(options.dharaniTitle, format);

    options.onProgress?.({
      phase: 'encoding',
      completedChunks: 1,
      totalChunks: 1,
      percent: 100,
    });

    return {
      blob,
      url,
      format,
      mimeType,
      fileName,
      dharaniTitle: options.dharaniTitle,
      durationSec: pcmRes.durationSec,
      sampleRate: pcmRes.sampleRate,
      model: pcmRes.model,
    };
  }

  /**
   * Synthesize an entire Dhāraṇī into a downloadable 48,000 Hz 16-bit `.wav` Blob
   * using the real ONNX Neural VITS engine (`POST /api/tts` on HF/local API or Browser ONNX Worker).
   */
  public async renderVersesToNeuralWavBlob(
    verses: DharaniVerse[],
    rate = 1.0,
    dharaniTitle = '陀罗尼音频',
    onProgress?: (progress: AudioExportProgress) => void
  ): Promise<{
    blob: Blob;
    url: string;
    durationSec: number;
    model: string;
    fileName: string;
  }> {
    const exported = await this.exportDharaniAudio({
      verses,
      dharaniTitle,
      format: 'wav',
      rate,
      onProgress,
    });
    return {
      blob: exported.blob,
      url: exported.url,
      durationSec: exported.durationSec,
      model: exported.model,
      fileName: exported.fileName,
    };
  }

  private encodeAudioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numFrames * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true);  // PCM format = 1
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const left = buffer.getChannelData(0);
    const right = numChannels > 1 ? buffer.getChannelData(1) : left;
    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      const sL = Math.max(-1, Math.min(1, left[i]));
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
      offset += 2;
      if (numChannels > 1) {
        view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
        offset += 2;
      }
    }
    return arrayBuffer;
  }

  private hasIndicVoice(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const voices = window.speechSynthesis.getVoices();
    return voices.some((v) => v.lang.startsWith('sa') || v.lang.startsWith('hi'));
  }

  private speakUtteranceOnce(text: string, langPrefix: 'zh-CN' | 'hi-IN') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find((v) => v.lang.startsWith(langPrefix.slice(0, 2)));
    if (matched) utter.voice = matched;
    utter.lang = matched?.lang || langPrefix;
    utter.rate = this.state.rate * 0.88;
    window.speechSynthesis.speak(utter);
  }

  private async playVerseSpeechSynced(
    verse: DharaniVerse,
    langMode: 'zh-CN' | 'hi-IN',
    signal: AbortSignal
  ) {
    const syllables = analyzeSanskritProsody(verse.iast);
    if (syllables.length === 0) return;
    const enriched = enrichSyllablesWithPhonetics(syllables);

    // Speak syllable-by-phrase with full Sandhi context for exact visual sync
    for (let i = 0; i < enriched.length; i++) {
      if (signal.aborted) break;
      const syl = enriched[i];

      this.state.currentSyllableIndex = syl.index;
      this.state.currentSyllableInfo = syl;
      this.state.currentSyllableClassicalZh = syl.classicalZh;
      this.state.currentSyllableModernZh = syl.modernZh;
      this.state.syllableProgress = 0.5;
      this.state.verseProgress = (i + 1) / enriched.length;
      this.notify();

      const textToSpeak =
        langMode === 'zh-CN'
          ? syl.modernZh.replace(/—/g, '')
          : syl.devanagari;

      this.speakUtteranceOnce(textToSpeak, langMode);

      const waitMs = (syl.weight === 'guru' ? 560 : 380) / this.state.rate;
      await this.sleep(waitMs, signal);
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Aborted'));
        return;
      }
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new Error('Aborted'));
        },
        { once: true }
      );
    });
  }
}

export const sanskritAudioEngine = new SanskritAudioEngine();
export default sanskritAudioEngine;

