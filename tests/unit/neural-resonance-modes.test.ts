import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  COSMIC_SA_HZ,
  applyVoicedTdPsola48k,
  estimatePitchTrack48k,
  renderNeuralResonanceStereoPcm,
} from '../../src/services/audio/neuralResonanceDsp';
import { encodePcmToWavBytes } from '../../src/services/audio/audioExportEncoder';
import * as browserOnnx from '../../src/services/audio/browserOnnxTtsEngine';
import {
  getNeuralResonanceVariant,
  isNeuralEngineMode,
  sanskritAudioEngine,
} from '../../src/services/audio/sanskritAudioEngine';
import { dharaniAudioExportStore } from '../../src/services/audio/dharaniAudioExportStore';
import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';
import { App } from '../../src/App';

/**
 * Generates a synthetic 48,000 Hz syllable with:
 * - `[0 .. 50ms)`: unvoiced consonant frication/plosive burst (deterministic PRNG)
 * - `[50ms .. 450ms)`: rich formant-shaped glottal pulse train at `f0Hz`
 * - `[450ms .. 500ms)`: unvoiced visarga aspiration coda
 */
function buildSyntheticConsonantVowelSyllable48k(f0Hz = 122.0): {
  pcm: Float32Array;
  sampleRate: number;
  consonantEndSample: number;
  vowelStartSample: number;
  vowelEndSample: number;
  codaStartSample: number;
} {
  const sampleRate = 48000;
  const totalSamples = Math.round(0.5 * sampleRate); // 24,000 samples (500ms)
  const pcm = new Float32Array(totalSamples);

  const consonantEndSample = Math.round(0.05 * sampleRate); // 2,400
  const vowelStartSample = consonantEndSample;
  const vowelEndSample = Math.round(0.45 * sampleRate); // 21,600
  const codaStartSample = vowelEndSample;

  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };

  // 1. Unvoiced sibilant/plosive onset [0..50ms) — high-frequency difference noise
  let prevNoise = 0;
  for (let i = 0; i < consonantEndSample; i++) {
    const r = nextRand();
    const hp = r - 0.85 * prevNoise;
    prevNoise = r;
    pcm[i] = hp * 0.16;
  }

  // 2. Voiced vowel nucleus [50ms..450ms) with F1=700Hz, F2=1220Hz harmonic glottal train
  let phase = 0;
  for (let i = vowelStartSample; i < vowelEndSample; i++) {
    const localT = (i - vowelStartSample) / (vowelEndSample - vowelStartSample);
    const env =
      Math.min(1, localT / 0.06) * Math.min(1, (1 - localT) / 0.06) * 0.45;
    phase += f0Hz / sampleRate;
    if (phase >= 1) phase -= 1;

    // Harmonic rich glottal wave (fundamental + 5 harmonics shaped like vowel 'a')
    const w = 2 * Math.PI * phase;
    const sample =
      0.55 * Math.sin(w) +
      0.32 * Math.sin(2 * w + 0.2) +
      0.22 * Math.sin(3 * w + 0.4) +
      0.42 * Math.sin(5 * w) + // near F1 (~610-700 Hz)
      0.25 * Math.sin(9 * w);  // near F2 (~1100-1220 Hz)
    pcm[i] = sample * env;
  }

  // 3. Unvoiced visarga coda [450ms..500ms)
  for (let i = codaStartSample; i < totalSamples; i++) {
    const r = nextRand();
    const hp = r - 0.85 * prevNoise;
    prevNoise = r;
    pcm[i] = hp * 0.12;
  }

  return {
    pcm,
    sampleRate,
    consonantEndSample,
    vowelStartSample,
    vowelEndSample,
    codaStartSample,
  };
}

function measureAutocorrF0(
  pcm: Float32Array,
  startSample: number,
  endSample: number,
  sampleRate = 48000
): number {
  const minLag = Math.floor(sampleRate / 220);
  const maxLag = Math.ceil(sampleRate / 95);
  const winLen = endSample - startSample - maxLag - 2;
  let bestLag = minLag;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < winLen; i++) {
      corr += pcm[startSample + i] * pcm[startSample + i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  return sampleRate / bestLag;
}

describe('48kHz Post-Neural Resonance Modes: Hall Resonance (Mode 1) & Vedic Chant TD-PSOLA (Mode 2)', () => {
  describe('1. YIN Voiced/Unvoiced Separation & Formant-Preserving TD-PSOLA Pitch Locking', () => {
    it('accurately tracks vowel f0 while strictly rejecting unvoiced consonant & visarga segments', () => {
      const synth = buildSyntheticConsonantVowelSyllable48k(121.5);
      const track = estimatePitchTrack48k(synth.pcm, synth.sampleRate, 'male');

      // Onset consonant frames (< 40ms -> frames 0..7) must be strictly unvoiced
      for (let f = 0; f < 7; f++) {
        expect(track.voiced[f]).toBe(0);
      }

      // Coda visarga frames (> 460ms -> frames 92+) must be strictly unvoiced
      for (let f = 93; f < track.voiced.length; f++) {
        expect(track.voiced[f]).toBe(0);
      }

      // Mid-vowel frames (150ms..350ms -> frames 30..70) must be voiced around 121.5 Hz
      let voicedCount = 0;
      for (let f = 30; f <= 70; f++) {
        if (track.voiced[f]) {
          voicedCount++;
          expect(track.f0Hz[f]).toBeGreaterThan(119.5);
          expect(track.f0Hz[f]).toBeLessThan(123.5);
        }
      }
      expect(voicedCount).toBeGreaterThan(35);
      expect(Math.abs(track.medianVoicedHz - 121.5)).toBeLessThan(1.5);
    });

    it('locks a 121.5 Hz Laghu vowel onto the 136.1 Hz Sa tonic while preserving consonant bursts 100% bit-for-bit', () => {
      const synth = buildSyntheticConsonantVowelSyllable48k(121.5);
      const res = applyVoicedTdPsola48k(synth.pcm, synth.sampleRate, 'male', [
        {
          syl: { weight: 'laghu', iast: 'saḥ', vowel: 'a' },
          startSec: 0,
          endSec: 0.5,
        },
      ]);

      expect(res.tonicHz).toBeCloseTo(COSMIC_SA_HZ, 2);

      // Consonant onset [0..40ms] and visarga coda [465ms..500ms] must be 100% bit-for-bit identical!
      const onsetSafeEnd = Math.round(0.04 * synth.sampleRate);
      for (let i = 0; i < onsetSafeEnd; i++) {
        expect(res.pcm[i]).toBe(synth.pcm[i]);
      }
      const codaSafeStart = Math.round(0.465 * synth.sampleRate);
      for (let i = codaSafeStart; i < synth.pcm.length; i++) {
        expect(res.pcm[i]).toBe(synth.pcm[i]);
      }

      // Steady mid-vowel [140ms..360ms] pitch must have shifted from 121.5 Hz -> ~136.1 Hz!
      const measuredOutHz = measureAutocorrF0(
        res.pcm,
        Math.round(0.14 * synth.sampleRate),
        Math.round(0.36 * synth.sampleRate),
        synth.sampleRate
      );
      expect(measuredOutHz).toBeGreaterThan(132.5);
      expect(measuredOutHz).toBeLessThan(139.5);
    });

    it('renders distinct, non-clipping 48kHz stereo fields for Hall (Mode 1) and Vedic Chant (Mode 2)', () => {
      const synth = buildSyntheticConsonantVowelSyllable48k(122.0);
      const timings = [
        {
          syl: { weight: 'guru' as const, iast: 'nām', vowel: 'ā' },
          startSec: 0,
          endSec: 0.5,
        },
      ];

      const hallOut = renderNeuralResonanceStereoPcm(synth.pcm, {
        sampleRate: 48000,
        voice: 'male',
        variant: 'hall',
        timings,
        includeOpeningBell: true,
        tailSec: 0.22,
      });

      const vedicOut = renderNeuralResonanceStereoPcm(synth.pcm, {
        sampleRate: 48000,
        voice: 'male',
        variant: 'vedic-chant',
        timings,
        includeOpeningBell: true,
        tailSec: 0.22,
      });

      expect(hallOut.left.length).toBe(Math.round(0.72 * 48000));
      expect(hallOut.right.length).toBe(hallOut.left.length);
      expect(vedicOut.left.length).toBe(hallOut.left.length);

      let stereoDiffEnergy = 0;
      let modeDiffEnergy = 0;
      for (let i = 0; i < hallOut.left.length; i++) {
        expect(Number.isFinite(hallOut.left[i])).toBe(true);
        expect(Number.isFinite(hallOut.right[i])).toBe(true);
        expect(Number.isFinite(vedicOut.left[i])).toBe(true);
        expect(Math.abs(hallOut.left[i])).toBeLessThanOrEqual(0.9201);
        expect(Math.abs(vedicOut.left[i])).toBeLessThanOrEqual(0.9201);

        const dl = hallOut.left[i] - hallOut.right[i];
        stereoDiffEnergy += dl * dl;

        const dm = hallOut.left[i] - vedicOut.left[i];
        modeDiffEnergy += dm * dm;
      }

      // True stereo decorrelation (sympathetic panning + Hadamard FDN stereo tail)
      expect(stereoDiffEnergy).toBeGreaterThan(0.5);
      // Hall (original prosody) and Vedic Chant (136.1Hz Svara PSOLA) are measurably distinct
      expect(modeDiffEnergy).toBeGreaterThan(1.0);
    });
  });

  describe('2. Engine Integration, Zero-Network Mode Switching & UI Selectability', () => {
    const origWindow = (globalThis as Record<string, unknown>).window;
    const origDocument = (globalThis as Record<string, unknown>).document;
    const origFetch = globalThis.fetch;

    beforeEach(() => {
      (globalThis as Record<string, unknown>).window = {
        location: { protocol: 'https:', hostname: 'bhrum108-sarva-dharani-kosa.static.hf.space' },
        atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
        btoa: (bin: string) => Buffer.from(bin, 'binary').toString('base64'),
        setTimeout: globalThis.setTimeout.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
      };
      (globalThis as Record<string, unknown>).document = {
        head: {},
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        visibilityState: 'visible',
        createElement: vi.fn(() => ({
          href: '',
          download: '',
          rel: '',
          style: {},
          click: vi.fn(),
        })),
      };

      sanskritAudioEngine.stop();
      sanskritAudioEngine.setMode('neural-vits-48k');
      (sanskritAudioEngine as unknown as { neuralVerseCache: Map<string, unknown> }).neuralVerseCache.clear();
      (sanskritAudioEngine as unknown as { exportedPcmCache: Map<string, unknown> }).exportedPcmCache.clear();
      (sanskritAudioEngine as unknown as { pythonBackendAvailable: boolean }).pythonBackendAvailable = false;
    });

    afterEach(() => {
      sanskritAudioEngine.stop();
      vi.restoreAllMocks();
      (globalThis as Record<string, unknown>).window = origWindow;
      (globalThis as Record<string, unknown>).document = origDocument;
      globalThis.fetch = origFetch;
    });

    it('identifies all three neural modes and distinguishes export cache signatures', () => {
      expect(isNeuralEngineMode('neural-vits-48k')).toBe(true);
      expect(isNeuralEngineMode('neural-resonance-hall')).toBe(true);
      expect(isNeuralEngineMode('neural-vedic-chant')).toBe(true);
      expect(isNeuralEngineMode('studio-vocal-chant')).toBe(false);

      expect(getNeuralResonanceVariant('neural-vits-48k')).toBeNull();
      expect(getNeuralResonanceVariant('neural-resonance-hall')).toBe('hall');
      expect(getNeuralResonanceVariant('neural-vedic-chant')).toBe('vedic-chant');

      const sigDry = dharaniAudioExportStore.buildSignature({
        entryId: 'heart',
        voice: 'male',
        rate: 1.0,
        mode: 'neural-vits-48k',
      });
      const sigHall = dharaniAudioExportStore.buildSignature({
        entryId: 'heart',
        voice: 'male',
        rate: 1.0,
        mode: 'neural-resonance-hall',
      });
      const sigVedic = dharaniAudioExportStore.buildSignature({
        entryId: 'heart',
        voice: 'male',
        rate: 1.0,
        mode: 'neural-vedic-chant',
      });

      expect(new Set([sigDry, sigHall, sigVedic]).size).toBe(3);
    });

    it('exports 48kHz stereo WAV/MP3 for both Hall and Vedic Chant while reusing dry neural TTS cache across modes', async () => {
      const synth = buildSyntheticConsonantVowelSyllable48k(124.0);
      const mockWav = encodePcmToWavBytes([synth.pcm], 48000);
      const mockWavB64 = Buffer.from(mockWav).toString('base64');
      let ttsCalls = 0;

      vi.spyOn(browserOnnx, 'isBrowserOnnxReady').mockReturnValue(false);
      vi.spyOn(browserOnnx, 'warmupBrowserOnnxVits').mockResolvedValue();

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/tts')) {
          ttsCalls++;
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({
              sampleRate: 48000,
              durationSec: 0.5,
              voice: 'male',
              model: 'sa_studio_male',
              audioBase64Wav: mockWavB64,
              syllableTimings: [],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const sampleVerses = FIRST_SCREEN_CORPUS[0].verses.slice(0, 1);

      // 1. Export in Mode 1: neural-resonance-hall
      sanskritAudioEngine.setMode('neural-resonance-hall');
      const hallWav = await sanskritAudioEngine.exportDharaniAudio({
        verses: sampleVerses,
        dharaniTitle: '般若心咒殿堂版',
        format: 'wav',
        rate: 1.0,
      });
      expect(ttsCalls).toBe(1);
      expect(hallWav.model).toContain('136.1Hz 殿堂共鸣声场');
      expect(hallWav.blob.size).toBeGreaterThan(80_000); // 2-channel 48kHz 16-bit stereo WAV

      // 2. Switch to Mode 2: neural-vedic-chant -> reuses neuralVerseCache with ZERO extra network calls!
      sanskritAudioEngine.setMode('neural-vedic-chant');
      const vedicWav = await sanskritAudioEngine.exportDharaniAudio({
        verses: sampleVerses,
        dharaniTitle: '般若心咒梵呗版',
        format: 'wav',
        rate: 1.0,
      });
      expect(ttsCalls).toBe(1); // Zero extra cloud TTS call!
      expect(vedicWav.model).toContain('136.1Hz 定调梵呗PSOLA');
      expect(vedicWav.blob.size).toBeGreaterThan(80_000);
    });

    it('renders both selectable neural resonance modes in DharaniReader hero strip and bottom AudioPlayerBar', () => {
      const html = renderToStaticMarkup(React.createElement(App));

      // Bottom AudioPlayerBar <select> options
      expect(html).toContain('value="neural-resonance-hall"');
      expect(html).toContain('48kHz 神经共振 · 殿堂共鸣 (136.1Hz)');
      expect(html).toContain('value="neural-vedic-chant"');
      expect(html).toContain('48kHz 神经共振 · 定调梵呗 (136.1Hz)');

      // Top DharaniReader hero segmented buttons
      expect(html).toContain('神经·殿堂共鸣');
      expect(html).toContain('神经·定调梵呗');
    });
  });
});
