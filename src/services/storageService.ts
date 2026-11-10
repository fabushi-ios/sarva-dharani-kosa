/**
 * 本地持久化存储服务 (src/services/storageService.ts)
 * 管理：收藏夹、十维显示层级开关配置、用户通过四体编译器创建的自定义陀罗尼条目
 */

import type { DharaniItem } from '../types/dharani';

export interface DisplayLayerSettings {
  showSiddham: boolean;
  showDevanagari: boolean;
  showIast: boolean;
  showIpa: boolean;
  showTangTranslit: boolean;
  showModernPhonetic: boolean;
  showMeaningZh: boolean;
  showMeaningEn: boolean;
  showWordGloss: boolean;
  showProsodyMeter: boolean;
}

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
  if (typeof window === 'undefined' || !window.localStorage) {
    return ['nilakantha-dharani', 'usnisavijaya-dharani', 'prajnaparamita-hrdaya-sutra'];
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw
      ? JSON.parse(raw)
      : ['nilakantha-dharani', 'usnisavijaya-dharani', 'prajnaparamita-hrdaya-sutra'];
  } catch {
    return ['nilakantha-dharani', 'usnisavijaya-dharani', 'prajnaparamita-hrdaya-sutra'];
  }
}

export function saveFavorites(ids: string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function loadDisplayLayers(): DisplayLayerSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_DISPLAY_LAYERS;
  }
  try {
    const raw = window.localStorage.getItem(LAYERS_KEY);
    return raw ? { ...DEFAULT_DISPLAY_LAYERS, ...JSON.parse(raw) } : DEFAULT_DISPLAY_LAYERS;
  } catch {
    return DEFAULT_DISPLAY_LAYERS;
  }
}

export function saveDisplayLayers(layers: DisplayLayerSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LAYERS_KEY, JSON.stringify(layers));
  } catch {
    // ignore
  }
}

export function loadCustomDharanis(): DharaniItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_DHARANIS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomDharanis(entries: DharaniItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(CUSTOM_DHARANIS_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}
