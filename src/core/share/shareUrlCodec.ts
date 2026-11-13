/**
 * src/core/share/shareUrlCodec.ts
 *
 * Builds & parses QR-code deep links so scanning a shared Dhāraṇī poster jumps
 * directly to the corresponding scripture & verse and starts 48kHz audio playback.
 */

import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import type {
  AudioEngineMode,
  SanskritVoiceGender,
} from '../../services/audio/sanskritAudioEngine';
import {
  iastToDevanagari,
  iastToSiddham,
} from '../sanskrit/transliterator';
import { analyzeSanskritProsody } from '../sanskrit/prosody';
import { enrichSyllablesWithPhonetics } from '../sanskrit/phoneticMapper';

export interface ShareDeepLinkPayload {
  entryId: string;
  listen: boolean;
  verseIndex: number | null;
  singleVerse: boolean;
  voice?: SanskritVoiceGender;
  mode?: AudioEngineMode;
  customTitleZh?: string;
  customIast?: string;
  customDeityZh?: string;
}

const VALID_MODES = new Set<AudioEngineMode>([
  'neural-vits-48k',
  'neural-resonance-hall',
  'neural-vedic-chant',
  'studio-vocal-chant',
  'mandarin-phonetic-guide',
  'indic-devanagari-tts',
]);

export function getDefaultShareBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://bhrum108-sarva-dharani-kosa.static.hf.space/';
  }
  return `${window.location.origin}${window.location.pathname}`;
}

export function buildDharaniShareUrl(params: {
  baseUrl?: string;
  entry: DharaniEntry;
  listen?: boolean;
  startVerseIndex?: number | null;
  singleVerse?: boolean;
  voice?: SanskritVoiceGender;
  mode?: AudioEngineMode;
}): string {
  const rawBase = (params.baseUrl || getDefaultShareBaseUrl()).trim();
  let urlObj: URL;
  try {
    urlObj = new URL(rawBase);
  } catch {
    urlObj = new URL(getDefaultShareBaseUrl());
  }

  // Clear stale share parameters before encoding
  urlObj.searchParams.delete('dharani');
  urlObj.searchParams.delete('listen');
  urlObj.searchParams.delete('v');
  urlObj.searchParams.delete('single');
  urlObj.searchParams.delete('voice');
  urlObj.searchParams.delete('mode');
  urlObj.searchParams.delete('ct');
  urlObj.searchParams.delete('ci');
  urlObj.searchParams.delete('cd');

  urlObj.searchParams.set('dharani', params.entry.id);

  if (params.listen !== false) {
    urlObj.searchParams.set('listen', '1');
  }

  if (typeof params.startVerseIndex === 'number' && params.startVerseIndex > 0) {
    urlObj.searchParams.set('v', String(params.startVerseIndex));
  }

  if (params.singleVerse) {
    urlObj.searchParams.set('single', '1');
  }

  if (params.voice === 'female') {
    urlObj.searchParams.set('voice', 'female');
  }

  if (params.mode && params.mode !== 'neural-vits-48k') {
    urlObj.searchParams.set('mode', params.mode);
  }

  // If sharing a local user-compiled custom mantra, embed compact IAST so anyone scanning
  // the QR code on another phone can still view and listen to the mantra immediately.
  if (params.entry.categoryId === 'custom' && params.entry.verses.length > 0) {
    const joinedIast = params.entry.verses
      .map((v) => v.iast.trim())
      .filter(Boolean)
      .join(' | ');
    if (joinedIast.length > 0 && joinedIast.length <= 150) {
      urlObj.searchParams.set('ct', params.entry.titleZh.slice(0, 28));
      urlObj.searchParams.set('ci', joinedIast);
    }
  }

  return urlObj.toString();
}

export function parseShareDeepLinkFromSearch(search: string): ShareDeepLinkPayload | null {
  if (!search) return null;
  const sp = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const entryId = (sp.get('dharani') || '').trim();
  const customIast = (sp.get('ci') || '').trim();
  if (!entryId && !customIast) return null;

  const listenRaw = sp.get('listen') ?? sp.get('autoplay');
  const listen = listenRaw === '1' || listenRaw === 'true';

  const vRaw = sp.get('v') ?? sp.get('verse');
  let verseIndex: number | null = null;
  if (vRaw !== null && vRaw.trim() !== '') {
    const parsed = Number.parseInt(vRaw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      verseIndex = parsed;
    }
  }

  const singleVerse = sp.get('single') === '1';
  const voiceParam = sp.get('voice');
  const voice: SanskritVoiceGender | undefined =
    voiceParam === 'female' ? 'female' : voiceParam === 'male' ? 'male' : undefined;

  const modeParam = sp.get('mode') as AudioEngineMode | null;
  const mode: AudioEngineMode | undefined =
    modeParam && VALID_MODES.has(modeParam) ? modeParam : undefined;

  const customTitleZh = (sp.get('ct') || '').trim() || undefined;
  const customDeityZh = (sp.get('cd') || '').trim() || undefined;

  return {
    entryId: entryId || `shared-custom-${Date.now()}`,
    listen,
    verseIndex,
    singleVerse,
    voice,
    mode,
    customTitleZh,
    customIast: customIast || undefined,
    customDeityZh,
  };
}

export function synthesizeEntryFromCustomDeepLink(
  payload: ShareDeepLinkPayload
): DharaniEntry | null {
  if (!payload.customIast) return null;

  const rawLines = payload.customIast
    .split(/\s*\|\s*(?=[a-zA-ZāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ])/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const lines = rawLines.length > 0 ? rawLines : [payload.customIast];

  const verses: DharaniVerse[] = lines.map((lineIast, idx) => {
    const syls = enrichSyllablesWithPhonetics(analyzeSanskritProsody(lineIast));
    const modernPhoneticZh = syls.map((s) => s.modernZh).join(' ');
    const classicalTranslitZh = syls.map((s) => s.classicalZh).join('');
    return {
      id: `${payload.entryId}-v-${idx + 1}`,
      index: idx + 1,
      iast: lineIast,
      siddhamOriginal: iastToSiddham(lineIast),
      devanagariOriginal: iastToDevanagari(lineIast),
      classicalTranslitZh,
      modernPhoneticZh,
      meaningZh: '扫码分享自订编译陀罗尼真言',
      meaningEn: 'Shared Sanskrit Dhāraṇī Mantra',
      words: [],
    };
  });

  return {
    id: payload.entryId,
    titleZh: payload.customTitleZh || '扫码分享梵文真言',
    titleSanskritIast: lines[0] || 'Sanskrit Dhāraṇī',
    titleEnglish: 'Shared Sanskrit Mantra',
    categoryId: 'custom',
    taishoNo: '扫码直达',
    translatorZh: '梵音宝典实时编译分享',
    sutraSourceZh: '二维码分享自定义编译真言',
    deityZh: payload.customDeityZh || '诸佛菩萨总持',
    meritsAndSummaryZh: '通过梵音宝典手机分享海报二维码直达，支持 48,000 Hz 神经梵音在线持诵聆听。',
    recitationTipsZh: '点击上方播放按钮或任意音节卡片即可聆听标准古典梵语发音。',
    provenance: {
      sourceType: 'LOCAL-USER-DRAFT',
      editionCitation: 'Sarva-Dhāraṇī-Kośa QR Shared Edition',
      manuscriptNotesZh: '由分享海报二维码还原之梵文真言条目。',
    },
    verses,
  };
}
