/**
 * 梵音宝典 · Sarva-Dhāraṇī-Kośa 领域数据模型与权威文献溯源类型定义
 */

export type DharaniCategoryId =
  | 'all'
  | 'major'
  | 'ten-small'
  | 'avalokitesvara'
  | 'buddhas'
  | 'vidyaraja'
  | 'panca-raksa'
  | 'prajna'
  | 'protection'
  | 'gretil-canon';

export interface WordGloss {
  iast: string;
  devanagari?: string;
  siddham?: string;
  tangTranslit: string;
  yinNote?: string; // 如 "二合" | "引" | "转舌呼" | "去声"
  grammar: string;  // 梵文词根与八格分析，如 "√nam + -as (单数体格/业格)"
  meaningZh: string;
  meaningEn: string;
}

export interface DharaniVerse {
  id: string;
  index: number;
  sectionTag?: string;
  iast: string;
  devanagari?: string;
  siddham?: string;
  ipa?: string;
  tangTranslit: string;
  tangYinNotes?: string[];
  modernPhonetic?: string;
  meaningZh: string;
  meaningEn: string;
  words: WordGloss[];
}

export interface AuthoritativeSourceMetadata {
  cbetaXmlId: string;
  cbetaRawUrl: string;
  taishoVolPage: string;
  ancientTranslator: string;
  gretilId?: string;
  gretilRawUrl?: string;
  sanskritEditionCitation: string;
  tangPhoneticNotes: string[];
  rawExcerpt?: string;
}

export interface DharaniEntry {
  id: string;
  titleZh: string;
  titleSaIast: string;
  titleSaDeva: string;
  titleSaSiddham?: string;
  titleEn: string;
  category: Exclude<DharaniCategoryId, 'all'>;
  deityFocus: string;
  seedSyllableIast: string;
  seedSyllableSiddham: string;
  seedSyllableDeva: string;
  seedSyllableZh: string;
  summaryZh: string;
  ritualBenefitsZh: string;
  sourceMeta: AuthoritativeSourceMetadata;
  verses: DharaniVerse[];
}

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

export type ActiveTabView =
  | 'reader'
  | 'taisho-explorer'
  | 'phonetics-academy'
  | 'custom-compiler';
