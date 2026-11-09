/**
 * 德国哥廷根大学 GRETIL 25 部现存梵文贝叶经原典适配器 (src/data/corpus/gretil-canon-adapter.ts)
 *
 * 将 scripts/fetch-authoritative-data.mjs 从 INDOLOGY/GRETIL-mirror 下载的 25 部现存梵文写本
 * 自动转换为支持四体文字对照（悉昙/天城/IAST/IPA）、音节轻重格律切分与双轨语音吟诵的标准 DharaniEntry。
 */

import { GRETIL_MANUSCRIPT_RECORDS } from '../generated/gretilAuthRecords';
import { analyzeSanskritSentence } from '../../core/prosody';
import { iastToDevanagari, iastToSiddham } from '../../core/transliterator';
import { DharaniEntry, DharaniVerse } from '../../types/dharani';

export const GRETIL_CANON_DHARANIS: DharaniEntry[] = GRETIL_MANUSCRIPT_RECORDS.map((ms) => {
  const verses: DharaniVerse[] = ms.mantraExcerpt.slice(0, 8).map((lineIast, idx) => {
    const analyzed = analyzeSanskritSentence(lineIast, 'smart');
    return {
      id: `${ms.id}-v-${idx + 1}`,
      index: idx + 1,
      sectionTag: `GRETIL 梵本原典第 ${idx + 1} 节 (${ms.file})`,
      iast: analyzed.iast || lineIast,
      devanagari: analyzed.devanagari,
      siddham: analyzed.siddham,
      ipa: analyzed.ipa,
      tangTranslit: analyzed.tradFull || '（按玄奘/不空悉昙三十四字母矩阵自动对译）',
      modernPhonetic: analyzed.modernFull,
      meaningZh: `源自哥廷根大学 GRETIL 梵文写本《${ms.titleZh}》(${ms.titleSa}) 原典经句。点击各音节可试听 136.1Hz 梵音共振峰与查看轻重音律。`,
      meaningEn: `Canonical Sanskrit text from GRETIL manuscript ${ms.file} (${ms.titleSa}), parallel to Taishō ${ms.taishoNo}.`,
      words: analyzed.syllables.slice(0, 12).map(s => ({
        iast: s.iast,
        devanagari: s.devanagari,
        siddham: s.siddham,
        tangTranslit: s.tangTranslit,
        yinNote: s.meter === '—' ? '重音(2拍)' : '轻音(1拍)',
        grammar: `${s.varga} · ${s.weightLabel}`,
        meaningZh: s.note,
        meaningEn: `Formants F1=${s.f1}Hz, F2=${s.f2}Hz`
      }))
    };
  });

  return {
    id: ms.id,
    titleZh: `${ms.titleZh} [GRETIL 贝叶梵本]`,
    titleSaIast: ms.titleSa,
    titleSaDeva: iastToDevanagari(ms.titleSa),
    titleSaSiddham: iastToSiddham(ms.titleSa),
    titleEn: `${ms.titleSa} (Göttingen GRETIL Sanskrit Edition)`,
    category: 'gretil-canon',
    deityFocus: `${ms.titleZh.replace(/\s*\(.*?\)/g, '')}本尊`,
    seedSyllableIast: 'oṃ',
    seedSyllableSiddham: '𑖼𑗀',
    seedSyllableDeva: 'ॐ',
    seedSyllableZh: '唵',
    summaryZh: `直接下载自德国哥廷根大学印度语言电子文本库 (GRETIL) 馆藏梵本 ${ms.file}（共 ${ms.totalLines} 行梵文原文），对勘《大正新修大藏经》${ms.taishoNo}。`,
    ritualBenefitsZh: `依止现存梵文贝叶经学术校勘本直读原典梵音，契入三世诸佛陀罗尼总持正音。`,
    sourceMeta: {
      cbetaXmlId: ms.taishoNo,
      cbetaRawUrl: `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${ms.taishoNo.slice(0, 3)}/${ms.taishoNo}.xml`,
      taishoVolPage: `Taishō Parallel: ${ms.taishoNo}`,
      ancientTranslator: '梵文贝叶经原典 (Göttingen GRETIL / DSBC)',
      gretilId: ms.file,
      gretilRawUrl: ms.rawUrl,
      sanskritEditionCitation: ms.citation || `Göttingen GRETIL Archive (${ms.file})`,
      tangPhoneticNotes: [
        `GRETIL 馆藏文件: ${ms.file} (共 ${ms.totalLines} 行梵文原典)`,
        `学术底本引用: ${ms.citation || 'Buddhist Sanskrit Texts / Göttingen GRETIL'}`
      ],
      rawExcerpt: ms.fullPreview
    },
    verses
  };
});
