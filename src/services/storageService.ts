/**
 * 本地持久化存储服务 (src/services/storageService.ts)
 * 管理：收藏夹、显示层级开关配置、用户通过四体编译器创建的自定义陀罗尼条目
 */

import { DharaniEntry, DisplayLayerSettings } from '../types/dharani';

const FAVORITES_KEY = 'sarva_dharani_kosa_favorites_v2';
const LAYERS_KEY = 'sarva_dharani_kosa_layers_v2';
const CUSTOM_DHARANIS_KEY = 'sarva_dharani_kosa_custom_entries_v2';

export const DEFAULT_DISPLAY_LAYERS: DisplayLayerSettings = {
  showSiddham: true,
  showDevanagari: true,
  showIast: true,
  showIpa: true,
  showTangTranslit: true,
  showModernPhonetic: true,
  showMeaningZh: true,
  showMeaningEn: true,
  showWordGloss: true,
  showProsodyMeter: true
};

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ['usnisa-vijaya', 'nilakantha', 'prajnaparamita-hrdaya'];
  } catch {
    return ['usnisa-vijaya', 'nilakantha', 'prajnaparamita-hrdaya'];
  }
}

export function saveFavorites(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function loadDisplayLayers(): DisplayLayerSettings {
  try {
    const raw = localStorage.getItem(LAYERS_KEY);
    return raw ? { ...DEFAULT_DISPLAY_LAYERS, ...JSON.parse(raw) } : DEFAULT_DISPLAY_LAYERS;
  } catch {
    return DEFAULT_DISPLAY_LAYERS;
  }
}

export function saveDisplayLayers(layers: DisplayLayerSettings): void {
  try {
    localStorage.setItem(LAYERS_KEY, JSON.stringify(layers));
  } catch {
    // ignore
  }
}

export function loadCustomDharanis(): DharaniEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DHARANIS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomDharanis(entries: DharaniEntry[]): void {
  try {
    localStorage.setItem(CUSTOM_DHARANIS_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}
