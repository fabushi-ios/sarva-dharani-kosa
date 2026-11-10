/**
 * 德国哥廷根大学 GRETIL 25 部现存梵文贝叶经原典适配器 (src/data/corpus/gretil-canon-adapter.ts)
 *
 * 将 INDOLOGY/GRETIL-mirror 的 25 部现存梵文写本自动转换为支持四体文字对照（悉昙/天城/IAST/IPA）、
 * 音节轻重格律切分与 48kHz VITS / 136.1Hz 双轨语音吟诵的标准 DharaniItem。
 */

import { GRETIL_AUTH_RECORDS } from '../generated/gretilAuthRecords';
import { analyzeSanskritLine } from '../../core/prosody';
import {
  iastToSlp1,
  slp1ToDevanagari,
  slp1ToSiddhamUnicode,
  iastToIpa
} from '../../core/transliterator';
import type { DharaniItem, DharaniVerse } from '../../types/dharani';

export const GRETIL_CANON_DHARANIS: DharaniItem[] = GRETIL_AUTH_RECORDS.map((ms) => {
  const sourceLines =
    ms.extractedMantras.length > 0
      ? ms.extractedMantras.slice(0, 6)
      : ms.fullTextLines.filter((l) => l.trim().length > 4).slice(0, 6);

  const verses: DharaniVerse[] = sourceLines.map((lineIast, idx) => {
    const analyzed = analyzeSanskritLine(lineIast, { mode: 'smart', longMarkSymbol: '～' });
    const modernApprox = analyzed.words.map((w) => w.wordModernPhonetic).join(' ');
    const tangChinese = analyzed.words.map((w) => w.wordTangReconstruction).join(' ');
    const allSyls = analyzed.words.flatMap((w) => w.syllables);

    return {
      verseNumber: idx + 1,
      sectionTitle: `GRETIL 梵本原典第 ${idx + 1} 节 (${ms.filename})`,
      iast: analyzed.normalizedIast || lineIast,
      devanagari: analyzed.devanagari,
      siddham: analyzed.siddhamUnicode,
      ipa: iastToIpa(analyzed.normalizedIast || lineIast),
      tangChinese: tangChinese || '（按玄奘/不空悉昙三十四字母矩阵自动对译）',
      modernApprox,
      meaningZh: `源自哥廷根大学 GRETIL 梵文写本《${ms.titleZh}》(${ms.titleSanskrit}) 原典经句。点击各音节可试听 48kHz 神经 VITS / 136.1Hz 梵音共振峰与查看轻重音律。`,
      meaningEn: `Canonical Sanskrit text from GRETIL manuscript ${ms.filename} (${ms.titleSanskrit}).`,
      tangPhoneticNotes: ['GRETIL梵本', `${allSyls.length}音节`],
      words: analyzed.words.slice(0, 12).map((w) => ({
        sanskrit: w.wordIast,
        devanagari: w.wordDevanagari,
        siddham: w.wordSiddham,
        rootOrStem: w.syllables.map((s) => s.rawIast).join('·'),
        grammar: w.syllables
          .map((s) => `${s.varga || '音节'}(${s.weight === 'Guru' ? '重—' : '轻⏑'})`)
          .join(' / '),
        tangPhonetic: w.wordTangReconstruction || '',
        meaningZh: w.syllables.map((s) => s.acousticNote || '').filter(Boolean).join('；') || '梵文原典词汇',
        meaningEn: `Phonetic: ${w.wordModernPhonetic || w.wordIast}`
      }))
    };
  });

  const slpTitle = iastToSlp1(ms.titleSanskrit, 'smart');

  return {
    id: ms.id,
    titleZh: `${ms.titleZh} [GRETIL 贝叶梵本]`,
    shortTitleZh: ms.titleZh.replace(/[《》]|梵本/g, '').trim(),
    titleSanskrit: ms.titleSanskrit,
    titleDevanagari: slp1ToDevanagari(slpTitle),
    titleSiddham: slp1ToSiddhamUnicode(slpTitle),
    titleEn: `${ms.titleSanskrit} (Göttingen GRETIL Sanskrit Edition)`,
    category: 'gretil-editions',
    deity: `${ms.titleZh.replace(/[《》]|梵本/g, '').trim()}本尊`,
    taishoId: ms.filename.replace(/\.htm$/, ''),
    translator: ms.editor ? `${ms.editor} 校勘 (Göttingen GRETIL)` : 'Göttingen GRETIL / DSBC 梵本',
    period: '古典梵文写本与校勘本',
    summaryZh: `直接收录自德国哥廷根大学印度语言电子文本库 (GRETIL) 馆藏梵本 ${ms.filename}（共 ${ms.totalLines} 行梵文原文）。${ms.editionCitation}`,
    ritualBenefits: '依止现存梵文贝叶经学术校勘本直读原典梵音，契入三世诸佛陀罗尼总持正音。',
    gretilRecordId: ms.id,
    verses,
    authoritativeSource: {
      cbetaXmlId: ms.filename,
      cbetaRawUrl: ms.sourceUrl,
      taishoLocation: `GRETIL File: ${ms.filename} (${ms.totalLines} lines)`,
      gretilId: ms.filename,
      gretilRawUrl: ms.sourceUrl,
      sanskritEditionCitation: ms.editionCitation || `Göttingen GRETIL Archive (${ms.filename})`,
      tangPhoneticNotes: [
        `GRETIL 馆藏文件: ${ms.filename} (共 ${ms.totalLines} 行梵文原典)`,
        `学术底本引用: ${ms.editionCitation || 'Buddhist Sanskrit Texts / Göttingen GRETIL'}`,
        ...(ms.apparatusVariants.slice(0, 3))
      ],
      rawExcerpt: ms.fullTextExcerpt,
      crossRefs: {
        gretilIds: [ms.filename]
      }
    }
  };
});
