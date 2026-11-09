/**
 * Domain Schema & Authoritative Provenance Types for 梵音宝典 · Sarva-Dhāraṇī-Kośa
 * Covers 10-layer synchronized interlinear display, Plan 1 48kHz neural VITS audio,
 * CBETA #SD-* Siddhaṃ / <cb:tt> Tang phonetic notes, GRETIL Sanskrit manuscripts,
 * and Taishō (T18–T21) Esoteric Canon metadata.
 */

export type DharaniCategory =
  | 'all'
  | 'four-great'
  | 'ten-small'
  | 'buddhas-bodhisattvas'
  | 'gretil-manuscripts'
  | 'custom';

export type ActiveAppView =
  | 'reader'
  | 'academy'
  | 'engine-v3'
  | 'cbeta-taisho'
  | 'compiler';

export type AudioEngineMode =
  | 'neural-auto'
  | 'neural-tts'
  | 'legacy-tts';

export type NeuralVoice = 'male' | 'female' | 'mobile';

export type ChandasMeter = '—' | '⏑' | '';

export interface DisplayLayerConfig {
  siddham: boolean;         // 1. 悉昙梵字 (Siddhaṃ Unicode U+11580–U+115FF)
  devanagari: boolean;      // 2. 天城体梵文 (Devanāgarī)
  iast: boolean;            // 3. 国际梵文转写 (IAST Romanization)
  slp1: boolean;            // 4. 声学无损编码 (SLP1 Phonemic Key)
  ipa: boolean;             // 5. 国际音标 (IPA Phonetic Transcription)
  modernChinese: boolean;   // 6. 现代声学谐音助读 (Modern Acoustic Guide)
  tangSiddham: boolean;     // 7. 唐宋古音译与夹注 (Traditional Tang Siddhaṃ)
  chandasMeter: boolean;    // 8. 声明学轻重音律 (Guru — 2拍 / Laghu ⏑ 1拍)
  wordGloss: boolean;       // 9. 逐词词根与八格语法解析 (Word-by-Word Grammar/Lexicon)
  chineseMeaning: boolean;  // 10. 汉英经文意译 (Chinese & English Meaning)
}

export interface SyllableToken {
  index: number;
  slp1: string;
  iast: string;
  deva: string;
  siddham: string;
  ipa: string;
  modern: string;
  trad: string;
  meter: ChandasMeter;
  onset: string;
  vowel: string;
  mod: string;
  coda: string;
  vargaNote: string;
  tangNote?: string;
  cbetaGaijiId?: string;
  isSymbol?: boolean;
}

export interface WordGlossItem {
  iast: string;
  deva: string;
  siddham: string;
  slp1: string;
  ipa: string;
  grammar: string;
  meaningZh: string;
  meaningEn: string;
  tangTranslit?: string;
  tangNote?: string;
}

export interface VerseSegment {
  id: string;
  verseNumber: number;
  sectionTitle?: string;
  iast: string;
  devanagari?: string;
  siddham?: string;
  slp1?: string;
  ipa?: string;
  tangTranslit: string;
  modernTranslit?: string;
  meaningZh: string;
  meaningEn?: string;
  tangNotes?: string[];
  words?: WordGlossItem[];
}

export interface AuthoritativeSourceMetadata {
  taishoId: string;
  cbetaXmlId: string;
  cbetaRawUrl: string;
  gretilId?: string;
  gretilRawUrl?: string;
  translator: string;
  dynasty: string;
  sanskritEditionCitation: string;
  manuscriptProvenance?: string;
  tangPhoneticNotes: string[];
  rawXmlExcerpt: string;
  rawGretilExcerpt?: string;
}

export interface DharaniEntry {
  id: string;
  titleZh: string;
  titleSanskrit: string;
  titleDevanagari: string;
  titleSiddham: string;
  category: Exclude<DharaniCategory, 'all'>;
  deityOrSubject: string;
  summaryZh: string;
  benefitsZh: string;
  sourceMetadata: AuthoritativeSourceMetadata;
  verses: VerseSegment[];
  cbetaInterlinearId?: string;
}

export interface CbetaSiddhamGaijiEntry {
  id: string;           // e.g. "SD-A440"
  unicodeChar: string;  // e.g. "𑖀"
  iast: string;         // e.g. "a"
  deva: string;         // e.g. "अ"
  slp1: string;         // e.g. "a"
  category: 'svara' | 'vyanjana' | 'conjunct' | 'bija';
  tangHanzi: string;
  tangNote: string;
}

export interface CbetaInterlinearPair {
  index: number;
  gaijiId: string;
  siddham: string;
  iast: string;
  deva: string;
  slp1: string;
  tangHanzi: string;
  yinSgNote?: string;   // e.g. "二合", "引", "弹舌呼", "去声"
  inlineGloss?: string; // e.g. "归命", "世尊"
  meter: ChandasMeter;
}

export interface CbetaSiddhamRecord {
  scriptureId: string;  // e.g. "T19n0974B"
  titleZh: string;
  translator: string;
  cbetaXmlUrl: string;
  pairCount: number;
  description: string;
  rawXmlSnippet: string;
  pairs: CbetaInterlinearPair[];
}

export interface GretilTextRecord {
  gretilId: string;     // e.g. "prajnhsu.htm", "bsu003_u.htm"
  titleSanskrit: string;
  titleZh: string;
  editorCitation: string;
  sourcePublication: string;
  gretilUrl: string;
  correspondingTaisho: string;
  mantraExcerptIast: string;
  mantraExcerptDeva: string;
  meaningZh: string;
  rawHeaderExcerpt: string;
}

export interface TaishoMikkyoEntry {
  taishoNo: string;     // e.g. "T18n0848"
  volume: 'T18' | 'T19' | 'T20' | 'T21';
  titleZh: string;
  titleSanskrit: string;
  translator: string;
  dynasty: string;
  fascicles: number;
  dharaniCount: number;
  hasSiddhamTt: boolean;
  cbetaXmlUrl: string;
  sampleMantraIast: string;
  sampleMantraTang: string;
}

export interface SyllableTimingItem {
  index: number;
  slp1: string;
  deva: string;
  iast: string;
  meter: ChandasMeter;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface AudioHealthStatus {
  backendOnline: boolean;
  engine: string;
  sampleRate: number;
  modelsLoaded: string[];
}
