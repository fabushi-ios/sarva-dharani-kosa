/**
 * Multi-Script Sanskrit Phonemic & Script Transliterator (`src/core/transliterator.ts`)
 * Supports bidirectional conversion between:
 * - SLP1 (lossless 1-char phonemic encoding)
 * - IAST (International Alphabet of Sanskrit Transliteration)
 * - Devanāgarī (`U+0900–U+097F`)
 * - Siddhaṃ Unicode (`U+11580–U+115FF`)
 * - IPA (International Phonetic Alphabet)
 * - Modern Chinese Acoustic Guide & Traditional Tang Siddhaṃ Transcription (34×14 Matrix)
 */

export interface ConsonantMatrixEntry {
  slp1: string;
  iast: string;
  deva: string;
  siddham: string;
  ipa: string;
  varga: string;
  phonation: string;
  bare: [string, string];
  m: [string, string, string, string, string, string, string, string];
  t: [string, string, string, string, string, string, string, string];
  note: string;
}

export interface VowelMatrixEntry {
  slp1: string;
  iast: string;
  devaIndep: string;
  devaMatra: string;
  siddhamIndep: string;
  siddhamMatra: string;
  ipa: string;
  modern: string;
  trad: string;
  isLong: boolean;
  inherentLongMark: boolean;
  vowelGroupIndex: number;
  note: string;
}

export interface SacredOverrideEntry {
  slp1: string;
  iast: string;
  deva: string;
  siddham: string;
  ipa: string;
  m: string;
  t: string;
  meter: '—' | '⏑';
  note: string;
}

export const CANONICAL_14_VOWELS: VowelMatrixEntry[] = [
  { slp1: 'a', iast: 'a', devaIndep: 'अ', devaMatra: '', siddhamIndep: '𑖀', siddhamMatra: '', ipa: 'ɐ', modern: '阿', trad: '阿', isLong: false, inherentLongMark: false, vowelGroupIndex: 0, note: '短元音 a (1拍 Laghu · 喉音根本摩多)' },
  { slp1: 'A', iast: 'ā', devaIndep: 'आ', devaMatra: 'ा', siddhamIndep: '𑖁', siddhamMatra: '𑖯', ipa: 'ɑː', modern: '阿～', trad: '阿(引)', isLong: true, inherentLongMark: true, vowelGroupIndex: 0, note: '长元音 ā (2拍 Guru · 开口引声摩多)' },
  { slp1: 'i', iast: 'i', devaIndep: 'इ', devaMatra: 'ि', siddhamIndep: '𑖂', siddhamMatra: '𑖰', ipa: 'i', modern: '伊', trad: '伊', isLong: false, inherentLongMark: false, vowelGroupIndex: 1, note: '短元音 i (1拍 Laghu · 颚音摩多)' },
  { slp1: 'I', iast: 'ī', devaIndep: 'ई', devaMatra: 'ी', siddhamIndep: '𑖃', siddhamMatra: '𑖱', ipa: 'iː', modern: '衣～', trad: '伊(引)', isLong: true, inherentLongMark: true, vowelGroupIndex: 1, note: '长元音 ī (2拍 Guru · 颚音引声摩多)' },
  { slp1: 'u', iast: 'u', devaIndep: 'उ', devaMatra: 'ु', siddhamIndep: '𑖄', siddhamMatra: '𑖲', ipa: 'u', modern: '乌', trad: '坞', isLong: false, inherentLongMark: false, vowelGroupIndex: 2, note: '短元音 u (1拍 Laghu · 唇音摩多)' },
  { slp1: 'U', iast: 'ū', devaIndep: 'ऊ', devaMatra: 'ू', siddhamIndep: '𑖅', siddhamMatra: '𑖳', ipa: 'uː', modern: '屋～', trad: '乌(引)', isLong: true, inherentLongMark: true, vowelGroupIndex: 2, note: '长元音 ū (2拍 Guru · 唇音引声摩多)' },
  { slp1: 'f', iast: 'ṛ', devaIndep: 'ऋ', devaMatra: 'ृ', siddhamIndep: '𑖆', siddhamMatra: '𑖴', ipa: 'r̩', modern: '里', trad: '哩', isLong: false, inherentLongMark: false, vowelGroupIndex: 3, note: '卷舌短元音 ṛ (1拍 Laghu · 弹舌成音节)' },
  { slp1: 'F', iast: 'ṝ', devaIndep: 'ॠ', devaMatra: 'ॄ', siddhamIndep: '𑖇', siddhamMatra: '𑖵', ipa: 'r̩ː', modern: '里～', trad: '哩(引)', isLong: true, inherentLongMark: true, vowelGroupIndex: 3, note: '卷舌长元音 ṝ (2拍 Guru · 弹舌长音)' },
  { slp1: 'x', iast: 'ḷ', devaIndep: 'ऌ', devaMatra: 'ॢ', siddhamIndep: '𑖈', siddhamMatra: '𑖴', ipa: 'l̩', modern: '吕', trad: '力', isLong: false, inherentLongMark: false, vowelGroupIndex: 3, note: '齿边短元音 ḷ (1拍 Laghu · 舌尖边音)' },
  { slp1: 'X', iast: 'ḹ', devaIndep: 'ॡ', devaMatra: 'ॣ', siddhamIndep: '𑖉', siddhamMatra: '𑖵', ipa: 'l̩ː', modern: '吕～', trad: '力(引)', isLong: true, inherentLongMark: true, vowelGroupIndex: 3, note: '齿边长元音 ḹ (2拍 Guru · 舌尖长边音)' },
  { slp1: 'e', iast: 'e', devaIndep: 'ए', devaMatra: 'े', siddhamIndep: '𑖊', siddhamMatra: '𑖸', ipa: 'eː', modern: '诶', trad: '翳', isLong: true, inherentLongMark: false, vowelGroupIndex: 4, note: '天然长元音 e (2拍 Guru · 喉颚合音)' },
  { slp1: 'E', iast: 'ai', devaIndep: 'ऐ', devaMatra: 'ै', siddhamIndep: '𑖋', siddhamMatra: '𑖹', ipa: 'ɐi̯', modern: '爱', trad: '蔼', isLong: true, inherentLongMark: false, vowelGroupIndex: 5, note: '双元音 ai (2拍 Guru · 增长音 Vṛddhi)' },
  { slp1: 'o', iast: 'o', devaIndep: 'ओ', devaMatra: 'ो', siddhamIndep: '𑖌', siddhamMatra: '𑖺', ipa: 'oː', modern: '欧', trad: '污', isLong: true, inherentLongMark: false, vowelGroupIndex: 6, note: '天然长元音 o (2拍 Guru · 喉唇合音)' },
  { slp1: 'O', iast: 'au', devaIndep: 'औ', devaMatra: 'ौ', siddhamIndep: '𑖍', siddhamMatra: '𑖻', ipa: 'ɐu̯', modern: '奥', trad: '奥', isLong: true, inherentLongMark: false, vowelGroupIndex: 7, note: '双元音 au (2拍 Guru · 喉唇增长音)' },
];

export const CANONICAL_16_SVARAS = [
  ...CANONICAL_14_VOWELS,
  {
    slp1: 'aM',
    iast: 'aṃ',
    devaIndep: 'अं',
    devaMatra: 'ं',
    siddhamIndep: '𑖀𑖼',
    siddhamMatra: '𑖼',
    ipa: 'ɐm',
    modern: '阿姆',
    trad: '暗(空点)',
    isLong: true,
    inherentLongMark: false,
    vowelGroupIndex: 0,
    note: '随韵 Anusvāra (2拍 Guru · 悉昙第十五摩多空点菩提心)',
  },
  {
    slp1: 'aH',
    iast: 'aḥ',
    devaIndep: 'अः',
    devaMatra: 'ः',
    siddhamIndep: '𑖀𑖽',
    siddhamMatra: '𑖽',
    ipa: 'ɐh',
    modern: '阿哈',
    trad: '恶(涅槃点)',
    isLong: true,
    inherentLongMark: false,
    vowelGroupIndex: 0,
    note: '止韵 Visarga (2拍 Guru · 悉昙第十六摩多涅槃点送气回响)',
  },
];

export const CONS_MATRIX: Record<string, ConsonantMatrixEntry> = {
  // 1. 喉音 (Ka-varga / Velar)
  k: { slp1: 'k', iast: 'k', deva: 'क', siddham: '𑖎', ipa: 'k', varga: '喉音 (Ka-varga)', phonation: '清不送气', bare: ['克', '克'], m: ['嘎', '给', '咕', '格里', '给', '该', '郭', '高'], t: ['迦', '吉', '俱', '讫哩', '计', '皆', '拘', '憍'], note: '喉音 · 清不送气塞音 [k]（如英文 sky 中的 k）' },
  K: { slp1: 'K', iast: 'kh', deva: 'ख', siddham: '𑖏', ipa: 'kʰ', varga: '喉音 (Ka-varga)', phonation: '清送气', bare: ['可', '佉'], m: ['卡', '奇', '枯', '克里', '开', '凯', '考', '尻'], t: ['佉', '弃', '区', '企哩', '契', '楷', '寇', '考'], note: '喉音 · 清送气塞音 [kʰ]（强烈送气）' },
  g: { slp1: 'g', iast: 'g', deva: 'ग', siddham: '𑖐', ipa: 'ɡ', varga: '喉音 (Ka-varga)', phonation: '浊不送气', bare: ['格', '伽'], m: ['噶', '吉', '古', '格里', '给', '改', '果', '搞'], t: ['伽', '祇', '具', '吃哩', '艺', '盖', '瞿', '豪'], note: '喉音 · 浊不送气塞音 [ɡ]（声带振动）' },
  G: { slp1: 'G', iast: 'gh', deva: 'घ', siddham: '𑖑', ipa: 'ɡʱ', varga: '喉音 (Ka-varga)', phonation: '浊送气', bare: ['格哈', '伽'], m: ['噶哈', '吉哈', '古哈', '格里哈', '给哈', '改哈', '果哈', '搞哈'], t: ['伽', '祇', '具', '伽哩', '诣', '慨', '瞿', '豪'], note: '喉音 · 浊送气塞音 [ɡʱ]（声带振动伴随气息）' },
  N: { slp1: 'N', iast: 'ṅ', deva: 'ङ', siddham: '𑖒', ipa: 'ŋ', varga: '喉音 (Ka-varga)', phonation: '鼻音', bare: ['昂', '仰'], m: ['昂阿', '昂伊', '昂乌', '昂里', '昂诶', '昂爱', '昂欧', '昂奥'], t: ['仰', '儗', '隅', '仰哩', '倪', '捱', '悟', '敖'], note: '喉音 · 软腭鼻音 [ŋ]' },

  // 2. 颚音 (Ca-varga / Palatal)
  c: { slp1: 'c', iast: 'c', deva: 'च', siddham: '𑖓', ipa: 'tɕ', varga: '颚音 (Ca-varga)', phonation: '清不送气', bare: ['兹', '遮'], m: ['扎', '几', '租', '兹里', '哲', '斋', '卓', '招'], t: ['遮', '支', '主', '室哩', '制', '斋', '祖', '昭'], note: '颚音 · 清不送气塞擦音 [tɕ]' },
  C: { slp1: 'C', iast: 'ch', deva: 'छ', siddham: '𑖔', ipa: 'tɕʰ', varga: '颚音 (Ca-varga)', phonation: '清送气', bare: ['呲', '车'], m: ['擦', '七', '粗', '次里', '车', '拆', '绰', '超'], t: ['车', '齿', '刍', '痴哩', '掣', '差', '初', '抄'], note: '颚音 · 清送气塞擦音 [tɕʰ]' },
  j: { slp1: 'j', iast: 'j', deva: 'ज', siddham: '𑖕', ipa: 'dʑ', varga: '颚音 (Ca-varga)', phonation: '浊不送气', bare: ['吉', '阇'], m: ['佳', '吉', '居', '吉里', '杰', '宅', '卓', '焦'], t: ['阇', '尔', '殊', '日哩', '逝', '惹', '助', '招'], note: '颚音 · 浊不送气塞擦音 [dʑ]' },
  J: { slp1: 'J', iast: 'jh', deva: 'झ', siddham: '𑖖', ipa: 'dʑʱ', varga: '颚音 (Ca-varga)', phonation: '浊送气', bare: ['吉哈', '社'], m: ['佳哈', '吉哈', '居哈', '吉里哈', '杰哈', '宅哈', '卓哈', '焦哈'], t: ['社', '时', '殊', '社哩', '誓', '寨', '祚', '召'], note: '颚音 · 浊送气塞擦音 [dʑʱ]' },
  Y: { slp1: 'Y', iast: 'ñ', deva: 'ञ', siddham: '𑖗', ipa: 'ɲ', varga: '颚音 (Ca-varga)', phonation: '鼻音', bare: ['尼', '若'], m: ['尼亚', '尼', '纽', '尼里', '涅', '尼爱', '尼欧', '尼奥'], t: ['若', '你', '柔', '若哩', '泥', '乃', '尿', '饶'], note: '颚音 · 硬腭鼻音 [ɲ]' },

  // 3. 卷舌音 (Ṭa-varga / Retroflex)
  w: { slp1: 'w', iast: 'ṭ', deva: 'ट', siddham: '𑖘', ipa: 'ʈ', varga: '卷舌音 (Ṭa-varga)', phonation: '清不送气', bare: ['特', '吒'], m: ['哒', '滴', '嘟', '德里', '得', '呆', '多', '刀'], t: ['吒', '知', '都', '致哩', '致', '斋', '都', '嘲'], note: '卷舌音 · 清不送气塞音 [ʈ]（舌尖后卷抵硬腭）' },
  W: { slp1: 'W', iast: 'ṭh', deva: 'ठ', siddham: '𑖙', ipa: 'ʈʰ', varga: '卷舌音 (Ṭa-varga)', phonation: '清送气', bare: ['踏', '咤'], m: ['踏', '踢', '突', '特里', '忒', '胎', '托', '掏'], t: ['咤', '耻', '偷', '耻哩', '体', '泰', '侘', '滔'], note: '卷舌音 · 清送气塞音 [ʈʰ]' },
  q: { slp1: 'q', iast: 'ḍ', deva: 'ड', siddham: '𑖚', ipa: 'ɖ', varga: '卷舌音 (Ṭa-varga)', phonation: '浊不送气', bare: ['德', '荼'], m: ['达', '迪', '读', '德里', '得', '代', '夺', '导'], t: ['荼', '腻', '度', '荼哩', '提', '代', '度', '陶'], note: '卷舌音 · 浊不送气塞音 [ɖ]' },
  Q: { slp1: 'Q', iast: 'ḍh', deva: 'ढ', siddham: '𑖛', ipa: 'ɖʱ', varga: '卷舌音 (Ṭa-varga)', phonation: '浊送气', bare: ['德哈', '荼'], m: ['达哈', '迪哈', '读哈', '德里哈', '得哈', '代哈', '夺哈', '导哈'], t: ['荼', '腻', '度', '荼哩', '提', '代', '度', '陶'], note: '卷舌音 · 浊送气塞音 [ɖʱ]' },
  R: { slp1: 'R', iast: 'ṇ', deva: 'ण', siddham: '𑖜', ipa: 'ɳ', varga: '卷舌音 (Ṭa-varga)', phonation: '鼻音', bare: ['呐', '拏'], m: ['呐', '尼', '奴', '呐里', '内', '乃', '诺', '挠'], t: ['拏', '尼', '怒', '拏哩', '泥', '乃', '诺', '闹'], note: '卷舌音 · 卷舌鼻音 [ɳ]（如 maṇi 摩尼）' },

  // 4. 齿音 (Ta-varga / Dental)
  t: { slp1: 't', iast: 't', deva: 'त', siddham: '𑖝', ipa: 't̪', varga: '齿音 (Ta-varga)', phonation: '清不送气', bare: ['特', '多'], m: ['搭', '滴', '督', '特里', '得', '呆', '多', '刀'], t: ['多', '底', '都', '底哩', '帝', '带', '都', '刀'], note: '齿音 · 清不送气塞音 [t̪]（舌尖贴上齿背）' },
  T: { slp1: 'T', iast: 'th', deva: 'थ', siddham: '𑖞', ipa: 't̪ʰ', varga: '齿音 (Ta-varga)', phonation: '清送气', bare: ['塔', '他'], m: ['塔', '替', '图', '特里', '太', '泰', '托', '涛'], t: ['他', '体', '土', '他哩', '替', '太', '吐', '讨'], note: '齿音 · 清送气塞音 [t̪ʰ]' },
  d: { slp1: 'd', iast: 'd', deva: 'द', siddham: '𑖟', ipa: 'd̪', varga: '齿音 (Ta-varga)', phonation: '浊不送气', bare: ['德', '陀'], m: ['达', '迪', '读', '德里', '代', '歹', '朵', '道'], t: ['陀', '地', '度', '陀哩', '提', '代', '度', '道'], note: '齿音 · 浊不送气塞音 [d̪]' },
  D: { slp1: 'D', iast: 'dh', deva: 'ध', siddham: '𑖠', ipa: 'd̪ʱ', varga: '齿音 (Ta-varga)', phonation: '浊送气', bare: ['德哈', '驮'], m: ['达哈', '迪哈', '读哈', '德里哈', '代哈', '歹哈', '朵哈', '道哈'], t: ['驮', '第', '度', '驮哩', '提', '代', '度', '道'], note: '齿音 · 浊送气塞音 [d̪ʱ]（如 dharma 达摩）' },
  n: { slp1: 'n', iast: 'n', deva: 'न', siddham: '𑖡', ipa: 'n̪', varga: '齿音 (Ta-varga)', phonation: '鼻音', bare: ['恩', '那'], m: ['那', '尼', '努', '那哩', '内', '奈', '诺', '恼'], t: ['那', '尼', '奴', '那哩', '祢', '乃', '怒', '恼'], note: '齿音 · 齿鼻音 [n̪]' },

  // 5. 唇音 (Pa-varga / Labial)
  p: { slp1: 'p', iast: 'p', deva: 'प', siddham: '𑖢', ipa: 'p', varga: '唇音 (Pa-varga)', phonation: '清不送气', bare: ['普', '波'], m: ['巴', '比', '布', '普里', '贝', '拜', '波', '包'], t: ['波', '比', '补', '钵哩', '闭', '拜', '逋', '宝'], note: '唇音 · 清不送气双唇塞音 [p]（如 padme 巴德美）' },
  P: { slp1: 'P', iast: 'ph', deva: 'फ', siddham: '𑖣', ipa: 'pʰ', varga: '唇音 (Pa-varga)', phonation: '清送气', bare: ['扑', '颇'], m: ['帕', '批', '铺', '普里', '胚', '派', '坡', '抛'], t: ['颇', '匹', '普', '颇哩', '沛', '派', '破', '泡'], note: '唇音 · 清送气双唇塞音 [pʰ]（如 phaṭ 发吒）' },
  b: { slp1: 'b', iast: 'b', deva: 'ब', siddham: '𑖤', ipa: 'b', varga: '唇音 (Pa-varga)', phonation: '浊不送气', bare: ['布', '婆'], m: ['拔', '鼻', '不', '布里', '北', '白', '博', '薄'], t: ['婆', '毗', '部', '跋哩', '陛', '败', '菩', '暴'], note: '唇音 · 浊不送气双唇塞音 [b]（如 bodhi 菩提）' },
  B: { slp1: 'B', iast: 'bh', deva: 'भ', siddham: '𑖥', ipa: 'bʱ', varga: '唇音 (Pa-varga)', phonation: '浊送气', bare: ['布哈', '婆'], m: ['巴(重)', '比(重)', '布(重)', '布里(重)', '贝(重)', '拜(重)', '博(重)', '包(重)'], t: ['婆', '毗', '部', '婆哩', '吠', '拜', '菩', '鲍'], note: '唇音 · 浊送气双唇塞音 [bʱ]（如 bhagavate 婆伽伐帝）' },
  m: { slp1: 'm', iast: 'm', deva: 'म', siddham: '𑖦', ipa: 'm', varga: '唇音 (Pa-varga)', phonation: '鼻音', bare: ['姆', '摩'], m: ['嘛', '咪', '木', '姆里', '美', '麦', '摩', '毛'], t: ['摩', '弥', '母', '蜜哩', '迷', '迈', '谟', '矛'], note: '唇音 · 双唇鼻音 [m]' },

  // 6. 半元音 (Antaḥstha / Semivowels)
  y: { slp1: 'y', iast: 'y', deva: 'य', siddham: '𑖧', ipa: 'j', varga: '半元音 (Antaḥstha)', phonation: '近音', bare: ['伊', '耶'], m: ['呀', '伊', '优', '伊里', '耶', '崖', '哟', '妖'], t: ['耶', '以', '由', '拽哩', '曳', '耶', '瑜', '要'], note: '半元音 · 硬腭近音 [j]' },
  r: { slp1: 'r', iast: 'r', deva: 'र', siddham: '𑖨', ipa: 'r', varga: '半元音 (Antaḥstha)', phonation: '颤/闪音', bare: ['尔', '啰'], m: ['啦', '里', '鲁', '里', '雷', '来', '罗', '劳'], t: ['啰', '利', '噜', '哩', '礼', '来', '路', '牢'], note: '半元音 · 卷舌/齿龈闪颤音 [r]（唐代注「弹舌呼」）' },
  l: { slp1: 'l', iast: 'l', deva: 'ल', siddham: '𑖩', ipa: 'l̪', varga: '半元音 (Antaḥstha)', phonation: '边音', bare: ['勒', '罗'], m: ['拉', '利', '卢', '勒里', '雷', '赖', '洛', '捞'], t: ['罗', '离', '路', '嚧', '隶', '赖', '路', '劳'], note: '半元音 · 齿边音 [l̪]' },
  v: { slp1: 'v', iast: 'v', deva: 'व', siddham: '𑖪', ipa: 'ʋ', varga: '半元音 (Antaḥstha)', phonation: '唇齿近音', bare: ['夫', '嚩'], m: ['瓦', '维', '乌', '弗里', '威', '歪', '窝', '凹'], t: ['嚩', '尾', '无', '嚩哩', '吠', '吠', '务', '嚩奥'], note: '半元音 · 唇齿无擦通音 [ʋ]（介于 v 与 w 之间）' },

  // 7. 擦音与气音 (Ūṣman / Sibilants & Aspirate + Vedic ḷ)
  S: { slp1: 'S', iast: 'ś', deva: 'श', siddham: '𑖫', ipa: 'ɕ', varga: '擦音 (Ūṣman)', phonation: '颚擦音', bare: ['什', '奢'], m: ['夏', '希', '舒', '什里', '谁', '晒', '说', '烧'], t: ['奢', '尸', '输', '室哩', '世', '晒', '戍', '烧'], note: '擦音 · 硬腭清擦音 [ɕ]（近普通话 x/sh）' },
  z: { slp1: 'z', iast: 'ṣ', deva: 'ष', siddham: '𑖬', ipa: 'ʂ', varga: '擦音 (Ūṣman)', phonation: '卷舌擦音', bare: ['嘶', '沙'], m: ['沙', '师', '书', '什里', '奢', '筛', '朔', '稍'], t: ['沙', '史', '刍', '瑟哩', '势', '晒', '疏', '梢'], note: '擦音 · 卷舌清擦音 [ʂ]（近普通话 sh）' },
  s: { slp1: 's', iast: 's', deva: 'स', siddham: '𑖭', ipa: 's̪', varga: '擦音 (Ūṣman)', phonation: '齿擦音', bare: ['斯', '娑'], m: ['萨', '西', '苏', '斯里', '塞', '腮', '索', '骚'], t: ['娑', '悉', '苏', '悉哩', '细', '赛', '素', '骚'], note: '擦音 · 齿清擦音 [s̪]（近普通话 s）' },
  h: { slp1: 'h', iast: 'h', deva: 'ह', siddham: '𑖮', ipa: 'ɦ', varga: '气音 (Ūṣman)', phonation: '浊声门擦音', bare: ['赫', '诃'], m: ['哈', '希', '呼', '赫里', '黑', '嗨', '豁', '好'], t: ['诃', '醯', '虎', '紇哩', '醯', '海', '呼', '豪'], note: '气音 · 浊声门擦音 [ɦ]' },
  L: { slp1: 'L', iast: 'ḷ', deva: 'ळ', siddham: '𑖩', ipa: 'ɭ', varga: '吠陀音 (Vedic)', phonation: '卷舌边闪音', bare: ['勒', '罗'], m: ['啦', '里', '卢', '里', '雷', '赖', '洛', '捞'], t: ['罗', '离', '路', '哩', '隶', '赖', '路', '劳'], note: '吠陀卷舌边闪音 [ɭ]（常见于梨俱吠陀 agnimīḷe）' },
};

export const CANONICAL_34_CONSONANT_KEYS = Object.keys(CONS_MATRIX);
export const CANONICAL_14_VOWEL_KEYS = CANONICAL_14_VOWELS.map((v) => v.slp1);

export const SYLLABLE_OVERRIDES: Record<string, SacredOverrideEntry> = {
  oM: { slp1: 'oM', iast: 'oṃ', deva: 'ॐ', siddham: '𑖍𑖼', ipa: 'oːm', m: '嗡', t: '唵', meter: '—', note: '神圣种子字 Praṇava (oṃ) · 三身总持根本音' },
  hUM: { slp1: 'hUM', iast: 'hūṃ', deva: 'हूं', siddham: '𑖮𑖳𑖼', ipa: 'ɦuːm', m: '轰', t: '吽', meter: '—', note: '金刚部圆满种子字 (hūṃ) · 摧破一切障难' },
  huM: { slp1: 'huM', iast: 'huṃ', deva: 'हुं', siddham: '𑖮𑖲𑖼', ipa: 'ɦum', m: '轰', t: '吽', meter: '—', note: '金刚部种子字 (huṃ)' },
  hrIH: { slp1: 'hrIH', iast: 'hrīḥ', deva: 'ह्रीः', siddham: '𑖮𑖿𑖨𑖱𑖽', ipa: 'ɦriːhⁱ', m: '赫里希', t: '纥哩', meter: '—', note: '莲花部阿弥陀佛/观自在菩萨根本种子字 (hrīḥ)' },
  hrIM: { slp1: 'hrIM', iast: 'hrīṃ', deva: 'ह्रीं', siddham: '𑖮𑖿𑖨𑖱𑖼', ipa: 'ɦriːm', m: '赫里姆', t: '纥哩', meter: '—', note: '大悲摄受种子字 (hrīṃ)' },
  SrIM: { slp1: 'SrIM', iast: 'śrīṃ', deva: 'श्रीं', siddham: '𑖫𑖿𑖨𑖱𑖼', ipa: 'ɕriːm', m: '什里姆', t: '室哩', meter: '—', note: '大吉祥天女福德种子字 (śrīṃ)' },
  klIM: { slp1: 'klIM', iast: 'klīṃ', deva: 'क्लीं', siddham: '𑖎𑖿𑖩𑖱𑖼', ipa: 'kliːm', m: '克里姆', t: '讫哩', meter: '—', note: '金刚钩召敬爱种子字 (klīṃ)' },
  DIH: { slp1: 'DIH', iast: 'dhīḥ', deva: 'धीः', siddham: '𑖠𑖱𑖽', ipa: 'd̪ʱiːhⁱ', m: '迪希', t: '谛', meter: '—', note: '文殊师利菩萨般若智慧种子字 (dhīḥ)' },
  BrUM: { slp1: 'BrUM', iast: 'bhrūṃ', deva: 'भ्रूं', siddham: '𑖥𑖿𑖨𑖳𑖼', ipa: 'bʱruːm', m: '布鲁姆', t: '勃笼', meter: '—', note: '一字金轮佛顶/尊胜佛顶种子字 (bhrūṃ)' },
  svA: { slp1: 'svA', iast: 'svā', deva: 'स्वा', siddham: '𑖭𑖿𑖪𑖯', ipa: 'sʋɑː', m: '斯哇～', t: '娑婆', meter: '—', note: '吉祥圆满成就词首 (svā)' },
  sva: { slp1: 'sva', iast: 'sva', deva: 'स्व', siddham: '𑖭𑖿𑖪', ipa: 'sʋɐ', m: '斯瓦', t: '娑嚩', meter: '⏑', note: '自性/天界 (sva)' },
  svaH: { slp1: 'svaH', iast: 'svaḥ', deva: 'स्वः', siddham: '𑖭𑖿𑖪𑖽', ipa: 'sʋɐhᵃ', m: '斯瓦哈', t: '娑嚩诃', meter: '—', note: '三界之天界 (svaḥ)' },
  svar: { slp1: 'svar', iast: 'svar', deva: 'स्वर्', siddham: '𑖭𑖿𑖪𑖨𑖿', ipa: 'sʋɐr', m: '斯瓦尔', t: '娑嚩啰', meter: '—', note: '天界光明 (svar)' },
  BUr: { slp1: 'BUr', iast: 'bhūr', deva: 'भूर्', siddham: '𑖥𑖳𑖨𑖿', ipa: 'bʱuːr', m: '布尔', t: '婆啰', meter: '—', note: '三界之地界 (bhūr)' },
  BUH: { slp1: 'BUH', iast: 'bhūḥ', deva: 'भूः', siddham: '𑖥𑖳𑖽', ipa: 'bʱuːhᵘ', m: '布呼', t: '婆诃', meter: '—', note: '地界 (bhūḥ)' },
  hA: { slp1: 'hA', iast: 'hā', deva: 'हा', siddham: '𑖮𑖯', ipa: 'ɦɑː', m: '哈～', t: '诃', meter: '—', note: '圆满结归尾音 (hā)' },
  SrI: { slp1: 'SrI', iast: 'śrī', deva: 'श्री', siddham: '𑖫𑖿𑖨𑖱', ipa: 'ɕriː', m: '什里～', t: '室利', meter: '—', note: '吉祥殊胜尊称 (śrī)' },
  pra: { slp1: 'pra', iast: 'pra', deva: 'प्र', siddham: '𑖢𑖿𑖨', ipa: 'prɐ', m: '普拉', t: '般若(首)', meter: '⏑', note: '胜义向前前缀 (pra)' },
  jYA: { slp1: 'jYA', iast: 'jñā', deva: 'ज्ञा', siddham: '𑖕𑖿𑖗𑖯', ipa: 'dʑɲɑː', m: '佳尼亚～', t: '若', meter: '—', note: '般若智慧二合音 (jñā · 绝不可误读为印地语 gya)' },
  jYa: { slp1: 'jYa', iast: 'jña', deva: 'ज्ञ', siddham: '𑖕𑖿𑖗', ipa: 'dʑɲɐ', m: '佳尼亚', t: '若', meter: '⏑', note: '智 (jña [dʑɲɐ])' },
  kza: { slp1: 'kza', iast: 'kṣa', deva: 'क्ष', siddham: '𑖎𑖿𑖬', ipa: 'kʂɐ', m: '克沙', t: '叉', meter: '⏑', note: '特殊二合复辅音 (kṣa [kʂɐ])' },
  kzA: { slp1: 'kzA', iast: 'kṣā', deva: 'क्षा', siddham: '𑖎𑖿𑖬𑖯', ipa: 'kʂɑː', m: '克沙～', t: '叉', meter: '—', note: '特殊二合复辅音长音 (kṣā [kʂɑː])' },
  kzi: { slp1: 'kzi', iast: 'kṣi', deva: 'क्षि', siddham: '𑖎𑖿𑖬𑖰', ipa: 'kʂi', m: '克希', t: '絺', meter: '⏑', note: '二合音 (kṣi)' },
  kzI: { slp1: 'kzI', iast: 'kṣī', deva: 'क्षी', siddham: '𑖎𑖿𑖬𑖱', ipa: 'kʂiː', m: '克希～', t: '絺', meter: '—', note: '二合音长音 (kṣī)' },
  kzu: { slp1: 'kzu', iast: 'kṣu', deva: 'क्षु', siddham: '𑖎𑖿𑖬𑖲', ipa: 'kʂu', m: '克书', t: '刍', meter: '⏑', note: '二合音 (kṣu)' },
  kze: { slp1: 'kze', iast: 'kṣe', deva: 'क्षे', siddham: '𑖎𑖿𑖬𑖸', ipa: 'kʂeː', m: '克奢', t: '制', meter: '—', note: '二合音 (kṣe · 如 kṣetra 刹土)' },
  Paw: { slp1: 'Paw', iast: 'phaṭ', deva: 'फट्', siddham: '𑖣𑖘𑖿', ipa: 'pʰɐʈ', m: '帕特', t: '发吒', meter: '—', note: '忿怒明王破障催伏结音 (phaṭ)' },
  saM: { slp1: 'saM', iast: 'saṃ', deva: 'सं', siddham: '𑖭𑖼', ipa: 'sɐm', m: '萨姆', t: '僧', meter: '—', note: '正等/和合前缀 (saṃ)' },
};

const DEVA_TO_SLP1: Record<string, string> = {
  'अ': 'a', 'आ': 'A', 'इ': 'i', 'ई': 'I', 'उ': 'u', 'ऊ': 'U',
  'ऋ': 'f', 'ॠ': 'F', 'ऌ': 'x', 'ॡ': 'X', 'ए': 'e', 'ऐ': 'E', 'ओ': 'o', 'औ': 'O',
  'ा': 'A', 'ि': 'i', 'ी': 'I', 'ु': 'u', 'ू': 'U',
  'ृ': 'f', 'ॄ': 'F', 'ॢ': 'x', 'ॣ': 'X', 'े': 'e', 'ै': 'E', 'ो': 'o', 'ौ': 'O',
  'ं': 'M', 'ः': 'H', 'ँ': '~', 'ऽ': "'", 'ॐ': 'oM', '।': '|', '॥': '||',
  'क': 'k', 'ख': 'K', 'ग': 'g', 'घ': 'G', 'ङ': 'N',
  'च': 'c', 'छ': 'C', 'ज': 'j', 'झ': 'J', 'ञ': 'Y',
  'ट': 'w', 'ठ': 'W', 'ड': 'q', 'ढ': 'Q', 'ण': 'R',
  'त': 't', 'थ': 'T', 'द': 'd', 'ध': 'D', 'न': 'n',
  'प': 'p', 'फ': 'P', 'ब': 'b', 'भ': 'B', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'S', 'ष': 'z', 'स': 's', 'ह': 'h', 'ळ': 'L',
};

const DEVA_CONSONANTS = new Set([
  'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह', 'ळ',
]);

const DEVA_MATRAS = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ॄ', 'ॢ', 'ॣ', 'े', 'ै', 'ो', 'ौ']);
const VIRAMA = '्';

const IAST_TO_SLP1_RULES: Array<[string, string]> = [
  ['ai', 'E'], ['au', 'O'],
  ['kh', 'K'], ['gh', 'G'], ['ch', 'C'], ['jh', 'J'],
  ['ṭh', 'W'], ['ḍh', 'Q'], ['th', 'T'], ['dh', 'D'],
  ['ph', 'P'], ['bh', 'B'],
  ['ṝ', 'F'], ['ṛ', 'f'], ['ḹ', 'X'], ['ḷ', 'x'],
  ['ā', 'A'], ['ī', 'I'], ['ū', 'U'],
  ['ṅ', 'N'], ['ñ', 'Y'], ['ṭ', 'w'], ['ḍ', 'q'], ['ṇ', 'R'],
  ['ś', 'S'], ['ṣ', 'z'], ['ṃ', 'M'], ['ṁ', 'M'], ['ḥ', 'H'], ['m̐', '~'],
];

export const ROUGH_ENGLISH_WORD_MAP: Record<string, string> = {
  om: 'oṃ', aum: 'oṃ', hum: 'hūṃ', hrih: 'hrīḥ', hrim: 'hrīṃ',
  shrim: 'śrīṃ', srim: 'śrīṃ', klim: 'klīṃ', dhih: 'dhīḥ', bhrum: 'bhrūṃ',
  phat: 'phaṭ', svaha: 'svāhā', swaha: 'svāhā', namah: 'namaḥ', namo: 'namo',
  mani: 'maṇi', padme: 'padme', tare: 'tāre', tuttare: 'tuttāre', ture: 'ture',
  gate: 'gate', paragate: 'pāragate', parasamgate: 'pārasaṃgate', bodhi: 'bodhi',
  prajna: 'prajñā', paramita: 'pāramitā', hrdaya: 'hṛdaya', hridaya: 'hṛdaya',
  bhagavate: 'bhagavate', vasudevaya: 'vāsudevāya', shanti: 'śāntiḥ', shantih: 'śāntiḥ',
  santi: 'śāntiḥ', santih: 'śāntiḥ', shiva: 'śiva', sivaya: 'śivāya', shivaya: 'śivāya',
  krishna: 'kṛṣṇa', rama: 'rāma', buddha: 'buddha', dharma: 'dharma', sangha: 'saṃgha',
  mantra: 'mantra', dharani: 'dhāraṇī', gayatri: 'gāyatrī', savitur: 'savitur',
  varenyam: 'vareṇyaṃ', dhimahi: 'dhīmahi', pracodayat: 'pracodayāt',
  ratna: 'ratna', trayaya: 'trayāya', avalokiteshvara: 'avalokiteśvara',
};

const SLP1_TO_IAST: Record<string, string> = {
  a: 'a', A: 'ā', i: 'i', I: 'ī', u: 'u', U: 'ū',
  f: 'ṛ', F: 'ṝ', x: 'ḷ', X: 'ḹ', e: 'e', E: 'ai', o: 'o', O: 'au',
  M: 'ṃ', H: 'ḥ', '~': 'm̐', "'": "'", '|': '|',
  k: 'k', K: 'kh', g: 'g', G: 'gh', N: 'ṅ',
  c: 'c', C: 'ch', j: 'j', J: 'jh', Y: 'ñ',
  w: 'ṭ', W: 'ṭh', q: 'ḍ', Q: 'ḍh', R: 'ṇ',
  t: 't', T: 'th', d: 'd', D: 'dh', n: 'n',
  p: 'p', P: 'ph', b: 'b', B: 'bh', m: 'm',
  y: 'y', r: 'r', l: 'l', v: 'v',
  S: 'ś', z: 'ṣ', s: 's', h: 'h', L: 'ḷ',
};

const SLP1_VOWEL_TO_DEVA: Record<string, string> = {
  a: 'अ', A: 'आ', i: 'इ', I: 'ई', u: 'उ', U: 'ऊ',
  f: 'ऋ', F: 'ॠ', x: 'ऌ', X: 'ॡ', e: 'ए', E: 'ऐ', o: 'ओ', O: 'औ',
};

const SLP1_MATRA_TO_DEVA: Record<string, string> = {
  a: '', A: 'ा', i: 'ि', I: 'ी', u: 'ु', U: 'ू',
  f: 'ृ', F: 'ॄ', x: 'ॢ', X: 'ॣ', e: 'े', E: 'ै', o: 'ो', O: 'ौ',
};

const SLP1_VOWEL_TO_SIDDHAM: Record<string, string> = {
  a: '𑖀', A: '𑖁', i: '𑖂', I: '𑖃', u: '𑖄', U: '𑖅',
  f: '𑖆', F: '𑖇', x: '𑖈', X: '𑖉', e: '𑖊', E: '𑖋', o: '𑖌', O: '𑖍',
};

const SLP1_MATRA_TO_SIDDHAM: Record<string, string> = {
  a: '', A: '𑖯', i: '𑖰', I: '𑖱', u: '𑖲', U: '𑖳',
  f: '𑖴', F: '𑖵', x: '𑖴', X: '𑖵', e: '𑖸', E: '𑖹', o: '𑖺', O: '𑖻',
};

const SIDDHAM_VIRAMA = '𑖿';

export function devanagariToSlp1(text: string): string {
  const s = text.normalize('NFC').replace(/[\u0951-\u0954\u200c\u200d]/g, '');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (DEVA_CONSONANTS.has(ch)) {
      out += DEVA_TO_SLP1[ch];
      if (next === VIRAMA) {
        i++;
      } else if (next && DEVA_MATRAS.has(next)) {
        out += DEVA_TO_SLP1[next];
        i++;
      } else {
        out += 'a';
      }
    } else if (DEVA_TO_SLP1[ch] !== undefined) {
      out += DEVA_TO_SLP1[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

export function latinChunkToSlp1(chunk: string, mode: 'smart' | 'strict' | 'slp1' = 'smart'): string {
  if (mode === 'slp1') return chunk;
  let text = chunk.normalize('NFC').toLowerCase();
  if (mode === 'smart') {
    text = text.replace(/[a-zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ']+/g, (word) => {
      if (ROUGH_ENGLISH_WORD_MAP[word]) return ROUGH_ENGLISH_WORD_MAP[word];
      if (!/[āīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]/.test(word)) {
        return word
          .replace(/shh/g, 'ṣ')
          .replace(/ksh/g, 'kṣ')
          .replace(/sh/g, 'ś')
          .replace(/aa/g, 'ā')
          .replace(/ee/g, 'ī')
          .replace(/oo/g, 'ū');
      }
      return word;
    });
  }
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const [pat, rep] of IAST_TO_SLP1_RULES) {
      if (text.startsWith(pat, i)) {
        out += rep;
        i += pat.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i];
      i++;
    }
  }
  return out;
}

export function inputToSlp1(text: string, mode: 'smart' | 'strict' | 'slp1' = 'smart'): string {
  if (!text) return '';
  const cleaned = text.replace(/[\u0951-\u0954\u200c\u200d]/g, '');
  const parts = cleaned.split(/([\u0900-\u097F]+)/g);
  return parts
    .map((part) => {
      if (!part) return '';
      if (/[\u0900-\u097F]/.test(part)) return devanagariToSlp1(part);
      return latinChunkToSlp1(part, mode);
    })
    .join('');
}

export function slp1ToIast(slp: string): string {
  return Array.from(slp)
    .map((ch) => (SLP1_TO_IAST[ch] !== undefined ? SLP1_TO_IAST[ch] : ch))
    .join('');
}

export function slp1ToDevanagari(slp: string): string {
  let out = '';
  let i = 0;
  while (i < slp.length) {
    if (slp.startsWith('||', i)) {
      out += '॥';
      i += 2;
      continue;
    }
    if (slp[i] === '|') {
      out += '।';
      i++;
      continue;
    }
    if (slp.startsWith('oM', i) && (i === 0 || /[\s|]/.test(slp[i - 1])) && (i + 2 >= slp.length || /[\s|]/.test(slp[i + 2]))) {
      out += 'ॐ';
      i += 2;
      continue;
    }
    const ch = slp[i];
    if (CONS_MATRIX[ch]) {
      out += CONS_MATRIX[ch].deva;
      const next = slp[i + 1];
      if (next && SLP1_MATRA_TO_DEVA[next] !== undefined) {
        out += SLP1_MATRA_TO_DEVA[next];
        i += 2;
      } else {
        out += VIRAMA;
        i++;
      }
    } else if (SLP1_VOWEL_TO_DEVA[ch]) {
      out += SLP1_VOWEL_TO_DEVA[ch];
      i++;
    } else if (ch === 'M') {
      out += 'ं';
      i++;
    } else if (ch === 'H') {
      out += 'ः';
      i++;
    } else if (ch === '~') {
      out += 'ँ';
      i++;
    } else if (ch === "'") {
      out += 'ऽ';
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

export function slp1ToSiddham(slp: string): string {
  let out = '';
  let i = 0;
  while (i < slp.length) {
    if (slp.startsWith('||', i)) {
      out += '𑗃';
      i += 2;
      continue;
    }
    if (slp[i] === '|') {
      out += '𑗂';
      i++;
      continue;
    }
    if (slp.startsWith('oM', i) && (i === 0 || /[\s|]/.test(slp[i - 1])) && (i + 2 >= slp.length || /[\s|]/.test(slp[i + 2]))) {
      out += '𑖍𑖼';
      i += 2;
      continue;
    }
    const ch = slp[i];
    if (CONS_MATRIX[ch]) {
      out += CONS_MATRIX[ch].siddham;
      const next = slp[i + 1];
      if (next && SLP1_MATRA_TO_SIDDHAM[next] !== undefined) {
        out += SLP1_MATRA_TO_SIDDHAM[next];
        i += 2;
      } else {
        out += SIDDHAM_VIRAMA;
        i++;
      }
    } else if (SLP1_VOWEL_TO_SIDDHAM[ch]) {
      out += SLP1_VOWEL_TO_SIDDHAM[ch];
      i++;
    } else if (ch === 'M') {
      out += '𑖼';
      i++;
    } else if (ch === 'H') {
      out += '𑖽';
      i++;
    } else if (ch === '~') {
      out += '𑖻';
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

const VOWEL_IPA_MAP: Record<string, string> = Object.fromEntries(
  CANONICAL_14_VOWELS.map((v) => [v.slp1, v.ipa])
);

export function slp1ToIpa(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    const ch = slp[i];
    if (CONS_MATRIX[ch]) {
      out += CONS_MATRIX[ch].ipa;
    } else if (VOWEL_IPA_MAP[ch]) {
      out += VOWEL_IPA_MAP[ch];
    } else if (ch === 'M') {
      const next = slp[i + 1] || '';
      if (/[kKgGN]/.test(next)) out += 'ŋ';
      else if (/[cCjJYS]/.test(next)) out += 'ɲ';
      else if (/[wWqQR]/.test(next)) out += 'ɳ';
      else if (/[tTdDn]/.test(next)) out += 'n̪';
      else out += 'm';
    } else if (ch === 'H') {
      out += 'h';
    } else if (ch === '~') {
      out += '̃';
    } else {
      out += ch;
    }
  }
  return out;
}
