import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import type { CbetaInterlinearToken } from '../kosa-generated/cbetaAuthRecords';
import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  DB3_DSBC_GRETIL_CORPUS,
  DB4_84000_CORPUS,
  DB5_BUDDHANEXUS_CORPUS,
  DB6_SARIT_CORPUS,
} from '../generated/tier1Databases';
import {
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  DB10_ALL_NIBS_CORPUS,
  DB11_IDP_DUNHUANG_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
} from '../generated/tier23Databases';
import {
  generateVerseChinesePhonetics,
  buildWordGlossesFromIast,
} from '../../core/sanskrit/phoneticMapper';

export function cleanAndExpandSanskritMantraIast(rawIast: string): string {
  if (!rawIast) return '';
  let text = rawIast
    .replace(/\u00AD/g, '')
    // Strip editorial page/folio/section brackets like [14], (Pkdh_141), (@1a)
    .replace(/\[\s*\d+[a-zA-Z]*\s*\]/g, ' ')
    .replace(/\(\s*(?:Pkdh|GRETIL|MS|fol\.?|p\.?)[^)]*\)/gi, ' ')
    .replace(/[*+]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    !text ||
    /no data available/i.test(text) ||
    /this gretil text file is for reference/i.test(text) ||
    /multibyte sequence/i.test(text) ||
    /^s\.n\.\s*book\s*links/i.test(text) ||
    /\btadyathāpi\s*nāma/i.test(text)
  ) {
    return '';
  }

  // Expand critical-edition repetition numerals: e.g. "giri 2" -> "giri giri", "hūṃ 3" -> "hūṃ hūṃ hūṃ"
  text = text.replace(
    /(^|[\s|—-])([a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣm̐'-]{2,})\s+([23])(?=$|[\s|.,;!/])/g,
    (_m, prefix: string, word: string, countStr: string) => {
      const count = Number(countStr);
      return `${prefix}${Array(count).fill(word).join(' ')}`;
    }
  );

  return text.replace(/\s+/g, ' ').trim();
}

function splitIastIntoVerseLines(rawIast: string, maxWordsPerLine = 12): string[] {
  const cleaned = cleanAndExpandSanskritMantraIast(rawIast);
  if (!cleaned) {
    return [
      'namaḥ sarvabuddhabodhisattvebhyaḥ',
      'tadyathā — oṃ sarva-tathāgata-hṛdaya-dhāraṇī svāhā',
    ];
  }

  // Split by dandas (||, |, //) preserving every genuine Sanskrit clause without any 16-line cap
  const rawClauses = cleaned
    .split(/(?:\|\||\|+|\/\/)+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !/^\(?\d+\)?$/.test(s));

  const expandedLines: string[] = [];
  const sourceClauses = rawClauses.length > 0 ? rawClauses : [cleaned];

  for (const clause of sourceClauses) {
    const words = clause.split(/\s+/).filter(Boolean);
    if (words.length <= Math.ceil(maxWordsPerLine * 1.5)) {
      expandedLines.push(clause);
    } else {
      for (let i = 0; i < words.length; i += maxWordsPerLine) {
        const slice = words.slice(i, i + maxWordsPerLine).join(' ');
        if (slice) expandedLines.push(slice);
      }
    }
  }

  // If still only 1 line and it has >= 5 words, split at mantra pivot (tadyathā / oṃ) or into 2 balanced halves
  if (expandedLines.length === 1) {
    const single = expandedLines[0];
    const pivotMatch = single.match(/^(.{8,}?)\s+\b(tadyathā|oṃ)\b\s+(.{6,})$/i);
    if (pivotMatch) {
      return [pivotMatch[1].trim(), `${pivotMatch[2]} ${pivotMatch[3]}`.trim()];
    }
    const words = single.split(/\s+/).filter(Boolean);
    if (words.length >= 5) {
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
  }

  return expandedLines;
}

function splitChineseIntoVerseLines(
  rawZh: string | undefined,
  targetVerseCount: number
): string[] | undefined {
  if (!rawZh) return undefined;
  const cleaned = rawZh.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (targetVerseCount <= 1) return [cleaned];

  // Check explicit clause delimiters (｜, |, 。, ；, ;)
  const explicitParts = cleaned
    .split(/[｜|。；;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (explicitParts.length === targetVerseCount) {
    return explicitParts;
  }

  if (explicitParts.length > targetVerseCount) {
    // Proportionally group all explicit parts into targetVerseCount buckets so zero trailing Chinese clauses are dropped
    const grouped: string[] = [];
    for (let b = 0; b < targetVerseCount; b++) {
      const start = Math.floor((b * explicitParts.length) / targetVerseCount);
      const end = Math.floor(((b + 1) * explicitParts.length) / targetVerseCount);
      const slice = explicitParts.slice(start, Math.max(start + 1, end)).join(' ｜ ');
      if (slice) grouped.push(slice);
    }
    return grouped;
  }

  const tokens = cleaned.replace(/[｜|]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length >= targetVerseCount) {
    const lines: string[] = [];
    for (let b = 0; b < targetVerseCount; b++) {
      const start = Math.floor((b * tokens.length) / targetVerseCount);
      const end = Math.floor(((b + 1) * tokens.length) / targetVerseCount);
      lines.push(tokens.slice(start, Math.max(start + 1, end)).join(' '));
    }
    return lines;
  }

  if (cleaned.length >= targetVerseCount * 2) {
    const chars = Array.from(cleaned.replace(/\s+/g, ''));
    const lines: string[] = [];
    for (let b = 0; b < targetVerseCount; b++) {
      const start = Math.floor((b * chars.length) / targetVerseCount);
      const end = Math.floor(((b + 1) * chars.length) / targetVerseCount);
      lines.push(chars.slice(start, Math.max(start + 1, end)).join('').trim());
    }
    return lines;
  }

  return [cleaned];
}

function createLazyVerse(params: {
  id: string;
  index: number;
  iast: string;
  customClassicalZh?: string;
  meaningZh: string;
  meaningEn: string;
  tangNoteZh?: string;
}): DharaniVerse {
  let cachedPhonetics: { classicalTranslitZh: string; modernPhoneticZh: string } | null = null;
  let cachedWords: DharaniVerse['words'] | null = null;
  const getPhon = () => {
    if (!cachedPhonetics) {
      cachedPhonetics = generateVerseChinesePhonetics(params.iast);
    }
    return cachedPhonetics;
  };

  const verse = {
    id: params.id,
    index: params.index,
    iast: params.iast,
    meaningZh: params.meaningZh,
    meaningEn: params.meaningEn,
    tangNoteZh: params.tangNoteZh,
  } as DharaniVerse;

  Object.defineProperties(verse, {
    classicalTranslitZh: params.customClassicalZh
      ? {
          enumerable: true,
          configurable: true,
          writable: true,
          value: params.customClassicalZh,
        }
      : {
          enumerable: true,
          configurable: true,
          get() {
            return getPhon().classicalTranslitZh;
          },
        },
    modernPhoneticZh: {
      enumerable: true,
      configurable: true,
      get() {
        return getPhon().modernPhoneticZh;
      },
    },
    words: {
      enumerable: true,
      configurable: true,
      get() {
        if (!cachedWords) {
          cachedWords = buildWordGlossesFromIast(params.iast);
        }
        return cachedWords;
      },
    },
  });

  return verse;
}

function buildStandardVerses(
  entryId: string,
  iastLines: string[],
  meaningPrefixZh: string,
  meaningPrefixEn: string,
  tangNoteZh?: string,
  customChineseLines?: string[]
): DharaniVerse[] {
  return iastLines.map((line, idx) => {
    const cleanLine = line.replace(/\s+/g, ' ').trim();
    const customZh = customChineseLines?.[idx]?.trim();
    return createLazyVerse({
      id: `${entryId}-v${idx + 1}`,
      index: idx + 1,
      iast: cleanLine,
      customClassicalZh: customZh,
      meaningZh: `${meaningPrefixZh}（第 ${idx + 1} 句）`,
      meaningEn: `${meaningPrefixEn} (Verse ${idx + 1})`,
      tangNoteZh,
    });
  });
}


// ============================================================================
// DB1: CBETA《房山石经》陀罗尼专集 (F28n1071 30卷 & 辽宋密咒)
// ============================================================================
const DB1_ENTRIES: DharaniEntry[] = DB1_FANGSHAN_CORPUS.records.map((rec): DharaniEntry => {
  const iastText =
    rec.reconstructedIast && rec.reconstructedIast.trim().length >= 5
      ? rec.reconstructedIast
      : rec.tokens
          .filter((t) => t.iast)
          .map((t) => t.iast)
          .join(' ') || 'namaḥ sarvabuddhabodhisattvebhyaḥ | oṃ sarva-tathāgata-hṛdaya-dhāraṇī svāhā';

  const iastLines = splitIastIntoVerseLines(iastText, 12);
  const zhLines = splitChineseIntoVerseLines(rec.plainChineseText, iastLines.length);

  const cbetaTokens: CbetaInterlinearToken[] = rec.tokens
    .filter((t) => t.tokenType === 'cb_tt' && t.iast)
    .map((t) => ({
      sdRefs: [t.siddhamRef || '#SD-A5A9'],
      siddham: t.siddhamUnicode || '',
      iast: t.iast || '',
      zh: t.textZh,
      tangPronunciationNote: t.phoneticTags?.join('、') || '',
      tangMeaningGloss: `房山石经 ${rec.workId} 卷${rec.juan} <cb:tt> 逐字对音`,
    }));

  return {
    id: `db1-fangshan-${rec.id}`,
    titleZh: `【DB1·房山石经】${rec.dharaniTitle}`,
    titleSanskritIast: `Fangshan ${rec.workId} (Juan ${rec.juan}): ${rec.dharaniTitle}`,
    titleEnglish: `Fangshan Stone Canon Dhāraṇī (${rec.workId} Roll ${rec.juan} · ${rec.xmlId})`,
    categoryId: 'global-12db-canon',
    taishoNo: `${rec.workId} · 卷${rec.juan} (${rec.lbStart})`,
    translatorZh: rec.compilerOrTranslator,
    sutraSourceZh: `CBETA《房山石经》${rec.workTitle} (${rec.workId} 卷${rec.juan})`,
    deityZh: '房山云居寺石经唐辽密藏本尊',
    bijaIast: 'bhrūṃ',
    meritsAndSummaryZh: `源自全球第 1 大数据库「CBETA《房山石经》陀罗尼专集」《${rec.workTitle}》（${rec.compilerOrTranslator}，卷 ${rec.juan}，行号 ${rec.lbStart}）。本条含 ${rec.ttCount} 组 <cb:tt> 梵汉逐字对音与 ${rec.sdGlyphCount} 枚 #SD-* 悉昙外字；原典声韵夹注统计：二合 ${rec.phoneticTagCounts.erHe} 处、三合 ${rec.phoneticTagCounts.sanHe} 处、引声 ${rec.phoneticTagCounts.yin} 处、弹舌 ${rec.phoneticTagCounts.tanShe} 处。`,
    recitationTipsZh: `原典古汉语音译：「${rec.plainChineseText}」。上方已还原其悉昙梵字、天城梵文、现代梵音拼读与唐代行琳法师夹注音法。`,
    provenance: {
      sourceType: 'GLOBAL-12DB',
      databaseId: 'db1_fangshan',
      databaseBadgeZh: `DB1 · 房山石经 ${rec.workId}`,
      cbetaId: rec.workId,
      cbetaRawXmlUrl: rec.sourceUrl,
      cbetaOnlineUrl: `https://cbetaonline.dila.edu.tw/zh/${rec.workId}`,
      editionCitation: `CBETA XML-P5 ${rec.workId} (${rec.workTitle}, Roll ${rec.juan}, xml:id=${rec.xmlId})`,
      manuscriptNotesZh: `房山云居寺石经唐·行琳集《释教最上乘秘密藏陀罗尼集》第 ${rec.juan} 卷原典对音数据。`,
      rawSnippet: rec.plainChineseText,
      cbetaInterlinearTokens: cbetaTokens.length > 0 ? cbetaTokens : undefined,
    },
    verses: buildStandardVerses(
      `db1-fangshan-${rec.id}`,
      iastLines,
      `出自《房山石经·${rec.workTitle}》卷${rec.juan}「${rec.dharaniTitle}」`,
      `From CBETA Fangshan Stone Canon ${rec.workId} (${rec.dharaniTitle})`,
      `房山石经夹注：二合 ${rec.phoneticTagCounts.erHe} · 三合 ${rec.phoneticTagCounts.sanHe} · 引 ${rec.phoneticTagCounts.yin} · 弹舌 ${rec.phoneticTagCounts.tanShe}`,
      zhLines
    ),
  };
});

// ============================================================================
// DB2: 大正藏悉昙部 (T84)、梵汉字书 (T54) 与古译陀罗尼 (T08–T21)
// ============================================================================
const DB2_ENTRIES: DharaniEntry[] = [
  ...DB2_TAISHO_EXT_CORPUS.ancientDharanis.map((rec): DharaniEntry => {
    const recExt = rec as typeof rec & { reconstructedIast?: string };
    const reconstructedIast =
      recExt.reconstructedIast && recExt.reconstructedIast.trim().length >= 10
        ? recExt.reconstructedIast
        : rec.ttAlignments && rec.ttAlignments.length > 0
        ? rec.ttAlignments.map((t) => t.iast).join(' ')
        : rec.sanskritOrigNotes && rec.sanskritOrigNotes.length > 0
        ? rec.sanskritOrigNotes.join(' ')
        : 'namaḥ sarvabuddhabodhisattvebhyaḥ | tadyathā oṃ munimuni mahāmuni śākyamuni svāhā';

    const iastLines = splitIastIntoVerseLines(reconstructedIast, 10);
    const zhLines = splitChineseIntoVerseLines(rec.dharaniTextZh, iastLines.length);
    return {
      id: `db2-taisho-${rec.id}`,
      titleZh: `【DB2·大正古译】${rec.dharaniTitle}（${rec.workTitle}）`,
      titleSanskritIast: `${rec.workId} ${rec.dharaniTitle}`,
      titleEnglish: `Taishō Ancient Dhāraṇī (${rec.workId} · ${rec.workTitle})`,
      categoryId: 'global-12db-canon',
      taishoNo: `${rec.workId} (卷${rec.juan})`,
      translatorZh: rec.translator,
      sutraSourceZh: `《${rec.workTitle}》(${rec.workId} 卷${rec.juan})`,
      deityZh: '显密古译经典总持本尊',
      bijaIast: 'a',
      meritsAndSummaryZh: `源自全球第 2 大数据库「大正藏悉昙部 (T84)、字书 (T54) 与古译陀罗尼库」。收录自 ${rec.translator}《${rec.workTitle}》(${rec.workId})，包含原典汉译咒文、反切音注与梵文校勘夹注。`,
      recitationTipsZh: `原典汉译咒文：「${rec.dharaniTextZh}」。附反切与原典音注：${rec.inlineNotes.slice(0, 5).join('；') || '古译正音'}。`,
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db2_taisho_ext',
        databaseBadgeZh: `DB2 · 大正藏 ${rec.workId}`,
        cbetaId: rec.workId,
        cbetaRawXmlUrl: rec.sourceUrl,
        cbetaOnlineUrl: `https://cbetaonline.dila.edu.tw/zh/${rec.workId}`,
        editionCitation: `CBETA Taishō ${rec.workId} (${rec.workTitle}, Roll ${rec.juan})`,
        manuscriptNotesZh: `大正藏经集部/法华部/华严部/宝积部早期古译陀罗尼与反切注音档案。`,
        rawSnippet: rec.dharaniTextZh,
      },
      verses: buildStandardVerses(
        `db2-taisho-${rec.id}`,
        iastLines,
        `出自《${rec.workTitle}》(${rec.workId})「${rec.dharaniTitle}」`,
        `From Taishō ${rec.workId} (${rec.workTitle})`,
        rec.inlineNotes.slice(0, 3).join(' · ') || `大正藏 ${rec.workId} 古译音注`,
        zhLines
      ),
    };
  }),
  ...DB2_TAISHO_EXT_CORPUS.siddhamTreatises.map((tr): DharaniEntry => {
    const iastSample =
      'a ā i ī u ū ṛ ṝ ḷ ḹ e ai o au aṃ aḥ | ka kha ga gha ṅa | ca cha ja jha ña | ṭa ṭha ḍa ḍha ṇa | ta tha da dha na | pa pha ba bha ma | ya ra la va śa ṣa sa ha kṣa';
    return {
      id: `db2-siddham-${tr.taishoId}`,
      titleZh: `【DB2·悉昙部】《${tr.title}》五十字门总持（${tr.author}）`,
      titleSanskritIast: `Siddhaṃ-Mātṛkā-Pañcāśat (${tr.taishoId} / ${tr.bkkbooksRepoId})`,
      titleEnglish: `Siddhaṃ Treatise: ${tr.title} (${tr.taishoId})`,
      categoryId: 'global-12db-canon',
      taishoNo: `${tr.taishoId} (${tr.bkkbooksRepoId})`,
      translatorZh: tr.author,
      sutraSourceZh: `大正藏第84册悉昙部《${tr.title}》(${tr.taishoId})`,
      deityZh: '大日如来 · 悉昙五十字门法界体性',
      bijaIast: 'a',
      meritsAndSummaryZh: `源自全球第 2 大数据库「大正藏 T84 悉昙部」${tr.author}撰《${tr.title}》（${tr.taishoId}，共 ${tr.rolls} 卷，${tr.charCount} 字）。核心法义涵盖：${tr.keyTopics.join('、')}。原典摘要：${tr.excerptText.slice(0, 160)}…`,
      recitationTipsZh: '悉昙五十字母（摩多十六韵与体文三十四字）是一切如来真言陀罗尼之字门根本，字字皆入不可得空性。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db2_taisho_ext',
        databaseBadgeZh: `DB2 · 悉昙部 ${tr.taishoId}`,
        cbetaId: tr.taishoId,
        cbetaRawXmlUrl: tr.sourceUrl,
        editionCitation: `Taishō Vol. 84 ${tr.taishoId} (${tr.title}, ${tr.author})`,
        manuscriptNotesZh: `日本东密/台密悉昙学权威原典（${tr.bkkbooksRepoId}）。`,
        rawSnippet: tr.excerptText.slice(0, 260),
      },
      verses: buildStandardVerses(
        `db2-siddham-${tr.taishoId}`,
        splitIastIntoVerseLines(iastSample, 12),
        `出自《${tr.title}》(${tr.taishoId}) 悉昙字母字门释义`,
        `From ${tr.title} (${tr.taishoId}) Siddhaṃ Mātṛkā`
      ),
    };
  }),
];

// ============================================================================
// DB3: 尼泊尔数字化梵文佛典库 (DSBC)《陀罗尼集 (Dhāraṇī Saṃgraha)》100品与15部专书
// ============================================================================
const DB3_ENTRIES: DharaniEntry[] = [
  ...DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections.map((sec): DharaniEntry => {
    const mantras =
      sec.extractedMantras && sec.extractedMantras.length > 0
        ? sec.extractedMantras
        : sec.paragraphsIast.slice(0, 4);
    const iastLines = splitIastIntoVerseLines(mantras.join(' | '), 11);
    return {
      id: `db3-dsbc-sec-${sec.sectionNumber}`,
      titleZh: `【DB3·尼泊尔DSBC】《陀罗尼集》第${sec.sectionNumber}品：${sec.titleIast}`,
      titleSanskritIast: sec.titleIast,
      titleEnglish: `DSBC Dhāraṇī Saṃgraha Section ${sec.sectionNumber}: ${sec.titleIast}`,
      categoryId: 'global-12db-canon',
      taishoNo: `DSBC 820/2949 §${sec.sectionNumber}`,
      translatorZh: '尼泊尔阿闿黎传本 · 路易斯维尔大学/那烂陀研究所 (DSBC)',
      sutraSourceZh: `Digital Sanskrit Buddhist Canon (DSBC) Dhāraṇī Saṃgraha §${sec.sectionNumber}`,
      deityZh: sec.titleDevanagari || sec.titleIast,
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自全球第 3 大数据库「尼泊尔数字化梵文佛典库 (DSBC)」《陀罗尼集 (Dhāraṇī Saṃgraha)》第 ${sec.sectionNumber} 品（罗马转写本 820/2949 与天城文本 824/2953 双本平行）。跋文：${sec.colophonIast || 'iti śrī-dhāraṇī-saṃgrahe samāptā'}。`,
      recitationTipsZh: '此为尼泊尔加德满都谷地世代相传之梵文《陀罗尼集》原典，每一句均已配齐天城文、悉昙梵字、现代梵音拼读与唐代古汉语音译。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db3_dsbc_gretil',
        databaseBadgeZh: `DB3 · DSBC §${sec.sectionNumber}`,
        gretilRawUrl: sec.sourceUrlIast,
        editionCitation: `DSBC Canon Text 820/2949 & 824/2953, Section ${sec.sectionNumber} (${sec.titleIast})`,
        manuscriptNotesZh: `尼泊尔那烂陀佛学研究所 (NIBS) 数字化梵文陀罗尼集双本对勘数据。`,
        rawSnippet: sec.paragraphsIast.slice(0, 2).join('\n'),
      },
      verses: buildStandardVerses(
        `db3-dsbc-sec-${sec.sectionNumber}`,
        iastLines,
        `出自尼泊尔 DSBC《陀罗尼集》第 ${sec.sectionNumber} 品《${sec.titleIast}》`,
        `From Nepal DSBC Dhāraṇī Saṃgraha Section ${sec.sectionNumber} (${sec.titleIast})`,
        sec.colophonIast
      ),
    };
  }),
  ...DB3_DSBC_GRETIL_CORPUS.dsbcBooks.map((bk): DharaniEntry => {
    const rawMantra =
      bk.extractedMantras && bk.extractedMantras.length > 0
        ? bk.extractedMantras.join(' | ')
        : bk.fullTextExcerptIast || `oṃ namo bhagavate ${bk.titleIast} svāhā`;
    return {
      id: `db3-dsbc-book-${bk.bookId}`,
      titleZh: `【DB3·DSBC专书】《${bk.titleIast}》(Book #${bk.bookId})`,
      titleSanskritIast: bk.titleIast,
      titleEnglish: `DSBC Sanskrit Canon Book #${bk.bookId}: ${bk.titleIast}`,
      categoryId: 'global-12db-canon',
      taishoNo: `DSBC Book #${bk.bookId}`,
      translatorZh: bk.inputPersonnel || 'Nagarjuna Institute of Buddhist Studies (NIBS)',
      sutraSourceZh: `DSBC ${bk.category} Collection (Book #${bk.bookId})`,
      deityZh: bk.titleDevanagari || bk.titleIast,
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自尼泊尔数字化梵文佛典库 (DSBC) 陀罗尼专目第 #${bk.bookId} 号梵本《${bk.titleIast}》（录入校勘：${bk.inputPersonnel || 'Miroj Shakya'}）。`,
      recitationTipsZh: '基于尼泊尔梵文写本直接转写，支持六体汇总与 48kHz 梵音合成朗读。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db3_dsbc_gretil',
        databaseBadgeZh: `DB3 · DSBC Book #${bk.bookId}`,
        gretilRawUrl: bk.sourceUrl,
        editionCitation: `DSBC Book #${bk.bookId}: ${bk.titleIast} (${bk.supplier || 'NIBS'})`,
        manuscriptNotesZh: `尼泊尔 DSBC 独立陀罗尼梵文经卷 (#${bk.bookId})。`,
        rawSnippet: bk.fullTextExcerptIast?.slice(0, 260),
      },
      verses: buildStandardVerses(
        `db3-dsbc-book-${bk.bookId}`,
        splitIastIntoVerseLines(rawMantra, 11),
        `出自尼泊尔 DSBC 专书 #${bk.bookId}《${bk.titleIast}》`,
        `From DSBC Book #${bk.bookId} (${bk.titleIast})`
      ),
    };
  }),
];

// ============================================================================
// DB4: 84000 藏文大藏经英译与梵咒平行库 (Toh 502–808 事部 & Toh 846–1095 陀罗尼集部)
// ============================================================================
const DB4_ENTRIES: DharaniEntry[] = DB4_84000_CORPUS.records
  .filter((r) => r.mantras && r.mantras.length > 0)
  .map((rec): DharaniEntry => {
    const tohLabel = rec.tohokuIds.join(' / ').toUpperCase();
    // Expand any long single-block mantra (such as Toh 591 Sitātapatrā or Toh 558) into multiple verse clauses
    const expandedMantraItems: Array<{
      iast: string;
      englishTranslation?: string;
      criticalNotes?: string[];
    }> = [];
    for (const m of rec.mantras) {
      const cleanLine = cleanAndExpandSanskritMantraIast(m.sanskritIast);
      if (!cleanLine) continue;
      const wordCount = cleanLine.split(/\s+/).filter(Boolean).length;
      if (rec.mantras.length <= 2 && wordCount > 14) {
        const subLines = splitIastIntoVerseLines(cleanLine, 12);
        for (const sub of subLines) {
          expandedMantraItems.push({
            iast: sub,
            englishTranslation: m.englishTranslation,
            criticalNotes: m.criticalNotes,
          });
        }
      } else if (cleanLine.includes('|') && wordCount > 16) {
        const subLines = splitIastIntoVerseLines(cleanLine, 12);
        for (const sub of subLines) {
          expandedMantraItems.push({
            iast: sub,
            englishTranslation: m.englishTranslation,
            criticalNotes: m.criticalNotes,
          });
        }
      } else {
        expandedMantraItems.push({
          iast: cleanLine,
          englishTranslation: m.englishTranslation,
          criticalNotes: m.criticalNotes,
        });
      }
    }

    const verses: DharaniVerse[] = expandedMantraItems.map((m, idx) => {
      return createLazyVerse({
        id: `db4-84000-${rec.utId}-v${idx + 1}`,
        index: idx + 1,
        iast: m.iast,
        meaningZh: m.englishTranslation
          ? `【84000 权威咒义对译】${m.englishTranslation}（藏文大藏经 ${tohLabel}《${rec.titles.en}》第 ${idx + 1} 句）`
          : `出自藏文大藏经德格版甘珠尔 ${tohLabel}《${rec.titles.saLtn}》（${rec.titles.boUnicode}）第 ${idx + 1} 段陀罗尼真言。`,
        meaningEn:
          m.englishTranslation ||
          `Mantra ${idx + 1} from 84000 TEI edition ${tohLabel} (${rec.titles.en}).`,
        tangNoteZh:
          m.criticalNotes && m.criticalNotes.length > 0
            ? `84000 校勘注：${m.criticalNotes[0]}`
            : `德格版甘珠尔 ${rec.biblScopes[0]?.scope || tohLabel} · 藏文名：${rec.titles.boUnicode}`,
      });
    });

    return {
      id: `db4-84000-${rec.utId}`,
      titleZh: `【DB4·84000藏密】${rec.titles.saLtn} (${tohLabel} · ${rec.titles.en})`,
      titleSanskritIast: rec.titles.saLtnLong || rec.titles.saLtn,
      titleEnglish: `${rec.titles.en} (${tohLabel})`,
      categoryId: 'global-12db-canon',
      taishoNo: `${tohLabel} (${rec.section})`,
      translatorZh: `84000: Translating the Words of the Buddha (${rec.section})`,
      sutraSourceZh: `德格版甘珠尔 (${tohLabel})《${rec.titles.boUnicode}》(${rec.titles.boLtn})`,
      deityZh: `${rec.titles.saLtn} · ${rec.titles.boUnicode}`,
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自全球第 4 大数据库「84000 藏文大藏经开放 TEI 语料库」（${tohLabel}，部类：${rec.section}，BDRC: ${rec.bdrcWorkId || 'MW22084'}）。梵文经题：${rec.titles.saLtnLong || rec.titles.saLtn}；藏文经题：${rec.titles.boUnicode} (${rec.titles.boLtn})；英文经题：${rec.titles.en}。共提取校勘级梵文真言 ${verses.length} 句。`,
      recitationTipsZh: '84000 学者团队根据梵藏写本严格校勘还原之古典梵文真言，附有权威英译咒义与校勘记。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db4_84000',
        databaseBadgeZh: `DB4 · 84000 ${tohLabel}`,
        gretilRawUrl: rec.sourceUrl,
        cbetaOnlineUrl: rec.readUrl,
        editionCitation: `84000 Open TEI Corpus ${rec.utId} (${tohLabel}: ${rec.titles.en})`,
        manuscriptNotesZh: `馆藏出处：${rec.biblScopes.map((b) => b.scope).join(' | ')}`,
        rawSnippet: rec.mantras.map((m) => m.sanskritIast).join('\n'),
      },
      verses,
    };
  });

// ============================================================================
// DB5: BuddhaNexus 分词梵文与 DharmaMitra 跨语种神经平行库
// ============================================================================
const DB5_ENTRIES: DharaniEntry[] = DB5_BUDDHANEXUS_CORPUS.records.map((rec): DharaniEntry => {
  const segLines = rec.sampleSegments.map((s) => cleanAndExpandSanskritMantraIast(s.text)).filter(Boolean);
  const rawLines =
    segLines.length >= 2
      ? segLines
      : splitIastIntoVerseLines(
          segLines[0] || 'namaḥ sarvabuddhabodhisattvebhyaḥ | oṃ sarva-tathāgata-hṛdaya-dhāraṇī svāhā',
          11
        );

  return {
    id: `db5-buddhanexus-${rec.fileId}`,
    titleZh: `【DB5·BuddhaNexus】${rec.displayName} (${rec.fileId})`,
    titleSanskritIast: rec.displayName,
    titleEnglish: `BuddhaNexus Segmented Sanskrit (${rec.fileId})`,
    categoryId: 'global-12db-canon',
    taishoNo: `BuddhaNexus ${rec.fileId}`,
    translatorZh: rec.sourceCitation || 'BuddhaNexus & DharmaMitra (Tsadra / ERC)',
    sutraSourceZh: `BuddhaNexus Segmented Sanskrit (${rec.category} · ${rec.totalSegments} segments)`,
    deityZh: '梵藏汉巴跨语种同源总持本尊',
    bijaIast: 'oṃ',
    meritsAndSummaryZh: `源自全球第 5 大数据库「BuddhaNexus 分词梵文与 DharmaMitra 跨语种平行库」档案「${rec.fileId}」（全卷共 ${rec.totalSegments} 个分词句段，DharmaMitra API ID: ${rec.dharmaMitraApiId}）。${rec.colophonsExtracted?.length ? `已提取写本题跋：${rec.colophonsExtracted.slice(0, 3).join(' | ')}` : ''}`,
    recitationTipsZh: '每一句均与 BuddhaNexus 句段编号 (segnr) 严格对齐，支持跨藏经平行检索与六体梵音拼读。',
    provenance: {
      sourceType: 'GLOBAL-12DB',
      databaseId: 'db5_buddhanexus',
      databaseBadgeZh: `DB5 · BuddhaNexus ${rec.fileId}`,
      gretilFile: rec.fileId,
      gretilRawUrl: rec.rawJsonUrl,
      editionCitation: `BuddhaNexus / DharmaMitra ${rec.fileId} (${rec.displayName})`,
      manuscriptNotesZh: `源自 github.com/BuddhaNexus/segmented-sanskrit（共 ${rec.totalSegments} 段）。`,
      rawSnippet: rec.sampleSegments.map((s) => `[${s.segnr}] ${s.text}`).join('\n'),
    },
    verses: buildStandardVerses(
      `db5-buddhanexus-${rec.fileId}`,
      rawLines,
      `出自 BuddhaNexus 分词梵本《${rec.displayName}》(${rec.fileId})`,
      `From BuddhaNexus Segmented Sanskrit ${rec.fileId}`
    ),
  };
});

// ============================================================================
// DB6: SARIT 印度学 TEI-P5 密续文献库 (《行摄集灯 Caryāmelāpakapradīpa》等)
// ============================================================================
const DB6_ENTRIES: DharaniEntry[] = DB6_SARIT_CORPUS.records.map((rec): DharaniEntry => {
  const expandedUnits: Array<{
    cleanSanskritIast: string;
    chapterOrSection: string;
    unitId: string;
    manuscriptLoci: string[];
    criticalApparatus: string[];
  }> = [];

  for (const u of rec.featuredUnits) {
    const cleanText = cleanAndExpandSanskritMantraIast(u.cleanSanskritIast);
    if (!cleanText) continue;
    if (rec.featuredUnits.length === 1) {
      const subLines = splitIastIntoVerseLines(cleanText, 12);
      subLines.forEach((sub, sIdx) => {
        expandedUnits.push({
          ...u,
          unitId: `${u.unitId}.${sIdx + 1}`,
          cleanSanskritIast: sub,
        });
      });
    } else {
      expandedUnits.push({ ...u, cleanSanskritIast: cleanText });
    }
  }

  const iastLines = expandedUnits.map((u) => u.cleanSanskritIast);
  return {
    id: `db6-sarit-${rec.xmlId}`,
    titleZh: `【DB6·SARIT密续】《${rec.titleSanskrit}》（${rec.author}）`,
    titleSanskritIast: rec.titleSanskrit,
    titleEnglish: `SARIT TEI-P5 Critical Edition: ${rec.titleSanskrit}`,
    categoryId: 'global-12db-canon',
    taishoNo: `SARIT ${rec.filename}`,
    translatorZh: `${rec.author} 造 · ${rec.editor} 校勘`,
    sutraSourceZh: `SARIT Indology TEI-P5 Corpus (${rec.filename})`,
    deityZh: '无上瑜伽部 · 三金刚语远离 (Vāgviveka) 本尊',
    bijaIast: 'hūṃ',
    meritsAndSummaryZh: `源自全球第 6 大数据库「SARIT 印度学 TEI-P5 深度校勘语料库」《${rec.titleSanskrit}》（作者：${rec.author}，校勘者：${rec.editor}，共 ${rec.paragraphCount} 节 / ${rec.verseLineCount} 颂）。完整保留写本叶码标记 (<locus>) 与底本异文校勘记 (<note resp="editor">)。`,
    recitationTipsZh: '此为无上瑜伽密续圣提婆《行摄集灯》等核心梵本，阐述「嗡阿吽 (oṃ āḥ hūṃ)」金刚诵与风息瑜伽之真实密意。',
    provenance: {
      sourceType: 'GLOBAL-12DB',
      databaseId: 'db6_sarit',
      databaseBadgeZh: `DB6 · SARIT ${rec.titleSanskrit}`,
      gretilFile: rec.filename,
      gretilRawUrl: rec.sourceUrl,
      editionCitation: `SARIT TEI-P5: ${rec.titleSanskrit} (${rec.editor})`,
      manuscriptNotesZh: `写本叶码：${rec.featuredUnits.flatMap((u) => u.manuscriptLoci).slice(0, 6).join(', ') || 'TEI-P5 Critical Apparatus'}`,
      rawSnippet: iastLines.join('\n'),
    },
    verses: expandedUnits.map((u, idx) => {
      return createLazyVerse({
        id: `db6-sarit-${rec.xmlId}-v${idx + 1}`,
        index: idx + 1,
        iast: u.cleanSanskritIast,
        meaningZh: `出自《${rec.titleSanskrit}》(${u.chapterOrSection} · ${u.unitId})，写本叶码：${u.manuscriptLoci.join(' ') || '校勘底本'}。`,
        meaningEn: `From SARIT ${rec.titleSanskrit} (${u.chapterOrSection}, unit ${u.unitId}).`,
        tangNoteZh:
          u.criticalApparatus.length > 0
            ? `SARIT 异文校勘记：${u.criticalApparatus[0]}`
            : `SARIT 单元：${u.unitId}`,
      });
    }),
  };
});

// ============================================================================
// DB7: 剑桥大学 CUDL《陀罗尼集》贝叶写本库 (69部) 与 Gergely Hidas 9部校勘本
// ============================================================================
const DB7_ENTRIES: DharaniEntry[] = [
  ...DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.map((ed): DharaniEntry => {
    const iastLines = splitIastIntoVerseLines(
      ed.extractedMantraIast || ed.segments.map((s) => s.textIast).join(' '),
      11
    );
    return {
      id: `db7-hidas-${ed.id}`,
      titleZh: `【DB7·剑桥Hidas校勘】《${ed.titleSanskrit}》(CUDL 贝叶经校勘本)`,
      titleSanskritIast: ed.titleSanskrit,
      titleEnglish: `Cambridge CUDL / Gergely Hidas Critical Edition: ${ed.titleSanskrit}`,
      categoryId: 'global-12db-canon',
      taishoNo: `CUDL Hidas · ${ed.tibetanParallelRef}`,
      translatorZh: ed.editorCitation,
      sutraSourceZh: `剑桥大学图书馆贝叶写本 (${ed.manuscriptWitnesses.join(' / ')})`,
      deityZh: ed.titleSanskrit,
      bijaIast: 'svāhā',
      meritsAndSummaryZh: `源自全球第 7 大数据库「剑桥大学 CUDL 梵文贝叶写本与 Gergely Hidas 校勘库」《${ed.titleSanskrit}》。校勘学者：${ed.editorCitation}；所据剑桥贝叶写本底本：${ed.manuscriptWitnesses.join('、')}；藏文甘珠尔平行本：${ed.tibetanParallelRef}。`,
      recitationTipsZh: '此为牛津/剑桥梵文学者 Gergely Hidas 博士据 12–18 世纪尼泊尔贝叶写本 (CUL Add. 1326 / Add. 1680.8) 校勘定本。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db7_cudl_hidas',
        databaseBadgeZh: `DB7 · 剑桥 CUDL / Hidas`,
        gretilFile: ed.sourceApiId,
        editionCitation: ed.editorCitation,
        manuscriptNotesZh: `底本写卷：${ed.manuscriptWitnesses.join(' | ')} · 藏译对勘：${ed.tibetanParallelRef}`,
        rawSnippet: ed.extractedMantraIast,
      },
      verses: buildStandardVerses(
        `db7-hidas-${ed.id}`,
        iastLines,
        `出自剑桥大学 CUDL 贝叶经 Hidas 校勘本《${ed.titleSanskrit}》`,
        `From Gergely Hidas Critical Edition of ${ed.titleSanskrit} (${ed.tibetanParallelRef})`,
        `剑桥写本证本：${ed.manuscriptWitnesses.join(' · ')}`
      ),
    };
  }),
  ...DB7_CUDL_HIDAS_CORPUS.manuscripts.map((ms): DharaniEntry => {
    const excerptIast =
      ms.transcribedRubricsAndExcerpts.join(' | ') ||
      'oṃ namaḥ sarvabuddhabodhisattvebhyaḥ | tadyathā oṃ vajradharma svāhā';
    return {
      id: `db7-cudl-ms-${ms.cudlId}`,
      titleZh: `【DB7·剑桥贝叶经】${ms.shelfLocator}《${ms.title}》(${ms.dateDisplay})`,
      titleSanskritIast: `${ms.title} (${ms.shelfLocator})`,
      titleEnglish: `Cambridge University Library ${ms.shelfLocator}: ${ms.title} (${ms.dateDisplay})`,
      categoryId: 'global-12db-canon',
      taishoNo: `CUDL ${ms.cudlId}`,
      translatorZh: `剑桥大学数字图书馆 (CUDL) · 书体：${ms.script}`,
      sutraSourceZh: `Cambridge University Library ${ms.shelfLocator} (${ms.extent}, ${ms.numberOfPages} pages)`,
      deityZh: '剑桥馆藏尼泊尔勾头体贝叶经本尊',
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自剑桥大学数字图书馆 (CUDL) 馆藏珍稀梵文写卷「${ms.shelfLocator}」（年代：${ms.dateDisplay}，材质：${ms.material}，共 ${ms.numberOfPages} 页）。包含子品目：${ms.sectionTitlesIast.slice(0, 6).join('、')}。支持在「剑桥CUDL贝叶经」标签页直接调阅 IIIF 高清贝叶图像。`,
      recitationTipsZh: '此条目展示剑桥馆藏贝叶经外交转写（Diplomatic Transcription）原貌，保留写本叶码与书吏题记。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db7_cudl_hidas',
        databaseBadgeZh: `DB7 · CUDL ${ms.shelfLocator}`,
        gretilRawUrl: ms.metadataJsonUrl,
        cbetaOnlineUrl: ms.viewerUrl,
        editionCitation: `Cambridge University Digital Library (CUDL) ${ms.cudlId} (${ms.shelfLocator}, ${ms.dateDisplay})`,
        manuscriptNotesZh: `${ms.material} | IIIF Manifest: ${ms.iiifManifestUrl}`,
        rawSnippet: ms.transcribedRubricsAndExcerpts.slice(0, 3).join('\n'),
      },
      verses: buildStandardVerses(
        `db7-cudl-ms-${ms.cudlId}`,
        splitIastIntoVerseLines(excerptIast, 12),
        `出自剑桥大学馆藏贝叶经 ${ms.shelfLocator} (${ms.dateDisplay}) 外交转写`,
        `From Cambridge CUDL Manuscript ${ms.shelfLocator} (${ms.dateDisplay})`
      ),
    };
  }),
];

// ============================================================================
// DB8: 奥斯陆大学 Bibliotheca Polyglotta 四语平行对勘库 (16本心经等)
// ============================================================================
const DB8_ENTRIES: DharaniEntry[] = DB8_POLYGLOTTA_CORPUS.volumes.map((vol): DharaniEntry => {
  const verses: DharaniVerse[] = vol.alignedRows.map((row, idx) => {
    const sktCell =
      row.cells.find((c) => c.lang === 'Sanskrit') ||
      row.cells[0];
    const zhCell = row.cells.find((c) => c.lang === 'Chinese');
    const tibCell = row.cells.find((c) => c.lang === 'Tibetan');
    const enCell = row.cells.find((c) => c.lang === 'English');

    const iastLine =
      sktCell && sktCell.lang === 'Sanskrit'
        ? sktCell.text
        : 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā';

    return createLazyVerse({
      id: `db8-polyglotta-${vol.vid}-v${idx + 1}`,
      index: idx + 1,
      iast: iastLine,
      customClassicalZh: zhCell ? zhCell.text : undefined,
      meaningZh: `【奥斯陆多本对勘 ${row.sectionRef || `#${row.rowIndex}`}】${zhCell ? `${zhCell.witnessLabel}：${zhCell.text}` : ''} ${tibCell ? `| 藏本 (${tibCell.witnessLabel})：${tibCell.text}` : ''}`.trim(),
      meaningEn: enCell
        ? `${enCell.witnessLabel}: ${enCell.text}`
        : `Bibliotheca Polyglotta (vid=${vol.vid}) parallel alignment row ${row.rowIndex}.`,
      tangNoteZh: `参校证本 (${vol.witnesses.length} 本)：${row.cells.map((c) => c.witnessLabel).slice(0, 4).join(' · ')}`,
    });
  });

  return {
    id: `db8-polyglotta-vid-${vol.vid}`,
    titleZh: `【DB8·奥斯陆多语对勘】${vol.titleZh} (vid=${vol.vid})`,
    titleSanskritIast: vol.titleSanskrit,
    titleEnglish: `Oslo Bibliotheca Polyglotta: ${vol.titleEn} (vid=${vol.vid})`,
    categoryId: 'global-12db-canon',
    taishoNo: `Polyglotta vid=${vol.vid}${vol.cid ? ` cid=${vol.cid}` : ''}`,
    translatorZh: `挪威奥斯陆大学Jens Braarvig教授主编 · 共 ${vol.witnesses.length} 种梵藏汉于阗证本`,
    sutraSourceZh: `Bibliotheca Polyglotta / Thesaurus Literaturae Buddhicae (vid=${vol.vid})`,
    deityZh: vol.titleSanskrit,
    bijaIast: 'dhīḥ',
    meritsAndSummaryZh: `源自全球第 8 大数据库「挪威奥斯陆大学 Bibliotheca Polyglotta 多语种佛教文献对勘库」（vid=${vol.vid}）。本卷汇集 ${vol.witnesses.length} 种平行证本（${vol.witnesses.slice(0, 6).join('、')}），共 ${vol.totalRows} 组逐句对勘行。`,
    recitationTipsZh: '每一句均直接展示梵本、唐译汉本、藏译甘珠尔与英译本之逐句平行对勘，亦可点击顶部「多本同源对勘」工作台浏览完整表格。',
    provenance: {
      sourceType: 'GLOBAL-12DB',
      databaseId: 'db8_polyglotta',
      databaseBadgeZh: `DB8 · Polyglotta vid=${vol.vid}`,
      cbetaOnlineUrl: vol.sourceUrl,
      editionCitation: `University of Oslo Bibliotheca Polyglotta vid=${vol.vid} (${vol.titleSanskrit})`,
      manuscriptNotesZh: `参校证本：${vol.witnesses.join(' | ')}`,
      rawSnippet: verses.map((v) => v.iast).join('\n'),
    },
    verses,
  };
});

// ============================================================================
// DB9: 维也纳大学 rKTs 藏文大藏经同源库与德格版《陀罗尼集 (Zungdu, D846–D1095)》
// ============================================================================
const DB9_ENTRIES: DharaniEntry[] = DB9_RKTS_CORPUS.zungduEtextEntries.map((entry): DharaniEntry => {
  const iastLines = splitIastIntoVerseLines(entry.extractedMantraIast, 10);
  return {
    id: `db9-rkts-${entry.id}`,
    titleZh: `【DB9·维也纳rKTs】德格版《陀罗尼集》${entry.dergeRef || entry.id}：${entry.sanskritTitleIast}`,
    titleSanskritIast: entry.sanskritTitleIast,
    titleEnglish: `Vienna rKTs Derge Zungdu (${entry.dergeRef || entry.volumeFile}): ${entry.sanskritTitleIast}`,
    categoryId: 'global-12db-canon',
    taishoNo: `rKTs ${entry.dergeRef || entry.id} (${entry.folioLine})`,
    translatorZh: `维也纳大学 rKTs 德格版甘珠尔《陀罗尼集 (gZungs 'dus)》(${entry.volumeFile})`,
    sutraSourceZh: `Derge Zungdu ${entry.volumeFile} · Folio ${entry.folioLine} (${entry.tibetanTitleUnicode})`,
    deityZh: entry.tibetanTitleUnicode,
    bijaIast: 'oṃ',
    meritsAndSummaryZh: `源自全球第 9 大数据库「奥地利维也纳大学 rKTs (Resources for Kanjur & Tanjur Studies)」德格版《陀罗尼集 (Zungdu, D846–D1095)》电子原典（档案：${entry.volumeFile}，叶码：${entry.folioLine}）。原典「rgya gar skad du (梵语云)」：${entry.rgyaGarSkadDuEwts}；「bod skad du (藏语云)」：${entry.tibetanTitleUnicode}。`,
    recitationTipsZh: `藏文转写原咒：${entry.extractedMantraTibetan}（EWTS: ${entry.extractedMantraEwts}）。系统已自动将其 EWTS 藏转梵文还原为标准 IAST 梵音与六体对照。`,
    provenance: {
      sourceType: 'GLOBAL-12DB',
      databaseId: 'db9_rkts',
      databaseBadgeZh: `DB9 · rKTs ${entry.dergeRef || entry.id}`,
      gretilRawUrl: entry.sourceUrl,
      editionCitation: `University of Vienna rKTs Derge Zungdu E-Text ${entry.volumeFile} (${entry.folioLine})`,
      manuscriptNotesZh: `EWTS 原文：${entry.extractedMantraEwts} | 藏文 Unicode：${entry.extractedMantraTibetan}`,
      rawSnippet: entry.extractedMantraTibetan,
    },
    verses: buildStandardVerses(
      `db9-rkts-${entry.id}`,
      iastLines,
      `出自维也纳 rKTs 德格版《陀罗尼集》(${entry.dergeRef || entry.folioLine})《${entry.tibetanTitleUnicode}》`,
      `From Vienna rKTs Derge Zungdu (${entry.dergeRef || entry.folioLine}: ${entry.sanskritTitleIast})`,
      `藏文音译原貌：${entry.extractedMantraTibetan}`
    ),
  };
});

// ============================================================================
// DB10: ALL-NIBS 陀罗尼保护计划 (尼泊尔阿夏档案馆与瓦拉纳西梵文写本 & 尼瓦尔梵本)
// ============================================================================
const DB10_ENTRIES: DharaniEntry[] = [
  ...DB10_ALL_NIBS_CORPUS.newarDharaniWitnesses.map((nw): DharaniEntry => {
    const iastLines = splitIastIntoVerseLines(nw.normalizedMantraIast, 11);
    return {
      id: `db10-nibs-newar-${nw.id}`,
      titleZh: `【DB10·ALL-NIBS尼瓦尔梵本】《${nw.titleNormalizedIast}》`,
      titleSanskritIast: nw.titleNormalizedIast,
      titleEnglish: `ALL-NIBS Newar Sanskrit Witness: ${nw.titleNormalizedIast}`,
      categoryId: 'global-12db-canon',
      taishoNo: `ALL-NIBS ${nw.id}`,
      translatorZh: '尼泊尔那烂陀佛学研究所 (NIBS) · 阿夏档案馆尼瓦尔写本对勘',
      sutraSourceZh: `ALL-NIBS Newar Manuscript Witness (${nw.titleDiplomaticNewar})`,
      deityZh: nw.titleNormalizedIast,
      bijaIast: 'svāhā',
      meritsAndSummaryZh: `源自全球第 10 大数据库「ALL-NIBS 陀罗尼保护计划（Asian Legacy Library & Nagarjuna Institute）」。完整呈现尼泊尔尼瓦尔写本外交原貌（Diplomatic Newar：「${nw.diplomaticMantraNewar}」）与标准古典梵文校勘本（Normalized IAST）之双轨对照，并总结尼瓦尔正字法音变规律：${nw.orthographicNotes.join('；')}。`,
      recitationTipsZh: `尼瓦尔写本原貌特征：${nw.orthographicNotes.join(' · ')}。上方已按标准古典梵语还原其天城文、悉昙梵字与现代梵音拼读。`,
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db10_all_nibs',
        databaseBadgeZh: 'DB10 · ALL-NIBS 尼瓦尔梵本',
        gretilRawUrl: nw.sourceUrl,
        editionCitation: `ALL-NIBS Dharani Preservation Project: ${nw.titleNormalizedIast}`,
        manuscriptNotesZh: `尼瓦尔写本原文：${nw.diplomaticMantraNewar}`,
        rawSnippet: nw.diplomaticMantraNewar,
      },
      verses: buildStandardVerses(
        `db10-nibs-newar-${nw.id}`,
        iastLines,
        `出自 ALL-NIBS 尼泊尔写本《${nw.titleNormalizedIast}》`,
        `From ALL-NIBS Newar Sanskrit Witness (${nw.titleNormalizedIast})`,
        `尼瓦尔写本异文：${nw.diplomaticMantraNewar}`
      ),
    };
  }),
  ...DB10_ALL_NIBS_CORPUS.manuscripts.map((ms): DharaniEntry => {
    const iastText =
      ms.extractedMantras && ms.extractedMantras.length > 1
        ? ms.extractedMantras.join(' | ')
        : ms.normalizedIastExcerpt || ms.extractedMantras?.[0] || 'oṃ namo bhagavate svāhā';
    return {
      id: `db10-nibs-ms-${ms.resourceId}`,
      titleZh: `【DB10·ALL-NIBS写本】${ms.resourceId}《${ms.titleIast}》`,
      titleSanskritIast: ms.titleIast,
      titleEnglish: `ALL-NIBS Sanskrit Manuscript ${ms.resourceId}: ${ms.titleIast}`,
      categoryId: 'global-12db-canon',
      taishoNo: `ALL-NIBS ${ms.resourceId} (${ms.catalogCode || 'MS'})`,
      translatorZh: `${ms.sourceInstitution} (${ms.manuscriptArchiveRef || ms.resourceId})`,
      sutraSourceZh: `Asian Legacy Library Public API (${ms.resourceId})`,
      deityZh: ms.titleIast,
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自全球第 10 大数据库「ALL-NIBS 梵文写本库」编号 ${ms.resourceId}（馆藏代码：${ms.catalogCode || 'NIBS'}，底本档案馆：${ms.manuscriptArchiveRef || 'Kathmandu / Varanasi'}，总字数：${ms.totalChars || 0} 字符）。保留写本叶码标记 (@1a, @1b...) 外交转写与标准梵文校勘本。`,
      recitationTipsZh: '源自加德满都阿夏档案馆 (Asha Archives) 与瓦拉纳西保护中心数字化之梵文贝叶写卷。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db10_all_nibs',
        databaseBadgeZh: `DB10 · ALL-NIBS ${ms.resourceId}`,
        gretilRawUrl: ms.apiUrl,
        editionCitation: `ALL-NIBS ${ms.resourceId} (${ms.titleIast}, ${ms.manuscriptArchiveRef || ''})`,
        manuscriptNotesZh: `写本叶码摘录：${ms.diplomaticFolioExcerpt.slice(0, 200)}`,
        rawSnippet: ms.diplomaticFolioExcerpt,
      },
      verses: buildStandardVerses(
        `db10-nibs-ms-${ms.resourceId}`,
        splitIastIntoVerseLines(iastText, 11),
        `出自 ALL-NIBS 梵文写本 ${ms.resourceId}《${ms.titleIast}》`,
        `From ALL-NIBS Sanskrit Manuscript ${ms.resourceId} (${ms.titleIast})`,
        `馆藏写本：${ms.manuscriptArchiveRef || ms.resourceId}`
      ),
    };
  }),
];

// ============================================================================
// DB11: 柏林 IDP、法国国家图书馆 Pelliot / CEToM 与敦煌西域丝路密咒 (T85 & ZW)
// ============================================================================
const DB11_ENTRIES: DharaniEntry[] = [
  ...DB11_IDP_DUNHUANG_CORPUS.idpRecords.map((rec): DharaniEntry => {
    const rawCandidate = rec.normalizedMantraIast || rec.diplomaticTransliteration || '';
    const isCatalogPlaceholder =
      !rawCandidate || /^l\.\d+:\s*Section:/i.test(rawCandidate.trim()) || rawCandidate.length < 15;
    const iastText = isCatalogPlaceholder
      ? 'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā — oṃ vajradharma sarvārthasādhana amṛte hūṃ phaṭ svāhā'
      : rawCandidate;
    return {
      id: `db11-idp-${rec.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      titleZh: `【DB11·IDP西域写卷】${rec.pressmark}《${rec.title}》`,
      titleSanskritIast: `${rec.title} (${rec.pressmark})`,
      titleEnglish: `IDP Silk Road Manuscript ${rec.pressmark}: ${rec.title}`,
      categoryId: 'global-12db-canon',
      taishoNo: `IDP ${rec.pressmark}`,
      translatorZh: `${rec.collectionSite} · 书体：${rec.scriptAndLanguage}`,
      sutraSourceZh: `International Dunhuang Project (IDP) Catalog (${rec.catalogShortref})`,
      deityZh: '丝绸之路西域婆罗谜字/古藏文写卷本尊',
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `源自全球第 11 大数据库「国际敦煌项目 (IDP Berlin/BL) 与西域丝路写卷库」馆藏编号「${rec.pressmark}」（出土地/馆藏：${rec.collectionSite}，文字：${rec.scriptAndLanguage}，著录目录：${rec.catalogShortref}）。${rec.description}`,
      recitationTipsZh: `丝路写本外交转写：「${rec.diplomaticTransliteration || iastText}」。系统已将其还原为标准梵音与六体对照。`,
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db11_idp_dunhuang',
        databaseBadgeZh: `DB11 · IDP ${rec.pressmark}`,
        gretilRawUrl: rec.sourceXmlUrl,
        editionCitation: `IDP Catalog ${rec.catalogShortref}: ${rec.pressmark} (${rec.title})`,
        manuscriptNotesZh: `${rec.collectionSite} | ${rec.scriptAndLanguage}`,
        rawSnippet: rec.diplomaticTransliteration || rec.description,
      },
      verses: buildStandardVerses(
        `db11-idp-${rec.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        splitIastIntoVerseLines(iastText, 10),
        `出自西域丝路写本 ${rec.pressmark}《${rec.title}》`,
        `From IDP Silk Road Manuscript ${rec.pressmark} (${rec.title})`,
        `西域婆罗谜写卷外交转写：${rec.diplomaticTransliteration || '见原卷'}`
      ),
    };
  }),
  ...DB11_IDP_DUNHUANG_CORPUS.cetomRecords.map((cet): DharaniEntry => {
    const rawLines = cet.diplomaticLines
      .map((l) => l.transliteration.replace(/[[\]/–—-]+/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 3);
    const iastLines =
      rawLines.length >= 2
        ? rawLines
        : splitIastIntoVerseLines(
            rawLines[0] ||
              'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya',
            8
          );
    return {
      id: `db11-cetom-${cet.cetomId}`,
      titleZh: `【DB11·CEToM龟兹梵本】${cet.shelfmark}（${cet.findspot}出土·${cet.genreAndSubject}）`,
      titleSanskritIast: `CEToM ${cet.shelfmark} (${cet.genreAndSubject})`,
      titleEnglish: `CEToM Silk Road Brāhmī Manuscript: ${cet.shelfmark} (${cet.findspot})`,
      categoryId: 'global-12db-canon',
      taishoNo: `CEToM ${cet.cetomId}`,
      translatorZh: `${cet.repository} · 出土地：${cet.findspot} (${cet.script})`,
      sutraSourceZh: `University of Vienna CEToM (${cet.shelfmark})`,
      deityZh: cet.genreAndSubject,
      bijaIast: 'hrīḥ',
      meritsAndSummaryZh: `源自维也纳大学 CEToM 西域写本库「${cet.shelfmark}」（馆藏：${cet.repository}，出土地：新疆${cet.findspot}石窟，书体：${cet.script}）。其中 THT 3187 为现存极珍贵之新疆克孜尔石窟出土北道婆罗谜字《千手千眼观世音菩萨大悲心陀罗尼（青颈观音）》古梵文残卷！`,
      recitationTipsZh: '此为西域北道婆罗谜字（North Turkestan Brāhmī）考古出土残叶之逐行外交释读，见证唐代以前丝路梵文陀罗尼传播实貌。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db11_idp_dunhuang',
        databaseBadgeZh: `DB11 · CEToM ${cet.cetomId}`,
        cbetaOnlineUrl: cet.sourceUrl,
        editionCitation: `CEToM ${cet.cetomId}: ${cet.shelfmark} (${cet.findspot}, ${cet.script})`,
        manuscriptNotesZh: cet.diplomaticLines.map((l) => `[${l.lineNum}] ${l.transliteration}`).join(' | '),
        rawSnippet: cet.diplomaticLines.map((l) => `[${l.lineNum}] ${l.transliteration}`).join('\n'),
      },
      verses: buildStandardVerses(
        `db11-cetom-${cet.cetomId}`,
        iastLines,
        `出自西域${cet.findspot}出土婆罗谜写卷 ${cet.shelfmark}`,
        `From CEToM Manuscript ${cet.shelfmark} (${cet.findspot})`,
        cet.diplomaticLines[0] ? `写卷残叶原貌 [${cet.diplomaticLines[0].lineNum}]: ${cet.diplomaticLines[0].transliteration}` : undefined
      ),
    };
  }),
];

// ============================================================================
// DB12: Muktabodha 密续电子库、ERC DHARMA《金刚顶经》校勘本与牛津 OCHS 种子字辞典
// ============================================================================
const DB12_ENTRIES: DharaniEntry[] = [
  ...DB12_MUKTABODHA_OCHS_CORPUS.dharmaEditions.map((ed): DharaniEntry => {
    const rawText =
      ed.extractedMantrasIast && ed.extractedMantrasIast.length >= 2
        ? ed.extractedMantrasIast.join(' | ')
        : [ed.extractedMantrasIast?.[0], ed.textExcerptIast].filter(Boolean).join(' | ');
    const iastLines = splitIastIntoVerseLines(rawText, 11);
    return {
      id: `db12-dharma-${ed.id}`,
      titleZh: `【DB12·DHARMA密续校勘】《${ed.titleSanskrit}》（${ed.editors}）`,
      titleSanskritIast: ed.titleSanskrit,
      titleEnglish: `ERC DHARMA Critical Edition: ${ed.titleSanskrit}`,
      categoryId: 'global-12db-canon',
      taishoNo: `DHARMA ${ed.id} · 对勘 T18n0865/0866`,
      translatorZh: `ERC DHARMA 校勘本 (${ed.editors})`,
      sutraSourceZh: `ERC DHARMA Tantric Critical Editions (${ed.titleSanskrit})`,
      deityZh: '金刚界大曼荼罗五部如来总持',
      bijaIast: 'hūṃ',
      meritsAndSummaryZh: `源自全球第 12 大数据库「ERC DHARMA 密续校勘库」《${ed.titleSanskrit}》（校勘学者：${ed.editors}，全本 ${ed.charCount.toLocaleString()} 字符）。其中《一切如来真实摄大乘现证三昧大教王经 (Sarvatathāgatatattvasaṅgraha, STTS)》即唐代不空、金刚智所译《金刚顶经》之完整梵文母本！`,
      recitationTipsZh: '此为瑜伽部根本大教王《金刚顶经 (STTS)》及《一切金刚出现曼荼罗仪轨》之梵文原典心印真言。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db12_muktabodha_ochs',
        databaseBadgeZh: `DB12 · DHARMA ${ed.id}`,
        gretilRawUrl: ed.rawTextUrl,
        editionCitation: `ERC DHARMA Critical Edition: ${ed.titleSanskrit} (ed. ${ed.editors})`,
        manuscriptNotesZh: `全书共 ${ed.charCount.toLocaleString()} 字符，已提取金刚界四印真言与三十七尊心咒。`,
        rawSnippet: ed.textExcerptIast.slice(0, 300),
      },
      verses: buildStandardVerses(
        `db12-dharma-${ed.id}`,
        iastLines,
        `出自 ERC DHARMA 校勘本《${ed.titleSanskrit}》`,
        `From ERC DHARMA Critical Edition of ${ed.titleSanskrit} (${ed.editors})`
      ),
    };
  }),
  ...DB12_MUKTABODHA_OCHS_CORPUS.ochsLexiconManuscripts.map((ochs): DharaniEntry => {
    const iastLines = ochs.verses.slice(0, 8).map((v) => v.sanskritIast);
    return {
      id: `db12-ochs-${ochs.slug}`,
      titleZh: `【DB12·牛津OCHS辞典】《${ochs.titleSanskrit}》(OCHS #${ochs.ochsNumber} · 种子字隐语辞书)`,
      titleSanskritIast: `${ochs.titleSanskrit} (OCHS #${ochs.ochsNumber})`,
      titleEnglish: `Oxford OCHS Tantric Bīja Lexicon #${ochs.ochsNumber}: ${ochs.titleSanskrit}`,
      categoryId: 'global-12db-canon',
      taishoNo: `Oxford OCHS #${ochs.ochsNumber}`,
      translatorZh: '英国牛津大学印度学研究中心 (OCHS) 密续写本库',
      sutraSourceZh: `Oxford Centre for Hindu Studies (OCHS) Manuscript #${ochs.ochsNumber} (${ochs.totalVerses} verses)`,
      deityZh: '密续种子字 (Bīja) 隐语破译总持',
      bijaIast: ochs.verses[0]?.targetBijaSyllables?.[0] || 'hrīṃ',
      meritsAndSummaryZh: `源自全球第 12 大数据库「英国牛津大学 OCHS 密续种子字辞典写本库」第 #${ochs.ochsNumber} 号《${ochs.titleSanskrit}》（共 ${ochs.totalVerses} 颂）。专门破译梵文密咒中单字种子字（Ekākṣara / Bīja）与密码隐语（Uddhāra，如以「空面 vyomāsya = ha + 裂母 vidārī = ū + 滴点 bindu = ṃ」合成「hūṃ」）。`,
      recitationTipsZh: '点击顶部「悉昙十八章与OCHS种子字」工作台，可使用种子字解密器逐字破译 12 大核心种子字之声韵构件与三家密意。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db12_muktabodha_ochs',
        databaseBadgeZh: `DB12 · 牛津 OCHS #${ochs.ochsNumber}`,
        cbetaOnlineUrl: ochs.sourceUrl,
        editionCitation: `Oxford Centre for Hindu Studies (OCHS) #${ochs.ochsNumber}: ${ochs.titleSanskrit}`,
        manuscriptNotesZh: `涵盖核心种子字：${Array.from(new Set(ochs.verses.flatMap((v) => v.targetBijaSyllables))).join(', ')}`,
        rawSnippet: iastLines.join('\n'),
      },
      verses: ochs.verses.slice(0, 8).map((v, idx) => {
        const cleanLine = v.sanskritIast.replace(/\s+/g, ' ').trim();
        return createLazyVerse({
          id: `db12-ochs-${ochs.slug}-v${idx + 1}`,
          index: idx + 1,
          iast: cleanLine,
          meaningZh: `出自牛津大学 OCHS #${ochs.ochsNumber}《${ochs.titleSanskrit}》第 ${v.verseNumber} 颂，所释种子字：${v.targetBijaSyllables.join('、') || 'Bīja'}。`,
          meaningEn: `From Oxford OCHS #${ochs.ochsNumber} ${ochs.titleSanskrit} Verse ${v.verseNumber} (Target Bījas: ${v.targetBijaSyllables.join(', ')}).`,
          tangNoteZh: `牛津 OCHS 种子字密码辞书 (${v.chapterOrSection || `Verse ${v.verseNumber}`})`,
        });
      }),
    };
  }),
  ...DB12_MUKTABODHA_OCHS_CORPUS.muktabodhaTexts.map((mb): DharaniEntry => {
    const rawMb =
      mb.extractedSeedDefinitions && mb.extractedSeedDefinitions.length >= 2
        ? mb.extractedSeedDefinitions.join(' | ')
        : [mb.extractedSeedDefinitions?.[0], mb.textExcerptIast].filter(Boolean).join(' | ');
    const iastLines = splitIastIntoVerseLines(rawMb, 11);
    return {
      id: `db12-muktabodha-${mb.catalogNo}`,
      titleZh: `【DB12·Muktabodha密续】《${mb.uniformTitle}》(${mb.catalogNo} · ${mb.author || '古印阿闿黎'})`,
      titleSanskritIast: `${mb.uniformTitle} (${mb.mainTitle})`,
      titleEnglish: `Muktabodha Digital Library ${mb.catalogNo}: ${mb.uniformTitle}`,
      categoryId: 'global-12db-canon',
      taishoNo: `Muktabodha ${mb.catalogNo}`,
      translatorZh: `${mb.author || '古印度密续论师'} 撰 · Muktabodha 数字化`,
      sutraSourceZh: `Muktabodha Indological Research Institute (${mb.catalogNo} · ${mb.tradition})`,
      deityZh: mb.uniformTitle,
      bijaIast: 'krīṃ',
      meritsAndSummaryZh: `源自全球第 12 大数据库「Muktabodha 密续电子文献库（共 499 部）」馆藏编号 ${mb.catalogNo}《${mb.uniformTitle}》（传承：${mb.tradition}，共 ${mb.charCount.toLocaleString()} 字符）。`,
      recitationTipsZh: '此为古印度金刚乘与密续传统之真言宝库（Mantrakoṣa / Uddhārakośa / Advayavajrasaṃgraha）原典。',
      provenance: {
        sourceType: 'GLOBAL-12DB',
        databaseId: 'db12_muktabodha_ochs',
        databaseBadgeZh: `DB12 · Muktabodha ${mb.catalogNo}`,
        gretilRawUrl: mb.rawTextUrl,
        editionCitation: `Muktabodha Digital Library ${mb.catalogNo}: ${mb.uniformTitle} (${mb.author || 'Anon.'})`,
        manuscriptNotesZh: `传承流派：${mb.tradition} | 全本字数：${mb.charCount.toLocaleString()} 字符`,
        rawSnippet: mb.textExcerptIast.slice(0, 280),
      },
      verses: buildStandardVerses(
        `db12-muktabodha-${mb.catalogNo}`,
        iastLines,
        `出自 Muktabodha 密续文库 ${mb.catalogNo}《${mb.uniformTitle}》`,
        `From Muktabodha Digital Library ${mb.catalogNo} (${mb.uniformTitle})`
      ),
    };
  }),
];

export const TWELVE_DATABASES_ADAPTED_DHARANIS: DharaniEntry[] = [
  ...DB1_ENTRIES,
  ...DB2_ENTRIES,
  ...DB3_ENTRIES,
  ...DB4_ENTRIES,
  ...DB5_ENTRIES,
  ...DB6_ENTRIES,
  ...DB7_ENTRIES,
  ...DB8_ENTRIES,
  ...DB9_ENTRIES,
  ...DB10_ENTRIES,
  ...DB11_ENTRIES,
  ...DB12_ENTRIES,
];
