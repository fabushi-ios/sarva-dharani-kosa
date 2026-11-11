import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';

const BOOKMARKS_KEY = 'sarva_dharani_bookmarks_v1';
const CUSTOM_DHARANIS_KEY = 'sarva_dharani_custom_entries_v1';
const SCRIPT_CONFIG_KEY = 'sarva_dharani_script_config_v1';
const THEME_KEY = 'sarva_dharani_theme_v1';

export const DEFAULT_SCRIPT_CONFIG: ScriptVisibilityConfig = {
  showFullCombinedSummary: true,
  showDevanagari: true,
  showSiddham: true,
  showIast: true,
  showIpa: true,
  showProsodyMeter: true,
  showClassicalZh: true,
  showModernPhoneticZh: true,
  showPhoneticIastBracket: false,
  showMeaningZh: true,
  showMeaningEn: true,
  showWordGloss: true,
  hideDerivedReference: false,
};

export function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveBookmarks(ids: Set<string>): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore storage errors
  }
}

export function loadCustomDharanis(): DharaniEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DHARANIS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
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

export function loadScriptConfig(): ScriptVisibilityConfig {
  try {
    const raw = localStorage.getItem(SCRIPT_CONFIG_KEY);
    if (!raw) return DEFAULT_SCRIPT_CONFIG;
    return { ...DEFAULT_SCRIPT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCRIPT_CONFIG;
  }
}

export function saveScriptConfig(config: ScriptVisibilityConfig): void {
  try {
    localStorage.setItem(SCRIPT_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const val = localStorage.getItem(THEME_KEY);
    return val === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
