/**
 * src/services/audio/dharaniAudioExportStore.ts
 *
 * Shared reactive coordinator for Dharani MP3 & WAV audio export across
 * `DharaniReader` (top hero bar) and `AudioPlayerBar` (bottom recitation bar).
 */
import { useState, useEffect, useCallback } from 'react';
import type { DharaniVerse } from '../../types/kosaTypes';
import {
  buildDharaniAudioFileName,
  triggerBrowserAudioDownload,
  type AudioExportFormat,
  type AudioExportProgress,
  type ExportedDharaniAudio,
} from './audioExportEncoder';
import { sanskritAudioEngine } from './sanskritAudioEngine';

export interface ActiveAudioExportJob {
  entryId: string;
  dharaniTitle: string;
  format: AudioExportFormat;
  progress: AudioExportProgress;
}

interface DharaniAudioExportSnapshot {
  activeJob: ActiveAudioExportJob | null;
  version: number;
}

type ExportListener = (snapshot: DharaniAudioExportSnapshot) => void;

class DharaniAudioExportStore {
  private activeJob: ActiveAudioExportJob | null = null;
  private activeAbortController: AbortController | null = null;
  private version = 0;
  private listeners: Set<ExportListener> = new Set();

  private cacheBySignature: Map<
    string,
    Partial<Record<AudioExportFormat, ExportedDharaniAudio>>
  > = new Map();
  private latestFormatByEntryId: Map<string, AudioExportFormat> = new Map();
  private errorByEntryId: Map<string, string> = new Map();

  public subscribe(listener: ExportListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): DharaniAudioExportSnapshot {
    return {
      activeJob: this.activeJob ? { ...this.activeJob } : null,
      version: this.version,
    };
  }

  private notify() {
    this.version++;
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  public buildSignature(params: {
    entryId: string;
    voice: string;
    rate: number;
    mode: string;
  }): string {
    const modeBucket =
      params.mode === 'studio-vocal-chant'
        ? 'chant'
        : params.mode === 'neural-resonance-hall'
          ? 'neural-hall'
          : params.mode === 'neural-vedic-chant'
            ? 'neural-vedic'
            : 'neural';
    return `${params.entryId}|${params.voice}|${params.rate.toFixed(2)}|${modeBucket}`;
  }

  public getCachedExports(signature: string): {
    mp3?: ExportedDharaniAudio;
    wav?: ExportedDharaniAudio;
  } {
    const rec = this.cacheBySignature.get(signature);
    return {
      mp3: rec?.mp3,
      wav: rec?.wav,
    };
  }

  public getLatestExportForEntry(
    entryId: string,
    signature: string
  ): ExportedDharaniAudio | null {
    const rec = this.cacheBySignature.get(signature);
    if (!rec) return null;
    const preferred = this.latestFormatByEntryId.get(entryId);
    if (preferred && rec[preferred]) {
      return rec[preferred] ?? null;
    }
    return rec.mp3 ?? rec.wav ?? null;
  }

  public getErrorForEntry(entryId: string): string | null {
    return this.errorByEntryId.get(entryId) ?? null;
  }

  private storeExportedAudio(signature: string, exported: ExportedDharaniAudio) {
    if (!this.cacheBySignature.has(signature) && this.cacheBySignature.size >= 8) {
      const oldestKey = this.cacheBySignature.keys().next().value;
      if (oldestKey) {
        const evicted = this.cacheBySignature.get(oldestKey);
        if (evicted && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          if (evicted.mp3?.url) URL.revokeObjectURL(evicted.mp3.url);
          if (evicted.wav?.url) URL.revokeObjectURL(evicted.wav.url);
        }
        this.cacheBySignature.delete(oldestKey);
      }
    }
    const existing = this.cacheBySignature.get(signature) ?? {};
    const prevSameFmt = existing[exported.format];
    if (
      prevSameFmt?.url &&
      prevSameFmt.url !== exported.url &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      URL.revokeObjectURL(prevSameFmt.url);
    }
    existing[exported.format] = exported;
    this.cacheBySignature.set(signature, existing);
  }

  public async downloadAudio(params: {
    entryId: string;
    dharaniTitle: string;
    verses: DharaniVerse[];
    format?: AudioExportFormat;
    rate: number;
    voice: string;
    mode: string;
  }): Promise<ExportedDharaniAudio | null> {
    const format: AudioExportFormat = params.format === 'wav' ? 'wav' : 'mp3';
    const signature = this.buildSignature(params);
    const exactFileName = buildDharaniAudioFileName(params.dharaniTitle, format);

    // Synchronous 0ms download fast-path if this exact audio is already synthesized
    const cached = this.cacheBySignature.get(signature)?.[format];
    if (cached) {
      const updatedCached: ExportedDharaniAudio =
        cached.fileName === exactFileName
          ? cached
          : { ...cached, fileName: exactFileName, dharaniTitle: params.dharaniTitle };
      this.storeExportedAudio(signature, updatedCached);
      this.latestFormatByEntryId.set(params.entryId, format);
      this.errorByEntryId.delete(params.entryId);
      triggerBrowserAudioDownload(
        updatedCached.blob,
        updatedCached.fileName,
        updatedCached.url
      );
      this.notify();
      return updatedCached;
    }

    // Ignore duplicate click on the exact same in-flight job
    if (
      this.activeJob &&
      this.activeJob.entryId === params.entryId &&
      this.activeJob.format === format
    ) {
      return null;
    }

    // Cancel any stale job from another entry/format
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    this.activeAbortController = ctrl;
    this.errorByEntryId.delete(params.entryId);
    this.activeJob = {
      entryId: params.entryId,
      dharaniTitle: params.dharaniTitle,
      format,
      progress: {
        phase: 'synthesizing',
        completedChunks: 0,
        totalChunks: Math.max(1, params.verses.length),
        percent: 3,
      },
    };
    this.notify();

    try {
      const exported = await sanskritAudioEngine.exportDharaniAudio({
        verses: params.verses,
        dharaniTitle: params.dharaniTitle,
        format,
        rate: params.rate,
        signal: ctrl?.signal,
        onProgress: (progress) => {
          if (ctrl?.signal.aborted) return;
          if (this.activeJob && this.activeJob.entryId === params.entryId) {
            this.activeJob = {
              ...this.activeJob,
              progress,
            };
            this.notify();
          }
        },
      });

      if (ctrl?.signal.aborted) {
        return null;
      }

      this.storeExportedAudio(signature, exported);
      this.latestFormatByEntryId.set(params.entryId, format);
      this.activeJob = null;
      this.activeAbortController = null;
      this.notify();

      triggerBrowserAudioDownload(exported.blob, exported.fileName, exported.url);
      return exported;
    } catch (err) {
      if (ctrl?.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return null;
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : '梵音合成服务暂时繁忙，请稍后重试';
      this.errorByEntryId.set(params.entryId, `音频导出未完成：${message}`);
      if (this.activeJob?.entryId === params.entryId) {
        this.activeJob = null;
        this.activeAbortController = null;
      }
      this.notify();
      return null;
    }
  }
}

export const dharaniAudioExportStore = new DharaniAudioExportStore();

export function useDharaniAudioExport(params: {
  entryId: string;
  dharaniTitle: string;
  verses: DharaniVerse[];
  rate: number;
  voice: string;
  mode: string;
}) {
  const [, setVersion] = useState<number>(0);

  useEffect(() => {
    return dharaniAudioExportStore.subscribe((snap) => {
      setVersion(snap.version);
    });
  }, []);

  const signature = dharaniAudioExportStore.buildSignature({
    entryId: params.entryId,
    voice: params.voice,
    rate: params.rate,
    mode: params.mode,
  });

  const snap = dharaniAudioExportStore.getSnapshot();
  const isExportingThisEntry = snap.activeJob?.entryId === params.entryId;
  const activeProgress = isExportingThisEntry ? snap.activeJob?.progress ?? null : null;
  const exportingFormat = isExportingThisEntry ? snap.activeJob?.format ?? null : null;

  const cached = dharaniAudioExportStore.getCachedExports(signature);
  const latestExported = dharaniAudioExportStore.getLatestExportForEntry(
    params.entryId,
    signature
  );
  const exportError = dharaniAudioExportStore.getErrorForEntry(params.entryId);

  const triggerDownload = useCallback(
    (format: AudioExportFormat = 'mp3') => {
      void dharaniAudioExportStore.downloadAudio({
        entryId: params.entryId,
        dharaniTitle: params.dharaniTitle,
        verses: params.verses,
        format,
        rate: params.rate,
        voice: params.voice,
        mode: params.mode,
      });
    },
    [
      params.entryId,
      params.dharaniTitle,
      params.verses,
      params.rate,
      params.voice,
      params.mode,
    ]
  );

  return {
    isExporting: isExportingThisEntry,
    exportingFormat,
    progress: activeProgress,
    exportedMp3: cached.mp3 ?? null,
    exportedWav: cached.wav ?? null,
    latestExported,
    exportError,
    expectedMp3FileName: buildDharaniAudioFileName(params.dharaniTitle, 'mp3'),
    expectedWavFileName: buildDharaniAudioFileName(params.dharaniTitle, 'wav'),
    triggerDownload,
  };
}
