import type { CbetaInterlinearToken } from '../data/kosa-generated/cbetaAuthRecords';

export type DharaniCategoryId =
  | 'supreme-mantras'       // 四大咒与核心根本长咒
  | 'ten-small-mantras'     // 佛教十小咒全集
  | 'buddhas-bodhisattvas'  // 诸佛菩萨心咒与本尊真言
  | 'vidyarajas-protectors' // 五大明王、五护陀罗尼与护法天部
  | 'prajna-sutra-hrdaya'   // 般若与经典总持门
  | 'vedic-tantra-siddhanta'// 世界梵咒·吠陀奥义书与诸宗部
  | 'global-12db-canon'     // 全球12大权威数据库梵本专集 (DB1–DB12)
  | 'gretil-canonical'      // GRETIL/DSBC 世界梵文原典专集 (297部)
  | 'custom';               // 用户导入/实时编译模块

export interface CategoryMeta {
  id: DharaniCategoryId;
  nameZh: string;
  nameSanskrit: string;
  bijaSiddham: string;
  bijaIast: string;
  descriptionZh: string;
}

export type FieldOrigin = 'db-original' | 'derived-reference' | 'mixed';

export type VerseTrackableField =
  | 'siddham'
  | 'devanagari'
  | 'iast'
  | 'modernPhoneticZh'
  | 'classicalTranslitZh'
  | 'ipa'
  | 'prosody'
  | 'meaningZh'
  | 'meaningEn'
  | 'words';

export type VerseFieldSources = Partial<Record<VerseTrackableField, FieldOrigin>>;

export interface WordGloss {
  iast: string;
  stem?: string;
  grammar?: string;
  transliterationZh: string;
  meaningZh: string;
  meaningEn?: string;
  origin?: FieldOrigin;
}

export interface DharaniVerse {
  id: string;
  index: number;
  iast: string;
  classicalTranslitZh: string;
  modernPhoneticZh: string;
  meaningZh: string;
  meaningEn: string;
  tangNoteZh?: string; // 唐代原典夹注（如不空译本本尊/声调注音）
  words: WordGloss[];
  /** 明确记录每个字段来自「原数据库已有内容 (db-original)」还是「系统处理推导参考 (derived-reference)」 */
  fieldSources?: VerseFieldSources;
  /** 若原数据库本身收录悉昙梵字（如 CBETA #SD-*），完整保留原字，不做二次覆盖转写 */
  siddhamOriginal?: string;
  /** 若原数据库本身收录天城体梵文，完整保留原文，不做二次覆盖转写 */
  devanagariOriginal?: string;
  /** 若原数据库收录藏文/尼瓦尔/婆罗谜等外交原貌文本，保留备查 */
  diplomaticOriginal?: string;
  /** 当字段为 mixed（部分原载+部分参考）时，记录原典原载对应的梵文音节/词块列表，供界面精确双色标示 */
  originalIastTokens?: string[];
  /** 当字段为 mixed 时，记录原典原刻对应的悉昙字块（如 CBETA #SD-* 原字），供界面精确双色标示 */
  originalSiddhamTokens?: string[];
}

export interface AuthoritativeProvenance {
  sourceType:
    | 'CBETA+GRETIL'
    | 'GRETIL/DSBC'
    | 'CBETA-XML-P5'
    | 'Academic-Critical-Edition'
    | 'GLOBAL-12DB';
  databaseId?: string;          // e.g. 'db1_fangshan' .. 'db12_muktabodha_ochs'
  databaseBadgeZh?: string;     // e.g. 'DB1 · 房山石经 F28n1071'
  cbetaId?: string;
  cbetaRawXmlUrl?: string;
  cbetaOnlineUrl?: string;
  gretilFile?: string;
  gretilRawUrl?: string;
  editionCitation: string;
  manuscriptNotesZh: string;
  rawSnippet?: string;
  cbetaInterlinearTokens?: CbetaInterlinearToken[];
}

export interface DharaniEntry {
  id: string;
  titleZh: string;
  titleSanskritIast: string;
  titleEnglish: string;
  categoryId: DharaniCategoryId;
  taishoNo: string;
  translatorZh: string;
  sutraSourceZh: string;
  deityZh: string;
  bijaIast?: string;
  meritsAndSummaryZh: string;
  recitationTipsZh: string;
  externalAudioUrl?: string;
  provenance: AuthoritativeProvenance;
  verses: DharaniVerse[];
}

export interface ScriptVisibilityConfig {
  showFullCombinedSummary: boolean; // 全咒多句合一六体汇总总览
  showDevanagari: boolean;
  showSiddham: boolean;
  showIast: boolean;
  showIpa: boolean;
  showProsodyMeter: boolean;
  showClassicalZh: boolean;
  showModernPhoneticZh: boolean;
  showPhoneticIastBracket: boolean; // 梵音拼读是否开启括号 (IAST) 对照
  showMeaningZh: boolean;
  showMeaningEn: boolean;
  showWordGloss: boolean;
  hideDerivedReference?: boolean;   // 仅显示数据库原有内容（隐藏系统处理生成的参考层）
}

export type ActiveWorkspaceTab =
  | 'canon-reader'       // 核心陀罗尼多体对照与发音解析工作台
  | 'hub'                // 全球 12 大梵典数据库总览与跨库检索中心 (DB1–DB12)
  | 'interlinear'        // 房山石经 F28n1071 与 T54 悉昙逐字对音工作台
  | 'concordance'        // 多本同源逐句对勘工作台 (16本心经/大悲/尊胜/八大陀罗尼)
  | 'cudl'               // 剑桥大学 CUDL 梵文贝叶经写本与 Hidas 校勘本馆 (69部)
  | 'phonetics-academy'  // 悉昙十八章、声明学 (Śikṣā) 与牛津 OCHS 种子字辞典
  | 'taisho-explorer'    // 大正藏密教部 (T18-T21, 614部) 实时原典解析器
  | 'custom-compiler';   // 四行谱发音引擎 v3.0 与梵文陀罗尼实时编译器


