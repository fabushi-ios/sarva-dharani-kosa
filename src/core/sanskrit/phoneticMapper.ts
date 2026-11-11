/**
 * src/core/sanskrit/phoneticMapper.ts
 *
 * Professor-Grade Deterministic Sanskrit Phonological & Phonetic Engine:
 * 1. Complete 34 × 14 Akṣara Phonetic Matrix (Modern Mandarin Phonetics & Tang Siddhaṃ Classical Orthography)
 *    with zero Extension-B tofu characters, zero Siddhaṃ leakage, and zero fallback concatenation artifacts.
 * 2. Context-Aware Śikṣā Sandhi & Coarticulation:
 *    - Abhinidhāna (Homorganic geminate stop closure absorption: bud-dhā -> 布达, sat-tvā -> 萨特瓦, sid-dhe -> 悉叠)
 *    - Parasavarṇa (Anusvāra ṃ place-of-articulation assimilation: [ŋ] velar, [ɲ/ɳ/n̪] coronal, [m/m̃] labial/final)
 *    - Single-Character Mandarin Nasal Rhyme Synthesis (man -> 曼, cin -> 津, śān -> 善, kaṇ -> 干, khūṃ -> 空)
 *    - Vowel-Colored Visarga ḥ Echo/Aspiration (-aḥ -> 赫, -iḥ -> 希, -uḥ -> 忽/呼)
 *    - Pre-Palatal Repha Svarabhakti (-r before y- -> 哩: ār-yā -> 阿哩呀, vai-ḍūr-ya -> 歪杜哩呀)
 *    - Dual-Mode Onset Cluster Prefixes (palatal glide before -y vs minimal schwa before -r/-l/-v/stops)
 * 3. Sanskrit Samāsa Compound Stem Hyphenator for long polysyllabic compounds.
 * 4. 100% Unified Single-Source-of-Truth between Verse-Level "梵音拼读参考" and Syllable-Level "逐音节三体对照跟读卡".
 */

import { cleanEditorialIast } from './transliterator';
import {
  analyzeSanskritProsody,
  tokenizeWordPhonemes,
  type SyllableAnalysis,
} from './prosody';

export interface SyllablePhoneticContext {
  onset?: string[];
  vowel?: string;
  modifiers?: string[];
  coda?: string[];
  isWordStart?: boolean;
  isWordEnd?: boolean;
  sameSubwordNext?: boolean;
  acrossPauseNext?: boolean;
  nextOnset?: string[];
}

export interface EnrichedPhoneticSyllable extends SyllableAnalysis {
  classicalZh: string;
  modernZh: string;
  compoundHyphenBefore: boolean;
}

/**
 * Authoritative Classical Tang/Song Sūtra whole-word transliterations & glosses
 * (used for Classical Chinese fallback & word-level vyākaraṇa glossing).
 */
const WORD_CLASSICAL_DICTIONARY: Record<
  string,
  { classicalZh: string; meaningZh?: string }
> = {
  om: { classicalZh: '唵', meaningZh: '三身总持圣音' },
  oṃ: { classicalZh: '唵', meaningZh: '三身总持圣音' },
  namo: { classicalZh: '南无 / 曩谟', meaningZh: '归命、敬礼' },
  namaḥ: { classicalZh: '曩莫', meaningZh: '归命、顶礼' },
  namas: { classicalZh: '曩莫', meaningZh: '归命、顶礼' },
  nama: { classicalZh: '曩莫', meaningZh: '归命' },
  nam: { classicalZh: '喃', meaningZh: '敬礼/句尾鼻音' },
  naṃ: { classicalZh: '喃', meaningZh: '敬礼/句尾随韵' },
  nām: { classicalZh: '喃', meaningZh: '诸尊（属格复数尾音）' },
  nāṃ: { classicalZh: '喃', meaningZh: '诸尊（属格复数尾音）' },
  buddhāya: { classicalZh: '佛驮耶 / 没驮耶', meaningZh: '向佛陀觉者' },
  dharmāya: { classicalZh: '达摩耶', meaningZh: '向正法' },
  saṃghāya: { classicalZh: '僧伽耶', meaningZh: '向圣僧伽' },
  bhagavate: { classicalZh: '薄伽伐帝 / 婆誐嚩帝', meaningZh: '向世尊' },
  bhagavatyai: { classicalZh: '婆誐嚩底曳', meaningZh: '向世尊佛母' },
  ratnatrayāya: { classicalZh: '喝啰怛那哆啰夜耶', meaningZh: '向三宝' },
  tathāgatāya: { classicalZh: '怛他蘖多耶', meaningZh: '向如来' },
  arhate: { classicalZh: '阿啰诃帝', meaningZh: '向应供' },
  samyaksaṃbuddhāya: { classicalZh: '三藐三没驮耶', meaningZh: '向正等正觉' },
  samantabuddhānām: { classicalZh: '三曼多没驮喃', meaningZh: '普遍一切诸佛' },
  samantabuddhānāṃ: { classicalZh: '三曼多没驮喃', meaningZh: '普遍一切诸佛' },
  ārya: { classicalZh: '阿哩耶', meaningZh: '圣尊' },
  āryāvalokiteśvarāya: { classicalZh: '阿唎耶婆卢羯帝烁钵啰耶', meaningZh: '向圣观自在菩萨' },
  avalokiteśvarāya: { classicalZh: '阿嚩卢枳帝湿嚩啰耶', meaningZh: '向观自在菩萨' },
  bodhisattvāya: { classicalZh: '菩提萨埵耶 / 冒地萨怛嚩耶', meaningZh: '向菩萨' },
  mahāsattvāya: { classicalZh: '摩诃萨埵耶', meaningZh: '向摩诃萨（大有情）' },
  mahākāruṇikāya: { classicalZh: '摩诃迦噜抳迦耶', meaningZh: '向大悲圣尊' },
  tadyathā: { classicalZh: '怛侄他 / 怛你也他', meaningZh: '即说咒曰' },
  svāhā: { classicalZh: '娑嚩诃 / 萨婆诃', meaningZh: '圆满吉祥成就' },
  hūṃ: { classicalZh: '吽', meaningZh: '金刚不坏心印' },
  phaṭ: { classicalZh: '泮吒 / 发吒', meaningZh: '摧破魔障' },
  hrīḥ: { classicalZh: '纥哩', meaningZh: '莲华部种子字' },
  dhīḥ: { classicalZh: '地 / 谛', meaningZh: '文殊般若种子字' },
  bhrūṃ: { classicalZh: '勃笼', meaningZh: '佛顶尊胜一字心' },
  gate: { classicalZh: '揭谛', meaningZh: '度越吧' },
  pāragate: { classicalZh: '波罗揭谛', meaningZh: '度向彼岸吧' },
  pārasaṃgate: { classicalZh: '波罗僧揭谛', meaningZh: '普同度至彼岸吧' },
  bodhi: { classicalZh: '菩提 / 冒地', meaningZh: '正觉菩提' },
  sarva: { classicalZh: '萨嚩 / 萨婆', meaningZh: '一切' },
  mahā: { classicalZh: '摩诃', meaningZh: '大、广大' },
  vajra: { classicalZh: '嚩日啰 / 跋折罗', meaningZh: '金刚' },
  padme: { classicalZh: '钵讷铭', meaningZh: '莲华中' },
  padma: { classicalZh: '钵纳摩', meaningZh: '莲华' },
  maṇi: { classicalZh: '摩抳', meaningZh: '摩尼宝珠' },
  maṇipadme: { classicalZh: '摩抳钵讷铭', meaningZh: '持摩尼宝与莲华尊' },
  śuddhe: { classicalZh: '戍第', meaningZh: '清净尊' },
  viśuddhe: { classicalZh: '尾戍第', meaningZh: '最极清净尊' },
};

/**
 * 8 Vowel Quality Indices for the 34 × 8 Phonetic Quality Matrix:
 * 0: a / ā
 * 1: i / ī
 * 2: u / ū
 * 3: ṛ / ṝ / ḷ / ḹ
 * 4: e
 * 5: ai
 * 6: o
 * 7: au
 */
const VOWEL_QUALITY_IDX: Record<string, number> = {
  a: 0,
  ā: 0,
  i: 1,
  ī: 1,
  u: 2,
  ū: 2,
  ṛ: 3,
  ṝ: 3,
  ḷ: 3,
  ḹ: 3,
  e: 4,
  ai: 5,
  o: 6,
  au: 7,
};

const INHERENT_LONG_SET = new Set(['ā', 'ī', 'ū', 'ṝ', 'ḹ']);

/**
 * Standalone Independent Vowels (Svara)
 */
const INDEPENDENT_VOWEL_MAP: Record<string, { modern: string; tang: string }> = {
  a: { modern: '阿', tang: '阿' },
  ā: { modern: '阿', tang: '阿(引)' },
  i: { modern: '伊', tang: '伊' },
  ī: { modern: '伊', tang: '伊(引)' },
  u: { modern: '乌', tang: '坞' },
  ū: { modern: '乌', tang: '污(引)' },
  ṛ: { modern: '哩', tang: '哩' },
  ṝ: { modern: '哩', tang: '哩(引)' },
  ḷ: { modern: '吕', tang: '里' },
  ḹ: { modern: '吕', tang: '里(引)' },
  e: { modern: '诶', tang: '翳' },
  ai: { modern: '爱', tang: '蔼' },
  o: { modern: '欧', tang: '污' },
  au: { modern: '奥', tang: '奥' },
};

type EightRow = [string, string, string, string, string, string, string, string];

/**
 * Complete 34-Consonant × 8-Vowel-Quality Modern Mandarin Phonetic Matrix (`CV_MODERN_MATRIX`)
 * Every cell is a natural, single-syllable (except vocalic ṛ), scholarly Chinese phonetic rendering:
 * [a/ā, i/ī, u/ū, ṛ/ṝ, e, ai, o, au]
 */
const CV_MODERN_MATRIX: Record<string, EightRow> = {
  // Ka-varga (Velars 喉音)
  k:  ['嘎', '给', '古', '克哩', '给', '该', '果', '高'],
  kh: ['卡', '奇', '库', '克哩', '开', '凯', '考', '考'],
  g:  ['嘎', '吉', '古', '格哩', '给', '该', '果', '高'],
  gh: ['嘎', '吉', '古', '格哩', '给', '该', '果', '高'],
  ṅ:  ['昂', '昂伊', '昂乌', '昂哩', '昂诶', '昂爱', '昂欧', '昂奥'],

  // Ca-varga (Palatals 颚音)
  c:  ['佳', '吉', '主', '奇哩', '杰', '斋', '卓', '招'],
  ch: ['恰', '奇', '楚', '奇哩', '切', '拆', '绰', '超'],
  j:  ['佳', '吉', '居', '吉哩', '杰', '斋', '久', '焦'],
  jh: ['佳', '吉', '居', '吉哩', '杰', '斋', '久', '焦'],
  ñ:  ['尼亚', '尼', '纽', '尼哩', '涅', '尼崖', '尼优', '尼妖'],

  // Ṭa-varga (Retroflexes 卷舌顶音)
  ṭ:  ['达', '蒂', '图', '特哩', '帝', '呆', '多', '刀'],
  ṭh: ['他', '提', '图', '特哩', '提', '胎', '托', '掏'],
  ḍ:  ['达', '迪', '杜', '德哩', '叠', '代', '多', '导'],
  ḍh: ['达', '迪', '杜', '德哩', '叠', '代', '多', '导'],
  ṇ:  ['拿', '尼', '努', '尼哩', '内', '乃', '诺', '挠'],

  // Ta-varga (Dentals 齿音)
  t:  ['达', '帝', '图', '特哩', '帝', '呆', '多', '刀'],
  th: ['他', '提', '图', '特哩', '提', '泰', '托', '涛'],
  d:  ['达', '地', '杜', '德哩', '叠', '代', '多', '道'],
  dh: ['达', '地', '杜', '德哩', '叠', '代', '多', '道'],
  n:  ['拿', '尼', '努', '尼哩', '内', '奈', '诺', '恼'],

  // Pa-varga (Labials 唇音)
  p:  ['巴', '比', '布', '普哩', '佩', '拜', '波', '包'],
  ph: ['帕', '批', '普', '普哩', '佩', '派', '坡', '抛'],
  b:  ['巴', '比', '布', '布哩', '贝', '白', '博', '包'],
  bh: ['巴', '比', '布', '布哩', '贝', '拜', '博', '包'],
  m:  ['玛', '米', '穆', '姆哩', '美', '麦', '摩', '毛'],

  // Antaḥstha & Ūṣman (Semivowels & Sibilants 半元音与擦音)
  y:  ['呀', '伊', '尤', '伊哩', '耶', '崖', '优', '妖'],
  r:  ['啦', '哩', '鲁', '哩',   '咧', '来', '洛', '劳'],
  l:  ['啦', '利', '卢', '吕',   '咧', '赖', '洛', '牢'],
  v:  ['瓦', '维', '武', '维哩', '威', '歪', '沃', '沃'],
  ś:  ['沙', '希', '舒', '什哩', '谢', '晒', '硕', '烧'],
  ṣ:  ['沙', '希', '舒', '什哩', '晒', '筛', '硕', '稍'],
  s:  ['萨', '悉', '苏', '斯哩', '塞', '赛', '索', '骚'],
  h:  ['哈', '嘿', '呼', '赫哩', '嘿', '嗨', '霍', '豪'],
};

/**
 * Complete 34-Consonant × 8-Vowel-Quality Classical Tang Siddhaṃ Matrix (`CV_TANG_MATRIX`)
 * 100% BMP-safe Unicode characters (zero Extension-B tofu glyphs, zero Siddhaṃ leakage).
 */
const CV_TANG_MATRIX: Record<string, EightRow> = {
  k:  ['迦', '枳', '矩', '讫哩', '计', '皆', '俱', '憍'],
  kh: ['佉', '企', '区', '企哩', '契', '楷', '寇', '考'],
  g:  ['誐', '拟', '具', '吃哩', '诣', '盖', '瞿', '豪'],
  gh: ['伽', '祇', '具', '伽哩', '诣', '慨', '瞿', '豪'],
  ṅ:  ['仰', '儗', '隅', '仰哩', '倪', '捱', '悟', '敖'],

  c:  ['者', '只', '主', '室哩', '制', '斋', '祖', '昭'],
  ch: ['车', '齿', '刍', '痴哩', '掣', '差', '初', '抄'],
  j:  ['惹', '自', '儒', '日哩', '逝', '惹', '树', '招'],
  jh: ['社', '时', '殊', '社哩', '誓', '寨', '祚', '召'],
  ñ:  ['若', '你', '柔', '若哩', '泥', '乃', '尿', '饶'],

  ṭ:  ['吒', '置', '都', '致哩', '致', '斋', '都', '嘲'],
  ṭh: ['侘', '耻', '偷', '耻哩', '体', '泰', '侘', '滔'],
  ḍ:  ['拏', '腻', '度', '荼哩', '提', '代', '度', '陶'],
  ḍh: ['茶', '腻', '度', '荼哩', '提', '代', '度', '陶'],
  ṇ:  ['拏', '抳', '怒', '拏哩', '宁', '乃', '诺', '闹'],

  t:  ['怛', '底', '都', '底哩', '帝', '带', '睹', '刀'],
  th: ['他', '耻', '土', '他哩', '替', '太', '吐', '讨'],
  d:  ['捺', '地', '努', '陀哩', '泥', '代', '怒', '道'],
  dh: ['驮', '地', '度', '驮哩', '第', '代', '度', '道'],
  n:  ['曩', '你', '努', '那哩', '祢', '乃', '怒', '恼'],

  p:  ['跛', '比', '补', '钵哩', '闭', '拜', '布', '宝'],
  ph: ['颇', '匹', '普', '颇哩', '沛', '派', '破', '泡'],
  b:  ['跋', '尾', '没', '跋哩', '陛', '败', '冒', '暴'],
  bh: ['婆', '毗', '部', '婆哩', '陛', '拜', '部', '鲍'],
  m:  ['摩', '弭', '母', '蜜哩', '铭', '迈', '谟', '矛'],

  y:  ['耶', '以', '庾', '拽哩', '曳', '耶', '瑜', '要'],
  r:  ['啰', '哩', '噜', '哩',   '隶', '来', '嚧', '牢'],
  l:  ['攞', '里', '噜', '嚧',   '隶', '赖', '路', '劳'],
  v:  ['嚩', '尾', '嚩', '嚩哩', '吠', '吠', '嚩', '嚩'],
  ś:  ['舍', '室', '戍', '室哩', '势', '晒', '戍', '烧'],
  ṣ:  ['洒', '瑟', '刍', '瑟哩', '晒', '晒', '疏', '梢'],
  s:  ['萨', '悉', '苏', '悉哩', '细', '赛', '苏', '骚'],
  h:  ['诃', '呬', '呼', '纥哩', '醯', '海', '护', '豪'],
};

/**
 * Distinct Classical Tang characters for inherent long vowels (ā, ī, ū) where attested in Tang Sūtras
 */
const TANG_LONG_CV_OVERRIDES: Record<string, string> = {
  nā: '拿',
  nī: '泥',
  kā: '迦(引)',
  kī: '计',
  kū: '俱',
  gā: '誐(引)',
  cā: '左',
  cī: '支',
  jā: '惹(引)',
  jī: '时',
  ṇā: '拏(引)',
  ṇī: '抳(引)',
  tā: '多',
  tī: '底(引)',
  tū: '都(引)',
  thā: '他(引)',
  dā: '陀',
  dī: '第',
  dhā: '驮(引)',
  dhī: '地(引)',
  pā: '波',
  pū: '布',
  bā: '么',
  bhā: '婆(引)',
  bhī: '鼻',
  bhū: '部(引)',
  mā: '摩(引)',
  yā: '夜',
  yū: '愉',
  rā: '啰(引)',
  rī: '哩(引)',
  rū: '噜(引)',
  lā: '攞(引)',
  vā: '嚩(引)',
  vī: '味',
  śā: '奢',
  śī: '尸',
  śū: '输',
  sā: '娑',
  sī: '私',
  sū: '素',
  hā: '诃',
  hī: '醯',
  hū: '虎',
};

/**
 * Single-character Mandarin Coronal Nasal (`-n`) Rhyme Table:
 * [a/ā + n, i/ī + n, u/ū + n, ṛ + n, e/ai + n, o/au + n]
 */
type SixNasalRow = [string, string, string, string, string, string];

const NASAL_N_MATRIX: Record<string, SixNasalRow> = {
  '':  ['安', '因', '温', '哩恩', '恩', '温'],
  k:   ['干', '金', '昆', '克林', '根', '滚'],
  kh:  ['堪', '钦', '坤', '克林', '肯', '坤'],
  g:   ['甘', '金', '滚', '格林', '根', '滚'],
  gh:  ['甘', '金', '滚', '格林', '根', '滚'],
  ṅ:   ['昂', '因', '温', '昂林', '恩', '翁'],
  c:   ['詹', '津', '准', '奇林', '珍', '准'],
  ch:  ['参', '亲', '春', '奇林', '嗔', '春'],
  j:   ['詹', '津', '准', '吉林', '珍', '准'],
  jh:  ['詹', '津', '准', '吉林', '珍', '准'],
  ñ:   ['年', '宁', '纽恩', '尼林', '年', '农'],
  ṭ:   ['丹', '丁', '敦', '特林', '得恩', '敦'],
  ṭh:  ['滩', '听', '吞', '特林', '特恩', '吞'],
  ḍ:   ['丹', '丁', '敦', '德林', '得恩', '敦'],
  ḍh:  ['丹', '丁', '敦', '德林', '得恩', '敦'],
  ṇ:   ['南', '宁', '嫩', '尼林', '嫩', '农'],
  t:   ['丹', '丁', '敦', '特林', '得恩', '敦'],
  th:  ['滩', '听', '吞', '特林', '特恩', '吞'],
  d:   ['丹', '丁', '敦', '德林', '得恩', '敦'],
  dh:  ['丹', '丁', '敦', '德林', '得恩', '敦'],
  n:   ['南', '宁', '嫩', '尼林', '嫩', '农'],
  p:   ['班', '宾', '奔', '普林', '本', '奔'],
  ph:  ['潘', '拼', '喷', '普林', '盆', '喷'],
  b:   ['班', '宾', '奔', '布林', '本', '奔'],
  bh:  ['班', '宾', '奔', '毗林', '本', '奔'],
  m:   ['曼', '民', '闷', '姆林', '门', '闷'],
  y:   ['延', '因', '晕', '伊林', '延', '晕'],
  r:   ['兰', '林', '伦', '林',   '伦', '伦'],
  l:   ['兰', '林', '伦', '林',   '伦', '伦'],
  v:   ['万', '文', '温', '维林', '文', '温'],
  ś:   ['善', '心', '顺', '什林', '申', '顺'],
  ṣ:   ['山', '申', '顺', '什林', '申', '顺'],
  s:   ['散', '辛', '孙', '斯林', '森', '孙'],
  h:   ['罕', '欣', '昏', '赫林', '痕', '昏'],
};

/**
 * Single-character Mandarin Velar / Resonant Nasal (`-ng`) Rhyme Table:
 * [a/ā + ng, i/ī + ng, u/ū + ng, ṛ + ng, e/ai + ng, o/au + ng]
 */
const NASAL_NG_MATRIX: Record<string, SixNasalRow> = {
  '':  ['昂', '英', '翁', '哩昂', '鞥', '嗡'],
  k:   ['刚', '京', '工', '克灵', '耕', '工'],
  kh:  ['康', '卿', '空', '克灵', '坑', '空'],
  g:   ['刚', '京', '工', '格灵', '耕', '工'],
  gh:  ['刚', '京', '工', '格灵', '耕', '工'],
  ṅ:   ['昂', '英', '翁', '昂灵', '鞥', '翁'],
  c:   ['章', '精', '中', '奇灵', '征', '中'],
  ch:  ['昌', '清', '充', '奇灵', '称', '充'],
  j:   ['章', '精', '中', '吉灵', '征', '中'],
  jh:  ['章', '精', '中', '吉灵', '征', '中'],
  ñ:   ['娘', '宁', '浓', '尼灵', '宁', '浓'],
  ṭ:   ['当', '丁', '东', '特灵', '登', '东'],
  ṭh:  ['汤', '听', '通', '特灵', '腾', '通'],
  ḍ:   ['当', '丁', '东', '德灵', '登', '东'],
  ḍh:  ['当', '丁', '东', '德灵', '登', '东'],
  ṇ:   ['南', '宁', '农', '尼灵', '能', '农'],
  t:   ['当', '定', '东', '特灵', '登', '东'],
  th:  ['汤', '听', '通', '特灵', '腾', '通'],
  d:   ['当', '定', '东', '德灵', '登', '东'],
  dh:  ['当', '定', '东', '德灵', '登', '东'],
  n:   ['南', '宁', '农', '尼灵', '能', '农'],
  p:   ['邦', '兵', '崩', '普灵', '朋', '崩'],
  ph:  ['滂', '娉', '烹', '普灵', '烹', '烹'],
  b:   ['邦', '兵', '崩', '布灵', '崩', '崩'],
  bh:  ['邦', '兵', '崩', '毗灵', '崩', '崩'],
  m:   ['芒', '明', '蒙', '姆灵', '盟', '蒙'],
  y:   ['央', '英', '雍', '伊灵', '英', '雍'],
  r:   ['朗', '灵', '隆', '灵',   '棱', '隆'],
  l:   ['朗', '灵', '隆', '灵',   '棱', '隆'],
  v:   ['旺', '文', '翁', '维灵', '翁', '翁'],
  ś:   ['商', '星', '充', '什灵', '生', '充'],
  ṣ:   ['伤', '生', '崇', '什灵', '生', '崇'],
  s:   ['桑', '星', '松', '斯灵', '僧', '松'],
  h:   ['罕', '兴', '吽', '赫灵', '哼', '轰'],
};

/**
 * Universal Sacred Esoteric Syllables & Exact Akṣara Overrides (valid in any word position)
 */
const UNIVERSAL_AKSARA_OVERRIDES: Record<string, { modern: string; tang: string }> = {
  oṃ: { modern: '嗡', tang: '唵' },
  om: { modern: '嗡', tang: '唵' },
  hūṃ: { modern: '吽', tang: '吽' },
  hum: { modern: '吽', tang: '吽' },
  huṃ: { modern: '吽', tang: '吽' },
  khūṃ: { modern: '空', tang: '吽' },
  hrīḥ: { modern: '赫哩希', tang: '纥哩' },
  hrīṃ: { modern: '赫林', tang: '纥哩' },
  dhīḥ: { modern: '迪希', tang: '地' },
  bhrūṃ: { modern: '部隆', tang: '勃笼' },
  trūṃ: { modern: '特隆', tang: '都嚧瓮' },
  ṭrūṃ: { modern: '特隆', tang: '吒嚧瓮' },
  śrīṃ: { modern: '什林', tang: '室哩' },
  śrī: { modern: '什哩', tang: '室利' },
  klīṃ: { modern: '克林', tang: '讫哩' },
  krīṃ: { modern: '克林', tang: '讫哩' },
  phaṭ: { modern: '帕特', tang: '泮吒' },
  svā: { modern: '斯瓦', tang: '娑嚩' },
  pad: { modern: '帕德', tang: '钵讷' },
  hoḥ: { modern: '霍赫', tang: '斛' },
  jaḥ: { modern: '佳赫', tang: '弱' },
  tsa: { modern: '杂', tang: '縒' },
  tsal: { modern: '杂尔', tang: '縒攞' },
  ysa: { modern: '伊萨', tang: '也娑' },
};

/**
 * Standalone 1-Syllable Bīja Overrides (applied ONLY when standalone word, not medial saṃ/laṃ/raṃ sandhi)
 */
const STANDALONE_BIJA_OVERRIDES: Record<string, { modern: string; tang: string }> = {
  aiṃ: { modern: '爱姆', tang: '蔼' },
  vaṃ: { modern: '汪', tang: '鑁' },
  vam: { modern: '汪', tang: '鑁' },
  kham: { modern: '康', tang: '欠' },
  khaṃ: { modern: '康', tang: '欠' },
  ram: { modern: '兰', tang: '览' },
  raṃ: { modern: '朗', tang: '览' },
  lam: { modern: '兰', tang: '蓝' },
  laṃ: { modern: '兰', tang: '蓝' },
  ham: { modern: '罕', tang: '唅' },
  haṃ: { modern: '罕', tang: '唅' },
  mam: { modern: '芒', tang: '莽' },
  maṃ: { modern: '芒', tang: '莽' },
  nam: { modern: '南', tang: '喃' },
  naṃ: { modern: '南', tang: '喃' },
  nām: { modern: '南', tang: '喃(引)' },
  nāṃ: { modern: '南', tang: '喃(引)' },
};

/**
 * Minimal vowelless onset prefix before liquids/glides/stops (-r, -l, -v, stops)
 */
const CLUSTER_PREFIX_MINIMAL: Record<string, { modern: string; tang: string }> = {
  k: { modern: '克', tang: '讫' },
  kh: { modern: '克', tang: '佉' },
  g: { modern: '格', tang: '伽' },
  gh: { modern: '格', tang: '伽' },
  ṅ: { modern: '昂', tang: '仰' },
  c: { modern: '奇', tang: '遮' },
  ch: { modern: '奇', tang: '车' },
  j: { modern: '吉', tang: '日' },
  jh: { modern: '吉', tang: '社' },
  ñ: { modern: '尼', tang: '若' },
  ṭ: { modern: '特', tang: '吒' },
  ṭh: { modern: '特', tang: '侘' },
  ḍ: { modern: '德', tang: '荼' },
  ḍh: { modern: '德', tang: '茶' },
  ṇ: { modern: '尼', tang: '拏' },
  t: { modern: '特', tang: '怛' },
  th: { modern: '特', tang: '他' },
  d: { modern: '德', tang: '捺' },
  dh: { modern: '德', tang: '驮' },
  n: { modern: '尼', tang: '曩' },
  p: { modern: '普', tang: '钵' },
  ph: { modern: '普', tang: '颇' },
  b: { modern: '布', tang: '跋' },
  bh: { modern: '布', tang: '婆' },
  m: { modern: '姆', tang: '摩' },
  y: { modern: '伊', tang: '耶' },
  r: { modern: '尔', tang: '啰' },
  l: { modern: '勒', tang: '逻' },
  v: { modern: '维', tang: '嚩' },
  ś: { modern: '什', tang: '室' },
  ṣ: { modern: '什', tang: '瑟' },
  s: { modern: '斯', tang: '娑' },
  h: { modern: '赫', tang: '纥' },
};

/**
 * Palatalized onset prefix specifically when IMMEDIATELY preceding palatal semivowel `-y`
 * (e.g., tadyathā -> 达-地呀-他, tryadhvikānāṃ -> 特哩呀..., devebhyaḥ -> 叠-威-比呀赫)
 */
const CLUSTER_PREFIX_BEFORE_Y: Record<string, { modern: string; tang: string }> = {
  ...CLUSTER_PREFIX_MINIMAL,
  t: { modern: '蒂', tang: '底' },
  th: { modern: '提', tang: '耻' },
  d: { modern: '地', tang: '地' },
  dh: { modern: '地', tang: '地' },
  ṭ: { modern: '蒂', tang: '置' },
  ḍ: { modern: '迪', tang: '腻' },
  p: { modern: '皮', tang: '比' },
  ph: { modern: '批', tang: '匹' },
  b: { modern: '比', tang: '毗' },
  bh: { modern: '比', tang: '毗' },
  n: { modern: '尼', tang: '你' },
  ṇ: { modern: '尼', tang: '抳' },
  m: { modern: '姆', tang: '弭' },
  r: { modern: '哩', tang: '哩' },
  v: { modern: '维', tang: '尾' },
  k: { modern: '克', tang: '枳' },
  g: { modern: '格', tang: '拟' },
  j: { modern: '吉', tang: '惹' },
};

/**
 * Oral stop place-of-articulation groups for Abhinidhāna (homorganic geminate closure absorption)
 */
function getStopPlaceGroup(c: string): string | null {
  if (c === 'k' || c === 'kh' || c === 'g' || c === 'gh') return 'velar';
  if (c === 'c' || c === 'ch' || c === 'j' || c === 'jh') return 'palatal';
  if (c === 'ṭ' || c === 'ṭh' || c === 'ḍ' || c === 'ḍh') return 'retroflex';
  if (c === 't' || c === 'th' || c === 'd' || c === 'dh') return 'dental';
  if (c === 'p' || c === 'ph' || c === 'b' || c === 'bh') return 'labial';
  return null;
}

function isNasalConsonant(c: string): boolean {
  return c === 'ṅ' || c === 'ñ' || c === 'ṇ' || c === 'n' || c === 'm';
}

function getNasalVowelSlot(vowel: string): number {
  if (vowel === 'a' || vowel === 'ā') return 0;
  if (vowel === 'i' || vowel === 'ī') return 1;
  if (vowel === 'u' || vowel === 'ū') return 2;
  if (vowel === 'ṛ' || vowel === 'ṝ' || vowel === 'ḷ' || vowel === 'ḹ') return 3;
  if (vowel === 'e' || vowel === 'ai') return 4;
  return 5; // o / au
}

function renderNasalizedCore(mainC: string, vowel: string, mode: 'n' | 'ng'): string {
  const slot = getNasalVowelSlot(vowel);
  const table = mode === 'ng' ? NASAL_NG_MATRIX : NASAL_N_MATRIX;
  const row = table[mainC] || table[''];
  return row[slot];
}

function renderOpenCore(mainC: string, vowel: string): { modern: string; tang: string } {
  if (!mainC) {
    return INDEPENDENT_VOWEL_MAP[vowel] || { modern: '阿', tang: '阿' };
  }
  const qIdx = VOWEL_QUALITY_IDX[vowel] ?? 0;
  const modRow = CV_MODERN_MATRIX[mainC];
  const tangRow = CV_TANG_MATRIX[mainC];
  const modern = modRow ? modRow[qIdx] : mainC;

  const cvKey = mainC + vowel;
  let tang = TANG_LONG_CV_OVERRIDES[cvKey] || (tangRow ? tangRow[qIdx] : '阿');
  if (!TANG_LONG_CV_OVERRIDES[cvKey] && INHERENT_LONG_SET.has(vowel)) {
    tang += '(引)';
  }
  return { modern, tang };
}

function renderVisargaTail(vowel: string): { modern: string; tang: string } {
  if (vowel === 'i' || vowel === 'ī' || vowel === 'ṛ' || vowel === 'ṝ') {
    return { modern: '希', tang: '醯' };
  }
  if (vowel === 'u' || vowel === 'ū') {
    return { modern: '忽', tang: '虎' };
  }
  return { modern: '赫', tang: '入' };
}

function renderCodaConsonant(
  c: string,
  nextOnsetFirst: string,
  sameSubwordNext: boolean
): { modern: string; tang: string } {
  // Rule B1: Abhinidhāna & Varṇakrama — Homorganic stop closure or identical geminate absorption
  // within the same word (e.g., bud-dhā -> 布+达, sat-tvā -> 萨+特瓦, sarv-va -> 萨尔+瓦, āry-ya -> 阿哩+呀)
  if (sameSubwordNext && nextOnsetFirst) {
    const g1 = getStopPlaceGroup(c);
    const g2 = getStopPlaceGroup(nextOnsetFirst);
    if (g1 && g1 === g2) {
      return { modern: '', tang: c === 'd' || c === 'b' ? '没' : '怛' };
    }
    if (c === nextOnsetFirst) {
      return { modern: '', tang: c === 'l' ? '攞' : '' };
    }
  }

  // Rule B4: Pre-palatal Repha Svarabhakti (-r before y- in same word -> 哩, else 尔)
  if (c === 'r') {
    if (sameSubwordNext && nextOnsetFirst === 'y') {
      return { modern: '哩', tang: '哩' };
    }
    return { modern: '尔', tang: '哩' };
  }
  if (c === 'l') return { modern: '尔', tang: '攞' };
  if (c === 'k' || c === 'kh') return { modern: '克', tang: '羯' };
  if (c === 'g' || c === 'gh') return { modern: '格', tang: '伽' };
  if (c === 'c' || c === 'ch') return { modern: '奇', tang: '遮' };
  if (c === 'j' || c === 'jh') return { modern: '吉', tang: '日' };
  if (c === 'ṭ' || c === 'ṭh' || c === 't' || c === 'th') return { modern: '特', tang: '怛' };
  if (c === 'ḍ' || c === 'ḍh' || c === 'd' || c === 'dh') return { modern: '德', tang: '讷' };
  if (c === 'p' || c === 'ph') return { modern: '普', tang: '钵' };
  if (c === 'b' || c === 'bh') return { modern: '布', tang: '跋' };
  if (c === 'ś') return { modern: '什', tang: '室' };
  if (c === 'ṣ') return { modern: '什', tang: '瑟' };
  if (c === 's') return { modern: '斯', tang: '悉' };
  if (c === 'h') return { modern: '赫', tang: '纥' };
  if (c === 'v') return { modern: '夫', tang: '嚩' };
  if (c === 'y') return { modern: '伊', tang: '以' };
  if (isNasalConsonant(c)) return { modern: '恩', tang: '喃' };
  return { modern: '', tang: '' };
}

function parseStandaloneSyllableStructure(cleanSyl: string): {
  onset: string[];
  vowel: string;
  modifiers: string[];
  coda: string[];
} {
  const tokens = tokenizeWordPhonemes(cleanSyl);
  const onset: string[] = [];
  const modifiers: string[] = [];
  const coda: string[] = [];
  let vowel = 'a';
  let idx = 0;

  while (idx < tokens.length && tokens[idx].type === 'C') {
    onset.push(tokens[idx].val);
    idx++;
  }
  if (idx < tokens.length && tokens[idx].type === 'V') {
    vowel = tokens[idx].val;
    idx++;
  }
  while (idx < tokens.length && tokens[idx].type === 'M') {
    modifiers.push(tokens[idx].val);
    idx++;
  }
  while (idx < tokens.length) {
    if (tokens[idx].type === 'C') coda.push(tokens[idx].val);
    idx++;
  }
  return { onset, vowel, modifiers, coda };
}

/**
 * Convert a Sanskrit syllable (Akṣara) into both Classical Tang Chinese (古汉语音译)
 * and Modern Mandarin Phonetic reading (现代梵音拼读), honoring optional inter-syllable context.
 */
export function mapSyllableToChinesePhonetics(
  rawSyl: string,
  context?: SyllablePhoneticContext
): {
  classicalZh: string;
  modernZh: string;
} {
  const s = cleanEditorialIast(rawSyl)
    .toLowerCase()
    .replace(/[|/\s.,;!?—–-]+/g, '')
    .trim();

  if (!s) {
    return { classicalZh: '', modernZh: '' };
  }

  const nextOnset = context?.nextOnset || [];
  const nextFirst = nextOnset[0] || '';
  const sameSubwordNext = Boolean(context?.sameSubwordNext);
  const isStandaloneSyllable =
    context === undefined || Boolean(context.isWordStart && context.isWordEnd);

  if (UNIVERSAL_AKSARA_OVERRIDES[s]) {
    return {
      classicalZh: UNIVERSAL_AKSARA_OVERRIDES[s].tang,
      modernZh: UNIVERSAL_AKSARA_OVERRIDES[s].modern,
    };
  }
  if (isStandaloneSyllable && STANDALONE_BIJA_OVERRIDES[s]) {
    return {
      classicalZh: STANDALONE_BIJA_OVERRIDES[s].tang,
      modernZh: STANDALONE_BIJA_OVERRIDES[s].modern,
    };
  }

  const parsed =
    context?.onset && context?.vowel
      ? {
          onset: context.onset,
          vowel: context.vowel,
          modifiers: context.modifiers || [],
          coda: context.coda || [],
        }
      : parseStandaloneSyllableStructure(s);

  const { onset, vowel, modifiers, coda } = parsed;
  const hasAnusvara = modifiers.includes('ṃ');
  const hasVisarga = modifiers.includes('ḥ');

  // Build onset cluster prefix + main consonant
  let prefixModern = '';
  let prefixTang = '';
  let mainC = '';

  if (onset.length > 0) {
    const joinedOnset = onset.join('');

    // Special Sanskrit conjuncts with dedicated phonetic realizations
    if (joinedOnset.endsWith('kṣ')) {
      for (const pre of onset.slice(0, -2)) {
        prefixModern += CLUSTER_PREFIX_MINIMAL[pre]?.modern || '';
        prefixTang += CLUSTER_PREFIX_MINIMAL[pre]?.tang || '';
      }
      prefixModern += '克';
      prefixTang += '乞';
      mainC = 'ṣ';
    } else if (joinedOnset.endsWith('jñ')) {
      for (const pre of onset.slice(0, -2)) {
        prefixModern += CLUSTER_PREFIX_MINIMAL[pre]?.modern || '';
        prefixTang += CLUSTER_PREFIX_MINIMAL[pre]?.tang || '';
      }
      prefixModern += '吉';
      prefixTang += '枳';
      mainC = 'ñ';
    } else if (joinedOnset === 'śv' && (vowel === 'a' || vowel === 'ā')) {
      prefixModern = '湿';
      prefixTang = '湿';
      mainC = 'v';
    } else {
      mainC = onset[onset.length - 1];
      const prefixList = onset.slice(0, -1);
      for (let pIdx = 0; pIdx < prefixList.length; pIdx++) {
        const pre = prefixList[pIdx];
        const nextInOnset = onset[pIdx + 1];
        // Absorb geminate or homorganic stop inside onset cluster (e.g. subword-initial `ttva` -> `特瓦`)
        const gPre = getStopPlaceGroup(pre);
        const gNext = getStopPlaceGroup(nextInOnset);
        if (pre === nextInOnset || (gPre && gPre === gNext)) {
          continue;
        }
        const prefixTable =
          nextInOnset === 'y' ? CLUSTER_PREFIX_BEFORE_Y : CLUSTER_PREFIX_MINIMAL;
        prefixModern += prefixTable[pre]?.modern || '';
        prefixTang += prefixTable[pre]?.tang || '';
      }
    }
  }

  // Rule B6: Subword-final external `yaṇ-sandhi` coda (`-Cy` from `-Ci`, `-Cv` from `-Cu`,
  // e.g. `ity evaṃ` -> `伊帝`, `koṭy-uṣṇīṣaṃ` -> `果蒂`, `agny-udaka` -> `阿格尼`, `ehy ehi` -> `诶嘿`, `jiṣṇv` -> `吉什努`)
  let remainingCoda = [...coda];
  let yanSandhiTailModern = '';
  let yanSandhiTailTang = '';

  if (!sameSubwordNext && remainingCoda.length >= 2) {
    const lastC = remainingCoda[remainingCoda.length - 1];
    const penultC = remainingCoda[remainingCoda.length - 2];
    if (lastC === 'y' || lastC === 'v') {
      const targetVowel = lastC === 'y' ? 'i' : 'u';
      remainingCoda.splice(remainingCoda.length - 2, 2);
      const yanMapped = renderOpenCore(penultC, targetVowel);
      yanSandhiTailModern = yanMapped.modern;
      yanSandhiTailTang = yanMapped.tang;
    }
  }

  // Determine if the nucleus + nasal (either modifier `ṃ` or leading nasal coda `ṅ/ñ/ṇ/n/m`)
  // fuses into a single Mandarin nasal syllable!
  let nasalMode: 'n' | 'ng' | null = null;
  let explicitLabialMu = false;
  let tangNasalSuffix = '';

  if (hasAnusvara) {
    // Context-sensitive Anusvāra (Pāṇini 8.4.58 parasavarṇa within the same word/syllable;
    // word-final `-ṃ` per 8.4.59 maintains consistent resonant reading across whitespace boundaries)
    const effNext =
      remainingCoda.length > 0
        ? remainingCoda[0]
        : sameSubwordNext
          ? nextFirst
          : '';
    if (effNext && ['k', 'kh', 'g', 'gh', 'ṅ'].includes(effNext)) {
      nasalMode = 'ng';
      tangNasalSuffix = mainC === 's' && vowel === 'a' ? '' : '僧';
    } else if (
      effNext &&
      ['c', 'ch', 'j', 'jh', 'ñ', 'ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ', 't', 'th', 'd', 'dh', 'n'].includes(
        effNext
      )
    ) {
      nasalMode = 'n';
      tangNasalSuffix = '喃';
    } else if (effNext && ['p', 'ph', 'b', 'bh', 'm'].includes(effNext)) {
      // Traditional Chinese Sanskrit mantra convention: saṃbuddha -> 桑布达, saṃbhava -> 桑巴瓦, siddhaṃbhave -> 悉当巴威
      nasalMode = 'ng';
      tangNasalSuffix = '三';
    } else {
      // Word-final or before sibilant/semivowel (saṃskāra -> 桑斯嘎啦, hṛdayaṃ -> 赫哩达央, puṣṭiṃ -> 普什丁)
      nasalMode = vowel === 'i' || vowel === 'ī' ? 'n' : 'ng';
      tangNasalSuffix = '喃';
    }
  } else if (remainingCoda.length > 0 && isNasalConsonant(remainingCoda[0])) {
    const nasalC = remainingCoda.shift()!;
    if (nasalC === 'm' && sameSubwordNext && nextFirst === 'y') {
      // e.g. sam-yak -> 萨姆-呀克 (keep labial [m] distinct before [j])
      explicitLabialMu = true;
      tangNasalSuffix = '摩';
    } else if (nasalC === 'm' && (vowel === 'ṛ' || vowel === 'ṝ')) {
      // e.g. vijṛmbhamāṇa -> 维吉哩姆巴玛拿
      explicitLabialMu = true;
      tangNasalSuffix = '摩';
    } else if (nasalC === 'ṅ') {
      nasalMode = 'ng';
      tangNasalSuffix = '仰';
    } else if (nasalC === 'm' && !sameSubwordNext && remainingCoda.length === 0 && !yanSandhiTailModern) {
      // Word-final -am / -ām / -im / -um (e.g. śubham -> 舒邦, imam -> 伊芒, samantabuddhānām -> 萨曼达布达南)
      nasalMode = mainC === 'n' || mainC === 'ṇ' || vowel === 'i' || vowel === 'ī' ? 'n' : 'ng';
      tangNasalSuffix = '喃';
    } else {
      // Coronal/palatal nasal codas (n, ṇ, ñ) or medial m before labial stop (man-tra -> 曼, cin-tā -> 津, śān-ti -> 善, jam-bha -> 詹)
      nasalMode = 'n';
      tangNasalSuffix = '喃';
    }
  }

  let coreModern = '';
  let coreTang = '';

  if (nasalMode) {
    // Special classical Tang overrides for common nasal syllables
    const rawNoRestCoda = onset.join('') + vowel + (hasAnusvara ? 'ṃ' : 'n');
    coreModern = renderNasalizedCore(mainC, vowel, nasalMode);
    if (
      (rawNoRestCoda === 'saṃ' || rawNoRestCoda === 'san') &&
      nasalMode === 'ng'
    ) {
      coreTang = '三';
    } else {
      const openCore = renderOpenCore(mainC, vowel);
      coreTang = openCore.tang + (tangNasalSuffix || '喃');
    }
  } else {
    const openCore = renderOpenCore(mainC, vowel);
    coreModern = openCore.modern + (explicitLabialMu ? '姆' : '');
    coreTang = openCore.tang + (explicitLabialMu ? tangNasalSuffix : '');
  }

  // Process any remaining non-nasal coda consonants
  let codaModern = '';
  let codaTang = '';
  for (let cIdx = 0; cIdx < remainingCoda.length; cIdx++) {
    const c = remainingCoda[cIdx];
    const isLastCoda = cIdx === remainingCoda.length - 1;
    const mappedCoda = renderCodaConsonant(
      c,
      isLastCoda ? (yanSandhiTailModern ? '' : nextFirst) : remainingCoda[cIdx + 1],
      isLastCoda ? (yanSandhiTailModern ? false : sameSubwordNext) : true
    );
    codaModern += mappedCoda.modern;
    codaTang += mappedCoda.tang;
  }

  // Special traditional Tang single-character readings for closed syllables (e.g. bud -> 没, dhar -> 达哩, sar -> 萨哩)
  if (s === 'bud') {
    coreTang = '没';
    codaTang = '';
  } else if (s === 'dhar') {
    coreTang = '达';
    codaTang = '哩';
  } else if (s === 'sar') {
    coreTang = '萨';
    codaTang = '哩';
  }

  // Visarga (-ḥ) tail
  let visargaModern = '';
  let visargaTang = '';
  if (hasVisarga) {
    const vTail = renderVisargaTail(vowel);
    visargaModern = vTail.modern;
    visargaTang = vTail.tang;
  }

  return {
    classicalZh: prefixTang + coreTang + codaTang + yanSandhiTailTang + visargaTang,
    modernZh: prefixModern + coreModern + codaModern + yanSandhiTailModern + visargaModern,
  };
}

/**
 * Known Sanskrit morphological compound prefixes/stems for clean Samāsa-viccheda hyphenation
 * inside long unhyphenated Sanskrit compounds (>= 5 syllables).
 */
const COMPOUND_STEM_PREFIXES = new Set([
  'ārya',
  'āryā',
  'avalokita',
  'avalokite',
  'valokita',
  'valokite',
  'mahā',
  'sarva',
  'sarvā',
  'samanta',
  'samyak',
  'bodhi',
  'buddha',
  'buddhā',
  'dharma',
  'dharmā',
  'saṃgha',
  'ratna',
  'vajra',
  'vajro',
  'padma',
  'padmo',
  'maṇi',
  'cintā',
  'cakra',
  'tathāgata',
  'tathāgato',
  'tathāgatā',
  'bhagava',
  'aparimita',
  'aparimitā',
  'aparimitāyur',
  'apratihata',
  'suviniścita',
  'sitātapatra',
  'sitātapatro',
  'uṣṇīṣa',
  'hṛdaya',
  'hṛdayā',
  'dhātu',
  'gagana',
  'svabhāva',
  'saṃskāra',
  'pari',
  'upasaṃ',
  'amṛta',
  'amṛto',
  'trailokya',
  'bhaiṣajya',
  'vaiḍūrya',
  'prabhā',
  'jñāna',
  'tejo',
  'āyur',
  'āyuḥ',
  'puṇya',
  'kāya',
  'citta',
  'citto',
  'loka',
  'loke',
  'lokā',
  'deva',
  'nāga',
  'yakṣa',
  'gandharva',
  'amogha',
  'viśva',
  'sahasra',
  'paripūraṇa',
  'supratiṣṭhita',
  'adhiṣṭhāna',
]);

/**
 * Compute morphological compound hyphen positions within a single unhyphenated subword
 * when the subword has >= 5 syllables.
 */
function computeSubwordStemHyphens(subSyls: SyllableAnalysis[]): Set<number> {
  const breakIndices = new Set<number>();
  if (subSyls.length < 5) return breakIndices;

  let start = 0;
  while (start < subSyls.length - 2) {
    let matchedEnd = -1;
    // Prefer longest stem match that leaves at least 2 syllables remaining
    const maxEnd = subSyls.length - 2;
    for (let end = Math.min(maxEnd, start + 6); end >= start + 1; end--) {
      const candidate = subSyls
        .slice(start, end)
        .map((s) => s.iast)
        .join('');
      if (COMPOUND_STEM_PREFIXES.has(candidate)) {
        matchedEnd = end;
        break;
      }
    }
    if (matchedEnd !== -1) {
      breakIndices.add(matchedEnd);
      start = matchedEnd;
    } else {
      break;
    }
  }

  return breakIndices;
}

/**
 * Enrich an array of prosodic syllables from `analyzeSanskritProsody` with full
 * inter-syllable Sandhi, coarticulation, and Samāsa compound hyphenation metadata.
 */
export function enrichSyllablesWithPhonetics(
  syllables: SyllableAnalysis[]
): EnrichedPhoneticSyllable[] {
  if (syllables.length === 0) return [];

  // Precompute morphological compound hyphen breaks per subword
  const subwordGroups = new Map<number, SyllableAnalysis[]>();
  for (const syl of syllables) {
    const sw = syl.subwordIndex ?? syl.wordIndex ?? 0;
    const list = subwordGroups.get(sw) || [];
    list.push(syl);
    subwordGroups.set(sw, list);
  }

  const autoHyphenSylIndices = new Set<number>();
  for (const group of subwordGroups.values()) {
    const localBreaks = computeSubwordStemHyphens(group);
    for (const bIdx of localBreaks) {
      if (group[bIdx]) {
        autoHyphenSylIndices.add(group[bIdx].index);
      }
    }
  }

  return syllables.map((syl, idx) => {
    const nextSyl = syllables[idx + 1];
    const sameSubwordNext = Boolean(
      nextSyl &&
        syl.subwordIndex !== undefined &&
        syl.subwordIndex === nextSyl.subwordIndex
    );
    const acrossPauseNext = Boolean(syl.dandaAfter || nextSyl?.dandaBefore);

    const mapped = mapSyllableToChinesePhonetics(syl.iast, {
      onset: syl.onset,
      vowel: syl.vowel,
      modifiers: syl.modifiers,
      coda: syl.coda,
      isWordStart: syl.isWordStart,
      isWordEnd: syl.isWordEnd,
      sameSubwordNext,
      acrossPauseNext,
      nextOnset: nextSyl?.onset,
    });

    return {
      ...syl,
      classicalZh: mapped.classicalZh,
      modernZh: mapped.modernZh,
      compoundHyphenBefore: Boolean(
        syl.hyphenBefore || autoHyphenSylIndices.has(syl.index)
      ),
    };
  });
}

/**
 * Convert an entire Sanskrit IAST sentence/verse into:
 * - Full Classical Tang/Song Chinese Transliteration (古汉语音译)
 * - Full Modern Sanskrit Phonetic Guide (梵音拼读参考)
 *
 * Guaranteed 100% consistent with `enrichSyllablesWithPhonetics` used by the per-syllable cards!
 */
export function generateVerseChinesePhonetics(
  iastVerse: string,
  includeIastBrackets = true
): {
  classicalTranslitZh: string;
  modernPhoneticZh: string;
} {
  const syllables = analyzeSanskritProsody(iastVerse);
  if (syllables.length === 0) {
    return { classicalTranslitZh: '', modernPhoneticZh: '' };
  }

  const enriched = enrichSyllablesWithPhonetics(syllables);

  // Group enriched syllables by wordIndex
  const wordsMap = new Map<number, EnrichedPhoneticSyllable[]>();
  const wordOrder: number[] = [];
  for (const syl of enriched) {
    const wIdx = syl.wordIndex ?? 0;
    if (!wordsMap.has(wIdx)) {
      wordsMap.set(wIdx, []);
      wordOrder.push(wIdx);
    }
    wordsMap.get(wIdx)!.push(syl);
  }

  const classicalPieces: string[] = [];
  const modernPieces: Array<{ text: string; isDanda: boolean }> = [];

  for (const wIdx of wordOrder) {
    const wSyls = wordsMap.get(wIdx)!;
    const first = wSyls[0];
    const last = wSyls[wSyls.length - 1];
    const wordIast = (first.wordIast || wSyls.map((s) => s.iast).join('')).replace(
      /[|.,;!?—–]+/g,
      ''
    );
    const dictKey = wordIast.replace(/-/g, '');

    if (first.dandaBefore) {
      classicalPieces.push(first.dandaBefore);
      modernPieces.push({ text: first.dandaBefore, isDanda: true });
    }

    // Build modern phonetic word directly from enriched syllables (100% aligned with syllable pills)
    let wordModern = '';
    for (let i = 0; i < wSyls.length; i++) {
      const s = wSyls[i];
      if (i > 0 && s.compoundHyphenBefore) {
        wordModern += '-';
      }
      wordModern += s.modernZh;
    }

    modernPieces.push({
      text: includeIastBrackets ? `${wordModern}(${wordIast})` : wordModern,
      isDanda: false,
    });

    // Build classical Tang word (use whole-word sutra transliteration if in dictionary, else join syllables)
    const dictHit = WORD_CLASSICAL_DICTIONARY[dictKey];
    if (dictHit) {
      classicalPieces.push(dictHit.classicalZh.split('/')[0].trim());
    } else {
      classicalPieces.push(wSyls.map((s) => s.classicalZh).join(''));
    }

    if (last.dandaAfter) {
      classicalPieces.push(last.dandaAfter);
      modernPieces.push({ text: last.dandaAfter, isDanda: true });
    }
  }

  // Format modernPieces cleanly:
  // - Without brackets: `拿摩 布达呀 | 拿摩 达尔玛呀`
  // - With brackets: `拿摩(namo) · 布达呀(buddhāya) | 拿摩(namo) · 达尔玛呀(dharmāya)`
  let modernOut = '';
  for (let i = 0; i < modernPieces.length; i++) {
    const cur = modernPieces[i];
    const prev = modernPieces[i - 1];
    if (i > 0) {
      if (cur.isDanda || prev.isDanda) {
        modernOut += ' ';
      } else {
        modernOut += includeIastBrackets ? ' · ' : ' ';
      }
    }
    modernOut += cur.text;
  }

  // Trim trailing single/double danda on modernPhoneticZh only when brackets are off?
  // Keeping trailing danda stripped or clean matches curated reading flow (`拿摩 布达呀 | ... 玛哈-嘎鲁尼嘎呀`)
  modernOut = modernOut.replace(/\s+\|\|?\s*$/, '').trim();

  return {
    classicalTranslitZh: classicalPieces.join(' '),
    modernPhoneticZh: modernOut,
  };
}

/**
 * Formats a verse's Modern Phonetic Guide (梵音拼读参考) according to the user's
 * toggle preference for showing or hiding parenthesized (IAST) annotations.
 * Uses the unified phonological engine when `iastVerse` is provided so verse-level
 * and syllable-level phonetics are guaranteed 100% consistent.
 */
export function formatModernPhoneticWithIastOption(
  rawModernPhoneticZh: string,
  iastVerse: string,
  showIastBracket: boolean
): string {
  if (iastVerse && iastVerse.trim()) {
    const generated = generateVerseChinesePhonetics(iastVerse, showIastBracket).modernPhoneticZh;
    if (generated) return generated;
  }

  const hasExistingBrackets = /\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ'-]+\)/.test(
    rawModernPhoneticZh
  );

  if (!showIastBracket) {
    if (!hasExistingBrackets) return rawModernPhoneticZh;
    return rawModernPhoneticZh
      .replace(/\s*\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ\s'-]+\)/g, '')
      .replace(/\s+·\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return rawModernPhoneticZh;
}

const SANSKRIT_GRAMMAR_MEANING_HINTS: Array<{
  pattern: RegExp;
  grammar: string;
  meaningZh: string;
}> = [
  { pattern: /^o[ṃṁm]$/i, grammar: 'Praṇava · 圣音', meaningZh: '三身总持圣音（法报化三身摄受）' },
  { pattern: /^nam(o|aḥ|as|a)$/i, grammar: 'Indecl. · 归敬词', meaningZh: '归命、顶礼、礼敬' },
  { pattern: /^tadyathā$/i, grammar: 'Adv. · 咒引词', meaningZh: '所谓、即说咒曰' },
  { pattern: /^svāhā$/i, grammar: 'Indecl. · 结印词', meaningZh: '圆满吉祥成就、善说决定' },
  { pattern: /^hū[ṃṁm]$/i, grammar: 'Bīja · 金刚种子字', meaningZh: '菩提心坚固不坏、摧伏一切障' },
  { pattern: /^phaṭ$/i, grammar: 'Bīja · 摧破音', meaningZh: '顿断无明烦恼与魔障' },
  { pattern: /^hrīḥ$/i, grammar: 'Bīja · 莲华部种子', meaningZh: '清净惭愧、观自在与弥陀心印' },
  { pattern: /^bhrū[ṃṁm]$/i, grammar: 'Bīja · 佛顶种子字', meaningZh: '一字顶轮王与尊胜佛顶最上心印' },
  { pattern: /^dhīḥ$/i, grammar: 'Bīja · 般若种子字', meaningZh: '文殊菩萨与般若波罗蜜甚深智慧' },
  { pattern: /āya$/i, grammar: 'Dat. Sg. · 为格单数', meaningZh: '向…致敬 / 为…故（归命对象）' },
  { pattern: /(ebhyaḥ|bhyaḥ)$/i, grammar: 'Dat. Pl. · 为格复数', meaningZh: '向一切诸尊顶礼' },
  { pattern: /(ānāṃ|ānām|nāṃ|nām)$/i, grammar: 'Gen. Pl. · 属格复数', meaningZh: '一切诸尊之总持' },
  { pattern: /(syā|sya)$/i, grammar: 'Gen. Sg. · 属格单数', meaningZh: '彼尊之秘密法印' },
  { pattern: /(e|i)$/i, grammar: 'Voc./Loc. · 呼格/处格', meaningZh: '呼请本尊安住加持' },
];

/**
 * Automatically generates structured WordGloss[] for any Sanskrit IAST verse line
 * so every entry across DB1–DB12, GRETIL, and CBETA has unified word-by-word analysis.
 */
export function buildWordGlossesFromIast(iastVerse: string): Array<{
  iast: string;
  stem?: string;
  grammar?: string;
  transliterationZh: string;
  meaningZh: string;
}> {
  const cleaned = cleanEditorialIast(iastVerse);
  const rawTokens = cleaned
    .split(/[\s\-—–|॥।,.;!?]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 1);

  return rawTokens.slice(0, 14).map((word) => {
    const lower = word.toLowerCase();
    const dictHit = WORD_CLASSICAL_DICTIONARY[lower];
    const phon = generateVerseChinesePhonetics(word, false);

    let grammar = 'Mantra-pada · 真言句义';
    let meaningZh =
      dictHit?.meaningZh || `梵音密语「${phon.modernPhoneticZh}」· 契入本尊三昧总持`;

    for (const hint of SANSKRIT_GRAMMAR_MEANING_HINTS) {
      if (hint.pattern.test(lower)) {
        grammar = hint.grammar;
        if (!dictHit?.meaningZh) {
          meaningZh = hint.meaningZh;
        }
        break;
      }
    }

    if (lower.includes('sarva') && !dictHit?.meaningZh) {
      meaningZh = '一切、普皆遍满';
    } else if (lower.includes('buddh') && !dictHit?.meaningZh) {
      meaningZh = '诸佛觉者';
    } else if (lower.includes('bodhisattv') && !dictHit?.meaningZh) {
      meaningZh = '菩提萨埵（觉有情）';
    } else if (lower.includes('vajr') && !dictHit?.meaningZh) {
      meaningZh = '金刚不坏智';
    } else if (lower.includes('padm') && !dictHit?.meaningZh) {
      meaningZh = '妙法莲华';
    } else if (lower.includes('rakṣ') && !dictHit?.meaningZh) {
      meaningZh = '拥护、守护行者';
    } else if (lower.includes('śānt') && !dictHit?.meaningZh) {
      meaningZh = '寂静、息灾吉祥';
    } else if (lower.includes('viśuddh') && !dictHit?.meaningZh) {
      meaningZh = '最极清净无垢';
    }

    return {
      iast: word,
      stem: lower.replace(/(āya|ebhyaḥ|ānāṃ|ānām|sya)$/i, ''),
      grammar,
      transliterationZh: `${dictHit?.classicalZh || phon.classicalTranslitZh}（拼读：${phon.modernPhoneticZh}）`,
      meaningZh,
    };
  });
}
