import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import {
  AUTHORITATIVE_GRETIL_RECORDS,
  type GretilSanskritRecord,
} from '../kosa-generated/gretilAuthRecords';
import {
  ALL_GRETIL_MANTRA_RECORDS,
  type GretilExpandedMantraRecord,
} from '../kosa-generated/gretilAllMantras';
import {
  generateVerseChinesePhonetics,
  buildWordGlossesFromIast,
} from '../../core/sanskrit/phoneticMapper';

function makeLazyGretilVerse(params: {
  id: string;
  index: number;
  iast: string;
  meaningZh: string;
  meaningEn: string;
  tangNoteZh: string;
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
    classicalTranslitZh: {
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

function buildVersesFromGretilRecord(record: GretilSanskritRecord): DharaniVerse[] {
  const sourceLines =
    record.extractedVerses.length > 0
      ? record.extractedVerses
      : record.rawSnippet
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 10)
          .slice(0, 6);

  return sourceLines.slice(0, 12).map((line, idx) => {
    const cleanLine = line.replace(/\s+/g, ' ').trim();
    return makeLazyGretilVerse({
      id: `${record.id}-v${idx + 1}`,
      index: idx + 1,
      iast: cleanLine,
      meaningZh: `出自《${record.titleZh}》梵文贝叶校勘本（${record.file} 第 ${idx + 1} 颂/句），本尊：${record.deityZh}。上方已逐词对齐唐宋古汉语音译与现代梵音拼读。`,
      meaningEn: `Extracted directly from the authoritative GRETIL/DSBC Sanskrit edition (${record.file}) of ${record.titleSanskrit}.`,
      tangNoteZh: `GRETIL 梵本档案：${record.file}（原典总行数：${record.totalLinesInSource} 行 · 对勘大正藏 ${record.taishoNo}）`,
    });
  });
}

function buildVersesFromExpandedGretil(record: GretilExpandedMantraRecord): DharaniVerse[] {
  return record.mantraVerses.map((line, idx) => {
    const cleanLine = line.replace(/\s+/g, ' ').trim();
    return makeLazyGretilVerse({
      id: `${record.id}-v${idx + 1}`,
      index: idx + 1,
      iast: cleanLine,
      meaningZh: `出自哥廷根大学 GRETIL 梵文原典《${record.titleZh}》（档案：${record.file} 第 ${idx + 1} 段真言/礼赞），已自动对齐唐宋古汉语音译与现代梵音拼读参考。`,
      meaningEn: `Sanskrit mantra/verse extracted from GRETIL Buddhist Sanskrit manuscript ${record.file} (${record.titleSanskrit}).`,
      tangNoteZh: `GRETIL 梵文佛典库档案：${record.file}（全书共 ${record.totalLines} 行）`,
    });
  });
}

const primaryFilesSet = new Set(AUTHORITATIVE_GRETIL_RECORDS.map((r) => r.file));

const PRIMARY_GRETIL_DHARANIS: DharaniEntry[] = AUTHORITATIVE_GRETIL_RECORDS.map((record) => {
  const firstHeaderLine =
    record.headerCitation
      .split('\n')
      .map((s) => s.trim())
      .find((s) => s.length > 4 && !s.startsWith('(')) || record.titleSanskrit;

  return {
    id: `canonical-${record.id}`,
    titleZh: `【梵本原典】${record.titleZh}`,
    titleSanskritIast: record.titleSanskrit,
    titleEnglish: `${record.titleEn} (GRETIL ${record.file})`,
    categoryId: 'gretil-canonical',
    taishoNo: `${record.taishoNo} · GRETIL ${record.file}`,
    translatorZh: `哥廷根大学 GRETIL / 尼泊尔 DSBC 梵文贝叶经校勘本 (${firstHeaderLine})`,
    sutraSourceZh: `GRETIL 梵文佛典库 (${record.file}) · 汉译对勘：${record.taishoNo}`,
    deityZh: record.deityZh,
    meritsAndSummaryZh: `本条目直接构建自德国哥廷根大学 GRETIL 梵语原典档案「${record.file}」（共 ${record.totalLinesInSource} 行，提取核心真言与经句 ${record.extractedVerses.length} 段）。系统已自动将其原始 IAST 梵文实时转写为天城文、唐代悉昙梵字、唐宋古汉语音译、现代梵音拼读参考、国际音标 (IPA) 及摩多轻重音律。`,
    recitationTipsZh: `此为学术校勘梵文写本原貌，每一句均配备「梵音拼读参考」与「唐宋古汉语音译」平行对照，且每个音节胶囊内均同时展示梵文、古汉语与现代拼读。`,
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: record.taishoNo.split(' ')[0],
      cbetaOnlineUrl: `https://cbetaonline.dila.edu.tw/zh/${record.taishoNo.split(' ')[0]}`,
      gretilFile: record.file,
      gretilRawUrl: record.gretilRawUrl,
      editionCitation: record.headerCitation.split('\n').slice(0, 6).join(' | '),
      manuscriptNotesZh: `已从 github.com/INDOLOGY/GRETIL-mirror 完整下载 ${record.file}（共 ${record.totalLinesInSource} 行）并抽取陀罗尼段落。`,
      rawSnippet: record.rawSnippet,
    },
    verses: buildVersesFromGretilRecord(record),
  };
});

const EXPANDED_GRETIL_DHARANIS: DharaniEntry[] = ALL_GRETIL_MANTRA_RECORDS.filter(
  (r) => !primaryFilesSet.has(r.file)
).map((record) => ({
  id: record.id,
  titleZh: `【梵本】${record.titleZh}`,
  titleSanskritIast: record.titleSanskrit,
  titleEnglish: `GRETIL Sanskrit Buddhist Text (${record.file})`,
  categoryId: 'gretil-canonical',
  taishoNo: `GRETIL ${record.file}`,
  translatorZh: '德国哥廷根大学 GRETIL 梵文贝叶经电子校勘库',
  sutraSourceZh: `GRETIL 1_sanskr/4_rellit/buddh/${record.file}（共 ${record.totalLines} 行）`,
  deityZh: '十方三世佛菩萨 · 梵本原典总持',
  meritsAndSummaryZh: `自动抽取自德国哥廷根大学 GRETIL 佛教梵文库「${record.file}」（原书共 ${record.totalLines} 行），包含原典内出现之梵文真言（oṃ / tadyathā / svāhā / hūṃ / namaḥ 等）与礼赞偈颂，支持天城文、悉昙体、梵音拼读参考与唐宋古汉语音译四重对照。`,
  recitationTipsZh: '每一句梵文原典均已自动生成「梵音拼读参考」与「古汉语音译」，点击即可播放合成梵音或导出 WAV 音频。',
  provenance: {
    sourceType: 'GRETIL/DSBC',
    gretilFile: record.file,
    gretilRawUrl: record.gretilUrl,
    editionCitation: `Göttingen Register of Electronic Texts in Indian Languages (GRETIL): ${record.file}`,
    manuscriptNotesZh: `源自哥廷根大学 GRETIL 佛教梵文文献库（共 ${record.totalLines} 行），抽取 ${record.mantraVerses.length} 段核心真言与礼赞句。`,
    rawSnippet: record.mantraVerses.join('\n'),
  },
  verses: buildVersesFromExpandedGretil(record),
}));

export const GRETIL_CANONICAL_DHARANIS: DharaniEntry[] = [
  ...PRIMARY_GRETIL_DHARANIS,
  ...EXPANDED_GRETIL_DHARANIS,
];
