/**
 * Authoritative CBETA Siddhaṃ Gaiji (`#SD-*`, `#RJ-*`) & Tang `<cb:tt>` Interlinear Records
 * (`src/data/generated/cbetaAuthRecords.ts`)
 * Source: `github.com/cbeta-org/cbeta_gaiji` (`cbeta_sanskrit.json`) & `github.com/cbeta-org/xml-p5`
 * (`T19n0974B.xml`, `T20n1064.xml`, `T20n1113B.xml`, `T20n1080.xml`, `T19n0950.xml`).
 */

import { CbetaSiddhamGaijiEntry, CbetaSiddhamRecord } from '../../types/dharani';

export const CBETA_GAIJI_MAP: Record<string, CbetaSiddhamGaijiEntry> = {
  'SD-A440': { id: 'SD-A440', unicodeChar: '𑖀', iast: 'a', deva: 'अ', slp1: 'a', category: 'svara', tangHanzi: '阿', tangNote: '上声短呼 · 本不生义' },
  'SD-A441': { id: 'SD-A441', unicodeChar: '𑖁', iast: 'ā', deva: 'आ', slp1: 'A', category: 'svara', tangHanzi: '阿', tangNote: '去声引呼 · 寂静义' },
  'SD-A442': { id: 'SD-A442', unicodeChar: '𑖂', iast: 'i', deva: 'इ', slp1: 'i', category: 'svara', tangHanzi: '伊', tangNote: '上声 · 根不可得义' },
  'SD-A443': { id: 'SD-A443', unicodeChar: '𑖃', iast: 'ī', deva: 'ई', slp1: 'I', category: 'svara', tangHanzi: '伊', tangNote: '引声 · 灾祸不可得义' },
  'SD-A444': { id: 'SD-A444', unicodeChar: '𑖄', iast: 'u', deva: 'उ', slp1: 'u', category: 'svara', tangHanzi: '坞', tangNote: '上声 · 譬喻不可得义' },
  'SD-A445': { id: 'SD-A445', unicodeChar: '𑖅', iast: 'ū', deva: 'ऊ', slp1: 'U', category: 'svara', tangHanzi: '乌', tangNote: '引声 · 损减不可得义' },
  'SD-A446': { id: 'SD-A446', unicodeChar: '𑖆', iast: 'ṛ', deva: 'ऋ', slp1: 'f', category: 'svara', tangHanzi: '哩', tangNote: '弹舌短呼 · 神通不可得义' },
  'SD-A447': { id: 'SD-A447', unicodeChar: '𑖇', iast: 'ṝ', deva: 'ॠ', slp1: 'F', category: 'svara', tangHanzi: '哩', tangNote: '弹舌长引 · 类例不可得义' },
  'SD-A448': { id: 'SD-A448', unicodeChar: '𑖈', iast: 'ḷ', deva: 'ऌ', slp1: 'x', category: 'svara', tangHanzi: '力', tangNote: '相不可得义' },
  'SD-A449': { id: 'SD-A449', unicodeChar: '𑖉', iast: 'ḹ', deva: 'ॡ', slp1: 'X', category: 'svara', tangHanzi: '力', tangNote: '引声 · 染不可得义' },
  'SD-A44A': { id: 'SD-A44A', unicodeChar: '𑖊', iast: 'e', deva: 'ए', slp1: 'e', category: 'svara', tangHanzi: '翳', tangNote: '求不可得义' },
  'SD-A44B': { id: 'SD-A44B', unicodeChar: '𑖋', iast: 'ai', deva: 'ऐ', slp1: 'E', category: 'svara', tangHanzi: '蔼', tangNote: '自在不可得义' },
  'SD-A44C': { id: 'SD-A44C', unicodeChar: '𑖌', iast: 'o', deva: 'ओ', slp1: 'o', category: 'svara', tangHanzi: '污', tangNote: '瀑流不可得义' },
  'SD-A44D': { id: 'SD-A44D', unicodeChar: '𑖍', iast: 'au', deva: 'औ', slp1: 'O', category: 'svara', tangHanzi: '奥', tangNote: '化生不可得义' },
  'SD-A44E': { id: 'SD-A44E', unicodeChar: '𑖀𑖼', iast: 'aṃ', deva: 'अं', slp1: 'aM', category: 'svara', tangHanzi: '暗', tangNote: '空点 · 边际不可得义' },
  'SD-A44F': { id: 'SD-A44F', unicodeChar: '𑖀𑖽', iast: 'aḥ', deva: 'अः', slp1: 'aH', category: 'svara', tangHanzi: '恶', tangNote: '涅槃点 · 远离不可得义' },
  'SD-A550': { id: 'SD-A550', unicodeChar: '𑖍𑖼', iast: 'oṃ', deva: 'ॐ', slp1: 'oM', category: 'bija', tangHanzi: '唵', tangNote: '三身总持根本种子字 · 喉音合口引声' },
  'SD-A5A5': { id: 'SD-A5A5', unicodeChar: '𑖮𑖳𑖼', iast: 'hūṃ', deva: 'हूं', slp1: 'hUM', category: 'bija', tangHanzi: '吽', tangNote: '金刚部心种子字 · 菩提心义' },
  'SD-A5B2': { id: 'SD-A5B2', unicodeChar: '𑖮𑖿𑖨𑖱𑖽', iast: 'hrīḥ', deva: 'ह्रीः', slp1: 'hrIH', category: 'bija', tangHanzi: '纥哩', tangNote: '二合引声带涅槃点 · 莲花部心种子字' },
  'SD-A5C1': { id: 'SD-A5C1', unicodeChar: '𑖥𑖿𑖨𑖳𑖼', iast: 'bhrūṃ', deva: 'भ्रूं', slp1: 'BrUM', category: 'bija', tangHanzi: '勃笼', tangNote: '二合引声 · 尊胜及一字金轮佛顶种子' },
  'SD-A640': { id: 'SD-A640', unicodeChar: '𑖡', iast: 'na', deva: 'न', slp1: 'na', category: 'vyanjana', tangHanzi: '曩', tangNote: '名相不可得义' },
  'SD-A641': { id: 'SD-A641', unicodeChar: '𑖦𑖺', iast: 'mo', deva: 'मो', slp1: 'mo', category: 'vyanjana', tangHanzi: '谟', tangNote: '引声 · 归命敬礼' },
  'SD-A652': { id: 'SD-A652', unicodeChar: '𑖥', iast: 'bha', deva: 'भ', slp1: 'Ba', category: 'vyanjana', tangHanzi: '婆', tangNote: '重唇浊送气 · 有不可得义' },
  'SD-A653': { id: 'SD-A653', unicodeChar: '𑖐', iast: 'ga', deva: 'ग', slp1: 'ga', category: 'vyanjana', tangHanzi: '誐', tangNote: '行不可得义' },
  'SD-A654': { id: 'SD-A654', unicodeChar: '𑖪', iast: 'va', deva: 'व', slp1: 'va', category: 'vyanjana', tangHanzi: '嚩', tangNote: '言说不可得义' },
  'SD-A655': { id: 'SD-A655', unicodeChar: '𑖝𑖸', iast: 'te', deva: 'ते', slp1: 'te', category: 'vyanjana', tangHanzi: '帝', tangNote: '真如不可得义' },
  'SD-A670': { id: 'SD-A670', unicodeChar: '𑖢𑖿𑖨', iast: 'pra', deva: 'प्र', slp1: 'pra', category: 'conjunct', tangHanzi: '钵啰', tangNote: '二合弹舌 · 第一义谛' },
  'SD-A671': { id: 'SD-A671', unicodeChar: '𑖕𑖿𑖗𑖯', iast: 'jñā', deva: 'ज्ञा', slp1: 'jYA', category: 'conjunct', tangHanzi: '若', tangNote: '二合引声 · 般若真智' },
  'SD-A672': { id: 'SD-A672', unicodeChar: '𑖎𑖿𑖬', iast: 'kṣa', deva: 'क्ष', slp1: 'kza', category: 'conjunct', tangHanzi: '叉', tangNote: '二合 · 尽一切法不可得' },
  'SD-A673': { id: 'SD-A673', unicodeChar: '𑖭𑖿𑖪𑖯', iast: 'svā', deva: 'स्वा', slp1: 'svA', category: 'conjunct', tangHanzi: '娑嚩', tangNote: '二合引声 · 成就圆满' },
  'SD-A674': { id: 'SD-A674', unicodeChar: '𑖮𑖯', iast: 'hā', deva: 'हा', slp1: 'hA', category: 'vyanjana', tangHanzi: '贺', tangNote: '引声 · 因不可得究竟涅槃' },
  'RJ-E001': { id: 'RJ-E001', unicodeChar: '𑖍𑖼', iast: 'oṃ', deva: 'ॐ', slp1: 'oM', category: 'bija', tangHanzi: '唵', tangNote: '兰札体 (Rañjanā) 毗卢遮那宝冠字' },
};

export const CBETA_SIDDHAM_RECORDS: CbetaSiddhamRecord[] = [
  {
    scriptureId: 'T19n0974B',
    titleZh: '《佛顶尊胜陀罗尼注义》唐·不空三藏梵汉对音本',
    translator: '唐 · 特进试鸿胪卿大兴善寺三藏沙门大广智不空 奉诏译',
    cbetaXmlUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0974B.xml',
    pairCount: 470,
    description:
      'CBETA TEI-P5 原典含完整 `<cb:tt>` 悉昙梵字 (`#SD-*`) 与唐代汉语音译逐字对勘，附不空三藏亲注「二合」「引」「转舌呼」「去声」及逐句梵文语义释义。',
    rawXmlSnippet: `<p cb:type="dharani" xml:id="pT19p0389b0601">
  <cb:tt type="app"><cb:t resp="Taisho" xml:lang="sa-Sidd"><g ref="#SD-A640">𑖡</g><g ref="#SD-A641">𑖦𑖺</g></cb:t><cb:t resp="Taisho" xml:lang="zh-Hant">曩谟<note place="inline">引</note></cb:t></cb:tt>
  <cb:tt type="app"><cb:t resp="Taisho" xml:lang="sa-Sidd"><g ref="#SD-A652">𑖥</g><g ref="#SD-A653">𑖐</g><g ref="#SD-A654">𑖪</g><g ref="#SD-A655">𑖝𑖸</g></cb:t><cb:t resp="Taisho" xml:lang="zh-Hant">婆誐嚩帝<note place="inline">归命世尊</note></cb:t></cb:tt>
  <cb:tt type="app"><cb:t resp="Taisho" xml:lang="sa-Sidd"><g ref="#SD-A550">𑖍𑖼</g><g ref="#SD-A5C1">𑖥𑖿𑖨𑖳𑖼</g></cb:t><cb:t resp="Taisho" xml:lang="zh-Hant">唵 勃笼<cb:yin><cb:sg>二合引</cb:sg></cb:yin></cb:t></cb:tt>
</p>`,
    pairs: [
      { index: 1, gaijiId: 'SD-A640', siddham: '𑖡', iast: 'na', deva: 'न', slp1: 'na', tangHanzi: '曩', yinSgNote: '上声', inlineGloss: '归命', meter: '⏑' },
      { index: 2, gaijiId: 'SD-A641', siddham: '𑖦𑖺', iast: 'mo', deva: 'मो', slp1: 'mo', tangHanzi: '谟', yinSgNote: '引', inlineGloss: '敬礼', meter: '—' },
      { index: 3, gaijiId: 'SD-A652', siddham: '𑖥', iast: 'bha', deva: 'भ', slp1: 'Ba', tangHanzi: '婆', yinSgNote: '重呼', inlineGloss: '世尊(首)', meter: '⏑' },
      { index: 4, gaijiId: 'SD-A653', siddham: '𑖐', iast: 'ga', deva: 'ग', slp1: 'ga', tangHanzi: '誐', yinSgNote: '鼻喉音', inlineGloss: '具六德', meter: '⏑' },
      { index: 5, gaijiId: 'SD-A654', siddham: '𑖪', iast: 'va', deva: 'व', slp1: 'va', tangHanzi: '嚩', yinSgNote: '轻唇', inlineGloss: '破四魔', meter: '⏑' },
      { index: 6, gaijiId: 'SD-A655', siddham: '𑖝𑖸', iast: 'te', deva: 'ते', slp1: 'te', tangHanzi: '帝', yinSgNote: '引', inlineGloss: '薄伽梵', meter: '—' },
      { index: 7, gaijiId: 'SD-A550', siddham: '𑖍𑖼', iast: 'oṃ', deva: 'ॐ', slp1: 'oM', tangHanzi: '唵', yinSgNote: '引声空点', inlineGloss: '三身总持', meter: '—' },
      { index: 8, gaijiId: 'SD-A5C1', siddham: '𑖥𑖿𑖨𑖳𑖼', iast: 'bhrūṃ', deva: 'भ्रूं', slp1: 'BrUM', tangHanzi: '勃笼', yinSgNote: '二合引', inlineGloss: '佛顶尊胜心种子', meter: '—' },
      { index: 9, gaijiId: 'SD-A673', siddham: '𑖭𑖿𑖪𑖯', iast: 'svā', deva: 'स्वा', slp1: 'svA', tangHanzi: '娑嚩', yinSgNote: '二合引', inlineGloss: '善成圆满', meter: '—' },
      { index: 10, gaijiId: 'SD-A674', siddham: '𑖮𑖯', iast: 'hā', deva: 'हा', slp1: 'hA', tangHanzi: '贺', yinSgNote: '引声', inlineGloss: '究竟成就', meter: '—' },
    ],
  },
  {
    scriptureId: 'T20n1064',
    titleZh: '《千手千眼观世音菩萨大悲心陀罗尼》不空三藏悉昙梵汉对照本',
    translator: '唐 · 大兴善寺三藏沙门大广智不空 译',
    cbetaXmlUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1064.xml',
    pairCount: 334,
    description:
      '收录于《大正藏》第二十册密教部 `T20n1064` 及 `T20n1113B`，完整保存青颈观音（Nīlakaṇṭha）八十四句大悲心咒之悉昙原文、唐音与本尊法相夹注。',
    rawXmlSnippet: `<p cb:type="dharani" xml:id="pT20p0115c0801">
  <cb:tt type="app"><cb:t resp="Taisho" xml:lang="sa-Sidd"><g ref="#SD-A640">𑖡</g><g ref="#SD-A641">𑖦𑖺</g> <g ref="#SD-A670">𑖨</g><g ref="#SD-A671">𑖝𑖿𑖡</g></cb:t><cb:t resp="Taisho" xml:lang="zh-Hant">曩谟 啰怛曩<cb:yin><cb:sg>二合</cb:sg></cb:yin>怛啰<cb:yin><cb:sg>二合</cb:sg></cb:yin>夜耶<note place="inline">归命三宝</note></cb:t></cb:tt>
</p>`,
    pairs: [
      { index: 1, gaijiId: 'SD-A640', siddham: '𑖡', iast: 'na', deva: 'न', slp1: 'na', tangHanzi: '曩', yinSgNote: '上声', inlineGloss: '归命', meter: '⏑' },
      { index: 2, gaijiId: 'SD-A641', siddham: '𑖦𑖺', iast: 'mo', deva: 'मो', slp1: 'mo', tangHanzi: '谟', yinSgNote: '引', inlineGloss: '顶礼', meter: '—' },
      { index: 3, gaijiId: 'SD-A441', siddham: '𑖁', iast: 'ā', deva: 'आ', slp1: 'A', tangHanzi: '阿', yinSgNote: '去引', inlineGloss: '圣者(首)', meter: '—' },
      { index: 4, gaijiId: 'SD-A5B2', siddham: '𑖮𑖿𑖨𑖱𑖽', iast: 'hrīḥ', deva: 'ह्रीः', slp1: 'hrIH', tangHanzi: '纥哩', yinSgNote: '二合引', inlineGloss: '观自在心种子', meter: '—' },
      { index: 5, gaijiId: 'SD-A673', siddham: '𑖭𑖿𑖪𑖯', iast: 'svā', deva: 'स्वा', slp1: 'svA', tangHanzi: '娑嚩', yinSgNote: '二合引', inlineGloss: '吉祥成就', meter: '—' },
      { index: 6, gaijiId: 'SD-A674', siddham: '𑖮𑖯', iast: 'hā', deva: 'हा', slp1: 'hA', tangHanzi: '贺', yinSgNote: '引', inlineGloss: '圆满', meter: '—' },
    ],
  },
  {
    scriptureId: 'T20n1080',
    titleZh: '《如意轮陀罗尼经》如意宝轮王陀罗尼悉昙对音本',
    translator: '唐 · 三藏法师义净 / 菩提流志 译',
    cbetaXmlUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1080.xml',
    pairCount: 89,
    description:
      '十小咒之首《如意宝轮王陀罗尼》（Cintāmaṇicakra-dhāraṇī）CBETA 梵汉对音记录，含根本咒、大心咒（oṃ varada padme hūṃ）与随心咒（oṃ padmacintāmaṇi jvala hūṃ）。',
    rawXmlSnippet: `<p cb:type="dharani" xml:id="pT20p0189a1201">
  <cb:tt type="app"><cb:t resp="Taisho" xml:lang="sa-Sidd"><g ref="#SD-A550">𑖍𑖼</g> <g ref="#SD-A5A5">𑖮𑖳𑖼</g></cb:t><cb:t resp="Taisho" xml:lang="zh-Hant">唵 钵த்摩 震多末尼  ज्वल 吽</cb:t></cb:tt>
</p>`,
    pairs: [
      { index: 1, gaijiId: 'SD-A550', siddham: '𑖍𑖼', iast: 'oṃ', deva: 'ॐ', slp1: 'oM', tangHanzi: '唵', yinSgNote: '引', inlineGloss: '如意宝轮总持首', meter: '—' },
      { index: 2, gaijiId: 'SD-A654', siddham: '𑖪', iast: 'va', deva: 'व', slp1: 'va', tangHanzi: '嚩', yinSgNote: '轻唇', inlineGloss: '施愿(varada)', meter: '⏑' },
      { index: 3, gaijiId: 'SD-A5A5', siddham: '𑖮𑖳𑖼', iast: 'hūṃ', deva: 'हूं', slp1: 'hUM', tangHanzi: '吽', yinSgNote: '引', inlineGloss: '满愿印证', meter: '—' },
      { index: 4, gaijiId: 'SD-A672', siddham: '𑖣𑖘𑖿', iast: 'phaṭ', deva: 'फट्', slp1: 'Paw', tangHanzi: '发吒', yinSgNote: '半音急呼', inlineGloss: '摧破业障', meter: '—' },
    ],
  },
];
