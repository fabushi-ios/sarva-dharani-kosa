/**
 * src/types/dharani.ts
 * Core Sanskrit Dhāraṇī, Phonetic, Prosody & Baseline Canonical Provenance Types
 */

export type DharaniCategory =
  | 'major-dharanis'        // 四大咒與根本長咒
  | 'ten-small-dharanis'    // 十小咒全集
  | 'buddhas-bodhisattvas'  // 諸佛菩薩・明王五護・般若心咒
  | 'gretil-editions'       // GRETIL/DSBC 梵文貝葉經校勘本
  | 'custom';               // 用戶自定義編譯梵咒

export type ScriptDisplayLayer =
  | 'siddham'        // 悉曇梵字 (Unicode U+11580..U+115FF)
  | 'devanagari'     // 天城體梵文
  | 'iast'           // IAST 國際梵文轉寫
  | 'ipa'            // IPA 國際音標
  | 'tangPhonetic'   // 唐宋古音譯 (玄奘/不空體)
  | 'modernApprox'   // 現代梵音助讀
  | 'meaningZh'      // 漢語意譯
  | 'meaningEn'      // 英語意譯
  | 'wordGloss'      // 逐詞詞根與八格語法解析
  | 'prosodyMeter';  // 輕重音律 (Guru — / Laghu ⏑)

/**
 * Cross-canonical identifiers linking a Dhāraṇī or scripture across all 12 databases
 */
export interface CanonicalCrossRefs {
  taishoIds?: string[];           // e.g. ["T19n0974B", "T19n0967"]
  fangshanIds?: string[];         // DB #1: e.g. ["F28n1071", "F27n1062"]
  tohokuIds?: string[];           // DB #4: e.g. ["Toh 597", "Toh 984"]
  rktsIds?: string[];             // DB #9: e.g. ["K597", "D597", "D984"]
  dsbcIds?: string[];             // DB #3 & #10: e.g. ["820/2949", "20/222"]
  gretilIds?: string[];           // DB #3: e.g. ["bsu004_u.htm", "mahpratu.htm"]
  buddhaNexusIds?: string[];      // DB #5: e.g. ["K12bsu004_u", "K12n2949u"]
  saritIds?: string[];            // DB #6: e.g. ["caryamelapakapradipa"]
  cudlMsIds?: string[];           // DB #7: e.g. ["MS-ADD-01326", "MS-ADD-01680-00008-00001"]
  polyglottaVids?: string[];      // DB #8: e.g. ["vid=1175", "vid=1134"]
  allNibsIds?: string[];          // DB #10: e.g. ["SA00019.001"]
  idpOrCetomIds?: string[];       // DB #11: e.g. ["THT 3187", "IOL San 397", "IOL Tib J 321"]
  muktabodhaOrOchsIds?: string[]; // DB #12: e.g. ["M00247", "ochs_000_000_030_bijanighantu", "stts_crited"]
  bdrcWorkId?: string;            // e.g. "WA0RK0507" / "MW22084"
}

/**
 * Syllable-level linguistic, phonetic, and prosodic analysis (PROJECT.md Contract #2)
 */
export interface SyllableAnalysis {
  rawIast: string;
  slp1: string;
  devanagari: string;
  siddhamUnicode: string;
  modernPhonetic: string;      // Modern acoustic approximation (34x14 matrix m[])
  tangReconstruction: string;  // Tang Siddhaṃ phonetic transcription (34x14 matrix t[])
  ipa: string;
  weight: 'Guru' | 'Laghu';    // 'Guru' (2 morae) or 'Laghu' (1 mora)
  meterSymbol?: '—' | '⏑';     // Visual Chandas meter mark
  varga?: string;              // Place of articulation (e.g. "喉音 (Velar)")
  acousticNote?: string;       // Articulation & aspiration note
  sandhiNotes: string[];       // Anusvāra nasal assimilation / Visarga echo vowel notes
  bijaMeaning?: string;        // Seed syllable meaning if applicable
}

/**
 * Line-level multi-script and word/syllable analysis (PROJECT.md Contract #2)
 */
export interface LineAnalysis {
  originalText: string;
  normalizedIast: string;
  devanagari: string;
  siddhamUnicode: string;
  slp1: string;
  words: Array<{
    wordIast: string;
    wordDevanagari: string;
    wordSiddham: string;
    wordModernPhonetic?: string;
    wordTangReconstruction?: string;
    syllables: SyllableAnalysis[];
  }>;
}

/**
 * Word-by-word root, grammatical case (aṣṭavibhakti 八格), and bilingual gloss
 */
export interface WordGloss {
  sanskrit: string;          // IAST word or compound segment, e.g. "namo" / "bhagavate"
  devanagari?: string;       // e.g. "नमो" / "भगवते"
  siddham?: string;          // Unicode Siddhaṃ
  rootOrStem?: string;       // Dhātu / prātipadika, e.g. "namas-" / "bhagavat-"
  grammar?: string;          // Grammatical analysis, e.g. "Indecl. / Dat. Sg. Masc. (第四格・為格)"
  tangPhonetic: string;      // Traditional Tang transcription, e.g. "南無" / "婆伽伐帝"
  meaningZh: string;         // Chinese gloss, e.g. "歸命、敬禮" / "世尊"
  meaningEn: string;         // English gloss, e.g. "Homage to" / "the Blessed One"
  tangInlineNote?: string;   // Tang canonical inline note if present (e.g. "二合", "引")
}

/**
 * Individual verse / phrase block within a curated Dhāraṇī
 */
export interface DharaniVerse {
  verseNumber: number;
  sectionTitle?: string;     // Optional section rubric (e.g. "歸敬段", "根本咒心 (Hṛdaya)")
  iast: string;              // Standard IAST Sanskrit text
  devanagari: string;        // Devanāgarī text
  siddham: string;           // Unicode Siddhaṃ text
  ipa: string;               // IPA phonetic transcription
  tangChinese: string;       // Traditional Tang/Song Chinese phonetic transcription
  modernApprox: string;      // Modern Mandarin phonetic reading aid
  meaningZh: string;         // Chinese translation of the verse
  meaningEn: string;         // English translation of the verse
  tangPhoneticNotes: string[]; // Canonical Tang phonetic markers, e.g. ["二合", "引", "彈舌呼"]
  words: WordGloss[];        // Word-by-word grammatical & semantic breakdown
}

/**
 * Authoritative canonical provenance metadata for Source Inspector drawer
 */
export interface AuthoritativeSourceMetadata {
  cbetaXmlId: string;               // e.g. "T19n0974B" or "T20n1064"
  cbetaRawUrl: string;              // https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/...
  taishoLocation?: string;          // e.g. "T19, no. 974B, p. 386b–388a"
  gretilId?: string;                // e.g. "bsu004_u.htm" or "ekmuhr_u.htm"
  gretilRawUrl?: string;            // https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/...
  sanskritEditionCitation: string;  // Academic edition citation (e.g. Vaidya, Hidas, Wille, Iwamoto)
  tangPhoneticNotes: string[];      // Extracted Tang phonetic instructions & glosses
  rawExcerpt: string;               // Verbatim XML / GRETIL snippet for source verification
  crossRefs: CanonicalCrossRefs;    // Cross-references to DBs #1–#12
}

/**
 * Complete Curated Dhāraṇī Item in `src/data/corpus/*`
 */
export interface DharaniItem {
  id: string;                       // e.g. "nilakantha-dharani", "usnisavijaya-dharani"
  titleZh: string;                  // Chinese canonical title
  shortTitleZh: string;             // Popular short name, e.g. "大悲咒", "尊勝咒"
  titleSanskrit: string;            // IAST Sanskrit title
  titleDevanagari: string;          // Devanāgarī title
  titleSiddham: string;             // Unicode Siddhaṃ title
  titleTibetan?: string;            // Tibetan Unicode / Wylie title
  titleEn: string;                  // English title
  category: DharaniCategory;
  deity: string;                    // Primary Buddha / Bodhisattva / Vidyārāja
  taishoId: string;                 // Primary Taishō ID, e.g. "T20n1060"
  translator: string;               // e.g. "唐・不空三藏 (Amoghavajra)"
  period: string;                   // e.g. "盛唐 (8th Century CE)"
  summaryZh: string;                // Historical & doctrinal introduction
  ritualBenefits: string;           // Canonical merits & practice context
  verses: DharaniVerse[];           // Aligned multi-script verses
  authoritativeSource: AuthoritativeSourceMetadata;
  cbetaInterlinearXmlId?: string;   // Links to CBETA_AUTH_RECORDS for <cb:tt> matrix view
  gretilRecordId?: string;          // Links to GRETIL_AUTH_RECORDS for full Sanskrit edition
}

/**
 * Esoteric Seed Syllable (Bīja / Akṣara-mukha) entry
 */
export interface SeedSyllable {
  id: string;
  iast: string;                     // e.g. "oṃ", "hūṃ", "hrīḥ", "bhrūṃ", "dhīḥ", "svāhā"
  slp1: string;                     // e.g. "oM", "hUM", "hrIH", "BrUM", "DIH", "svAhA"
  devanagari: string;               // e.g. "ओं", "हूं", "ह्रीः", "भ्रूं", "धीः"
  siddham: string;                  // Unicode Siddhaṃ character/cluster
  cbetaSdCode?: string;             // e.g. "SD-CFC5", "SD-A5E5"
  tangChinese: string;              // e.g. "唵", "吽", "紇哩", "勃籠", "諦"
  modernPhonetic: string;           // e.g. "嗡", "轟", "赫里希", "布魯姆", "迪希"
  ipa: string;                      // e.g. "/oːm/", "/ɦuːm/", "/ɦriːh/"
  deity: string;                    // Associated Buddha / Bodhisattva / Vidyārāja
  buddhaFamily: string;             // Tathāgata, Padma, Vajra, Ratna, Karma
  aksaraMukhaMeaning: string;       // Siddhaṃ letter-gate meaning (字門義理)
  kukaiT84Note?: string;            // From Kūkai's T84n2701《梵字悉曇字母并釋義》
  nighantuCodeTerms?: string[];     // From DB #12 Bījanighaṇṭu / Uddhārakośa (e.g. ["vyomāsya", "kūrca"])
}

/**
 * CBETA Sanskrit Gaiji Mapping Entry (`cbeta-org/cbeta_gaiji/cbeta_sanskrit.json`)
 * Supports both unified property aliases (`unicodeChar`/`siddhamUnicode`, `iast`/`romanized`, `scriptType`/`script`).
 */
export interface CbetaGaijiEntry {
  id: string;                       // e.g. "SD-A440" or "RJ-C943"
  unicodeChar: string;              // Resolved Unicode Siddhaṃ string (U+11580..U+115FF)
  siddhamUnicode: string;           // Alias for unicodeChar
  unicodeHex?: string;              // e.g. "1158E"
  iast: string;                     // Official CBETA Romanized IAST transcription
  romanized: string;                // Alias for iast
  devanagari: string;               // Converted Devanāgarī string
  scriptType: 'Siddham' | 'Ranjana';
  script: 'Siddham' | 'Ranjana';    // Alias for scriptType
  cbetaChar: string;                // Legacy big5/placeholder char in cbeta_sanskrit.json
  pua: string;                      // e.g. "U+104440"
  symbol?: string;                  // Punctuation symbol if applicable
}

/**
 * Single `<cb:tt>` Siddhaṃ-Chinese Interlinear Alignment Unit
 */
export interface CbetaTtAlignment {
  index: number;                    // 1-based index within the scripture
  siddhamRef: string;               // e.g. "#SD-AA65" (or multiple refs joined)
  sdCodes: string[];                // e.g. ["SD-AA65"]
  siddhamUnicode: string;           // Resolved Unicode Siddhaṃ glyph(s)
  iast: string;                     // Resolved IAST syllable/word
  devanagari: string;               // Resolved Devanāgarī syllable/word
  chineseText: string;              // Transliterated Chinese characters
  chineseZi: string;                // Alias for chineseText (PUA-free)
  glossZh?: string;                 // Optional 3rd column semantic gloss (e.g. in T54n2135 梵語雜名)
  yinNotes: string[];               // Phonetic notes from <cb:yin><cb:sg> or <note place="inline">, e.g. ["二合", "引"]
  tangYinNotes: string[];           // Alias for yinNotes
  inlineCommentary?: string;        // Semantic commentary from <note place="inline">
  inlineGlossNotes: string[];       // Extracted <note place="inline"> array
}

/**
 * Extracted `<p cb:type="dharani">` or `<p xml:lang="sa-Sidd">` block from CBETA XML
 */
export interface CbetaDharaniBlock {
  xmlId: string;                    // e.g. "pT19p0384b2201"
  lang: 'zh-Hant' | 'sa-Sidd';
  chineseText: string;              // Clean Chinese phonetic text (PUA resolved)
  inlineNotes: string[];            // Extracted <note place="inline"> & <cb:sg>
  siddhamCodes: string[];           // Any #SD-* / #RJ-* codes in this block
  siddhamUnicodeText: string;       // Concatenated Unicode Siddhaṃ if present
  iastReconstruction: string;       // Concatenated IAST from #SD-* codes if present
}

/**
 * Baseline CBETA Authoritative XML Record (`src/data/generated/cbetaAuthRecords.ts`)
 */
export interface CbetaAuthRecord {
  xmlId: string;                    // e.g. "T19n0974B"
  taishoId: string;                 // e.g. "T0974B"
  taishoNo: string;                 // Alias for taishoId, e.g. "T0974B"
  vol: string;                      // e.g. "T19"
  title: string;                    // e.g. "佛頂尊勝陀羅尼念誦儀軌法"
  juan: number;
  translator: string;               // e.g. "唐 不空 譯"
  pinTitle?: string;                // Section/chapter heading
  sourceUrl: string;                // GitHub raw URL
  rawXmlUrl: string;                // Alias for sourceUrl
  localCachePath: string;           // "public/data/baseline/cbeta/T19n0974B.xml"
  dharaniBlocksCount: number;
  ttAlignmentsCount: number;        // 470, 334, 89, 23 (sum = 916 across the corpus)
  siddhamGlyphsCount: number;
  inlineNotesCount: number;
  dharaniBlocks: CbetaDharaniBlock[];
  dharaniTextBlocks: string[];      // Plain-text strings of dharani blocks
  ttAlignments: CbetaTtAlignment[]; // Extracted <cb:tt> Siddhaṃ-Chinese pairs
  inlineNotes: string[];            // Extracted <note place="inline"> annotations
  apparatusSanskritNotes: Array<{ zh: string; sa: string }>;
  rawXmlExcerpt: string;            // Verbatim TEI-P5 XML snippet
}

/**
 * Baseline GRETIL Authoritative Sanskrit Edition Record (`src/data/generated/gretilAuthRecords.ts`)
 */
export interface GretilAuthRecord {
  id: string;                       // e.g. "gretil-prajnhsu" or "prajnhsu"
  filename: string;                 // e.g. "prajnhsu.htm"
  fileName: string;                 // Alias for filename
  alternateFileName?: string;       // e.g. "psarkdhu.htm" (for mahpratu) or "vjviddhu.htm" (for vajvidhu)
  titleSanskrit: string;            // e.g. "Prajñāpāramitāhṛdayasūtra"
  titleZh: string;                  // e.g. "《般若波羅蜜多心經》梵本"
  titleChinese: string;             // Alias for titleZh
  category: 'Dharani' | 'Mahayana-Sutra' | 'Tantra' | 'Stotra' | 'Sadhana';
  editionCitation: string;          // Full bibliographic source from GRETIL header
  editor?: string;                  // e.g. "P.L. Vaidya", "Klaus Wille", "Yutaka Iwamoto"
  inputBy?: string;                 // e.g. "DSBC / Nagarjuna Institute"
  sourceUrl: string;                // GitHub raw URL on INDOLOGY/GRETIL-mirror
  rawUrl: string;                   // Alias for sourceUrl
  localCachePath: string;           // "public/data/baseline/gretil/prajnhsu.htm"
  extractedMantras: string[];       // Extracted oṃ / namo / tadyathā / svāhā mantra segments
  mantraExcerpts: string[];         // Alias for extractedMantras
  fullTextExcerpt: string;          // Clean IAST text excerpt
  fullTextLines: string[];          // Clean IAST lines (HTML tags & \var{} stripped, <ta> preserved)
  apparatusVariants: string[];      // Extracted \var{...} / \com{...} notes (e.g. in ekmuhr_u.htm)
  alternateEditionText?: string[];  // Text of psarkdhu.htm / vjviddhu.htm
  totalLines: number;
}

/**
 * Baseline Taishō Mikkyō (`T18–T21`, No. 848–1420) Catalog Index Entry (`src/data/generated/taishoMikkyoIndex.ts`)
 */
export interface TaishoMikkyoEntry {
  xmlId: string;                    // e.g. "T18n0848", "T18n0852a", "T19n0974B"
  taishoNo: string;                 // Key from work-info/T.json, e.g. "T0848", "T0852a", "T0974B"
  vol: 'T18' | 'T19' | 'T20' | 'T21';
  volume: 'T18' | 'T19' | 'T20' | 'T21'; // Alias for vol
  title: string;                    // Traditional Chinese title
  juans: number;                    // Number of rolls (卷)
  rolls: number;                    // Alias for juans
  byline: string;                   // e.g. "唐 善無畏．一行譯"
  translator: string;               // Alias for byline
  dynasty: string;                  // e.g. "唐"
  timeFrom?: number;                // e.g. 725
  timeTo?: number;                  // e.g. 725
  contributors: Array<{ name: string; id: string }>;
  categoryLabel: string;            // e.g. "大日經・金剛頂部", "佛頂・諸尊陀羅尼部"
  rawXmlUrl: string;                // https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T18/T18n0848.xml
  hasSiddhamTt?: boolean;           // True if known to contain <cb:tt> Siddhaṃ alignments
  isPrebundledInBaseline: boolean;
}
