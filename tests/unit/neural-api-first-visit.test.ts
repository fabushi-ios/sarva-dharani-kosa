import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as browserOnnx from '../../src/services/audio/browserOnnxTtsEngine';
import {
  HF_AUDIO_API_ENDPOINTS,
  sanskritAudioEngine as primaryAudioEngine,
} from '../../src/services/audio/sanskritAudioEngine';
import { sanskritAudioEngine as secondaryAudioEngine } from '../../src/services/sanskritAudioEngine';

const ROOT_DIR = path.resolve(__dirname, '../..');

function buildMockWav48kBytes(numSamples = 4800): Uint8Array {
  const byteRate = 48000 * 2;
  const dataSize = numSamples * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeAscii = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(off + i, str.charCodeAt(i));
    }
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, 48000, true); // 48kHz
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.round(Math.sin((2 * Math.PI * 220 * i) / 48000) * 12000);
    view.setInt16(44 + i * 2, sample, true);
  }
  return new Uint8Array(buf);
}

function uint8ToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

class MockAudioBufferSourceNode {
  public buffer: AudioBuffer | null = null;
  public playbackRate = { value: 1, setValueAtTime: vi.fn() };
  public onended: (() => void) | null = null;
  public connect = vi.fn(() => this);
  public disconnect = vi.fn();
  public start = vi.fn(() => {
    setTimeout(() => {
      this.onended?.();
    }, 5);
  });
  public stop = vi.fn();
}

class MockAudioContext {
  public sampleRate = 48000;
  public currentTime = 0;
  public state: AudioContextState = 'running';
  public destination = {} as AudioDestinationNode;
  public resume = vi.fn(async () => {});
  public createBufferSource = vi.fn(
    () => new MockAudioBufferSourceNode() as unknown as AudioBufferSourceNode
  );
  public createGain = vi.fn(() => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  public createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => {
    const data = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: () => data,
    } as unknown as AudioBuffer;
  });
  public decodeAudioData = vi.fn(async (ab: ArrayBuffer) => {
    const frames = Math.max(480, Math.floor(Math.max(0, ab.byteLength - 44) / 2));
    return this.createBuffer(1, frames, 48000);
  });
}

describe('Hugging Face Neural TTS First-Visit API + Background ONNX Caching & Zero Recitation Fallback', () => {
  it('exposes live Hugging Face Neural TTS Space endpoints and preserves codebase invariants', () => {
    expect(browserOnnx.HF_TTS_API_BASE_URL).toBe(
      'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space'
    );
    expect(HF_AUDIO_API_ENDPOINTS.tts).toBe(
      'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space/api/tts'
    );
    expect(HF_AUDIO_API_ENDPOINTS.syllable).toBe(
      'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space/api/syllable/'
    );
    expect(HF_AUDIO_API_ENDPOINTS.health).toBe(
      'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space/api/health'
    );

    const primarySrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/services/audio/sanskritAudioEngine.ts'),
      'utf8'
    );
    expect(primarySrc).not.toContain('136.1');

    const rootHtml = fs.readFileSync(path.join(ROOT_DIR, 'sanskrit_phonetic_engine.html'), 'utf8');
    const pubHtml = fs.readFileSync(
      path.join(ROOT_DIR, 'public/sanskrit_phonetic_engine.html'),
      'utf8'
    );
    expect(rootHtml).toBe(pubHtml);
    expect(rootHtml).toContain('https://bhrum108-sarva-dharani-kosa-tts-api.hf.space');
    expect(rootHtml).not.toContain('136.1');
    expect(rootHtml).not.toContain('sawtooth');
  });

  describe('Runtime First-Visit Cloud API vs Warm Local ONNX & Zero Fallback Verification', () => {
    const origWindow = (globalThis as Record<string, unknown>).window;
    const origDocument = (globalThis as Record<string, unknown>).document;
    const origFetch = globalThis.fetch;
    const origRaf = globalThis.requestAnimationFrame;
    const origCaf = globalThis.cancelAnimationFrame;

    beforeEach(() => {
      const mockWin: Record<string, unknown> = {
        AudioContext: MockAudioContext,
        location: { protocol: 'https:', hostname: 'bhrum108-sarva-dharani-kosa.static.hf.space' },
        atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
        btoa: (bin: string) => Buffer.from(bin, 'binary').toString('base64'),
        setTimeout: globalThis.setTimeout.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
      };
      (globalThis as Record<string, unknown>).window = mockWin;
      (globalThis as Record<string, unknown>).document = {
        head: {},
        visibilityState: 'visible',
        createElement: () => ({}),
      };
      globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
        setTimeout(() => cb(0), 16) as unknown as number) as typeof requestAnimationFrame;
      globalThis.cancelAnimationFrame = ((id: number) =>
        clearTimeout(id as unknown as ReturnType<typeof setTimeout>)) as typeof cancelAnimationFrame;

      primaryAudioEngine.stop();
      primaryAudioEngine.setMode('neural-vits-48k');
      (primaryAudioEngine as unknown as { neuralVerseCache: Map<string, unknown> }).neuralVerseCache.clear();
      (primaryAudioEngine as unknown as { singleSyllableCache: Map<string, unknown> }).singleSyllableCache.clear();
      (primaryAudioEngine as unknown as { pythonBackendAvailable: boolean }).pythonBackendAvailable = false;
    });

    afterEach(() => {
      primaryAudioEngine.stop();
      secondaryAudioEngine.stop();
      vi.restoreAllMocks();
      (globalThis as Record<string, unknown>).window = origWindow;
      (globalThis as Record<string, unknown>).document = origDocument;
      globalThis.fetch = origFetch;
      globalThis.requestAnimationFrame = origRaf;
      globalThis.cancelAnimationFrame = origCaf;
    });

    it('immediately calls Hugging Face Neural TTS API on first visit when local ONNX is not ready while caching ONNX in background', async () => {
      const wavBytes = buildMockWav48kBytes(4800);
      const wavB64 = uint8ToBase64(wavBytes);
      const calledUrls: string[] = [];

      vi.spyOn(browserOnnx, 'isBrowserOnnxReady').mockReturnValue(false);
      const warmupSpy = vi
        .spyOn(browserOnnx, 'warmupBrowserOnnxVits')
        .mockResolvedValue(true);
      const localSynthSpy = vi.spyOn(browserOnnx, 'synthesizePcmWithBrowserOnnxVits');

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calledUrls.push(url);
        if (url.includes('/api/syllable/')) {
          return {
            ok: true,
            status: 200,
            headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'audio/wav' : '') },
            arrayBuffer: async () => wavBytes.buffer.slice(0),
          } as unknown as Response;
        }
        if (url.includes('/api/tts')) {
          return {
            ok: true,
            status: 200,
            headers: {
              get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : ''),
            },
            json: async () => ({
              sampleRate: 48000,
              durationSec: 0.1,
              model: 'ninada-sa-studio-male-hf-api',
              audioBase64Wav: wavB64,
              syllableTimings: [
                { index: 0, slp1: 'oM', startMs: 0, endMs: 50, durationMs: 50 },
                { index: 1, slp1: 'hUM', startMs: 50, endMs: 100, durationMs: 50 },
              ],
            }),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: { get: () => '' } } as unknown as Response;
      }) as typeof fetch;

      await primaryAudioEngine.playSingleSyllable('oṃ');
      expect(
        calledUrls.some((u) =>
          u.startsWith('https://bhrum108-sarva-dharani-kosa-tts-api.hf.space/api/syllable/')
        )
      ).toBe(true);
      expect(warmupSpy).toHaveBeenCalledWith('male');

      await primaryAudioEngine.playVerses(
        [{ index: 1, iast: 'oṃ hūṃ', chineseMeaning: '唵吽' }],
        0
      );
      expect(
        calledUrls.some(
          (u) => u === 'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space/api/tts'
        )
      ).toBe(true);
      expect(localSynthSpy).not.toHaveBeenCalled();
    });

    it('switches to local Browser ONNX Worker synthesis once cached and ready without hitting remote API', async () => {
      const calledUrls: string[] = [];
      vi.spyOn(browserOnnx, 'isBrowserOnnxReady').mockReturnValue(true);
      const localSynthSpy = vi
        .spyOn(browserOnnx, 'synthesizePcmWithBrowserOnnxVits')
        .mockResolvedValue({
          pcm48k: new Float32Array(4800).fill(0.05),
          sampleRate: 48000,
          durationSec: 0.1,
          model: 'bhrum108/sarva-dharani-kosa-tts:onnx_mobile/sa.onnx',
          chunkSpans: [{ wordCount: 2, startSample: 0, endSample: 4800 }],
        });

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        calledUrls.push(String(input));
        return { ok: false, status: 500, headers: { get: () => '' } } as unknown as Response;
      }) as typeof fetch;

      await primaryAudioEngine.playVerses(
        [{ index: 1, iast: 'gate gate', chineseMeaning: '去吧去吧' }],
        0
      );

      expect(localSynthSpy).toHaveBeenCalledTimes(1);
      expect(calledUrls.filter((u) => u.includes('/api/tts'))).toHaveLength(0);
    });

    it('never falls back to the hardware formant synthesizer or speechSynthesis when neural model and API both fail', async () => {
      vi.spyOn(browserOnnx, 'isBrowserOnnxReady').mockReturnValue(false);
      vi.spyOn(browserOnnx, 'warmupBrowserOnnxVits').mockResolvedValue(false);
      vi.spyOn(browserOnnx, 'synthesizePcmWithBrowserOnnxVits').mockRejectedValue(
        new Error('ONNX unavailable')
      );
      vi.spyOn(browserOnnx, 'synthesizeWithBrowserOnnxVits').mockRejectedValue(
        new Error('ONNX unavailable')
      );

      globalThis.fetch = vi.fn(async () => {
        throw new Error('Network offline');
      }) as typeof fetch;

      const hwBufferSpy = vi.spyOn(
        primaryAudioEngine as unknown as {
          playVerseHardwareBuffer: (...args: unknown[]) => Promise<void>;
        },
        'playVerseHardwareBuffer'
      );
      const contSynthSpy = vi.spyOn(
        primaryAudioEngine as unknown as {
          synthesizeContinuousVerseBuffer: (...args: unknown[]) => unknown;
        },
        'synthesizeContinuousVerseBuffer'
      );

      await primaryAudioEngine.playVerses(
        [{ index: 1, iast: 'svāhā', chineseMeaning: '圆满成就' }],
        0
      );

      expect(hwBufferSpy).not.toHaveBeenCalled();
      expect(contSynthSpy).not.toHaveBeenCalled();

      const secRes = await secondaryAudioEngine.speakText('oṃ maṇi padme hūṃ', {
        mode: 'neural-tts',
      });
      expect(secRes.mode).toBe('neural-tts');
      expect(secRes.durationSec).toBe(0);
    });
  });
});
