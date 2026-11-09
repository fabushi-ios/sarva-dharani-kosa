/**
 * src/types/corpus.ts
 * Complete TypeScript Schemas for All 12 International Sanskrit Dhāraṇī & Esoteric Databases
 */

import type {
  CanonicalCrossRefs,
  CbetaTtAlignment,
  SyllableAnalysis,
  LineAnalysis,
} from './dharani';

export type { SyllableAnalysis, LineAnalysis, CanonicalCrossRefs, CbetaTtAlignment };

/**
 * 1. Core Database Identifiers (`PROJECT.md` Interface Contract #1)
 */
export type DatabaseId =
  | 'db1_fangshan'          // 1. CBETA Fangshan Stone Canon Dhāraṇī Collection (F28n1071, F24/F27)
  | 'db2_taisho_ext'        // 2. CBETA Taishō Siddhaṃ (T84), Lexicons (T54) & Ancient Dhāraṇīs (T08-T21)
  | 'db3_dsbc_gretil'       // 3. Nepal DSBC (Dhāraṇī Saṃgraha, list/4, 486 catalog) & GRETIL 261 Buddhist texts
  | 'db4_84000'             // 4. 84000 Open TEI (Toh 502-808 & Toh 846-1095), TM Alignments & Glossary
  | 'db5_buddhanexus'       // 5. BuddhaNexus Segmented Sanskrit (K12*, T01*, T02*) & DharmaMitra API
  | 'db6_sarit'             // 6. SARIT Indology TEI-P5 Corpus (Caryāmelāpakapradīpa & Buddhist works)
  | 'db7_cudl_hidas'        // 7. Cambridge CUDL Dhāraṇīsaṃgraha Palm-Leaf MSS & Gergely Hidas Editions
  | 'db8_polyglotta'        // 8. Oslo Bibliotheca Polyglotta / TLB Quadrilingual Alignments & Mahāvyutpatti
  | 'db9_rkts'              // 9. Vienna rKTs Kanjur/Tanjur Concordance & Derge Zungdu E-Texts
  | 'db10_all_nibs'         // 10. ALL-NIBS Dharani Preservation Project (106 Sanskrit MSS & Newar witnesses)
  | 'db11_idp_dunhuang'     // 11. IDP Berlin, BnF Pelliot Sanskrit / CEToM & CBETA Dunhuang (T85 & ZW)
  | 'db12_muktabodha_ochs'; // 12. Muktabodha 499 Tantric E-Texts, DHARMA STTS & OCHS Bīja Lexicons

export type CorpusScriptType =
  | 'IAST'
  | 'Devanagari'
  | 'Siddham'
  | 'SLP1'
  | 'Tibetan-Unicode'
  | 'Tibetan-EWTS'
  | 'Chinese'
  | 'Brahmi'
  | 'Khotanese'
  | 'English';

export interface DatabaseMetadataSummary {
  id: DatabaseId;
  number: number; // 1..12
  priorityTier: 1 | 2 | 3;
  nameZh: string;
  nameEn: string;
  institution: string;
  primarySourceUrls: string[];
  totalRecordsCount: number;
  mantraOrDharaniCount: number;
  scriptsAvailable: CorpusScriptType[];
  highlights: string[];
}

/* ============================================================================
 * DB #1: CBETA Fangshan Stone Canon Dhāraṇī Collection (`F28n1071`, `F24/F27`)
 * ========================================================================== */

export type FangshanPhoneticTag =
  | '二合'
  | '三合'
  | '引'
  | '彈舌'
  | '轉舌'
  | '上'
  | '去'
  | '平'
  | '入'
  | '半音'
  | '重'
  | '輕';

export interface FangshanInlineToken {
  tokenType: 'cb_tt' | 'zh_char' | 'gaiji_cb' | 'phonetic_note' | 'phrase_number' | 'commentary_note';
  textZh: string;
  siddhamRef?: string;          // e.g. "#SD-A5ED"
  siddhamUnicode?: string;      // Resolved Siddhaṃ glyph
  iast?: string;                // Resolved IAST from cbeta_sanskrit.json
  cbGaijiRef?: string;          // e.g. "#CB08859"
  phoneticTags?: FangshanPhoneticTag[];
  phraseNumber?: string;        // e.g. "一", "二", "三"
}

export interface FangshanDharaniRecord {
  id: string;                   // e.g. "F28n1071_pF28p0038a0301"
  workId: string;               // e.g. "F28n1071" or "F27n1048"
  workTitle: string;            // e.g. "釋教最上乘秘密藏陀羅尼集"
  compilerOrTranslator: string; // e.g. "唐・大安國寺三藏沙門 行琳 集" / "宋・契丹國師中天竺三藏 慈賢 譯"
  juan: number;                 // Roll 1..30
  dharaniTitle: string;         // Heading from <head> or <cb:mulu>, e.g. "金色寶光妙行成就如來陁羅尼"
  xmlId: string;                // e.g. "pF28p0038a0301"
  lbStart: string;              // e.g. "0038a03"
  plainChineseText: string;     // Continuous Chinese transliteration
  reconstructedIast?: string;   // Reconstructed / aligned IAST where available
  tokens: FangshanInlineToken[];// Mixed inline <cb:tt> and plain text + inline notes
  ttCount: number;
  sdGlyphCount: number;
  phoneticTagCounts: {
    erHe: number;               // 二合
    sanHe: number;              // 三合
    yin: number;                // 引
    tanShe: number;             // 彈舌 / 轉舌
  };
  sourceUrl: string;
  crossRefs?: CanonicalCrossRefs;
}

export interface Db1FangshanCorpus {
  summary: DatabaseMetadataSummary;
  f28n1071Stats: {
    totalRolls: number;         // 30
    totalDharaniBlocks: number; // 730
    totalTtBlocks: number;      // 8,291
    totalSdGlyphs: number;      // 8,297
    totalInlineNotes: number;   // 49,095
    erHeCount: number;          // 12,529
    sanHeCount: number;         // 248
    yinCount: number;           // 15,964
    tanSheCount: number;        // 10
  };
  records: FangshanDharaniRecord[];
}

/* ============================================================================
 * DB #2: CBETA Taishō Siddhaṃ (`T84`), Lexicons (`T54`) & Ancient Dhāraṇīs (`T08–T21`)
 * ========================================================================== */

export interface TaishoLexiconEntry {
  id: string;                   // e.g. "T54n2135_001"
  workId: string;               // e.g. "T54n2132", "T54n2133A", "T54n2133B", "T54n2134", "T54n2135", "T54n2136", "T54n2128".."T54n2131"
  workTitle: string;            // e.g. "梵語雜名", "梵語千字文", "悉曇字記", "唐梵文字", "一切經音義"
  author: string;               // e.g. "唐 龜茲沙門 禮言 集", "唐 義淨 撰", "唐 智廣 撰", "唐 慧琳 撰"
  headwordZh: string;           // Semantic gloss (`zh-Hant`), e.g. "佛" / "菩薩"
  phoneticZh: string;           // Phonetic transcription (`zh-x-yy`), e.g. "沒驮" / "冒地薩怛嚩"
  yinNotes: string[];           // e.g. ["二合", "引"]
  siddhamRefs: string[];        // e.g. ["#SD-A578", "#SD-A5A7"]
  siddhamUnicode: string;       // Resolved Unicode Siddhaṃ
  iast: string;                 // Resolved IAST Sanskrit word
  devanagari: string;           // Resolved Devanāgarī
  fanqieOrCommentary?: string;  // From T54n2128–2131 inline notes
  sourceUrl: string;
}

export interface TaishoSiddhamTreatiseRecord {
  taishoId: string;             // "T84n2701".."T84n2711"
  bkkbooksRepoId: string;       // "KR6t0412".."KR6t0422"
  title: string;                // e.g. "梵字悉曇字母并釋義", "悉曇藏", "悉曇要訣"
  author: string;               // e.g. "日本 空海 撰", "日本 安然 撰", "日本 明覺 撰"
  rolls: number;
  yamlFiles: string[];          // e.g. ["KR6t0412_001.yaml"]
  charCount: number;
  keyTopics: string[];          // e.g. ["五十字門釋義", "十八章建立", "二合三合字例"]
  excerptText: string;          // Extracted treatise text from YAML
  sourceUrl: string;
}

export interface SiddhamChapterCell {
  chapterNumber: number;        // 1..18 (悉曇十八章)
  cellId: string;
  iast: string;                 // ISO 15919 / IAST syllable
  siddhamUnicode: string;       // Unicode Siddhaṃ sequence
  devanagari: string;
  ligatureComponents?: string[];// From siddham-composition.js
  glyphVariantsCount?: number;  // From siddham-glyphs.js (43 script faces)
}

export interface SiddhamChapterSection {
  chapterNumber: number;        // 1..18
  titleZh: string;              // e.g. "第一章（根本字及摩多章）"
  titleEn: string;
  description: string;
  totalCells: number;
  sampleCells: SiddhamChapterCell[];
}

export interface TaishoAncientDharaniRecord {
  id: string;                   // e.g. "T21n1336_001"
  workId: string;               // e.g. "T21n1336", "T13n0397", "T11n0310", "T16n0665", "T16n0664", "T13n0402", "T09n0262", "T10n0293", "T08n0250".."T08n0257"
  workTitle: string;            // e.g. "陀羅尼雜集", "大方等大集經", "金光明最勝王經", "妙法蓮華經"
  translator: string;           // e.g. "梁 失譯", "北涼 曇無讖 譯", "唐 義淨 譯", "姚秦 鳩摩羅什 譯"
  dharaniTitle: string;
  juan: number;
  dharaniTextZh: string;
  ttAlignments?: CbetaTtAlignment[];
  fanqieNotes?: string[];       // <cb:fan> in T09n0262
  sanskritOrigNotes?: string[]; // <note type="orig"> in T16n0665 & T09n0262
  inlineNotes: string[];
  sourceUrl: string;
  crossRefs?: CanonicalCrossRefs;
}

export interface Db2TaishoExtCorpus {
  summary: DatabaseMetadataSummary;
  lexiconEntries: TaishoLexiconEntry[];               // T54n2128–2136
  siddhamTreatises: TaishoSiddhamTreatiseRecord[];    // T84n2701–2711 (KR6t0412–0422)
  siddham18Chapters: SiddhamChapterSection[];         // scottgfhong310/siddham-registry
  siddhamRegistryStats: {
    totalChapters: number;      // 18
    totalChapterCells: number;  // 6,442
    totalSyllables: number;     // 6,874
    totalGlyphs: number;        // 9,066
    totalScriptFaces: number;   // 43
    totalCompositions: number;  // 26,532
  };
  ancientDharanis: TaishoAncientDharaniRecord[];      // T08–T21 ancient dhāraṇīs
}

/* ============================================================================
 * DB #3: Nepal Digital Sanskrit Buddhist Canon (DSBC) & Full GRETIL Expansion
 * ========================================================================== */

export interface DsbcDharaniSamgrahaSection {
  sectionNumber: number;        // 1..100 in DSBC 820/2949 & 824/2953
  titleIast: string;            // e.g. "Āryāvalokiteśvarasya Stava Nīlakaṇṭha-nāma-hṛdaya"
  titleDevanagari?: string;     // Parallel from 824/2953
  paragraphsIast: string[];     // Extracted <p> blocks
  paragraphsDevanagari?: string[];
  extractedMantras: string[];   // Mantras starting with oṃ / namo / tadyathā
  colophonIast?: string;        // "iti śrī ... samāptā"
  sourceUrlIast: string;        // https://www.dsbcproject.org/canon-text/content/820/2949
  sourceUrlDeva: string;        // https://www.dsbcproject.org/canon-text/content/824/2953
}

export interface DsbcCatalogBookRecord {
  bookId: number;               // e.g. 9, 10, 11..21, 820, 862
  chapterIds?: number[];        // e.g. [2949] or [2990]
  titleIast: string;
  titleDevanagari?: string;
  category: 'Dhāraṇī' | 'Sādhana' | 'Tantra' | 'Stotra' | 'Sūtra' | 'Śāstra';
  inputPersonnel?: string;      // e.g. "Miroj Shakya & Milan Shakya"
  supplier?: string;            // "Nagarjuna Institute of Buddhist Studies"
  fullTextExcerptIast?: string;
  extractedMantras?: string[];
  sourceUrl: string;
  crossRefs?: CanonicalCrossRefs;
}

export interface GretilStotraOrTantraRecord {
  id: string;                   // e.g. "bst-108u_001" or "abhisdhu"
  filename: string;             // e.g. "bst-108u.htm", "busto1_u.htm", "abhisdhu.htm"
  stotraNumber?: number;        // 1..108 for bst-108u.htm (Bauddha Stotra Saṃgrahaḥ)
  titleSanskrit: string;
  editorOrSource: string;       // e.g. "Janardan Shastri Pandey (Bauddha Stotra Saṃgrahaḥ)"
  category: 'Stotra' | 'Dhāraṇī' | 'Sādhana' | 'Tantra' | 'Sūtra';
  textExcerptIast: string;
  extractedMantras: string[];
  sourceUrl: string;
}

export interface Db3DsbcGretilCorpus {
  summary: DatabaseMetadataSummary;
  dsbcCatalogStats: {
    romanizedBooksCount: number;  // 486
    devanagariBooksCount: number; // 475
    dharaniListCount: number;     // 15
    gretilTotalFilesCount: number;// 261
    stotra108Count: number;       // 108
  };
  dharaniSamgrahaSections: DsbcDharaniSamgrahaSection[];
  dsbcBooks: DsbcCatalogBookRecord[];
  gretilExpandedRecords: GretilStotraOrTantraRecord[];
}

/* ============================================================================
 * DB #4: 84000 Open TEI (`Toh 502–808` & `Toh 846–1095`), TM Alignments & Glossary
 * ========================================================================== */

export interface EightFourThousandMantraItem {
  type: 'mantra' | 'syllable';
  sanskritIast: string;         // Clean IAST (<note>, <ref>, and \u00AD soft-hyphens stripped)
  englishTranslation?: string;  // Extracted from embedded <note><q>...</q></note>
  criticalNotes: string[];      // Extracted from embedded <note place="end">
}

export interface EightFourThousandRecord {
  utId: string;                 // e.g. "UT22084-088-001"
  tohokuIds: string[];          // e.g. ["toh507", "toh883"] or ["toh141", "toh526", "toh916"]
  section: 'Kriyātantra' | 'Gzungs-dus' | 'Tantra' | 'Prajñāpāramitā' | 'Sūtra' | 'Tengyur';
  isPlaceholder?: boolean;
  titles: {
    saLtn: string;              // e.g. "Guhyadhātudhāraṇī"
    saLtnLong?: string;         // e.g. "Āryasarvatathāgatādhiṣṭhānahṛdayaguhyadhātukaraṇḍanāmadhāraṇīmahāyānasūtra"
    boLtn: string;              // e.g. "gsang ba ring bsrel gyi gzungs"
    boUnicode: string;          // e.g. "གསང་བ་རིང་བསྲེལ་གྱི་གཟུངས།"
    en: string;                 // e.g. "The Dhāraṇī for Secret Relics"
  };
  biblScopes: Array<{
    toh: string;
    scope: string;              // e.g. "Degé Kangyur vol. 88 (rgyud ’bum, na), folios 1.b–7.b"
    volume?: string;
    pages?: string;
  }>;
  bdrcWorkId?: string;          // From 84000/data-rdf (e.g. "WA0RK0507" / "MW22084")
  mantras: EightFourThousandMantraItem[];
  tibetanAlignedLines?: string[]; // From 84000/data-tm-alignments
  englishAlignedLines?: string[]; // From 84000/data-tm-alignments
  sourceUrl: string;            // Raw GitHub URL
  readUrl: string;              // https://read.84000.co/translation/toh...
  crossRefs?: CanonicalCrossRefs;
}

/**
 * Shared Quadrilingual Glossary Entry (84000 TEI + Polyglotta Mahāvyutpatti §25/§198 + T54)
 */
export interface TrilingualGlossaryEntry {
  id: string;
  category: 'term' | 'person' | 'place' | 'text' | 'mantranaya' | 'bodhisattva-dharani' | 't54-lexicon';
  sanskritIast: string;         // xml:lang="Sa-Ltn" or Mahāvyutpatti SA
  tibetanWylie?: string;        // xml:lang="Bo-Ltn" or Mahāvyutpatti BO
  tibetanUnicode?: string;      // xml:lang="bo"
  chinese?: string;             // From Polyglotta Mahāvyutpatti (§25 & §198) or T54
  siddhamUnicode?: string;      // From T54 / cbeta_sanskrit.json
  english: string;              // term[@type="translationMain"] or English gloss
  definition?: string;          // note[@type="definition"] or sGra sbyor bam po gñis pa commentary
  sourceDb: 'db4_84000' | 'db8_polyglotta' | 'db2_taisho_ext';
  sourceRef: string;            // e.g. "Toh 507,883", "Mvy §198.12", "T54n2135"
}

export interface Db4EightFourThousandCorpus {
  summary: DatabaseMetadataSummary;
  repoStats: {
    publishedKangyurTeiCount: number; // 396
    publishedTantraDharaniCount: number; // 176
    kriyatantraPublishedCount: number; // 130
    gzungsDusPublishedCount: number; // 97
    tmAlignedTextsCount: number; // 942
    rdfFilesCount: number; // 1,256
  };
  records: EightFourThousandRecord[];
  glossary: TrilingualGlossaryEntry[];
}

/* ============================================================================
 * DB #5: BuddhaNexus Segmented Sanskrit (`K12*`, `T01*`, `T02*`) & DharmaMitra API
 * ========================================================================== */

export interface BuddhaNexusTextRecord {
  fileId: string;               // e.g. "K12n2949u", "K12Xbsu017_u", "T01n802u", "T02dipguhsu", "SA_K12_Āgama_Surūpādhāraṇī"
  category: 'K12' | 'T01' | 'T02' | 'MB' | 'K01-K10' | 'T03-T17' | 'GRETIL';
  displayName: string;          // e.g. "Dhāraṇīsaṃgraha (Nepalese Compendium, 535 Folios)"
  sourceCitation?: string;      // e.g. "Hidas & Szántó 84000 | CUL Add. 1680.8 | D 529=888"
  totalSegments: number;        // e.g. 7700 for K12n2949u
  colophonsExtracted?: string[];// e.g. 113+ samāpta colophons in K12n2949u
  sampleSegments: Array<{
    segnr: string;              // e.g. "K12n2949u:1"
    text: string;               // IAST Sanskrit segment
  }>;
  rawJsonUrl?: string;          // https://raw.githubusercontent.com/BuddhaNexus/segmented-sanskrit/master/segmented_files/...
  dharmaMitraApiId: string;     // Filename for POST https://dharmamitra.org/api-db/text-view/text-parallels/
  crossRefs?: CanonicalCrossRefs;
}

export interface DharmaMitraCatalogEntry {
  filename: string;             // e.g. "SA_K12_n2949u"
  category: string;             // e.g. "K12", "T01", "T02", "MB"
  displayName: string;
  collection: string;           // e.g. "Buddhist_Scriptures", "Buddhist_Non-Scriptures", "Muktabodha"
}

export interface Db5BuddhaNexusCorpus {
  summary: DatabaseMetadataSummary;
  catalogStats: {
    staticSegmentedFilesCount: number; // 1,303
    k12FilesCount: number;             // 42 static / 114 DharmaMitra
    t01FilesCount: number;             // 105 static / 170 DharmaMitra
    t02FilesCount: number;             // 65 static / 258 DharmaMitra
    dharmaMitraTotalSanskritTexts: number; // 3,548
  };
  records: BuddhaNexusTextRecord[];
  dharmaMitraCatalogSample: DharmaMitraCatalogEntry[];
}

/* ============================================================================
 * DB #6: SARIT Indology TEI-P5 Corpus (*Caryāmelāpakapradīpa* & Buddhist Works)
 * ========================================================================== */

export interface SaritTextUnit {
  unitId: string;               // e.g. "CMP03.001"
  chapterOrSection: string;     // e.g. "Chapter 3: Vāgviveka / Mantratattva"
  unitType: 'paragraph' | 'verse' | 'rubric';
  cleanSanskritIast: string;    // <note>, <locus>, <pb>, <del> stripped
  manuscriptLoci: string[];     // Extracted <locus> markers, e.g. ["[A:14b]", "[N:18a]"]
  criticalApparatus: string[];  // Extracted <note resp="editor" place="bottom">
}

export interface SaritWorkRecord {
  xmlId: string;                // e.g. "sarit__caryamelapakapradipa"
  filename: string;             // e.g. "caryamelapakapradipa.xml"
  titleSanskrit: string;        // e.g. "Caryāmelāpakapradīpa"
  author: string;               // e.g. "Āryadeva (Vajrayāna)"
  editor: string;               // e.g. "Christian K. Wedemeyer (Columbia/AIBS 2007)"
  scriptEncoding: 'sa-Latn' | 'sa-Deva';
  category: 'Vajrayāna-Tantra' | 'Buddhist-Philosophy-Pramāṇa' | 'Buddhist-Kāvya' | 'Rasa-Yoga-Tantra';
  sizeBytes: number;
  paragraphCount: number;
  verseLineCount: number;
  featuredUnits: SaritTextUnit[];
  sourceUrl: string;            // https://raw.githubusercontent.com/sarit/SARIT-corpus/master/...
  crossRefs?: CanonicalCrossRefs;
}

export interface Db6SaritCorpus {
  summary: DatabaseMetadataSummary;
  records: SaritWorkRecord[];
}

/* ============================================================================
 * DB #7: Cambridge University CUDL *Dhāraṇīsaṃgraha* Palm-Leaf MSS & Hidas Editions
 * ========================================================================== */

export interface CudlManuscriptRecord {
  cudlId: string;               // e.g. "MS-ADD-01326", "MS-ADD-01680-00008-00001", "MS-ADD-01680-00008-00002", "MS-ADD-01680-00008-00003", "PR-FG-00870"
  shelfLocator: string;         // e.g. "MS Add.1326", "MS Add.1680.8.3"
  title: string;                // e.g. "Dhāraṇīsaṅgraha", "Dhāraṇī Compendium (Palm-Leaf)"
  dateDisplay: string;          // e.g. "839 Nepāla Saṃvat (1719 CE)", "12th–13th century", "770 CE"
  script: string;               // e.g. "Nepālākṣarā", "Hooked Nepālākṣarā", "Siddhaṃ / Early Print"
  material: string;             // e.g. "Palm leaf, 5 × 28 cm", "Nepalese yellow paper"
  extent: string;               // e.g. "225 ff. (458 pages)", "29 ff. (58 pages)"
  numberOfPages: number;
  abstractShort: string;
  transcribedRubricsAndExcerpts: string[]; // Diplomatic transcriptions of rubrics, incipits, colophons
  sectionTitlesIast: string[];  // Individual dhāraṇīs cataloged inside the MS bundle
  iiifManifestUrl: string;      // https://cudl.lib.cam.ac.uk/iiif/<cudlId>
  sampleFolioImageUrls: string[]; // https://images.lib.cam.ac.uk/iiif/<IIIFImageURL>.jp2/full/,800/0/default.jpg
  metadataJsonUrl: string;      // https://services.cudl.lib.cam.ac.uk/v1/metadata/json/<cudlId>
  metadataTeiUrl: string;       // https://services.cudl.lib.cam.ac.uk/v1/metadata/tei/<cudlId>
  viewerUrl: string;            // https://cudl.lib.cam.ac.uk/view/<cudlId>/1
  crossRefs?: CanonicalCrossRefs;
}

export interface HidasCriticalEditionRecord {
  id: string;                   // e.g. "SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas"
  titleSanskrit: string;        // e.g. "Māṇibhadradhāraṇī"
  editorCitation: string;       // e.g. "Gergely Hidas (2021), Powers of Protection / 84000, based on CUL Add. 1326 & Add. 1680.8"
  manuscriptWitnesses: string[];// e.g. ["CUL MS Add. 1326, p. 146 (no. 73)", "CUL MS Add. 1680.8.3"]
  tibetanParallelRef: string;   // e.g. "D 764 [=970]", "D 529 [=888]"
  segments: Array<{
    segnr: string;
    textIast: string;
  }>;
  extractedMantraIast: string;
  sourceApiId: string;
  crossRefs?: CanonicalCrossRefs;
}

export interface Db7CudlHidasCorpus {
  summary: DatabaseMetadataSummary;
  totalDharaniManuscriptsFound: number; // 69
  manuscripts: CudlManuscriptRecord[];
  hidasCriticalEditions: HidasCriticalEditionRecord[];
}

/* ============================================================================
 * DB #8: University of Oslo Bibliotheca Polyglotta / TLB (`polyglotta.uio.no`)
 * ========================================================================== */

export interface PolyglottaAlignedCell {
  lang: 'Sanskrit' | 'Tibetan' | 'Chinese' | 'English' | 'Khotanese' | 'Mongolian' | 'Pali' | 'Commentary';
  witnessLabel: string;         // e.g. "San short: Vaidya (1961)", "Chi: Xuanzang T.251", "Tib: Kg 21"
  refLocus?: string;            // kilderef locus
  text: string;                 // Clean aligned sentence/verse
  footnotes?: string[];
}

export interface PolyglottaAlignedRow {
  rowIndex: number;
  sectionRef?: string;          // e.g. "§1", "Mvy §198.1"
  cells: PolyglottaAlignedCell[];
}

export interface PolyglottaParallelVolume {
  vid: number;                  // e.g. 1175, 1134, 727, 207, 1020, 1264, 483, 263, 691..683
  cid?: number;                 // e.g. 456868 (Lotus Ch. 21), 335411 (Mvy §25), 338889 (Mvy §198)
  titleSanskrit: string;        // e.g. "Prajñāpāramitāhṛdaya"
  titleZh: string;              // e.g. "《般若波羅蜜多心經》十六本逐句對勘"
  titleEn: string;
  libraryBid: 2 | 21;           // 2 = TLB, 21 = Kanjur Sūtras
  witnesses: string[];
  totalRows: number;
  alignedRows: PolyglottaAlignedRow[];
  sourceUrl: string;            // https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=...
  crossRefs?: CanonicalCrossRefs;
}

export interface Db8PolyglottaCorpus {
  summary: DatabaseMetadataSummary;
  volumes: PolyglottaParallelVolume[];
  mahavyutpattiEsotericGlossary: TrilingualGlossaryEntry[]; // §25 (13 entries) + §198 (103 entries)
}

/* ============================================================================
 * DB #9: University of Vienna rKTs (Kanjur/Tanjur Concordance & Derge *Zungdu*)
 * ========================================================================== */

export interface RktsStandardItem {
  rktsTyp: 'K' | 'T' | 'G' | 'B' | 'E';
  rktsId: string;               // e.g. "K521", "K846", "T2302", "G1"
  tibetanWylie: string;         // <tib>
  sanskritIast: string;         // <skt> standardized Sanskrit title
  sanskritVariant?: string;     // <skt1>
  englishTitle?: string;        // <eng>
  variantsNote?: string;        // <variant>
}

export interface RktsDergeZungduItem {
  dergeRef: string;             // e.g. "D846".."D1095"
  rnb: string;                  // Running number in D.xml
  rktsId: string;               // Cross-reference to Kanjur rKTs ID, e.g. "K521"
  cat: 'K';
  bdrcVolume: string;           // "0985" (Vol. 100 e) or "0986" (Vol. 101 waM)
  section: 'gzungs' | 'rgyud';
  folioLocation: string;        // e.g. "55a1–56a7" (from debp/debf/debl–finp/finf/finl)
  tibetanTitleWylie: string;
  sanskritTitleStandard?: string;
}

export interface RktsZungduEtextEntry {
  id: string;                   // e.g. "1D_100_001"
  volumeFile: '1D/100.txt' | '1D/101.txt';
  dergeRef?: string;            // e.g. "D846".."D1095"
  folioLine: string;            // e.g. "1b1(gzungs)"
  rgyaGarSkadDuEwts: string;    // Verbatim EWTS Sanskrit title after "rgya gar skad du/"
  sanskritTitleIast: string;    // Converted from EWTS to standard IAST
  bodSkadDuEwts: string;        // Tibetan title in EWTS after "bod skad du/"
  tibetanTitleUnicode: string;  // Converted to Tibetan Unicode
  extractedMantraEwts: string;  // Verbatim EWTS mantra (e.g. "oM b+ho d+ha ra u ts+tshuSh+ma...")
  extractedMantraIast: string;  // Normalized IAST mantra
  extractedMantraTibetan: string; // Tibetan Unicode mantra
  sourceUrl: string;            // http://www.rkts.org/rkts1/data/etexts/1D/100.txt
  crossRefs?: CanonicalCrossRefs;
}

export interface TibetanCorpusCatalogItem {
  dergeId: string;              // e.g. "D479", "D846"
  division: 'Kangyur-Tantra' | 'Tengyur-Tantra';
  titleTibetanUnicode: string;
  titleWylie: string;
  wyliePath: string;
  unicodePath: string;
  sourceRepoUrl: string;        // https://github.com/tokushige-koyasan/tibetan-corpus
}

export interface Db9RktsCorpus {
  summary: DatabaseMetadataSummary;
  concordanceStats: {
    totalStandardWorks: number;       // 16,179
    totalWorksWithSanskritTitle: number; // 4,997
    totalCanonicalCollections: number;// 68
    dergeZungduItemsCount: number;    // 265 (D846–D1095)
    dergeRgyudItemsCount: number;     // 3,115
    tibetanCorpusTextsCount: number;  // 3,452
  };
  standardConcordanceSample: RktsStandardItem[];
  dergeZungduCatalog: RktsDergeZungduItem[];
  zungduEtextEntries: RktsZungduEtextEntry[];
  tibetanCorpusCatalogSample: TibetanCorpusCatalogItem[];
}

/* ============================================================================
 * DB #10: ALL-NIBS Dharani Preservation Project (`publicapi.asianlegacylibrary.org`)
 * ========================================================================== */

export interface AllNibsManuscriptRecord {
  resourceId: string;           // e.g. "SA00019.001", "SA00016.001", "SA00024.001", "SA00025.001", "SA00028.001", "SA00005.001"
  sourceInstitution: '[NIBS] Nagarjuna Institute of Buddhist Studies' | '[Varanasi] Varanasi Preservation Center';
  catalogCode?: string;         // e.g. "KSK-00556", "KSK-00381", "TSK-01785", "TSK-03400"
  manuscriptArchiveRef?: string;// e.g. "Asha Archives MS 2145", "Cambridge MS Or.713", "Matsunami 234"
  titleIast: string;            // e.g. "Ārya Suvarṇa Prabhāsottama Sūtrendra Rāja"
  category: 'Dhāraṇī' | 'Tantra' | 'Sādhana' | 'Sūtra' | 'Stotra' | 'Ṭīkā';
  totalChars?: number;
  diplomaticFolioExcerpt: string; // Folio-marked transcription (@1a, @1b...)
  normalizedIastExcerpt: string;  // Normalized from Nepalese/Newar orthography
  extractedMantras: string[];
  apiUrl: string;               // https://publicapi.asianlegacylibrary.org/resources/{id}/search?...
  crossRefs?: CanonicalCrossRefs;
}

export interface NewarDharaniWitnessRecord {
  id: string;                   // e.g. "nibs_newar_nilakantha"
  titleDiplomaticNewar: string; // Verbatim Newar MS rubric
  titleNormalizedIast: string;  // Standard Sanskrit title
  diplomaticMantraNewar: string;// Preserving Newar b/v (`bajrapāṇe`), `sbāhā`, `ś/ṣ/s`
  normalizedMantraIast: string; // Normalized (`vajrapāṇe`, `svāhā`)
  orthographicNotes: string[];  // e.g. ["b → v (bajra → vajra)", "sbāhā → svāhā"]
  sourceUrl: string;
  crossRefs?: CanonicalCrossRefs;
}

export interface Db10AllNibsCorpus {
  summary: DatabaseMetadataSummary;
  apiStats: {
    totalSanskritManuscripts: number; // 106
    nibsKathmanduCount: number;       // 10
    varanasiPreservationCount: number;// 96
    acipTibetanTextsCount: number;    // 6,685
    newarDharaniWitnessesCount: number; // 33+
  };
  manuscripts: AllNibsManuscriptRecord[];
  newarDharaniWitnesses: NewarDharaniWitnessRecord[];
}

/* ============================================================================
 * DB #11: IDP Berlin, BnF Pelliot Sanskrit / CEToM & CBETA Dunhuang (`T85` & `ZW`)
 * ========================================================================== */

export interface IdpSilkRoadRecord {
  id: string;                   // e.g. "IOL San 397", "IOL Tib J 321", "Pelliot tibétain 42", "Or.15001/18"
  pressmark: string;            // Manuscript shelfmark / pressmark
  catalogShortref: string;      // e.g. "Dalton_vanSchaik_2005", "PelliotTibetain_I", "BLSF_II_04", "Wille_2009a", "Kudo_2006b", "Suzuki_2006", "SHT_0001-0099"
  collectionSite: 'Dunhuang (Stein / British Library)' | 'Dunhuang (BnF Pelliot)' | 'Khotan / Kucha (Hoernle)' | 'Turfan (Berlin SHT)';
  scriptAndLanguage: string;    // e.g. "Central Asian Brāhmī (Sanskrit)", "Khotanese Brāhmī", "Old Tibetan (Dunhuang)", "Dunhuang Chinese"
  title: string;
  description: string;
  diplomaticTransliteration?: string; // Verbatim Silk Road transliteration (e.g. "namo sarvarājav[i]dyānāṃ tadyathā...")
  normalizedMantraIast?: string;
  sourceXmlUrl: string;         // http://idp.bbaw.de/database/oo_cat_rss.xml?shortref=...
  crossRefs?: CanonicalCrossRefs;
}

export interface CetomManuscriptRecord {
  cetomId: string;              // e.g. "tht3187", "psbl13", "psstotrai42", "psuv67"
  shelfmark: string;            // e.g. "THT 3187 (SHT 1815 / Gö 936)", "Pelliot Sanskrit BL 13"
  repository: 'BnF Pelliot Sanskrit (PS)' | 'BnF Pelliot Koutchéen (PK)' | 'Berlin Turfan (THT/SHT)' | 'British Library (IOL)';
  findspot: string;             // e.g. "Kizil", "Subashi", "Duldur-Aqur", "Dunhuang"
  genreAndSubject: string;      // e.g. "Dhāraṇī (Nīlakaṇṭha / Avalokiteśvara)", "Buddhist Stotra"
  script: string;               // e.g. "North Turkestan Brāhmī"
  diplomaticLines: Array<{
    lineNum: string;            // e.g. "a1", "a2", "a3"
    transliteration: string;    // e.g. "/// – – – [ru] [ṇi] kā ya – ///"
  }>;
  sourceUrl: string;            // https://cetom.univie.ac.at/?m-tht3187
  crossRefs?: CanonicalCrossRefs;
}

export interface CbetaDunhuangRecord {
  xmlId: string;                // e.g. "T85n2880", "T85n2898", "ZW01n0011", "ZW03n0023", "ZW06n0051", "ZW06n0055", "ZW11n0091", "ZW11n0092"
  collection: 'T85 (大正藏・古逸部)' | 'ZW (藏外佛教文獻・敦煌/滇密)';
  title: string;                // e.g. "究竟大悲經", "佛說水月光觀音菩薩經", "菩薩總持法", "金剛頂一切如來深妙秘密金剛界大三昧耶修行四十二種壇法經"
  manuscriptWitnesses: string[];// e.g. ["S. 2499", "P. 2308", "北圖敦煌寫卷"]
  dharaniExcerptsZh: string[];
  inlineNotes: string[];
  sourceUrl: string;            // https://raw.githubusercontent.com/cbeta-org/xml-p5/master/...
  crossRefs?: CanonicalCrossRefs;
}

export interface Db11IdpDunhuangCorpus {
  summary: DatabaseMetadataSummary;
  corpusStats: {
    idpXmlDumpsCount: number;          // 16+
    daltonVanSchaikTantricCount: number;// 348
    pelliotTibetainCount: number;      // 850
    cetomTotalManuscriptsCount: number;// 1,846
    cetomPelliotSanskritCount: number; // 12
    cbetaT85FilesCount: number;        // 192
    cbetaZwFilesCount: number;         // 182
  };
  idpRecords: IdpSilkRoadRecord[];
  cetomRecords: CetomManuscriptRecord[];
  cbetaDunhuangRecords: CbetaDunhuangRecord[];
}

/* ============================================================================
 * DB #12: Muktabodha Digital Library, ERC DHARMA & Oxford OCHS *Bīja* Lexicons
 * ========================================================================== */

export interface MuktabodhaTextRecord {
  catalogNo: string;            // e.g. "M00247", "M00292", "M00635", "M00229", "M00626", "M00341", "M00643", "M00018"
  uniformTitle: string;         // e.g. "Uddhārakośa", "Mantrakoṣa", "Mantracandrikā", "Mantrakaumudī", "Mātṛkārṇanighaṇṭu", "Advayavajrasaṃgraha"
  mainTitle: string;
  author?: string;              // e.g. "Dakṣiṇāmūrti", "Āśāditya Tripāṭhi", "Advayavajra"
  tradition: 'Tantric-Bīja-Lexicon' | 'Vajrayāna-Buddhist' | 'Śākta-Kaula' | 'Śaiva-Siddhānta';
  charCount: number;
  textExcerptIast: string;
  extractedSeedDefinitions?: string[];
  rawTextUrl: string;           // https://raw.githubusercontent.com/tokushige-koyasan/muktabodha-corpus/main/texts/...
}

export interface DharmaCriticalEditionRecord {
  id: string;                   // "stts_crited" | "svu_crited"
  titleSanskrit: string;        // "Sarvatathāgatatattvasaṅgraha" | "Sarvavajrodayā Maṇḍalopāyikā"
  editors: string;              // "Ryugen Tanemura & Arlo Griffiths"
  charCount: number;            // 378754 | 76857
  extractedMantrasIast: string[];
  textExcerptIast: string;
  rawTextUrl: string;           // https://raw.githubusercontent.com/tokushige-koyasan/dharma-editions-corpus/main/texts/...
  crossRefs: CanonicalCrossRefs;
}

export interface OchsManuscriptRecord {
  slug: string;                 // e.g. "ochs_000_000_030_bijanighantu", "ochs_000_000_046_ekaksarakosa", "ochs_000_000_259_mantrakosa", "ochs_000_000_262_matrkarnanighantu"
  ochsNumber: number;           // e.g. 30, 46, 259, 262
  titleSanskrit: string;        // e.g. "Bījanighaṇṭu", "Ekākṣarakośa", "Mantrakoṣa", "Mātṛkārṇanighaṇṭu"
  category: string;             // e.g. "Bīja / Mantra Nighaṇṭu Lexicon"
  totalVerses: number;
  verses: Array<{
    verseNumber: number;
    chapterOrSection?: string;
    sanskritIast: string;       // Verbatim verse from OCHS embedded JSON
    targetBijaSyllables: string[]; // e.g. ["krīṃ", "hūṃ", "aiṃ"]
  }>;
  sourceUrl: string;            // https://ochs-database.netlify.app/manuscripts/{slug}/
}

/**
 * Unified Tantric Seed-Syllable (Bīja / Ekākṣara / Uddhāra) Lexicon Entry (`bijaLexiconEngine.ts`)
 */
export interface BijaLexiconEntry {
  bijaIast: string;             // Normalized IAST, e.g. "oṃ", "hūṃ", "hrīḥ", "hrīṃ", "krīṃ", "aiṃ", "klīṃ", "śrīṃ", "strīṃ", "bhrūṃ", "phaṭ", "svāhā"
  bijaSlp1: string;
  bijaDevanagari: string;
  bijaSiddham: string;
  tangChinese: string;          // e.g. "唵", "吽", "紇哩", "訖哩", "藹", "發吒", "娑嚩訶"
  phonemicBreakdown: string[];  // e.g. ["ha (vyomāsya)", "ū (vidārī)", "ṃ (nādabindu)"]
  uddharaCodeNames: string[];   // Tantric code-words from Bījanighaṇṭu / Uddhārakośa, e.g. ["vyomāsya", "vidārī", "kūrca", "krodhabīja"]
  buddhistMeaning: string;      // From Kūkai T84n2701 / Caryāmelāpakapradīpa / Sarvatathāgatatattvasaṅgraha
  tantricNighantuMeaning: string; // From Bījanighaṇṭu (#30), Ekākṣarakośa (#46), Uddhārakośa (M00247), Mātṛkārṇanighaṇṭu (M00626)
  sourceCitations: Array<{
    dbId: 'db2_taisho_ext' | 'db6_sarit' | 'db12_muktabodha_ochs';
    workTitle: string;          // e.g. "Bījanighaṇṭu (OCHS #30, Verse 8)", "空海《梵字悉曇字母并釋義》T84n2701"
    verbatimQuote: string;
  }>;
}

export interface Db12MuktabodhaOchsCorpus {
  summary: DatabaseMetadataSummary;
  corpusStats: {
    muktabodhaTotalTexts: number; // 499
    ochsTotalManuscripts: number; // 1,603
    ochsFullTextJsonCount: number;// 494
    dharmaEditionsCount: number;  // 4
  };
  muktabodhaTexts: MuktabodhaTextRecord[];
  dharmaEditions: DharmaCriticalEditionRecord[];
  ochsLexiconManuscripts: OchsManuscriptRecord[];
  bijaLexicon: BijaLexiconEntry[];
}

/* ============================================================================
 * Unified Cross-Database Concordance & Search Contracts (M4)
 * ========================================================================== */

export interface CanonicalConcordanceCluster {
  clusterId: string;            // e.g. "concordance-usnisavijaya", "concordance-nilakantha"
  canonicalTitleSanskrit: string;
  canonicalTitleZh: string;
  canonicalTitleTibetan: string;
  canonicalTitleEn: string;
  crossRefs: CanonicalCrossRefs;
  databasesPresent: DatabaseId[];
  witnessSummary: Array<{
    dbId: DatabaseId;
    recordId: string;
    label: string;
    script: CorpusScriptType;
    sampleMantraOrIncipit: string;
    url: string;
  }>;
}

export interface UnifiedSearchQueryOptions {
  dbId?: DatabaseId | 'baseline';
  script?: CorpusScriptType;
  limit?: number;
}

export interface UnifiedSearchHit {
  id: string;
  sourceDb: DatabaseId | 'baseline';
  databaseNumber?: number;      // 1..12 (or 0 for baseline)
  title: string;
  subtitle?: string;
  matchedField: string;
  snippet: string;
  sanskritIast?: string;
  siddhamUnicode?: string;
  chineseText?: string;
  tibetanText?: string;
  canonicalRefs: string[];
  sourceUrl: string;
}
