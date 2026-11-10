import type { CbetaInterlinearToken } from '../data/kosa-generated/cbetaAuthRecords';

export type DharaniCategoryId =
  | 'supreme-mantras'       // 四大咒与核心根本长咒
  | 'ten-small-mantras'     // 佛教十小咒全集
  | 'buddhas-bodhisattvas'  // 诸佛菩萨心咒与本尊真言
  | 'vidyarajas-protectors' // 五大明王、五护陀罗尼与护法天部
  | 'prajna-sutra-hrdaya'   // 般若与经典总持门
  | 'gretil-canonical'      // GRETIL/DSBC 现存梵文贝叶经原典专集 (200部)
  | 'custom';               // 用户导入/实时编译模块

export interface CategoryMeta {
  id: DharaniCategoryId;
  nameZh: string;
  nameSanskrit: string;
  bijaSiddham: string;
  bijaIast: string;
  descriptionZh: string;
}

export interface WordGloss {
  iast: string;
  stem?: string;
  grammar?: string;
  transliterationZh: string;
  meaningZh: string;
  meaningEn?: string;
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
}

export interface AuthoritativeProvenance {
  sourceType: 'CBETA+GRETIL' | 'GRETIL/DSBC' | 'CBETA-XML-P5' | 'Academic-Critical-Edition';
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
  showPhoneticIastBracket: boolean; // 梵音拼读参考是否开启括号 (IAST) 对照
  showMeaningZh: boolean;
  showMeaningEn: boolean;
  showWordGloss: boolean;
}

export type ActiveWorkspaceTab =
  | 'canon-reader'       // 核心陀罗尼四体对照与发音解析工作台
  | 'taisho-explorer'    // 大正藏密教部 (T18-T21, 614部) 实时原典解析器
  | 'phonetics-academy'  // 梵文声明学 (Śikṣā) 与悉昙五十字母发音教室
  | 'custom-compiler'    // 梵文陀罗尼实时编译器与 JSON 模块扩展
  | 'interlinear'        // 房山石经与 T54 悉昙逐字对音工作台
  | 'hub';               // 全球 12 大梵典数据库与多本同源对勘中心

