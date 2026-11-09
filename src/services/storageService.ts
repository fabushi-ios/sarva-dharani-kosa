/**
 * Persistent Local Storage Service (`src/services/storageService.ts`)
 * Manages user-configured 10-layer display toggles, bookmarked Dhāraṇīs,
 * and custom compiled Sanskrit mantras.
 */

import { DharaniEntry, DisplayLayerConfig } from '../types/dharani';

const LAYER_CONFIG_KEY = 'sarva_dharani_kosa_layers_v3';
const BOOKMARKS_KEY = 'sarva_dharani_kosa_bookmarks_v3';
const CUSTOM_DHARANIS_KEY = 'sarva_dharani_kosa_custom_entries_v3';

export const DEFAULT_DISPLAY_LAYERS: DisplayLayerConfig = {
  siddham: true,
  devanagari: true,
  iast: true,
  slp1: true,
  ipa: true,
  modernChinese: true,
  tangSiddham: true,
  chandasMeter: true,
  wordGloss: true,
  chineseMeaning: true,
};

export function loadDisplayLayerConfig(): DisplayLayerConfig {
  try {
    const raw = window.localStorage.getItem(LAYER_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_LAYERS };
    return { ...DEFAULT_DISPLAY_LAYERS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DISPLAY_LAYERS };
  }
}

export function saveDisplayLayerConfig(config: DisplayLayerConfig): void {
  try {
    window.localStorage.setItem(LAYER_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore storage quota errors
  }
}

export function loadBookmarkedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return ['heart-sutra-mantra', 'mahakaruna-dharani', 'usnisavijaya-dharani'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return ['heart-sutra-mantra', 'mahakaruna-dharani', 'usnisavijaya-dharani'];
  }
}

export function saveBookmarkedIds(ids: string[]): void {
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function loadCustomDharanis(): DharaniEntry[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_DHARANIS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomDharanis(entries: DharaniEntry[]): void {
  try {
    window.localStorage.setItem(CUSTOM_DHARANIS_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}
