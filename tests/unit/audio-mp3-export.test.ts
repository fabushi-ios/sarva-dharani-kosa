import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  buildDharaniAudioFileName,
  encodePcmToMp3Bytes,
  encodePcmToWavBytes,
  sanitizeDharaniFileBaseName,
  splitIastIntoExportSubclauses,
} from '../../src/services/audio/audioExportEncoder';
import * as browserOnnx from '../../src/services/audio/browserOnnxTtsEngine';
import { sanskritAudioEngine } from '../../src/services/audio/sanskritAudioEngine';
import { dharaniAudioExportStore } from '../../src/services/audio/dharaniAudioExportStore';
import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';
import { App } from '../../src/App';

function buildSineWaveWav48kBytes(numSamples = 9600, freqHz = 440): Uint8Array {
  const sampleRate = 48000;
  const pcm = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    pcm[i] = Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * 0.5;
  }
  return encodePcmToWavBytes([pcm], sampleRate);
}

describe('Dharani MP3 / WAV Audio Export, Exact Dharani Naming & Dual UI Entry Points', () => {
  describe('1. Dharani-Name Filename Builder & Sanitizer', () => {
    it('names exported MP3 and WAV files identically to the Dharani title', () => {
      const mahaTitle = '千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼（大悲咒全本）';
      expect(buildDharaniAudioFileName(mahaTitle, 'mp3')).toBe(`${mahaTitle}.mp3`);
      expect(buildDharaniAudioFileName(mahaTitle, 'wav')).toBe(`${mahaTitle}.wav`);

      const heartTitle = '般若波罗蜜多心经根本真言';
      expect(buildDharaniAudioFileName(heartTitle)).toBe(`${heartTitle}.mp3`);
    });

    it('preserves all first-screen corpus Dharani names and replaces only OS-illegal path characters', () => {
      expect(FIRST_SCREEN_CORPUS.length).toBeGreaterThan(0);
      for (const entry of FIRST_SCREEN_CORPUS) {
        const mp3Name = buildDharaniAudioFileName(entry.titleZh, 'mp3');
        expect(mp3Name.endsWith('.mp3')).toBe(true);
        expect(mp3Name).not.toMatch(/[\\/:*?"<>|]/);
        expect(new TextEncoder().encode(mp3Name).byteLength).toBeLessThanOrEqual(255);
        if (
          !/[\\/:*?"<>|]/.test(entry.titleZh) &&
          new TextEncoder().encode(entry.titleZh.trim()).byteLength <= 248
        ) {
          expect(mp3Name).toBe(`${entry.titleZh.trim()}.mp3`);
        }
      }

      const titleWithSlash = '佛顶尊胜陀罗尼 / Uṣṇīṣavijayā: 心真言';
      expect(buildDharaniAudioFileName(titleWithSlash, 'mp3')).toBe(
        '佛顶尊胜陀罗尼 · Uṣṇīṣavijayā· 心真言.mp3'
      );
    });

    it('enforces <= 248 UTF-8 bytes on ultra-long titles (<= 252 bytes with .mp3) without splitting multi-byte characters', () => {
      const veryLongTitle = '佛说大吉祥陀罗尼'.repeat(20);
      const base = sanitizeDharaniFileBaseName(veryLongTitle);
      const byteLen = new TextEncoder().encode(base).byteLength;
      expect(byteLen).toBeLessThanOrEqual(248);
      expect(byteLen).toBeGreaterThan(200);
      expect(base.includes('\uFFFD')).toBe(false);
    });
  });

  describe('2. Long-Verse Clause Splitting & 48,000 Hz MP3 / WAV Encoding', () => {
    it('splits long multi-clause Sanskrit verses along daṇḍas and words to prevent TTS gateway timeouts', () => {
      const longVerse = Array.from(
        { length: 12 },
        (_, idx) => `namo ratnatrayāya namaḥ āryāvalokiteśvarāya bodhisattvāya ${idx + 1} ।`
      ).join(' ');
      expect(longVerse.length).toBeGreaterThan(600);

      const subclauses = splitIastIntoExportSubclauses(longVerse, 220);
      expect(subclauses.length).toBeGreaterThanOrEqual(3);
      for (const clause of subclauses) {
        expect(clause.length).toBeLessThanOrEqual(220);
        expect(clause.length).toBeGreaterThan(0);
      }
    });

    it('encodes 48,000 Hz mono and stereo PCM into valid MPEG-1 Layer III (.mp3) verified by ffprobe', async () => {
      const sampleRate = 48000;
      const numSamples = 24000; // 0.5 sec at 48kHz
      const left = new Float32Array(numSamples);
      const right = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        left[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.6;
        right[i] = Math.sin((2 * Math.PI * 554.37 * i) / sampleRate) * 0.5;
      }

      const mp3Mono = await encodePcmToMp3Bytes([left], sampleRate, 192);
      expect(mp3Mono.byteLength).toBeGreaterThan(4000);

      const mp3Stereo = await encodePcmToMp3Bytes([left, right], sampleRate, 192);
      expect(mp3Stereo.byteLength).toBeGreaterThan(4000);

      if (fs.existsSync('/usr/bin/ffprobe')) {
        const tmpFile = path.join(os.tmpdir(), `sarva-test-${Date.now()}.mp3`);
        fs.writeFileSync(tmpFile, mp3Mono);
        try {
          const out = execFileSync(
            '/usr/bin/ffprobe',
            [
              '-v',
              'error',
              '-show_entries',
              'stream=codec_name,sample_rate,channels',
              '-of',
              'json',
              tmpFile,
            ],
            { encoding: 'utf8' }
          );
          const parsed = JSON.parse(out) as {
            streams: Array<{ codec_name: string; sample_rate: string; channels: number }>;
          };
          expect(parsed.streams[0]?.codec_name).toBe('mp3');
          expect(parsed.streams[0]?.sample_rate).toBe('48000');
          expect(parsed.streams[0]?.channels).toBe(1);
        } finally {
          fs.rmSync(tmpFile, { force: true });
        }
      }
    });
  });

  describe('3. End-to-End Engine Synthesis, PCM Cache Reuse & Browser Download Trigger', () => {
    const origWindow = (globalThis as Record<string, unknown>).window;
    const origDocument = (globalThis as Record<string, unknown>).document;
    const origFetch = globalThis.fetch;

    let clickedDownloads: Array<{ download: string; href: string }> = [];

    beforeEach(() => {
      clickedDownloads = [];

      const mockDoc = {
        head: {},
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        visibilityState: 'visible',
        createElement: vi.fn((tag: string) => {
          if (tag === 'a') {
            const anchor = {
              href: '',
              download: '',
              rel: '',
              style: {} as Record<string, string>,
              parentNode: null as unknown,
              click: vi.fn(() => {
                clickedDownloads.push({
                  download: anchor.download,
                  href: anchor.href,
                });
              }),
            };
            return anchor;
          }
          return {};
        }),
      };

      (globalThis as Record<string, unknown>).window = {
        location: { protocol: 'https:', hostname: 'bhrum108-sarva-dharani-kosa.static.hf.space' },
        atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
        btoa: (bin: string) => Buffer.from(bin, 'binary').toString('base64'),
        setTimeout: globalThis.setTimeout.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
      };
      (globalThis as Record<string, unknown>).document = mockDoc;

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

    it('synthesizes multi-verse Dharani into MP3 named after the Dharani, triggers browser download, and reuses PCM cache for WAV & repeat clicks', async () => {
      const mockWav = buildSineWaveWav48kBytes(9600, 396);
      const mockWavB64 = Buffer.from(mockWav).toString('base64');
      let ttsCallCount = 0;

      vi.spyOn(browserOnnx, 'isBrowserOnnxReady').mockReturnValue(false);
      vi.spyOn(browserOnnx, 'warmupBrowserOnnxVits').mockResolvedValue();

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/tts')) {
          ttsCallCount++;
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({
              sampleRate: 48000,
              durationSec: 0.2,
              voice: 'male',
              model: 'sa_studio_male',
              audioBase64Wav: mockWavB64,
              syllableTimings: [],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

      const targetEntry = FIRST_SCREEN_CORPUS[0];
      const progressPercents: number[] = [];

      const mp3Export = await sanskritAudioEngine.exportDharaniAudio({
        verses: targetEntry.verses.slice(0, 2),
        dharaniTitle: targetEntry.titleZh,
        format: 'mp3',
        rate: 1.0,
        onProgress: (p) => progressPercents.push(p.percent),
      });

      expect(mp3Export.format).toBe('mp3');
      expect(mp3Export.mimeType).toBe('audio/mpeg');
      expect(mp3Export.fileName).toBe(`${targetEntry.titleZh}.mp3`);
      expect(mp3Export.blob.size).toBeGreaterThan(2000);
      expect(progressPercents.length).toBeGreaterThanOrEqual(2);
      expect(progressPercents[progressPercents.length - 1]).toBe(100);
      expect(ttsCallCount).toBeGreaterThanOrEqual(1);

      // Exporting WAV for the same verses/voice/rate reuses exportedPcmCache with ZERO extra TTS requests
      const callsBeforeWav = ttsCallCount;
      const wavExport = await sanskritAudioEngine.exportDharaniAudio({
        verses: targetEntry.verses.slice(0, 2),
        dharaniTitle: targetEntry.titleZh,
        format: 'wav',
        rate: 1.0,
      });
      expect(ttsCallCount).toBe(callsBeforeWav);
      expect(wavExport.format).toBe('wav');
      expect(wavExport.mimeType).toBe('audio/wav');
      expect(wavExport.fileName).toBe(`${targetEntry.titleZh}.wav`);

      // Store coordinator triggers anchor download with exact Dharani filename on first and cached second click
      const storeResult1 = await dharaniAudioExportStore.downloadAudio({
        entryId: `test-${targetEntry.id}`,
        dharaniTitle: targetEntry.titleZh,
        verses: targetEntry.verses.slice(0, 2),
        format: 'mp3',
        rate: 1.0,
        voice: 'male',
        mode: 'neural-vits-48k',
      });
      expect(storeResult1?.fileName).toBe(`${targetEntry.titleZh}.mp3`);
      expect(clickedDownloads).toHaveLength(1);
      expect(clickedDownloads[0]?.download).toBe(`${targetEntry.titleZh}.mp3`);

      const storeResult2 = await dharaniAudioExportStore.downloadAudio({
        entryId: `test-${targetEntry.id}`,
        dharaniTitle: targetEntry.titleZh,
        verses: targetEntry.verses.slice(0, 2),
        format: 'mp3',
        rate: 1.0,
        voice: 'male',
        mode: 'neural-vits-48k',
      });
      expect(storeResult2?.fileName).toBe(`${targetEntry.titleZh}.mp3`);
      expect(clickedDownloads).toHaveLength(2);
      expect(clickedDownloads[1]?.download).toBe(`${targetEntry.titleZh}.mp3`);
    });
  });

  describe('4. SSR UI Verification of Reader Hero & Bottom Recitation Bar Download Entry Points', () => {
    it('renders MP3 and WAV download buttons in both DharaniReader and sticky bottom AudioPlayerBar', () => {
      const html = renderToStaticMarkup(React.createElement(App));
      const activeTitle = FIRST_SCREEN_CORPUS[0].titleZh;

      // Top DharaniReader hero download entry points
      expect(html).toContain('id="hero-export-mp3-btn"');
      expect(html).toContain('下载 MP3 音频');
      expect(html).toContain('id="hero-export-wav-btn"');

      // Sticky bottom recitation bar (AudioPlayerBar) download entry points
      expect(html).toContain('id="audio-bar-download-mp3-btn"');
      expect(html).toContain('下载音频 (MP3)');
      expect(html).toContain('id="audio-bar-download-wav-btn"');

      // Exact Dharani filename surfaced in button titles
      expect(html).toContain(`${activeTitle}.mp3`);
    });
  });
});
